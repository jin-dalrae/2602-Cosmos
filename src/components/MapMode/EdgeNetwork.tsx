import { useMemo } from 'react'
import * as THREE from 'three'
import type { CosmosPost, RelationshipType } from '../../lib/types'
import { EDGE_COLORS } from '../shared/EmotionPalette'

interface EdgeNetworkProps {
  posts: CosmosPost[]
  opacity?: number
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

export default function EdgeNetwork({ posts, opacity = 0.6 }: EdgeNetworkProps) {
  // No connections — all articles are independent on the sphere
  return null
}
