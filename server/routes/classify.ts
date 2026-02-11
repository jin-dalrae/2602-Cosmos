// A10: Classifier endpoint — wires up classifyUserPost from orchestrator

import type { Request, Response } from 'express'
import { classifyUserPost } from '../../src/lib/orchestrator.js'
import type { CosmosLayout } from '../../src/lib/types.js'

export async function classifyRoute(req: Request, res: Response) {
  const { text, layout } = req.body as {
    text?: string
    layout?: CosmosLayout
  }

  if (!text || !layout) {
    res.status(400).json({ error: 'Missing text or layout' })
    return
  }

  try {
    const classified = await classifyUserPost(text, layout)
    res.json(classified)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Classify] Error:', message)
    res.status(500).json({ error: message })
  }
}
