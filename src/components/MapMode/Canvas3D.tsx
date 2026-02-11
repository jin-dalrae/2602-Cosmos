import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

interface Canvas3DProps {
  children: ReactNode
}

export default function Canvas3D({ children }: Canvas3DProps) {
  return (
    <Canvas style={{ background: '#262220' }}>
      <PerspectiveCamera makeDefault fov={60} position={[0, 0, 20]} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
      />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      {children}
    </Canvas>
  )
}
