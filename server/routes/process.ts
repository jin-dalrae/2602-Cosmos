// A9: SSE streaming endpoint — wires up orchestrator with cache

import type { Request, Response } from 'express'
import { processDiscussion } from '../../src/lib/orchestrator.js'
import type { CosmosLayout, ProgressEvent } from '../../src/lib/types.js'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storeLayoutAndPosts } from '../lib/store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(__dirname, '..', '.cache')

/** Sanitise a string into a safe filename */
function toFileName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Try to read a layout from the local file cache */
async function getLocalCache(key: string) {
  try {
    const raw = await readFile(join(CACHE_DIR, `${toFileName(key)}.json`), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Write a layout to the local file cache */
async function setLocalCache(key: string, layout: unknown) {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(
      join(CACHE_DIR, `${toFileName(key)}.json`),
      JSON.stringify(layout),
      'utf-8'
    )
    console.log(`[Process] Cached layout to disk: ${toFileName(key)}.json`)
  } catch (err) {
    console.warn('[Process] Failed to write local cache:', err)
  }
}

export async function processRoute(req: Request, res: Response) {
  const { topic } = req.body
  const input = topic

  if (!input || typeof input !== 'string') {
    res.status(400).json({ error: 'Missing topic' })
    return
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    // ── Check local file cache first (works for both URLs and topics) ──
    const localCached = await getLocalCache(input)
    if (localCached) {
      console.log(`[Process] Local cache hit for "${input}"`)
      sendEvent({ stage: 'COSMOS ready (cached)', percent: 100, layout: localCached })
      res.end()
      return
    }

    // Run the full pipeline with progress streaming
    const onProgress = (event: ProgressEvent) => {
      sendEvent({
        stage: event.stage,
        percent: event.percent,
        detail: event.detail,
      })
    }

    const onPartialLayout = (partialLayout: import('../../src/lib/types.js').CosmosLayout) => {
      sendEvent({
        stage: 'Partial layout ready',
        percent: Math.min(
          59,
          25 + Math.round((partialLayout.posts.length / 100) * 34)
        ),
        partial_layout: partialLayout,
      })
    }

    const layout = await processDiscussion(input, onProgress, onPartialLayout)

    // Cache the result to local file + MongoDB (fire-and-forget)
    setLocalCache(input, layout)
    storeLayoutAndPosts(input, layout as CosmosLayout).catch((err) =>
      console.warn('[Process] DB store failed:', err)
    )

    // Send the final layout
    sendEvent({
      stage: 'COSMOS ready',
      percent: 100,
      layout,
    })

    res.end()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Process] Pipeline error:', message)
    sendEvent({ stage: 'Error', percent: 0, error: message })
    res.end()
  }
}
