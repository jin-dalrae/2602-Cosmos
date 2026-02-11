import type { CosmosPost, Cluster } from '../../lib/types'
import { getEmotionColors, EMOTION_PALETTE } from '../shared/EmotionPalette'

interface CardBackProps {
  post: CosmosPost
  clusters: Cluster[]
}

export default function CardBack({ post, clusters }: CardBackProps) {
  const emotionColors = getEmotionColors(post.emotion)

  // Find which cluster this post belongs to
  const homeCluster = clusters.find((c) => c.post_ids.includes(post.id))

  // Find the opposing cluster (first cluster that does NOT contain this post)
  const opposingCluster = clusters.find((c) => !c.post_ids.includes(post.id))

  // Get the opposing cluster's framing of this post's cluster
  let opposingFraming = ''
  if (homeCluster && opposingCluster) {
    // Check perceived_by on the post itself
    const perceivedEntry = post.perceived_by[opposingCluster.id]
    if (perceivedEntry) {
      opposingFraming = perceivedEntry.framing
    }
    // Fallback: check perceived_as on the opposing cluster about the home cluster
    if (!opposingFraming && opposingCluster.perceived_as[homeCluster.id]) {
      opposingFraming = opposingCluster.perceived_as[homeCluster.id]
    }
    // Last fallback: use the opposing cluster's summary
    if (!opposingFraming) {
      opposingFraming = opposingCluster.summary
    }
  }

  // Count how many posts in the opposing cluster counter this one
  const counterCount = opposingCluster ? opposingCluster.post_ids.length : 0

  // Use a slightly darker, shifted palette for the back
  const backBg = darken(emotionColors.cardBg, 0.04)
  const backAccent = EMOTION_PALETTE.analytical.accent

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: backBg,
        borderRadius: 12,
        boxShadow:
          '0 4px 24px rgba(28, 26, 24, 0.22), 0 1px 4px rgba(28, 26, 24, 0.12)',
        color: emotionColors.text,
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {/* Left accent strip (different color for back) */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: 3,
          backgroundColor: backAccent,
          borderRadius: '12px 0 0 12px',
        }}
      />

      <div className="flex flex-col h-full px-6 py-5 pl-7">
        {/* Header label */}
        <div className="flex items-center gap-2 mb-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={backAccent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span
            className="uppercase tracking-widest font-bold"
            style={{ fontSize: 11, color: backAccent }}
          >
            Perspective Shift
          </span>
        </div>

        {/* Opposing cluster name */}
        {opposingCluster ? (
          <>
            <h2
              className="font-bold leading-snug mb-2"
              style={{ fontSize: 18, lineHeight: 1.3 }}
            >
              {opposingCluster.label}
            </h2>

            {/* Their framing */}
            <div
              className="flex-1 overflow-y-auto mb-4 leading-relaxed"
              style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.65 }}
            >
              <p className="mb-3 italic">
                &ldquo;{opposingFraming}&rdquo;
              </p>

              {/* Root assumptions of opposing cluster */}
              {opposingCluster.root_assumptions.length > 0 && (
                <div className="mt-3">
                  <span
                    className="block mb-1.5 uppercase tracking-wide font-bold"
                    style={{ fontSize: 10, opacity: 0.6 }}
                  >
                    Their root assumptions
                  </span>
                  <ul className="space-y-1">
                    {opposingCluster.root_assumptions.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5"
                        style={{ fontSize: 13 }}
                      >
                        <span style={{ color: backAccent }}>&#8226;</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Counter count */}
            <div
              className="flex items-center justify-between pt-2 border-t"
              style={{ borderColor: `${backAccent}30` }}
            >
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                {counterCount} post{counterCount !== 1 ? 's' : ''} challenge
                this view
              </span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>
                Swipe down for deeper
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ fontSize: 14, opacity: 0.6 }}>
              No opposing perspective found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Simple hex color darkening utility.
 * Blends the given hex color toward black by the specified amount (0-1).
 */
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
