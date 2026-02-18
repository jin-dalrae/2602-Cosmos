import { useState } from 'react'
import { motion } from 'framer-motion'
import { API_BASE } from '../../lib/api'

const S = {
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  gold: '#D4B872',
  red: '#E8836B',
  sage: '#8FB8A0',
}

export default function CachePanel() {
  const [result, setResult] = useState<Record<string, string> | null>(null)
  const [clearing, setClearing] = useState<string | null>(null)

  const clearCache = async (targets: string[]) => {
    const label = targets.join('+')
    if (!confirm(`Clear ${label} cache? This cannot be undone.`)) return
    setClearing(label)
    try {
      const res = await fetch(`${API_BASE}/api/admin/cache/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data.results)
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Failed' })
    } finally {
      setClearing(null)
    }
  }

  const actions = [
    {
      title: 'File Cache',
      description: 'Cached JSON layout files stored on disk. Safe to clear — layouts will be regenerated on next request.',
      targets: ['file'],
      color: S.gold,
    },
    {
      title: 'MongoDB',
      description: 'All stored layouts and posts in the database. Clearing this removes all generated content.',
      targets: ['mongo'],
      color: S.red,
    },
    {
      title: 'Everything',
      description: 'Clear both file cache and MongoDB. Full reset.',
      targets: ['file', 'mongo'],
      color: S.red,
    },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {actions.map((action, i) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: '24px',
              borderRadius: 12,
              backgroundColor: S.cardBg,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${S.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: S.text, marginBottom: 8 }}>
                {action.title}
              </h3>
              <p style={{ fontSize: 13, color: S.textMuted, lineHeight: 1.5, marginBottom: 20 }}>
                {action.description}
              </p>
            </div>
            <button
              onClick={() => clearCache(action.targets)}
              disabled={clearing !== null}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: `1px solid ${action.color}30`,
                backgroundColor: `${action.color}10`,
                color: action.color,
                fontSize: 13,
                fontWeight: 500,
                cursor: clearing ? 'not-allowed' : 'pointer',
                opacity: clearing ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {clearing === action.targets.join('+') ? 'Clearing...' : `Clear ${action.title}`}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 24,
            padding: '16px 20px',
            borderRadius: 10,
            backgroundColor: S.cardBg,
            border: `1px solid ${S.border}`,
          }}
        >
          <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Results
          </div>
          {Object.entries(result).map(([key, value]) => (
            <div key={key} style={{ fontSize: 13, color: S.text, marginBottom: 4 }}>
              <span style={{ color: S.sage, fontWeight: 500 }}>{key}:</span>{' '}
              {value}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
