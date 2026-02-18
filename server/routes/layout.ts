// GET /api/layout/:topic — return stored layout from MongoDB or 404

import type { Request, Response } from 'express'
import { getDb } from '../lib/db.js'

/** Sanitise a topic string into a safe key (same logic as store.ts) */
function toTopicKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export async function layoutRoute(req: Request, res: Response) {
  const topic = req.params.topic
  if (!topic) {
    res.status(400).json({ error: 'Missing topic parameter' })
    return
  }

  const db = await getDb()
  if (!db) {
    res.status(503).json({ error: 'Database not available' })
    return
  }

  const rawTopic = Array.isArray(topic) ? topic[0] : topic
  const key = toTopicKey(decodeURIComponent(rawTopic))
  try {
    const doc = await db.collection('layouts').findOne({ _id: key as unknown as import('mongodb').ObjectId })
    if (!doc) {
      res.status(404).json({ error: 'Layout not found' })
      return
    }

    // Remove MongoDB internal fields before returning
    const { _id, topic_key, stored_at, ...layout } = doc
    res.json(layout)
  } catch (err) {
    console.error('[Layout] DB query failed:', err)
    res.status(500).json({ error: 'Database query failed' })
  }
}
