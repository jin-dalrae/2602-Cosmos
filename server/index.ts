import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { processRoute } from './routes/process.js'
import { classifyRoute } from './routes/classify.js'
import { narrateRoute } from './routes/narrate.js'
import { generatePostRoute } from './routes/generate-post.js'
import { layoutRoute } from './routes/layout.js'
import { userPostRoute } from './routes/user-post.js'
import { userPostsListRoute } from './routes/user-posts-list.js'
import { voteRoute } from './routes/vote.js'
import adminRouter from './routes/admin.js'
import { closeDb, getDb } from './lib/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT || '3001')

app.use(cors())
app.use(express.json({ limit: '5mb' }))

// API routes
app.get('/api/layout/:topic', layoutRoute)
app.post('/api/process', processRoute)
app.post('/api/classify', classifyRoute)
app.post('/api/narrate', narrateRoute)
app.post('/api/generate-post', generatePostRoute)
app.post('/api/posts', userPostRoute)
app.get('/api/posts/:topic', userPostsListRoute)
app.post('/api/vote', voteRoute)

// Admin routes
app.use('/api/admin', adminRouter)

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
  // Eagerly connect to MongoDB so the first request doesn't pay the connection cost
  getDb().then((db) => {
    console.log(db ? '[Atlas] MongoDB pre-connected' : '[Atlas] MongoDB not available, using file cache')
  })
})

// Graceful shutdown
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, async () => {
    console.log(`[Atlas] ${signal} received, shutting down...`)
    await closeDb()
    process.exit(0)
  })
}
