// Storage helpers for layouts and posts in MongoDB (Firestore)

import { getDb } from './db.js'
import type { CosmosLayout, CosmosPost } from '../../src/lib/types.js'

/** Sanitise a topic string into a safe key */
function toTopicKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Upsert full CosmosLayout into the layouts collection */
export async function storeLayout(input: string, layout: CosmosLayout): Promise<void> {
  const db = await getDb()
  if (!db) return

  const key = toTopicKey(input)
  try {
    await db.collection('layouts').updateOne(
      { _id: key as unknown as import('mongodb').ObjectId },
      { $set: { ...layout, _id: key, topic_key: key, stored_at: new Date() } },
      { upsert: true }
    )
    console.log(`[Store] Layout stored: ${key}`)
  } catch (err) {
    console.error('[Store] Failed to store layout:', err)
  }
}

/** BulkWrite individual posts into the posts collection */
export async function storePosts(input: string, posts: CosmosPost[]): Promise<void> {
  const db = await getDb()
  if (!db) return

  const key = toTopicKey(input)
  try {
    const ops = posts.map((post) => ({
      updateOne: {
        filter: { _id: `${key}:${post.id}` as unknown as import('mongodb').ObjectId },
        update: {
          $set: {
            _id: `${key}:${post.id}`,
            topic_key: key,
            content: post.content,
            author: post.author,
            stance: post.stance,
            themes: post.themes,
            emotion: post.emotion,
            post_type: post.post_type,
            importance: post.importance,
            core_claim: post.core_claim,
            embedding_hint: post.embedding_hint,
            position: post.position,
            relationships: post.relationships,
            stored_at: new Date(),
          },
        },
        upsert: true,
      },
    }))

    await db.collection('posts').bulkWrite(ops)
    console.log(`[Store] ${posts.length} posts stored for: ${key}`)
  } catch (err) {
    console.error('[Store] Failed to store posts:', err)
  }
}

/** Store layout and posts in parallel */
export async function storeLayoutAndPosts(input: string, layout: CosmosLayout): Promise<void> {
  await Promise.all([
    storeLayout(input, layout),
    storePosts(input, layout.posts),
  ])
}
