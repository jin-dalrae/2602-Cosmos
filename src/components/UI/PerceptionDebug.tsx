import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GazePoint, GazeState, FaceState, GazeZone, IntentType } from '../../lib/types'
import { createZoneDetector } from '../../lib/gazeZones'
import { createFaceSignalProcessor } from '../../lib/faceSignals'
import { fuseInputs } from '../../lib/fusionLayer'
import { detectFixation, computeBlinkRate, detectSaccades, estimateEngagement } from '../../lib/gazeFeatures'

/**
 * PerceptionDebug — A standalone screen showing:
 * 1. Live webcam feed with face landmark overlay
 * 2. Gaze point visualization on screen
 * 3. Active gaze zone map
 * 4. Face signal meters (nod, shake, lean, brow, smile)
 * 5. Fused intent decision with confidence
 * 6. Zone dwell progress
 */

interface PerceptionDebugProps {
  onClose: () => void
}

// Zone colors
const ZONE_COLORS: Record<GazeZone, string> = {
  read: '#8FB8A0',
  agree: '#D4B872',
  disagree: '#C47A5A',
  deeper: '#9B8FB8',
  flip: '#E8836B',
  wander: '#6B6560',
}

const INTENT_COLORS: Record<IntentType, string> = {
  agree: '#D4B872',
  disagree: '#C47A5A',
  deeper: '#9B8FB8',
  flip: '#E8836B',
  navigate: '#8FB8A0',
  compare: '#A3A07E',
  deep_read: '#8FB8A0',
  confused: '#C47A5A',
  fatigued: '#9E9589',
  engaged: '#D4B872',
  pulling_away: '#6B6560',
  idle: '#3A3530',
}

