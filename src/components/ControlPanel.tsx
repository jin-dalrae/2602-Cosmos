import { useState } from 'react'

export interface SceneSettings {
  spreadScale: number   // multiplier for post positions
  edgeOpacity: number   // 0–1
  fov: number           // camera field of view
  damping: number       // orbit controls damping factor
  cameraDistance: number // initial Z distance
  nearbyCount: number   // how many nearby cards to show
}

export const DEFAULT_SETTINGS: SceneSettings = {
  spreadScale: 10,
  edgeOpacity: 0.08,
  fov: 10,
  damping: 0.05,
  cameraDistance: 10,
  nearbyCount: 15,
}

interface ControlPanelProps {
  settings: SceneSettings
  onChange: (settings: SceneSettings) => void
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 11, color: '#9E9589', fontFamily: 'system-ui' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#D4B872', fontFamily: 'monospace', minWidth: 36, textAlign: 'right' }}>
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%', height: 4, appearance: 'none', background: '#3A3530',
          borderRadius: 2, outline: 'none', cursor: 'pointer',
          accentColor: '#D4B872',
        }}
      />
    </div>
  )
}

export default function ControlPanel({ settings, onChange }: ControlPanelProps) {
  const [open, setOpen] = useState(false)

  const update = (key: keyof SceneSettings, value: number) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, zIndex: 30,
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          border: '1px solid #3A3530',
          backgroundColor: open ? 'rgba(38, 34, 32, 0.95)' : 'rgba(38, 34, 32, 0.85)',
          backdropFilter: 'blur(8px)',
          color: '#9E9589', fontSize: 12, fontFamily: 'system-ui',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Controls
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          marginTop: 8, padding: 16, borderRadius: 12, width: 220,
          backgroundColor: 'rgba(38, 34, 32, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #3A3530',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            fontSize: 10, fontFamily: 'system-ui', color: '#6B6560',
            textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
          }}>Scene Controls</div>

          <Slider
            label="Camera Distance"
            value={settings.fov}
            min={5} max={20} step={1}
            onChange={(v) => update('fov', v)}
          />
          <Slider
            label="Field of View"
            value={settings.cameraDistance}
            min={5} max={20} step={1}
            onChange={(v) => update('cameraDistance', v)}
          />
          <Slider
            label="Damping"
            value={settings.damping}
            min={0} max={0.2} step={0.01}
            onChange={(v) => update('damping', v)}
          />
          {/* Reset */}
          <button
            onClick={() => onChange(DEFAULT_SETTINGS)}
            style={{
              marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 6,
              border: '1px solid #3A3530', backgroundColor: 'transparent',
              color: '#6B6560', fontSize: 11, fontFamily: 'system-ui',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#D4B872' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6560' }}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
}
