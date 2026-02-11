import { useCallback, useState, useMemo, useEffect } from 'react'
import type { CosmosLayout, CosmosPost } from '../lib/types'
import Canvas3D from './MapMode/Canvas3D'
import PostCard3D from './MapMode/PostCard3D'
import EdgeNetwork from './MapMode/EdgeNetwork'
import AmbientDust from './MapMode/AmbientDust'
import ComposeOverlay from './ComposeOverlay'

type ComposingState = { type: 'post' } | { type: 'reply'; parentId: string } | null

interface CosmosExperienceProps {
  layout: CosmosLayout
  isRefining?: boolean
}

export default function CosmosExperience({ layout, isRefining }: CosmosExperienceProps) {
  // Start with the highest-importance post selected — immediately readable
  const initialPostId = useMemo(() => {
    const sorted = [...layout.posts].sort((a, b) => b.importance - a.importance)
    return sorted[0]?.id ?? null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedPostId, setSelectedPostId] = useState<string | null>(initialPostId)
  const [posts, setPosts] = useState<CosmosPost[]>(() => [...layout.posts])

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

  const postMap = useMemo(() => {
    const map = new Map<string, CosmosPost>()
    for (const p of posts) map.set(p.id, p)
    return map
  }, [posts])

  const selectedPost = selectedPostId ? postMap.get(selectedPostId) ?? null : null

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

  // Camera flies to the selected post's 3D position
  const flyTarget = selectedPost?.position ?? null

  const handleSelect = useCallback((postId: string) => {
    setSelectedPostId(postId)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelectedPostId(null)
  }, [])

  // ── Vote handler ──
  const handleVote = useCallback((postId: string, dir: 'up' | 'down') => {
    setVotes((prev) => {
      const next = new Map(prev)
      const current = next.get(postId)

      if (current === dir) {
        // Toggle off
        next.delete(postId)
        setPosts((ps) => ps.map((p) =>
          p.id === postId
            ? { ...p, upvotes: p.upvotes + (dir === 'up' ? -1 : 1) }
            : p
        ))
      } else {
        // Set new vote (undo previous if any)
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

  // ── Reply handler (opens compose overlay) ──
  const handleReply = useCallback((postId: string) => {
    setComposing({ type: 'reply', parentId: postId })
  }, [])

  // ── Submit new post ──
  const handleSubmitPost = useCallback((content: string, author: string) => {
    const avgPos: [number, number, number] = [0, 0, 0]
    for (const p of posts) {
      avgPos[0] += p.position[0]
      avgPos[1] += p.position[1]
      avgPos[2] += p.position[2]
    }
    const n = posts.length || 1
    avgPos[0] /= n
    avgPos[1] /= n
    avgPos[2] /= n

    const position: [number, number, number] = [
      avgPos[0] + (Math.random() - 0.5) * 1.2,
      avgPos[1] + (Math.random() - 0.5) * 1.2,
      avgPos[2] + (Math.random() - 0.5) * 1.2,
    ]

    const newPost: CosmosPost = {
      id: `user_${Date.now()}`,
      content,
      author,
      parent_id: null,
      depth: 0,
      upvotes: 1,
      stance: '',
      themes: [],
      emotion: 'neutral',
      post_type: 'anecdote',
      importance: 0.5,
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

    setPosts((prev) => [...prev, newPost])
    setSelectedPostId(newPost.id)
    setComposing(null)
  }, [posts])

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
    setSelectedPostId(parentId) // Stay on parent to see the reply
    setComposing(null)
  }, [postMap])

  // ── Compose overlay submit dispatcher ──
  const handleComposeSubmit = useCallback((content: string, author: string) => {
    if (!composing) return
    if (composing.type === 'post') {
      handleSubmitPost(content, author)
    } else {
      handleSubmitReply(content, author, composing.parentId)
    }
  }, [composing, handleSubmitPost, handleSubmitReply])

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
      {/* Full-screen 3D — all posts live in the space, selected one expands in-place */}
      <Canvas3D flyTo={flyTarget}>
        {posts.map((post) => (
          <PostCard3D
            key={post.id}
            post={post}
            isSelected={selectedPostId === post.id}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            relatedPosts={selectedPostId === post.id ? relatedPosts : undefined}
            replies={selectedPostId === post.id ? replies : undefined}
            onNavigate={handleSelect}
            onVote={handleVote}
            userVote={votes.get(post.id) ?? null}
            onReply={handleReply}
          />
        ))}
        <EdgeNetwork posts={posts} />
        <AmbientDust />
      </Canvas3D>

      {/* New Post button */}
      <button
        onClick={() => setComposing({ type: 'post' })}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          borderRadius: 12,
          border: 'none',
          backgroundColor: '#D4B872',
          color: '#1C1A18',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Post
      </button>

      {/* Compose overlay */}
      {composing && (
        <ComposeOverlay
          mode={
            composing.type === 'reply'
              ? { type: 'reply', parentAuthor: postMap.get(composing.parentId)?.author ?? 'Unknown' }
              : { type: 'post' }
          }
          onSubmit={handleComposeSubmit}
          onCancel={() => setComposing(null)}
        />
      )}

      {/* Refining indicator */}
      {isRefining && (
        <div className="absolute" style={{
          top: 16, right: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 8,
          backgroundColor: 'rgba(38, 34, 32, 0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid #3A3530',
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
          <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
        </div>
      )}

      {/* Hint — only when no post is selected */}
      {!selectedPostId && (
        <div className="absolute" style={{
          bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            backgroundColor: 'rgba(38, 34, 32, 0.7)', backdropFilter: 'blur(8px)',
            fontFamily: 'system-ui', fontSize: 11, color: '#6B6560',
          }}>
            Click a card to read &middot; Drag to orbit &middot; Scroll to zoom
          </div>
        </div>
      )}
    </div>
  )
}
