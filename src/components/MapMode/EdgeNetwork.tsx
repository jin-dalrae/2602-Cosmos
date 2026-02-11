import { useMemo } from 'react'
import * as THREE from 'three'
import type { CosmosPost, RelationshipType } from '../../lib/types'
import { EDGE_COLORS } from '../shared/EmotionPalette'

interface EdgeNetworkProps {
  posts: CosmosPost[]
}

/**
 * Convert a hex color string like '#8FB8A0' to [r, g, b] in 0-1 range.
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16) / 255
  const g = parseInt(cleaned.substring(2, 4), 16) / 255
  const b = parseInt(cleaned.substring(4, 6), 16) / 255
  return [r, g, b]
}

export default function EdgeNetwork({ posts }: EdgeNetworkProps) {
  const geometry = useMemo(() => {
    // Build a lookup of post positions by id
    const positionMap = new Map<string, [number, number, number]>()
    for (const post of posts) {
      positionMap.set(post.id, post.position)
    }

    // Collect all edges
    const edgePositions: number[] = []
    const edgeColors: number[] = []

    for (const post of posts) {
      const sourcePos = post.position

      for (const rel of post.relationships) {
        const targetPos = positionMap.get(rel.target_id)
        if (!targetPos) continue

        // Source vertex
        edgePositions.push(sourcePos[0], sourcePos[1], sourcePos[2])
        // Target vertex
        edgePositions.push(targetPos[0], targetPos[1], targetPos[2])

        // Color both vertices the same (based on relationship type)
        const hex = EDGE_COLORS[rel.type as RelationshipType] ?? EDGE_COLORS.tangent
        const [r, g, b] = hexToRgb(hex)
        edgeColors.push(r, g, b)
        edgeColors.push(r, g, b)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(edgePositions), 3),
    )
    geo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(new Float32Array(edgeColors), 3),
    )

    return geo
  }, [posts])

  if (geometry.attributes.position && (geometry.attributes.position as THREE.BufferAttribute).count === 0) {
    return null
  }

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.6}
      />
    </lineSegments>
  )
}
