import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { processRoute } from './routes/process.js'
import { classifyRoute } from './routes/classify.js'
import { narrateRoute } from './routes/narrate.js'
import { generatePostRoute } from './routes/generate-post.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || '3001')

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// API routes
app.post('/api/process', processRoute)
app.post('/api/classify', classifyRoute)
app.post('/api/narrate', narrateRoute)
app.post('/api/generate-post', generatePostRoute)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// In production, serve Vite's build output as static files
const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // SPA fallback: serve index.html for all non-API routes (Express 5 wildcard syntax)
  app.get('{*path}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
  console.log(`[Atlas] Serving static files from ${distPath}`)
}

app.listen(PORT, () => {
  console.log(`[Atlas] Server running on http://localhost:${PORT}`)
})
