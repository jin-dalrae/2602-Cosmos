import { useCallback, useState, useMemo, useEffect, useRef, startTransition } from 'react'
import { Link } from 'react-router-dom'
import type { CosmosLayout, CosmosPost, ClassifiedPost } from '../lib/types'
import Canvas3D from './MapMode/Canvas3D'
import PostCard3D from './MapMode/PostCard3D'
import EdgeNetwork from './MapMode/EdgeNetwork'
import AmbientDust from './MapMode/AmbientDust'
import ComposeOverlay from './ComposeOverlay'
import DetailPanel from './DetailPanel'
import ControlPanel, { DEFAULT_SETTINGS, type SceneSettings } from './ControlPanel'
import MiniMap from './UI/MiniMap'
import CameraConsent from './UI/CameraConsent'
import useGazeTracking from '../hooks/useGazeTracking'
import useHeadPose from '../hooks/useHeadPose'
import FacePreview from './UI/FacePreview'

type GazeMode = 'off' | 'consent' | 'active'

type ComposingState =
  | { type: 'post'; initialContent: string; initialAuthor: string; initialTitle: string }
  | { type: 'reply'; parentId: string }
  | null

interface CosmosExperienceProps {
  layout: CosmosLayout
  isRefining?: boolean
}

export default function CosmosExperience({ layout, isRefining }: CosmosExperienceProps) {
  const [posts, setPosts] = useState<CosmosPost[]>(() => [...layout.posts])
  // Select a random post on first load
  const [selectedPostId, setSelectedPostId] = useState<string | null>(() => {
    if (layout.posts.length === 0) return null
    return layout.posts[Math.floor(Math.random() * layout.posts.length)].id
  })

  // Sync incoming layout updates (new batches / architect refinement)
  useEffect(() => {
    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      const incomingMap = new Map(layout.posts.map((p) => [p.id, p]))

      // Update positions for existing posts (architect refinement)
      const updated = prev.map((p) => {
        const incoming = incomingMap.get(p.id)
        if (incoming && (
          incoming.position[0] !== p.position[0] ||
          incoming.position[1] !== p.position[1] ||
          incoming.position[2] !== p.position[2]
        )) {
          return { ...p, position: incoming.position }
        }
        return p
      })

      // Append new posts
      const newPosts = layout.posts.filter((p) => !existingIds.has(p.id))
      if (newPosts.length === 0) return updated
      return [...updated, ...newPosts]
    })
  }, [layout.posts])
  const [votes, setVotes] = useState<Map<string, 'up' | 'down'>>(() => new Map())
  const [composing, setComposing] = useState<ComposingState>(null)
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>(DEFAULT_SETTINGS)

  // ── Browse mode: sidebar shows nearest post content while dragging ──
  const [browseMode, setBrowseMode] = useState(false)
  const [browsedPostId, setBrowsedPostId] = useState<string | null>(null)
  const browseModeRef = useRef(false)
  browseModeRef.current = browseMode

  // ── Gaze mode: eye tracking controls browsed post (independent from drag-mode browse) ──
  const [gazeMode, setGazeMode] = useState<GazeMode>('off')
  const gazeModeRef = useRef<GazeMode>('off')
  gazeModeRef.current = gazeMode
  const camera = useGazeTracking()
  const headPose = useHeadPose(camera.videoStream)
  const [gazeSteer, setGazeSteer] = useState<{ dx: number; dy: number } | null>(null)
  const [gazeHighlightId, setGazeHighlightId] = useState<string | null>(null)

  // Face preview state
  const [showFacePreview, setShowFacePreview] = useState(true)

  // Mouse-on-card: pause gaze switching when mouse hovers over an article
  const mouseOverCardRef = useRef(false)

  // Head-pose auto-browse: stable article display with minimum time + away-close
  const headBrowsedAtRef = useRef<number | null>(null)   // timestamp when current article was auto-browsed
  const headAwayStartRef = useRef<number | null>(null)    // timestamp when attention moved away
  const headBrowsedIdRef = useRef<string | null>(null)    // current head-browsed article id
  const MIN_DISPLAY_MS = 3_000   // 3 seconds minimum before switching
  const AWAY_CLOSE_MS = 500      // 0.5 seconds of looking away to transition

  // Track camera rotation for mini-map + visibility culling
  // Use a ref for every-frame updates, throttle state updates to ~10fps
  const [cameraRotation, setCameraRotation] = useState({ theta: 0, phi: Math.PI / 2 })
  const cameraRotationRef = useRef({ theta: 0, phi: Math.PI / 2 })
  const lastCameraUpdateRef = useRef(0)

  const handleSettingsChange = useCallback((next: SceneSettings) => {
    setSceneSettings(next)
  }, [])

  // Target sphere radius from distance setting (10→100, 20→150, 30→200)
  // Posts are normalized to unit sphere; Canvas3D animates the group scale for smooth zoom
  const sphereRadius = sceneSettings.distance * 5 + 50
  const scaledPosts = useMemo(() => {
    // Normalize to unit sphere (radius 1) — actual radius is handled by group scale in Canvas3D
    // Clamp phi to [30°, 150°] to keep articles away from poles (navigation feels stuck there)
    const maxY = Math.cos(30 * Math.PI / 180) // ~0.866
    const normalized = posts.map(p => {
      const [x, y, z] = p.position
      const len = Math.sqrt(x * x + y * y + z * z) || 1
      let nx = x / len, ny = y / len, nz = z / len

      if (Math.abs(ny) > maxY) {
        ny = maxY * Math.sign(ny)
        const xzLen = Math.sqrt(nx * nx + nz * nz) || 0.001
        const targetXZ = Math.sqrt(1 - ny * ny)
        nx = (nx / xzLen) * targetXZ
        nz = (nz / xzLen) * targetXZ
      }

      return {
        ...p,
        position: [nx, ny, nz] as [number, number, number],
      }
    })

    // Repulsion: push apart any posts closer than minAngle on the unit sphere
    const minAngle = 0.45 // ~25°
    for (let iter = 0; iter < 15; iter++) {
      for (let i = 0; i < normalized.length; i++) {
        for (let j = i + 1; j < normalized.length; j++) {
          const a = normalized[i].position
          const b = normalized[j].position
          // Already on unit sphere, but renormalize for safety after pushes
          const aLen = Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2) || 1
          const bLen = Math.sqrt(b[0] ** 2 + b[1] ** 2 + b[2] ** 2) || 1
          const ax = a[0] / aLen, ay = a[1] / aLen, az = a[2] / aLen
          const bx = b[0] / bLen, by = b[1] / bLen, bz = b[2] / bLen
          const dot = ax * bx + ay * by + az * bz
          const angle = Math.acos(Math.max(-1, Math.min(1, dot)))

          if (angle < minAngle) {
            const push = (minAngle - angle) * 0.5
            const tx = ay * bz - az * by, ty = az * bx - ax * bz, tz = ax * by - ay * bx
            const tLen = Math.sqrt(tx ** 2 + ty ** 2 + tz ** 2)
            if (tLen < 0.0001) continue

            const nx = tx / tLen, ny = ty / tLen, nz = tz / tLen
            const newAx = ax + nx * push, newAy = ay + ny * push, newAz = az + nz * push
            const newBx = bx - nx * push, newBy = by - ny * push, newBz = bz - nz * push
            const naLen = Math.sqrt(newAx ** 2 + newAy ** 2 + newAz ** 2) || 1
            const nbLen = Math.sqrt(newBx ** 2 + newBy ** 2 + newBz ** 2) || 1
            normalized[i] = { ...normalized[i], position: [newAx / naLen, newAy / naLen, newAz / naLen] }
            normalized[j] = { ...normalized[j], position: [newBx / nbLen, newBy / nbLen, newBz / nbLen] }
          }
        }
      }
    }

    // Re-clamp to [30°, 150°] after repulsion may have pushed posts toward poles
    for (let i = 0; i < normalized.length; i++) {
      const [px, py, pz] = normalized[i].position
      if (Math.abs(py) > maxY) {
        const clampedY = maxY * Math.sign(py)
        const xzLen = Math.sqrt(px * px + pz * pz) || 0.001
        const targetXZ = Math.sqrt(1 - clampedY * clampedY)
        normalized[i] = {
          ...normalized[i],
          position: [(px / xzLen) * targetXZ, clampedY, (pz / xzLen) * targetXZ],
        }
      }
    }

    return normalized
  }, [posts])

  const postMap = useMemo(() => {
    const map = new Map<string, CosmosPost>()
    for (const p of posts) map.set(p.id, p)
    return map
  }, [posts])

  const selectedPost = selectedPostId ? postMap.get(selectedPostId) ?? null : null

  // When a post is selected, smoothly rotate camera to center it
  const focusTarget = useMemo<[number, number, number] | null>(() => {
    if (!selectedPostId) return null
    const sp = scaledPosts.find(p => p.id === selectedPostId)
    return sp?.position ?? null
  }, [selectedPostId, scaledPosts])

  // Visibility culling with fade zone:
  //   0°–45°  → fully visible (opacity 1)
  //   45°–65° → fade zone (opacity 1→0)
  //   65°+    → not rendered
  const cosInner = Math.cos(45 * Math.PI / 180)  // ~0.707
  const cosOuter = Math.cos(65 * Math.PI / 180)  // ~0.423
  const fadeBand = cosInner - cosOuter

  const visiblePostsWithOpacity = useMemo(() => {
    const { theta, phi } = cameraRotation
    const effectivePhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
    // Three.js Spherical convention: x = sin(phi)*sin(theta), z = sin(phi)*cos(theta)
    const lookX = Math.sin(effectivePhi) * Math.sin(theta)
    const lookY = Math.cos(effectivePhi)
    const lookZ = Math.sin(effectivePhi) * Math.cos(theta)

    const result: { post: CosmosPost; visibility: number }[] = []
    for (const p of scaledPosts) {
      if (p.id === selectedPostId || p.id === browsedPostId || p.id === gazeHighlightId) {
        result.push({ post: p, visibility: 1 })
        continue
      }
      const len = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2) || 1
      const dot = (p.position[0] / len) * lookX + (p.position[1] / len) * lookY + (p.position[2] / len) * lookZ
      if (dot < cosOuter) continue // beyond 80° — don't render
      // Quantize to 5 steps (0, 0.2, 0.4, 0.6, 0.8, 1.0) — CSS transitions smooth the rest
      const raw = dot >= cosInner ? 1 : (dot - cosOuter) / fadeBand
      const visibility = Math.round(raw * 5) / 5
      result.push({ post: p, visibility })
    }
    return result
  }, [scaledPosts, cameraRotation, selectedPostId, browsedPostId, gazeHighlightId, cosInner, cosOuter, fadeBand])

  const visiblePosts = useMemo(() => visiblePostsWithOpacity.map(v => v.post), [visiblePostsWithOpacity])
  const visibilityMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of visiblePostsWithOpacity) map.set(v.post.id, v.visibility)
    return map
  }, [visiblePostsWithOpacity])

  const relatedPosts = useMemo(() => {
    if (!selectedPost) return []
    return selectedPost.relationships
      .map((rel) => {
        const rp = postMap.get(rel.target_id)
        if (!rp) return null
        return { post: rp, type: rel.type, reason: rel.reason }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [selectedPost, postMap])

  const replies = useMemo(() => {
    if (!selectedPostId) return []
    return posts
      .filter((p) => p.parent_id === selectedPostId)
      .sort((a, b) => b.upvotes - a.upvotes)
  }, [selectedPostId, posts])

  // ── Browse mode derived data ──
  const browsedPost = browsedPostId ? postMap.get(browsedPostId) ?? null : null
  const browsedRelatedPosts = useMemo(() => {
    if (!browsedPost) return []
    return browsedPost.relationships
      .map((rel) => {
        const rp = postMap.get(rel.target_id)
        if (!rp) return null
        return { post: rp, type: rel.type, reason: rel.reason }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [browsedPost, postMap])
  const browsedReplies = useMemo(() => {
    if (!browsedPostId) return []
    return posts
      .filter((p) => p.parent_id === browsedPostId)
      .sort((a, b) => b.upvotes - a.upvotes)
  }, [browsedPostId, posts])

  // ── Auto-navigate: when dragging from a selected card, collapse it,
  //    then after pointer-up select the nearest card to camera ──
  const [pendingAutoSelect, setPendingAutoSelect] = useState(false)
  const pendingAutoSelectRef = useRef(false)
  const previousSelectedId = useRef<string | null>(null)
  const scaledPostsRef = useRef(scaledPosts)
  scaledPostsRef.current = scaledPosts

  const handleDragWhileSelected = useCallback(() => {
    if (!selectedPostId) return
    previousSelectedId.current = selectedPostId
    pendingAutoSelectRef.current = true
    setPendingAutoSelect(true)
    // Don't close article yet — wait until drag ends (handleOrbitEnd)
  }, [selectedPostId])

  const handleOrbitEnd = useCallback((_cameraPos: [number, number, number], cameraDir: [number, number, number]) => {
    if (browseModeRef.current) return // browse mode handles nearest-post via camera change
    if (!pendingAutoSelectRef.current) return
    pendingAutoSelectRef.current = false
    setPendingAutoSelect(false)

    // Close the currently open article now that drag ended
    setSelectedPostId(null)

    // Find the card most aligned with camera's look direction (excluding the one we just closed)
    let bestId: string | null = null
    let bestAlignment = -Infinity

    for (const p of scaledPostsRef.current) {
      if (p.id === previousSelectedId.current) continue
      const pLen = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2) || 1
      // Dot product of card direction with camera look direction
      const dot = (p.position[0] / pLen) * cameraDir[0] + (p.position[1] / pLen) * cameraDir[1] + (p.position[2] / pLen) * cameraDir[2]
      if (dot > bestAlignment) {
        bestAlignment = dot
        bestId = p.id
      }
    }

    previousSelectedId.current = null
    // Auto-open if nearest card is within 40° of view center
    const threshold = Math.cos(30 * Math.PI / 180) // ~0.866
    if (bestId && bestAlignment > threshold) setSelectedPostId(bestId)
  }, [])

  const handleSelect = useCallback((postId: string) => {
    if (browseModeRef.current) {
      setBrowsedPostId(postId)
      return
    }
    setPendingAutoSelect(false)
    setSelectedPostId(postId)
  }, [])

  const handleDeselect = useCallback(() => {
    setPendingAutoSelect(false)
    setSelectedPostId(null)
  }, [])

  // When user drags the canvas, keep article open during drag, close after drag ends
  const handleCanvasDragStart = useCallback(() => {
    if (browseModeRef.current) return // browse mode — no auto-select logic
    previousSelectedId.current = selectedPostId
    pendingAutoSelectRef.current = true
    setPendingAutoSelect(true)
    // Don't close article yet — wait until drag ends (handleOrbitEnd)
  }, [selectedPostId])

  // Click on empty canvas → close any open article
  const handleCanvasClick = useCallback(() => {
    setSelectedPostId(null)
  }, [])

  // ── Vote handler ──
  const handleVote = useCallback((postId: string, dir: 'up' | 'down') => {
    setVotes((prev) => {
      const next = new Map(prev)
      const current = next.get(postId)

      if (current === dir) {
        next.delete(postId)
        setPosts((ps) => ps.map((p) =>
          p.id === postId
            ? { ...p, upvotes: p.upvotes + (dir === 'up' ? -1 : 1) }
            : p
        ))
      } else {
        let delta = dir === 'up' ? 1 : -1
        if (current) delta += current === 'up' ? -1 : 1
        next.set(postId, dir)
        setPosts((ps) => ps.map((p) =>
          p.id === postId ? { ...p, upvotes: p.upvotes + delta } : p
        ))
      }
      return next
    })
  }, [])

  // ── Reply handler ──
  const handleReply = useCallback((postId: string) => {
    setComposing({ type: 'reply', parentId: postId })
  }, [])

  // ── Submit reply ──
  const handleSubmitReply = useCallback((content: string, author: string, parentId: string) => {
    const parent = postMap.get(parentId)
    const parentPos = parent?.position ?? [0, 0, 0]

    const position: [number, number, number] = [
      parentPos[0] + 0.3 + (Math.random() - 0.5) * 0.2,
      parentPos[1] - 0.3 + (Math.random() - 0.5) * 0.2,
      parentPos[2] + 0.2 + (Math.random() - 0.5) * 0.2,
    ]

    const newReply: CosmosPost = {
      id: `user_${Date.now()}`,
      content,
      author,
      parent_id: parentId,
      depth: (parent?.depth ?? 0) + 1,
      upvotes: 1,
      stance: '',
      themes: [],
      emotion: 'neutral',
      post_type: 'anecdote',
      importance: 0.4,
      core_claim: content.length > 80 ? content.slice(0, 77) + '...' : content,
      assumptions: [],
      evidence_cited: [],
      logical_chain: { builds_on: [], root_assumption: '', chain_depth: 0 },
      perceived_by: {},
      embedding_hint: { opinion_axis: 0, abstraction: 0, novelty: 0 },
      relationships: [],
      position,
      isUserPost: true,
    }

    setPosts((prev) => [...prev, newReply])
    setSelectedPostId(parentId)
    setComposing(null)
  }, [postMap])

  // ── Compose overlay submit dispatcher ──
  const [submittingPost, setSubmittingPost] = useState(false)

  const handleComposeSubmit = useCallback(async (content: string, author: string, title?: string) => {
    if (!composing) return
    if (composing.type === 'reply') {
      handleSubmitReply(content, author, composing.parentId)
      return
    }
    // New post: classify and add to sphere with animation
    setSubmittingPost(true)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, layout }),
      })
      if (!res.ok) throw new Error('Classification failed')
      const classified = await res.json() as ClassifiedPost

      const hint = classified.embedding_hint
      const theta = ((hint.opinion_axis + 1) / 2) * Math.PI * 2
      const phi = ((hint.abstraction + 1) / 2) * Math.PI
      const position: [number, number, number] = [
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.cos(theta),
      ]

      const newPost: CosmosPost = {
        ...classified,
        id: classified.id || `user_${Date.now()}`,
        author,
        core_claim: title || classified.core_claim,
        position,
        isUserPost: true,
      }

      setPosts((prev) => [...prev, newPost])
      setAnimatingPostId(newPost.id)
      if (browseMode) {
        setBrowsedPostId(newPost.id)
      } else {
        setSelectedPostId(newPost.id)
      }
      setComposing(null)

      // Highlight related posts
      const relatedIds = new Set(classified.closest_posts ?? [])
      classified.relationships?.forEach(r => relatedIds.add(r.target_id))
      setHighlightedPostIds(relatedIds)

      setTimeout(() => {
        setAnimatingPostId(null)
        setHighlightedPostIds(new Set())
      }, 2000)
    } catch (err) {
      console.error('Post submission failed:', err)
    } finally {
      setSubmittingPost(false)
    }
  }, [composing, handleSubmitReply, layout])

  // ── AI Generate Post (opens modal with pre-filled content) ──
  const [generating, setGenerating] = useState(false)
  const [animatingPostId, setAnimatingPostId] = useState<string | null>(null)
  const [highlightedPostIds, setHighlightedPostIds] = useState<Set<string>>(new Set())

  const handleGeneratePost = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const generated = await res.json() as { title: string; content: string; author: string }

      // Open compose modal pre-filled with AI content
      setComposing({
        type: 'post',
        initialContent: generated.content,
        initialAuthor: generated.author,
        initialTitle: generated.title || '',
      })
    } catch (err) {
      console.error('Generate post failed:', err)
    } finally {
      setGenerating(false)
    }
  }, [generating, layout])

  // ── Mini-map navigation ──
  const handleMiniMapNavigate = useCallback((theta: number, phi: number) => {
    // We don't need to manually set camera rotation here, the camera's focus logic will handle it
    // Create a dummy direction on the unit sphere
    const dummyPos: [number, number, number] = [
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta),
    ]
    // Find nearest post to that direction (using scaled posts)
    let nearestId: string | null = null
    let minDist = Infinity
    for (const p of scaledPosts) {
      const dx = p.position[0] - dummyPos[0]
      const dy = p.position[1] - dummyPos[1]
      const dz = p.position[2] - dummyPos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < minDist) {
        minDist = dist
        nearestId = p.id
      }
    }
    if (nearestId) setSelectedPostId(nearestId)
  }, [scaledPosts])

  const handleCameraChange = useCallback((theta: number, phi: number) => {
    cameraRotationRef.current = { theta, phi }
    // Throttle state updates to ~10fps — camera itself is still smooth at 60fps via ref
    const now = Date.now()
    if (now - lastCameraUpdateRef.current > 100) {
      lastCameraUpdateRef.current = now
      startTransition(() => setCameraRotation({ theta, phi }))

      // Browse mode: find nearest post to look direction (skip when gaze controls it)
      if (browseModeRef.current && gazeModeRef.current !== 'active') {
        const effectivePhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
        const lookX = Math.sin(effectivePhi) * Math.sin(theta)
        const lookY = Math.cos(effectivePhi)
        const lookZ = Math.sin(effectivePhi) * Math.cos(theta)

        let bestId: string | null = null
        let bestDot = -Infinity
        const threshold = Math.cos(40 * Math.PI / 180) // ~40°

        for (const p of scaledPostsRef.current) {
          const len = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2) || 1
          const dot = (p.position[0] / len) * lookX + (p.position[1] / len) * lookY + (p.position[2] / len) * lookZ
          if (dot > bestDot) {
            bestDot = dot
            bestId = p.id
          }
        }

        if (bestId && bestDot > threshold) {
          setBrowsedPostId(bestId)
        }
      }
    }
  }, [])

  // ── Gaze mode handlers ──
  const handleGazeToggle = useCallback(() => {
    if (gazeMode === 'off') {
      setGazeMode('consent')
    } else {
      camera.stop()
      setGazeMode('off')
      setGazeSteer(null)
      // Reset head-browse state
      headBrowsedIdRef.current = null
      headBrowsedAtRef.current = null
      headAwayStartRef.current = null
      setGazeHighlightId(null)
    }
  }, [gazeMode, camera])

  const handleConsentAccept = useCallback(async () => {
    const ok = await camera.start()
    if (ok) {
      setGazeMode('active')
      setSelectedPostId(null)
    } else {
      setGazeMode('off')
    }
  }, [camera])

  const handleConsentDecline = useCallback(() => {
    setGazeMode('off')
  }, [])

  // ── Gaze processing: steer camera via head pose + auto-browse nearest article ──
  useEffect(() => {
    if (gazeMode !== 'active') return

    // Use head pose as the steering signal
    if (headPose.faceDetected) {
      setGazeSteer({ dx: headPose.yaw, dy: headPose.pitch })
    }

    // Auto-browse: find nearest post to where head is pointing
    // Lead the search ahead of camera by adding head-pose offset
    const { theta, phi } = cameraRotationRef.current
    const GAZE_LEAD = 45 * Math.PI / 180 // head-pose offset angle
    const gazeTheta = theta + headPose.yaw * GAZE_LEAD
    const gazePhi = phi - headPose.pitch * GAZE_LEAD
    const effectivePhi = Math.max(0.1, Math.min(Math.PI - 0.1, gazePhi))
    const lookX = Math.sin(effectivePhi) * Math.sin(gazeTheta)
    const lookY = Math.cos(effectivePhi)
    const lookZ = Math.sin(effectivePhi) * Math.cos(gazeTheta)

    let bestId: string | null = null
    let bestDot = -Infinity
    const threshold = Math.cos(40 * Math.PI / 180)

    for (const p of scaledPostsRef.current) {
      const len = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2) || 1
      const dot = (p.position[0] / len) * lookX + (p.position[1] / len) * lookY + (p.position[2] / len) * lookZ
      if (dot > bestDot) {
        bestDot = dot
        bestId = p.id
      }
    }

    const now = Date.now()
    const currentId = headBrowsedIdRef.current

    // Mouse on card → freeze: don't switch articles
    if (mouseOverCardRef.current) {
      headAwayStartRef.current = null
      return
    }

    // No article within view cone
    if (!bestId || bestDot < threshold) {
      // If currently showing an article, start the away timer
      if (currentId && headBrowsedAtRef.current) {
        if (!headAwayStartRef.current) {
          headAwayStartRef.current = now
        } else if (now - headAwayStartRef.current > AWAY_CLOSE_MS &&
                   now - headBrowsedAtRef.current > MIN_DISPLAY_MS) {
          // Past minimum display + away → close
          setGazeHighlightId(null)
          setSelectedPostId(null)
          headBrowsedIdRef.current = null
          headBrowsedAtRef.current = null
          headAwayStartRef.current = null
        }
      }
      return
    }

    // Same article as currently shown
    if (bestId === currentId) {
      headAwayStartRef.current = null // attention returned, reset away timer
      return
    }

    // Different article — check if we can switch
    if (!currentId) {
      // No article currently shown — open immediately
      setGazeHighlightId(bestId)
      setSelectedPostId(bestId)
      headBrowsedIdRef.current = bestId
      headBrowsedAtRef.current = now
      headAwayStartRef.current = null
    } else if (headBrowsedAtRef.current && now - headBrowsedAtRef.current > MIN_DISPLAY_MS) {
      // Past minimum display time — start away timer for current article
      if (!headAwayStartRef.current) {
        headAwayStartRef.current = now
      } else if (now - headAwayStartRef.current > AWAY_CLOSE_MS) {
        // Away → transition to new article
        setGazeHighlightId(bestId)
        setSelectedPostId(bestId)
        headBrowsedIdRef.current = bestId
        headBrowsedAtRef.current = now
        headAwayStartRef.current = null
      }
    } else {
      // Still within minimum display time — keep current article, don't switch
      headAwayStartRef.current = null
    }
  }, [gazeMode, headPose.yaw, headPose.pitch, headPose.faceDetected])

  if (layout.posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full"
        style={{ background: '#1C1A18' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#F5F2EF' }}>No posts found</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ background: '#262220' }}>
      {/* Full-screen 3D canvas — always interactive for orbit/zoom */}
      <Canvas3D settings={sceneSettings} articleRadius={sphereRadius} focusTarget={focusTarget} pendingAutoSelect={pendingAutoSelect} gazeSteer={gazeMode === 'active' && !selectedPostId ? gazeSteer : null} onOrbitEnd={handleOrbitEnd} onCameraChange={handleCameraChange} onCanvasDragStart={handleCanvasDragStart} onCanvasClick={handleCanvasClick}>
        {visiblePosts.map((post) => (
          <PostCard3D
            key={post.id}
            post={post}
            isSelected={!browseMode && selectedPostId === post.id}
            isBrowsed={(browseMode && browsedPostId === post.id) || (gazeMode === 'active' && gazeHighlightId === post.id)}
            visibility={visibilityMap.get(post.id) ?? 1}
            isAnimatingIn={animatingPostId === post.id}
            isHighlighted={highlightedPostIds.has(post.id)}
            dimmed={false}
            articleScale={sceneSettings.articleScale}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            relatedPosts={!browseMode && selectedPostId === post.id ? relatedPosts : undefined}
            replies={!browseMode && selectedPostId === post.id ? replies : undefined}
            onNavigate={handleSelect}
            onVote={handleVote}
            userVote={votes.get(post.id) ?? null}
            onReply={handleReply}
            onDragWhileSelected={!browseMode && selectedPostId === post.id ? handleDragWhileSelected : undefined}
            onHover={(h) => { mouseOverCardRef.current = h }}
          />
        ))}
        <EdgeNetwork posts={visiblePosts} opacity={sceneSettings.edgeOpacity} />
        <AmbientDust />
      </Canvas3D>

      {/* UI overlay layer — sits above the 3D canvas + card stacking context */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10001, pointerEvents: 'none' }}>
        {/* Control panel */}
        <div style={{ pointerEvents: 'auto' }}>
          <ControlPanel settings={sceneSettings} onChange={handleSettingsChange} />
        </div>

        {/* Mini-map */}
        <div style={{ pointerEvents: 'auto' }}>
          <MiniMap
            posts={posts}
            cameraTheta={cameraRotation.theta}
            cameraPhi={cameraRotation.phi}
            onNavigate={handleMiniMapNavigate}
          />
        </div>

        {/* Top-left gaze mode toggle (below control panel) */}
        <div style={{
          position: 'absolute', top: 100, left: 16,
          pointerEvents: 'auto',
        }}>
          <button
            onClick={handleGazeToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 12,
              border: gazeMode === 'active' ? '1px solid #8FB8A0' : '1px solid #3A3530',
              backgroundColor: gazeMode === 'active' ? 'rgba(143, 184, 160, 0.15)' : 'rgba(38, 34, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              color: gazeMode === 'active' ? '#8FB8A0' : '#9E9589', fontSize: 13, fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
            </svg>
            {gazeMode === 'active' ? 'Gaze On' : 'Gaze'}
          </button>
          {/* Error toast */}
          {camera.error && gazeMode === 'off' && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 10,
              backgroundColor: 'rgba(200, 80, 60, 0.15)',
              border: '1px solid rgba(200, 80, 60, 0.3)',
              fontSize: 11, color: '#E8836B',
              fontFamily: 'system-ui, sans-serif',
              maxWidth: 200, lineHeight: 1.4,
            }}>
              Camera not found. Check that a webcam is connected and permissions are allowed.
            </div>
          )}
        </div>

        {/* Top-right drag mode toggle */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          pointerEvents: 'auto',
        }}>
          <button
            onClick={() => {
              if (browseMode) {
                setBrowseMode(false)
                setBrowsedPostId(null)
              } else {
                setBrowseMode(true)
                setSelectedPostId(null)
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 12,
              border: browseMode ? '1px solid #D4B872' : '1px solid #3A3530',
              backgroundColor: browseMode ? 'rgba(212, 184, 114, 0.15)' : 'rgba(38, 34, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              color: browseMode ? '#D4B872' : '#9E9589', fontSize: 13, fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Drag Mode
          </button>
        </div>

        {/* Bottom-right actions */}
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          display: 'flex', gap: 8, alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          <Link
            to="/list"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 16px', borderRadius: 12,
              border: '1px solid #3A3530',
              backgroundColor: 'rgba(38, 34, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#9E9589', fontSize: 13, fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </Link>
          <button
            onClick={handleGeneratePost}
            disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12,
              border: 'none',
              backgroundColor: generating ? '#8A7D5A' : '#D4B872',
              color: '#1C1A18',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              cursor: generating ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.2s',
            }}
          >
            {generating ? (
              <>
                <div style={{
                  width: 16, height: 16, border: '2px solid #1C1A18',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Generating...
              </>
            ) : (
              <>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Post
              </>
            )}
          </button>
        </div>

        {/* Drag-mode browse sidebar */}
        {browseMode && browsedPost && (
          <div style={{ pointerEvents: 'auto' }}>
            <DetailPanel
              post={browsedPost}
              relatedPosts={browsedRelatedPosts}
              replies={browsedReplies}
              onNavigate={(id) => setBrowsedPostId(id)}
              onClose={() => {
                setBrowseMode(false)
                setBrowsedPostId(null)
              }}
              onVote={handleVote}
              userVote={votes.get(browsedPost.id) ?? null}
              onReply={handleReply}
            />
          </div>
        )}

        {/* Compose overlay */}
        {composing && (
          <div style={{ pointerEvents: 'auto' }}>
            <ComposeOverlay
              mode={
                composing.type === 'post'
                  ? { type: 'post', initialContent: composing.initialContent, initialAuthor: composing.initialAuthor, initialTitle: composing.initialTitle }
                  : { type: 'reply', parentAuthor: postMap.get(composing.parentId)?.author ?? 'Unknown' }
              }
              onSubmit={handleComposeSubmit}
              onCancel={() => setComposing(null)}
              submitting={submittingPost}
            />
          </div>
        )}

        {/* Refining indicator */}
        {isRefining && (
          <div className="absolute" style={{
            top: 16, right: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 8,
            backgroundColor: 'rgba(38, 34, 32, 0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid #3A3530',
            transition: 'right 0.3s ease',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: '#D4B872',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'system-ui', fontSize: 11, color: '#9E9589',
            }}>
              Loading more posts...
            </span>
            <style>{`
              @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* Hint — only when no post is selected */}
        {!selectedPostId && !browseMode && (
          <div className="absolute" style={{
            bottom: 16, left: '50%', transform: 'translateX(-50%)',
          }}>
            <div style={{
              padding: '6px 14px', borderRadius: 8,
              backgroundColor: 'rgba(38, 34, 32, 0.7)', backdropFilter: 'blur(8px)',
              fontFamily: 'system-ui', fontSize: 11, color: '#6B6560',
            }}>
              Click a card to read &middot; Drag to look around &middot; Scroll to zoom
            </div>
          </div>
        )}

        {/* Face preview — bottom-left when gaze active */}
        {gazeMode === 'active' && (
          <FacePreview
            videoStream={camera.videoStream}
            visible={showFacePreview}
            onToggle={() => setShowFacePreview(v => !v)}
          />
        )}

        {/* Camera consent modal */}
        {gazeMode === 'consent' && (
          <div style={{ pointerEvents: 'auto' }}>
            <CameraConsent
              onAccept={handleConsentAccept}
              onDecline={handleConsentDecline}
            />
          </div>
        )}

      </div>
    </div>
  )
}
