import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../../lib/api'

const S = {
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  gold: '#D4B872',
  sage: '#8FB8A0',
  red: '#E8836B',
}

interface ProgressEntry {
  stage: string
  percent: number
  detail?: string
  timestamp: number
}

export default function GeneratePanel() {
  const [topic, setTopic] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim() || running) return

    setRunning(true)
    setProgress([])
    setError(null)
    setDone(false)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                setError(data.error)
              } else {
                setProgress((prev) => [...prev, {
                  stage: data.stage || '',
                  percent: data.percent || 0,
                  detail: data.detail,
                  timestamp: Date.now(),
                }])
                if (data.percent === 100) {
                  setDone(true)
                }
              }
            } catch {
              // skip malformed events
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Generation failed')
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setRunning(false)
  }

  const latestProgress = progress[progress.length - 1]

  return (
    <div>
      {/* Input */}
      <div style={{
        padding: '24px',
        borderRadius: 12,
        backgroundColor: S.cardBg,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${S.border}`,
        marginBottom: 24,
      }}>
        <label style={{ display: 'block', fontSize: 13, color: S.textMuted, marginBottom: 8 }}>
          Topic
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. SF Richmond, AI Ethics, Remote Work..."
            disabled={running}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              backgroundColor: 'rgba(245, 242, 239, 0.04)',
              color: S.text,
              fontSize: 14,
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
            }}
          />
          {running ? (
            <button
              onClick={handleCancel}
              style={{
                padding: '12px 24px', borderRadius: 8,
                border: `1px solid ${S.red}30`, backgroundColor: `${S.red}10`,
                color: S.red, fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              style={{
                padding: '12px 24px', borderRadius: 8,
                border: `1px solid ${S.gold}30`, backgroundColor: `${S.gold}15`,
                color: S.gold, fontSize: 14, fontWeight: 500,
                cursor: topic.trim() ? 'pointer' : 'not-allowed',
                opacity: topic.trim() ? 1 : 0.4,
              }}
            >
              Generate
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {(progress.length > 0 || error) && (
        <div style={{
          padding: '24px',
          borderRadius: 12,
          backgroundColor: S.cardBg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${S.border}`,
        }}>
          {/* Progress bar */}
          {latestProgress && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: S.text, fontWeight: 500 }}>
                  {done ? 'Complete' : latestProgress.stage}
                </span>
                <span style={{ fontSize: 13, color: S.textMuted }}>
                  {latestProgress.percent}%
                </span>
              </div>
              <div style={{
                width: '100%', height: 4, borderRadius: 2,
                backgroundColor: 'rgba(245, 242, 239, 0.08)',
                overflow: 'hidden',
              }}>
                <motion.div
                  animate={{ width: `${latestProgress.percent}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    backgroundColor: done ? S.sage : S.gold,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: `${S.red}10`, color: S.red, fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}

          {/* Log */}
          <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Log
          </div>
          <div style={{ maxHeight: 240, overflow: 'auto', fontSize: 12, lineHeight: 1.8 }}>
            <AnimatePresence>
              {progress.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ color: S.textMuted }}
                >
                  <span style={{ color: S.gold }}>{entry.percent}%</span>{' '}
                  <span style={{ color: S.text }}>{entry.stage}</span>
                  {entry.detail && <span> — {entry.detail}</span>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
