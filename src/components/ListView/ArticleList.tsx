import { useState, useMemo } from 'react'
import type { CosmosPost } from '../../lib/types'
import { getEmotionColors } from '../shared/EmotionPalette'

type SortKey = 'upvotes' | 'emotion' | 'author'

interface ArticleListProps {
  posts: CosmosPost[]
  votes: Map<string, 'up' | 'down'>
  onVote: (postId: string, dir: 'up' | 'down') => void
  onReply: (postId: string) => void
}

export default function ArticleList({ posts, votes, onVote, onReply }: ArticleListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('upvotes')

  const sortedPosts = useMemo(() => {
    const topLevel = posts.filter((p) => !p.parent_id)
    const sorted = [...topLevel]
    switch (sortKey) {
      case 'upvotes':
        sorted.sort((a, b) => b.upvotes - a.upvotes)
        break
      case 'emotion':
        sorted.sort((a, b) => a.emotion.localeCompare(b.emotion))
        break
      case 'author':
        sorted.sort((a, b) => a.author.localeCompare(b.author))
        break
    }
    return sorted
  }, [posts, sortKey])

  const repliesMap = useMemo(() => {
    const map = new Map<string, CosmosPost[]>()
    for (const p of posts) {
      if (p.parent_id) {
        const arr = map.get(p.parent_id) ?? []
        arr.push(p)
        map.set(p.parent_id, arr)
      }
    }
    // Sort replies by upvotes
    for (const arr of map.values()) {
      arr.sort((a, b) => b.upvotes - a.upvotes)
    }
    return map
  }, [posts])

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#262220',
      overflowY: 'auto',
      zIndex: 5,
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 24px',
        background: 'rgba(38, 34, 32, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #3A3530',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'Georgia, serif', fontSize: 16, color: '#F5F2EF',
        }}>
          {sortedPosts.length} articles
        </span>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            background: '#1C1A18',
            color: '#9E9589',
            border: '1px solid #3A3530',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="upvotes">Sort by votes</option>
          <option value="emotion">Sort by emotion</option>
          <option value="author">Sort by author</option>
        </select>
      </div>

      {/* Post list */}
      <div style={{ padding: '12px 24px 80px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedPosts.map((post) => {
          const isExpanded = expandedId === post.id
          const colors = getEmotionColors(post.emotion)
          const userVote = votes.get(post.id) ?? null
          const replies = repliesMap.get(post.id) ?? []

          return (
            <article
              key={post.id}
              style={{
                borderRadius: 10,
                background: '#1C1A18',
                border: '1px solid #3A3530',
                borderLeft: `3px solid ${colors.accent}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Compact row — always visible */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : post.id)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {/* Accent dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: colors.accent, flexShrink: 0,
                }} />

                {/* Title / claim */}
                <span style={{
                  flex: 1,
                  fontFamily: 'Georgia, serif',
                  fontSize: 14,
                  color: '#F5F2EF',
                  lineHeight: 1.4,
                }}>
                  {post.core_claim}
                </span>

                {/* Meta chips */}
                <span style={{
                  fontSize: 11, fontFamily: 'system-ui, sans-serif',
                  color: colors.accent, backgroundColor: `${colors.accent}18`,
                  padding: '2px 8px', borderRadius: 4, flexShrink: 0,
                }}>
                  {post.emotion}
                </span>

                <span style={{
                  fontSize: 11, fontFamily: 'system-ui, sans-serif',
                  color: '#9E9589', flexShrink: 0, minWidth: 24, textAlign: 'right',
                }}>
                  {post.upvotes}
                </span>

                <span style={{
                  fontSize: 11, color: '#6B6560', flexShrink: 0,
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {post.author}
                </span>

                {/* Chevron */}
                <svg
                  width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke="#6B6560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Expanded content */}
              <div style={{
                maxHeight: isExpanded ? 2000 : 0,
                opacity: isExpanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s ease, opacity 0.25s ease',
              }}>
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid #2A2826',
                }}>
                  {/* Full content */}
                  <p style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 14, lineHeight: 1.7,
                    color: '#D4D0CC', marginTop: 14,
                  }}>
                    {post.content}
                  </p>

                  {/* Assumptions */}
                  {post.assumptions.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'system-ui, sans-serif',
                        color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        Assumptions
                      </span>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                        {post.assumptions.map((a, i) => (
                          <li key={i} style={{
                            fontSize: 12, color: '#9E9589',
                            fontFamily: 'system-ui, sans-serif', lineHeight: 1.5,
                          }}>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Themes */}
                  {post.themes.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {post.themes.map((t, i) => (
                        <span key={i} style={{
                          fontSize: 11, fontFamily: 'system-ui, sans-serif',
                          color: '#9E9589', backgroundColor: '#2A2826',
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action row: vote + reply */}
                  <div style={{
                    marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onVote(post.id, 'up') }}
                      style={{
                        ...btnStyle,
                        color: userVote === 'up' ? '#D4B872' : '#6B6560',
                        borderColor: userVote === 'up' ? '#D4B87240' : '#3A3530',
                      }}
                    >
                      <Arrow up /> {post.upvotes}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onVote(post.id, 'down') }}
                      style={{
                        ...btnStyle,
                        color: userVote === 'down' ? '#C47A5A' : '#6B6560',
                        borderColor: userVote === 'down' ? '#C47A5A40' : '#3A3530',
                      }}
                    >
                      <Arrow up={false} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); onReply(post.id) }}
                      style={{ ...btnStyle, color: '#9E9589', marginLeft: 'auto' }}
                    >
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      Reply
                    </button>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'system-ui, sans-serif',
                        color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {replies.map((r) => {
                          const rc = getEmotionColors(r.emotion)
                          return (
                            <div key={r.id} style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              background: '#262220',
                              borderLeft: `2px solid ${rc.accent}`,
                            }}>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                              }}>
                                <span style={{
                                  fontSize: 12, fontFamily: 'system-ui, sans-serif',
                                  color: '#9E9589', fontWeight: 600,
                                }}>
                                  {r.author}
                                </span>
                                <span style={{
                                  fontSize: 10, color: rc.accent,
                                  backgroundColor: `${rc.accent}18`,
                                  padding: '1px 6px', borderRadius: 3,
                                  fontFamily: 'system-ui, sans-serif',
                                }}>
                                  {r.emotion}
                                </span>
                              </div>
                              <p style={{
                                fontSize: 13, color: '#D4D0CC',
                                fontFamily: 'Georgia, serif', lineHeight: 1.5,
                                margin: 0,
                              }}>
                                {r.content}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

// ── Inline styles & small components ──

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 6,
  border: '1px solid #3A3530',
  background: 'transparent',
  fontSize: 12, fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
}

function Arrow({ up }: { up: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: up ? 'none' : 'rotate(180deg)' }}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}
