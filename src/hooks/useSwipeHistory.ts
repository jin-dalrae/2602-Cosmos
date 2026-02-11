import { useState, useCallback, useMemo } from 'react'
import type { Reaction, SwipeEvent } from '../lib/types'

interface SwipeStats {
  agrees: number
  disagrees: number
  deepers: number
  flips: number
}

interface SwipeHistoryReturn {
  history: SwipeEvent[]
  addSwipe: (postId: string, reaction: Reaction) => void
  stats: SwipeStats
  recentHistory: (n: number) => SwipeEvent[]
}

export function useSwipeHistory(): SwipeHistoryReturn {
  const [history, setHistory] = useState<SwipeEvent[]>([])

  const addSwipe = useCallback((postId: string, reaction: Reaction) => {
    const event: SwipeEvent = {
      postId,
      reaction,
      timestamp: Date.now(),
    }
    setHistory((prev) => [...prev, event])
  }, [])

  const stats = useMemo<SwipeStats>(() => {
    const counts: SwipeStats = {
      agrees: 0,
      disagrees: 0,
      deepers: 0,
      flips: 0,
    }

    for (const event of history) {
      switch (event.reaction) {
        case 'agree':
          counts.agrees++
          break
        case 'disagree':
          counts.disagrees++
          break
        case 'deeper':
          counts.deepers++
          break
        case 'flip':
          counts.flips++
          break
      }
    }

    return counts
  }, [history])

  const recentHistory = useCallback(
    (n: number): SwipeEvent[] => {
      return history.slice(-n)
    },
    [history],
  )

  return {
    history,
    addSwipe,
    stats,
    recentHistory,
  }
}
