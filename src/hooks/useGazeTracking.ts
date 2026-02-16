import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseGazeTrackingReturn {
  isTracking: boolean
  error: string | null
  videoStream: MediaStream | null
  start: () => Promise<boolean>
  stop: () => void
}

/**
 * Simple camera stream hook for head-pose tracking.
 * Replaces the old WebGazer-based gaze tracking — we only need
 * the video stream for MediaPipe head pose detection.
 */
export default function useGazeTracking(): UseGazeTrackingReturn {
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      setVideoStream(stream)
      setIsTracking(true)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable'
      console.warn('Camera unavailable:', err)
      setError(msg)
      return false
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setVideoStream(null)
    setIsTracking(false)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  return { isTracking, error, videoStream, start, stop }
}
