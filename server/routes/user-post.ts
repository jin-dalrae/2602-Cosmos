// POST /api/posts — persist a user-created post to MongoDB

import type { Request, Response } from 'express'
import { getDb } from '../lib/db.js'
import type { CosmosPost } from '../../src/lib/types.js'

/** Sanitise a topic string into a safe key (same logic as store.ts) */
function toTopicKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export async function userPostRoute(req: Request, res: Response) {
  const { post, topic } = req.body as {
    post?: CosmosPost
    topic?: string
  }

  if (!post || !topic) {
    res.status(400).json({ error: 'Missing post or topic' })
    return
  }

  const db = await getDb()
  if (!db) {
    // No DB available — accept the post silently (it's already in client state)
    res.json({ stored: false, reason: 'no_db' })
    return
  }

  const key = toTopicKey(topic)

  try {
    // Store the individual post
    await db.collection('posts').updateOne(
      { _id: `${key}:${post.id}` as unknown as import('mongodb').ObjectId },
      {
        $set: {
          _id: `${key}:${post.id}`,
          topic_key: key,
          content: post.content,
          author: post.author,
          stance: post.stance ?? '',
          themes: post.themes ?? [],
          emotion: post.emotion ?? 'neutral',
          post_type: post.post_type ?? 'anecdote',
          importance: post.importance ?? 0.5,
          core_claim: post.core_claim,
          embedding_hint: post.embedding_hint,
          position: post.position,
          relationships: post.relationships ?? [],
          parent_id: post.parent_id ?? null,
          depth: post.depth ?? 0,
          upvotes: post.upvotes ?? 1,
          isUserPost: true,
          created_at: post.created_at ?? new Date().toISOString(),
          stored_at: new Date(),
        },
      },
      { upsert: true }
    )

    // Also append to the layout document's posts array
    await db.collection('layouts').updateOne(
      { _id: key as unknown as import('mongodb').ObjectId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $push: { posts: post } } as any
    )

    console.log(`[UserPost] Stored post ${post.id} for topic ${key}`)
    res.json({ stored: true, id: post.id })
  } catch (err) {
    console.error('[UserPost] Failed to store:', err)
    res.status(500).json({ error: 'Failed to store post' })
  }
}
