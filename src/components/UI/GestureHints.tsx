import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UI_COLORS, BG_DARK } from '../shared/EmotionPalette'

interface GestureHintsProps {
  onDismiss: () => void
}

const STORAGE_KEY = 'cosmos-gesture-hints-dismissed'

interface GestureItem {
  direction: string
  label: string
  description: string
  color: string
  arrowPath: string
}

const GESTURES: GestureItem[] = [
  {
    direction: 'right',
    label: 'Swipe right',
    description: 'Agree',
    color: '#8FB8A0',
    arrowPath: 'M6 12h12M14 8l4 4-4 4',
  },
  {
    direction: 'left',
    label: 'Swipe left',
    description: 'Disagree',
    color: '#C47A5A',
    arrowPath: 'M18 12H6M10 8l-4 4 4 4',
  },
  {
    direction: 'down',
    label: 'Swipe down',
    description: 'Go deeper',
    color: '#9B8FB8',
    arrowPath: 'M12 6v12M8 14l4 4 4-4',
  },
  {
    direction: 'up',
    label: 'Swipe up',
    description: 'Flip perspective',
    color: '#D4B872',
    arrowPath: 'M12 18V6M8 10l4-4 4 4',
  },
  {
    direction: 'pinch',
    label: 'Pinch',
    description: 'Toggle map view',
    color: '#E8836B',
    arrowPath: 'M7 7l4 4M17 7l-4 4M7 17l4-4M17 17l-4-4',
  },
]

export default function GestureHints({ onDismiss }: GestureHintsProps) {
  const [visible, setVisible] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      setVisible(true)
    } else {
      // Already dismissed, call onDismiss immediately
      onDismiss()
    }
  }, [onDismiss])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
    // Wait for exit animation before calling onDismiss
    setTimeout(onDismiss, 350)
  }, [onDismiss])

  if (!visible) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          style={{ backgroundColor: UI_COLORS.overlay }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              backgroundColor: BG_DARK,
              border: '1px solid rgba(212, 184, 114, 0.2)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {/* Title */}
            <h2
              className="text-center text-lg font-semibold mb-1"
              style={{
                color: UI_COLORS.textPrimary,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              Navigate the Cosmos
            </h2>
            <p
              className="text-center text-xs mb-6"
              style={{ color: UI_COLORS.textMuted }}
            >
              Swipe cards to explore ideas
            </p>

            {/* Gesture list */}
            <div className="flex flex-col gap-3 mb-6">
              {GESTURES.map((gesture) => (
                <motion.div
                  key={gesture.direction}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + GESTURES.indexOf(gesture) * 0.07 }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  {/* Arrow icon */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${gesture.color}18` }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={gesture.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={gesture.arrowPath} />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: UI_COLORS.textPrimary }}
                    >
                      {gesture.label}
                    </span>
                    <span
                      className="mx-2 text-xs"
                      style={{ color: UI_COLORS.textMuted }}
                    >
                      &rarr;
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: gesture.color }}
                    >
                      {gesture.description}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Got it button */}
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
              style={{
                backgroundColor: '#D4B872',
                color: BG_DARK,
              }}
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
