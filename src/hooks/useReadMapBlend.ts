import { useState, useCallback, useRef, useEffect } from 'react'
import { usePinch } from '@use-gesture/react'

interface ReadMapBlendReturn {
  blend: number
  isTransitioning: boolean
  setBlend: (v: number) => void
  bindPinch: () => Record<string, unknown>
}

const SNAP_THRESHOLD = 0.15
const SPRING_STIFFNESS = 0.12
const SPRING_DAMPING = 0.78

/**
 * Pinch gesture -> blend float.
 * blend 0 = READ mode, blend 1 = MAP mode.
 * Pinch out (spread) increases blend toward 1 (MAP).
 * Pinch in (squeeze) decreases blend toward 0 (READ).
 * Snaps to 0 or 1 when within threshold.
 */
export default function useReadMapBlend(): ReadMapBlendReturn {
  const [blend, setBlendState] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Internal target for spring animation
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const velocityRef = useRef(0)
  const rafRef = useRef<number>(0)
  const isAnimatingRef = useRef(false)

  // Spring animation loop
  const animate = useCallback(() => {
    const target = targetRef.current
    const current = currentRef.current
    const diff = target - current

    // Apply spring physics
    const force = diff * SPRING_STIFFNESS
    velocityRef.current = velocityRef.current * SPRING_DAMPING + force
    const next = current + velocityRef.current

    // Clamp to [0, 1]
    const clamped = Math.max(0, Math.min(1, next))
    currentRef.current = clamped
    setBlendState(clamped)

    // Check if we've settled
    if (Math.abs(diff) < 0.001 && Math.abs(velocityRef.current) < 0.001) {
      currentRef.current = target
      setBlendState(target)
      setIsTransitioning(false)
      isAnimatingRef.current = false
      return
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [])

  const startAnimation = useCallback(
    (target: number) => {
      targetRef.current = target
      setIsTransitioning(true)

      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true
        rafRef.current = requestAnimationFrame(animate)
      }
    },
    [animate],
  )

  // Programmatic setBlend (e.g., from gaze or buttons)
  const setBlend = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v))

      // Snap to endpoints if close
      let target = clamped
      if (target < SNAP_THRESHOLD) target = 0
      else if (target > 1 - SNAP_THRESHOLD) target = 1

      startAnimation(target)
    },
    [startAnimation],
  )

  // Pinch gesture handler
  const bindPinch = usePinch(
    ({ offset: [scale], active, memo }) => {
      // memo stores the blend value at the start of the gesture
      const startBlend = memo ?? currentRef.current

      if (active) {
        // scale > 1 = pinching out (spread) -> increase blend toward MAP
        // scale < 1 = pinching in (squeeze) -> decrease blend toward READ
        // Map scale range [0.5, 2.0] -> blend delta [-0.5, 0.5]
        const delta = (scale - 1) * 0.7
        const newBlend = Math.max(0, Math.min(1, startBlend + delta))

        currentRef.current = newBlend
        targetRef.current = newBlend
        setBlendState(newBlend)
        setIsTransitioning(true)
      } else {
        // Gesture ended — snap to nearest endpoint if within threshold
        const current = currentRef.current
        let snapTarget: number
        if (current < SNAP_THRESHOLD) {
          snapTarget = 0
        } else if (current > 1 - SNAP_THRESHOLD) {
          snapTarget = 1
        } else if (current < 0.5) {
          snapTarget = 0
        } else {
          snapTarget = 1
        }

        startAnimation(snapTarget)
      }

      return startBlend
    },
    {
      scaleBounds: { min: 0.3, max: 3 },
      from: () => [1, 0],
    },
  )

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    blend,
    isTransitioning,
    setBlend,
    bindPinch: bindPinch as unknown as () => Record<string, unknown>,
  }
}
