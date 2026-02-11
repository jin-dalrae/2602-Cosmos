import type { GazeState, FaceState, Reaction, BehaviorPattern, UserBehaviorModel } from './types'

/**
 * Signal names extracted from gaze + face state before each action.
 * These are the behavioral cues we track correlations for.
 */
type SignalName =
  | 'head_nod'
  | 'head_shake'
  | 'lean_in'
  | 'lean_back'
  | 'brow_raise'
  | 'brow_furrow'
  | 'smile'
  | 'gaze_agree'
  | 'gaze_disagree'
  | 'gaze_deeper'
  | 'gaze_flip'
  | 'gaze_read'
  | 'gaze_wander'

interface Observation {
  signals: SignalName[]
  outcome: Reaction
  timestamp: number
}

/** Thresholds for extracting discrete signals from continuous values */
const SIGNAL_THRESHOLD = 0.25

function extractSignals(
  gazeState: GazeState | null,
  faceState: FaceState | null,
): SignalName[] {
  const signals: SignalName[] = []

  if (faceState && faceState.isTracking) {
    if (faceState.headNod > SIGNAL_THRESHOLD) signals.push('head_nod')
    if (faceState.headShake < -SIGNAL_THRESHOLD) signals.push('head_shake')
    if (faceState.leanIn > SIGNAL_THRESHOLD) signals.push('lean_in')
    if (faceState.leanIn < -SIGNAL_THRESHOLD) signals.push('lean_back')
    if (faceState.browRaise > SIGNAL_THRESHOLD) signals.push('brow_raise')
    if (faceState.browFurrow > SIGNAL_THRESHOLD) signals.push('brow_furrow')
    if (faceState.smile > SIGNAL_THRESHOLD) signals.push('smile')
  }

  if (gazeState && gazeState.isCalibrated && gazeState.confidence > 0.3) {
    const zone = gazeState.zone
    if (zone === 'agree') signals.push('gaze_agree')
    else if (zone === 'disagree') signals.push('gaze_disagree')
    else if (zone === 'deeper') signals.push('gaze_deeper')
    else if (zone === 'flip') signals.push('gaze_flip')
    else if (zone === 'read') signals.push('gaze_read')
    else if (zone === 'wander') signals.push('gaze_wander')
  }

  return signals
}

/**
 * Per-user adaptive behavior model. Learns signal->reaction correlations
 * entirely on the client side using running averages.
 *
 * Four phases:
 *   Phase 1 (0-9 actions):   Observe only. Record gaze+face state before every action.
 *   Phase 2 (10-19 actions): Build running averages. "This person nods before agreeing 80%."
 *   Phase 3 (20+ actions):   Start predicting. Return predicted reaction + confidence.
 *   Phase 4 (ongoing):       Every confirmed/contradicted prediction updates the model.
 */
