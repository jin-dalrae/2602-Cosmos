/**
 * GazeLearner — Passive gaze calibration from natural click behavior.
 *
 * Every time a user clicks a card while gaze mode is active, we record
 * their head pose and the card's actual direction on the sphere.
 * After enough samples, we fit a linear correction model (scale + offset
 * per axis) that makes gaze browsing progressively more accurate.
 *
 * No explicit calibration step — users just browse normally.
 */

interface GazeSample {
  headYaw: number        // raw head pose yaw [-1, +1]
  headPitch: number      // raw head pose pitch [-1, +1]
  intendedYaw: number    // where they actually wanted to look (derived offset)
  intendedPitch: number
  timestamp: number
}

interface GazeCorrection {
  yawScale: number
  yawOffset: number
  pitchScale: number
  pitchOffset: number
  confidence: number  // 0–1
}

const MIN_SAMPLES = 5
const MAX_SAMPLES = 50  // rolling window
const DECAY_HALF_LIFE = 60_000 // 1 minute — recent clicks matter more

export class GazeLearner {
  private samples: GazeSample[] = []
  private correction: GazeCorrection = {
    yawScale: 1,
    yawOffset: 0,
    pitchScale: 1,
    pitchOffset: 0,
    confidence: 0,
  }

  /**
   * Record a click event.
   *
   * @param headYaw    Raw head pose yaw at click time [-1, +1]
   * @param headPitch  Raw head pose pitch at click time [-1, +1]
   * @param cardTheta  Clicked card's theta on sphere (radians)
   * @param cardPhi    Clicked card's phi on sphere (radians)
   * @param cameraTheta Camera's current theta (radians)
   * @param cameraPhi   Camera's current phi (radians)
   * @param maxOffset   Max angular offset used in steering (radians)
   */
  recordClick(
    headYaw: number,
    headPitch: number,
    cardTheta: number,
    cardPhi: number,
    cameraTheta: number,
    cameraPhi: number,
    maxOffset: number,
  ): void {
    // Compute what angular offset the user actually intended
    // (card direction relative to camera base rotation)
    let dTheta = cardTheta - cameraTheta
    // Normalize to [-PI, PI]
    while (dTheta > Math.PI) dTheta -= Math.PI * 2
    while (dTheta < -Math.PI) dTheta += Math.PI * 2

    const dPhi = -(cardPhi - cameraPhi) // negative because pitch is inverted

    // Normalize intended offset to [-1, +1] range (same as head pose)
    const intendedYaw = Math.max(-1, Math.min(1, dTheta / maxOffset))
    const intendedPitch = Math.max(-1, Math.min(1, dPhi / maxOffset))

    this.samples.push({
      headYaw,
      headPitch,
      intendedYaw,
      intendedPitch,
      timestamp: Date.now(),
    })

    // Keep rolling window
    if (this.samples.length > MAX_SAMPLES) {
      this.samples = this.samples.slice(-MAX_SAMPLES)
    }

    // Refit model
    if (this.samples.length >= MIN_SAMPLES) {
      this.fit()
    }
  }

  /**
   * Fit linear correction model: intended = scale * head + offset
   * Uses weighted least squares with exponential time decay.
   */
  private fit(): void {
    const now = Date.now()

    // Compute time-decayed weights
    const weights = this.samples.map(s => {
      const age = now - s.timestamp
      return Math.pow(0.5, age / DECAY_HALF_LIFE)
    })
    const totalWeight = weights.reduce((a, b) => a + b, 0)

    // Weighted means
    let meanHY = 0, meanHP = 0, meanIY = 0, meanIP = 0
    for (let i = 0; i < this.samples.length; i++) {
      const w = weights[i] / totalWeight
      meanHY += this.samples[i].headYaw * w
      meanHP += this.samples[i].headPitch * w
      meanIY += this.samples[i].intendedYaw * w
      meanIP += this.samples[i].intendedPitch * w
    }

    // Weighted linear regression for each axis
    // slope = sum(w * (x - meanX) * (y - meanY)) / sum(w * (x - meanX)^2)
    let numYaw = 0, denYaw = 0
    let numPitch = 0, denPitch = 0

    for (let i = 0; i < this.samples.length; i++) {
      const w = weights[i]
      const dhy = this.samples[i].headYaw - meanHY
      const diy = this.samples[i].intendedYaw - meanIY
      numYaw += w * dhy * diy
      denYaw += w * dhy * dhy

      const dhp = this.samples[i].headPitch - meanHP
      const dip = this.samples[i].intendedPitch - meanIP
      numPitch += w * dhp * dip
      denPitch += w * dhp * dhp
    }

    const yawScale = denYaw > 0.001 ? numYaw / denYaw : 1
    const pitchScale = denPitch > 0.001 ? numPitch / denPitch : 1

    // Clamp scales to reasonable range (0.3–3.0)
    const clampScale = (s: number) => Math.max(0.3, Math.min(3.0, s))

    this.correction = {
      yawScale: clampScale(yawScale),
      yawOffset: meanIY - clampScale(yawScale) * meanHY,
      pitchScale: clampScale(pitchScale),
      pitchOffset: meanIP - clampScale(pitchScale) * meanHP,
      confidence: Math.min(1, this.samples.length / 20), // full confidence at 20 samples
    }
  }

  /**
   * Apply learned correction to raw head pose.
   * Blends between raw and corrected based on confidence.
   */
  correct(rawYaw: number, rawPitch: number): { yaw: number; pitch: number } {
    if (this.correction.confidence === 0) {
      return { yaw: rawYaw, pitch: rawPitch }
    }

    const c = this.correction
    const correctedYaw = rawYaw * c.yawScale + c.yawOffset
    const correctedPitch = rawPitch * c.pitchScale + c.pitchOffset

    // Blend: lerp from raw toward corrected based on confidence
    const t = c.confidence
    return {
      yaw: Math.max(-1, Math.min(1, rawYaw * (1 - t) + correctedYaw * t)),
      pitch: Math.max(-1, Math.min(1, rawPitch * (1 - t) + correctedPitch * t)),
    }
  }

  /** Current correction state (for debug display) */
  getCorrection(): GazeCorrection {
    return { ...this.correction }
  }

  /** Number of samples collected */
  get sampleCount(): number {
    return this.samples.length
  }
}
