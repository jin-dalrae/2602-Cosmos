import { useState, useCallback } from 'react'
import { UI_COLORS } from './shared/EmotionPalette'

interface ComposeOverlayProps {
  mode: { type: 'post'; initialContent?: string; initialAuthor?: string; initialTitle?: string } | { type: 'reply'; parentAuthor: string }
  onSubmit: (content: string, author: string, title?: string) => void
  onCancel: () => void
  submitting?: boolean
}

export default function ComposeOverlay({ mode, onSubmit, onCancel, submitting = false }: ComposeOverlayProps) {
  const [author, setAuthor] = useState(
    mode.type === 'post' && mode.initialAuthor ? mode.initialAuthor : 'Anonymous'
  )
  const [postTitle, setPostTitle] = useState(
    mode.type === 'post' && mode.initialTitle ? mode.initialTitle : ''
  )
  const [content, setContent] = useState(
    mode.type === 'post' && mode.initialContent ? mode.initialContent : ''
  )

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || submitting) return
    onSubmit(trimmed, author.trim() || 'Anonymous', postTitle.trim() || undefined)
  }, [content, author, postTitle, onSubmit, submitting])

  const heading = mode.type === 'reply'
    ? `Reply to ${mode.parentAuthor}`
    : 'New Post'

  const canSubmit = content.trim() && !submitting

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: UI_COLORS.overlay,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxHeight: 500,
          overflowY: 'auto',
          backgroundColor: '#2E2A28',
          borderRadius: 16,
          border: '1px solid rgba(245, 242, 239, 0.08)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          padding: '28px 28px 24px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Heading */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: UI_COLORS.textPrimary,
          marginBottom: 20,
          fontFamily: 'Georgia, serif',
        }}>
          {heading}
        </div>

        {/* Title (only for new posts) */}
        {mode.type === 'post' && (
          <>
            <label style={{ fontSize: 12, color: UI_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Title
            </label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="A short headline for your post..."
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(245, 242, 239, 0.1)',
                backgroundColor: '#262220',
                color: UI_COLORS.textPrimary,
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'Georgia, serif',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </>
        )}

        {/* Author */}
        <label style={{ fontSize: 12, color: UI_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Author
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Anonymous"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(245, 242, 239, 0.1)',
            backgroundColor: '#262220',
            color: UI_COLORS.textPrimary,
            fontSize: 15,
            fontFamily: 'system-ui, sans-serif',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Content */}
        <label style={{ fontSize: 12, color: UI_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>
          {mode.type === 'reply' ? 'Your reply' : 'What\'s on your mind?'}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Share your perspective..."
          style={{
            display: 'block',
            width: '100%',
            marginTop: 6,
            marginBottom: 20,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(245, 242, 239, 0.1)',
            backgroundColor: '#262220',
            color: UI_COLORS.textPrimary,
            fontSize: 15,
            fontFamily: 'Georgia, serif',
            lineHeight: 1.6,
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid rgba(245, 242, 239, 0.1)',
              backgroundColor: 'transparent',
              color: UI_COLORS.textSecondary,
              fontSize: 14,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: canSubmit ? '#D4B872' : '#4A4540',
              color: canSubmit ? '#1C1A18' : '#6B6560',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              cursor: canSubmit ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {submitting && (
              <div style={{
                width: 14, height: 14, border: '2px solid #1C1A18',
                borderTopColor: 'transparent', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
            {submitting ? 'Posting...' : mode.type === 'reply' ? 'Reply' : 'Post'}
          </button>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
