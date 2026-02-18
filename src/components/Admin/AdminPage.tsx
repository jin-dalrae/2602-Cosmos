import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import HealthPanel from './HealthPanel'
import StatsPanel from './StatsPanel'
import LayoutsPanel from './LayoutsPanel'
import CachePanel from './CachePanel'
import GeneratePanel from './GeneratePanel'

const TABS = ['Layouts', 'Cache', 'Generate', 'Health', 'Stats'] as const
type Tab = (typeof TABS)[number]

const S = {
  bg: '#262220',
  text: '#F5F2EF',
  textMuted: '#9E9589',
  gold: '#D4B872',
  cardBg: 'rgba(245, 242, 239, 0.06)',
  border: 'rgba(245, 242, 239, 0.08)',
}

const ADMIN_PIN = '9809'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Layouts')
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('cosmos_admin') === 'true')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const navigate = useNavigate()

  // Override overflow for scrolling
  useEffect(() => {
    const root = document.getElementById('root')
    const html = document.documentElement
    const body = document.body

    html.style.overflow = 'auto'
    html.style.height = 'auto'
    body.style.overflow = 'auto'
    body.style.height = 'auto'
    body.style.background = S.bg
    if (root) {
      root.style.overflow = 'auto'
      root.style.height = 'auto'
    }

    return () => {
      html.style.overflow = 'hidden'
      html.style.height = '100%'
      body.style.overflow = 'hidden'
      body.style.height = '100%'
      body.style.background = ''
      if (root) {
        root.style.overflow = 'hidden'
        root.style.height = '100%'
      }
    }
  }, [])

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: S.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pin === ADMIN_PIN) {
              sessionStorage.setItem('cosmos_admin', 'true')
              setAuthenticated(true)
            } else {
              setPinError(true)
              setPin('')
              setTimeout(() => setPinError(false), 1500)
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            color: S.text,
            margin: 0,
          }}>
            COSMOS Admin
          </h2>
          <p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
            Enter PIN to continue
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            style={{
              width: 160,
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${pinError ? '#C47A5A' : S.border}`,
              backgroundColor: S.cardBg,
              color: S.text,
              fontSize: 18,
              textAlign: 'center',
              letterSpacing: 6,
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          {pinError && (
            <p style={{ fontSize: 12, color: '#C47A5A', margin: 0 }}>
              Incorrect PIN
            </p>
          )}
          <button
            type="submit"
            style={{
              padding: '10px 32px',
              borderRadius: 10,
              border: `1px solid rgba(212, 184, 114, 0.25)`,
              backgroundColor: 'rgba(212, 184, 114, 0.12)',
              color: S.gold,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: S.bg,
      color: S.text,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 24px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 28,
              fontWeight: 400,
              color: S.text,
              margin: 0,
            }}>
              COSMOS Admin
            </h1>
            <p style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>
              Manage layouts, cache, and monitor system health
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              backgroundColor: 'transparent',
              color: S.textMuted,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = S.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = S.textMuted)}
          >
            Back to COSMOS
          </button>
        </div>

        {/* Tab nav */}
        <div style={{
          display: 'flex',
          gap: 4,
          borderBottom: `1px solid ${S.border}`,
          paddingBottom: 0,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? S.gold : S.textMuted,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${S.gold}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'system-ui, sans-serif',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 64px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Layouts' && <LayoutsPanel />}
            {activeTab === 'Cache' && <CachePanel />}
            {activeTab === 'Generate' && <GeneratePanel />}
            {activeTab === 'Health' && <HealthPanel />}
            {activeTab === 'Stats' && <StatsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
