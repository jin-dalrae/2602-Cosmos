import { motion } from 'framer-motion'

interface CameraConsentProps {
  onAccept: () => void
  onDecline: () => void
}

const BULLETS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      </svg>
    ),
    title: 'Eye tracking',
    desc: 'Follows where your eyes go on the screen',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c0-4 3.5-7 7-7s7 3 7 7" />
      </svg>
    ),
    title: 'Face gestures',
    desc: 'Reads nods, shakes, and expressions',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FB8A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M10 10v9" />
      </svg>
    ),
    title: 'Fully local',
    desc: 'All processing runs in your browser',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FB8A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Nothing leaves',
    desc: 'No video is recorded or sent anywhere',
  },
] as const

export default function CameraConsent({ onAccept, onDecline }: CameraConsentProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20, 18, 16, 0.88)', backdropFilter: 'blur(8px)' }}
        onClick={onDecline}
      />

      {/* Modal card */}
      <motion.div
        className="relative z-10 w-full max-w-[420px] mx-5"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundColor: '#2A2622',
          borderRadius: 20,
          border: '1px solid rgba(212, 184, 114, 0.12)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
        }}
      >
        {/* Top accent */}
        <div
          style={{
            width: 40, height: 3, borderRadius: 2,
            background: 'linear-gradient(90deg, #D4B872, #8FB8A0)',
            margin: '20px auto 0',
            opacity: 0.6,
          }}
        />

        <div style={{ padding: '28px 32px 32px' }}>
          {/* Eye icon hero */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 24px',
              background: 'rgba(212, 184, 114, 0.08)',
              border: '1px solid rgba(212, 184, 114, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
            </svg>
          </motion.div>

          {/* Title */}
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 22,
              fontWeight: 400,
              color: '#F5F2EF',
              lineHeight: 1.35,
              textAlign: 'center',
              margin: '0 0 8px',
            }}
          >
            Let Cosmos read your gaze
          </h2>
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 14,
              color: '#9E9589',
              lineHeight: 1.5,
              textAlign: 'center',
              margin: '0 0 32px',
            }}
          >
            Your camera helps the sphere respond to what catches your eye
          </p>

          {/* Feature grid — 2×2 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            marginBottom: 32,
          }}>
            {BULLETS.map((bullet, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
                style={{
                  padding: '16px 14px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  {bullet.icon}
                </div>
                <div style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 13, fontWeight: 600,
                  color: '#E8E2D9',
                  marginBottom: 4,
                }}>
                  {bullet.title}
                </div>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12, lineHeight: 1.5,
                  color: '#7A7068',
                }}>
                  {bullet.desc}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <motion.button
              onClick={onAccept}
              style={{
                width: '100%', padding: '14px 0',
                borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #D4B872 0%, #C4A862 100%)',
                color: '#1C1A18',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: 0.3,
              }}
              whileHover={{ scale: 1.015, boxShadow: '0 4px 20px rgba(212, 184, 114, 0.25)' }}
              whileTap={{ scale: 0.97 }}
            >
              Enable Camera
            </motion.button>

            <motion.button
              onClick={onDecline}
              style={{
                width: '100%', padding: '12px 0',
                borderRadius: 14,
                backgroundColor: 'transparent',
                color: '#7A7068',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 13, fontWeight: 400,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
              }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#9E9589' }}
              whileTap={{ scale: 0.97 }}
            >
              Continue without camera
            </motion.button>
          </div>

          {/* Privacy note */}
          <p
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 11,
              color: '#5A5550',
              lineHeight: 1.4,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            You can turn this off anytime with the Gaze button
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
