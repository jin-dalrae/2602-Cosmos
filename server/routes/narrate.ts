// A11: Narrator endpoint — wires up askNarrator from orchestrator

import type { Request, Response } from 'express'
import { askNarrator } from '../../src/lib/orchestrator.js'
import type { CosmosLayout, SwipeEvent, UserPosition } from '../../src/lib/types.js'

export async function narrateRoute(req: Request, res: Response) {
  const { question, layout, swipeHistory, userPosition } = req.body as {
    question?: string
    layout?: CosmosLayout
    swipeHistory?: SwipeEvent[]
    userPosition?: UserPosition
  }

  if (!question || !layout) {
    res.status(400).json({ error: 'Missing question or layout' })
    return
  }

  try {
    const narration = await askNarrator(
      question,
      layout,
      swipeHistory,
      userPosition
    )
    res.json(narration)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Narrate] Error:', message)
    res.status(500).json({ error: message })
  }
}
