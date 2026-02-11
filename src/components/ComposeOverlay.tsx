import { useState, useCallback } from 'react'
import { UI_COLORS } from './shared/EmotionPalette'

interface ComposeOverlayProps {
  mode: { type: 'post' } | { type: 'reply'; parentAuthor: string }
  onSubmit: (content: string, author: string) => void
  onCancel: () => void
}

export default function ComposeOverlay({ mode, onSubmit, onCancel }: ComposeOverlayProps) {
  const [author, setAuthor] = useState('Anonymous')
  const [content, setContent] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed, author.trim() || 'Anonymous')
  }, [content, author, onSubmit])

  const title = mode.type === 'reply'
    ? `Reply to ${mode.parentAuthor}`
    : 'New Post'

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
          width: 420,
          backgroundColor: '#2E2A28',
          borderRadius: 16,
          border: '1px solid rgba(245, 242, 239, 0.08)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          padding: '28px 28px 24px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Title */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: UI_COLORS.textPrimary,
          marginBottom: 20,
          fontFamily: 'Georgia, serif',
        }}>
          {title}
        </div>

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
            disabled={!content.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: content.trim() ? '#D4B872' : '#4A4540',
              color: content.trim() ? '#1C1A18' : '#6B6560',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              cursor: content.trim() ? 'pointer' : 'default',
            }}
          >
            {mode.type === 'reply' ? 'Reply' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
