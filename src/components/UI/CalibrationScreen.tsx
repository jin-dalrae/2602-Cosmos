import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CalibrationScreenProps {
  onComplete: () => void
  addCalibrationPoint: (x: number, y: number) => void
}

/**
 * 9 calibration points in a 3x3 grid — but presented in a constellation/star path
 * rather than boring left-to-right, top-to-bottom order.
 *
 * The grid positions use proportions of viewport with padding:
 *   col:  0.12, 0.50, 0.88
 *   row:  0.12, 0.50, 0.88
 *
 * Star path order: center -> top-right -> bottom-left -> top-left -> bottom-right
 *                  -> top-center -> bottom-center -> left-center -> right-center
 */
const GRID_POSITIONS: Array<{ col: number; row: number }> = [
  { col: 0.50, row: 0.50 }, // center (start here — feels natural)
  { col: 0.88, row: 0.12 }, // top-right
  { col: 0.12, row: 0.88 }, // bottom-left
  { col: 0.12, row: 0.12 }, // top-left
  { col: 0.88, row: 0.88 }, // bottom-right
  { col: 0.50, row: 0.12 }, // top-center
  { col: 0.50, row: 0.88 }, // bottom-center
  { col: 0.12, row: 0.50 }, // left-center
  { col: 0.88, row: 0.50 }, // right-center
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
    // Pick 3 random positions (not from the grid) for validation
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

      // Record the calibration point for WebGazer
      addCalibrationPoint(screen.x, screen.y)

      // Mark as completed
      setCompletedPoints((prev) => {
        const next = new Set(prev)
        next.add(index)
        return next
      })

      // Move to next point
      if (index < TOTAL_CALIBRATION_POINTS - 1) {
        setCurrentPointIndex(index + 1)
      } else {
        // All calibration points done — move to validation
        setPhase('validation')
      }
    },
    [phase, currentPointIndex, addCalibrationPoint, getScreenPosition],
  )

  // Validation phase: auto-advance validation points as user follows them
  useEffect(() => {
    if (phase !== 'validation') return

    const timer = setTimeout(() => {
      if (validationIndex < VALIDATION_POINTS - 1) {
        setValidationIndex((prev) => prev + 1)
      } else {
        setPhase('complete')
      }
    }, 1500) // each validation point lingers 1.5s

    return () => clearTimeout(timer)
  }, [phase, validationIndex])

  // Completion: show message, then call onComplete after delay
  useEffect(() => {
    if (phase !== 'complete') return

    const timer = setTimeout(() => {
      onComplete()
    }, 1500)

    return () => clearTimeout(timer)
  }, [phase, onComplete])

  const progress = phase === 'calibration'
    ? completedPoints.size / TOTAL_CALIBRATION_POINTS
    : phase === 'validation'
      ? (TOTAL_CALIBRATION_POINTS + validationIndex) / (TOTAL_CALIBRATION_POINTS + VALIDATION_POINTS)
      : 1

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'linear-gradient(180deg, #1C1A18 0%, #141210 100%)',
      }}
    >
      {/* Header text */}
      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <AnimatePresence mode="wait">
          {phase === 'calibration' && (
            <motion.div
              key="calibration-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h1
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 22,
                  fontWeight: 400,
                  color: '#F5F2EF',
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
              >
                Let's teach Cosmos to see through your eyes.
              </h1>
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 14,
                  color: '#9E9589',
                  lineHeight: 1.5,
                }}
              >
                Click each golden point as it appears
              </p>
            </motion.div>
          )}
          {phase === 'validation' && (
            <motion.div
              key="validation-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h1
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 22,
                  fontWeight: 400,
                  color: '#F5F2EF',
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
              >
                Almost there...
              </h1>
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 14,
                  color: '#9E9589',
                  lineHeight: 1.5,
                }}
              >
                Follow the point with your eyes
              </p>
            </motion.div>
          )}
          {phase === 'complete' && (
            <motion.div
              key="complete-header"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center"
            >
              <h1
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 24,
                  fontWeight: 400,
                  color: '#D4B872',
                  lineHeight: 1.4,
                }}
              >
                Perfect. Now just read.
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="px-8 pb-4">
        <div
          className="w-full h-0.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#D4B872' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: TOTAL_CALIBRATION_POINTS + VALIDATION_POINTS }).map((_, i) => {
            const isDone = phase === 'complete'
              || (phase === 'calibration' && i < completedPoints.size)
              || (phase === 'validation' && i < TOTAL_CALIBRATION_POINTS + validationIndex)
            const isCurrent =
              (phase === 'calibration' && i === currentPointIndex) ||
              (phase === 'validation' && i === TOTAL_CALIBRATION_POINTS + validationIndex)

            return (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: isCurrent ? 8 : 4,
                  height: 4,
                  backgroundColor: isDone
                    ? '#D4B872'
                    : isCurrent
                      ? 'rgba(212, 184, 114, 0.6)'
                      : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                }}
                animate={{
                  width: isCurrent ? 8 : 4,
                  backgroundColor: isDone
                    ? '#D4B872'
                    : isCurrent
                      ? 'rgba(212, 184, 114, 0.6)'
                      : 'rgba(255, 255, 255, 0.1)',
                }}
                transition={{ duration: 0.2 }}
              />
            )
          })}
        </div>
      </div>

      {/* Calibration points */}
      <div className="relative flex-1">
        <AnimatePresence>
          {phase === 'calibration' &&
            GRID_POSITIONS.map((pos, index) => {
              const isCurrent = index === currentPointIndex
              const isCompleted = completedPoints.has(index)

              // Only show completed points and the current point
              if (!isCompleted && !isCurrent) return null

              return (
                <motion.button
                  key={`cal-${index}`}
                  className="absolute"
                  style={{
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
                  {/* Outer pulse ring (current point only) */}
                  {isCurrent && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        width: 48,
                        height: 48,
                        top: -14,
                        left: -14,
                        border: '1px solid rgba(212, 184, 114, 0.3)',
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* Point circle */}
                  <motion.div
                    className="rounded-full"
                    style={{
                      width: 20,
                      height: 20,
                      background: isCompleted
                        ? 'radial-gradient(circle, #F5F2EF 0%, #D1CCC7 100%)'
                        : 'radial-gradient(circle, #E8C85A 0%, #D4B872 60%, #B89B52 100%)',
                      boxShadow: isCompleted
                        ? '0 0 12px rgba(245, 242, 239, 0.2)'
                        : '0 0 20px rgba(212, 184, 114, 0.5), 0 0 40px rgba(212, 184, 114, 0.2)',
                    }}
                    animate={
                      isCurrent
                        ? {
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              '0 0 20px rgba(212, 184, 114, 0.5), 0 0 40px rgba(212, 184, 114, 0.2)',
                              '0 0 30px rgba(212, 184, 114, 0.7), 0 0 60px rgba(212, 184, 114, 0.3)',
                              '0 0 20px rgba(212, 184, 114, 0.5), 0 0 40px rgba(212, 184, 114, 0.2)',
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

        {/* Constellation lines connecting completed points */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.15 }}
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

        {/* Validation phase: floating point that user follows */}
        <AnimatePresence>
          {phase === 'validation' && validationIndex < validationPositions.length && (
            <motion.div
              key={`val-${validationIndex}`}
              className="absolute"
              style={{
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
              }}
              initial={{
                left: `${(validationPositions[Math.max(0, validationIndex - 1)]?.col ?? 0.5) * 100}%`,
                top: `${(validationPositions[Math.max(0, validationIndex - 1)]?.row ?? 0.5) * 100}%`,
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                left: `${validationPositions[validationIndex].col * 100}%`,
                top: `${validationPositions[validationIndex].row * 100}%`,
                opacity: 1,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              {/* Outer pulse */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  top: -18,
                  left: -18,
                  border: '1px solid rgba(143, 184, 160, 0.3)',
                }}
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Inner point — sage green for validation */}
              <div
                className="rounded-full"
                style={{
                  width: 12,
                  height: 12,
                  background: 'radial-gradient(circle, #B8D4C0 0%, #8FB8A0 100%)',
                  boxShadow: '0 0 16px rgba(143, 184, 160, 0.5), 0 0 32px rgba(143, 184, 160, 0.2)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion state: gentle radial glow */}
        {phase === 'complete' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="rounded-full"
              style={{
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(212, 184, 114, 0.12) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
