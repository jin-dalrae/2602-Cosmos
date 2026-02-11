import type { Request, Response } from 'express'

export async function processRoute(req: Request, res: Response) {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing reddit URL' })
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
    // TODO: Wire up orchestrator pipeline
    sendEvent({ stage: 'Fetching discussion...', percent: 10 })
    sendEvent({ stage: 'Pipeline not yet implemented', percent: 100, error: true })
    res.end()
  } catch (error) {
    sendEvent({ stage: 'Error', percent: 0, error: String(error) })
    res.end()
  }
}