export default function PerceptionDebug({ onClose }: PerceptionDebugProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gazeCanvasRef = useRef<HTMLCanvasElement>(null)

  // Tracking state
  const [isWebcamReady, setIsWebcamReady] = useState(false)
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null)
  const [gazeZone, setGazeZone] = useState<GazeZone>('wander')
  const [dwellProgress, setDwellProgress] = useState(0)
  const [isActivated, setIsActivated] = useState(false)
  const [faceState, setFaceState] = useState<FaceState>({
    headNod: 0, headShake: 0, leanIn: 0,
    browRaise: 0, browFurrow: 0, smile: 0, isTracking: false,
  })
  const [intent, setIntent] = useState<{ type: IntentType; confidence: number }>({
    type: 'idle', confidence: 0,
  })
  const [gazeFeats, setGazeFeats] = useState({
    fixated: false, blinkRate: 0, saccadeRate: 0, engagement: 0,
  })

  // Refs for processors
  const zoneDetectorRef = useRef(createZoneDetector())
  const faceProcessorRef = useRef(createFaceSignalProcessor())
  const gazeBufferRef = useRef<GazePoint[]>([])
  const webgazerRef = useRef<any>(null)
  const animFrameRef = useRef<number>(0)

  // Mouse tracking for fusion
  const mouseRef = useRef({ x: 0, y: 0, isActive: false, lastMove: 0 })

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, isActive: true, lastMove: Date.now() }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // Start webcam + webgazer
  const startTracking = useCallback(async () => {
    try {
      // Start webcam for the video preview
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsWebcamReady(true)
      }

      // Start webgazer
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wgModule = await import('webgazer') as any
        const wg = wgModule.default ?? wgModule
        wg.setRegression('ridge')
          .setGazeListener((data: { x: number; y: number } | null) => {
            if (!data) return
            const point: GazePoint = { x: data.x, y: data.y, timestamp: Date.now() }
            gazeBufferRef.current.push(point)
            if (gazeBufferRef.current.length > 60) gazeBufferRef.current.shift()
            setGazePoint(point)
          })
        wg.showPredictionPoints(false)
        wg.showVideoPreview(false)
        await wg.begin()
        webgazerRef.current = wg
      } catch (err) {
        console.warn('WebGazer init failed:', err)
      }
    } catch (err) {
      console.error('Webcam access failed:', err)
    }
  }, [])

  // Processing loop
  useEffect(() => {
    let running = true

    const loop = () => {
      if (!running) return

      const buffer = gazeBufferRef.current
      const lastPoint = buffer.length > 0 ? buffer[buffer.length - 1] : null

      // Zone detection
      const zoneResult = zoneDetectorRef.current.update(
        lastPoint, window.innerWidth, window.innerHeight
      )
      setGazeZone(zoneResult.zone)
      setDwellProgress(zoneResult.dwellProgress)
      setIsActivated(zoneResult.isActivated)

      // Gaze features
      if (buffer.length > 5) {
        const fixation = detectFixation(buffer)
        const blink = computeBlinkRate(buffer)
        const saccade = detectSaccades(buffer)
        const engagement = estimateEngagement(buffer)
        setGazeFeats({
          fixated: fixation !== null,
          blinkRate: blink,
          saccadeRate: saccade,
          engagement,
        })
      }

      // Build GazeState for fusion
      const gazeState: GazeState | null = lastPoint ? {
        position: lastPoint,
        zone: zoneResult.zone,
        zoneDwellMs: zoneResult.dwellProgress * 1000,
        fixationDurationMs: gazeFeats.fixated ? 500 : 0,
        isFixated: gazeFeats.fixated,
        blinkRate: gazeFeats.blinkRate,
        saccadeRate: gazeFeats.saccadeRate,
        pupilDilation: 0,
        isCalibrated: true,
        confidence: 0.7,
      } : null

      // Fusion
      const mouseActive = Date.now() - mouseRef.current.lastMove < 2000
      const fusedIntent = fuseInputs(
        gazeState,
        faceState.isTracking ? faceState : null,
        { x: mouseRef.current.x, y: mouseRef.current.y, isActive: mouseActive },
      )
      setIntent({ type: fusedIntent.type, confidence: fusedIntent.confidence })

      // Draw gaze point trail on overlay canvas
      drawGazeOverlay(buffer)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceState])

  // Draw gaze trail
  const drawGazeOverlay = useCallback((buffer: GazePoint[]) => {
    const canvas = gazeCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw zone boundaries (very faint)
    const w = canvas.width
    const h = canvas.height
    ctx.strokeStyle = 'rgba(107, 101, 96, 0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    // Top 15%
    ctx.beginPath(); ctx.moveTo(0, h * 0.15); ctx.lineTo(w, h * 0.15); ctx.stroke()
    // Bottom 15%
    ctx.beginPath(); ctx.moveTo(0, h * 0.85); ctx.lineTo(w, h * 0.85); ctx.stroke()
    // Left 25%
    ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.15); ctx.lineTo(w * 0.25, h * 0.85); ctx.stroke()
    // Right 75%
    ctx.beginPath(); ctx.moveTo(w * 0.75, h * 0.15); ctx.lineTo(w * 0.75, h * 0.85); ctx.stroke()
    ctx.setLineDash([])

    // Zone labels
    ctx.font = '11px system-ui'
    ctx.fillStyle = 'rgba(107, 101, 96, 0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('FLIP', w * 0.5, h * 0.08)
    ctx.fillText('DEEPER', w * 0.5, h * 0.92)
    ctx.fillText('DISAGREE', w * 0.125, h * 0.5)
    ctx.fillText('AGREE', w * 0.875, h * 0.5)
    ctx.fillText('READ', w * 0.5, h * 0.5)

    // Draw gaze trail (last 20 points)
    const trail = buffer.slice(-20)
    for (let i = 0; i < trail.length; i++) {
      const opacity = (i / trail.length) * 0.6
      const size = 3 + (i / trail.length) * 5
      ctx.beginPath()
      ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(212, 184, 114, ${opacity})`
      ctx.fill()
    }

    // Draw current gaze point (large pulsing dot)
    if (trail.length > 0) {
      const p = trail[trail.length - 1]
      const pulse = 1 + Math.sin(Date.now() / 200) * 0.3
      ctx.beginPath()
      ctx.arc(p.x, p.y, 12 * pulse, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(212, 184, 114, 0.3)`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#D4B872'
      ctx.fill()
    }
  }, [])

  // Start on mount
  useEffect(() => {
    startTracking()
    return () => {
      if (webgazerRef.current) {
        try { webgazerRef.current.end() } catch { /* ignore */ }
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: '#1C1A18' }}>
      {/* Gaze overlay canvas (full screen, behind UI panels) */}
      <canvas
        ref={gazeCanvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'none', zIndex: 1 }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4" style={{ zIndex: 10 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#F5F2EF', letterSpacing: 2 }}>
          PERCEPTION DEBUG
        </h1>
        <button
          onClick={onClose}
          style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid #3A3530',
            background: 'transparent', color: '#9E9589', fontFamily: 'Georgia, serif',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {/* Main panels */}
      <div className="absolute bottom-0 left-0 right-0 flex gap-4 p-4" style={{ zIndex: 10 }}>

        {/* Panel 1: Webcam feed */}
        <Panel title="Camera Feed" width={320}>
          <div className="relative" style={{ borderRadius: 8, overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: 300, height: 225, objectFit: 'cover',
                borderRadius: 8, transform: 'scaleX(-1)',
              }}
            />
            <canvas ref={canvasRef} className="absolute inset-0" style={{ pointerEvents: 'none' }} />
            {!isWebcamReady && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#262220' }}>
                <p style={{ color: '#6B6560', fontSize: 12 }}>Starting camera...</p>
              </div>
            )}
          </div>
        </Panel>

        {/* Panel 2: Gaze Zone */}
        <Panel title="Gaze Zone" width={200}>
          {/* Zone map miniature */}
          <div className="relative" style={{ width: '100%', height: 120, borderRadius: 6, border: '1px solid #3A3530', overflow: 'hidden' }}>
            {/* Zone regions */}
            <div className="absolute" style={{ top: 0, left: 0, right: 0, height: '15%', background: gazeZone === 'flip' ? `${ZONE_COLORS.flip}30` : 'transparent', borderBottom: '1px dashed #3A3530', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', width: '100%', textAlign: 'center', top: 2, fontSize: 9, color: ZONE_COLORS.flip }}>FLIP</span>
            </div>
            <div className="absolute" style={{ bottom: 0, left: 0, right: 0, height: '15%', background: gazeZone === 'deeper' ? `${ZONE_COLORS.deeper}30` : 'transparent', borderTop: '1px dashed #3A3530', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', width: '100%', textAlign: 'center', bottom: 2, fontSize: 9, color: ZONE_COLORS.deeper }}>DEEPER</span>
            </div>
            <div className="absolute" style={{ top: '15%', left: 0, width: '25%', bottom: '15%', background: gazeZone === 'disagree' ? `${ZONE_COLORS.disagree}30` : 'transparent', borderRight: '1px dashed #3A3530', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', height: '100%', display: 'flex', alignItems: 'center', left: 4, fontSize: 8, color: ZONE_COLORS.disagree, writingMode: 'vertical-lr' }}>DISAGREE</span>
            </div>
            <div className="absolute" style={{ top: '15%', right: 0, width: '25%', bottom: '15%', background: gazeZone === 'agree' ? `${ZONE_COLORS.agree}30` : 'transparent', borderLeft: '1px dashed #3A3530', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', height: '100%', display: 'flex', alignItems: 'center', right: 4, fontSize: 8, color: ZONE_COLORS.agree, writingMode: 'vertical-lr' }}>AGREE</span>
            </div>
            <div className="absolute" style={{ top: '15%', left: '25%', right: '25%', bottom: '15%', background: gazeZone === 'read' ? `${ZONE_COLORS.read}20` : 'transparent', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: ZONE_COLORS.read }}>READ</span>
            </div>

            {/* Gaze dot on minimap */}
            {gazePoint && (
              <div
                className="absolute rounded-full"
                style={{
                  width: 8, height: 8,
                  backgroundColor: ZONE_COLORS[gazeZone],
                  boxShadow: `0 0 8px ${ZONE_COLORS[gazeZone]}`,
                  left: `${(gazePoint.x / window.innerWidth) * 100}%`,
                  top: `${(gazePoint.y / window.innerHeight) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left 0.05s, top 0.05s',
                }}
              />
            )}
          </div>

          {/* Active zone + dwell */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 11, color: '#9E9589' }}>Active Zone</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: ZONE_COLORS[gazeZone], textTransform: 'uppercase', letterSpacing: 1 }}>
                {gazeZone}
              </span>
            </div>
            {/* Dwell progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: '#3A3530', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 2, background: ZONE_COLORS[gazeZone] }}
                animate={{ width: `${dwellProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 9, color: '#6B6560' }}>Dwell: {Math.round(dwellProgress * 100)}%</span>
              <AnimatePresence>
                {isActivated && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: 9, color: ZONE_COLORS[gazeZone], fontWeight: 700 }}
                  >
                    ACTIVATED
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Panel>

        {/* Panel 3: Face Signals */}
        <Panel title="Face Signals" width={220}>
          <SignalMeter label="Head Nod" value={faceState.headNod} color="#D4B872" bipolar />
          <SignalMeter label="Head Shake" value={faceState.headShake} color="#C47A5A" bipolar />
          <SignalMeter label="Lean In/Back" value={faceState.leanIn} color="#8FB8A0" bipolar />
          <SignalMeter label="Brow Raise" value={faceState.browRaise} color="#E8836B" />
          <SignalMeter label="Brow Furrow" value={faceState.browFurrow} color="#9B8FB8" />
          <SignalMeter label="Smile" value={faceState.smile} color="#D4A0A0" />
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid #3A3530' }}>
            <div className="flex justify-between">
              <span style={{ fontSize: 10, color: '#6B6560' }}>Tracking</span>
              <span style={{ fontSize: 10, color: faceState.isTracking ? '#8FB8A0' : '#C47A5A' }}>
                {faceState.isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </Panel>

        {/* Panel 4: Gaze Features */}
        <Panel title="Gaze Features" width={180}>
          <div className="space-y-2">
            <Stat label="Fixated" value={gazeFeats.fixated ? 'Yes' : 'No'} color={gazeFeats.fixated ? '#8FB8A0' : '#6B6560'} />
            <Stat label="Blink Rate" value={`${gazeFeats.blinkRate.toFixed(0)} /min`} color="#D4B872" />
            <Stat label="Saccade Rate" value={`${gazeFeats.saccadeRate.toFixed(1)} /sec`} color="#E8836B" />
            <Stat label="Engagement" value={`${Math.round(gazeFeats.engagement * 100)}%`} color="#8FB8A0" />
            <div className="mt-2">
              <div style={{ height: 3, borderRadius: 2, background: '#3A3530', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${gazeFeats.engagement * 100}%`, background: '#8FB8A0', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            </div>
          </div>
        </Panel>

        {/* Panel 5: Fused Intent — THE DECISION */}
        <Panel title="Fused Intent" width={200}>
          <div className="flex flex-col items-center py-3">
            <motion.div
              className="rounded-full flex items-center justify-center mb-3"
              style={{
                width: 72, height: 72,
                background: `${INTENT_COLORS[intent.type]}20`,
                border: `2px solid ${INTENT_COLORS[intent.type]}`,
              }}
              animate={{
                boxShadow: `0 0 ${intent.confidence * 20}px ${INTENT_COLORS[intent.type]}40`,
              }}
              transition={{ duration: 0.3 }}
            >
              <span style={{
                fontSize: 12, fontWeight: 700, color: INTENT_COLORS[intent.type],
                textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 1.2,
              }}>
                {intent.type.replace('_', '\n')}
              </span>
            </motion.div>

            {/* Confidence bar */}
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 10, color: '#6B6560' }}>Confidence</span>
                <span style={{ fontSize: 10, color: INTENT_COLORS[intent.type] }}>
                  {Math.round(intent.confidence * 100)}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#3A3530', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 3, background: INTENT_COLORS[intent.type] }}
                  animate={{ width: `${intent.confidence * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            {/* Decision explanation */}
            <p style={{ fontSize: 10, color: '#6B6560', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              {getIntentExplanation(intent.type)}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ═══ Sub-components ═══

function Panel({ title, width, children }: { title: string; width: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        width, padding: 16, borderRadius: 12,
        background: 'rgba(38, 34, 32, 0.95)',
        border: '1px solid #3A3530',
        backdropFilter: 'blur(12px)',
      }}
    >
      <h3 style={{
        fontSize: 10, color: '#6B6560', textTransform: 'uppercase',
        letterSpacing: 2, marginBottom: 12, fontFamily: 'system-ui, sans-serif',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function SignalMeter({ label, value, color, bipolar = false }: {
  label: string; value: number; color: string; bipolar?: boolean
}) {
  const barWidth = bipolar ? Math.abs(value) * 50 : value * 100
  const barOffset = bipolar ? (value >= 0 ? 50 : 50 - barWidth) : 0

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-0.5">
        <span style={{ fontSize: 10, color: '#9E9589' }}>{label}</span>
        <span style={{ fontSize: 10, color, fontFamily: 'monospace' }}>{value.toFixed(2)}</span>
      </div>
      <div className="relative" style={{ height: 4, borderRadius: 2, background: '#3A3530', overflow: 'hidden' }}>
        {bipolar && (
          <div className="absolute" style={{ left: '50%', top: 0, bottom: 0, width: 1, background: '#6B6560' }} />
        )}
        <motion.div
          className="absolute"
          style={{
            height: '100%', borderRadius: 2, background: color,
            left: `${barOffset}%`,
          }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ fontSize: 11, color: '#9E9589' }}>{label}</span>
      <span style={{ fontSize: 11, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

function getIntentExplanation(type: IntentType): string {
  switch (type) {
    case 'agree': return 'Eyes + head nod detected agreement'
    case 'disagree': return 'Gaze in disagree zone with dwell'
    case 'deeper': return 'Eyes dropped to bottom zone'
    case 'flip': return 'Eyes moved to top zone'
    case 'deep_read': return 'Eyes focused, mouse idle — reading deeply'
    case 'navigate': return 'Mouse active, eyes unfocused'
    case 'compare': return 'Eyes on one card, mouse on another'
    case 'confused': return 'Brow furrow + eye darting or conflicted signals'
    case 'fatigued': return 'High blink rate detected'
    case 'engaged': return 'Lean in + steady fixation'
    case 'pulling_away': return 'Lean back + gaze wandering'
    case 'idle': return 'No strong signals detected'
  }
}
