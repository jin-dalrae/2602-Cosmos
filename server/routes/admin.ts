// Admin API routes for managing layouts, cache, and monitoring

import { Router } from 'express'
import type { Request, Response } from 'express'
import { getDb } from '../lib/db.js'
import { readdir, unlink } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { processDiscussion } from '../../src/lib/orchestrator.js'
import { storeLayoutAndPosts } from '../lib/store.js'
import type { CosmosLayout, ProgressEvent } from '../../src/lib/types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(__dirname, '..', '.cache')
const startTime = Date.now()

const router = Router()

// ─── GET /layouts — list all stored layouts ───
router.get('/layouts', async (_req: Request, res: Response) => {
  try {
    const db = await getDb()
    if (!db) {
      res.json({ layouts: [], source: 'none' })
      return
    }

    const docs = await db.collection('layouts').find(
      {},
      { projection: { topic: 1, topic_key: 1, stored_at: 1, 'metadata.total_posts': 1, clusters: 1 } }
    ).toArray()

    const layouts = docs.map((doc) => ({
      topicKey: doc.topic_key || doc._id,
      topic: doc.topic || doc.topic_key || doc._id,
      postCount: doc.metadata?.total_posts ?? 0,
      clusterCount: Array.isArray(doc.clusters) ? doc.clusters.length : 0,
      storedAt: doc.stored_at,
    }))

    res.json({ layouts })
  } catch (err) {
    console.error('[Admin] Failed to list layouts:', err)
    res.status(500).json({ error: 'Failed to list layouts' })
  }
})

// ─── DELETE /layouts/:topicKey — delete layout + posts ───
router.delete('/layouts/:topicKey', async (req: Request, res: Response) => {
  const rawKey = req.params.topicKey
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey
  try {
    const db = await getDb()

    // Delete from MongoDB
    if (db) {
      await Promise.all([
        db.collection('layouts').deleteOne({ _id: key as unknown as import('mongodb').ObjectId }),
        db.collection('posts').deleteMany({ topic_key: key }),
      ])
    }

    // Delete local cache file
    try {
      await unlink(join(CACHE_DIR, `${key}.json`))
    } catch {
      // file may not exist
    }

    res.json({ deleted: key })
  } catch (err) {
    console.error('[Admin] Failed to delete layout:', err)
    res.status(500).json({ error: 'Failed to delete layout' })
  }
})

// ─── POST /regenerate/:topicKey — delete then re-run pipeline via SSE ───
router.post('/regenerate/:topicKey', async (req: Request, res: Response) => {
  const rawKey = req.params.topicKey
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey

  // First delete existing data
  try {
    const db = await getDb()
    if (db) {
      await Promise.all([
        db.collection('layouts').deleteOne({ _id: key as unknown as import('mongodb').ObjectId }),
        db.collection('posts').deleteMany({ topic_key: key }),
      ])
    }
    try { await unlink(join(CACHE_DIR, `${key}.json`)) } catch { /* ok */ }
  } catch {
    // continue with regeneration even if delete fails
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const topic = key.replace(/-/g, ' ')

    const onProgress = (event: ProgressEvent) => {
      sendEvent({ stage: event.stage, percent: event.percent, detail: event.detail })
    }

    const layout = await processDiscussion(topic, onProgress)

    // Store result
    storeLayoutAndPosts(topic, layout as CosmosLayout).catch((err) =>
      console.warn('[Admin] DB store failed after regen:', err)
    )

    sendEvent({ stage: 'Regeneration complete', percent: 100, layout })
    res.end()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    sendEvent({ stage: 'Error', percent: 0, error: message })
    res.end()
  }
})

