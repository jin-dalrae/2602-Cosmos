import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CosmosLayout, CosmosPost, ClassifiedPost } from '../../lib/types'
import { UI_COLORS, BG_DARK } from '../shared/EmotionPalette'

interface LiveMutationProps {
  layout: CosmosLayout
  onNewPost: (post: CosmosPost) => void
}

type MutationPhase = 'idle' | 'input' | 'classifying' | 'materialized'

export default function LiveMutation({ layout, onNewPost }: LiveMutationProps) {
  const [phase, setPhase] = useState<MutationPhase>('idle')
  const [text, setText] = useState('')
  const [classifiedPost, setClassifiedPost] = useState<CosmosPost | null>(null)
  const [narratorComment, setNarratorComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus the input when entering input phase
  useEffect(() => {
    if (phase === 'input') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [phase])

  // Auto-dismiss materialized state after 5 seconds
  useEffect(() => {
    if (phase === 'materialized') {
      const timer = setTimeout(() => {
        setPhase('idle')
        setClassifiedPost(null)
        setNarratorComment('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  const handleOpen = useCallback(() => {
    setPhase('input')
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    setPhase('idle')
    setText('')
    setError(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return

    setPhase('classifying')
    setError(null)

    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          layout,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Classification error ${res.status}: ${errText}`)
      }

      const classified = (await res.json()) as ClassifiedPost

      // Find position for the new post: average of closest posts' positions,
      // or fallback to a random position near the center
      let position: [number, number, number] = [0, 0, 0]
      if (classified.closest_posts.length > 0) {
        const closestPositions = classified.closest_posts
          .map((id) => layout.posts.find((p) => p.id === id))
          .filter((p): p is CosmosPost => p !== undefined)
          .map((p) => p.position)

        if (closestPositions.length > 0) {
          const sum: [number, number, number] = [0, 0, 0]
          for (const pos of closestPositions) {
            sum[0] += pos[0]
            sum[1] += pos[1]
            sum[2] += pos[2]
          }
          const n = closestPositions.length
          position = [
            sum[0] / n + (Math.random() - 0.5) * 1.5,
            sum[1] / n + (Math.random() - 0.5) * 1.5,
            sum[2] / n + (Math.random() - 0.5) * 1.5,
          ]
        }
      } else {
        position = [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        ]
      }

      const newPost: CosmosPost = {
        ...classified,
        position,
        isUserPost: true,
      }

      setClassifiedPost(newPost)
      setNarratorComment(classified.narrator_comment)
      setPhase('materialized')
      setText('')
      onNewPost(newPost)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setPhase('input')
    }
  }, [text, layout, onNewPost])

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      <AnimatePresence mode="wait">
        {/* Idle: floating action button */}
        {phase === 'idle' && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={handleOpen}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: '#D4B872',
              boxShadow: '0 4px 20px rgba(212, 184, 114, 0.35)',
            }}
            aria-label="Share your take"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BG_DARK}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.button>
        )}

        {/* Input phase: expanded input */}
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[320px] rounded-xl p-4"
            style={{
              backgroundColor: BG_DARK,
              border: '1px solid rgba(212, 184, 114, 0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: '#D4B872' }}
              >
                Share Your Take
              </span>
              <button
                onClick={handleClose}
                className="w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: UI_COLORS.textSecondary,
                }}
                aria-label="Cancel"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your take..."
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed rounded-lg p-3 mb-3"
              style={{
                color: UI_COLORS.textPrimary,
                backgroundColor: 'rgba(255,255,255,0.04)',
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            />

            {error && (
              <div
                className="text-xs mb-2 rounded p-2"
                style={{
                  backgroundColor: 'rgba(196, 122, 90, 0.12)',
                  color: '#C47A5A',
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="w-full py-2 rounded-lg text-sm font-medium transition-opacity"
              style={{
                backgroundColor: '#D4B872',
                color: BG_DARK,
                opacity: text.trim() ? 1 : 0.4,
              }}
            >
              Add to Cosmos
            </button>
          </motion.div>
        )}

        {/* Classifying phase: loading */}
        {phase === 'classifying' && (
          <motion.div
            key="classifying"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-[320px] rounded-xl p-6 flex flex-col items-center"
            style={{
              backgroundColor: BG_DARK,
              border: '1px solid rgba(212, 184, 114, 0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Spinner */}
            <motion.div
              className="w-10 h-10 rounded-full mb-3"
              style={{
                border: '2px solid rgba(212, 184, 114, 0.15)',
                borderTopColor: '#D4B872',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span
              className="text-xs"
              style={{ color: UI_COLORS.textMuted }}
            >
              Finding your place in the cosmos...
            </span>
          </motion.div>
        )}

        {/* Materialized phase: success card */}
        {phase === 'materialized' && classifiedPost && (
          <motion.div
            key="materialized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 18,
              stiffness: 200,
            }}
            className="w-[320px] rounded-xl p-4"
            style={{
              backgroundColor: BG_DARK,
              border: '1px solid rgba(212, 184, 114, 0.3)',
              boxShadow: '0 8px 32px rgba(212, 184, 114, 0.15), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {/* Materialization glow ring */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                border: '2px solid rgba(212, 184, 114, 0.4)',
              }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#D4B872' }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: '#D4B872' }}
              >
                Materialized
              </span>
            </div>

            <p
              className="text-sm leading-snug mb-2"
              style={{
                color: UI_COLORS.textPrimary,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              {classifiedPost.core_claim}
            </p>

            <div className="flex gap-1.5 mb-3">
              <span
                className="inline-block px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(212, 184, 114, 0.15)',
                  color: '#D4B872',
                  fontSize: 11,
                }}
              >
                {classifiedPost.stance}
              </span>
              <span
                className="inline-block px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(143, 184, 160, 0.15)',
                  color: '#8FB8A0',
                  fontSize: 11,
                }}
              >
                {classifiedPost.emotion}
              </span>
            </div>

            {/* Narrator comment */}
            {narratorComment && (
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundColor: 'rgba(212, 184, 114, 0.06)',
                  borderLeft: '2px solid rgba(212, 184, 114, 0.3)',
                }}
              >
                <p
                  className="text-xs leading-relaxed italic"
                  style={{
                    color: UI_COLORS.textSecondary,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  {narratorComment}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
