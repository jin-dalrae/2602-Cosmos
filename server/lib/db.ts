// MongoDB (Firestore) connection singleton

import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/** Lazy-connect on first use; returns null if MONGODB_URI is not set */
export async function getDb(): Promise<Db | null> {
  if (db) return db

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[DB] MONGODB_URI not set — skipping MongoDB')
    return null
  }

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 8000,
    })
    await client.connect()
    db = client.db('cosmos')
    console.log('[DB] Connected to MongoDB (Firestore)')
    return db
  } catch (err) {
    console.error('[DB] Failed to connect:', err)
    return null
  }
}

/** Close the connection (call on SIGTERM/SIGINT) */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('[DB] Connection closed')
  }
}
