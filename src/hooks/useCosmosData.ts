import { useState, useCallback, useRef } from 'react'
import type { CosmosLayout } from '../lib/types'

interface CosmosDataReturn {
  layout: CosmosLayout | null
  isLoading: boolean
  progress: { stage: string; percent: number }
  error: string | null
  processUrl: (url: string) => void
  processTopic: (topic: string) => void
  setLayout: (layout: CosmosLayout | null) => void
  setIsLoading: (loading: boolean) => void
  setProgress: (progress: { stage: string; percent: number }) => void
}

/**
 * SSE client hook that calls the Express backend POST /api/process.
 * Reads streaming SSE events from the response and updates progress state.
 * The final event (percent=100) contains the layout in a `layout` field.
 */
export default function useCosmosData(): CosmosDataReturn {
  const [layout, setLayout] = useState<CosmosLayout | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
    setProgress({ stage: 'Connecting...', percent: 0 })

    ;(async () => {
      try {
        const response = await fetch('/api/process', {
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

              // Final event contains the layout
              if (percent >= 100 && event.layout) {
                setLayout(event.layout as CosmosLayout)
                setIsLoading(false)
                return
              }
            } catch (parseErr) {
              // Skip malformed SSE lines — don't break the stream
              console.warn('[useCosmosData] Failed to parse SSE event:', jsonStr, parseErr)
            }
          }
        }

        // Stream ended without a final layout event
        if (!layout) {
          setIsLoading(false)
          // Only set error if we didn't already get data
          setError((prev) => prev ?? 'Stream ended without receiving layout data')
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
  }, [layout])

  const processUrl = useCallback((url: string) => {
    startProcessing({ url })
  }, [startProcessing])

  const processTopic = useCallback((topic: string) => {
    startProcessing({ topic })
  }, [startProcessing])

  return {
    layout,
    isLoading,
    progress,
    error,
    processUrl,
    processTopic,
    setLayout,
    setIsLoading,
    setProgress,
  }
}
