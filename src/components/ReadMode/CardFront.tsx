import type { CosmosPost } from '../../lib/types'
import { getEmotionColors } from '../shared/EmotionPalette'
import { formatTimeAgo } from '../../lib/timeFormat'

interface CardFrontProps {
  post: CosmosPost
}

export default function CardFront({ post }: CardFrontProps) {
  const colors = getEmotionColors(post.emotion)

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: 12,
        boxShadow:
          '0 4px 24px rgba(28, 26, 24, 0.18), 0 1px 4px rgba(28, 26, 24, 0.10)',
        color: colors.text,
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {/* Left accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: 3,
          backgroundColor: colors.accent,
          borderRadius: '12px 0 0 12px',
        }}
      />

      {/* Card content */}
      <div className="flex flex-col h-full px-6 py-5 pl-7">
        {/* Core claim headline */}
        <h2
          className="font-bold leading-snug mb-3"
          style={{ fontSize: 20, lineHeight: 1.3 }}
        >
          {post.core_claim}
        </h2>

        {/* Full content */}
        <p
          className="flex-1 overflow-y-auto mb-4 leading-relaxed"
          style={{ fontSize: 15, opacity: 0.88, lineHeight: 1.65 }}
        >
          {post.content}
        </p>

        {/* Assumptions as pills */}
        {post.assumptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.assumptions.map((assumption, i) => (
              <span
                key={i}
                className="inline-block px-2.5 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: `${colors.accent}22`,
                  color: colors.text,
                  border: `1px solid ${colors.accent}44`,
                  fontSize: 11,
                }}
              >
                {assumption}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row: tags + meta */}
        <div className="flex items-center justify-between pt-2 border-t"
          style={{ borderColor: `${colors.accent}30` }}
        >
          {/* Emotion + post_type tags */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${colors.accent}30`,
                color: colors.text,
                fontSize: 11,
              }}
            >
              {post.emotion}
            </span>
            <span
              className="inline-block px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${colors.accent}18`,
                color: `${colors.text}CC`,
                fontSize: 11,
              }}
            >
              {post.post_type}
            </span>
          </div>

          {/* Author + timestamp + upvotes */}
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: `${colors.text}AA`, fontSize: 11 }}
          >
            <span>{post.author}</span>
            {formatTimeAgo(post.created_at) && (
              <span style={{ color: `${colors.text}66` }}>{formatTimeAgo(post.created_at)}</span>
            )}
            <span className="flex items-center gap-0.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              {post.upvotes}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
