import { useState, useCallback, useRef, useEffect } from 'react'
import type { GazePoint } from '../lib/types'

interface WebGazerModule {
  setRegression: (type: string) => WebGazerModule
  setGazeListener: (
    callback: (data: { x: number; y: number } | null, elapsedTime: number) => void,
  ) => WebGazerModule
  begin: () => Promise<WebGazerModule>
  end: () => void
  pause: () => void
  resume: () => void
  addMouseEventListeners: () => void
  removeMouseEventListeners: () => void
  showPredictionPoints: (show: boolean) => void
  recordScreenPosition: (x: number, y: number, eventType?: string) => void
}

const BUFFER_SIZE = 30

export interface UseGazeTrackingReturn {
  gazePoint: GazePoint | null
  isTracking: boolean
  isCalibrated: boolean
  confidence: number
  start: () => Promise<void>
  stop: () => void
  addCalibrationPoint: (x: number, y: number) => void
}

export default function useGazeTracking(): UseGazeTrackingReturn {
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [confidence, setConfidence] = useState(0)

  const webgazerRef = useRef<WebGazerModule | null>(null)
  const bufferRef = useRef<GazePoint[]>([])
  const calibrationCountRef = useRef(0)
  const isStartedRef = useRef(false)

  const updateConfidence = useCallback((buffer: GazePoint[]) => {
    if (buffer.length < 5) {
      setConfidence(0)
      return
    }

    // Confidence based on consistency of recent points
    const recent = buffer.slice(-10)
    if (recent.length < 2) return

    let totalDist = 0
    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].x - recent[i - 1].x
      const dy = recent[i].y - recent[i - 1].y
      totalDist += Math.sqrt(dx * dx + dy * dy)
    }
    const avgDist = totalDist / (recent.length - 1)

    // Lower jitter = higher confidence (max screen dimension ~2000px)
    const normalizedJitter = Math.min(avgDist / 200, 1)
    setConfidence(Math.max(0, 1 - normalizedJitter))
  }, [])

  const start = useCallback(async () => {
    if (isStartedRef.current) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webgazerModule = await import('webgazer') as any
      const wg = (webgazerModule.default ?? webgazerModule) as WebGazerModule

      wg.setRegression('ridge')
        .setGazeListener((data: { x: number; y: number } | null, _elapsedTime: number) => {
          if (!data) return

          const point: GazePoint = {
            x: data.x,
            y: data.y,
            timestamp: Date.now(),
          }

          bufferRef.current.push(point)
          if (bufferRef.current.length > BUFFER_SIZE) {
            bufferRef.current.shift()
          }

          setGazePoint(point)
          updateConfidence(bufferRef.current)
        })

      wg.showPredictionPoints(false)
      await wg.begin()

      webgazerRef.current = wg
      isStartedRef.current = true
      setIsTracking(true)
    } catch (_err) {
      // WebGazer not available or camera denied — remain in no-op state
      console.warn('Gaze tracking unavailable:', _err)
    }
  }, [updateConfidence])

  const stop = useCallback(() => {
    if (webgazerRef.current && isStartedRef.current) {
      try {
        webgazerRef.current.end()
      } catch {
        // Ignore teardown errors
      }
      webgazerRef.current = null
      isStartedRef.current = false
    }
    setIsTracking(false)
    setGazePoint(null)
    setConfidence(0)
    bufferRef.current = []
  }, [])

  const addCalibrationPoint = useCallback((x: number, y: number) => {
    if (!webgazerRef.current) return

    // Record click position for calibration training
    webgazerRef.current.recordScreenPosition(x, y, 'click')

    calibrationCountRef.current += 1

    // Consider calibrated after sufficient calibration points (9+ points typical)
    if (calibrationCountRef.current >= 5) {
      setIsCalibrated(true)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webgazerRef.current && isStartedRef.current) {
        try {
          webgazerRef.current.end()
        } catch {
          // Ignore teardown errors
        }
        webgazerRef.current = null
        isStartedRef.current = false
      }
    }
  }, [])

  return {
    gazePoint,
    isTracking,
    isCalibrated,
    confidence,
    start,
    stop,
    addCalibrationPoint,
  }
}
