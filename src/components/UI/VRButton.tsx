import { useEffect, useState } from 'react'
import { xrStore } from '../../lib/xrStore'

type Support = 'unknown' | 'supported' | 'unsupported'

export default function VRButton() {
  const [support, setSupport] = useState<Support>('unknown')
  const [inSession, setInSession] = useState(false)

  useEffect(() => {
    let cancelled = false
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr
    if (!xr?.isSessionSupported) {
      setSupport('unsupported')
      return
    }
    xr.isSessionSupported('immersive-vr').then((ok) => {
      if (!cancelled) setSupport(ok ? 'supported' : 'unsupported')
    }).catch(() => {
      if (!cancelled) setSupport('unsupported')
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return xrStore.subscribe((state) => {
      setInSession(state.session != null)
    })
  }, [])

  if (support !== 'supported') return null

  const handleClick = () => {
    if (inSession) {
      xrStore.getState().session?.end()
    } else {
      xrStore.enterXR('immersive-vr')
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 16px', borderRadius: 12,
        border: inSession ? '1px solid #C19BE0' : '1px solid #3A3530',
        backgroundColor: inSession ? 'rgba(193, 155, 224, 0.15)' : 'rgba(38, 34, 32, 0.85)',
        backdropFilter: 'blur(8px)',
        color: inSession ? '#C19BE0' : '#9E9589',
        fontSize: 13, fontWeight: 500,
        fontFamily: 'system-ui, sans-serif',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s',
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="10" rx="2" />
        <circle cx="8" cy="12" r="1.5" />
        <circle cx="16" cy="12" r="1.5" />
      </svg>
      {inSession ? 'Exit VR' : 'VR'}
    </button>
  )
}
