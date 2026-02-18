import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { CosmosLayout, CosmosPost } from '../../lib/types'
import { API_BASE } from '../../lib/api'
import ArticleList from './ArticleList'
import ComposeOverlay from '../ComposeOverlay'

interface ArticleListPageProps {
  layout: CosmosLayout
}

export default function ArticleListPage({ layout }: ArticleListPageProps) {
  const [posts, setPosts] = useState<CosmosPost[]>(() => [...layout.posts])
  const [votes, setVotes] = useState<Map<string, 'up' | 'down'>>(() => new Map())
  const [composing, setComposing] = useState<{ parentId: string } | null>(null)

  const postMap = useMemo(() => {
    const map = new Map<string, CosmosPost>()
    for (const p of posts) map.set(p.id, p)
    return map
  }, [posts])

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

  const handleReply = useCallback((postId: string) => {
    setComposing({ parentId: postId })
  }, [])

  const handleSubmitReply = useCallback((content: string, author: string) => {
    if (!composing) return
    const parent = postMap.get(composing.parentId)
    const parentPos = parent?.position ?? [0, 0, 0]

    const newReply: CosmosPost = {
      id: `user_${Date.now()}`,
      content,
      author,
      parent_id: composing.parentId,
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
      position: [
        parentPos[0] + (Math.random() - 0.5) * 0.3,
        parentPos[1] - 0.3,
        parentPos[2] + (Math.random() - 0.5) * 0.3,
      ],
      isUserPost: true,
      created_at: new Date().toISOString(),
    }

    setPosts((prev) => [...prev, newReply])
    setComposing(null)

    // Persist to DB (fire-and-forget)
    fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: newReply, topic: layout.topic }),
    }).catch(() => { /* best-effort */ })
  }, [composing, postMap, layout.topic])

  return (
    <div className="relative w-full h-full" style={{ background: '#262220' }}>
      {/* Back to map nav */}
      <Link
        to="/"
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          border: '1px solid #3A3530',
          backgroundColor: 'rgba(38, 34, 32, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#9E9589', fontSize: 12,
          fontFamily: 'system-ui, sans-serif',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Map View
      </Link>

      <ArticleList
        posts={posts}
        votes={votes}
        onVote={handleVote}
        onReply={handleReply}
      />

      {composing && (
        <ComposeOverlay
          mode={{ type: 'reply', parentAuthor: postMap.get(composing.parentId)?.author ?? 'Unknown' }}
          onSubmit={handleSubmitReply}
          onCancel={() => setComposing(null)}
        />
      )}
    </div>
  )
}
