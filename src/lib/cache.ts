// A8: Firestore cache — gracefully handles missing Firebase credentials

import type { CosmosLayout } from './types.js'

// We use `any` for the Firestore type since firebase-admin is dynamically imported
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null
let initAttempted = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb(): Promise<any> {
  if (initAttempted) return db
  initAttempted = true

  try {
    // Dynamic import so we don't crash at module load time
    const admin = await import('firebase-admin')

    // Check if already initialized
    if (admin.default.apps.length === 0) {
      // Try to initialize — will use GOOGLE_APPLICATION_CREDENTIALS env var
      // or application default credentials
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        admin.default.initializeApp({
          credential: admin.default.credential.cert(serviceAccount),
        })
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.default.initializeApp({
          credential: admin.default.credential.applicationDefault(),
        })
      } else {
        console.warn('[Cache] No Firebase credentials found — caching disabled')
        return null
      }
    }

    db = admin.default.firestore()
    console.log('[Cache] Firestore initialized')
    return db
  } catch (err) {
    console.warn('[Cache] Failed to initialize Firestore — caching disabled:', err)
    return null
  }
}

const COLLECTION = 'discussions'

/**
 * Create a simple hash of the URL for use as document ID.
 */
function hashUrl(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32-bit integer
  }
  return 'cosmos_' + Math.abs(hash).toString(36)
}

/**
 * Lookup a cached CosmosLayout by Reddit URL.
 */
export async function getCached(redditUrl: string): Promise<CosmosLayout | null> {
  const firestore = await getDb()
  if (!firestore) return null

  try {
    const docId = hashUrl(redditUrl)
    const doc = await firestore.collection(COLLECTION).doc(docId).get()

    if (!doc.exists) return null

    const data = doc.data()
    if (!data?.fullLayout) return null

    console.log(`[Cache] Hit for ${redditUrl}`)
    return JSON.parse(data.fullLayout) as CosmosLayout
  } catch (err) {
    console.warn('[Cache] Error reading cache:', err)
    return null
  }
}

/**
 * Store a CosmosLayout in Firestore cache.
 */
export async function setCached(
  redditUrl: string,
  layout: CosmosLayout
): Promise<void> {
  const firestore = await getDb()
  if (!firestore) return

  try {
    const docId = hashUrl(redditUrl)
    await firestore.collection(COLLECTION).doc(docId).set({
      redditUrl,
      topic: layout.topic,
      fullLayout: JSON.stringify(layout),
      postCount: layout.posts.length,
      processingTimeMs: layout.metadata.processing_time_ms,
      createdAt: new Date().toISOString(),
    })
    console.log(`[Cache] Stored layout for ${redditUrl}`)
  } catch (err) {
    console.warn('[Cache] Error writing cache:', err)
  }
}
