// ═══ Raw Reddit Data ═══

export interface RawPost {
  id: string
  content: string
  author: string
  parent_id: string | null
  depth: number
  upvotes: number
}

// ═══ Enriched Post (after Cartographer) ═══

export type Emotion =
  | 'passionate'
  | 'analytical'
  | 'frustrated'
  | 'hopeful'
  | 'fearful'
  | 'sarcastic'
  | 'neutral'
  | 'aggressive'
  | 'empathetic'

export type PostType =
  | 'argument'
  | 'evidence'
  | 'question'
  | 'anecdote'
  | 'meta'
  | 'rebuttal'

export type RelationshipType =
  | 'agrees'
  | 'disagrees'
  | 'builds_upon'
  | 'tangent'
  | 'rebuts'

export interface Relationship {
  target_id: string
  type: RelationshipType
  strength: number
  reason: string
}

export interface LogicalChain {
  builds_on: string[]
  root_assumption: string
  chain_depth: number
}

export interface PerceptionEntry {
  relevance: number
  framing: string
}

export interface EmbeddingHint {
  opinion_axis: number // -1 to 1
  abstraction: number  // -1 to 1
  novelty: number      // -1 to 1
}

export interface EnrichedPost {
  id: string
  content: string
  author: string
  parent_id: string | null
  depth: number
  upvotes: number
  stance: string
  themes: string[]
  emotion: Emotion
  post_type: PostType
  importance: number
  core_claim: string
  assumptions: string[]
  evidence_cited: string[]
  logical_chain: LogicalChain
  perceived_by: Record<string, PerceptionEntry>
  embedding_hint: EmbeddingHint
  relationships: Relationship[]
}

// ═══ Spatial Layout (after Architect) ═══

export interface CosmosPost extends EnrichedPost {
  position: [number, number, number]
  isUserPost?: boolean
}

export interface Cluster {
  id: string
  label: string
  center: [number, number, number]
  summary: string
  post_ids: string[]
  root_assumptions: string[]
  perceived_as: Record<string, string>
}

export interface Gap {
  position: [number, number, number]
  description: string
  why_it_matters: string
}

export interface CosmosLayout {
  topic: string
  source: string
  clusters: Cluster[]
  gaps: Gap[]
  posts: CosmosPost[]
  bridge_posts: string[]
  spatial_summary: string
  metadata: {
    total_posts: number
    processing_time_ms: number
    stance_labels: string[]
    theme_labels: string[]
    root_assumption_labels: string[]
  }
}

export interface Labels {
  stances: string[]
  themes: string[]
  roots: string[]
}

// ═══ Architect Result ═══

export interface ArchitectResult {
  clusters: Cluster[]
  gaps: Gap[]
  refined_positions: Record<string, [number, number, number]>
  bridge_posts: string[]
  spatial_summary: string
}

// ═══ Classifier ═══

export interface ClassifiedPost extends EnrichedPost {
  closest_posts: string[]
  relationship_to_closest: RelationshipType
  narrator_comment: string
}

// ═══ Narrator ═══

export interface NarratorResponse {
  text: string
  camera?: {
    fly_to: [number, number, number]
    look_at?: [number, number, number]
  }
  highlights?: {
    post_ids?: string[]
    cluster_ids?: string[]
    edge_ids?: string[]
  }
  follow_up_suggestions: string[]
}

// ═══ Gaze & Face Tracking ═══

export interface GazePoint {
  x: number
  y: number
  timestamp: number
}

export type GazeZone =
  | 'read'
  | 'agree'
  | 'disagree'
  | 'deeper'
  | 'flip'
  | 'wander'

export interface GazeState {
  position: GazePoint | null
  zone: GazeZone
  zoneDwellMs: number
  fixationDurationMs: number
  isFixated: boolean
  blinkRate: number       // blinks per minute
  saccadeRate: number     // saccades per second
  pupilDilation: number   // 0-1 normalized
  isCalibrated: boolean
  confidence: number      // 0-1
}

export interface FaceState {
  headNod: number         // -1 (shake) to 1 (nod)
  headShake: number       // -1 to 1
  leanIn: number          // -1 (back) to 1 (forward)
  browRaise: number       // 0 to 1
  browFurrow: number      // 0 to 1
  smile: number           // 0 to 1
  isTracking: boolean
}

// ═══ Fusion Layer ═══

export type IntentType =
  | 'agree'
  | 'disagree'
  | 'deeper'
  | 'flip'
  | 'navigate'
  | 'compare'
  | 'deep_read'
  | 'confused'
  | 'fatigued'
  | 'engaged'
  | 'pulling_away'
  | 'idle'

export interface IntentSignal {
  type: IntentType
  confidence: number      // 0-1
  source: 'gaze' | 'face' | 'mouse' | 'fused'
  timestamp: number
}

// ═══ Swipe / Interaction ═══

export type SwipeDirection = 'right' | 'left' | 'down' | 'up'
export type Reaction = 'agree' | 'disagree' | 'deeper' | 'flip'

export interface SwipeEvent {
  postId: string
  reaction: Reaction
  timestamp: number
  gazeState?: GazeState
  faceState?: FaceState
}

// ═══ User Position ═══

export interface UserPosition {
  position: [number, number, number]
  nearest_cluster: string
  stance_scores: Record<string, number>
  swipe_count: number
}

// ═══ Adaptive Model ═══

export interface BehaviorPattern {
  signal: string          // e.g., 'head_nod'
  outcome: Reaction
  count: number
  correlation: number     // 0-1
}

export interface UserBehaviorModel {
  patterns: BehaviorPattern[]
  totalActions: number
  phase: 'observe' | 'model' | 'predict' | 'refine'
  predictionAccuracy: number
}

// ═══ Gaze Telemetry (sent to Narrator) ═══

export interface GazeTelemetry {
  readingDepth: number
  engagementPeaks: { postId: string; score: number }[]
  confusionEvents: number
  attentionByCluster: Record<string, number>
  gazeMouseDivergences: number
  fatigueLevel: number
  modelInsights: string[]
}

// ═══ SSE Progress Events ═══

export interface ProgressEvent {
  stage: string
  percent: number
  detail?: string
}

// ═══ READ/MAP Blend ═══

export interface BlendState {
  value: number           // 0 = READ, 1 = MAP
  isTransitioning: boolean
  source: 'pinch' | 'gaze' | 'button'
}
