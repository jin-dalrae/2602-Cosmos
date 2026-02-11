import { type ReactNode, useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Cards use distanceFactor=3, width=800px.
 * At camera distance === distanceFactor the card renders at 1:1 (800px on screen).
 */
const ZOOM_DISTANCE = 3

interface Canvas3DProps {
  children: ReactNode
  flyTo?: [number, number, number] | null
}

function CameraFly({ target }: { target: [number, number, number] | null }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetVec = useRef(new THREE.Vector3())
  const camTarget = useRef(new THREE.Vector3())
  const isFlying = useRef(false)

  useEffect(() => {
    if (target) {
      targetVec.current.set(target[0], target[1], target[2])
      // Place camera directly in front at the distance that yields 800px card width
      camTarget.current.set(
        target[0],
        target[1],
        target[2] + ZOOM_DISTANCE,
      )
      isFlying.current = true
    }
  }, [target])

  useFrame(() => {
    if (!isFlying.current || !target) return

    // Smooth ease-out — faster at start, gentle arrival
    camera.position.lerp(camTarget.current, 0.07)

    // Also smoothly update OrbitControls target so the card stays centered
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec.current, 0.07)
      controlsRef.current.update()
    }

    const dist = camera.position.distanceTo(camTarget.current)
    if (dist < 0.02) {
      camera.position.copy(camTarget.current)
      isFlying.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={false}
      minDistance={2}
      maxDistance={60}
    />
  )
}

export default function Canvas3D({ children, flyTo }: Canvas3DProps) {
  return (
    <Canvas style={{ background: '#262220' }}>
      <PerspectiveCamera makeDefault fov={60} position={[0, 0, 22]} />
      <CameraFly target={flyTo ?? null} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      {children}
    </Canvas>
  )
}
