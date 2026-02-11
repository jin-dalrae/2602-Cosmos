// A9: SSE streaming endpoint — wires up orchestrator with cache

import type { Request, Response } from 'express'
import { processDiscussion } from '../../src/lib/orchestrator.js'
import { getCached, setCached } from '../../src/lib/cache.js'
import type { ProgressEvent } from '../../src/lib/types.js'

export async function processRoute(req: Request, res: Response) {
  const { url, topic } = req.body
  const input = url || topic

  if (!input || typeof input !== 'string') {
    res.status(400).json({ error: 'Missing url or topic' })
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
    // Check cache first (only for URLs)
    if (url) {
      sendEvent({ stage: 'Checking cache...', percent: 2 })
      const cached = await getCached(url)

      if (cached) {
        sendEvent({ stage: 'Found cached layout', percent: 50 })
        sendEvent({
          stage: 'COSMOS ready (cached)',
          percent: 100,
          layout: cached,
        })
        res.end()
        return
      }
    }

    // Run the full pipeline with progress streaming
    const onProgress = (event: ProgressEvent) => {
      sendEvent({
        stage: event.stage,
        percent: event.percent,
        detail: event.detail,
      })
    }

    const layout = await processDiscussion(input, onProgress)

    // Cache the result (fire and forget, only for URLs)
    if (url) {
      setCached(url, layout).catch((err) =>
        console.warn('[Process] Cache write failed:', err)
      )
    }

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
