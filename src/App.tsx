import { useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useCosmosData from './hooks/useCosmosData'
import CosmosExperience from './components/CosmosExperience'
import ArticleListPage from './components/ListView/ArticleListPage'
import LandingPage from './components/LandingPage'
import LoadingCosmos from './components/UI/LoadingCosmos'

type AppState = 'loading' | 'experience'

function CosmosApp() {
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
    <div className="w-full h-full relative" style={{ overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
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
  )
}

function AppRoutes() {
  const location = useLocation()

  if (location.pathname === '/landing') {
    return <LandingPage />
  }

  return <CosmosApp />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
