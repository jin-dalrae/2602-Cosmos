export interface SceneSettings {
  edgeOpacity: number      // 0–1
  distance: number         // 10–30, actual sphere radius = distance * 5 + 50
  damping: number          // orbit controls damping factor
  overview: number         // 0 = immersive (inside sphere), 1 = bird's eye (above sphere)
  articleScale: number     // 0.5–2, scales the opened article size
}

export const DEFAULT_SETTINGS: SceneSettings = {
  edgeOpacity: 0.08,
  distance: 20,
  damping: 0.05,
  overview: 0,
  articleScale: 1,
}

interface ControlPanelProps {
  settings: SceneSettings
  onChange: (settings: SceneSettings) => void
}

export default function ControlPanel({ settings, onChange }: ControlPanelProps) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: 16, left: 16, zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '10px 16px', borderRadius: 10,
        backgroundColor: 'rgba(38, 34, 32, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3A3530',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11, color: '#9E9589', fontFamily: 'system-ui',
          whiteSpace: 'nowrap', minWidth: 60,
        }}>Distance</span>
        <input
          type="range"
          min={10} max={30} step={1}
          value={settings.distance}
          onChange={(e) => onChange({ ...settings, distance: parseFloat(e.target.value) })}
          style={{
            width: 120, height: 4, appearance: 'none', background: '#3A3530',
            borderRadius: 2, outline: 'none', cursor: 'pointer',
            accentColor: '#D4B872',
          }}
        />
        <span style={{
          fontSize: 11, color: '#D4B872', fontFamily: 'monospace',
          minWidth: 20, textAlign: 'right',
        }}>{settings.distance}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11, color: '#9E9589', fontFamily: 'system-ui',
          whiteSpace: 'nowrap', minWidth: 60,
        }}>Article zoom</span>
        <input
          type="range"
          min={0.5} max={2} step={0.1}
          value={settings.articleScale}
          onChange={(e) => onChange({ ...settings, articleScale: parseFloat(e.target.value) })}
          style={{
            width: 120, height: 4, appearance: 'none', background: '#3A3530',
            borderRadius: 2, outline: 'none', cursor: 'pointer',
            accentColor: '#D4B872',
          }}
        />
        <span style={{
          fontSize: 11, color: '#D4B872', fontFamily: 'monospace',
          minWidth: 20, textAlign: 'right',
        }}>{settings.articleScale.toFixed(1)}</span>
      </div>
    </div>
  )
}
