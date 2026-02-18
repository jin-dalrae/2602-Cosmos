import { useState, useCallback, useRef } from 'react'
import type { CosmosLayout, CosmosPost } from '../lib/types'
import { API_BASE } from '../lib/api'

/** Map topic strings to static CDN JSON paths (pre-baked layouts) */
const STATIC_LAYOUTS: Record<string, string> = {
  'SF Richmond': '/data/sf-richmond.json',
}

function toStaticKey(topic: string): string | null {
  // Direct match
  if (STATIC_LAYOUTS[topic]) return STATIC_LAYOUTS[topic]
  // Case-insensitive match
  const lower = topic.toLowerCase()
  for (const [key, path] of Object.entries(STATIC_LAYOUTS)) {
    if (key.toLowerCase() === lower) return path
  }
  return null
}

interface CosmosDataReturn {
  layout: CosmosLayout | null
  isLoading: boolean
  isRefining: boolean
  progress: { stage: string; percent: number }
  error: string | null
  processUrl: (url: string) => void
  processTopic: (topic: string) => void
  setLayout: (layout: CosmosLayout | null) => void
  setIsLoading: (loading: boolean) => void
  setProgress: (progress: { stage: string; percent: number }) => void
}

/**
 * Fetch user-created posts from MongoDB and merge them into the layout.
 * Runs after the base layout is loaded so new community posts appear.
 */
async function mergeUserPosts(
  baseLayout: CosmosLayout,
  signal: AbortSignal
): Promise<CosmosLayout> {
  try {
    const res = await fetch(
      `${API_BASE}/api/posts/${encodeURIComponent(baseLayout.topic)}`,
      { signal }
    )
    if (!res.ok) return baseLayout

    const { posts } = (await res.json()) as { posts: CosmosPost[] }
    if (!posts || posts.length === 0) return baseLayout

    // Deduplicate by id — user posts override if already present
    const existingIds = new Set(baseLayout.posts.map((p) => p.id))
    const newPosts = posts.filter((p) => !existingIds.has(p.id))
    if (newPosts.length === 0) return baseLayout

    console.log(`[useCosmosData] Merged ${newPosts.length} user posts`)
    return {
      ...baseLayout,
      posts: [...baseLayout.posts, ...newPosts],
      metadata: {
        ...baseLayout.metadata,
        total_posts: baseLayout.metadata.total_posts + newPosts.length,
      },
    }
  } catch {
    // Network error or aborted — return layout as-is
    return baseLayout
  }
}

/**
 * Data loading hook with three-tier fallback:
 *   1. Static CDN (pre-baked JSON in public/data/) — instant, <100ms
 *   2. MongoDB (GET /api/layout/:topic) — fast if DB is warm
 *   3. SSE pipeline (POST /api/process) — full AI generation, slowest
 */
