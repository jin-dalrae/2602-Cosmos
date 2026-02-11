import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 200
const SPREAD = 15
const POINT_SIZE = 0.05
const POINT_OPACITY = 0.3
const ROTATION_SPEED = 0.0002

// Warm dust colors
const COLOR_GOLD = new THREE.Color('#D4B872')
const COLOR_CREAM = new THREE.Color('#F5F2EF')

export default function AmbientDust() {
  const groupRef = useRef<THREE.Points>(null)
  const driftOffset = useRef(0)

  const { positions, colors } = useMemo(() => {
    const posArray = new Float32Array(PARTICLE_COUNT * 3)
    const colArray = new Float32Array(PARTICLE_COUNT * 3)

    const mixColor = new THREE.Color()

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Random position in [-SPREAD, SPREAD] cube
      posArray[i3] = (Math.random() - 0.5) * 2 * SPREAD
      posArray[i3 + 1] = (Math.random() - 0.5) * 2 * SPREAD
      posArray[i3 + 2] = (Math.random() - 0.5) * 2 * SPREAD

      // Random mix of gold and cream
      const t = Math.random()
      mixColor.copy(COLOR_GOLD).lerp(COLOR_CREAM, t)
      colArray[i3] = mixColor.r
      colArray[i3 + 1] = mixColor.g
      colArray[i3 + 2] = mixColor.b
    }

    return { positions: posArray, colors: colArray }
  }, [])

  useFrame(() => {
    const points = groupRef.current
    if (!points) return

    // Slowly rotate the entire particle group
    points.rotation.y += ROTATION_SPEED

    // Subtle Y drift
    driftOffset.current += 0.0003
    points.position.y = Math.sin(driftOffset.current) * 0.2
  })

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={POINT_SIZE}
        transparent
        opacity={POINT_OPACITY}
        sizeAttenuation
        vertexColors
        depthWrite={false}
      />
    </points>
  )
}
