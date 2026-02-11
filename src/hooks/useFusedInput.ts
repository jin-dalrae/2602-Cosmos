import { useState, useRef, useEffect, useCallback } from 'react'
import type { GazeState, FaceState, IntentSignal } from '../lib/types'
import { fuseInputs } from '../lib/fusionLayer'

const FRAME_INTERVAL_MS = 1000 / 30 // ~30fps
const HISTORY_SIZE = 5

interface FusedInputReturn {
  currentIntent: IntentSignal
  isConfused: boolean
  isFatigued: boolean
  isEngaged: boolean
}

const IDLE_SIGNAL: IntentSignal = {
  type: 'idle',
  confidence: 0,
  source: 'fused',
  timestamp: Date.now(),
}

/**
 * Master input hook — 30fps processing loop.
 * Calls fuseInputs each frame, smooths intent over the last 5 frames,
 * and derives isConfused / isFatigued / isEngaged from recent history.
 */
export default function useFusedInput(
  gazeState: GazeState | null,
  faceState: FaceState | null,
): FusedInputReturn {
  const [currentIntent, setCurrentIntent] = useState<IntentSignal>(IDLE_SIGNAL)
  const [isConfused, setIsConfused] = useState(false)
  const [isFatigued, setIsFatigued] = useState(false)
  const [isEngaged, setIsEngaged] = useState(false)

  // Refs for the processing loop to avoid stale closures
  const gazeRef = useRef<GazeState | null>(gazeState)
  const faceRef = useRef<FaceState | null>(faceState)
  const historyRef = useRef<IntentSignal[]>([])
  const lastFrameTimeRef = useRef(0)
  const rafRef = useRef<number>(0)
  const mouseStateRef = useRef<{ x: number; y: number; isActive: boolean }>({
    x: 0,
    y: 0,
    isActive: false,
  })
  const mouseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep refs in sync with props
  useEffect(() => {
    gazeRef.current = gazeState
  }, [gazeState])

  useEffect(() => {
    faceRef.current = faceState
  }, [faceState])

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseStateRef.current = {
        x: e.clientX,
        y: e.clientY,
        isActive: true,
      }

      // Clear previous timeout
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }

      // Mark mouse as inactive after 2 seconds of no movement
      mouseTimeoutRef.current = setTimeout(() => {
        mouseStateRef.current = {
          ...mouseStateRef.current,
          isActive: false,
        }
      }, 2000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Determine the dominant intent from the recent history by
   * picking the type with the highest cumulative confidence.
   */
  const smoothIntent = useCallback((history: IntentSignal[]): IntentSignal => {
    if (history.length === 0) return IDLE_SIGNAL

    // Accumulate confidence by intent type
    const scores = new Map<string, number>()
    for (const signal of history) {
      const prev = scores.get(signal.type) ?? 0
      scores.set(signal.type, prev + signal.confidence)
    }

    // Find the type with the highest accumulated confidence
    let bestType = 'idle'
    let bestScore = 0
    for (const [type, score] of scores) {
      if (score > bestScore) {
        bestScore = score
        bestType = type
      }
    }

    // Average confidence for the dominant type
    const matching = history.filter((s) => s.type === bestType)
    const avgConfidence = matching.reduce((sum, s) => sum + s.confidence, 0) / matching.length

    return {
      type: bestType as IntentSignal['type'],
      confidence: avgConfidence,
      source: 'fused',
      timestamp: Date.now(),
    }
  }, [])

  // Main processing loop at ~30fps
  useEffect(() => {
    const loop = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(loop)

      // Throttle to ~30fps
      const elapsed = timestamp - lastFrameTimeRef.current
      if (elapsed < FRAME_INTERVAL_MS) return
      lastFrameTimeRef.current = timestamp

      // Fuse all inputs
      const rawSignal = fuseInputs(
        gazeRef.current,
        faceRef.current,
        mouseStateRef.current,
      )

      // Add to history ring buffer
      const history = historyRef.current
      history.push(rawSignal)
      if (history.length > HISTORY_SIZE) {
        history.shift()
      }

      // Smooth over recent history
      const smoothed = smoothIntent(history)
      setCurrentIntent(smoothed)

      // Derive boolean flags from recent history
      const confusedCount = history.filter((s) => s.type === 'confused').length
      const fatiguedCount = history.filter((s) => s.type === 'fatigued').length
      const engagedCount = history.filter(
        (s) => s.type === 'engaged' || s.type === 'deep_read',
      ).length

      // Require majority of recent frames to flag a state
      const threshold = Math.ceil(HISTORY_SIZE / 2)
      setIsConfused(confusedCount >= threshold)
      setIsFatigued(fatiguedCount >= threshold)
      setIsEngaged(engagedCount >= threshold)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [smoothIntent])

  return {
    currentIntent,
    isConfused,
    isFatigued,
    isEngaged,
  }
}
