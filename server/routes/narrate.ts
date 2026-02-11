import type { Request, Response } from 'express'

export async function narrateRoute(req: Request, res: Response) {
  const { question, layout, swipeHistory, userPosition } = req.body

  if (!question || !layout) {
    res.status(400).json({ error: 'Missing question or layout' })
    return
  }

  try {
    // TODO: Wire up narrator agent
    res.json({ error: 'Narrator not yet implemented' })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}
