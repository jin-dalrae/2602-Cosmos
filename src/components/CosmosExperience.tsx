import { useCallback, useState, useMemo, useEffect, useRef, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { CosmosLayout, CosmosPost, ClassifiedPost } from '../lib/types'
import { API_BASE } from '../lib/api'
import Canvas3D from './MapMode/Canvas3D'
import PostCard3D from './MapMode/PostCard3D'
import EdgeNetwork from './MapMode/EdgeNetwork'
import AmbientDust from './MapMode/AmbientDust'
import ComposeOverlay from './ComposeOverlay'
import DetailPanel from './DetailPanel'
import ControlPanel, { DEFAULT_SETTINGS, type SceneSettings } from './ControlPanel'
import CameraConsent from './UI/CameraConsent'
import useGazeTracking from '../hooks/useGazeTracking'
import useHeadPose from '../hooks/useHeadPose'
import FacePreview from './UI/FacePreview'
import { GazeLearner } from '../lib/gazeLearner'

type GazeMode = 'off' | 'consent' | 'active'

type ComposingState =
  | { type: 'post' }
  | { type: 'reply'; parentId: string }
  | null

interface CosmosExperienceProps {
  layout: CosmosLayout
  isRefining?: boolean
}

export default function CosmosExperience({ layout, isRefining }: CosmosExperienceProps) {
  const [posts, setPosts] = useState<CosmosPost[]>(() =>
    layout.posts.map(p => ({
      ...p,
      // TEST: assign random timestamps 0–60 days ago to visualize temporal shells
      created_at: p.created_at ?? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    }))
  )
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

  // ── Auto-open: whether dragging/gazing auto-opens articles ──
  const [autoOpen, setAutoOpen] = useState(true)
  const autoOpenRef = useRef(true)
  autoOpenRef.current = autoOpen

  // ── Browse mode: sidebar shows nearest post content while dragging ──
  const [browseMode, setBrowseMode] = useState(false)
  const [browsedPostId, setBrowsedPostId] = useState<string | null>(null)
  const browseModeRef = useRef(false)
  browseModeRef.current = browseMode

  // ── Drag browsing: show nearest-to-center article in sidebar while dragging ──
  const isDraggingRef = useRef(false)

  // ── Gaze mode: eye tracking controls browsed post (independent from drag-mode browse) ──
  const [gazeMode, setGazeMode] = useState<GazeMode>('off')
  const gazeModeRef = useRef<GazeMode>('off')
  gazeModeRef.current = gazeMode
  const camera = useGazeTracking()
  const headPose = useHeadPose(camera.videoStream)
  const [gazeSteer, setGazeSteer] = useState<{ dx: number; dy: number } | null>(null)
  const [gazeHighlightId, setGazeHighlightId] = useState<string | null>(null)

  // Gaze learner: passively learns correction from clicks
  const gazeLearnerRef = useRef(new GazeLearner())

  // Face preview state
  const [showFacePreview, setShowFacePreview] = useState(true)

  // Mouse-on-card: pause gaze switching when mouse hovers over an article
  const mouseOverCardRef = useRef(false)

  // Stable ref for headPose (used in callbacks without dependency)
  const headPoseRef = useRef(headPose)
  headPoseRef.current = headPose

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

  // Time scroll: continuous offset that shifts which age range is in focus
  // 0 = newest posts in front, higher = older posts brought forward
  const [timeScroll, setTimeScroll] = useState(0)

  const handleTimeScroll = useCallback((delta: number) => {
    setTimeScroll(prev => {
      let next = prev + delta
      // Wrap around [0, 1) — endless rotation
      next = next - Math.floor(next)
      return next
    })
  }, [])

  // Pinch zoom: adjust FOV to go "nearer" into the space
  const [zoomFov, setZoomFov] = useState(78)
  const handlePinchZoom = useCallback((delta: number) => {
    setZoomFov(prev => Math.max(30, Math.min(110, prev + delta)))
  }, [])

  // Rank-based ageNorm: evenly space posts by timestamp order
  // so every card gets a distinct slot in the rotation cycle
  const ageNormByPost = useMemo(() => {
    const sorted = [...posts]
      .map((p, i) => ({ id: p.id, ts: p.created_at ? new Date(p.created_at).getTime() : 0, idx: i }))
      .sort((a, b) => b.ts - a.ts) // newest first
    const map = new Map<string, number>()
    const n = sorted.length
    sorted.forEach((s, rank) => {
      map.set(s.id, n > 1 ? rank / n : 0) // evenly spaced 0...(n-1)/n
    })
    return map
  }, [posts])

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

      // Rank-based ageNorm: evenly distributed so each card has its own slot
      const ageNorm = ageNormByPost.get(p.id) ?? 0

      // Fog: scroll shifts which time period is in focus
      // Circular distance so wrapping is seamless
      let depthOffset = ageNorm - timeScroll
      if (depthOffset > 0.5) depthOffset -= 1
      if (depthOffset < -0.5) depthOffset += 1
      const fogDistance = Math.abs(depthOffset)
      const ageFade = Math.max(0.6, 1.0 - fogDistance * 0.6)

      return {
        ...p,
        position: [nx, ny, nz] as [number, number, number],
        ageFade,
        ageNorm,
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
  }, [posts, timeScroll])

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
  const cosInner = Math.cos(35 * Math.PI / 180)  // ~0.819
  const cosOuter = Math.cos(55 * Math.PI / 180)  // ~0.574
  const fadeBand = cosInner - cosOuter

  const visiblePostsWithOpacity = useMemo(() => {
    const { theta, phi } = cameraRotation
    const effectivePhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
    // Three.js Spherical convention: x = sin(phi)*sin(theta), z = sin(phi)*cos(theta)
    const lookX = Math.sin(effectivePhi) * Math.sin(theta)
    const lookY = Math.cos(effectivePhi)
    const lookZ = Math.sin(effectivePhi) * Math.cos(theta)

    const result: { post: CosmosPost & { ageFade?: number }; visibility: number }[] = []
    for (const p of scaledPosts) {
      if (p.id === selectedPostId || p.id === browsedPostId || p.id === gazeHighlightId) {
        result.push({ post: p, visibility: 1 })
        continue
      }
      const len = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2) || 1
      const dot = (p.position[0] / len) * lookX + (p.position[1] / len) * lookY + (p.position[2] / len) * lookZ
      if (dot < cosOuter) continue // beyond 80° — don't render
      const visibility = dot >= cosInner ? 1 : (dot - cosOuter) / fadeBand
      result.push({ post: p, visibility })
    }
    return result
  }, [scaledPosts, cameraRotation, selectedPostId, browsedPostId, gazeHighlightId, cosInner, cosOuter, fadeBand])

  // Sort: further from focal point renders first (behind), focal posts render last (on top)
  const visiblePosts = useMemo(() => {
    const sorted = [...visiblePostsWithOpacity]
    sorted.sort((a, b) => {
      const ageA = (a.post as { ageNorm?: number }).ageNorm ?? 0
      const ageB = (b.post as { ageNorm?: number }).ageNorm ?? 0
      // Circular distance from focal point
      let dA = ageA - timeScroll; if (dA > 0.5) dA -= 1; if (dA < -0.5) dA += 1
      let dB = ageB - timeScroll; if (dB > 0.5) dB -= 1; if (dB < -0.5) dB += 1
      const distA = Math.abs(dA)
      const distB = Math.abs(dB)
      return distB - distA // furthest first
    })
    return sorted.map(v => v.post)
  }, [visiblePostsWithOpacity, timeScroll])
  const ageFadeMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of visiblePostsWithOpacity) map.set(v.post.id, (v.post as { ageFade?: number }).ageFade ?? 1)
    return map
  }, [visiblePostsWithOpacity])
  const ageNormMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of visiblePostsWithOpacity) map.set(v.post.id, (v.post as { ageNorm?: number }).ageNorm ?? 0)
    return map
  }, [visiblePostsWithOpacity])
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
    isDraggingRef.current = true
    if (!selectedPostId) return
    previousSelectedId.current = selectedPostId
    pendingAutoSelectRef.current = true
    setPendingAutoSelect(true)
    // Don't close article yet — wait until drag ends (handleOrbitEnd)
  }, [selectedPostId])

  const handleOrbitEnd = useCallback((_cameraPos: [number, number, number], cameraDir: [number, number, number]) => {
    isDraggingRef.current = false

    if (browseModeRef.current) return // browse mode handles nearest-post via camera change

    // Clear the drag-browsed sidebar — the auto-select below will open the full card
    setBrowsedPostId(null)

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
    // Auto-open if nearest card is within 40° of view center (only if auto-open enabled)
    const threshold = Math.cos(30 * Math.PI / 180) // ~0.866
    if (autoOpenRef.current && bestId && bestAlignment > threshold) setSelectedPostId(bestId)
  }, [])

  const handleSelect = useCallback((postId: string) => {
    if (browseModeRef.current) {
      setBrowsedPostId(postId)
      return
    }

    // Gaze learner: record click as ground truth for calibration
    if (gazeModeRef.current === 'active') {
      const post = scaledPostsRef.current.find(p => p.id === postId)
      if (post) {
        const len = Math.sqrt(post.position[0] ** 2 + post.position[1] ** 2 + post.position[2] ** 2) || 1
        const cardTheta = Math.atan2(post.position[0] / len, post.position[2] / len)
        const cardPhi = Math.acos(Math.max(-1, Math.min(1, post.position[1] / len)))
        const maxOffset = 60 * Math.PI / 180 // must match Canvas3D maxOffset
        gazeLearnerRef.current.recordClick(
          headPoseRef.current.yaw,
          headPoseRef.current.pitch,
          cardTheta,
          cardPhi,
          cameraRotationRef.current.theta,
          cameraRotationRef.current.phi,
          maxOffset,
        )
      }
    }

    setPendingAutoSelect(false)
    setBrowsedPostId(null) // hide sidebar when selecting a card directly
    setSelectedPostId(postId)
  }, [])

  const handleDeselect = useCallback(() => {
    setPendingAutoSelect(false)
    setSelectedPostId(null)
  }, [])

  // When user drags the canvas, keep article open during drag, close after drag ends
  const handleCanvasDragStart = useCallback(() => {
    isDraggingRef.current = true
    if (browseModeRef.current) return // browse mode — no auto-select logic
    previousSelectedId.current = selectedPostId
    pendingAutoSelectRef.current = true
    setPendingAutoSelect(true)
    // Don't close article yet — wait until drag ends (handleOrbitEnd)
  }, [selectedPostId])

  // Click on empty canvas → close any open article and sidebar
  const handleCanvasClick = useCallback(() => {
    setSelectedPostId(null)
    if (!browseModeRef.current) setBrowsedPostId(null)
  }, [])

  // ── Vote handler ──
  const handleVote = useCallback((postId: string, dir: 'up' | 'down') => {
    setVotes((prev) => {
      const next = new Map(prev)
      const current = next.get(postId)
      let delta: number

      if (current === dir) {
        next.delete(postId)
        delta = dir === 'up' ? -1 : 1
        setPosts((ps) => ps.map((p) =>
          p.id === postId ? { ...p, upvotes: p.upvotes + delta } : p
        ))
      } else {
        delta = dir === 'up' ? 1 : -1
        if (current) delta += current === 'up' ? -1 : 1
        next.set(postId, dir)
        setPosts((ps) => ps.map((p) =>
          p.id === postId ? { ...p, upvotes: p.upvotes + delta } : p
        ))
      }

      // Fire-and-forget: persist vote delta to MongoDB
      fetch(`${API_BASE}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, direction: next.has(postId) ? dir : null, topic: layout.topic, delta }),
      }).catch(() => { /* best-effort */ })

      return next
    })
  }, [layout.topic])

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
      created_at: new Date().toISOString(),
    }

    setPosts((prev) => [...prev, newReply])
    setSelectedPostId(parentId)
    setComposing(null)

    // Persist to DB (fire-and-forget)
    fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: newReply, topic: layout?.topic ?? 'SF Richmond' }),
    }).catch(() => { /* best-effort */ })
  }, [postMap, layout])

  // ── Compose overlay submit dispatcher ──
  const [submittingPost, setSubmittingPost] = useState(false)

  const handleComposeSubmit = useCallback(async (content: string, author: string, title?: string) => {
    if (!composing) return
    if (composing.type === 'reply') {
      handleSubmitReply(content, author, composing.parentId)
      return
    }
    // New post: classify to find the right position among related articles
    setSubmittingPost(true)
    try {
      const res = await fetch(`${API_BASE}/api/classify`, {
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
        created_at: new Date().toISOString(),
      }

      setPosts((prev) => [...prev, newPost])
      setAnimatingPostId(newPost.id)
      if (browseMode) {
        setBrowsedPostId(newPost.id)
      } else {
        setSelectedPostId(newPost.id)
      }
      setComposing(null)

      // Persist to DB (fire-and-forget)
      fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: newPost, topic: layout?.topic ?? 'SF Richmond' }),
      }).catch(() => { /* best-effort */ })

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
  }, [composing, handleSubmitReply, layout, browseMode])

  const [animatingPostId, setAnimatingPostId] = useState<string | null>(null)
  const [highlightedPostIds, setHighlightedPostIds] = useState<Set<string>>(new Set())

  const handleCameraChange = useCallback((theta: number, phi: number) => {
    cameraRotationRef.current = { theta, phi }
    // Throttle state updates to ~10fps — camera itself is still smooth at 60fps via ref
    const now = Date.now()
    if (now - lastCameraUpdateRef.current > 25) {
      lastCameraUpdateRef.current = now
      startTransition(() => setCameraRotation({ theta, phi }))

      // Find nearest post to look direction during browse mode OR while dragging (but not when a card is already selected)
      const shouldFindNearest = (browseModeRef.current && gazeModeRef.current !== 'active') || (isDraggingRef.current && !pendingAutoSelectRef.current)
      if (shouldFindNearest) {
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

    // Use head pose as the steering signal, with learned correction applied
    if (headPose.faceDetected) {
      const corrected = gazeLearnerRef.current.correct(headPose.yaw, headPose.pitch)
      setGazeSteer({ dx: corrected.yaw, dy: corrected.pitch })
    }

    // Reading protection: when a card is selected and head movement is small,
    // the user is reading (eyes scanning down the text). Don't switch.
    const READING_THRESHOLD = 0.35 // head must move beyond this to consider switching
    if (selectedPostId && headBrowsedIdRef.current === selectedPostId) {
      const headMagnitude = Math.sqrt(headPose.yaw ** 2 + headPose.pitch ** 2)
      if (headMagnitude < READING_THRESHOLD) {
        headAwayStartRef.current = null
        return // small head movement while reading — ignore
      }
    }

    // Auto-browse: find nearest post to where head is pointing
    // Lead the search ahead of camera by adding head-pose offset
    const { theta, phi } = cameraRotationRef.current
    const GAZE_LEAD = 65 * Math.PI / 180 // head-pose offset angle (increased for desktop sensitivity)
    const gazeTheta = theta + headPose.yaw * GAZE_LEAD
    const gazePhi = phi - headPose.pitch * GAZE_LEAD
    const effectivePhi = Math.max(0.1, Math.min(Math.PI - 0.1, gazePhi))
    const lookX = Math.sin(effectivePhi) * Math.sin(gazeTheta)
    const lookY = Math.cos(effectivePhi)
    const lookZ = Math.sin(effectivePhi) * Math.cos(gazeTheta)

    // Get the selected card's direction (to exclude occluded cards)
    let selectedDir: [number, number, number] | null = null
    if (selectedPostId) {
      const sp = scaledPostsRef.current.find(p => p.id === selectedPostId)
      if (sp) {
        const sLen = Math.sqrt(sp.position[0] ** 2 + sp.position[1] ** 2 + sp.position[2] ** 2) || 1
        selectedDir = [sp.position[0] / sLen, sp.position[1] / sLen, sp.position[2] / sLen]
      }
    }

    let bestId: string | null = null
    let bestDot = -Infinity
    const threshold = Math.cos(40 * Math.PI / 180)
    const occlusionThreshold = Math.cos(15 * Math.PI / 180) // cards within 15° of selected are hidden behind it

    for (const p of scaledPostsRef.current) {
      const len = Math.sqrt(p.position[0] ** 2 + p.position[1] ** 2 + p.position[2] ** 2) || 1
      const px = p.position[0] / len, py = p.position[1] / len, pz = p.position[2] / len

      // Skip cards occluded by the currently open article
      if (selectedDir && p.id !== selectedPostId) {
        const occDot = px * selectedDir[0] + py * selectedDir[1] + pz * selectedDir[2]
        if (occDot > occlusionThreshold) continue // too close to selected card — hidden behind it
      }

      const dot = px * lookX + py * lookY + pz * lookZ
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
      if (autoOpenRef.current) setSelectedPostId(bestId)
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
        if (autoOpenRef.current) setSelectedPostId(bestId)
        headBrowsedIdRef.current = bestId
        headBrowsedAtRef.current = now
        headAwayStartRef.current = null
      }
    } else {
      // Still within minimum display time — keep current article, don't switch
      headAwayStartRef.current = null
    }
  }, [gazeMode, headPose.yaw, headPose.pitch, headPose.faceDetected])

  // Prevent browser native pinch-zoom so only our FOV zoom works
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault()
    }
    const preventGesture = (e: Event) => e.preventDefault()
    document.addEventListener('wheel', preventZoom, { passive: false })
    document.addEventListener('gesturestart', preventGesture)
    document.addEventListener('gesturechange', preventGesture)
    return () => {
      document.removeEventListener('wheel', preventZoom)
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
    }
  }, [])

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
      <Canvas3D settings={sceneSettings} articleRadius={sphereRadius} focusTarget={focusTarget} pendingAutoSelect={pendingAutoSelect} gazeSteer={gazeMode === 'active' && !selectedPostId ? gazeSteer : null} onOrbitEnd={handleOrbitEnd} onCameraChange={handleCameraChange} onCanvasDragStart={handleCanvasDragStart} onCanvasClick={handleCanvasClick} onTimeScroll={handleTimeScroll} onPinchZoom={handlePinchZoom} fov={zoomFov}>
        {visiblePosts.map((post) => (
          <PostCard3D
            key={post.id}
            post={post}
            isSelected={!browseMode && selectedPostId === post.id}
            isBrowsed={browsedPostId === post.id || (gazeMode === 'active' && gazeHighlightId === post.id)}
            visibility={visibilityMap.get(post.id) ?? 1}
            isAnimatingIn={animatingPostId === post.id}
            isHighlighted={highlightedPostIds.has(post.id)}
            dimmed={false}
            ageFade={ageFadeMap.get(post.id) ?? 1}
            zLayer={Math.abs((ageNormMap.get(post.id) ?? 0) - timeScroll) < 0.3 ? 0 : 1}
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


        {/* Top-right mode toggles */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          display: 'flex', gap: 6,
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
            Drag
          </button>
          <button
            onClick={() => setAutoOpen(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 12,
              border: autoOpen ? '1px solid #B8A08F' : '1px solid #3A3530',
              backgroundColor: autoOpen ? 'rgba(184, 160, 143, 0.15)' : 'rgba(38, 34, 32, 0.85)',
              backdropFilter: 'blur(8px)',
              color: autoOpen ? '#B8A08F' : '#9E9589', fontSize: 13, fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {autoOpen ? (
                <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" /></>
              ) : (
                <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></>
              )}
            </svg>
            Auto-open
          </button>
        </div>
        {/* Camera error toast */}
        {camera.error && gazeMode === 'off' && (
          <div style={{
            position: 'absolute', top: 60, right: 16,
            padding: '8px 12px', borderRadius: 10,
            backgroundColor: 'rgba(200, 80, 60, 0.15)',
            border: '1px solid rgba(200, 80, 60, 0.3)',
            fontSize: 11, color: '#E8836B',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 200, lineHeight: 1.4,
            pointerEvents: 'auto',
          }}>
            Camera not found. Check that a webcam is connected and permissions are allowed.
          </div>
        )}

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
            onClick={() => setComposing({ type: 'post' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12,
              border: 'none',
              backgroundColor: '#D4B872',
              color: '#1C1A18',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'background-color 0.2s',
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Post
          </button>
        </div>

        {/* Browse sidebar — shown in browse mode OR while dragging */}
        <AnimatePresence>
          {browsedPost && (
            <motion.div
              key="detail-panel"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              style={{ pointerEvents: 'auto' }}
              onPointerEnter={() => {
                // End any active canvas drag so the user can read the sidebar
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
              }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compose overlay */}
        {composing && (
          <div style={{ pointerEvents: 'auto' }}>
            <ComposeOverlay
              mode={
                composing.type === 'post'
                  ? { type: 'post' }
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
