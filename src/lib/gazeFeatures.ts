import type { GazePoint } from './types'

/**
 * Detect a fixation: a cluster of gaze points within `thresholdPx` pixels
 * that persists for at least `minDurationMs` milliseconds.
 * Returns the centroid and duration if found, null otherwise.
 */
export function detectFixation(
  points: GazePoint[],
  thresholdPx = 50,
  minDurationMs = 200,
): { x: number; y: number; duration: number } | null {
  if (points.length < 2) return null

  // Walk backwards from the most recent point to find the longest fixation cluster
  const latest = points[points.length - 1]
  let clusterStart = points.length - 1

  for (let i = points.length - 2; i >= 0; i--) {
    const dx = points[i].x - latest.x
    const dy = points[i].y - latest.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > thresholdPx) break
    clusterStart = i
  }

  const cluster = points.slice(clusterStart)
  if (cluster.length < 2) return null

  const duration = cluster[cluster.length - 1].timestamp - cluster[0].timestamp
  if (duration < minDurationMs) return null

  // Compute centroid
  let sumX = 0
  let sumY = 0
  for (const p of cluster) {
    sumX += p.x
    sumY += p.y
  }

  return {
    x: sumX / cluster.length,
    y: sumY / cluster.length,
    duration,
  }
}

/**
 * Compute blink rate from gaze data.
 * A blink is a gap in data between 100ms and 400ms.
 * Returns estimated blinks per minute.
 */
export function computeBlinkRate(points: GazePoint[]): number {
  if (points.length < 2) return 0

  const totalTimeMs = points[points.length - 1].timestamp - points[0].timestamp
  if (totalTimeMs <= 0) return 0

  let blinkCount = 0

  for (let i = 1; i < points.length; i++) {
    const gap = points[i].timestamp - points[i - 1].timestamp
    if (gap > 100 && gap < 400) {
      blinkCount++
    }
  }

  // Extrapolate to per-minute rate
  const totalTimeMinutes = totalTimeMs / 60_000
  if (totalTimeMinutes <= 0) return 0

  return blinkCount / totalTimeMinutes
}

/**
 * Detect saccades: rapid eye movements exceeding 100px in under 50ms.
 * Returns the number of saccades per second.
 */
export function detectSaccades(points: GazePoint[]): number {
  if (points.length < 2) return 0

  const totalTimeMs = points[points.length - 1].timestamp - points[0].timestamp
  if (totalTimeMs <= 0) return 0

  let saccadeCount = 0

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const dt = points[i].timestamp - points[i - 1].timestamp

    if (dist > 100 && dt > 0 && dt < 50) {
      saccadeCount++
    }
  }

  const totalTimeSec = totalTimeMs / 1000
  return saccadeCount / totalTimeSec
}

/**
 * Estimate engagement from gaze point variance.
 * Higher spatial variance in recent points suggests more scanning/arousal.
 * Returns a normalized 0-1 value.
 */
export function estimateEngagement(points: GazePoint[]): number {
  if (points.length < 3) return 0

  // Compute mean
  let meanX = 0
  let meanY = 0
  for (const p of points) {
    meanX += p.x
    meanY += p.y
  }
  meanX /= points.length
  meanY /= points.length

  // Compute variance
  let variance = 0
  for (const p of points) {
    const dx = p.x - meanX
    const dy = p.y - meanY
    variance += dx * dx + dy * dy
  }
  variance /= points.length

  // Standard deviation
  const stdDev = Math.sqrt(variance)

  // Normalize: stdDev of ~300px maps to engagement=1
  // Very tight cluster (~0px) maps to 0, very spread (~300+px) maps to 1
  const normalized = Math.min(stdDev / 300, 1)

  return normalized
}
