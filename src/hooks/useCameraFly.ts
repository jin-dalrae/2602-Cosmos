import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const TOTAL_FRAMES = 60 // ~1 second at 60fps
const EASE_POWER = 3 // cubic ease-out

interface CameraFlyReturn {
  flyTo: (target: [number, number, number], lookAt?: [number, number, number]) => void
  isFlying: boolean
}

/**
 * Smoothly lerps the camera to a target position over ~60 frames
 * with a cubic ease-out curve.
 */
export default function useCameraFly(): CameraFlyReturn {
  const { camera } = useThree()

  const isFlying = useRef(false)
  const frame = useRef(0)
  const startPos = useRef(new THREE.Vector3())
  const endPos = useRef(new THREE.Vector3())
  const lookAtTarget = useRef<THREE.Vector3 | null>(null)

  const flyTo = useCallback(
    (target: [number, number, number], lookAt?: [number, number, number]) => {
      startPos.current.copy(camera.position)
      endPos.current.set(target[0], target[1], target[2])
      lookAtTarget.current = lookAt
        ? new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2])
        : null
      frame.current = 0
      isFlying.current = true
    },
    [camera],
  )

  useFrame(() => {
    if (!isFlying.current) return

    frame.current++

    // Cubic ease-out: 1 - (1 - t)^3
    const t = Math.min(frame.current / TOTAL_FRAMES, 1)
    const eased = 1 - Math.pow(1 - t, EASE_POWER)

    camera.position.lerpVectors(startPos.current, endPos.current, eased)

    if (lookAtTarget.current) {
      camera.lookAt(lookAtTarget.current)
    }

    if (t >= 1) {
      isFlying.current = false
    }
  })

  return {
    flyTo,
    get isFlying() {
      return isFlying.current
    },
  }
}
