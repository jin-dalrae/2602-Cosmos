import { useCallback, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CosmosLayout, SwipeDirection, Reaction, GazeState, FaceState } from '../lib/types'
import useReadMapBlend from '../hooks/useReadMapBlend'
import { useCardNavigation } from '../hooks/useCardNavigation'
import { useSwipeHistory } from '../hooks/useSwipeHistory'
import useGazeTracking from '../hooks/useGazeTracking'
import useGazeCardFeedback from '../hooks/useGazeCardFeedback'
import useFusedInput from '../hooks/useFusedInput'
import useAdaptiveModel from '../hooks/useAdaptiveModel'
import CardStack from './ReadMode/CardStack'
import Canvas3D from './MapMode/Canvas3D'
import PostCloud from './MapMode/PostCloud'
import EdgeNetwork from './MapMode/EdgeNetwork'
import ClusterShells from './MapMode/ClusterShells'
import AmbientDust from './MapMode/AmbientDust'
import CameraConsent from './UI/CameraConsent'
import CalibrationScreen from './UI/CalibrationScreen'

interface CosmosExperienceProps {
  layout: CosmosLayout
}

const DIRECTION_TO_REACTION: Record<SwipeDirection, Reaction> = {
  right: 'agree',
  left: 'disagree',
  down: 'deeper',
  up: 'flip',
}

type CameraPhase = 'consent' | 'calibration' | 'active' | 'declined'

