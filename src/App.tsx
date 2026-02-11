import { useState, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCosmosData from './hooks/useCosmosData'
import CosmosExperience from './components/CosmosExperience'
import ArticleListPage from './components/ListView/ArticleListPage'
import LoadingCosmos from './components/UI/LoadingCosmos'

type AppState = 'loading' | 'experience'

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const { layout, isLoading, isRefining, progress, error, processTopic } =
    useCosmosData()

  // Start processing immediately on mount
  const started = useRef(false)
  if (!started.current) {
    started.current = true
    setTimeout(() => processTopic('SF Richmond'), 0)
  }

  // Transition to experience when layout arrives
  if (appState === 'loading' && layout && !isLoading) {
    setAppState('experience')
  }

  return (
    <BrowserRouter>
      <div className="w-full h-full relative" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {/* ═══ Loading ═══ */}
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

              {error && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'rgba(28, 26, 24, 0.9)', zIndex: 10 }}
                >
                  <p style={{ fontFamily: 'Georgia, serif', color: '#C47A5A', fontSize: 16, marginBottom: 8 }}>
                    Something went wrong
                  </p>
                  <p style={{ fontFamily: 'system-ui', color: '#9E9589', fontSize: 13, maxWidth: 320, textAlign: 'center', lineHeight: 1.5, marginBottom: 24 }}>
                    {error}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ Experience (routed) ═══ */}
          {appState === 'experience' && layout && (
            <motion.div
              key="experience"
              className="w-full h-full relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Routes>
                <Route path="/" element={<CosmosExperience layout={layout} isRefining={isRefining} />} />
                <Route path="/list" element={<ArticleListPage layout={layout} />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  )
}
