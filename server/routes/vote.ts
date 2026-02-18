// POST /api/vote — persist a vote to MongoDB

import type { Request, Response } from 'express'
import { getDb } from '../lib/db.js'

function toTopicKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export async function voteRoute(req: Request, res: Response) {
  const { postId, direction, topic } = req.body as {
    postId?: string
    direction?: 'up' | 'down' | null // null = undo vote
    topic?: string
  }

  if (!postId || !topic) {
    res.status(400).json({ error: 'Missing postId or topic' })
    return
  }

  const db = await getDb()
  if (!db) {
    res.json({ stored: false, reason: 'no_db' })
    return
  }

  const key = toTopicKey(topic)
  const delta = direction === 'up' ? 1 : direction === 'down' ? -1 : 0

  try {
    // Update the vote count on the post document
    if (delta !== 0) {
      await db.collection('posts').updateOne(
        { _id: `${key}:${postId}` as unknown as import('mongodb').ObjectId },
        { $inc: { upvotes: delta } }
      )
    }

    // Also update the post inside the layout's posts array
    if (delta !== 0) {
      await db.collection('layouts').updateOne(
        { _id: key as unknown as import('mongodb').ObjectId, 'posts.id': postId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { $inc: { 'posts.$.upvotes': delta } } as any
      )
    }

    res.json({ stored: true, postId, delta })
  } catch (err) {
    console.error('[Vote] Failed to store:', err)
    res.status(500).json({ error: 'Failed to store vote' })
  }
}
