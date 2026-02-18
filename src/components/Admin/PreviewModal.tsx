import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { API_BASE } from '../../lib/api'

interface PreviewCluster {
  id: string
  label: string
  summary: string
  postCount: number
  samplePosts: {
    id: string
    content: string
    stance: string
    emotion: string
  }[]
}

interface PreviewData {
  topic: string
  topicKey: string
  clusters: PreviewCluster[]
  gaps: { description: string; why_it_matters: string }[]
  stanceLabels: string[]
  themeLabels: string[]
  totalPosts: number
  processingTime: number
  spatialSummary: string
}

const S = {
  bg: 'rgba(38, 34, 32, 0.95)',
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  gold: '#D4B872',
  sage: '#8FB8A0',
  coral: '#E8836B',
  lavender: '#9B8FB8',
}

export default function PreviewModal({ topicKey, onClose }: { topicKey: string; onClose: () => void }) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/preview/${encodeURIComponent(topicKey)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [topicKey])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, maxHeight: '80vh',
          overflow: 'auto',
          backgroundColor: '#2A2724',
          borderRadius: 16,
          border: `1px solid ${S.border}`,
          padding: 32,
        }}
      >
        {error && (
          <div style={{ color: S.coral, textAlign: 'center', padding: 20 }}>
            Failed to load preview: {error}
          </div>
        )}

        {!data && !error && (
          <div style={{ color: S.textMuted, textAlign: 'center', padding: 20 }}>Loading...</div>
        )}

        {data && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, color: S.text, margin: 0 }}>
                  {data.topic}
                </h2>
                <p style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>
                  {data.totalPosts} posts &middot; {data.clusters.length} clusters &middot; {(data.processingTime / 1000).toFixed(1)}s
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${S.border}`, backgroundColor: 'transparent',
                  color: S.textMuted, fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                x
              </button>
            </div>

            {/* Spatial summary */}
            {data.spatialSummary && (
              <div style={{
                padding: '16px 20px', borderRadius: 10,
                backgroundColor: S.cardBg, border: `1px solid ${S.border}`,
                marginBottom: 24, fontSize: 14, lineHeight: 1.6, color: S.textMuted,
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
              }}>
                {data.spatialSummary}
              </div>
            )}

            {/* Stances + Themes */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              {data.stanceLabels.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Stances
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {data.stanceLabels.map((s) => (
                      <span key={s} style={{
                        padding: '3px 10px', borderRadius: 4, fontSize: 11,
                        backgroundColor: 'rgba(212, 184, 114, 0.1)', color: S.gold,
                        border: '1px solid rgba(212, 184, 114, 0.15)',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.themeLabels.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Themes
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {data.themeLabels.map((t) => (
                      <span key={t} style={{
                        padding: '3px 10px', borderRadius: 4, fontSize: 11,
                        backgroundColor: 'rgba(155, 143, 184, 0.1)', color: S.lavender,
                        border: '1px solid rgba(155, 143, 184, 0.15)',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clusters */}
            <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Clusters
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {data.clusters.map((cluster) => (
                <div key={cluster.id} style={{
                  padding: '16px 20px', borderRadius: 10,
                  backgroundColor: S.cardBg, border: `1px solid ${S.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{cluster.label}</span>
                    <span style={{ fontSize: 12, color: S.textMuted }}>{cluster.postCount} posts</span>
                  </div>
                  <p style={{ fontSize: 13, color: S.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
                    {cluster.summary}
                  </p>
                  {cluster.samplePosts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cluster.samplePosts.map((post) => (
                        <div key={post.id} style={{
                          padding: '10px 14px', borderRadius: 8,
                          backgroundColor: 'rgba(245, 242, 239, 0.03)',
                          border: `1px solid rgba(245, 242, 239, 0.05)`,
                          fontSize: 12, lineHeight: 1.5, color: S.textMuted,
                        }}>
                          <span style={{ color: S.sage, fontSize: 11 }}>{post.stance}</span>
                          {' · '}
                          <span style={{ color: S.coral, fontSize: 11 }}>{post.emotion}</span>
                          <p style={{ margin: '4px 0 0' }}>{post.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Gaps */}
            {data.gaps.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Gaps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.gaps.map((gap, i) => (
                    <div key={i} style={{
                      padding: '14px 18px', borderRadius: 10,
                      backgroundColor: S.cardBg, border: `1px solid ${S.border}`,
                    }}>
                      <div style={{ fontSize: 13, color: S.text, marginBottom: 4 }}>{gap.description}</div>
                      <div style={{ fontSize: 12, color: S.textMuted }}>{gap.why_it_matters}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
