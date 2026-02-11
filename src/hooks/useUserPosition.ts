import { useMemo } from 'react'
import type { SwipeEvent, CosmosLayout, UserPosition } from '../lib/types'

const MIN_SWIPES = 5

/**
 * Computes the user's ideological position in the cosmos based on their
 * swipe history. Agrees pull toward a post's position (weighted by importance),
 * disagrees push away. Returns null if fewer than 5 swipes or no layout.
 */
export default function useUserPosition(
  swipeHistory: SwipeEvent[],
  layout: CosmosLayout | null,
): UserPosition | null {
  return useMemo(() => {
    if (!layout || swipeHistory.length < MIN_SWIPES) return null

    const postMap = new Map(layout.posts.map((p) => [p.id, p]))

    // Accumulate weighted position vector
    let wx = 0
    let wy = 0
    let wz = 0
    let totalWeight = 0

    for (const event of swipeHistory) {
      const post = postMap.get(event.postId)
      if (!post) continue

      const weight = post.importance
      const [px, py, pz] = post.position

      if (event.reaction === 'agree') {
        // Pull toward this post
        wx += px * weight
        wy += py * weight
        wz += pz * weight
        totalWeight += weight
      } else if (event.reaction === 'disagree') {
        // Push away: subtract the position vector
        wx -= px * weight
        wy -= py * weight
        wz -= pz * weight
        totalWeight += weight
      }
      // 'deeper' and 'flip' do not affect position
    }

    if (totalWeight === 0) return null

    const position: [number, number, number] = [
      wx / totalWeight,
      wy / totalWeight,
      wz / totalWeight,
    ]

    // Find nearest cluster by euclidean distance
    let nearestCluster = layout.clusters[0]?.id ?? ''
    let minDist = Infinity

    for (const cluster of layout.clusters) {
      const [cx, cy, cz] = cluster.center
      const dist = Math.sqrt(
        (position[0] - cx) ** 2 +
        (position[1] - cy) ** 2 +
        (position[2] - cz) ** 2,
      )
      if (dist < minDist) {
        minDist = dist
        nearestCluster = cluster.id
      }
    }

    // Compute stance scores: for each stance label, count agrees vs disagrees
    const stanceScores: Record<string, number> = {}

    for (const label of layout.metadata.stance_labels) {
      stanceScores[label] = 0
    }

    for (const event of swipeHistory) {
      const post = postMap.get(event.postId)
      if (!post) continue

      const stance = post.stance
      if (!(stance in stanceScores)) {
        stanceScores[stance] = 0
      }

      if (event.reaction === 'agree') {
        stanceScores[stance] += 1
      } else if (event.reaction === 'disagree') {
        stanceScores[stance] -= 1
      }
    }

    return {
      position,
      nearest_cluster: nearestCluster,
      stance_scores: stanceScores,
      swipe_count: swipeHistory.length,
    }
  }, [swipeHistory, layout])
}
