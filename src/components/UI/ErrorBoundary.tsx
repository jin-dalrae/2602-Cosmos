import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100vh',
            background: 'linear-gradient(180deg, #262220 0%, #1C1A18 100%)',
            padding: 24,
          }}
        >
          {/* Decorative star / dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#D4B872',
              boxShadow: '0 0 20px rgba(212, 184, 114, 0.4)',
              marginBottom: 32,
            }}
          />

          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 24,
              fontWeight: 400,
              color: '#F5F2EF',
              letterSpacing: 1,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Something went awry in the cosmos
          </h1>

          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 14,
              color: '#9E9589',
              lineHeight: 1.6,
              textAlign: 'center',
              maxWidth: 360,
              marginBottom: 32,
            }}
          >
            A rendering error occurred. This is usually temporary — reloading should bring everything back.
          </p>

          {/* Error details (collapsed) */}
          {this.state.error && (
            <details
              style={{
                marginBottom: 28,
                maxWidth: 420,
                width: '100%',
              }}
            >
              <summary
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 11,
                  color: '#6B6560',
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                  textAlign: 'center',
                  listStyle: 'none',
                }}
              >
                View details
              </summary>
              <pre
                style={{
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  fontSize: 11,
                  color: '#C47A5A',
                  backgroundColor: 'rgba(196, 122, 90, 0.08)',
                  border: '1px solid rgba(196, 122, 90, 0.15)',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  overflow: 'auto',
                  maxHeight: 160,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 32px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #D4B872, #C47A5A)',
              color: '#1C1A18',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.25s',
              letterSpacing: 0.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 184, 114, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
