import { useState, useCallback, useMemo } from 'react'
import type { CosmosPost, Cluster, SwipeDirection, Reaction } from '../lib/types'
import { selectNextCard } from '../lib/antiEchoChamber'

const DIRECTION_TO_REACTION: Record<SwipeDirection, Reaction> = {
  right: 'agree',
  left: 'disagree',
  down: 'deeper',
  up: 'flip',
}

interface CardNavigationReturn {
  currentPost: CosmosPost | null
  nextPosts: CosmosPost[]
  handleSwipe: (postId: string, direction: SwipeDirection) => void
  canGoBack: boolean
  goBack: () => void
}

export function useCardNavigation(
  posts: CosmosPost[],
  clusters: Cluster[],
): CardNavigationReturn {
  // Posts sorted by importance descending
  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => b.importance - a.importance),
    [posts],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  // Overrides hold the reordered post sequence when anti-echo-chamber kicks in
  const [overrideQueue, setOverrideQueue] = useState<CosmosPost[]>([])

  const currentPost = useMemo(() => {
    if (overrideQueue.length > 0) {
      return overrideQueue[0] ?? null
    }
    return sortedPosts[currentIndex] ?? null
  }, [sortedPosts, currentIndex, overrideQueue])

  const nextPosts = useMemo(() => {
    if (overrideQueue.length > 1) {
      // Show the next items from the override queue, padded with sorted posts
      const fromQueue = overrideQueue.slice(1, 3)
      if (fromQueue.length < 3) {
        const queueIds = new Set(overrideQueue.map((p) => p.id))
        const extra = sortedPosts
          .filter((p) => !queueIds.has(p.id))
          .slice(0, 3 - fromQueue.length)
        return [...fromQueue, ...extra]
      }
      return fromQueue
    }

    // Default: show next posts by importance
    const start = currentIndex + 1
    return sortedPosts.slice(start, start + 3)
  }, [sortedPosts, currentIndex, overrideQueue])

  // Build the display list: current + next (up to 3 total)
  const displayPosts = useMemo(() => {
    if (!currentPost) return []
    return [currentPost, ...nextPosts].slice(0, 3)
  }, [currentPost, nextPosts])

  const handleSwipe = useCallback(
    (postId: string, direction: SwipeDirection) => {
      const reaction = DIRECTION_TO_REACTION[direction]

      // Find the swiped post
      const swipedPost =
        overrideQueue.find((p) => p.id === postId) ??
        sortedPosts.find((p) => p.id === postId)

      if (!swipedPost) return

      // Save current state to history for back navigation
      setHistory((prev) => [...prev, currentIndex])

      // Use anti-echo-chamber to select next card
      const nextCard = selectNextCard(swipedPost, reaction, sortedPosts, clusters)

      if (nextCard) {
        // Build a new queue starting with the selected card
        const seenIds = new Set([swipedPost.id, nextCard.id])
        const remaining = sortedPosts.filter((p) => !seenIds.has(p.id))

        setOverrideQueue([nextCard, ...remaining])
      } else {
        // Fallback: advance to the next card by importance
        if (overrideQueue.length > 1) {
          setOverrideQueue((prev) => prev.slice(1))
        } else {
          setOverrideQueue([])
          setCurrentIndex((prev) => Math.min(prev + 1, sortedPosts.length - 1))
        }
      }
    },
    [sortedPosts, clusters, currentIndex, overrideQueue],
  )

  const canGoBack = history.length > 0

  const goBack = useCallback(() => {
    if (history.length === 0) return

    const prevIndex = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setOverrideQueue([])
    setCurrentIndex(prevIndex)
  }, [history])

  return {
    currentPost,
    nextPosts: displayPosts,
    handleSwipe,
    canGoBack,
    goBack,
  }
}
