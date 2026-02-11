import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useCosmosData from './hooks/useCosmosData'
import CosmosExperience from './components/CosmosExperience'
import LoadingCosmos from './components/UI/LoadingCosmos'

type AppState = 'landing' | 'loading' | 'experience'

const SAMPLE_LINKS = [
  {
    label: 'Is remote work better for productivity?',
    url: 'https://www.reddit.com/r/technology/comments/1example1/is_remote_work_better_for_productivity/',
  },
  {
    label: 'The future of AI in education',
    url: 'https://www.reddit.com/r/artificial/comments/1example2/the_future_of_ai_in_education/',
  },
  {
    label: 'Should cities ban cars from downtown?',
    url: 'https://www.reddit.com/r/urbanplanning/comments/1example3/should_cities_ban_cars_from_downtown/',
  },
]

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [urlInput, setUrlInput] = useState('')
  const { layout, isLoading, progress, error, processUrl } = useCosmosData()

  const handleExplore = useCallback(
    (url: string) => {
      if (!url.trim()) return
      setAppState('loading')
      processUrl(url.trim())
    },
    [processUrl],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleExplore(urlInput)
    },
    [urlInput, handleExplore],
  )

  const handleBack = useCallback(() => {
    setAppState('landing')
    setUrlInput('')
  }, [])

  // Transition to experience when layout arrives
  if (appState === 'loading' && layout && !isLoading) {
    setAppState('experience')
  }

  // If an error occurs during loading, allow going back
  if (appState === 'loading' && error && !isLoading) {
    // Stay on loading screen but show the error
  }

  return (
    <div className="w-full h-full relative" style={{ overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {/* ═══ Landing State ═══ */}
        {appState === 'landing' && (
          <motion.div
            key="landing"
            className="flex flex-col items-center justify-center w-full h-full px-6"
            style={{
              background: 'linear-gradient(180deg, #262220 0%, #1C1A18 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title */}
            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 48,
                fontWeight: 400,
                color: '#F5F2EF',
                letterSpacing: 6,
                marginBottom: 12,
              }}
            >
              COSMOS
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 16,
                color: '#9E9589',
                marginBottom: 48,
                letterSpacing: 0.5,
              }}
            >
              Explore discussions as constellations
            </p>

            {/* URL input form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center w-full"
              style={{ maxWidth: 440 }}
            >
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a Reddit discussion URL..."
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: '1.5px solid #3A3530',
                  background: '#262220',
                  color: '#F5F2EF',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: 16,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D4B872'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#3A3530'
                }}
              />

              <button
                type="submit"
                disabled={!urlInput.trim()}
                style={{
                  padding: '12px 40px',
                  borderRadius: 10,
                  border: 'none',
                  background: urlInput.trim()
                    ? 'linear-gradient(135deg, #D4B872, #C47A5A)'
                    : '#3A3530',
                  color: urlInput.trim() ? '#1C1A18' : '#6B6560',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: urlInput.trim() ? 'pointer' : 'default',
                  transition: 'all 0.25s',
                  letterSpacing: 1,
                }}
                onMouseEnter={(e) => {
                  if (urlInput.trim()) {
                    e.currentTarget.style.transform = 'scale(1.03)'
                    e.currentTarget.style.boxShadow =
                      '0 4px 20px rgba(212, 184, 114, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Explore
              </button>
            </form>

            {/* Sample links */}
            <div
              className="flex flex-col items-center"
              style={{ marginTop: 48, gap: 12 }}
            >
              <p
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 12,
                  color: '#6B6560',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Or try a sample
              </p>
              {SAMPLE_LINKS.map((link) => (
                <button
                  key={link.url}
                  onClick={() => {
                    setUrlInput(link.url)
                    handleExplore(link.url)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #3A3530',
                    background: 'transparent',
                    color: '#9E9589',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    maxWidth: 360,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#D4B872'
                    e.currentTarget.style.color = '#D4B872'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#3A3530'
                    e.currentTarget.style.color = '#9E9589'
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ Loading State ═══ */}
        {appState === 'loading' && (
          <motion.div
            key="loading"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingCosmos stage={progress.stage} percent={progress.percent} />

            {/* Error overlay */}
            {error && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{
                  background: 'rgba(28, 26, 24, 0.9)',
                  zIndex: 10,
                }}
              >
                <p
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    color: '#C47A5A',
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                >
                  Something went wrong
                </p>
                <p
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    color: '#9E9589',
                    fontSize: 13,
                    maxWidth: 320,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    marginBottom: 24,
                  }}
                >
                  {error}
                </p>
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: '1px solid #3A3530',
                    background: 'transparent',
                    color: '#F5F2EF',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#D4B872'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#3A3530'
                  }}
                >
                  Go back
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ Experience State ═══ */}
        {appState === 'experience' && layout && (
          <motion.div
            key="experience"
            className="w-full h-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CosmosExperience layout={layout} />

            {/* Back button */}
            <button
              onClick={handleBack}
              className="absolute"
              style={{
                top: 16,
                left: 16,
                zIndex: 100,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #3A3530',
                background: 'rgba(38, 34, 32, 0.85)',
                color: '#9E9589',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D4B872'
                e.currentTarget.style.color = '#F5F2EF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3A3530'
                e.currentTarget.style.color = '#9E9589'
              }}
            >
              &larr; Back
            </button>

            {/* Topic label */}
            <div
              className="absolute"
              style={{
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 14,
                color: '#9E9589',
                letterSpacing: 0.5,
                textAlign: 'center',
                maxWidth: 300,
                pointerEvents: 'none',
              }}
            >
              {layout.topic}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
