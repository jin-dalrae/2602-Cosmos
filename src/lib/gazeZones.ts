import type { GazePoint, GazeZone } from './types'

/**
 * Screen layout:
 * ┌─────────────────────────────────┐
 * │          FLIP (top 15%)         │
 * │  ┌─────────────────────────┐    │
 * │  │DISAGREE│  READ   │AGREE │    │
 * │  │(left   │ (center │(right│    │
 * │  │ 25%)   │  50%)   │ 25%) │    │
 * │  └─────────────────────────┘    │
 * │        DEEPER (bottom 15%)      │
 * └─────────────────────────────────┘
 */

interface ZoneResult {
  zone: GazeZone
  dwellProgress: number
  isActivated: boolean
}

// Dwell thresholds per zone (milliseconds needed to activate)
const ZONE_THRESHOLDS: Record<GazeZone, number> = {
  read: 300,
  agree: 800,
  disagree: 800,
  deeper: 1000,
  flip: 1000,
  wander: Infinity,
}

function classifyZone(x: number, y: number, screenW: number, screenH: number): GazeZone {
  const relX = x / screenW
  const relY = y / screenH

  // Top 15% = flip
  if (relY < 0.15) return 'flip'

  // Bottom 15% = deeper
  if (relY > 0.85) return 'deeper'

  // Middle band: left 25% = disagree, right 25% = agree, center 50% = read
  if (relX < 0.25) return 'disagree'
  if (relX > 0.75) return 'agree'

  return 'read'
}

export function createZoneDetector() {
  let currentZone: GazeZone = 'wander'
  let dwellStartMs: number = 0
  let lastActivatedZone: GazeZone | null = null

  // Hysteresis: require the gaze to stay in a new zone for a brief period
  // before switching, to prevent flicker at zone boundaries
  const HYSTERESIS_MS = 80
  let pendingZone: GazeZone | null = null
  let pendingZoneStartMs: number = 0

  function update(point: GazePoint | null, screenW: number, screenH: number): ZoneResult {
    if (!point) {
      // No gaze data — wander state
      currentZone = 'wander'
      pendingZone = null
      return {
        zone: 'wander',
        dwellProgress: 0,
        isActivated: false,
      }
    }

    const rawZone = classifyZone(point.x, point.y, screenW, screenH)
    const now = point.timestamp

    // Hysteresis logic: only switch zone if the new zone has been sustained
    if (rawZone !== currentZone) {
      if (pendingZone === rawZone) {
        // We've been seeing this new zone — check if hysteresis period passed
        if (now - pendingZoneStartMs >= HYSTERESIS_MS) {
          // Commit zone switch
          currentZone = rawZone
          dwellStartMs = pendingZoneStartMs
          pendingZone = null
          lastActivatedZone = null
        }
      } else {
        // Start tracking a new pending zone
        pendingZone = rawZone
        pendingZoneStartMs = now
      }
    } else {
      // Same zone as current — clear any pending
      pendingZone = null
    }

    // Compute dwell time in current zone
    if (dwellStartMs === 0) {
      dwellStartMs = now
    }

    const dwellMs = now - dwellStartMs
    const threshold = ZONE_THRESHOLDS[currentZone]
    const dwellProgress = threshold === Infinity ? 0 : Math.min(dwellMs / threshold, 1)
    const isActivated =
      dwellProgress >= 1 &&
      lastActivatedZone !== currentZone

    if (isActivated) {
      lastActivatedZone = currentZone
    }

    return {
      zone: currentZone,
      dwellProgress,
      isActivated,
    }
  }

  return { update }
}
