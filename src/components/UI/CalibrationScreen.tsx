import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CalibrationScreenProps {
  onComplete: () => void
  addCalibrationPoint: (x: number, y: number) => void
}

const GRID_POSITIONS: Array<{ col: number; row: number }> = [
  { col: 0.50, row: 0.50 },
  { col: 0.88, row: 0.12 },
  { col: 0.12, row: 0.88 },
  { col: 0.12, row: 0.12 },
  { col: 0.88, row: 0.88 },
  { col: 0.50, row: 0.12 },
  { col: 0.50, row: 0.88 },
  { col: 0.12, row: 0.50 },
  { col: 0.88, row: 0.50 },
]

const TOTAL_CALIBRATION_POINTS = 9
const VALIDATION_POINTS = 3

type Phase = 'calibration' | 'validation' | 'complete'

export default function CalibrationScreen({
  onComplete,
  addCalibrationPoint,
}: CalibrationScreenProps) {
  const [phase, setPhase] = useState<Phase>('calibration')
  const [currentPointIndex, setCurrentPointIndex] = useState(0)
  const [completedPoints, setCompletedPoints] = useState<Set<number>>(new Set())
  const [validationIndex, setValidationIndex] = useState(0)
  const [validationPositions] = useState<Array<{ col: number; row: number }>>(() => {
    const positions: Array<{ col: number; row: number }> = []
    for (let i = 0; i < VALIDATION_POINTS; i++) {
      positions.push({
        col: 0.2 + Math.random() * 0.6,
        row: 0.2 + Math.random() * 0.6,
      })
    }
    return positions
  })

  const containerRef = useRef<HTMLDivElement>(null)

  const getScreenPosition = useCallback(
    (pos: { col: number; row: number }) => {
      return {
        x: pos.col * window.innerWidth,
        y: pos.row * window.innerHeight,
      }
    },
    [],
  )

  const handlePointClick = useCallback(
    (index: number) => {
      if (phase !== 'calibration' || index !== currentPointIndex) return

      const pos = GRID_POSITIONS[index]
      const screen = getScreenPosition(pos)
      addCalibrationPoint(screen.x, screen.y)

      setCompletedPoints((prev) => {
        const next = new Set(prev)
        next.add(index)
        return next
      })

      if (index < TOTAL_CALIBRATION_POINTS - 1) {
        setCurrentPointIndex(index + 1)
      } else {
        setPhase('validation')
      }
    },
    [phase, currentPointIndex, addCalibrationPoint, getScreenPosition],
  )

  useEffect(() => {
    if (phase !== 'validation') return
    const timer = setTimeout(() => {
      if (validationIndex < VALIDATION_POINTS - 1) {
        setValidationIndex((prev) => prev + 1)
      } else {
        setPhase('complete')
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, validationIndex])

  useEffect(() => {
    if (phase !== 'complete') return
    const timer = setTimeout(() => onComplete(), 1500)
    return () => clearTimeout(timer)
  }, [phase, onComplete])

  // Phase label
  const phaseLabel = phase === 'calibration'
    ? `${completedPoints.size + 1} / ${TOTAL_CALIBRATION_POINTS}`
    : phase === 'validation'
      ? 'Verifying...'
      : 'Ready'

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[200]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'linear-gradient(180deg, #1C1A18 0%, #141210 100%)',
      }}
    >
      {/* Giant background text — the main visual cue */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <AnimatePresence mode="wait">
          {phase === 'calibration' && (
            <motion.div
              key="cal-bg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 400,
                color: 'rgba(212, 184, 114, 0.06)',
                lineHeight: 1.1,
                userSelect: 'none',
              }}>
                Click the<br />golden dot
              </div>
              <div style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 'clamp(14px, 2vw, 18px)',
                color: 'rgba(245, 242, 239, 0.5)',
                marginTop: 32,
                letterSpacing: 1,
              }}>
                {phaseLabel}
              </div>
            </motion.div>
          )}
          {phase === 'validation' && (
            <motion.div
              key="val-bg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 400,
                color: 'rgba(143, 184, 160, 0.06)',
                lineHeight: 1.1,
                userSelect: 'none',
              }}>
                Follow with<br />your eyes
              </div>
              <div style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 'clamp(14px, 2vw, 18px)',
                color: 'rgba(143, 184, 160, 0.5)',
                marginTop: 32,
                letterSpacing: 1,
              }}>
                Almost there
              </div>
            </motion.div>
          )}
          {phase === 'complete' && (
            <motion.div
              key="done-bg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(56px, 10vw, 120px)',
                fontWeight: 400,
                color: 'rgba(212, 184, 114, 0.12)',
                lineHeight: 1.1,
                userSelect: 'none',
              }}>
                Ready
              </div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(18px, 3vw, 28px)',
                color: '#D4B872',
                marginTop: 24,
              }}>
                Now just read.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar — bottom of screen */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        width: 200,
      }}>
        <div style={{
          width: '100%', height: 3, borderRadius: 2, overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 2,
              backgroundColor: phase === 'validation' ? '#8FB8A0' : '#D4B872',
            }}
            animate={{
              width: `${(phase === 'calibration'
                ? completedPoints.size / TOTAL_CALIBRATION_POINTS
                : phase === 'validation'
                  ? (TOTAL_CALIBRATION_POINTS + validationIndex) / (TOTAL_CALIBRATION_POINTS + VALIDATION_POINTS)
                  : 1) * 100}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Calibration points — big clickable dots */}
      <AnimatePresence>
        {phase === 'calibration' &&
          GRID_POSITIONS.map((pos, index) => {
            const isCurrent = index === currentPointIndex
            const isCompleted = completedPoints.has(index)
            if (!isCompleted && !isCurrent) return null

            return (
              <motion.button
                key={`cal-${index}`}
                style={{
                  position: 'absolute',
                  left: `${pos.col * 100}%`,
                  top: `${pos.row * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: isCurrent ? 'pointer' : 'default',
                  zIndex: isCurrent ? 10 : 5,
                  padding: 0,
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onClick={() => handlePointClick(index)}
              >
                {/* Outer pulse ring */}
                {isCurrent && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      width: 72, height: 72,
                      top: -22, left: -22,
                      borderRadius: '50%',
                      border: '1.5px solid rgba(212, 184, 114, 0.25)',
                    }}
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2, repeat: Infinity, ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Dot */}
                <motion.div
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isCompleted
                      ? 'radial-gradient(circle, rgba(245, 242, 239, 0.4) 0%, rgba(209, 204, 199, 0.2) 100%)'
                      : 'radial-gradient(circle, #E8C85A 0%, #D4B872 60%, #B89B52 100%)',
                    boxShadow: isCompleted
                      ? '0 0 16px rgba(245, 242, 239, 0.15)'
                      : '0 0 30px rgba(212, 184, 114, 0.5), 0 0 60px rgba(212, 184, 114, 0.2)',
                  }}
                  animate={
                    isCurrent
                      ? {
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            '0 0 30px rgba(212, 184, 114, 0.5), 0 0 60px rgba(212, 184, 114, 0.2)',
                            '0 0 50px rgba(212, 184, 114, 0.7), 0 0 80px rgba(212, 184, 114, 0.3)',
                            '0 0 30px rgba(212, 184, 114, 0.5), 0 0 60px rgba(212, 184, 114, 0.2)',
                          ],
                        }
                      : {}
                  }
                  transition={
                    isCurrent
                      ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                      : {}
                  }
                />
              </motion.button>
            )
          })}
      </AnimatePresence>

      {/* Constellation lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.12 }}
      >
        {Array.from(completedPoints)
          .sort((a, b) => a - b)
          .map((pointIndex, i, arr) => {
            if (i === 0) return null
            const prevIndex = arr[i - 1]
            const from = GRID_POSITIONS[prevIndex]
            const to = GRID_POSITIONS[pointIndex]
            return (
              <motion.line
                key={`line-${prevIndex}-${pointIndex}`}
                x1={`${from.col * 100}%`}
                y1={`${from.row * 100}%`}
                x2={`${to.col * 100}%`}
                y2={`${to.row * 100}%`}
                stroke="#D4B872"
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )
          })}
      </svg>

      {/* Validation floating point */}
      <AnimatePresence>
        {phase === 'validation' && validationIndex < validationPositions.length && (
          <motion.div
            key={`val-${validationIndex}`}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }}
            initial={{
              left: `${(validationPositions[Math.max(0, validationIndex - 1)]?.col ?? 0.5) * 100}%`,
              top: `${(validationPositions[Math.max(0, validationIndex - 1)]?.row ?? 0.5) * 100}%`,
              opacity: 0, scale: 0.5,
            }}
            animate={{
              left: `${validationPositions[validationIndex].col * 100}%`,
              top: `${validationPositions[validationIndex].row * 100}%`,
              opacity: 1, scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <motion.div
              style={{
                position: 'absolute',
                width: 64, height: 64,
                top: -24, left: -24,
                borderRadius: '50%',
                border: '1.5px solid rgba(143, 184, 160, 0.25)',
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 1.5, repeat: Infinity, ease: 'easeInOut',
              }}
            />
            <div
              style={{
                width: 16, height: 16, borderRadius: '50%',
                background: 'radial-gradient(circle, #B8D4C0 0%, #8FB8A0 100%)',
                boxShadow: '0 0 24px rgba(143, 184, 160, 0.5), 0 0 48px rgba(143, 184, 160, 0.2)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion glow */}
      {phase === 'complete' && (
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 184, 114, 0.08) 0%, transparent 70%)',
          }} />
        </motion.div>
      )}
    </motion.div>
  )
}
