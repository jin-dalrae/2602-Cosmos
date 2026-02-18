// GET /api/posts/:topic — return all user-created posts for a topic

import type { Request, Response } from 'express'
import { getDb } from '../lib/db.js'

function toTopicKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export async function userPostsListRoute(req: Request, res: Response) {
  const topic = req.params.topic
  if (!topic) {
    res.status(400).json({ error: 'Missing topic' })
    return
  }

  const db = await getDb()
  if (!db) {
    res.json({ posts: [] })
    return
  }

  const key = toTopicKey(decodeURIComponent(Array.isArray(topic) ? topic[0] : topic))

  try {
    const posts = await db
      .collection('posts')
      .find({ topic_key: key, isUserPost: true })
      .toArray()

    // Strip MongoDB _id field
    const cleaned = posts.map(({ _id, topic_key, stored_at, ...post }) => post)
    res.json({ posts: cleaned })
  } catch (err) {
    console.error('[UserPosts] Failed to fetch:', err)
    res.json({ posts: [] })
  }
}
