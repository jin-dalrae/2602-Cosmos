import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { CosmosPost } from '../../lib/types'
import { EMOTION_PALETTE } from '../shared/EmotionPalette'
import type { Emotion } from '../../lib/types'

interface PostCloudProps {
  posts: CosmosPost[]
  onSelect: (postId: string) => void
  highlightIds?: string[]
}

const MIN_SCALE = 0.15
const MAX_SCALE = 0.5
const SPHERE_SEGMENTS = 16

export default function PostCloud({ posts, onSelect, highlightIds }: PostCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const highlightSet = useMemo(
    () => new Set(highlightIds ?? []),
    [highlightIds],
  )

  // Temp object for matrix computation
  const tempObject = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  // Compute scales from importance
  const scales = useMemo(
    () => posts.map((p) => MIN_SCALE + p.importance * (MAX_SCALE - MIN_SCALE)),
    [posts],
  )

  // Set instance matrices and colors whenever posts change
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      const [px, py, pz] = post.position
      const scale = scales[i]

      // Highlight: scale up slightly if highlighted or hovered
      const isHighlighted = highlightSet.has(post.id)
      const isHovered = hoveredId === i
      const finalScale = scale * (isHighlighted ? 1.4 : 1) * (isHovered ? 1.2 : 1)

      tempObject.position.set(px, py, pz)
      tempObject.scale.setScalar(finalScale)
      tempObject.updateMatrix()
      mesh.setMatrixAt(i, tempObject.matrix)

      // Color from emotion accent
      const emotion = post.emotion as Emotion
      const palette = EMOTION_PALETTE[emotion] ?? EMOTION_PALETTE.neutral
      tempColor.set(palette.accent)
      mesh.setColorAt(i, tempColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [posts, scales, highlightSet, hoveredId, tempObject, tempColor])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.instanceId !== undefined) {
      setHoveredId(e.instanceId)
      document.body.style.cursor = 'pointer'
    }
  }, [])

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredId(null)
    document.body.style.cursor = 'default'
  }, [])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (e.instanceId !== undefined && e.instanceId < posts.length) {
        onSelect(posts[e.instanceId].id)
      }
    },
    [posts, onSelect],
  )

  if (posts.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, posts.length]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
      <meshStandardMaterial />
    </instancedMesh>
  )
}
