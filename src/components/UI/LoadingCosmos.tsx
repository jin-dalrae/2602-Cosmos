import { motion } from 'framer-motion'

interface LoadingCosmosProps {
  stage: string
  percent: number
}

/** Orbital positions for 7 constellation dots */
const DOTS = [
  { radius: 40, speed: 12, size: 4, delay: 0 },
  { radius: 55, speed: 18, size: 3, delay: 0.5 },
  { radius: 35, speed: 15, size: 5, delay: 1.0 },
  { radius: 60, speed: 22, size: 3, delay: 1.5 },
  { radius: 45, speed: 14, size: 4, delay: 2.0 },
  { radius: 50, speed: 20, size: 3, delay: 0.8 },
  { radius: 38, speed: 16, size: 4, delay: 1.3 },
] as const

export default function LoadingCosmos({ stage, percent }: LoadingCosmosProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center w-full h-full"
      style={{ background: 'linear-gradient(180deg, #262220 0%, #1C1A18 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Constellation animation */}
      <div
        className="relative mb-12"
        style={{ width: 140, height: 140 }}
      >
        {/* Center glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#D4B872',
            boxShadow: '0 0 20px rgba(212, 184, 114, 0.5)',
          }}
        />

        {/* Orbiting dots */}
        {DOTS.map((dot, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              top: '50%',
              left: '50%',
              background: i % 2 === 0 ? '#D4B872' : '#F5F2EF',
              boxShadow: `0 0 ${dot.size * 2}px ${i % 2 === 0 ? 'rgba(212, 184, 114, 0.4)' : 'rgba(245, 242, 239, 0.3)'}`,
            }}
            animate={{
              x: [
                Math.cos(0) * dot.radius,
                Math.cos(Math.PI * 0.5) * dot.radius,
                Math.cos(Math.PI) * dot.radius,
                Math.cos(Math.PI * 1.5) * dot.radius,
                Math.cos(Math.PI * 2) * dot.radius,
              ],
              y: [
                Math.sin(0) * dot.radius,
                Math.sin(Math.PI * 0.5) * dot.radius,
                Math.sin(Math.PI) * dot.radius,
                Math.sin(Math.PI * 1.5) * dot.radius,
                Math.sin(Math.PI * 2) * dot.radius,
              ],
              opacity: [0.4, 0.9, 0.4, 0.9, 0.4],
            }}
            transition={{
              duration: dot.speed,
              repeat: Infinity,
              ease: 'linear',
              delay: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Main heading */}
      <motion.h2
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#F5F2EF',
          fontSize: 22,
          fontWeight: 400,
          marginBottom: 32,
          letterSpacing: 1,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        Mapping the discussion...
      </motion.h2>

      {/* Progress bar */}
      <div
        style={{
          width: 280,
          height: 6,
          borderRadius: 3,
          background: '#3A3530',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <motion.div
          style={{
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #D4B872, #E8836B)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(percent, 2)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Stage text */}
      <motion.p
        key={stage}
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#9E9589',
          fontSize: 14,
          textAlign: 'center',
          maxWidth: 300,
          lineHeight: 1.5,
        }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {stage}
      </motion.p>

      {/* Percent indicator */}
      <p
        style={{
          fontFamily: 'system-ui, sans-serif',
          color: '#6B6560',
          fontSize: 12,
          marginTop: 8,
        }}
      >
        {Math.round(percent)}%
      </p>
    </motion.div>
  )
}
