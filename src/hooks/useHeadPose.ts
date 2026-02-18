import { useEffect, useRef, useState, useCallback } from 'react'

interface HeadPose {
  yaw: number   // -1 (left) to +1 (right)
  pitch: number // -1 (up) to +1 (down)
  faceDetected: boolean
}

const EMA_ALPHA = 0.7 // higher = more responsive, less smooth
const TARGET_FPS = 60
const FRAME_INTERVAL = 1000 / TARGET_FPS
const CALIBRATION_FRAMES = 15 // ~0.5 second at 30fps
const RECALIBRATION_ALPHA = 0.005 // slow rolling average for continuous recalibration

/**
 * Extracts head yaw/pitch from MediaPipe FaceLandmarker transformation matrix.
 * Auto-calibrates neutral position from the first ~1 second of readings,
 * so the user's natural resting head angle is treated as center.
 */
export default function useHeadPose(videoStream: MediaStream | null): HeadPose {
  const [pose, setPose] = useState<HeadPose>({ yaw: 0, pitch: 0, faceDetected: false })
  const faceLandmarkerRef = useRef<import('@mediapipe/tasks-vision').FaceLandmarker | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)
  const smoothYaw = useRef(0)
  const smoothPitch = useRef(0)
  const initializingRef = useRef(false)

  // Auto-calibration: capture resting head position
  const neutralYaw = useRef(0)
  const neutralPitch = useRef(0)
  const calibrationSamples = useRef<{ yaw: number; pitch: number }[]>([])
  const isCalibrated = useRef(false)

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }
    if (faceLandmarkerRef.current) {
      faceLandmarkerRef.current.close()
      faceLandmarkerRef.current = null
    }
    smoothYaw.current = 0
    smoothPitch.current = 0
    neutralYaw.current = 0
    neutralPitch.current = 0
    calibrationSamples.current = []
    isCalibrated.current = false
    initializingRef.current = false
  }, [])

  useEffect(() => {
    if (!videoStream) {
      cleanup()
      setPose({ yaw: 0, pitch: 0, faceDetected: false })
      return
    }

    if (initializingRef.current) return
    initializingRef.current = true

    let cancelled = false

    async function init() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        if (cancelled) return

        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        if (cancelled) return

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputFacialTransformationMatrixes: true,
          numFaces: 1,
        })

        if (cancelled) {
          faceLandmarker.close()
          return
        }

        faceLandmarkerRef.current = faceLandmarker

        // Create hidden video element for this stream
        const video = document.createElement('video')
        video.style.display = 'none'
        video.playsInline = true
        video.muted = true
        video.srcObject = videoStream
        document.body.appendChild(video)
        await video.play()

        if (cancelled) {
          video.pause()
          video.srcObject = null
          video.remove()
          faceLandmarker.close()
          return
        }

        videoRef.current = video

        // Detection loop
        function detect(now: number) {
          if (cancelled) return

          rafRef.current = requestAnimationFrame(detect)

          // Throttle to target FPS
          if (now - lastTimeRef.current < FRAME_INTERVAL) return
          lastTimeRef.current = now

          if (!faceLandmarkerRef.current || !videoRef.current) return
          if (videoRef.current.readyState < 2) return

          try {
            const result = faceLandmarkerRef.current.detectForVideo(videoRef.current, now)

            if (!result.facialTransformationMatrixes || result.facialTransformationMatrixes.length === 0) {
              setPose(p => p.faceDetected ? { ...p, faceDetected: false } : p)
              return
            }

            // Extract rotation from 4x4 transformation matrix (row-major)
            const mat = result.facialTransformationMatrixes[0].data
            const rawYaw = Math.atan2(mat[8], mat[0])
            const rawPitch = Math.asin(Math.max(-1, Math.min(1, -mat[6])))

            // Normalize to roughly [-1, 1] range (±12° head turn = full range)
            const maxAngle = (12 * Math.PI) / 180
            const normYaw = Math.max(-1, Math.min(1, rawYaw / maxAngle))
            const normPitch = Math.max(-1, Math.min(1, rawPitch / maxAngle))

            // Auto-calibration: collect samples for the first ~1 second
            if (!isCalibrated.current) {
              calibrationSamples.current.push({ yaw: normYaw, pitch: normPitch })
              if (calibrationSamples.current.length >= CALIBRATION_FRAMES) {
                const samples = calibrationSamples.current
                neutralYaw.current = samples.reduce((s, p) => s + p.yaw, 0) / samples.length
                neutralPitch.current = samples.reduce((s, p) => s + p.pitch, 0) / samples.length
                isCalibrated.current = true
              }
              // Don't emit steering during calibration
              setPose({ yaw: 0, pitch: 0, faceDetected: true })
              return
            }

            // Rolling recalibration: slowly drift neutral toward current reading
            // This adapts to posture changes over time (leaning, slouching, shifting)
            neutralYaw.current += (normYaw - neutralYaw.current) * RECALIBRATION_ALPHA
            neutralPitch.current += (normPitch - neutralPitch.current) * RECALIBRATION_ALPHA

            // Subtract neutral offset so resting position = center
            const calibratedYaw = Math.max(-1, Math.min(1, normYaw - neutralYaw.current))
            const calibratedPitch = Math.max(-1, Math.min(1, normPitch - neutralPitch.current))

            // EMA smoothing
            smoothYaw.current = smoothYaw.current * (1 - EMA_ALPHA) + calibratedYaw * EMA_ALPHA
            smoothPitch.current = smoothPitch.current * (1 - EMA_ALPHA) + calibratedPitch * EMA_ALPHA

            setPose({
              yaw: smoothYaw.current,
              pitch: smoothPitch.current,
              faceDetected: true,
            })
          } catch {
            // Detection can fail transiently, ignore
          }
        }

        rafRef.current = requestAnimationFrame(detect)
      } catch (err) {
        console.warn('Head pose tracking unavailable:', err)
        initializingRef.current = false
      }
    }

    init()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [videoStream, cleanup])

  return pose
}
