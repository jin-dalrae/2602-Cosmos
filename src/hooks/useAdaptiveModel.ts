import { useState, useCallback, useRef } from 'react'
import type { GazeState, FaceState, Reaction } from '../lib/types'
import { createAdaptiveModel } from '../lib/adaptiveModel'

export default function useAdaptiveModel(): {
  recordAction: (gazeState: GazeState | null, faceState: FaceState | null, reaction: Reaction) => void
  prediction: { reaction: Reaction; confidence: number } | null
  modelPhase: 'observe' | 'model' | 'predict' | 'refine'
  predict: (gazeState: GazeState | null, faceState: FaceState | null) => void
} {
  const modelRef = useRef(createAdaptiveModel())
  const [prediction, setPrediction] = useState<{ reaction: Reaction; confidence: number } | null>(null)
  const [modelPhase, setModelPhase] = useState<'observe' | 'model' | 'predict' | 'refine'>('observe')

  const recordAction = useCallback(
    (gazeState: GazeState | null, faceState: FaceState | null, reaction: Reaction) => {
      modelRef.current.recordObservation(gazeState, faceState, reaction)
      const model = modelRef.current.getModel()
      setModelPhase(model.phase)
    },
    [],
  )

  const predict = useCallback(
    (gazeState: GazeState | null, faceState: FaceState | null) => {
      const result = modelRef.current.predict(gazeState, faceState)
      setPrediction(result)
    },
    [],
  )

  return {
    recordAction,
    prediction,
    modelPhase,
    predict,
  }
}
