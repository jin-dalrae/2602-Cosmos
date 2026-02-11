import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface UserMarkerProps {
  position: [number, number, number]
}

const GOLD = '#D4B872'
const GOLD_HEX = 0xD4B872

export default function UserMarker({ position }: UserMarkerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Pulsing scale oscillation
    if (groupRef.current) {
      const scale = 1 + Math.sin(t * 2.5) * 0.15
      groupRef.current.scale.setScalar(scale)
    }

    // Glow opacity oscillation
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(t * 2.5) * 0.08
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial
          color={GOLD_HEX}
          emissive={GOLD_HEX}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshBasicMaterial
          color={GOLD_HEX}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* "You" label floating above */}
      <Text
        position={[0, 0.55, 0]}
        fontSize={0.18}
        color={GOLD}
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        You
      </Text>
    </group>
  )
}
