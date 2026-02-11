import type { Emotion, RelationshipType } from '../../lib/types'

// ═══ Emotion → Card Colors ═══

export interface EmotionColors {
  cardBg: string
  accent: string
  text: string
}

export const EMOTION_PALETTE: Record<Emotion, EmotionColors> = {
  passionate:  { cardBg: '#FFF5F0', accent: '#E8836B', text: '#5A2A1A' },
  analytical:  { cardBg: '#F0F7F3', accent: '#8FB8A0', text: '#1A3A28' },
  frustrated:  { cardBg: '#FDF2EC', accent: '#C47A5A', text: '#4A2A1A' },
  hopeful:     { cardBg: '#FDFAF0', accent: '#D4B872', text: '#3A3018' },
  fearful:     { cardBg: '#F5F2FA', accent: '#9B8FB8', text: '#2A2440' },
  sarcastic:   { cardBg: '#F5F5EE', accent: '#A3A07E', text: '#3A3A28' },
  neutral:     { cardBg: '#F5F2EF', accent: '#B8B0A8', text: '#3A3530' },
  aggressive:  { cardBg: '#FAF0ED', accent: '#A85A4A', text: '#3A1A12' },
  empathetic:  { cardBg: '#FAF2F2', accent: '#D4A0A0', text: '#3A2020' },
}

// ═══ Edge / Relationship Colors ═══

export const EDGE_COLORS: Record<RelationshipType, string> = {
  agrees:      '#8FB8A0', // sage
  disagrees:   '#C47A5A', // terracotta
  builds_upon: '#D4B872', // gold
  tangent:     '#9E9589', // warm gray
  rebuts:      '#A85A4A', // deep terracotta
}

// ═══ Background ═══

export const BG_DARK = '#262220'       // warm dark walnut
export const BG_DARKER = '#1C1A18'     // deeper walnut
export const BG_GRADIENT = `linear-gradient(180deg, ${BG_DARK} 0%, ${BG_DARKER} 100%)`

// ═══ Cluster Label Colors (muted, warm) ═══

export const CLUSTER_COLORS = [
  '#D4B872', // gold
  '#8FB8A0', // sage
  '#C47A5A', // terracotta
  '#9B8FB8', // lavender
  '#E8836B', // coral
  '#A3A07E', // olive
  '#D4A0A0', // rose
]

// ═══ UI Colors ═══

export const UI_COLORS = {
  textPrimary: '#F5F2EF',
  textSecondary: '#9E9589',
  textMuted: '#6B6560',
  cardShadow: 'rgba(28, 26, 24, 0.4)',
  glowWarm: 'rgba(232, 131, 107, 0.3)',
  glowCool: 'rgba(143, 184, 160, 0.3)',
  overlay: 'rgba(38, 34, 32, 0.85)',
}

// ═══ Gaze Zone Feedback Colors ═══

export const GAZE_ZONE_COLORS = {
  agree: 'rgba(212, 184, 114, 0.4)',    // warm gold glow
  disagree: 'rgba(196, 122, 90, 0.4)',  // terracotta glow
  deeper: 'rgba(143, 184, 160, 0.4)',   // sage glow
  flip: 'rgba(155, 143, 184, 0.4)',     // lavender glow
  read: 'transparent',
  wander: 'transparent',
}

// ═══ Helper ═══

export function getEmotionColors(emotion: Emotion): EmotionColors {
  return EMOTION_PALETTE[emotion] ?? EMOTION_PALETTE.neutral
}

export function getEdgeColor(type: RelationshipType): string {
  return EDGE_COLORS[type] ?? EDGE_COLORS.tangent
}
