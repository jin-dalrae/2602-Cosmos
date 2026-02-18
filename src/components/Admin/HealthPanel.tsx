import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { API_BASE } from '../../lib/api'

interface HealthData {
  server: { status: string; uptime: number }
  mongo: { status: string }
  anthropic: { status: string; format?: string }
  cache: { status: string; fileCount: number }
}

const S = {
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  green: '#8FB8A0',
  yellow: '#D4B872',
  red: '#E8836B',
}

function statusColor(status: string) {
  if (['ok', 'connected', 'configured'].includes(status)) return S.green
  if (['not configured', 'empty or missing', 'unknown'].includes(status)) return S.yellow
  return S.red
}

function formatUptime(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export default function HealthPanel() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/health`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setHealth(await res.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: S.red }}>
        <p>Failed to connect: {error}</p>
        <button onClick={fetchHealth} style={{
          marginTop: 12, padding: '8px 20px', borderRadius: 8,
          border: `1px solid ${S.border}`, backgroundColor: 'transparent',
          color: S.textMuted, fontSize: 13, cursor: 'pointer',
        }}>
          Retry
        </button>
      </div>
    )
  }

  if (!health) {
    return <div style={{ textAlign: 'center', padding: 40, color: S.textMuted }}>Loading...</div>
  }

  const cards = [
    {
      title: 'Server',
      status: health.server.status,
      detail: `Uptime: ${formatUptime(health.server.uptime)}`,
    },
    {
      title: 'MongoDB',
      status: health.mongo.status,
      detail: health.mongo.status === 'connected' ? 'Connection active' : health.mongo.status,
    },
    {
      title: 'Anthropic API',
      status: health.anthropic.status,
      detail: health.anthropic.format || health.anthropic.status,
    },
    {
      title: 'File Cache',
      status: health.cache.status,
      detail: `${health.cache.fileCount} cached files`,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
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
          <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
            {card.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: statusColor(card.status),
            }} />
            <span style={{
              fontSize: 14, fontWeight: 600, color: S.text,
              fontFamily: 'system-ui, sans-serif',
              textTransform: 'capitalize',
            }}>
              {card.status}
            </span>
          </div>
          <div style={{ fontSize: 12, color: S.textMuted }}>
            {card.detail}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
