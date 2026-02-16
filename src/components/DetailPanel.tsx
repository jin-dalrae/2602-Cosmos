import { useState, useEffect, useRef } from 'react'
import type { CosmosPost } from '../lib/types'
import { getEmotionColors, EDGE_COLORS } from './shared/EmotionPalette'

interface DetailPanelProps {
  post: CosmosPost
  relatedPosts: { post: CosmosPost; type: string; reason: string }[]
  replies: CosmosPost[]
  onNavigate: (postId: string) => void
  onClose: () => void
  onVote: (postId: string, dir: 'up' | 'down') => void
  userVote: 'up' | 'down' | null
  onReply: (postId: string) => void
}

export default function DetailPanel({
  post,
  relatedPosts,
  replies,
  onNavigate,
  onClose,
  onVote,
  userVote,
  onReply,
}: DetailPanelProps) {
  // Smooth cross-fade when post changes
  const [displayPost, setDisplayPost] = useState(post)
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in')
  const prevIdRef = useRef(post.id)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (post.id !== prevIdRef.current) {
      prevIdRef.current = post.id
      setFadeState('out')
      const t = setTimeout(() => {
        setDisplayPost(post)
        if (scrollRef.current) scrollRef.current.scrollTop = 0
        setFadeState('in')
      }, 150)
      return () => clearTimeout(t)
    } else {
      setDisplayPost(post)
    }
  }, [post])

  const colors = getEmotionColors(displayPost.emotion)

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        bottom: 16,
        width: 400,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.cardBg,
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {/* Accent strip */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: colors.accent,
          borderRadius: '20px 0 0 20px',
        }}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: `1px solid ${colors.accent}30`,
          backgroundColor: `${colors.accent}10`,
          color: colors.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 300,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}25` }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}10` }}
      >
        &times;
      </button>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 24px 24px 28px',
          opacity: fadeState === 'in' ? 1 : 0,
          transform: fadeState === 'in' ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        {/* Core claim */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: 12,
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: colors.text,
            paddingRight: 32,
          }}
        >
          {displayPost.core_claim}
        </div>

        {/* Author + meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: `${colors.text}99`,
            fontFamily: 'system-ui, sans-serif',
            marginBottom: 20,
          }}
        >
          <span style={{ fontWeight: 600 }}>{displayPost.author}</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: `${colors.accent}18`,
              fontSize: 12,
              color: colors.accent,
            }}
          >
            {displayPost.emotion}
          </span>
          {displayPost.post_type && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                backgroundColor: `${colors.accent}10`,
                fontSize: 12,
                color: `${colors.text}88`,
              }}
            >
              {displayPost.post_type}
            </span>
          )}
          {/* Votes */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <span
              onClick={() => onVote(displayPost.id, 'up')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 6,
                cursor: 'pointer',
                color: userVote === 'up' ? colors.accent : `${colors.text}77`,
                backgroundColor: userVote === 'up' ? `${colors.accent}18` : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>
              {displayPost.upvotes}
            </span>
            <span
              onClick={() => onVote(displayPost.id, 'down')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 6,
                cursor: 'pointer',
                color: userVote === 'down' ? '#C47A5A' : `${colors.text}77`,
                backgroundColor: userVote === 'down' ? 'rgba(196, 122, 90, 0.15)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: `${colors.accent}25`, marginBottom: 16 }} />

        {/* Full content */}
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: `${colors.text}DD`,
            margin: 0,
            paddingBottom: 16,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {displayPost.content}
        </p>

        {/* Assumptions */}
        {displayPost.assumptions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, fontFamily: 'system-ui, sans-serif',
              color: `${colors.text}66`, textTransform: 'uppercase',
              letterSpacing: 1.5, marginBottom: 6,
            }}>
              Hidden assumptions
            </div>
            {displayPost.assumptions.map((a, i) => (
              <div key={i} style={{
                padding: '8px 12px', marginBottom: 5, borderRadius: 8,
                backgroundColor: `${colors.accent}10`,
                border: `1px solid ${colors.accent}18`,
                fontSize: 13, color: `${colors.text}BB`, lineHeight: 1.5,
                fontFamily: 'Georgia, serif',
              }}>
                {a}
              </div>
            ))}
          </div>
        )}

        {/* Themes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {displayPost.themes.map((theme) => (
            <span key={theme} style={{
              padding: '3px 10px', borderRadius: 10,
              backgroundColor: `${colors.accent}12`,
              border: `1px solid ${colors.accent}20`,
              fontFamily: 'system-ui, sans-serif', fontSize: 12, color: `${colors.text}88`,
            }}>
              {theme}
            </span>
          ))}
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 1, backgroundColor: `${colors.accent}25`, marginBottom: 12 }} />
            <div style={{
              fontSize: 11, fontFamily: 'system-ui, sans-serif',
              color: `${colors.text}66`, textTransform: 'uppercase',
              letterSpacing: 1.5, marginBottom: 8,
            }}>
              Replies ({replies.length})
            </div>
            {replies.map((reply) => {
              const replyColors = getEmotionColors(reply.emotion)
              return (
                <div
                  key={reply.id}
                  onClick={() => onNavigate(reply.id)}
                  style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 8,
                    backgroundColor: `${colors.accent}08`,
                    border: `1px solid ${colors.accent}15`,
                    cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}18` }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}08` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: 'system-ui' }}>
                      {reply.author}
                    </span>
                    <span style={{
                      padding: '2px 6px', borderRadius: 5,
                      backgroundColor: `${replyColors.accent}18`,
                      fontSize: 11, color: replyColors.accent,
                    }}>
                      {reply.emotion}
                    </span>
                    <span style={{ fontSize: 12, color: `${colors.text}77`, fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                      {reply.upvotes}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: `${colors.text}CC`, lineHeight: 1.5 }}>
                    {reply.content}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Reply button */}
        <button
          onClick={() => onReply(displayPost.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            marginBottom: 16,
            borderRadius: 8,
            border: `1px solid ${colors.accent}30`,
            backgroundColor: `${colors.accent}10`,
            color: colors.accent,
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}25` }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}10` }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Reply
        </button>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, fontFamily: 'system-ui, sans-serif',
              color: `${colors.text}66`, textTransform: 'uppercase',
              letterSpacing: 1.5, marginBottom: 6,
            }}>
              Connected posts
            </div>
            {relatedPosts.slice(0, 3).map(({ post: rp, type }) => {
              const edgeColor = EDGE_COLORS[type as keyof typeof EDGE_COLORS] ?? `${colors.text}88`
              return (
                <div
                  key={rp.id}
                  onClick={() => onNavigate(rp.id)}
                  style={{
                    padding: '10px 12px', marginBottom: 5, borderRadius: 8,
                    border: `1px solid ${colors.accent}15`,
                    backgroundColor: `${colors.accent}08`,
                    cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}18` }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}08` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: edgeColor, fontFamily: 'system-ui', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {type.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 12, color: `${colors.text}77`, fontFamily: 'system-ui' }}>{rp.author}</span>
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: `${colors.text}BB`, lineHeight: 1.4 }}>
                    {rp.core_claim}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
