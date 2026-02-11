import { useState, useRef, useEffect } from 'react'
import type { GazeState } from '../lib/types'

interface CardTilt {
  rotateX: number
  rotateY: number
}

interface EdgeGlow {
  side: 'left' | 'right' | 'top' | 'bottom' | null
  opacity: number
}

interface GazeCardFeedbackReturn {
  cardTilt: CardTilt
  edgeGlow: EdgeGlow
  zoneLabel: string | null
  shouldTransitionToMap: boolean
}

const LERP_RATE = 0.1
const MAX_TILT_DEG = 2
const GLOW_MAX_OPACITY = 0.7
const WANDER_THRESHOLD_MS = 3000 // 3 seconds of wander to trigger map transition

function lerp(current: number, target: number, rate: number): number {
  return current + (target - current) * rate
}

const ZONE_LABELS: Record<string, string> = {
  agree: 'Agree',
  disagree: 'Disagree',
  deeper: 'Go deeper',
  flip: 'Flip',
}

export default function useGazeCardFeedback(gazeState: GazeState | null): GazeCardFeedbackReturn {
  const [cardTilt, setCardTilt] = useState<CardTilt>({ rotateX: 0, rotateY: 0 })
  const [edgeGlow, setEdgeGlow] = useState<EdgeGlow>({ side: null, opacity: 0 })
  const [zoneLabel, setZoneLabel] = useState<string | null>(null)
  const [shouldTransitionToMap, setShouldTransitionToMap] = useState(false)

  // Smoothed values via refs to avoid stale closures in rAF
  const currentTiltRef = useRef<CardTilt>({ rotateX: 0, rotateY: 0 })
  const currentGlowRef = useRef<{ opacity: number }>({ opacity: 0 })
  const wanderStartRef = useRef<number | null>(null)
  const gazeRef = useRef<GazeState | null>(null)
  const rafRef = useRef<number>(0)

  // Keep gaze ref in sync
  useEffect(() => {
    gazeRef.current = gazeState
  }, [gazeState])

  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)

      const gaze = gazeRef.current

      if (!gaze || !gaze.isCalibrated || gaze.confidence < 0.2) {
        // No gaze data: smooth back to neutral
        const ct = currentTiltRef.current
        const newTilt = {
          rotateX: lerp(ct.rotateX, 0, LERP_RATE),
          rotateY: lerp(ct.rotateY, 0, LERP_RATE),
        }
        currentTiltRef.current = newTilt
        setCardTilt({ ...newTilt })

        const newOpacity = lerp(currentGlowRef.current.opacity, 0, LERP_RATE)
        currentGlowRef.current.opacity = newOpacity
        setEdgeGlow({ side: null, opacity: newOpacity })
        setZoneLabel(null)
        setShouldTransitionToMap(false)
        wanderStartRef.current = null
        return
      }

      const zone = gaze.zone
      let targetRotateX = 0
      let targetRotateY = 0
      let targetGlowSide: 'left' | 'right' | 'top' | 'bottom' | null = null
      let targetGlowOpacity = 0

      switch (zone) {
        case 'agree':
          // Eyes drift right
          targetRotateY = MAX_TILT_DEG
          targetGlowSide = 'right'
          targetGlowOpacity = GLOW_MAX_OPACITY * Math.min(gaze.zoneDwellMs / 800, 1)
          break

        case 'disagree':
          // Eyes drift left
          targetRotateY = -MAX_TILT_DEG
          targetGlowSide = 'left'
          targetGlowOpacity = GLOW_MAX_OPACITY * Math.min(gaze.zoneDwellMs / 800, 1)
          break

        case 'deeper':
          // Eyes drop to bottom
          targetRotateX = -MAX_TILT_DEG
          targetGlowSide = 'bottom'
          targetGlowOpacity = GLOW_MAX_OPACITY * Math.min(gaze.zoneDwellMs / 1000, 1)
          break

        case 'flip':
          // Eyes go to top
          targetRotateX = MAX_TILT_DEG
          targetGlowSide = 'top'
          targetGlowOpacity = GLOW_MAX_OPACITY * Math.min(gaze.zoneDwellMs / 1000, 1)
          break

        case 'read':
          // Centered: no tilt, no glow
          targetRotateX = 0
          targetRotateY = 0
          targetGlowSide = null
          targetGlowOpacity = 0
          break

        case 'wander':
          // No tilt, but track wander duration
          targetRotateX = 0
          targetRotateY = 0
          targetGlowSide = null
          targetGlowOpacity = 0
          break
      }

      // Smooth tilt
      const ct = currentTiltRef.current
      const newTilt = {
        rotateX: lerp(ct.rotateX, targetRotateX, LERP_RATE),
        rotateY: lerp(ct.rotateY, targetRotateY, LERP_RATE),
      }
      currentTiltRef.current = newTilt
      setCardTilt({ ...newTilt })

      // Smooth glow
      const newGlowOpacity = lerp(currentGlowRef.current.opacity, targetGlowOpacity, LERP_RATE)
      currentGlowRef.current.opacity = newGlowOpacity
      setEdgeGlow({ side: targetGlowSide, opacity: newGlowOpacity })

      // Zone label
      const label = ZONE_LABELS[zone] ?? null
      setZoneLabel(label)

      // Wander detection for map transition
      if (zone === 'wander') {
        if (wanderStartRef.current === null) {
          wanderStartRef.current = Date.now()
        } else {
          const wanderDuration = Date.now() - wanderStartRef.current
          setShouldTransitionToMap(wanderDuration >= WANDER_THRESHOLD_MS)
        }
      } else {
        wanderStartRef.current = null
        setShouldTransitionToMap(false)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    cardTilt,
    edgeGlow,
    zoneLabel,
    shouldTransitionToMap,
  }
}
