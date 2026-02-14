import { type ReactNode, useEffect, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { SceneSettings } from '../ControlPanel'
import * as THREE from 'three'

// Average radius of the outer article sphere
const ARTICLE_RADIUS = 20

interface Canvas3DProps {
  children: ReactNode
  settings: SceneSettings
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  recenter?: number
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
}

function CameraUpdater({ fov }: { fov: number }) {
  const { camera } = useThree()

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== fov) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
  }, [camera, fov])

  return null
}

function FovZoom({ fov, onFovChange }: { fov: number; onFovChange: (fov: number) => void }) {
  const { gl, camera } = useThree()
  const fovRef = useRef(fov)
  fovRef.current = fov

  useEffect(() => {
    const canvas = gl.domElement
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * 0.05
      const newFov = THREE.MathUtils.clamp(fovRef.current + delta, 30, 100)
      if (newFov !== fovRef.current) {
        onFovChange(newFov)
        const cam = camera as THREE.PerspectiveCamera
        cam.fov = newFov
        cam.updateProjectionMatrix()
      }
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [gl, camera, onFovChange])

  return null
}

/**
 * Custom camera controller: camera lives on inner sphere, looks OUTWARD toward articles.
 * Replaces OrbitControls (which always looks toward its target = inward).
 * Drag rotates the camera's position on the inner sphere surface.
 */
function SphereCamera({ onOrbitEnd, damping = 0, focusTarget, pendingAutoSelect, recenter, cameraDistance }: {
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  damping?: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  recenter?: number
  cameraDistance: number
}) {
  const { camera, gl } = useThree()
  const callbackRef = useRef(onOrbitEnd)
  callbackRef.current = onOrbitEnd

  const innerRadius = ARTICLE_RADIUS - cameraDistance

  // Camera spherical position (theta = azimuth, phi = polar angle)
  const spherical = useRef({ theta: 0, phi: Math.PI / 2 })
  // Velocity for damping
  const velocity = useRef({ theta: 0, phi: 0 })
  // Drag state
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  // Focus animation
  const goalSpherical = useRef({ theta: 0, phi: Math.PI / 2 })
  const animating = useRef(false)

  // Smooth radius interpolation
  const targetRadius = useRef(innerRadius)
  useEffect(() => { targetRadius.current = innerRadius }, [innerRadius])

  // When focusTarget changes, animate camera to face the card
  useEffect(() => {
    if (!focusTarget) return
    const cardPos = new THREE.Vector3(focusTarget[0], focusTarget[1], focusTarget[2])
    if (cardPos.length() < 0.001) return

    // Camera should be on inner sphere in the same direction as the card
    const s = new THREE.Spherical().setFromVector3(cardPos)
    goalSpherical.current = { theta: s.theta, phi: s.phi }
    animating.current = true
  }, [focusTarget])

  // Recenter
  const prevRecenter = useRef(recenter ?? 0)
  useEffect(() => {
    if (recenter !== undefined && recenter !== prevRecenter.current) {
      prevRecenter.current = recenter
      goalSpherical.current = { theta: 0, phi: Math.PI / 2 }
      animating.current = true
    }
  }, [recenter])

  // Pointer event handlers for drag rotation
  useEffect(() => {
    const canvas = gl.domElement

    const onDown = (e: PointerEvent) => {
      dragging.current = true
      lastPointer.current = { x: e.clientX, y: e.clientY }
      velocity.current = { theta: 0, phi: 0 }
      animating.current = false
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }

      // Rotate on inner sphere: dx → theta (azimuth), dy → phi (polar)
      const speed = 0.004
      velocity.current.theta = -dx * speed
      velocity.current.phi = dy * speed

      spherical.current.theta += velocity.current.theta
      spherical.current.phi = THREE.MathUtils.clamp(
        spherical.current.phi + velocity.current.phi,
        0.3, Math.PI - 0.3,
      )
    }

    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false

      // Report camera position and look direction
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      callbackRef.current?.(
        [camera.position.x, camera.position.y, camera.position.z],
        [dir.x, dir.y, dir.z],
      )
    }

    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl, camera])

  // Fallback: when pendingAutoSelect flips true, report camera after pointerup
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

  // Every frame: update camera position on inner sphere + look outward
  useFrame(() => {
    // Focus animation
    if (animating.current) {
      const t = 0.08
      // Shortest-path theta interpolation
      let dTheta = goalSpherical.current.theta - spherical.current.theta
      // Wrap to [-π, π]
      while (dTheta > Math.PI) dTheta -= Math.PI * 2
      while (dTheta < -Math.PI) dTheta += Math.PI * 2
      spherical.current.theta += dTheta * t
      spherical.current.phi += (goalSpherical.current.phi - spherical.current.phi) * t

      if (Math.abs(dTheta) < 0.001 && Math.abs(goalSpherical.current.phi - spherical.current.phi) < 0.001) {
        animating.current = false
      }
    }

    // Apply damping when not dragging
    if (!dragging.current && damping > 0) {
      const decay = 1 - damping * 2
      velocity.current.theta *= decay
      velocity.current.phi *= decay
      if (Math.abs(velocity.current.theta) > 0.0001 || Math.abs(velocity.current.phi) > 0.0001) {
        spherical.current.theta += velocity.current.theta
        spherical.current.phi = THREE.MathUtils.clamp(
          spherical.current.phi + velocity.current.phi,
          0.3, Math.PI - 0.3,
        )
      }
    }

    // Smooth radius transition
    const currentRadius = camera.position.length() || targetRadius.current
    const r = currentRadius + (targetRadius.current - currentRadius) * 0.1

    // Set camera position on inner sphere
    const s = new THREE.Spherical(r, spherical.current.phi, spherical.current.theta)
    camera.position.setFromSpherical(s)

    // Look outward: toward corresponding point on the outer sphere
    const outward = camera.position.clone().normalize().multiplyScalar(ARTICLE_RADIUS * 2)
    camera.lookAt(outward)
  })

  return null
}

export default function Canvas3D({ children, settings, focusTarget, pendingAutoSelect, recenter, onOrbitEnd }: Canvas3DProps) {
  const innerRadius = ARTICLE_RADIUS - settings.cameraDistance

  const handleFovChange = useCallback((_newFov: number) => {}, [])

  return (
    <Canvas style={{ background: '#262220' }}>
      <PerspectiveCamera makeDefault fov={settings.fov} position={[0, 0, innerRadius]} />
      <CameraUpdater fov={settings.fov} />
      <FovZoom fov={settings.fov} onFovChange={handleFovChange} />
      <SphereCamera
        onOrbitEnd={onOrbitEnd}
        damping={settings.damping}
        focusTarget={focusTarget}
        pendingAutoSelect={pendingAutoSelect}
        recenter={recenter}
        cameraDistance={settings.cameraDistance}
      />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      {children}
    </Canvas>
  )
}
