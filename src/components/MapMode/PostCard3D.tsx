import { useState, useCallback, useRef, useEffect } from 'react'
import { Html } from '@react-three/drei'
import type { CosmosPost } from '../../lib/types'
import { getEmotionColors, EDGE_COLORS } from '../shared/EmotionPalette'

interface PostCard3DProps {
  post: CosmosPost
  isSelected: boolean
  visibility?: number // 0–1, controls fade-in/out at cone edges
  onSelect: (postId: string) => void
  onDeselect: () => void
  relatedPosts?: { post: CosmosPost; type: string; reason: string }[]
  replies?: CosmosPost[]
  onNavigate?: (postId: string) => void
  onVote?: (postId: string, dir: 'up' | 'down') => void
  userVote?: 'up' | 'down' | null
  onReply?: (postId: string) => void
  onDragWhileSelected?: () => void
}

export default function PostCard3D({
  post,
  isSelected,
  visibility = 1,
  onSelect,
  relatedPosts,
  replies,
  onNavigate,
  onVote,
  userVote,
  onReply,
  onDragWhileSelected,
}: PostCard3DProps) {
  const [hovered, setHovered] = useState(false)
  const colors = getEmotionColors(post.emotion)
  const cardRef = useRef<HTMLDivElement>(null)
  const isSelectedRef = useRef(isSelected)
  const onDragWhileSelectedRef = useRef(onDragWhileSelected)
  isSelectedRef.current = isSelected
  onDragWhileSelectedRef.current = onDragWhileSelected

  // ── Drag passthrough: let orbit controls work even when card is under cursor ──
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    let startX = 0, startY = 0
    let dragging = false

    const onDown = (e: PointerEvent) => {
      startX = e.clientX
      startY = e.clientY
      dragging = false
    }

    const onMove = (e: PointerEvent) => {
      if (startX === 0 && startY === 0) return
      if (!dragging && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 5) {
        dragging = true
        card.style.pointerEvents = 'none'
        // Notify parent if this card was selected — collapse it
        if (isSelectedRef.current) {
          onDragWhileSelectedRef.current?.()
        }
        // Forward to canvas so OrbitControls picks up the drag
        const canvas = document.querySelector('canvas')
        if (canvas) {
          canvas.dispatchEvent(new PointerEvent('pointerdown', {
            clientX: e.clientX, clientY: e.clientY,
            bubbles: true, pointerId: e.pointerId, pointerType: e.pointerType,
          }))
        }
      }
    }

    const onUp = () => {
      startX = 0; startY = 0
      if (dragging) {
        dragging = false
        requestAnimationFrame(() => { card.style.pointerEvents = 'auto' })
      }
    }

    card.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      card.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isSelected) onSelect(post.id)
    },
    [isSelected, onSelect, post.id],
  )

  return (
    <group position={post.position}>
      <Html
        center
        transform
        sprite
        distanceFactor={50}
        occlude={false}
        style={{ pointerEvents: 'auto', width: isSelected ? 500 : 300, transition: 'width 0.35s ease' }}
        zIndexRange={isSelected ? [10000, 10000] : [0, 9999]}
      >
        <div
          ref={cardRef}
          onClick={handleClick}
          onWheel={isSelected ? (e) => e.stopPropagation() : undefined}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: isSelected ? 500 : 300,
            height: isSelected ? undefined : 200,
            maxHeight: isSelected ? 500 : 200,
            overflowY: isSelected ? 'auto' : 'hidden',
            backgroundColor: colors.cardBg,
            borderRadius: 16,
            boxShadow: isSelected
              ? `0 6px 32px rgba(28, 26, 24, 0.35), 0 0 0 2px ${colors.accent}`
              : hovered
                ? `0 6px 28px rgba(28, 26, 24, 0.3), 0 0 0 2px ${colors.accent}40`
                : '0 3px 16px rgba(28, 26, 24, 0.2)',
            color: colors.text,
            fontFamily: 'Georgia, "Times New Roman", serif',
            cursor: 'pointer',
            opacity: isSelected ? 1 : visibility,
            transform: isSelected
              ? 'scale(1)'
              : hovered
                ? `scale(${0.92 + visibility * 0.1})`
                : `scale(${0.85 + visibility * 0.15})`,
            transition: 'width 0.35s ease, max-height 0.35s ease, transform 0.4s ease, box-shadow 0.2s, opacity 0.4s ease',
            overflow: 'hidden',
            userSelect: 'none',
            position: 'relative',
          }}
        >
          {/* Accent strip */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            backgroundColor: colors.accent, borderRadius: '16px 0 0 16px',
          }} />

          {/* Header */}
          <div style={{ padding: isSelected ? '20px 24px 16px 28px' : '10px 12px 8px 14px' }}>
            <div style={{ fontSize: isSelected ? 24 : 16, fontWeight: 600, lineHeight: 1.3, marginBottom: isSelected ? 10 : 5 }}>
              {post.core_claim}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: isSelected ? 10 : 4,
              fontSize: isSelected ? 14 : 9, color: `${colors.text}99`, fontFamily: 'system-ui, sans-serif',
            }}>
              <span style={{ fontWeight: 600 }}>{post.author}</span>
              <span style={{
                padding: '2px 8px', borderRadius: 5,
                backgroundColor: `${colors.accent}18`, fontSize: isSelected ? 13 : 10, color: colors.accent,
              }}>{post.emotion}</span>
              {post.post_type && (
                <span style={{
                  padding: '2px 8px', borderRadius: 5,
                  backgroundColor: `${colors.accent}10`, fontSize: isSelected ? 13 : 10, color: `${colors.text}88`,
                }}>{post.post_type}</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                <span
                  onClick={(e) => { e.stopPropagation(); onVote?.(post.id, 'up') }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: isSelected ? 28 : 22, height: isSelected ? 28 : 22, borderRadius: 5, cursor: onVote ? 'pointer' : 'default',
                    color: userVote === 'up' ? colors.accent : `${colors.text}77`,
                    backgroundColor: userVote === 'up' ? `${colors.accent}18` : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width={isSelected ? 14 : 11} height={isSelected ? 14 : 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </span>
                <span style={{ fontSize: isSelected ? 14 : 11, fontWeight: 600, minWidth: isSelected ? 20 : 16, textAlign: 'center' }}>{post.upvotes}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); onVote?.(post.id, 'down') }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: isSelected ? 28 : 22, height: isSelected ? 28 : 22, borderRadius: 5, cursor: onVote ? 'pointer' : 'default',
                    color: userVote === 'down' ? '#C47A5A' : `${colors.text}77`,
                    backgroundColor: userVote === 'down' ? 'rgba(196, 122, 90, 0.15)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width={isSelected ? 14 : 11} height={isSelected ? 14 : 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </span>
              </span>
            </div>
          </div>

          {/* ── Expanded content (only when selected) ── */}
          {isSelected && (
            <div style={{ padding: '0 24px 24px 28px' }}>
              <div style={{ height: 1, backgroundColor: `${colors.accent}25`, marginBottom: 16 }} />

              <p style={{
                fontSize: 16, lineHeight: 1.6, color: `${colors.text}DD`, margin: 0, paddingBottom: 16,
              }}>{post.content}</p>

              {/* Assumptions */}
              {post.assumptions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'system-ui, sans-serif',
                    color: `${colors.text}66`, textTransform: 'uppercase',
                    letterSpacing: 1.3, marginBottom: 7,
                  }}>Hidden assumptions</div>
                  {post.assumptions.map((a, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', marginBottom: 5, borderRadius: 7,
                      backgroundColor: `${colors.accent}10`, border: `1px solid ${colors.accent}18`,
                      fontSize: 14, color: `${colors.text}BB`, lineHeight: 1.5,
                    }}>{a}</div>
                  ))}
                </div>
              )}

              {/* Themes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                {post.themes.map((theme) => (
                  <span key={theme} style={{
                    padding: '3px 10px', borderRadius: 10,
                    backgroundColor: `${colors.accent}12`, border: `1px solid ${colors.accent}20`,
                    fontFamily: 'system-ui, sans-serif', fontSize: 12, color: `${colors.text}88`,
                  }}>{theme}</span>
                ))}
              </div>

              {/* Replies */}
              {replies && replies.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 1, backgroundColor: `${colors.accent}25`, marginBottom: 14 }} />
                  <div style={{
                    fontSize: 11, fontFamily: 'system-ui, sans-serif',
                    color: `${colors.text}66`, textTransform: 'uppercase',
                    letterSpacing: 1.3, marginBottom: 8,
                  }}>Replies ({replies.length})</div>
                  {replies.map((reply) => {
                    const replyColors = getEmotionColors(reply.emotion)
                    return (
                      <div key={reply.id}
                        onClick={(e) => { e.stopPropagation(); onNavigate?.(reply.id) }}
                        style={{
                          padding: '12px 14px', marginBottom: 6, borderRadius: 8,
                          backgroundColor: `${colors.accent}08`, border: `1px solid ${colors.accent}15`,
                          cursor: 'pointer', transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}18` }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}08` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: 'system-ui' }}>{reply.author}</span>
                          <span style={{
                            padding: '2px 7px', borderRadius: 4,
                            backgroundColor: `${replyColors.accent}18`, fontSize: 11, color: replyColors.accent,
                          }}>{reply.emotion}</span>
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
              {onReply && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReply(post.id) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', marginBottom: 16, borderRadius: 7,
                    border: `1px solid ${colors.accent}30`, backgroundColor: `${colors.accent}10`,
                    color: colors.accent, fontSize: 13, fontFamily: 'system-ui, sans-serif',
                    fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}25` }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}10` }}
                >
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Reply
                </button>
              )}

              {/* Connected posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 11, fontFamily: 'system-ui, sans-serif',
                    color: `${colors.text}66`, textTransform: 'uppercase',
                    letterSpacing: 1.3, marginBottom: 7,
                  }}>Connected posts</div>
                  {relatedPosts.slice(0, 3).map(({ post: rp, type }) => {
                    const edgeColor = EDGE_COLORS[type as keyof typeof EDGE_COLORS] ?? `${colors.text}88`
                    return (
                      <div key={rp.id}
                        onClick={(e) => { e.stopPropagation(); onNavigate?.(rp.id) }}
                        style={{
                          padding: '10px 14px', marginBottom: 5, borderRadius: 8,
                          border: `1px solid ${colors.accent}15`, backgroundColor: `${colors.accent}08`,
                          cursor: 'pointer', transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}18` }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}08` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: edgeColor, fontFamily: 'system-ui', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            {type.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: 12, color: `${colors.text}77`, fontFamily: 'system-ui' }}>{rp.author}</span>
                        </div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: `${colors.text}BB`, lineHeight: 1.5 }}>
                          {rp.core_claim}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
