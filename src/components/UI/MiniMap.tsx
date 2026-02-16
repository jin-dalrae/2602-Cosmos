import { useState } from 'react'
import type { CosmosPost } from '../../lib/types'

interface MiniMapProps {
    posts: CosmosPost[]
    cameraTheta: number
    cameraPhi: number
    onNavigate: (theta: number, phi: number) => void
}

// Convert 3D position to 2D minimap coordinates (top-down view)
function positionToMinimap(pos: [number, number, number], size: number): { x: number; y: number } {
    const scale = (size * 0.45) / 50 // map max radius (50) to 45% of size (leaving margin)
    return {
        x: size / 2 + pos[0] * scale,
        y: size / 2 + pos[2] * scale, // Z axis for top-down view
    }
}

export default function MiniMap({ posts, cameraTheta, cameraPhi, onNavigate }: MiniMapProps) {
    const [expanded, setExpanded] = useState(false)
    const size = expanded ? 200 : 120

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!expanded) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2

        // Convert click position to theta/phi
        const theta = Math.atan2(y, x)
        const r = Math.sqrt(x * x + y * y)
        const phi = Math.PI / 2 // Keep at horizon

        onNavigate(theta, phi)
    }

    return (
        <div
            style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 30,
                transition: 'all 0.3s',
            }}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #3A3530',
                    backgroundColor: 'rgba(38, 34, 32, 0.9)',
                    color: '#9E9589',
                    fontSize: 10,
                    fontFamily: 'system-ui',
                    cursor: 'pointer',
                    zIndex: 31,
                }}
            >
                {expanded ? '−' : '+'}
            </button>

            <div
                onClick={handleClick}
                style={{
                    width: size,
                    height: size,
                    borderRadius: 12,
                    backgroundColor: 'rgba(38, 34, 32, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid #3A3530',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: expanded ? 'crosshair' : 'default',
                }}
            >
                {/* Title */}
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        fontSize: 9,
                        fontFamily: 'system-ui',
                        color: '#6B6560',
                        textTransform: 'uppercase',
                        letterSpacing: 1.2,
                    }}
                >
                    Overview
                </div>

                {/* Posts as dots */}
                <svg
                    width={size}
                    height={size}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                >
                    {/* Center (user) */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={3}
                        fill="#D4B872"
                        opacity={0.8}
                    />

                    {/* Posts */}
                    {posts.map((post) => {
                        const { x, y } = positionToMinimap(post.position, size)
                        return (
                            <circle
                                key={post.id}
                                cx={x}
                                cy={y}
                                r={expanded ? 2 : 1.5}
                                fill={`rgba(${post.emotion === 'passionate' ? '232,131,107' :
                                    post.emotion === 'analytical' ? '143,184,160' :
                                        post.emotion === 'hopeful' ? '212,184,114' :
                                            '184,176,168'}, 0.6)`}
                            />
                        )
                    })}

                    {/* Camera direction indicator */}
                    <line
                        x1={size / 2}
                        y1={size / 2}
                        x2={size / 2 + Math.cos(cameraTheta - Math.PI / 2) * 30}
                        y2={size / 2 + Math.sin(cameraTheta - Math.PI / 2) * 30}
                        stroke="#D4B872"
                        strokeWidth={2}
                        opacity={0.8}
                    />
                    <circle
                        cx={size / 2 + Math.cos(cameraTheta - Math.PI / 2) * 30}
                        cy={size / 2 + Math.sin(cameraTheta - Math.PI / 2) * 30}
                        r={4}
                        fill="none"
                        stroke="#D4B872"
                        strokeWidth={1.5}
                    />
                </svg>

                {/* Info when expanded */}
                {expanded && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            right: 8,
                            fontSize: 10,
                            fontFamily: 'system-ui',
                            color: '#9E9589',
                            textAlign: 'center',
                        }}
                    >
                        Click to navigate
                    </div>
                )}
            </div>
        </div>
    )
}