// ─── POST /cache/clear — clear file cache and/or MongoDB ───
router.post('/cache/clear', async (req: Request, res: Response) => {
  const targets: string[] = req.body?.targets || ['file', 'mongo']
  const results: Record<string, string> = {}

  // Clear file cache
  if (targets.includes('file')) {
    try {
      const files = await readdir(CACHE_DIR)
      let deleted = 0
      for (const f of files) {
        if (f.endsWith('.json')) {
          await unlink(join(CACHE_DIR, f))
          deleted++
        }
      }
      results.file = `Deleted ${deleted} cached files`
    } catch {
      results.file = 'No cache directory or already empty'
    }
  }

  // Clear MongoDB
  if (targets.includes('mongo')) {
    try {
      const db = await getDb()
      if (db) {
        const [lr, pr] = await Promise.all([
          db.collection('layouts').deleteMany({}),
          db.collection('posts').deleteMany({}),
        ])
        results.mongo = `Deleted ${lr.deletedCount} layouts, ${pr.deletedCount} posts`
      } else {
        results.mongo = 'MongoDB not connected'
      }
    } catch (err) {
      results.mongo = `Error: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  res.json({ results })
})

// ─── GET /health — server health check ───
router.get('/health', async (_req: Request, res: Response) => {
  const health: Record<string, unknown> = {
    server: {
      status: 'ok',
      uptime: Math.round((Date.now() - startTime) / 1000),
    },
    mongo: { status: 'unknown' },
    anthropic: { status: 'unknown' },
    cache: { status: 'unknown' },
  }

  // MongoDB ping
  try {
    const db = await getDb()
    if (db) {
      await db.command({ ping: 1 })
      health.mongo = { status: 'connected' }
    } else {
      health.mongo = { status: 'not configured' }
    }
  } catch {
    health.mongo = { status: 'error' }
  }

  // Anthropic key format check
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    health.anthropic = {
      status: 'configured',
      format: apiKey.startsWith('sk-ant-') ? 'valid prefix' : 'unexpected prefix',
    }
  } else {
    health.anthropic = { status: 'not configured' }
  }

  // Cache stats
  try {
    const files = await readdir(CACHE_DIR)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))
    health.cache = { status: 'ok', fileCount: jsonFiles.length }
  } catch {
    health.cache = { status: 'empty or missing', fileCount: 0 }
  }

  res.json(health)
})

// ─── GET /stats — aggregate statistics ───
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getDb()
    if (!db) {
      res.json({ totalLayouts: 0, totalPosts: 0, avgProcessingTime: 0, topics: [] })
      return
    }

    const [layoutCount, postCount, layouts] = await Promise.all([
      db.collection('layouts').countDocuments(),
      db.collection('posts').countDocuments(),
      db.collection('layouts').find(
        {},
        { projection: { topic: 1, topic_key: 1, 'metadata.processing_time_ms': 1 } }
      ).toArray(),
    ])

    const times = layouts
      .map((l) => l.metadata?.processing_time_ms)
      .filter((t): t is number => typeof t === 'number')

    const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0

    res.json({
      totalLayouts: layoutCount,
      totalPosts: postCount,
      avgProcessingTime: avgTime,
      topics: layouts.map((l) => l.topic || l.topic_key || l._id),
    })
  } catch (err) {
    console.error('[Admin] Failed to get stats:', err)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// ─── GET /preview/:topicKey — preview a layout ───
router.get('/preview/:topicKey', async (req: Request, res: Response) => {
  const rawKey = req.params.topicKey
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey
  try {
    const db = await getDb()
    if (!db) {
      res.status(503).json({ error: 'Database not available' })
      return
    }

    const doc = await db.collection('layouts').findOne({
      _id: key as unknown as import('mongodb').ObjectId,
    })

    if (!doc) {
      res.status(404).json({ error: 'Layout not found' })
      return
    }

    // Build preview: clusters with 3 sample posts each
    const clusters = (doc.clusters || []).map((cluster: Record<string, unknown>) => {
      const postIds = (cluster.post_ids as string[]) || []
      const samplePosts = (doc.posts || [])
        .filter((p: Record<string, unknown>) => postIds.includes(p.id as string))
        .slice(0, 3)
        .map((p: Record<string, unknown>) => ({
          id: p.id,
          content: (p.content as string)?.slice(0, 200),
          stance: p.stance,
          emotion: p.emotion,
        }))

      return {
        id: cluster.id,
        label: cluster.label,
        summary: cluster.summary,
        postCount: postIds.length,
        samplePosts,
      }
    })

    res.json({
      topic: doc.topic,
      topicKey: key,
      clusters,
      gaps: doc.gaps || [],
      stanceLabels: doc.metadata?.stance_labels || [],
      themeLabels: doc.metadata?.theme_labels || [],
      totalPosts: doc.metadata?.total_posts || 0,
      processingTime: doc.metadata?.processing_time_ms || 0,
      spatialSummary: doc.spatial_summary,
    })
  } catch (err) {
    console.error('[Admin] Failed to preview layout:', err)
    res.status(500).json({ error: 'Failed to preview layout' })
  }
})

export default router
