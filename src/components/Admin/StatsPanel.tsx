import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { API_BASE } from '../../lib/api'

interface StatsData {
  totalLayouts: number
  totalPosts: number
  avgProcessingTime: number
  topics: string[]
}

const S = {
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  gold: '#D4B872',
}

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function StatsPanel() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/stats`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#E8836B' }}>Failed to load stats: {error}</div>
  }
  if (!stats) {
    return <div style={{ textAlign: 'center', padding: 40, color: S.textMuted }}>Loading...</div>
  }

  const cards = [
    { label: 'Total Layouts', value: stats.totalLayouts },
    { label: 'Total Posts', value: stats.totalPosts },
    { label: 'Avg Generation Time', value: formatMs(stats.avgProcessingTime) },
    { label: 'Topics', value: stats.topics.length },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: '20px 24px',
              borderRadius: 12,
              backgroundColor: S.cardBg,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${S.border}`,
            }}
          >
            <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: S.text, fontFamily: 'Georgia, serif' }}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {stats.topics.length > 0 && (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          backgroundColor: S.cardBg, border: `1px solid ${S.border}`,
        }}>
          <div style={{ fontSize: 13, color: S.textMuted, marginBottom: 12 }}>All Topics</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stats.topics.map((topic) => (
              <span key={topic} style={{
                padding: '4px 12px', borderRadius: 6,
                backgroundColor: 'rgba(212, 184, 114, 0.1)',
                border: '1px solid rgba(212, 184, 114, 0.2)',
                color: S.gold, fontSize: 12,
              }}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
