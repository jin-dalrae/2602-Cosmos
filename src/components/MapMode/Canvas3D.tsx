import { type ReactNode, useEffect, useRef, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { SceneSettings } from '../ControlPanel'
import * as THREE from 'three'

/* ── Sunset sky sphere ── */
const sunsetVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const sunsetFragmentShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec3 dir = normalize(vWorldPosition);
    float y = dir.y * 0.5 + 0.5; // 0 = bottom, 1 = top

    // Sunset gradient: deep navy top → warm rose middle → amber horizon → soft peach bottom
    vec3 topColor     = vec3(0.12, 0.11, 0.18);  // deep indigo
    vec3 midHighColor = vec3(0.22, 0.15, 0.22);  // dusty plum
    vec3 midColor     = vec3(0.45, 0.22, 0.20);  // warm rose
    vec3 horizonColor = vec3(0.62, 0.38, 0.22);  // amber
    vec3 lowColor     = vec3(0.50, 0.35, 0.25);  // warm sand
    vec3 bottomColor  = vec3(0.18, 0.14, 0.13);  // dark earth

    vec3 color;
    if (y > 0.75) {
      color = mix(midHighColor, topColor, (y - 0.75) / 0.25);
    } else if (y > 0.55) {
      color = mix(midColor, midHighColor, (y - 0.55) / 0.20);
    } else if (y > 0.45) {
      color = mix(horizonColor, midColor, (y - 0.45) / 0.10);
    } else if (y > 0.30) {
      color = mix(lowColor, horizonColor, (y - 0.30) / 0.15);
    } else {
      color = mix(bottomColor, lowColor, y / 0.30);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`

function SunsetSky() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: sunsetVertexShader,
    fragmentShader: sunsetFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  }), [])

  return (
    <mesh material={material}>
      <sphereGeometry args={[500, 32, 32]} />
    </mesh>
  )
}

interface Canvas3DProps {
  children: ReactNode
  settings: SceneSettings
  articleRadius: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  gazeSteer?: { dx: number; dy: number } | null
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

function RotationCamera({ onOrbitEnd, onCameraChange, onCanvasDragStart, onCanvasClick, damping = 0, focusTarget, pendingAutoSelect, gazeSteer }: {
  onOrbitEnd?: (cameraPos: [number, number, number], cameraDir: [number, number, number]) => void
  onCameraChange?: (theta: number, phi: number) => void
  onCanvasDragStart?: () => void
  onCanvasClick?: () => void
  damping?: number
  focusTarget?: [number, number, number] | null
  pendingAutoSelect?: boolean
  gazeSteer?: { dx: number; dy: number } | null
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
  // Base rotation: updated by drag + focus animation, head pose adds offset on top
  const baseRotation = useRef({ theta: 0, phi: Math.PI / 2 })
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
      // Sync base rotation after drag so head offset starts from here
      baseRotation.current = { ...rotation.current }

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
      const t = 0.025
      let dTheta = goalRotation.current.theta - rotation.current.theta
      while (dTheta > Math.PI) dTheta -= Math.PI * 2
      while (dTheta < -Math.PI) dTheta += Math.PI * 2
      rotation.current.theta += dTheta * t
      rotation.current.phi += (goalRotation.current.phi - rotation.current.phi) * t

      if (Math.abs(dTheta) < 0.001 && Math.abs(goalRotation.current.phi - rotation.current.phi) < 0.001) {
        animating.current = false
        // Sync base rotation after focus animation settles
        baseRotation.current = { ...rotation.current }
      }
    }

    // Head-pose-driven rotation: position-based (head position = angular offset, not speed)
    if (gazeSteer && !dragging.current && !animating.current) {
      const maxOffset = 25 * Math.PI / 180 // max ±25° offset from base
      const deadZone = 0.15

      const applyAxis = (val: number) => {
        const abs = Math.abs(val)
        if (abs < deadZone) return 0
        const t = (abs - deadZone) / (1 - deadZone)
        return Math.sign(val) * t * maxOffset
      }

      // Target = base rotation + head offset
      const targetTheta = baseRotation.current.theta + applyAxis(gazeSteer.dx)
      const targetPhi = THREE.MathUtils.clamp(
        baseRotation.current.phi - applyAxis(gazeSteer.dy),
        0.1, Math.PI - 0.1,
      )

      // Smooth lerp toward target
      let dTheta = targetTheta - rotation.current.theta
      while (dTheta > Math.PI) dTheta -= Math.PI * 2
      while (dTheta < -Math.PI) dTheta += Math.PI * 2
      rotation.current.theta += dTheta * 0.06
      rotation.current.phi += (targetPhi - rotation.current.phi) * 0.06
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

export default function Canvas3D({ children, settings, articleRadius, focusTarget, pendingAutoSelect, gazeSteer, onOrbitEnd, onCameraChange, onCanvasDragStart, onCanvasClick }: Canvas3DProps) {
  const fov = 78

  return (
    <Canvas style={{ background: '#1E1914' }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
      <PerspectiveCamera makeDefault fov={fov} position={[0, 0, 0]} />
      <RotationCamera
        onOrbitEnd={onOrbitEnd}
        onCameraChange={onCameraChange}
        onCanvasDragStart={onCanvasDragStart}
        onCanvasClick={onCanvasClick}
        damping={settings.damping}
        focusTarget={focusTarget}
        pendingAutoSelect={pendingAutoSelect}
        gazeSteer={gazeSteer}
      />

      <SunsetSky />

      <ambientLight intensity={0.7} color="#FFE8D6" />
      <directionalLight position={[5, 3, 5]} intensity={0.5} color="#FFCBA4" />
      <directionalLight position={[-3, -2, -4]} intensity={0.15} color="#9B8FB8" />

      <ScaledSphere targetRadius={articleRadius}>
        {children}
      </ScaledSphere>
    </Canvas>
  )
}
