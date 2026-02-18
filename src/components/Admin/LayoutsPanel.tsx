import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../../lib/api'
import PreviewModal from './PreviewModal'

interface LayoutEntry {
  topicKey: string
  topic: string
  postCount: number
  clusterCount: number
  storedAt: string
}

const S = {
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  gold: '#D4B872',
  red: '#E8836B',
  sage: '#8FB8A0',
}

export default function LayoutsPanel() {
  const [layouts, setLayouts] = useState<LayoutEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [regenProgress, setRegenProgress] = useState<{ stage: string; percent: number } | null>(null)

  const fetchLayouts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/layouts`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLayouts(data.layouts || [])
    } catch (err) {
      console.error('Failed to fetch layouts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLayouts() }, [fetchLayouts])

  const handleRegenerate = async (key: string) => {
    if (!confirm(`Regenerate layout "${key}"? This will delete the current version and re-run the full pipeline.`)) return
    setRegenerating(key)
    setRegenProgress({ stage: 'Starting...', percent: 0 })
    try {
      const res = await fetch(`${API_BASE}/api/admin/regenerate/${encodeURIComponent(key)}`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                console.error('Regeneration error:', data.error)
              } else {
                setRegenProgress({ stage: data.stage || '', percent: data.percent || 0 })
              }
            } catch { /* skip */ }
          }
        }
      }

      // Refresh layouts list
      await fetchLayouts()
    } catch (err) {
      console.error('Regeneration failed:', err)
    } finally {
      setRegenerating(null)
      setRegenProgress(null)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete layout "${key}" and all its posts?`)) return
    setDeleting(key)
    try {
      const res = await fetch(`${API_BASE}/api/admin/layouts/${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (res.ok) {
        setLayouts((prev) => prev.filter((l) => l.topicKey !== key))
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: S.textMuted }}>Loading...</div>
  }

  if (layouts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: S.textMuted }}>
        <p style={{ fontSize: 16, marginBottom: 8 }}>No layouts stored</p>
        <p style={{ fontSize: 13 }}>Generate one using the Generate tab</p>
      </div>
    )
  }

  return (
    <>
      <div style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${S.border}`,
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
          padding: '12px 20px',
          backgroundColor: 'rgba(245, 242, 239, 0.03)',
          borderBottom: `1px solid ${S.border}`,
          fontSize: 11,
          color: S.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          <span>Topic</span>
          <span>Posts</span>
          <span>Clusters</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        {/* Rows */}
        <AnimatePresence>
          {layouts.map((layout) => (
            <motion.div
              key={layout.topicKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                padding: '14px 20px',
                borderBottom: `1px solid ${S.border}`,
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span style={{ color: S.text, fontWeight: 500 }}>{layout.topic}</span>
              <span style={{ color: S.textMuted }}>{layout.postCount}</span>
              <span style={{ color: S.textMuted }}>{layout.clusterCount}</span>
              <span style={{ color: S.textMuted }}>
                {layout.storedAt ? new Date(layout.storedAt).toLocaleDateString() : '—'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPreviewKey(layout.topicKey)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12,
                    border: `1px solid ${S.border}`, backgroundColor: 'transparent',
                    color: S.sage, cursor: 'pointer',
                  }}
                >
                  Preview
                </button>
                <button
                  onClick={() => handleRegenerate(layout.topicKey)}
                  disabled={regenerating !== null}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12,
                    border: `1px solid ${S.border}`, backgroundColor: 'transparent',
                    color: S.gold, cursor: regenerating ? 'not-allowed' : 'pointer',
                    opacity: regenerating === layout.topicKey ? 1 : regenerating ? 0.4 : 1,
                  }}
                >
                  {regenerating === layout.topicKey ? `${regenProgress?.percent ?? 0}%` : 'Regen'}
                </button>
                <button
                  onClick={() => handleDelete(layout.topicKey)}
                  disabled={deleting === layout.topicKey || regenerating !== null}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12,
                    border: `1px solid ${S.border}`, backgroundColor: 'transparent',
                    color: S.red, cursor: 'pointer',
                    opacity: deleting === layout.topicKey ? 0.5 : 1,
                  }}
                >
                  {deleting === layout.topicKey ? '...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Regeneration progress */}
      {regenerating && regenProgress && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            padding: '16px 20px',
            borderRadius: 10,
            backgroundColor: S.cardBg,
            border: `1px solid ${S.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: S.text }}>
              Regenerating: {regenProgress.stage}
            </span>
            <span style={{ fontSize: 12, color: S.textMuted }}>{regenProgress.percent}%</span>
          </div>
          <div style={{
            width: '100%', height: 4, borderRadius: 2,
            backgroundColor: 'rgba(245, 242, 239, 0.08)',
            overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${regenProgress.percent}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', backgroundColor: S.gold, borderRadius: 2 }}
            />
          </div>
        </motion.div>
      )}

      {/* Preview modal */}
      {previewKey && (
        <PreviewModal topicKey={previewKey} onClose={() => setPreviewKey(null)} />
      )}
    </>
  )
}
