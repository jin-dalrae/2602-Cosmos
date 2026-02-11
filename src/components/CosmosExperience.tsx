import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import type { CosmosLayout, SwipeDirection, Reaction } from '../lib/types'
import useReadMapBlend from '../hooks/useReadMapBlend'
import { useCardNavigation } from '../hooks/useCardNavigation'
import { useSwipeHistory } from '../hooks/useSwipeHistory'
import CardStack from './ReadMode/CardStack'
import Canvas3D from './MapMode/Canvas3D'
import PostCloud from './MapMode/PostCloud'
import EdgeNetwork from './MapMode/EdgeNetwork'
import ClusterShells from './MapMode/ClusterShells'
import AmbientDust from './MapMode/AmbientDust'

interface CosmosExperienceProps {
  layout: CosmosLayout
}

const DIRECTION_TO_REACTION: Record<SwipeDirection, Reaction> = {
  right: 'agree',
  left: 'disagree',
  down: 'deeper',
  up: 'flip',
}

export default function CosmosExperience({ layout }: CosmosExperienceProps) {
  const { blend, isTransitioning, setBlend, bindPinch } = useReadMapBlend()
  const { nextPosts, handleSwipe } = useCardNavigation(layout.posts, layout.clusters)
  const { addSwipe } = useSwipeHistory()
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  // Combine card navigation swipe with swipe history tracking
  const onSwipe = useCallback(
    (postId: string, direction: SwipeDirection) => {
      handleSwipe(postId, direction)
      addSwipe(postId, DIRECTION_TO_REACTION[direction])
    },
    [handleSwipe, addSwipe],
  )

  const onPostSelect = useCallback((postId: string) => {
    setSelectedPostId(postId)
  }, [])

  // Highlight the selected post and bridge posts in MAP mode
  const highlightIds = selectedPostId
    ? [selectedPostId, ...layout.bridge_posts]
    : layout.bridge_posts

  // Interpolated values based on blend
  const readOpacity = 1 - blend
  const mapOpacity = blend
  const cardScale = 1 - blend * 0.15

  // Determine pointer-events: only the active mode should receive interactions
  const readPointerEvents = blend < 0.5 ? 'auto' : 'none'
  const mapPointerEvents = blend >= 0.5 ? 'auto' : 'none'

  return (
    <div
      {...bindPinch()}
      className="relative w-full h-full overflow-hidden"
      style={{
        touchAction: 'none',
        background: 'linear-gradient(180deg, #262220 0%, #1C1A18 100%)',
      }}
    >
      {/* MAP mode layer (behind READ) */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: mapOpacity,
          pointerEvents: mapPointerEvents as 'auto' | 'none',
        }}
        animate={{ opacity: mapOpacity }}
        transition={{ duration: 0.1 }}
      >
        <Canvas3D>
          <PostCloud
            posts={layout.posts}
            onSelect={onPostSelect}
            highlightIds={highlightIds}
          />
          <EdgeNetwork posts={layout.posts} />
          <ClusterShells clusters={layout.clusters} />
          <AmbientDust />
        </Canvas3D>
      </motion.div>

      {/* READ mode layer (on top, centered card stack) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: readOpacity,
          pointerEvents: readPointerEvents as 'auto' | 'none',
        }}
        animate={{
          opacity: readOpacity,
          scale: cardScale,
        }}
        transition={{ duration: 0.1 }}
      >
        <div
          style={{
            width: 340,
            height: 500,
            position: 'relative',
          }}
        >
          <CardStack
            posts={nextPosts}
            clusters={layout.clusters}
            onSwipe={onSwipe}
          />
        </div>
      </motion.div>

      {/* Mode toggle button (bottom center) */}
      <div
        className="absolute bottom-6 left-1/2 flex gap-2"
        style={{ transform: 'translateX(-50%)', zIndex: 50 }}
      >
        <button
          onClick={() => setBlend(0)}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: blend < 0.5 ? '#D4B872' : '#3A3530',
            color: blend < 0.5 ? '#1C1A18' : '#9E9589',
          }}
        >
          Read
        </button>
        <button
          onClick={() => setBlend(1)}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: blend >= 0.5 ? '#D4B872' : '#3A3530',
            color: blend >= 0.5 ? '#1C1A18' : '#9E9589',
          }}
        >
          Map
        </button>
      </div>

      {/* Transition indicator */}
      {isTransitioning && (
        <div
          className="absolute top-4 left-1/2"
          style={{
            transform: 'translateX(-50%)',
            zIndex: 50,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 11,
            color: '#6B6560',
            letterSpacing: 1,
          }}
        >
          {blend < 0.5 ? 'READ' : 'MAP'} mode
        </div>
      )}
    </div>
  )
}
