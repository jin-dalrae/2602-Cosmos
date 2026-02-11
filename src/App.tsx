import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useCosmosData from './hooks/useCosmosData'
import CosmosExperience from './components/CosmosExperience'
import LoadingCosmos from './components/UI/LoadingCosmos'

type AppState = 'hero' | 'loading' | 'experience'

// ═══ Feature cards for the hero page ═══
const FEATURES = [
  {
    title: 'Spatial Discussions',
    desc: 'Community posts arranged in 3D space — clustered by topic, colored by emotion, connected by relationships.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <circle cx="4" cy="7" r="1.5" />
        <circle cx="20" cy="7" r="1.5" />
        <circle cx="6" cy="18" r="1.5" />
        <circle cx="18" cy="17" r="1.5" />
        <line x1="6" y1="7" x2="10" y2="11" opacity="0.4" />
        <line x1="18" y1="7" x2="14" y2="11" opacity="0.4" />
        <line x1="7" y1="17" x2="10" y2="13" opacity="0.4" />
        <line x1="17" y1="16" x2="14" y2="13" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: 'AI-Powered Analysis',
    desc: 'Every post is analyzed for stance, emotion, hidden assumptions, and logical structure by Claude.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8FB8A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h3a3 3 0 0 1 3 3v1" />
        <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.4V11H7a3 3 0 0 0-3 3v1" />
        <circle cx="4" cy="17" r="2" />
        <circle cx="20" cy="17" r="2" />
        <circle cx="12" cy="20" r="2" />
        <line x1="12" y1="11" x2="12" y2="18" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: 'Community Clusters',
    desc: 'Discover natural groups — who agrees, who disagrees, and the bridge-builders in between.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C47A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="8" r="4" opacity="0.3" fill="#C47A5A" />
        <circle cx="17" cy="8" r="4" opacity="0.3" fill="#8FB8A0" />
        <circle cx="12" cy="17" r="4" opacity="0.3" fill="#D4B872" />
        <circle cx="7" cy="8" r="1" fill="#C47A5A" />
        <circle cx="17" cy="8" r="1" fill="#8FB8A0" />
        <circle cx="12" cy="17" r="1" fill="#D4B872" />
      </svg>
    ),
  },
  {
    title: 'Hidden Assumptions',
    desc: 'See what people assume but never say. Every argument rests on beliefs — COSMOS makes them visible.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9B8FB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="5" x2="12" y2="3" strokeDasharray="2 2" />
        <line x1="18" y1="7" x2="19.5" y2="5.5" strokeDasharray="2 2" />
        <line x1="6" y1="7" x2="4.5" y2="5.5" strokeDasharray="2 2" />
      </svg>
    ),
  },
]

export default function App() {
  const [appState, setAppState] = useState<AppState>('hero')
  const { layout, isLoading, isRefining, progress, error, processTopic } =
    useCosmosData()

  const handleEnter = useCallback(() => {
    setAppState('loading')
    processTopic('SF Richmond')
  }, [processTopic])

  const handleBack = useCallback(() => {
    setAppState('hero')
  }, [])

  // Transition to experience when layout arrives
  if (appState === 'loading' && layout && !isLoading) {
    setAppState('experience')
  }

  return (
    <div className="w-full h-full relative" style={{ overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {/* ═══ Hero / Feature Landing ═══ */}
        {appState === 'hero' && (
          <motion.div
            key="hero"
            className="w-full h-full overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, #1C1A18 0%, #262220 40%, #1C1A18 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero section */}
            <div
              className="flex flex-col items-center justify-center px-6"
              style={{ minHeight: '85vh', position: 'relative' }}
            >
              {/* Subtle radial glow behind title */}
              <div
                style={{
                  position: 'absolute',
                  top: '30%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 500,
                  height: 500,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212, 184, 114, 0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
              >
                <h1
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 72,
                    fontWeight: 400,
                    color: '#F5F2EF',
                    letterSpacing: 12,
                    marginBottom: 16,
                    lineHeight: 1,
                  }}
                >
                  COSMOS
                </h1>
                <p
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 20,
                    color: '#9E9589',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Your community, as a constellation
                </p>
                <p
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 14,
                    color: '#6B6560',
                    maxWidth: 480,
                    margin: '0 auto',
                    lineHeight: 1.6,
                    marginBottom: 48,
                  }}
                >
                  See every voice, every argument, every hidden assumption — arranged in space
                  so you can finally see the shape of a conversation.
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                onClick={handleEnter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{
                  padding: '16px 52px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #D4B872, #C47A5A)',
                  color: '#1C1A18',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: 2,
                  position: 'relative',
                  zIndex: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 8px 40px rgba(212, 184, 114, 0.3)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                ENTER COSMOS
              </motion.button>

              {/* Scroll hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                style={{
                  position: 'absolute',
                  bottom: 32,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 11,
                      color: '#6B6560',
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                    }}
                  >
                    Learn more
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>

            {/* Features section */}
            <div
              className="flex flex-col items-center px-6"
              style={{ paddingBottom: 80 }}
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 11,
                  color: '#D4B872',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  marginBottom: 32,
                }}
              >
                How it works
              </motion.p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 24,
                  maxWidth: 960,
                  width: '100%',
                }}
              >
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    style={{
                      padding: 28,
                      borderRadius: 14,
                      border: '1px solid #3A3530',
                      background: 'rgba(38, 34, 32, 0.5)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                    <h3
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#F5F2EF',
                        marginBottom: 8,
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: 13,
                        color: '#9E9589',
                        lineHeight: 1.6,
                      }}
                    >
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Bottom CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
                style={{ marginTop: 64 }}
              >
                <p
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 24,
                    color: '#F5F2EF',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Ready to see your community differently?
                </p>
                <p
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 14,
                    color: '#6B6560',
                    marginBottom: 32,
                    textAlign: 'center',
                  }}
                >
                  Explore community discussions about SF Richmond
                </p>
                <button
                  onClick={handleEnter}
                  style={{
                    padding: '14px 44px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #D4B872, #C47A5A)',
                    color: '#1C1A18',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: 1.5,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.04)'
                    e.currentTarget.style.boxShadow = '0 8px 40px rgba(212, 184, 114, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  ENTER COSMOS
                </button>

                {/* Powered by line */}
                <p
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 11,
                    color: '#4A4540',
                    marginTop: 24,
                    letterSpacing: 0.5,
                  }}
                >
                  Powered by Claude &middot; Built at Anthropic Hackathon 2025
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

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
                <button
                  onClick={handleBack}
                  style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #3A3530', background: 'transparent', color: '#F5F2EF', fontFamily: 'Georgia, serif', fontSize: 14, cursor: 'pointer' }}
                >
                  Go back
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ 3D Experience ═══ */}
        {appState === 'experience' && layout && (
          <motion.div
            key="experience"
            className="w-full h-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CosmosExperience layout={layout} isRefining={isRefining} />

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
