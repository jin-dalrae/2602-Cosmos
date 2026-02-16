import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Card accent colors from emotion palette ── */
const CARD_COLORS = [
  '#E8836B', '#8FB8A0', '#C47A5A', '#D4B872', '#9B8FB8',
  '#A3A07E', '#B8B0A8', '#A85A4A', '#D4A0A0', '#E8836B',
  '#8FB8A0', '#D4B872', '#9B8FB8', '#C47A5A', '#A3A07E',
]

const CARD_BG_COLORS = [
  '#FFF5F0', '#F0F7F3', '#FDF2EC', '#FDFAF0', '#F5F2FA',
  '#F5F5EE', '#F5F2EF', '#FAF0ED', '#FAF2F2', '#FFF5F0',
  '#F0F7F3', '#FDFAF0', '#F5F2FA', '#FDF2EC', '#F5F5EE',
]

/* ── Sunset sky (lighter version for landing) ── */
const skyVert = `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = `
  varying vec3 vWorldPos;
  void main() {
    vec3 dir = normalize(vWorldPos);
    float y = dir.y * 0.5 + 0.5;
    vec3 top     = vec3(0.15, 0.13, 0.22);
    vec3 midHigh = vec3(0.28, 0.18, 0.25);
    vec3 mid     = vec3(0.52, 0.28, 0.24);
    vec3 horizon = vec3(0.72, 0.45, 0.26);
    vec3 low     = vec3(0.58, 0.42, 0.30);
    vec3 bottom  = vec3(0.22, 0.17, 0.15);
    vec3 c;
    if (y > 0.75) c = mix(midHigh, top, (y - 0.75) / 0.25);
    else if (y > 0.55) c = mix(mid, midHigh, (y - 0.55) / 0.20);
    else if (y > 0.45) c = mix(horizon, mid, (y - 0.45) / 0.10);
    else if (y > 0.30) c = mix(low, horizon, (y - 0.30) / 0.15);
    else c = mix(bottom, low, y / 0.30);
    gl_FragColor = vec4(c, 1.0);
  }
`

function Sky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: skyVert,
    fragmentShader: skyFrag,
    side: THREE.BackSide,
    depthWrite: false,
  }), [])
  return <mesh material={mat}><sphereGeometry args={[80, 24, 24]} /></mesh>
}

/* ── Generate card positions on a Fibonacci sphere ── */
interface CardData {
  position: THREE.Vector3
  normal: THREE.Vector3
  color: string
  bgColor: string
  width: number
  height: number
  lines: number // fake text lines
}

function generateCards(count: number, radius: number): CardData[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const cards: CardData[] = []

  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * i) / (count - 1)
    const theta = golden * i
    const phi = Math.acos(Math.max(-1, Math.min(1, y)))

    const pos = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    )

    cards.push({
      position: pos,
      normal: pos.clone().normalize(),
      color: CARD_COLORS[i % CARD_COLORS.length],
      bgColor: CARD_BG_COLORS[i % CARD_BG_COLORS.length],
      width: 0.38 + Math.random() * 0.12,
      height: 0.26 + Math.random() * 0.08,
      lines: 2 + Math.floor(Math.random() * 3),
    })
  }
  return cards
}

/* ── Single article card (flat mesh facing outward) ── */
function ArticleCard({ data }: { data: CardData }) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Create a canvas texture with a mini card design
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    const s = 4 // scale for crisp rendering
    const w = 200 * s
    const h = 140 * s
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    // Card background
    const r = 12 * s
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, r)
    ctx.fillStyle = data.bgColor
    ctx.fill()

    // Accent bar on left
    ctx.beginPath()
    ctx.roundRect(0, 0, 4 * s, h, [r, 0, 0, r])
    ctx.fillStyle = data.color
    ctx.fill()

    // "Title" — thick short bar
    ctx.fillStyle = data.color + '40'
    ctx.beginPath()
    ctx.roundRect(16 * s, 16 * s, 110 * s, 8 * s, 3 * s)
    ctx.fill()

    // "Author" — small accent chip
    ctx.fillStyle = data.color + '25'
    ctx.beginPath()
    ctx.roundRect(16 * s, 32 * s, 40 * s, 6 * s, 3 * s)
    ctx.fill()

    // "Text lines"
    const lineY = 48 * s
    for (let i = 0; i < data.lines; i++) {
      const lineW = (90 + Math.random() * 80) * s
      ctx.fillStyle = '#00000012'
      ctx.beginPath()
      ctx.roundRect(16 * s, lineY + i * 12 * s, lineW, 5 * s, 2 * s)
      ctx.fill()
    }

    // "Theme tags" at bottom
    let tagX = 16 * s
    for (let i = 0; i < 2; i++) {
      const tw = (24 + Math.random() * 20) * s
      ctx.fillStyle = data.color + '18'
      ctx.beginPath()
      ctx.roundRect(tagX, h - 22 * s, tw, 7 * s, 3 * s)
      ctx.fill()
      tagX += tw + 4 * s
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [data])

  // Orient card to face outward from sphere center
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const m = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      data.normal,
      up,
    )
    q.setFromRotationMatrix(m)
    return q
  }, [data.normal])

  return (
    <mesh
      ref={meshRef}
      position={data.position}
      quaternion={quaternion}
    >
      <planeGeometry args={[data.width, data.height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ── Rotating sphere group ── */
function RotatingSphere() {
  const groupRef = useRef<THREE.Group>(null)
  const cards = useMemo(() => generateCards(36, 3.2), [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08
      groupRef.current.rotation.x += delta * 0.015
    }
  })

  // Wireframe sphere for structure hint
  const wireframeMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#D4B872',
    wireframe: true,
    transparent: true,
    opacity: 0.04,
  }), [])

  return (
    <group ref={groupRef}>
      {/* Faint wireframe sphere */}
      <mesh material={wireframeMat}>
        <sphereGeometry args={[3.18, 24, 24]} />
      </mesh>

      {/* Article cards */}
      {cards.map((card, i) => (
        <ArticleCard key={i} data={card} />
      ))}

      {/* Faint connecting lines between nearby cards */}
      <CardEdges cards={cards} />
    </group>
  )
}

/* ── Subtle edges between nearby cards ── */
function CardEdges({ cards }: { cards: CardData[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const maxDist = 1.8

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const d = cards[i].position.distanceTo(cards[j].position)
        if (d < maxDist) {
          const a = cards[i].position
          const b = cards[j].position
          positions.push(a.x, a.y, a.z, b.x, b.y, b.z)

          // Use gold for edges, very faint
          const alpha = 0.06 * (1 - d / maxDist)
          colors.push(0.83, 0.72, 0.45, alpha, 0.83, 0.72, 0.45, alpha)
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
    return geo
  }, [cards])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.5} />
    </lineSegments>
  )
}

/* ── Main export ── */
export default function LandingSphere() {
  return (
    <Canvas
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
      }}
      camera={{ position: [0, 0.8, 7], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Sky />

      <ambientLight intensity={0.5} color="#FFE8D6" />
      <directionalLight position={[4, 3, 5]} intensity={0.4} color="#FFCBA4" />
      <directionalLight position={[-3, -1, -4]} intensity={0.1} color="#9B8FB8" />

      <RotatingSphere />
    </Canvas>
  )
}
