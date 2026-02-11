import type { GazeState, FaceState, IntentSignal, IntentType } from './types'

interface MouseState {
  x: number
  y: number
  isActive: boolean
}

/**
 * Fuse gaze, face, and mouse inputs into a single IntentSignal.
 *
 * Fusion rules (from the PRD):
 * - Eyes + mouse same area        -> high confidence intent
 * - Eyes focused, mouse idle      -> trust gaze (deep_read)
 * - Mouse active, eyes unfocused  -> trust mouse (navigate)
 * - Brow furrow + eye darting     -> confused
 * - Brow furrow + steady gaze     -> engaged (not confused)
 * - Lean in + long fixation       -> engaged
 * - Lean back + gaze wander       -> pulling_away
 * - Head nod + eyes right         -> agree (high confidence)
 * - Head shake + eyes right       -> confused (conflicted signal)
 * - High blink rate               -> fatigued
 */
export function fuseInputs(
  gazeState: GazeState | null,
  faceState: FaceState | null,
  mouseState: MouseState | null,
): IntentSignal {
  const now = Date.now()

  // Default idle signal
  const idle: IntentSignal = {
    type: 'idle',
    confidence: 0.3,
    source: 'fused',
    timestamp: now,
  }

  // If no tracking at all, return idle
  if (!gazeState && !faceState && !mouseState) {
    return idle
  }

  // Extract gaze features
  const gazeAvailable = gazeState !== null && gazeState.isCalibrated && gazeState.confidence > 0.3
  const isFixated = gazeState?.isFixated ?? false
  const fixationLong = (gazeState?.fixationDurationMs ?? 0) > 800
  const blinkRate = gazeState?.blinkRate ?? 0
  const saccadeRate = gazeState?.saccadeRate ?? 0
  const gazeZone = gazeState?.zone ?? 'wander'
  const eyeDarting = saccadeRate > 3.0
  const gazeWandering = gazeZone === 'wander'

  // Extract face features
  const faceAvailable = faceState !== null && faceState.isTracking
  const browFurrow = faceState?.browFurrow ?? 0
  const leanIn = faceState?.leanIn ?? 0
  const headNod = faceState?.headNod ?? 0
  const headShake = faceState?.headShake ?? 0

  // Extract mouse features
  const mouseActive = mouseState?.isActive ?? false

  // === Priority 1: Fatigue check (high blink rate) ===
  if (blinkRate > 25) {
    return {
      type: 'fatigued',
      confidence: clamp(blinkRate / 40, 0.5, 1),
      source: 'fused',
      timestamp: now,
    }
  }

  // === Priority 2: Confusion check ===
  // Brow furrow + eye darting -> confused
  if (faceAvailable && browFurrow > 0.4 && eyeDarting) {
    return {
      type: 'confused',
      confidence: clamp((browFurrow + (saccadeRate / 5)) / 2, 0.5, 1),
      source: 'fused',
      timestamp: now,
    }
  }

  // Head shake + eyes on content (zone 'read' or similar) -> conflicted = confused
  if (faceAvailable && headShake < -0.3 && gazeAvailable && !gazeWandering) {
    return {
      type: 'confused',
      confidence: clamp(Math.abs(headShake), 0.4, 0.9),
      source: 'fused',
      timestamp: now,
    }
  }

  // === Priority 3: Agreement check ===
  // Head nod + eyes on agree zone (right side) -> agree
  if (faceAvailable && headNod > 0.3 && gazeAvailable && (gazeZone === 'agree' || gazeZone === 'read')) {
    return {
      type: 'agree',
      confidence: clamp(headNod + (gazeState?.confidence ?? 0), 0.5, 1),
      source: 'fused',
      timestamp: now,
    }
  }

  // === Priority 4: Engagement vs pulling away ===
  // Lean back + gaze wander -> pulling_away
  if (faceAvailable && leanIn < -0.3 && gazeWandering) {
    return {
      type: 'pulling_away',
      confidence: clamp(Math.abs(leanIn), 0.4, 0.9),
      source: 'fused',
      timestamp: now,
    }
  }

  // Brow furrow + steady gaze -> engaged (not confused)
  if (faceAvailable && browFurrow > 0.3 && isFixated && !eyeDarting) {
    return {
      type: 'engaged',
      confidence: clamp(browFurrow + 0.3, 0.5, 1),
      source: 'fused',
      timestamp: now,
    }
  }

  // Lean in + long fixation -> engaged
  if (faceAvailable && leanIn > 0.2 && fixationLong) {
    return {
      type: 'engaged',
      confidence: clamp(leanIn + 0.4, 0.5, 1),
      source: 'fused',
      timestamp: now,
    }
  }

  // === Priority 5: Gaze zone-based intents ===
  if (gazeAvailable && isFixated) {
    // Map gaze zones to intent types
    const zoneIntent = gazeZoneToIntent(gazeZone)

    // Eyes + mouse same area -> high confidence
    if (mouseActive && zoneIntent !== 'idle') {
      return {
        type: zoneIntent,
        confidence: clamp((gazeState?.confidence ?? 0.5) + 0.2, 0.6, 1),
        source: 'fused',
        timestamp: now,
      }
    }

    // Eyes focused, mouse idle -> trust gaze (deep_read)
    if (!mouseActive && isFixated && fixationLong) {
      return {
        type: 'deep_read',
        confidence: clamp(gazeState?.confidence ?? 0.5, 0.4, 0.9),
        source: 'gaze',
        timestamp: now,
      }
    }

    // Return zone-based intent
    if (zoneIntent !== 'idle') {
      return {
        type: zoneIntent,
        confidence: gazeState?.confidence ?? 0.5,
        source: 'gaze',
        timestamp: now,
      }
    }
  }

  // === Priority 6: Mouse active, eyes unfocused -> trust mouse (navigate) ===
  if (mouseActive && (!gazeAvailable || !isFixated)) {
    return {
      type: 'navigate',
      confidence: 0.6,
      source: 'mouse',
      timestamp: now,
    }
  }

  // === Fallback: idle ===
  return idle
}

/**
 * Map gaze zones to intent types.
 */
function gazeZoneToIntent(zone: string): IntentType {
  switch (zone) {
    case 'agree':
      return 'agree'
    case 'disagree':
      return 'disagree'
    case 'deeper':
      return 'deeper'
    case 'flip':
      return 'flip'
    case 'read':
      return 'deep_read'
    case 'wander':
    default:
      return 'idle'
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