export function createAdaptiveModel(): {
  recordObservation: (gazeState: GazeState | null, faceState: FaceState | null, outcome: Reaction) => void
  predict: (gazeState: GazeState | null, faceState: FaceState | null) => { reaction: Reaction; confidence: number } | null
  getModel: () => UserBehaviorModel
} {
  const observations: Observation[] = []

  // Running tallies: signal -> outcome -> count
  const signalOutcomeCounts = new Map<string, Map<Reaction, number>>()
  // signal -> total observations containing that signal
  const signalTotalCounts = new Map<string, number>()

  let lastPrediction: { reaction: Reaction; confidence: number } | null = null
  let correctPredictions = 0
  let totalPredictions = 0

  function getPhase(): UserBehaviorModel['phase'] {
    const total = observations.length
    if (total < 10) return 'observe'
    if (total < 20) return 'model'
    if (totalPredictions < 5) return 'predict'
    return 'refine'
  }

  function updateCounts(signals: SignalName[], outcome: Reaction): void {
    for (const signal of signals) {
      // Update total count for this signal
      signalTotalCounts.set(signal, (signalTotalCounts.get(signal) ?? 0) + 1)

      // Update signal->outcome count
      if (!signalOutcomeCounts.has(signal)) {
        signalOutcomeCounts.set(signal, new Map())
      }
      const outcomeMap = signalOutcomeCounts.get(signal)!
      outcomeMap.set(outcome, (outcomeMap.get(outcome) ?? 0) + 1)
    }
  }

  function getCorrelation(signal: string, outcome: Reaction): number {
    const total = signalTotalCounts.get(signal) ?? 0
    if (total === 0) return 0

    const outcomeMap = signalOutcomeCounts.get(signal)
    if (!outcomeMap) return 0

    const count = outcomeMap.get(outcome) ?? 0
    return count / total
  }

  function buildPatterns(): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = []
    const reactions: Reaction[] = ['agree', 'disagree', 'deeper', 'flip']

    for (const [signal, total] of signalTotalCounts) {
      for (const reaction of reactions) {
        const correlation = getCorrelation(signal, reaction)
        if (correlation > 0.1) {
          const outcomeMap = signalOutcomeCounts.get(signal)
          const count = outcomeMap?.get(reaction) ?? 0
          patterns.push({
            signal,
            outcome: reaction,
            count,
            correlation,
          })
        }
      }
    }

    // Sort by correlation descending
    patterns.sort((a, b) => b.correlation - a.correlation)
    return patterns
  }

  function recordObservation(
    gazeState: GazeState | null,
    faceState: FaceState | null,
    outcome: Reaction,
  ): void {
    const signals = extractSignals(gazeState, faceState)

    observations.push({
      signals,
      outcome,
      timestamp: Date.now(),
    })

    updateCounts(signals, outcome)

    // Phase 4 refinement: check if last prediction was correct
    if (lastPrediction !== null) {
      totalPredictions++
      if (lastPrediction.reaction === outcome) {
        correctPredictions++
      }
      lastPrediction = null
    }
  }

  function predict(
    gazeState: GazeState | null,
    faceState: FaceState | null,
  ): { reaction: Reaction; confidence: number } | null {
    // Only predict in phase 3+ (20+ observations)
    if (observations.length < 20) return null

    const signals = extractSignals(gazeState, faceState)
    if (signals.length === 0) return null

    // Score each reaction based on active signals
    const reactions: Reaction[] = ['agree', 'disagree', 'deeper', 'flip']
    const scores = new Map<Reaction, number>()

    for (const reaction of reactions) {
      let totalCorrelation = 0
      let signalCount = 0

      for (const signal of signals) {
        const correlation = getCorrelation(signal, reaction)
        if (correlation > 0) {
          totalCorrelation += correlation
          signalCount++
        }
      }

      if (signalCount > 0) {
        scores.set(reaction, totalCorrelation / signalCount)
      }
    }

    // Find the best reaction
    let bestReaction: Reaction = 'agree'
    let bestScore = 0
    for (const [reaction, score] of scores) {
      if (score > bestScore) {
        bestScore = score
        bestReaction = reaction
      }
    }

    // Require minimum confidence to predict
    if (bestScore < 0.3) return null

    // Scale confidence: correlation * model accuracy (if we have history)
    let accuracy = 0.5
    if (totalPredictions > 0) {
      accuracy = correctPredictions / totalPredictions
    }

    const confidence = Math.min(bestScore * (0.5 + accuracy * 0.5), 1)

    const prediction = { reaction: bestReaction, confidence }
    lastPrediction = prediction
    return prediction
  }

  function getModel(): UserBehaviorModel {
    return {
      patterns: buildPatterns(),
      totalActions: observations.length,
      phase: getPhase(),
      predictionAccuracy: totalPredictions > 0 ? correctPredictions / totalPredictions : 0,
    }
  }

  return {
    recordObservation,
    predict,
    getModel,
  }
}
