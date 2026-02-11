import { motion } from 'framer-motion'

interface CameraConsentProps {
  onAccept: () => void
  onDecline: () => void
}

const BULLETS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      </svg>
    ),
    text: 'Tracks where your eyes go on the screen',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c0-4 3.5-7 7-7s7 3 7 7" />
      </svg>
    ),
    text: 'Detects head nods, shakes, and expressions',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M10 10v9" />
      </svg>
    ),
    text: 'All processing happens in your browser',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4B872" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    text: 'No video is recorded or sent anywhere',
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
        style={{ backgroundColor: 'rgba(28, 26, 24, 0.92)' }}
      />

      {/* Modal card */}
      <motion.div
        className="relative z-10 w-full max-w-[380px] mx-4"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          backgroundColor: '#2E2A27',
          borderRadius: 16,
          border: '1px solid rgba(212, 184, 114, 0.15)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Top accent line */}
        <div
          className="w-12 h-0.5 mx-auto mt-5"
          style={{ backgroundColor: 'rgba(212, 184, 114, 0.4)', borderRadius: 1 }}
        />

        <div className="px-6 pt-5 pb-6">
          {/* Title */}
          <h2
            className="text-center mb-1"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 20,
              fontWeight: 400,
              color: '#F5F2EF',
              lineHeight: 1.4,
            }}
          >
            Cosmos reads your reactions to ideas
          </h2>
          <p
            className="text-center mb-6"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 13,
              color: '#9E9589',
              lineHeight: 1.5,
            }}
          >
            Your camera helps us understand what resonates
          </p>

          {/* Bullet points */}
          <div className="flex flex-col gap-3.5 mb-7">
            {BULLETS.map((bullet, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(212, 184, 114, 0.08)' }}
                >
                  {bullet.icon}
                </div>
                <p
                  className="pt-1"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 14,
                    color: '#D1CCC7',
                    lineHeight: 1.5,
                  }}
                >
                  {bullet.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5">
            <motion.button
              onClick={onAccept}
              className="w-full py-3 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #D4B872 0%, #C4A862 100%)',
                color: '#1C1A18',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: 0.3,
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Enable Camera
            </motion.button>

            <motion.button
              onClick={onDecline}
              className="w-full py-3 rounded-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#9E9589',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 14,
                fontWeight: 400,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
              }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              whileTap={{ scale: 0.98 }}
            >
              Continue without camera
            </motion.button>
          </div>

          {/* Privacy note */}
          <p
            className="text-center mt-4"
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 11,
              color: '#6B6560',
              lineHeight: 1.4,
            }}
          >
            You can disable this anytime from the settings
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
