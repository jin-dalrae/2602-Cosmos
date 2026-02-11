import { Text } from '@react-three/drei'
import type { Cluster } from '../../lib/types'
import { CLUSTER_COLORS } from '../shared/EmotionPalette'

interface ClusterShellsProps {
  clusters: Cluster[]
}

const SHELL_RADIUS = 2.5
const SHELL_OPACITY = 0.08
const LABEL_FONT_SIZE = 0.5
const LABEL_Y_OFFSET = 3.0

export default function ClusterShells({ clusters }: ClusterShellsProps) {
  return (
    <group>
      {clusters.map((cluster, i) => {
        const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
        const [cx, cy, cz] = cluster.center

        return (
          <group key={cluster.id} position={[cx, cy, cz]}>
            {/* Transparent shell sphere */}
            <mesh>
              <sphereGeometry args={[SHELL_RADIUS, 32, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={SHELL_OPACITY}
                side={2} /* DoubleSide */
                depthWrite={false}
              />
            </mesh>

            {/* Cluster label above center */}
            <Text
              position={[0, LABEL_Y_OFFSET, 0]}
              fontSize={LABEL_FONT_SIZE}
              color={color}
              anchorX="center"
              anchorY="bottom"
              maxWidth={6}
            >
              {cluster.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
