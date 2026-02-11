import { useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import type { CosmosPost, Cluster, SwipeDirection } from '../../lib/types'
import { GAZE_ZONE_COLORS } from '../shared/EmotionPalette'
import CardFront from './CardFront'
import CardBack from './CardBack'

interface SwipeableCardProps {
  post: CosmosPost
  clusters: Cluster[]
  onSwipe: (direction: SwipeDirection) => void
}

const SWIPE_THRESHOLD = 100
const SPRING_CONFIG = { stiffness: 300, damping: 30 }

export default function SwipeableCard({
  post,
  clusters,
  onSwipe,
}: SwipeableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // Raw motion values driven by gesture
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Sprung values for smooth release animation
  const x = useSpring(rawX, SPRING_CONFIG)
  const y = useSpring(rawY, SPRING_CONFIG)

  // Rotation during horizontal drag: map dragX to +/-15 degrees
  const rotateZ = useTransform(x, [-200, 0, 200], [-15, 0, 15])

  // Edge glow opacities
  const rightGlowOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.8])
  const leftGlowOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.8, 0])
  const downGlowOpacity = useTransform(y, [0, SWIPE_THRESHOLD], [0, 0.8])
  const upGlowOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [0.8, 0])

  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection) => {
      onSwipe(direction)
      // Reset position after swipe
      rawX.set(0)
      rawY.set(0)
      if (direction === 'up') {
        setIsFlipped((prev) => !prev)
      }
    },
    [onSwipe, rawX, rawY],
  )

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
      if (down) {
        rawX.set(mx)
        rawY.set(my)
        return
      }

      // On release, determine if the swipe crossed threshold
      const absX = Math.abs(mx)
      const absY = Math.abs(my)
      const fastX = Math.abs(vx) > 0.5
      const fastY = Math.abs(vy) > 0.5

      // Determine dominant axis
      if (absX > absY) {
        if (absX > SWIPE_THRESHOLD || fastX) {
          const direction: SwipeDirection = dx > 0 ? 'right' : 'left'
          handleSwipeComplete(direction)
          return
        }
      } else {
        if (absY > SWIPE_THRESHOLD || fastY) {
          const direction: SwipeDirection = dy > 0 ? 'down' : 'up'
          handleSwipeComplete(direction)
          return
        }
      }

      // Snap back
      rawX.set(0)
      rawY.set(0)
    },
    {
      filterTaps: true,
    },
  )

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: 1200 }}
    >
      {/* Edge glow overlays */}
      {/* Right glow (agree) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          opacity: rightGlowOpacity,
          boxShadow: `inset -40px 0 40px -20px ${GAZE_ZONE_COLORS.agree}`,
          borderRadius: 12,
        }}
      />
      {/* Left glow (disagree) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          opacity: leftGlowOpacity,
          boxShadow: `inset 40px 0 40px -20px ${GAZE_ZONE_COLORS.disagree}`,
          borderRadius: 12,
        }}
      />
      {/* Down glow (deeper) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          opacity: downGlowOpacity,
          boxShadow: `inset 0 -40px 40px -20px ${GAZE_ZONE_COLORS.deeper}`,
          borderRadius: 12,
        }}
      />
      {/* Up glow (flip) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          opacity: upGlowOpacity,
          boxShadow: `inset 0 40px 40px -20px ${GAZE_ZONE_COLORS.flip}`,
          borderRadius: 12,
        }}
      />

      {/* 3D flip container */}
      <div {...bind()} className="w-full h-full cursor-grab active:cursor-grabbing touch-none">
      <motion.div
        className="w-full h-full"
        style={{
          x,
          y,
          rotateZ,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front face */}
        <motion.div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            rotateY: isFlipped ? 180 : 0,
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <CardFront post={post} />
        </motion.div>

        {/* Back face */}
        <motion.div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            rotateY: isFlipped ? 0 : -180,
          }}
          animate={{ rotateY: isFlipped ? 0 : -180 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <CardBack post={post} clusters={clusters} />
        </motion.div>
      </motion.div>
      </div>
    </div>
  )
}