export default function CosmosExperience({ layout }: CosmosExperienceProps) {
  const { blend, isTransitioning, setBlend, bindPinch } = useReadMapBlend()
  const { nextPosts, handleSwipe } = useCardNavigation(layout.posts, layout.clusters)
  const { addSwipe } = useSwipeHistory()
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  // Camera / gaze state machine
  // Check if camera was previously declined in this session to skip consent
  const [cameraPhase, setCameraPhase] = useState<CameraPhase>(() => {
    try {
      if (sessionStorage.getItem('cosmos_camera_declined') === 'true') {
        return 'declined'
      }
    } catch {
      // sessionStorage not available — proceed normally
    }
    return 'consent'
  })

  // Gaze tracking
  const {
    gazePoint,
    isTracking: gazeIsTracking,
    isCalibrated,
    confidence: gazeConfidence,
    start: startGaze,
    stop: stopGaze,
    addCalibrationPoint,
  } = useGazeTracking()

  // Construct a GazeState from the raw tracking data for downstream consumers
  // We keep a minimal GazeState (zone detection is handled by useGazeCardFeedback + useFusedInput)
  const gazeStateRef = useRef<GazeState | null>(null)
  const gazeState: GazeState | null = gazeIsTracking && gazePoint
    ? {
        position: gazePoint,
        zone: 'read', // Will be overridden by zone detector in fused input
        zoneDwellMs: 0,
        fixationDurationMs: 0,
        isFixated: false,
        blinkRate: 0,
        saccadeRate: 0,
        pupilDilation: 0,
        isCalibrated,
        confidence: gazeConfidence,
      }
    : null

  useEffect(() => {
    gazeStateRef.current = gazeState
  }, [gazeState])

  // Face state placeholder (would come from FaceMesh in a real setup)
  const [faceState] = useState<FaceState | null>(null)

  // Gaze card feedback
  const { cardTilt, edgeGlow, zoneLabel, shouldTransitionToMap } = useGazeCardFeedback(gazeState)

  // Fused input
  const { isConfused } = useFusedInput(gazeState, faceState)

  // Adaptive model
  const { recordAction, prediction, modelPhase, predict: runPrediction } = useAdaptiveModel()

  // Confusion nudge
  const [showConfusionNudge, setShowConfusionNudge] = useState(false)
  const confusionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isConfused && !showConfusionNudge) {
      setShowConfusionNudge(true)
      // Auto-dismiss after 4 seconds
      confusionTimeoutRef.current = setTimeout(() => {
        setShowConfusionNudge(false)
      }, 4000)
    }

    return () => {
      if (confusionTimeoutRef.current) {
        clearTimeout(confusionTimeoutRef.current)
      }
    }
  }, [isConfused, showConfusionNudge])

  // Gaze-driven blend transitions
  const gazeBlendRef = useRef<number>(0)

  useEffect(() => {
    if (cameraPhase !== 'active' || !gazeIsTracking) return

    // Wander detected -> slowly shift toward MAP
    if (shouldTransitionToMap && blend < 1) {
      gazeBlendRef.current = Math.min(gazeBlendRef.current + 0.008, 1)
      setBlend(gazeBlendRef.current)
    }

    // If in MAP mode and gaze fixates (not wandering), slowly shift back to READ
    if (!shouldTransitionToMap && blend > 0.5 && gazeState?.isCalibrated) {
      gazeBlendRef.current = Math.max(gazeBlendRef.current - 0.005, 0)
      setBlend(gazeBlendRef.current)
    }
  }, [shouldTransitionToMap, blend, setBlend, cameraPhase, gazeIsTracking, gazeState?.isCalibrated])

  // Camera consent handlers
  const handleCameraAccept = useCallback(async () => {
    try {
      await startGaze()
      setCameraPhase('calibration')
    } catch {
      // Webcam denied at the browser level — treat as declined
      try {
        sessionStorage.setItem('cosmos_camera_declined', 'true')
      } catch {
        // ignore
      }
      setCameraPhase('declined')
    }
  }, [startGaze])

  const handleCameraDecline = useCallback(() => {
    try {
      sessionStorage.setItem('cosmos_camera_declined', 'true')
    } catch {
      // ignore
    }
    setCameraPhase('declined')
  }, [])

  const handleCalibrationComplete = useCallback(() => {
    setCameraPhase('active')
  }, [])

  // Combine card navigation swipe with swipe history + adaptive model recording
  const onSwipe = useCallback(
    (postId: string, direction: SwipeDirection) => {
      const reaction = DIRECTION_TO_REACTION[direction]

      handleSwipe(postId, direction)
      addSwipe(postId, reaction)

      // Record observation to adaptive model
      recordAction(gazeStateRef.current, faceState, reaction)

      // Try to predict the next action
      runPrediction(gazeStateRef.current, faceState)
    },
    [handleSwipe, addSwipe, recordAction, faceState, runPrediction],
  )

  const onPostSelect = useCallback((postId: string) => {
    setSelectedPostId(postId)
  }, [])

  // Highlight the selected post and bridge posts in MAP mode
  const highlightIds = selectedPostId
    ? [selectedPostId, ...layout.bridge_posts]
    : layout.bridge_posts

  // Interpolated values based on blend
  const readOpacity = 1 - blend
  const mapOpacity = blend
  const cardScale = 1 - blend * 0.15

  // Determine pointer-events: only the active mode should receive interactions
  const readPointerEvents = blend < 0.5 ? 'auto' : 'none'
  const mapPointerEvents = blend >= 0.5 ? 'auto' : 'none'

  // Show the experience content (after consent flow)
  const showExperience = cameraPhase === 'active' || cameraPhase === 'declined'

  // Mode indicator label
  const blendPercent = Math.round(blend * 100)
  const modeLabel = blend < 0.5 ? 'READ' : 'MAP'

  // ═══ Edge case: empty posts ═══
  if (layout.posts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #262220 0%, #1C1A18 100%)',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#9E9589',
            boxShadow: '0 0 12px rgba(158, 149, 137, 0.3)',
            marginBottom: 24,
          }}
        />
        <p
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 18,
            color: '#F5F2EF',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          No posts found in this discussion
        </p>
        <p
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 13,
            color: '#6B6560',
          }}
        >
          The thread may be empty or inaccessible
        </p>
      </div>
    )
  }

  return (
    <div
      {...bindPinch()}
      className="relative w-full h-full overflow-hidden"
      style={{
        touchAction: 'none',
        background: 'linear-gradient(180deg, #262220 0%, #1C1A18 100%)',
      }}
    >
      {/* Camera consent overlay */}
      <AnimatePresence>
        {cameraPhase === 'consent' && (
          <CameraConsent
            onAccept={handleCameraAccept}
            onDecline={handleCameraDecline}
          />
        )}
      </AnimatePresence>

      {/* Calibration screen overlay */}
      <AnimatePresence>
        {cameraPhase === 'calibration' && (
          <CalibrationScreen
            onComplete={handleCalibrationComplete}
            addCalibrationPoint={addCalibrationPoint}
          />
        )}
      </AnimatePresence>

      {/* Main experience */}
      {showExperience && (
        <>
          {/* MAP mode layer (behind READ) */}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: mapOpacity,
              pointerEvents: mapPointerEvents as 'auto' | 'none',
            }}
            animate={{ opacity: mapOpacity }}
            transition={{ duration: 0.1 }}
          >
            <Canvas3D>
              <PostCloud
                posts={layout.posts}
                onSelect={onPostSelect}
                highlightIds={highlightIds}
              />
              <EdgeNetwork posts={layout.posts} />
              <ClusterShells clusters={layout.clusters} />
              <AmbientDust />
            </Canvas3D>
          </motion.div>

          {/* READ mode layer (on top, centered card stack) */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: readOpacity,
              pointerEvents: readPointerEvents as 'auto' | 'none',
            }}
            animate={{
              opacity: readOpacity,
              scale: cardScale,
            }}
            transition={{ duration: 0.1 }}
          >
            <div
              style={{
                width: 340,
                height: 500,
                position: 'relative',
                // Apply gaze-driven tilt to the card container
                transform: gazeIsTracking
                  ? `perspective(1200px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`
                  : undefined,
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* Gaze-driven edge glow overlays */}
              {gazeIsTracking && edgeGlow.side && edgeGlow.opacity > 0.01 && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    opacity: edgeGlow.opacity,
                    boxShadow:
                      edgeGlow.side === 'right'
                        ? 'inset -40px 0 40px -20px rgba(212, 184, 114, 0.4)'
                        : edgeGlow.side === 'left'
                          ? 'inset 40px 0 40px -20px rgba(196, 122, 90, 0.4)'
                          : edgeGlow.side === 'bottom'
                            ? 'inset 0 -40px 40px -20px rgba(143, 184, 160, 0.4)'
                            : 'inset 0 40px 40px -20px rgba(155, 143, 184, 0.4)',
                    borderRadius: 12,
                    zIndex: 20,
                  }}
                />
              )}

              {/* Zone label */}
              <AnimatePresence>
                {gazeIsTracking && zoneLabel && (
                  <motion.div
                    className="absolute left-1/2 z-30 pointer-events-none"
                    style={{
                      bottom: -32,
                      transform: 'translateX(-50%)',
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 12,
                      color: '#D4B872',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {zoneLabel}
                  </motion.div>
                )}
              </AnimatePresence>

              <CardStack
                posts={nextPosts}
                clusters={layout.clusters}
                onSwipe={onSwipe}
              />
            </div>
          </motion.div>

          {/* Mode toggle button (bottom center) */}
          <div
            className="absolute bottom-6 left-1/2 flex gap-2"
            style={{ transform: 'translateX(-50%)', zIndex: 50 }}
          >
            <button
              onClick={() => {
                setBlend(0)
                gazeBlendRef.current = 0
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: blend < 0.5 ? '#D4B872' : '#3A3530',
                color: blend < 0.5 ? '#1C1A18' : '#9E9589',
              }}
            >
              Read
            </button>
            <button
              onClick={() => {
                setBlend(1)
                gazeBlendRef.current = 1
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: blend >= 0.5 ? '#D4B872' : '#3A3530',
                color: blend >= 0.5 ? '#1C1A18' : '#9E9589',
              }}
            >
              Map
            </button>
          </div>

          {/* Mode indicator pill (below toggle buttons) */}
          <div
            className="absolute left-1/2"
            style={{
              bottom: 8,
              transform: 'translateX(-50%)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                padding: '3px 10px',
                borderRadius: 10,
                backgroundColor: 'rgba(58, 53, 48, 0.6)',
                backdropFilter: 'blur(6px)',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 10,
                color: '#6B6560',
                letterSpacing: 1,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {modeLabel} {blendPercent}%
            </div>
          </div>

          {/* Transition indicator */}
          {isTransitioning && (
            <div
              className="absolute top-4 left-1/2"
              style={{
                transform: 'translateX(-50%)',
                zIndex: 50,
                fontFamily: 'system-ui, sans-serif',
                fontSize: 11,
                color: '#6B6560',
                letterSpacing: 1,
              }}
            >
              {blend < 0.5 ? 'READ' : 'MAP'} mode
            </div>
          )}

          {/* Gaze active indicator (top-right dot) */}
          {gazeIsTracking && cameraPhase === 'active' && (
            <div
              className="absolute top-4 right-4 flex items-center gap-2"
              style={{ zIndex: 50 }}
            >
              {modelPhase !== 'observe' && prediction && (
                <motion.div
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 0.5, x: 0 }}
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 10,
                    color: '#9E9589',
                    letterSpacing: 0.5,
                  }}
                >
                  predicting: {prediction.reaction} ({Math.round(prediction.confidence * 100)}%)
                </motion.div>
              )}
              <motion.div
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: isCalibrated
                    ? '#8FB8A0' // sage = calibrated
                    : '#D4B872', // gold = tracking but not calibrated
                  boxShadow: isCalibrated
                    ? '0 0 8px rgba(143, 184, 160, 0.5)'
                    : '0 0 8px rgba(212, 184, 114, 0.5)',
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          )}

          {/* Confusion nudge */}
          <AnimatePresence>
            {showConfusionNudge && (
              <motion.div
                className="absolute top-12 left-1/2"
                style={{
                  transform: 'translateX(-50%)',
                  zIndex: 60,
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(196, 122, 90, 0.15)',
                    border: '1px solid rgba(196, 122, 90, 0.25)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C47A5A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 12,
                      color: '#C47A5A',
                    }}
                  >
                    Looks like this one's tricky — flip the card for context
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
