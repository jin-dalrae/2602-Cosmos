import express from 'express'
import cors from 'cors'
import { processRoute } from './routes/process.js'
import { classifyRoute } from './routes/classify.js'
import { narrateRoute } from './routes/narrate.js'
import { generatePostRoute } from './routes/generate-post.js'

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

app.listen(PORT, () => {
  console.log(`[Atlas] Server running on http://localhost:${PORT}`)
})
