import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { UserPosition, CosmosLayout } from '../../lib/types'
import { UI_COLORS, BG_DARK, CLUSTER_COLORS } from '../shared/EmotionPalette'

interface ConstellationCardProps {
  userPosition: UserPosition
  layout: CosmosLayout
}

interface Contradiction {
  clusterLabel: string
  agreedCount: number
}

export default function ConstellationCard({ userPosition, layout }: ConstellationCardProps) {
  const nearestCluster = useMemo(
    () => layout.clusters.find((c) => c.id === userPosition.nearest_cluster),
    [layout.clusters, userPosition.nearest_cluster],
  )

  const clusterColorIndex = useMemo(() => {
    const idx = layout.clusters.findIndex((c) => c.id === userPosition.nearest_cluster)
    return idx >= 0 ? idx : 0
  }, [layout.clusters, userPosition.nearest_cluster])

  const clusterColor = CLUSTER_COLORS[clusterColorIndex % CLUSTER_COLORS.length]

  // Compute swipe stats
  const { agrees, disagrees } = useMemo(() => {
    const scores = userPosition.stance_scores
    let totalAgrees = 0
    let totalDisagrees = 0
    for (const val of Object.values(scores)) {
      if (val > 0) totalAgrees += val
      else totalDisagrees += Math.abs(val)
    }
    return { agrees: totalAgrees, disagrees: totalDisagrees }
  }, [userPosition.stance_scores])

  // Stance breakdown for bar chart
  const stanceEntries = useMemo(() => {
    const entries = Object.entries(userPosition.stance_scores)
    // Find max absolute value for scaling
    const maxAbs = Math.max(1, ...entries.map(([, v]) => Math.abs(v)))
    return entries.map(([label, value]) => ({
      label,
      value,
      width: Math.abs(value) / maxAbs,
    }))
  }, [userPosition.stance_scores])

  // Find contradictions: agreed posts from clusters that are not the user's nearest cluster
  const contradictions = useMemo(() => {
    const postMap = new Map(layout.posts.map((p) => [p.id, p]))
    const clusterAgreeCounts: Record<string, number> = {}

    // We don't have the swipe history directly, but we can infer from stance_scores:
    // stances with positive scores are stances the user tends to agree with.
    // Instead, look at cluster memberships vs the nearest cluster to find contradictions.
    // A contradiction: clusters other than nearest that the user agreed with posts from.
    // Since we only have stance_scores, we infer: if a cluster's dominant stance has a
    // positive score, the user has agreed with that cluster's viewpoint.
    for (const cluster of layout.clusters) {
      if (cluster.id === userPosition.nearest_cluster) continue

      // Find the dominant stance of this cluster
      const clusterPosts = cluster.post_ids
        .map((id) => postMap.get(id))
        .filter((p) => p !== undefined)

      const stanceCounts: Record<string, number> = {}
      for (const post of clusterPosts) {
        stanceCounts[post.stance] = (stanceCounts[post.stance] ?? 0) + 1
      }

      // Get dominant stance
      let dominantStance = ''
      let maxCount = 0
      for (const [stance, count] of Object.entries(stanceCounts)) {
        if (count > maxCount) {
          maxCount = count
          dominantStance = stance
        }
      }

      // If user agrees with this cluster's dominant stance, it is a contradiction
      const score = userPosition.stance_scores[dominantStance] ?? 0
      if (score > 0 && dominantStance) {
        clusterAgreeCounts[cluster.label] = score
      }
    }

    const result: Contradiction[] = Object.entries(clusterAgreeCounts).map(
      ([label, count]) => ({ clusterLabel: label, agreedCount: count }),
    )

    return result.sort((a, b) => b.agreedCount - a.agreedCount)
  }, [layout, userPosition])

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full max-w-sm rounded-xl p-5"
      style={{
        backgroundColor: BG_DARK,
        border: `1px solid ${clusterColor}40`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${clusterColor}15`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span
            className="block text-xs uppercase tracking-wider font-medium mb-1"
            style={{ color: '#D4B872', fontSize: 10 }}
          >
            Your Position
          </span>
          <h3
            className="text-base font-semibold leading-snug"
            style={{
              color: UI_COLORS.textPrimary,
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            You&apos;re closest to{' '}
            <span style={{ color: clusterColor }}>
              {nearestCluster?.label ?? 'Unknown'}
            </span>
          </h3>
        </div>
        <div
          className="w-3 h-3 rounded-full mt-1"
          style={{
            backgroundColor: clusterColor,
            boxShadow: `0 0 8px ${clusterColor}60`,
          }}
        />
      </div>

      {/* Cluster summary */}
      {nearestCluster && (
        <p
          className="text-xs leading-relaxed mb-4"
          style={{
            color: UI_COLORS.textMuted,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {nearestCluster.summary}
        </p>
      )}

      {/* Swipe stats */}
      <div
        className="flex items-center gap-4 mb-4 px-3 py-2 rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#8FB8A0' }}
          />
          <span className="text-xs" style={{ color: UI_COLORS.textSecondary }}>
            {agrees} agrees
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#C47A5A' }}
          />
          <span className="text-xs" style={{ color: UI_COLORS.textSecondary }}>
            {disagrees} disagrees
          </span>
        </div>
        <span
          className="text-xs ml-auto"
          style={{ color: UI_COLORS.textMuted }}
        >
          {userPosition.swipe_count} total
        </span>
      </div>

      {/* Stance breakdown bar chart */}
      {stanceEntries.length > 0 && (
        <div className="mb-4">
          <span
            className="block text-xs uppercase tracking-wider font-medium mb-2"
            style={{ color: UI_COLORS.textMuted, fontSize: 10 }}
          >
            Stance Breakdown
          </span>
          <div className="flex flex-col gap-1.5">
            {stanceEntries.map((entry) => (
              <div key={entry.label} className="flex items-center gap-2">
                <span
                  className="text-xs truncate"
                  style={{
                    color: UI_COLORS.textSecondary,
                    width: 80,
                    flexShrink: 0,
                    fontSize: 11,
                  }}
                >
                  {entry.label}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.width * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: entry.value >= 0 ? '#8FB8A0' : '#C47A5A',
                    }}
                  />
                </div>
                <span
                  className="text-xs tabular-nums"
                  style={{
                    color: entry.value >= 0 ? '#8FB8A0' : '#C47A5A',
                    width: 24,
                    textAlign: 'right',
                    fontSize: 11,
                  }}
                >
                  {entry.value > 0 ? '+' : ''}{entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {contradictions.length > 0 && (
        <div
          className="rounded-lg p-3"
          style={{
            backgroundColor: 'rgba(212, 184, 114, 0.06)',
            border: '1px solid rgba(212, 184, 114, 0.12)',
          }}
        >
          <span
            className="block text-xs uppercase tracking-wider font-medium mb-1.5"
            style={{ color: '#D4B872', fontSize: 10 }}
          >
            Interesting Contradictions
          </span>
          <p
            className="text-xs leading-relaxed"
            style={{
              color: UI_COLORS.textSecondary,
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            You also agreed with ideas from{' '}
            {contradictions
              .slice(0, 3)
              .map((c) => c.clusterLabel)
              .join(', ')}
            {' '}&mdash; clusters with a different perspective from your home base.
          </p>
        </div>
      )}
    </motion.div>
  )
}
