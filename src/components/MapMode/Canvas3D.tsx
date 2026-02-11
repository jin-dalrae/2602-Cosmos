import { type ReactNode, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import type { SceneSettings } from '../ControlPanel'
import * as THREE from 'three'

interface Canvas3DProps {
  children: ReactNode
  settings: SceneSettings
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
}

function CameraUpdater({ fov, distance }: { fov: number; distance: number }) {
  const { camera } = useThree()
  const prevDistance = useRef(distance)

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
  }, [camera, fov])

  // Apply distance changes as relative offset so it doesn't undo pan animations
  useEffect(() => {
    const delta = distance - prevDistance.current
    if (delta !== 0) {
      camera.position.z += delta
      prevDistance.current = distance
    }
  }, [camera, distance])

  return null
}

function OrbitHandler({ onOrbitEnd, damping = 0, focusTarget, pendingAutoSelect }: {
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  damping?: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const callbackRef = useRef(onOrbitEnd)
  callbackRef.current = onOrbitEnd

  const goalSpherical = useRef(new THREE.Spherical())
  const currentSpherical = useRef(new THREE.Spherical())
  const animating = useRef(false)

  // When focusTarget changes, compute where camera should be so card is centered
  // Orbit target stays at (0,0,0) — camera rotates around it
  useEffect(() => {
    if (focusTarget) {
      const cardPos = new THREE.Vector3(focusTarget[0], focusTarget[1], focusTarget[2])
      const orbitRadius = camera.position.length() // distance from origin

      const goalPos = new THREE.Vector3()
      if (cardPos.length() > 0.001) {
        goalPos.copy(cardPos).normalize().multiplyScalar(orbitRadius)
      } else {
        goalPos.set(0, 0, orbitRadius)
      }
      goalSpherical.current.setFromVector3(goalPos)
      currentSpherical.current.setFromVector3(camera.position)
      animating.current = true
    }
  }, [focusTarget, camera])

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls || !animating.current) return

    // Spherical interpolation for a smooth arc around the origin
    const t = 0.08
    currentSpherical.current.phi += (goalSpherical.current.phi - currentSpherical.current.phi) * t
    currentSpherical.current.theta += (goalSpherical.current.theta - currentSpherical.current.theta) * t
    currentSpherical.current.radius += (goalSpherical.current.radius - currentSpherical.current.radius) * t

    camera.position.setFromSpherical(currentSpherical.current)
    controls.update()

    const dPhi = Math.abs(goalSpherical.current.phi - currentSpherical.current.phi)
    const dTheta = Math.abs(goalSpherical.current.theta - currentSpherical.current.theta)
    if (dPhi < 0.001 && dTheta < 0.001) {
      animating.current = false
    }
  })

  // When user starts orbiting, stop centering animation
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const stopAnim = () => { animating.current = false }
    controls.addEventListener('start', stopAnim)
    return () => controls.removeEventListener('start', stopAnim)
  }, [])

  // OrbitControls 'end' event
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const handler = () => {
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      callbackRef.current?.(
        [camera.position.x, camera.position.y, camera.position.z],
        [dir.x, dir.y, dir.z],
      )
    }

    controls.addEventListener('end', handler)
    return () => controls.removeEventListener('end', handler)
  }, [camera])

  // Fallback: when pendingAutoSelect flips true, wait for next pointerup then report camera pos
  useEffect(() => {
    if (!pendingAutoSelect) return

    const handler = () => {
      setTimeout(() => {
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        callbackRef.current?.(
          [camera.position.x, camera.position.y, camera.position.z],
          [dir.x, dir.y, dir.z],
        )
      }, 100)
    }

    window.addEventListener('pointerup', handler, { once: true })
    return () => window.removeEventListener('pointerup', handler)
  }, [pendingAutoSelect, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={damping > 0}
      dampingFactor={damping}
      minDistance={2}
      maxDistance={60}
    />
  )
}

export default function Canvas3D({ children, settings, focusTarget, pendingAutoSelect, onOrbitEnd }: Canvas3DProps) {
  return (
    <Canvas style={{ background: '#262220' }}>
      <PerspectiveCamera makeDefault fov={settings.fov} position={[0, 0, settings.cameraDistance]} />
      <CameraUpdater fov={settings.fov} distance={settings.cameraDistance} />
      <OrbitHandler onOrbitEnd={onOrbitEnd} damping={settings.damping} focusTarget={focusTarget} pendingAutoSelect={pendingAutoSelect} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      {children}
    </Canvas>
  )
}
