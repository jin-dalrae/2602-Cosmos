import { motion } from 'framer-motion'
import type { CosmosPost, Cluster, SwipeDirection } from '../../lib/types'
import SwipeableCard from './SwipeableCard'
import CardFront from './CardFront'

interface CardStackProps {
  posts: CosmosPost[]
  clusters: Cluster[]
  onSwipe: (postId: string, direction: SwipeDirection) => void
}

const STACK_CONFIG = [
  { scale: 1, translateY: 0 },
  { scale: 0.95, translateY: 8 },
  { scale: 0.9, translateY: 16 },
] as const

export default function CardStack({ posts, clusters, onSwipe }: CardStackProps) {
  const visiblePosts = posts.slice(0, 3)

  if (visiblePosts.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#9E9589',
          fontSize: 16,
        }}
      >
        No posts to display
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {visiblePosts.map((post, index) => {
        const config = STACK_CONFIG[index] ?? STACK_CONFIG[STACK_CONFIG.length - 1]
        const isTopCard = index === 0

        return (
          <motion.div
            key={post.id}
            className="absolute inset-0"
            style={{
              zIndex: visiblePosts.length - index,
            }}
            initial={false}
            animate={{
              scale: config.scale,
              y: config.translateY,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            {isTopCard ? (
              <SwipeableCard
                post={post}
                clusters={clusters}
                onSwipe={(direction) => onSwipe(post.id, direction)}
              />
            ) : (
              <div className="w-full h-full" style={{ borderRadius: 12, overflow: 'hidden' }}>
                <CardFront post={post} />
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
