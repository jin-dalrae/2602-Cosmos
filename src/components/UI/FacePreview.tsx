import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FacePreviewProps {
  videoStream: MediaStream | null
  visible: boolean
  onToggle: () => void
}

export default function FacePreview({ videoStream, visible, onToggle }: FacePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamReady, setStreamReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoStream) {
      setStreamReady(false)
      return
    }
    video.srcObject = videoStream
    video.play().then(() => setStreamReady(true)).catch(() => setStreamReady(false))
    return () => {
      video.srcObject = null
      setStreamReady(false)
    }
  }, [videoStream])

  if (!videoStream) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 16,
      zIndex: 99998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 6,
      pointerEvents: 'auto',
    }}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #3A3530',
          backgroundColor: 'rgba(38, 34, 32, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#9E9589',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {visible ? 'Hide Face' : 'Show Face'}
      </button>

      {/* Video preview */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: 320,
              height: 240,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #3A3530',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              position: 'relative',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                opacity: streamReady ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            />
            {!streamReady && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(30, 25, 20, 0.9)',
                color: '#6B6560', fontSize: 11, fontFamily: 'system-ui',
              }}>
                Loading...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
