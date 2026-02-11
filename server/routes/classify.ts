import type { Request, Response } from 'express'

export async function classifyRoute(req: Request, res: Response) {
  const { text, layout } = req.body

  if (!text || !layout) {
    res.status(400).json({ error: 'Missing text or layout' })
    return
  }

  try {
    // TODO: Wire up classifier agent
    res.json({ error: 'Classifier not yet implemented' })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}
