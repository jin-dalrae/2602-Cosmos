import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CosmosLayout, SwipeEvent, UserPosition, NarratorResponse } from '../../lib/types'
import { UI_COLORS, BG_DARK, BG_DARKER } from '../shared/EmotionPalette'

interface NarratorSheetProps {
  layout: CosmosLayout
  swipeHistory: SwipeEvent[]
  userPosition?: UserPosition
  isOpen: boolean
  onClose: () => void
  onHighlight?: (postIds: string[]) => void
}

export default function NarratorSheet({
  layout,
  swipeHistory,
  userPosition,
  isOpen,
  onClose,
  onHighlight,
}: NarratorSheetProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState<NarratorResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen])

  // Scroll to bottom when response arrives
  useEffect(() => {
    if (response && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [response])

  const askNarrator = useCallback(
    async (q: string) => {
      if (!q.trim()) return

      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q.trim(),
            layout,
            swipeHistory,
            userPosition: userPosition ?? null,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Narrator error ${res.status}: ${text}`)
        }

        const data = (await res.json()) as NarratorResponse
        setResponse(data)

        // Handle camera/highlight commands
        if (data.highlights?.post_ids && onHighlight) {
          onHighlight(data.highlights.post_ids)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [layout, swipeHistory, userPosition, onHighlight],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = question
      setQuestion('')
      askNarrator(q)
    },
    [question, askNarrator],
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuestion('')
      askNarrator(suggestion)
    },
    [askNarrator],
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: UI_COLORS.overlay }}
            onClick={onClose}
          />

          {/* Sheet - bottom on mobile, right side on desktop */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col md:left-auto md:top-0 md:w-[420px]"
            style={{
              maxHeight: '80vh',
              backgroundColor: BG_DARK,
              borderTop: '1px solid rgba(212, 184, 114, 0.2)',
              borderRadius: '16px 16px 0 0',
            }}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <h3
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: '#D4B872' }}
              >
                Narrator
              </h3>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: UI_COLORS.textSecondary,
                }}
                aria-label="Close narrator"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Response area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-3"
              style={{ minHeight: 120 }}
            >
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: '#D4B872' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: UI_COLORS.textMuted }}
                  >
                    The narrator is composing...
                  </span>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div
                  className="rounded-lg p-3 text-sm mb-3"
                  style={{
                    backgroundColor: 'rgba(196, 122, 90, 0.12)',
                    color: '#C47A5A',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Narrator response */}
              {response && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div
                    className="text-sm leading-relaxed whitespace-pre-wrap mb-4"
                    style={{
                      color: UI_COLORS.textPrimary,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      lineHeight: 1.7,
                    }}
                  >
                    {response.text}
                  </div>

                  {/* Follow-up suggestion chips */}
                  {response.follow_up_suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {response.follow_up_suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 rounded-full text-xs transition-colors"
                          style={{
                            backgroundColor: 'rgba(212, 184, 114, 0.1)',
                            color: '#D4B872',
                            border: '1px solid rgba(212, 184, 114, 0.25)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(212, 184, 114, 0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(212, 184, 114, 0.1)'
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Empty state */}
              {!response && !isLoading && !error && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'rgba(212, 184, 114, 0.1)' }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4B872"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </div>
                  <p
                    className="text-xs text-center leading-relaxed max-w-[240px]"
                    style={{ color: UI_COLORS.textMuted }}
                  >
                    Ask the narrator about this discussion — about clusters, tensions, bridges, or your own position in the cosmos.
                  </p>
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-4 py-3"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: BG_DARKER,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask the Narrator..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-3 rounded-lg"
                style={{
                  color: UI_COLORS.textPrimary,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-opacity"
                style={{
                  backgroundColor: '#D4B872',
                  opacity: isLoading || !question.trim() ? 0.35 : 1,
                }}
                aria-label="Send"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={BG_DARK}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
