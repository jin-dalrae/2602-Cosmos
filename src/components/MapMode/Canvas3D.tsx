import { type ReactNode, useEffect, useRef, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { SceneSettings } from '../ControlPanel'
import * as THREE from 'three'

interface Canvas3DProps {
  children: ReactNode
  settings: SceneSettings
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  onCameraChange?: (theta: number, phi: number) => void
  onCanvasDragStart?: () => void
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
 * Blended camera: overview=0 puts user at origin looking OUT at articles on sphere surface.
 * overview=1 pulls camera above the sphere for a bird's-eye view.
 * Drag rotates the camera's look direction / orbit position.
 */
function RotationCamera({ onOrbitEnd, onCameraChange, onCanvasDragStart, damping = 0, focusTarget, pendingAutoSelect, articleRadius, overview = 0 }: {
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  onCameraChange?: (theta: number, phi: number) => void
  onCanvasDragStart?: () => void
  damping?: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  articleRadius: number
  overview?: number
}) {
  const { camera, gl } = useThree()
  const callbackRef = useRef(onOrbitEnd)
  callbackRef.current = onOrbitEnd
  const dragStartRef = useRef(onCanvasDragStart)
  dragStartRef.current = onCanvasDragStart

  // Camera rotation (euler angles)
  const rotation = useRef({ theta: 0, phi: Math.PI / 2 })
  // Velocity for damping
  const velocity = useRef({ theta: 0, phi: 0 })
  // Drag state
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  // Focus animation
  const goalRotation = useRef({ theta: 0, phi: Math.PI / 2 })
  const animating = useRef(false)

  // When focusTarget changes, rotate to look at it
  useEffect(() => {
    if (!focusTarget) return
    const target = new THREE.Vector3(focusTarget[0], focusTarget[1], focusTarget[2])
    if (target.length() < 0.001) return

    // Convert target position to spherical angles
    const spherical = new THREE.Spherical().setFromVector3(target)

    // Compensate for overview phi offset so camera actually faces the target
    // effectivePhi = basePhi + (rotation.phi - PI/2), we need effectivePhi = target.phi
    // So rotation.phi = target.phi - basePhi + PI/2
    const basePhi = THREE.MathUtils.lerp(Math.PI / 2, 0.15, overview)
    const compensatedPhi = spherical.phi - basePhi + Math.PI / 2

    goalRotation.current = { theta: spherical.theta, phi: compensatedPhi }
    animating.current = true
  }, [focusTarget, overview])


  // Pointer event handlers for drag rotation
  useEffect(() => {
    const canvas = gl.domElement

    const onDown = (e: PointerEvent) => {
      dragging.current = true
      lastPointer.current = { x: e.clientX, y: e.clientY }
      velocity.current = { theta: 0, phi: 0 }
      animating.current = false
      dragStartRef.current?.()
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }

      // Rotate view — sphere content follows the mouse direction
      const speed = 0.002
      velocity.current.theta = dx * speed
      velocity.current.phi = -dy * speed

      rotation.current.theta += velocity.current.theta
      rotation.current.phi = THREE.MathUtils.clamp(
        rotation.current.phi + velocity.current.phi,
        0.1, Math.PI - 0.1,
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

  // Every frame: update camera rotation (position stays at origin)
  useFrame(() => {
    // Focus animation
    if (animating.current) {
      const t = 0.08
      // Shortest-path theta interpolation
      let dTheta = goalRotation.current.theta - rotation.current.theta
      // Wrap to [-π, π]
      while (dTheta > Math.PI) dTheta -= Math.PI * 2
      while (dTheta < -Math.PI) dTheta += Math.PI * 2
      rotation.current.theta += dTheta * t
      rotation.current.phi += (goalRotation.current.phi - rotation.current.phi) * t

      if (Math.abs(dTheta) < 0.001 && Math.abs(goalRotation.current.phi - rotation.current.phi) < 0.001) {
        animating.current = false
      }
    }

    // Apply damping when not dragging
    if (!dragging.current && damping > 0) {
      const decay = 1 - damping * 2
      velocity.current.theta *= decay
      velocity.current.phi *= decay
      if (Math.abs(velocity.current.theta) > 0.0001 || Math.abs(velocity.current.phi) > 0.0001) {
        rotation.current.theta += velocity.current.theta
        rotation.current.phi = THREE.MathUtils.clamp(
          rotation.current.phi + velocity.current.phi,
          0.1, Math.PI - 0.1,
        )
      }
    }

    // Camera stays at origin, overview controls elevation (phi)
    // overview=0: equator (phi=PI/2), overview=1: top pole (phi≈0.15)
    const basePhi = THREE.MathUtils.lerp(Math.PI / 2, 0.15, overview)
    const effectivePhi = THREE.MathUtils.clamp(
      basePhi + (rotation.current.phi - Math.PI / 2),
      0.1, Math.PI - 0.1,
    )

    camera.position.set(0, 0, 0)
    const lookTarget = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(articleRadius, effectivePhi, rotation.current.theta)
    )
    camera.lookAt(lookTarget)

    // Report camera rotation in real-time
    onCameraChange?.(rotation.current.theta, rotation.current.phi)
  })

  return null
}

export default function Canvas3D({ children, settings, focusTarget, pendingAutoSelect, onOrbitEnd, onCameraChange, onCanvasDragStart }: Canvas3DProps) {
  const handleFovChange = useCallback((_newFov: number) => { }, [])

  // Distance 10 = close (wide FOV 90°), Distance 30 = far (narrow FOV 30°)
  const fov = 120 - settings.distance * 3

  return (
    <Canvas style={{ background: '#262220' }}>
      <PerspectiveCamera makeDefault fov={fov} position={[0, 0, 0]} />
      <CameraUpdater fov={fov} />
      <FovZoom fov={fov} onFovChange={handleFovChange} />
      <RotationCamera
        onOrbitEnd={onOrbitEnd}
        onCameraChange={onCameraChange}
        onCanvasDragStart={onCanvasDragStart}
        damping={settings.damping}
        focusTarget={focusTarget}
        pendingAutoSelect={pendingAutoSelect}
        articleRadius={150}
        overview={settings.overview}
      />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      {children}
    </Canvas>
  )
}
