import type { FaceState } from './types'

/**
 * MediaPipe FaceMesh landmark format: 468 points, each with x, y, z
 * normalized to [0, 1] relative to the image.
 */
interface Landmark {
  x: number
  y: number
  z: number
}

// Key landmark indices (MediaPipe FaceMesh)
const NOSE_TIP = 1
const LEFT_EYE_INNER = 33
const LEFT_EYE_OUTER = 133
const RIGHT_EYE_INNER = 362
const RIGHT_EYE_OUTER = 263
const LEFT_BROW = 70
const RIGHT_BROW = 300
const LIP_LEFT = 61
const LIP_RIGHT = 291
const LIP_TOP = 0
const LIP_BOTTOM = 17

// Exponential moving average smoothing factor
const ALPHA = 0.3

function ema(prev: number, current: number, alpha: number = ALPHA): number {
  return prev * (1 - alpha) + current * alpha
}

function distance2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function distance3D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Compute the bounding box area of the face in normalized coordinates.
 * Used as a proxy for distance to camera (larger area = closer).
 */
function computeFaceBboxArea(landmarks: Landmark[]): number {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x
    if (lm.x > maxX) maxX = lm.x
    if (lm.y < minY) minY = lm.y
    if (lm.y > maxY) maxY = lm.y
  }

  return (maxX - minX) * (maxY - minY)
}

export function createFaceSignalProcessor() {
  // Smoothed state
  let smoothedNodDelta = 0
  let smoothedShakeDelta = 0
  let smoothedLeanIn = 0
  let smoothedBrowRaise = 0
  let smoothedBrowFurrow = 0
  let smoothedSmile = 0

  // Previous frame values for deltas
  let prevNoseY: number | null = null
  let prevNoseX: number | null = null
  let prevFaceArea: number | null = null

  // Baselines (computed from first few frames)
  let baselineBrowDist: number | null = null
  let baselineLipWidth: number | null = null
  let frameCount = 0
  let baselineBrowSum = 0
  let baselineLipWidthSum = 0

  const BASELINE_FRAMES = 15

  function process(landmarks: Landmark[]): FaceState {
    if (!landmarks || landmarks.length < 468) {
      return {
        headNod: 0,
        headShake: 0,
        leanIn: 0,
        browRaise: 0,
        browFurrow: 0,
        smile: 0,
        isTracking: false,
      }
    }

    frameCount++

    const noseTip = landmarks[NOSE_TIP]
    const leftEyeInner = landmarks[LEFT_EYE_INNER]
    const leftEyeOuter = landmarks[LEFT_EYE_OUTER]
    const rightEyeInner = landmarks[RIGHT_EYE_INNER]
    const rightEyeOuter = landmarks[RIGHT_EYE_OUTER]
    const leftBrow = landmarks[LEFT_BROW]
    const rightBrow = landmarks[RIGHT_BROW]
    const lipLeft = landmarks[LIP_LEFT]
    const lipRight = landmarks[LIP_RIGHT]
    const lipTop = landmarks[LIP_TOP]
    const lipBottom = landmarks[LIP_BOTTOM]

    // --- Head nod: Y delta of nose tip ---
    let rawNod = 0
    if (prevNoseY !== null) {
      // Positive delta = moving down = nodding
      rawNod = noseTip.y - prevNoseY
    }
    prevNoseY = noseTip.y
    // Scale: typical nod produces ~0.01-0.03 delta per frame in normalized coords
    const scaledNod = clamp(rawNod * 50, -1, 1)
    smoothedNodDelta = ema(smoothedNodDelta, scaledNod)

    // --- Head shake: X delta of nose tip ---
    let rawShake = 0
    if (prevNoseX !== null) {
      rawShake = noseTip.x - prevNoseX
    }
    prevNoseX = noseTip.x
    const scaledShake = clamp(rawShake * 50, -1, 1)
    smoothedShakeDelta = ema(smoothedShakeDelta, scaledShake)

    // --- Lean in/back: face bbox area change ---
    const currentArea = computeFaceBboxArea(landmarks)
    let rawLean = 0
    if (prevFaceArea !== null && prevFaceArea > 0) {
      // Ratio > 1 means getting closer, < 1 means pulling back
      const ratio = currentArea / prevFaceArea
      rawLean = (ratio - 1) * 30 // Scale up the small changes
    }
    prevFaceArea = currentArea
    smoothedLeanIn = ema(smoothedLeanIn, clamp(rawLean, -1, 1))

    // --- Brow raise / furrow ---
    // Distance from brow landmarks to corresponding eye landmarks
    const leftBrowDist = distance2D(leftBrow, leftEyeInner)
    const rightBrowDist = distance2D(rightBrow, rightEyeInner)
    const avgBrowDist = (leftBrowDist + rightBrowDist) / 2

    // Build baseline
    if (frameCount <= BASELINE_FRAMES) {
      baselineBrowSum += avgBrowDist
      if (frameCount === BASELINE_FRAMES) {
        baselineBrowDist = baselineBrowSum / BASELINE_FRAMES
      }
    }

    if (baselineBrowDist !== null && baselineBrowDist > 0) {
      const browDeviation = (avgBrowDist - baselineBrowDist) / baselineBrowDist
      // Positive deviation = raised brows, negative = furrowed
      if (browDeviation > 0) {
        smoothedBrowRaise = ema(smoothedBrowRaise, clamp(browDeviation * 10, 0, 1))
        smoothedBrowFurrow = ema(smoothedBrowFurrow, 0)
      } else {
        smoothedBrowRaise = ema(smoothedBrowRaise, 0)
        smoothedBrowFurrow = ema(smoothedBrowFurrow, clamp(Math.abs(browDeviation) * 10, 0, 1))
      }
    }

    // --- Smile detection ---
    // Smile: lip corners spread apart, lip height decreases
    const lipWidth = distance3D(lipLeft, lipRight)
    const lipHeight = distance3D(lipTop, lipBottom)

    // Build baseline
    if (frameCount <= BASELINE_FRAMES) {
      baselineLipWidthSum += lipWidth
      if (frameCount === BASELINE_FRAMES) {
        baselineLipWidth = baselineLipWidthSum / BASELINE_FRAMES
      }
    }

    if (baselineLipWidth !== null && baselineLipWidth > 0) {
      // Smile ratio: wider lips + thinner opening
      const widthRatio = lipWidth / baselineLipWidth
      const aspectRatio = lipHeight > 0 ? lipWidth / lipHeight : 0

      // When smiling, width increases and aspect ratio goes up
      const smileScore = clamp((widthRatio - 1) * 5 + (aspectRatio - 3) * 0.2, 0, 1)
      smoothedSmile = ema(smoothedSmile, smileScore)
    }

    return {
      headNod: smoothedNodDelta,
      headShake: smoothedShakeDelta,
      leanIn: smoothedLeanIn,
      browRaise: smoothedBrowRaise,
      browFurrow: smoothedBrowFurrow,
      smile: smoothedSmile,
      isTracking: true,
    }
  }

  function reset(): void {
    smoothedNodDelta = 0
    smoothedShakeDelta = 0
    smoothedLeanIn = 0
    smoothedBrowRaise = 0
    smoothedBrowFurrow = 0
    smoothedSmile = 0
    prevNoseY = null
    prevNoseX = null
    prevFaceArea = null
    baselineBrowDist = null
    baselineLipWidth = null
    frameCount = 0
    baselineBrowSum = 0
    baselineLipWidthSum = 0
  }

  return { process, reset }
}
