import { type ReactNode, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { SceneSettings } from '../ControlPanel'
import * as THREE from 'three'

interface Canvas3DProps {
  children: ReactNode
  settings: SceneSettings
  articleRadius: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  onCameraChange?: (theta: number, phi: number) => void
  onCanvasDragStart?: () => void
  onCanvasClick?: () => void
}

/**
 * Smoothly scales a group toward the target radius each frame.
 * Posts are placed on a unit sphere; this group scale = actual sphere radius.
 */
function ScaledSphere({ targetRadius, children }: { targetRadius: number; children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const currentRadius = useRef(targetRadius)

  useFrame(() => {
    const diff = targetRadius - currentRadius.current
    if (Math.abs(diff) > 0.01) {
      currentRadius.current += diff * 0.08
    } else {
      currentRadius.current = targetRadius
    }
    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentRadius.current)
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function RotationCamera({ onOrbitEnd, onCameraChange, onCanvasDragStart, onCanvasClick, damping = 0, focusTarget, pendingAutoSelect }: {
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  onCameraChange?: (theta: number, phi: number) => void
  onCanvasDragStart?: () => void
  onCanvasClick?: () => void
  damping?: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
}) {
  const { camera, gl } = useThree()
  const callbackRef = useRef(onOrbitEnd)
  callbackRef.current = onOrbitEnd
  const dragStartRef = useRef(onCanvasDragStart)
  dragStartRef.current = onCanvasDragStart
  const clickRef = useRef(onCanvasClick)
  clickRef.current = onCanvasClick

  // Camera rotation (euler angles)
  const rotation = useRef({ theta: 0, phi: Math.PI / 2 })
  // Velocity for damping (screen-space angular rates: h=horizontal, v=vertical)
  const velocity = useRef({ h: 0, v: 0 })
  // Drag state
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  // Focus animation
  const goalRotation = useRef({ theta: 0, phi: Math.PI / 2 })
  const animating = useRef(false)

  // Screen-space rotation helper: avoids gimbal lock near poles
  const _lookDir = useRef(new THREE.Vector3())
  const _worldUp = new THREE.Vector3(0, 1, 0)
  const _right = useRef(new THREE.Vector3())
  const _qH = useRef(new THREE.Quaternion())
  const _qV = useRef(new THREE.Quaternion())
  const _sph = useRef(new THREE.Spherical())

  function applyScreenSpaceRotation(h: number, v: number) {
    const { theta, phi } = rotation.current
    _lookDir.current.set(
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.cos(theta),
    ).normalize()

    _right.current.crossVectors(_worldUp, _lookDir.current).normalize()
    if (_right.current.lengthSq() < 0.001) _right.current.set(1, 0, 0)

    _qH.current.setFromAxisAngle(_worldUp, h)
    _qV.current.setFromAxisAngle(_right.current, v)
    _lookDir.current.applyQuaternion(_qH.current).applyQuaternion(_qV.current).normalize()

    _sph.current.setFromVector3(_lookDir.current)
    rotation.current.theta = _sph.current.theta
    rotation.current.phi = THREE.MathUtils.clamp(_sph.current.phi, 0.1, Math.PI - 0.1)
  }

  // When focusTarget changes, rotate to look at it
  useEffect(() => {
    if (!focusTarget) return
    const target = new THREE.Vector3(focusTarget[0], focusTarget[1], focusTarget[2])
    if (target.length() < 0.001) return

    const spherical = new THREE.Spherical().setFromVector3(target)
    goalRotation.current = { theta: spherical.theta, phi: spherical.phi }
    animating.current = true
  }, [focusTarget])

  // Pointer event handlers for drag rotation
  const didDrag = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = gl.domElement
    const DRAG_THRESHOLD = 5

    const onDown = (e: PointerEvent) => {
      dragging.current = true
      didDrag.current = false
      startPos.current = { x: e.clientX, y: e.clientY }
      lastPointer.current = { x: e.clientX, y: e.clientY }
      velocity.current = { h: 0, v: 0 }
      animating.current = false
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }

      // Detect if this is a real drag (past threshold)
      if (!didDrag.current) {
        const totalDx = e.clientX - startPos.current.x
        const totalDy = e.clientY - startPos.current.y
        if (Math.abs(totalDx) + Math.abs(totalDy) > DRAG_THRESHOLD) {
          didDrag.current = true
          dragStartRef.current?.()
        }
      }

      if (!didDrag.current) return

      // Screen-space rotation: horizontal around world Y, vertical around camera right
      const speed = 0.002
      velocity.current.h = dx * speed
      velocity.current.v = -dy * speed
      applyScreenSpaceRotation(velocity.current.h, velocity.current.v)
    }

    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false

      if (didDrag.current) {
        // Real drag → report orbit end for auto-select
        const dir = new THREE.Vector3()
        camera.getWorldDirection(dir)
        callbackRef.current?.(
          [camera.position.x, camera.position.y, camera.position.z],
          [dir.x, dir.y, dir.z],
        )
      } else {
        // Simple click on canvas → close article
        clickRef.current?.()
      }
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
      let dTheta = goalRotation.current.theta - rotation.current.theta
      while (dTheta > Math.PI) dTheta -= Math.PI * 2
      while (dTheta < -Math.PI) dTheta += Math.PI * 2
      rotation.current.theta += dTheta * t
      rotation.current.phi += (goalRotation.current.phi - rotation.current.phi) * t

      if (Math.abs(dTheta) < 0.001 && Math.abs(goalRotation.current.phi - rotation.current.phi) < 0.001) {
        animating.current = false
      }
    }

    // Apply damping when not dragging (fast decay for minimal coast)
    if (!dragging.current && damping > 0) {
      const decay = 1 - damping * 8
      velocity.current.h *= decay
      velocity.current.v *= decay
      if (Math.abs(velocity.current.h) > 0.0001 || Math.abs(velocity.current.v) > 0.0001) {
        applyScreenSpaceRotation(velocity.current.h, velocity.current.v)
      }
    }

    const effectivePhi = THREE.MathUtils.clamp(rotation.current.phi, 0.1, Math.PI - 0.1)

    camera.position.set(0, 0, 0)
    const lookTarget = new THREE.Vector3().setFromSpherical(
      new THREE.Spherical(100, effectivePhi, rotation.current.theta)
    )
    camera.lookAt(lookTarget)

    onCameraChange?.(rotation.current.theta, rotation.current.phi)
  })

  return null
}

export default function Canvas3D({ children, settings, articleRadius, focusTarget, pendingAutoSelect, onOrbitEnd, onCameraChange, onCanvasDragStart, onCanvasClick }: Canvas3DProps) {
  const fov = 70

  return (
    <Canvas style={{ background: '#262220' }}>
      <PerspectiveCamera makeDefault fov={fov} position={[0, 0, 0]} />
      <RotationCamera
        onOrbitEnd={onOrbitEnd}
        onCameraChange={onCameraChange}
        onCanvasDragStart={onCanvasDragStart}
        onCanvasClick={onCanvasClick}
        damping={settings.damping}
        focusTarget={focusTarget}
        pendingAutoSelect={pendingAutoSelect}
      />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      <ScaledSphere targetRadius={articleRadius}>
        {children}
      </ScaledSphere>
    </Canvas>
  )
}