export default function useCosmosData(): CosmosDataReturn {
  const [layout, setLayout] = useState<CosmosLayout | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [progress, setProgress] = useState<{ stage: string; percent: number }>({
    stage: '',
    percent: 0,
  })
  const [error, setError] = useState<string | null>(null)

  // Abort controller for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null)

  const startProcessing = useCallback((body: Record<string, string>) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const abortController = new AbortController()
    abortRef.current = abortController

    // Reset state
    setLayout(null)
    setError(null)
    setIsLoading(true)
    setIsRefining(false)
    setProgress({ stage: 'Loading...', percent: 0 })

    ;(async () => {
      const topic = body.topic

      // ── Tier 1: Static CDN (pre-baked layout) ──
      // For pre-baked topics, CDN is the canonical source — skip MongoDB/SSE entirely
      if (topic) {
        const staticPath = toStaticKey(topic)
        if (staticPath) {
          try {
            const res = await fetch(staticPath, { signal: abortController.signal })
            if (res.ok) {
              const data = await res.json() as CosmosLayout
              console.log('[useCosmosData] Loaded from CDN:', staticPath)
              // Show CDN layout immediately, then merge user posts in background
              setLayout(data)
              setIsLoading(false)
              setProgress({ stage: 'Ready', percent: 100 })
              mergeUserPosts(data, abortController.signal).then((merged) => {
                if (!abortController.signal.aborted && merged !== data) {
                  setLayout(merged)
                }
              })
              return
            }
          } catch {
            // CDN fetch failed — fall through to MongoDB
          }
          if (abortController.signal.aborted) return
        }
      }

      // ── Tier 2: MongoDB stored layout (non-pre-baked topics only) ──
      if (topic) {
        try {
          const res = await fetch(
            `${API_BASE}/api/layout/${encodeURIComponent(topic)}`,
            { signal: abortController.signal }
          )
          if (res.ok) {
            const data = await res.json() as CosmosLayout
            console.log('[useCosmosData] Loaded from MongoDB:', topic)
            setLayout(data)
            setIsLoading(false)
            setProgress({ stage: 'Ready', percent: 100 })
            // Merge any user posts stored separately
            mergeUserPosts(data, abortController.signal).then((merged) => {
              if (!abortController.signal.aborted && merged !== data) {
                setLayout(merged)
              }
            })
            return
          }
        } catch {
          // Network error or aborted — fall through
        }
        if (abortController.signal.aborted) return
      }

      // ── Tier 3: Full SSE pipeline (AI generation) ──
      let receivedLayout = false

      try {
        const response = await fetch(`${API_BASE}/api/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Server error ${response.status}: ${text}`)
        }

        if (!response.body) {
          throw new Error('No response body — SSE streaming not supported')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE lines: each event is "data: {...}\n\n"
          const lines = buffer.split('\n\n')
          // Keep the last incomplete chunk in the buffer
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            // Extract the JSON payload after "data: "
            const dataPrefix = 'data: '
            const dataLine = trimmed
              .split('\n')
              .find((l) => l.startsWith(dataPrefix))

            if (!dataLine) continue

            const jsonStr = dataLine.slice(dataPrefix.length)

            try {
              const event = JSON.parse(jsonStr) as Record<string, unknown>

              // Check for server-side error
              if (event.error) {
                setError(event.error as string)
                setIsLoading(false)
                return
              }

              // Update progress
              const stage = (event.stage as string) ?? ''
              const percent = (event.percent as number) ?? 0
              setProgress({ stage, percent })

              // Partial layout — show experience immediately
              if (event.partial_layout) {
                setLayout(event.partial_layout as CosmosLayout)
                setIsLoading(false)
                setIsRefining(true)
                receivedLayout = true
                continue
              }

              // Final event contains the layout
              if (percent >= 100 && event.layout) {
                setLayout(event.layout as CosmosLayout)
                setIsLoading(false)
                setIsRefining(false)
                receivedLayout = true
                return
              }
            } catch (parseErr) {
              // Skip malformed SSE lines — don't break the stream
              console.warn('[useCosmosData] Failed to parse SSE event:', jsonStr, parseErr)
            }
          }
        }

        // Stream ended without a final layout event
        if (!receivedLayout) {
          setIsLoading(false)
          setError((prev) => prev ?? 'Stream ended without receiving layout data')
        } else {
          // Partial layout was received but stream ended before final — stop refining spinner
          setIsRefining(false)
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          // Request was intentionally cancelled — no error
          return
        }
        const message = err instanceof Error ? err.message : String(err)
        console.error('[useCosmosData] Fetch error:', message)
        setError(message)
        setIsLoading(false)
      }
    })()
  }, [])

  const processUrl = useCallback((url: string) => {
    startProcessing({ url })
  }, [startProcessing])

  const processTopic = useCallback((topic: string) => {
    startProcessing({ topic })
  }, [startProcessing])

  return {
    layout,
    isLoading,
    isRefining,
    progress,
    error,
    processUrl,
    processTopic,
    setLayout,
    setIsLoading,
    setProgress,
  }
}
