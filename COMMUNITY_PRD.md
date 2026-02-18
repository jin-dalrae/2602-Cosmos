# COSMOS -- Community Product Requirements Document

**Version:** 2.0
**Date:** February 17, 2026
**Status:** Hackathon Build (deployed)

---

## 1. Overview / Vision

COSMOS is a 3D spatial discussion visualization application. It transforms community discussions into an explorable galaxy of interconnected ideas, where each post is a physical card floating on the inner surface of a sphere. Posts are positioned along meaningful axes -- opinion spectrum, abstraction level, and novelty -- so that the spatial layout itself reveals the structure of a conversation.

The core promise: instead of scrolling a flat thread, you stand inside a living constellation of perspectives, see how ideas cluster and diverge, and discover the gaps where voices are missing.

COSMOS is built for the Anthropic Claude Hackathon. It prioritizes a complete, impressive end-to-end experience over production polish.

---

## 2. Application Routes & Entry Flow

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Marketing landing page with 3D sphere background, manifesto, and "Enter COSMOS" CTA |
| `/web` | CosmosApp | The main 3D cosmos experience |
| `/web/list` | ArticleListPage | Flat list view of all posts |
| `/admin` | AdminPage | PIN-protected admin dashboard (PIN: configured per deployment) |

### Landing Page

A full-page marketing site with:
- **3D sphere background** (`LandingSphere`) -- a lazy-loaded Three.js scene rendered behind the content via `position: fixed`
- Scroll-animated sections: The Problem, The Answer, Design Philosophy, Under the Hood, Vision
- Warm dark theme with semi-transparent cards and `backdrop-filter: blur`
- "Enter COSMOS" buttons navigate to `/web`
- Built with `framer-motion` `useInView` for scroll-triggered entrance animations

### Cosmos Experience Entry

- On mount, the pipeline begins processing a default topic (`SF Richmond`).
- A loading screen (`LoadingCosmos`) shows stage and percentage progress via SSE streaming.
- As soon as the first batch of enriched posts is spatially positioned (partial layout), the 3D scene appears immediately.
- The final architect-refined layout replaces positions smoothly once the full pipeline completes.

### App States

| State | Description |
|-------|-------------|
| `loading` | Pipeline running, loading screen visible |
| `experience` | 3D scene active with cards, controls, compose button |

### Content Source

COSMOS generates an entire community discussion (~150+ posts across 7-10 subtopics) using an AI generator agent. The current default generates a neighborhood forum for the SF Richmond District.

---

## 3. Spatial Model -- Planetarium (Inner-Sphere)

The user stands inside a sphere, looking outward at articles arranged on the dome surface -- like a planetarium or snow globe.

### 3.1 Fixed User Position

**The user's camera is ALWAYS fixed at the origin (0, 0, 0).** This is a hard constraint:

- The camera never moves from (0, 0, 0)
- All navigation is done by **rotating** the view direction, not moving the camera
- Scroll adjusts FOV (zoom), not camera position
- There is no orbit mode, no pull-back, no external view -- the user is always inside the sphere

### 3.2 Article Sphere

| Property | Value |
|----------|-------|
| **Sphere radius** | 150 units (fixed, animated via group scale) |
| **Article positions** | On the sphere surface, placed by the Architect agent |
| **Normalization** | All positions normalized to unit sphere; group scale = radius |
| **Pole clamping** | phi clamped to [30deg, 150deg] -- no articles at poles |

### 3.3 Article Position on the Sphere

Each article is a unique vector on the sphere surface:

| Dimension | Maps to | Range |
|-----------|---------|-------|
| **theta** (longitude) | Opinion spectrum | 0-360deg |
| **phi** (latitude) | Abstraction level | 30-150deg |
| **r_offset** | Subtle depth variation | -1 to +1 (+/-5% of radius) |

- **Distance** between articles on the sphere surface = how different/dissimilar they are
- **Direction** = what kind of difference (opinion vs abstraction)
- **Clusters** form visible constellations -- groups of semantically related articles
- **Edges** between related posts look like constellation lines

### 3.4 Cluster Layout Algorithm

Posts are clustered by their ID prefix (2-letter subtopic code) and distributed on the sphere:

1. Group posts by prefix -> subtopic clusters
2. Space cluster centers evenly on the equatorial band via golden angle
3. Within each cluster, spread posts in a tight local patch using Fibonacci spiral (~15deg radius)
4. Light repulsion pass (6 iterations, ~6deg minimum separation) to prevent overlap

The Architect agent may then refine individual post positions within their clusters.

### 3.5 Camera Model

- Camera is **fixed at origin (0, 0, 0)** -- never moves
- **Drag** rotates the view direction using screen-space rotation (horizontal around world Y axis, vertical around camera's right vector)
- **Drag direction** is FPS-style: drag right -> look left, drag up -> look down
- **FOV:** 78deg default
- **Damping:** 0 (no momentum -- panning, not spinning)
- **Focus animation:** When a post is selected, camera smoothly rotates to center it with **ease-out** interpolation (faster when far, decelerates as it arrives; lerp factor 0.03-0.08 adaptive based on distance)

### 3.6 Navigation

- **Click a card** -> opens it, camera smoothly animates to face it
- **Drag while card is open** -> closes current card, slides camera, opens nearest card in new view direction
- **Head-pose gaze mode** -> hands-free navigation (see Section 8)

### 3.7 Browse Mode

A toggle mode where dragging around the sphere shows the nearest post's content in a **fixed 2D sidebar panel** (DetailPanel) instead of expanding cards in 3D.

- **Toggle:** "Browse" button in top-right (gold border when active, muted when inactive)
- **Nearest-post tracking:** Every 100ms during camera rotation, computes the look direction and finds the post with the highest dot product (within 40deg threshold). Updates the sidebar to show that post.
- **3D expansion suppressed:** In browse mode, no cards expand. The browsed card gets a subtle glow highlight (`isBrowsed` prop on PostCard3D).
- **Sidebar:** `DetailPanel` component (400px left-side panel, slides in/out with AnimatePresence)
- **Content cross-fade:** When navigating between posts, content fades out (250ms), then fades in (300ms) with a subtle translateY + scale transition using `cubic-bezier(0.4, 0, 0.2, 1)` easing

---

## 4. Visual Elements

### 4.1 Article Cards

- Positioned on sphere surface (radius 150 via group scale)
- HTML cards rendered via drei `<Html sprite>` -- always face the camera
- `distanceFactor={50}` scales cards with distance
- Compact: 220px wide, 160px tall
- Selected: 480px wide, up to 450px tall with full content
- **Transitions:** `transform 0.45s cubic-bezier(0.4, 0, 0.15, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)`
- **Performance:** `React.memo` with custom comparator -- visibility quantized to 5 steps
- **CSS:** `will-change: opacity, transform`, `contain: layout style paint` for GPU compositing

### 4.2 Visibility Culling

Articles not in the viewing cone are not rendered:

| Zone | Angular distance from look direction | Opacity |
|------|--------------------------------------|---------|
| Inner cone | 0-45deg | 1.0 (fully visible) |
| Fade zone | 45-65deg | Linear fade 1->0 |
| Culled | 65deg+ | Not rendered (0) |

Selected, browsed, and gaze-highlighted posts always render at full opacity regardless of angle.

### 4.3 Constellation Edges

- Straight lines between related posts through the sphere interior
- Only drawn between angularly nearby posts (dot product > 0.5, ~60deg max)
- Color-coded by relationship type (agrees, disagrees, builds_upon, tangent, rebuts)
- Fixed opacity 0.08

### 4.4 Ambient Dust (Background Stars)

- **150 particles** on sphere surface at radius 26-32
- Warm gold/cream colors, slowly rotating
- Creates the planetarium dome backdrop
- Subtle Y drift (sine wave, 0.2 units amplitude)

### 4.5 Sunset Sky

- Full-sphere shader background (radius 500)
- Gradient: deep indigo (top) -> dusty plum -> warm rose -> amber (horizon) -> warm sand -> dark earth (bottom)
- `THREE.BackSide` rendering, no depth write

---

## 5. Card System

### Compact Card (Default)

| Property | Value |
|----------|-------|
| Width | 220px |
| Height | 160px |
| Title font | Georgia, serif |

**Visible elements:**
- Left accent strip (4px wide, colored by emotion)
- **Title** (`core_claim`)
- **Author** name
- **Emotion tag** (pill badge, colored by emotion palette)
- **Post type** badge (argument, evidence, question, anecdote, meta, rebuttal)
- **Vote controls** (upvote/downvote arrows with count)

### Expanded Card (Selected)

| Property | Value |
|----------|-------|
| Width | 480px |
| Max height | 450px |
| Overflow | Scrollable |

**Additional elements (only when selected):**
- **Full content** (the complete post text, serif typography, line-height 1.7)
- **Hidden assumptions** section (listed in accent-tinted boxes)
- **Themes** (pill tags, wrapped)
- **Replies** section with reply cards. Clicking a reply navigates to that post.
- **Reply button** to open the compose overlay in reply mode
- **Connected posts** section showing up to 3 related posts with relationship type labels

### DetailPanel (Browse Sidebar)

A 400px left-side panel that shows full article content in browse mode:
- Slides in from the left with `AnimatePresence` (350ms ease-out)
- Content cross-fade when switching posts (250ms out, 300ms in with scale + translateY)
- Shows: core claim, author + meta, full content, assumptions, themes, replies, connected posts, vote/reply buttons
- Accent strip colored by emotion

### Emotion Color Palette

| Emotion | Accent |
|---------|--------|
| passionate | `#E8836B` |
| analytical | `#8FB8A0` |
| frustrated | `#C47A5A` |
| hopeful | `#D4B872` |
| fearful | `#9B8FB8` |
| sarcastic | `#A3A07E` |
| neutral | `#B8B0A8` |
| aggressive | `#A85A4A` |
| empathetic | `#D4A0A0` |

---

## 6. Controls & Interactions

### Controls

| Control | Action |
|---------|--------|
| **Drag** | Rotate view direction |
| **Click card** | Select/open article (in browse mode: updates sidebar) |
| **Browse toggle** | Toggle browse mode (sidebar shows nearest post) |
| **Gaze toggle** | Enable/disable head-pose tracking mode |
| **Overview slider** | Tilt viewing elevation |
| **FOV slider** | Field of view (30-90deg, default 78deg) |
| **Damping slider** | Rotation momentum (default 0) |

### Click

- Clicking a compact card **selects** it: the card expands, the camera rotates to center it.
- Clicking inside an expanded card does not deselect.

### Drag Passthrough

Dragging on a card passes through to camera rotation:
1. On `pointerdown`, record the start position.
2. On `pointermove`, if displacement exceeds 5px, set `pointerEvents: none` and dispatch a synthetic `pointerdown` on the canvas.
3. On `pointerup`, restore `pointerEvents`.

### Auto-Navigate

When the user drags away from a selected card:
1. The expanded card collapses immediately.
2. After pointer release, the nearest card to the current look direction is automatically selected.

### Vote

- Toggle behavior: clicking upvote when already upvoted removes the vote.
- Vote state is local (in-memory `Map<string, 'up' | 'down'>`).
- Vote counts update immediately.

---

## 7. Content Pipeline (AI Generation + Caching)

### Architecture

```
Client (React)  <-- SSE -->  Express Server  -->  AI Pipeline  -->  Cache (File + MongoDB)
```

- **Client** sends a POST to `/api/process` with `{ topic }`.
- **Server** responds with an SSE stream of progress events, including partial layouts.
- The pipeline runs server-side using the Anthropic SDK.

### Pipeline Stages

#### Stage 1: Generate

The **Generator** agent creates ~150+ posts across 7-10 subtopics. Posts are generated in sequential batches with cross-topic references for realism.

#### Stage 2: Cartographer

An AI agent that enriches each raw post with structured metadata:

- `stance` -- descriptive label for the author's position
- `themes` -- topic tags
- `emotion` -- one of 9 categories
- `post_type` -- one of 6 categories (argument, evidence, question, anecdote, meta, rebuttal)
- `importance` -- 1-10 scale
- `core_claim` -- one-sentence summary (used as the card title)
- `assumptions` -- unstated assumptions the author relies on
- `logical_chain` -- what the post builds on, root assumption, chain depth
- `perceived_by` -- how different stance groups would frame this post
- `embedding_hint` -- 3D coordinates for rough positioning
- `relationships` -- connections to other posts with type, strength, and reason

**Batch processing:**
- Batch size: 30 posts, max concurrency: 3
- Batch 1 establishes labels (stances, themes, root assumptions)
- Remaining batches run in parallel with the established labels
- After each batch, a **partial layout** is streamed to the client using cluster-based positioning, allowing the 3D scene to appear before the full pipeline finishes

#### Stage 3: Architect

An AI agent that produces the final spatial layout:
- Identifies 3-7 natural clusters
- Assigns refined spherical positions (`[theta_deg, phi_deg, r_offset]`)
- Identifies bridge posts spanning multiple clusters
- Identifies gaps -- empty regions where missing perspectives would logically exist
- Produces a spatial summary

#### Stage 4: Merge

Combines enriched post data with architect positions. Cluster layout is used as base, architect refinements overlaid where available. Final repulsion pass prevents overlap.

### Additional Agents

- **Classifier:** Classifies a user-submitted post into the existing discussion structure. Returns position, closest existing posts, and a narrator comment.
- **Narrator:** A "warm, calm museum curator" that answers questions about the discussion layout using spatial metaphors. Can suggest camera movements and highlight specific posts.

### AI Model

- All agents use the Anthropic API via `@anthropic-ai/sdk`
- Model: Claude (configurable per agent)
- Retry logic: max 2 retries with exponential backoff
- JSON parsing includes truncated-array recovery for robustness

### Caching (Three-Layer)

1. **Client-side MongoDB check:** `GET /api/layout/:topic` -- attempts to load a stored layout from MongoDB before starting the pipeline.

2. **Server-side file cache** (always active):
   - Stored in `server/.cache/` as JSON files
   - Filename derived from the input string (sanitized, max 80 chars)
   - Checked first on every SSE request. If hit, returns immediately with no AI calls.

3. **MongoDB storage** (Firestore-compatible):
   - Connected via `MONGODB_URI` env var with 4s connection timeout
   - Stores layouts and individual posts
   - Server pre-connects at startup to avoid cold-start latency
   - Gracefully degrades -- if unavailable, falls through to pipeline

**Cache priority:** Client-side MongoDB check -> Server file cache -> Full pipeline run.

---

## 8. Head-Pose Navigation

### Architecture

```
Camera stream (getUserMedia)
    |
MediaPipe FaceLandmarker (GPU delegate)
    |
4x4 facial transformation matrix
    |
Extract yaw (atan2) + pitch (asin) -> normalize to [-1, +1]
    |
Auto-calibration offset subtracted
    |
EMA smoothing (alpha=0.5)
    |
Position-based camera steering + article auto-open
```

### Camera Stream (useGazeTracking)

Simple `getUserMedia` wrapper:
- Requests `{ facingMode: 'user', width: 640, height: 480 }`
- Returns `{ videoStream, isTracking, start, stop }`
- Stream passed to `useHeadPose` for MediaPipe processing

### Head Pose Detection (useHeadPose)

| Parameter | Value |
|-----------|-------|
| **Detection FPS** | 30 (throttled via requestAnimationFrame) |
| **Smoothing** | EMA with alpha = 0.5 |
| **Normalization** | +/-20deg head turn = full [-1, +1] range |
| **Auto-calibration** | First 30 frames (~1s) averaged as neutral offset |
| **Model** | `face_landmarker/float16` via CDN |
| **GPU delegate** | Enabled |

### Position-Based Steering

Head position maps to an **angular offset** from a base rotation -- NOT a velocity/joystick model. Holding your head still does NOT cause continuous rotation.

```
baseRotation = last drag endpoint or focus animation endpoint
headOffset = applyAxis(headPose.yaw) x maxOffset    // +/-40deg max
targetRotation = baseRotation + headOffset
camera lerps toward targetRotation at 0.06/frame
```

| Parameter | Value |
|-----------|-------|
| **Max angular offset** | +/-40deg from base rotation |
| **Dead zone** | 0.08 (ignore resting face micro-movements) |
| **Lerp speed** | 0.06 per frame |

### Gaze Mode States

```
'off' -> 'consent' -> 'active'
          ^                |
          +-- toggle off --+
```

- **off:** No camera, no tracking
- **consent:** Shows CameraConsent overlay (explains camera usage, privacy)
- **active:** Camera streaming, head pose tracked, articles auto-open

No calibration step -- consent goes directly to active. Auto-calibration happens silently during the first second.

### Article Auto-Open (Gaze Browse)

When gaze mode is active, the nearest article is automatically opened based on head direction:

- **GAZE_LEAD offset (45deg):** The search looks ahead of the camera in the direction the head is pointing.
- **MIN_DISPLAY_MS:** 3,000ms -- minimum time an article stays open
- **AWAY_CLOSE_MS:** 500ms -- how long attention must move away before switching

### Privacy

- MediaPipe FaceLandmarker runs **100% client-side**
- No images, video, or personal data are stored or sent to any server
- Only head direction (yaw/pitch) is used for navigation
- Camera preview visible to user at all times
- Toggle on/off anytime
- Consent dialog explicitly states privacy policy

---

## 9. Adaptive User Model

A session-scoped, fully client-side behavioral intelligence system that learns each user's patterns during their visit. No data is sent to the server or persisted across sessions.

### 9.1 Architecture

```
Raw Signals (per frame / per event)
    ├── Head pose (yaw, pitch from useHeadPose)
    ├── Face signals (brow furrow, lean, nod/shake from faceSignals.ts)
    ├── Gaze zone (agree/disagree/read/wander from gazeZones.ts)
    └── Interaction events (click, scroll, dwell, skip, vote, reply)
        │
        ▼
    Fusion Layer (fusionLayer.ts)
    → IntentSignal: { type, confidence, source, timestamp }
        │
        ▼
    Adaptive Model (adaptiveModel.ts)
    ├── Engagement Tracker     → user interest profile
    ├── Behavioral Predictor   → predicted reaction before action
    └── Content Recommender    → suggested next posts
        │
        ▼
    UI Effects
    ├── Subtle card highlighting (recommended posts glow)
    ├── Anti-echo-chamber nudges ("There's a perspective you haven't seen...")
    └── Prediction-based preloading (expand card the user is about to select)
```

### 9.2 Engagement Tracker

Tracks what the user gravitates toward and builds an interest profile.

**Data collected (in-memory only):**

| Event | Data captured |
|-------|--------------|
| **Post viewed** | post_id, cluster_id, themes, stance, emotion, dwell_ms |
| **Post skipped** | post_id was in view but user moved away within 500ms |
| **Post read deeply** | scrolled past 50% of expanded content, dwell > 5s |
| **Vote** | post_id, direction (up/down) |
| **Reply** | post_id, content length |
| **Cluster visit** | cluster_id, total_dwell_ms, posts_viewed_count |
| **Navigation path** | ordered list of cluster_ids visited (journey map) |

**Derived profile:**

```typescript
interface UserProfile {
  // Topic affinity: theme -> engagement score (0-1)
  themeAffinity: Map<string, number>

  // Stance leaning: where on the opinion spectrum the user spends time
  stanceLeaning: number          // -1 (left pole) to +1 (right pole)
  stanceVariance: number         // 0 = echo chamber, 1 = wide exploration

  // Abstraction preference: concrete vs theoretical
  abstractionPreference: number  // -1 (concrete) to +1 (abstract)

  // Reading style
  avgDwellMs: number             // average time per post
  readDepthRatio: number         // % of posts read deeply vs skimmed
  skipRate: number               // % of visible posts skipped

  // Exploration breadth
  clustersVisited: Set<string>
  clustersUnvisited: Set<string>
  journeyPath: string[]          // ordered cluster visit history

  // Emotional resonance: which emotions they engage with most
  emotionAffinity: Map<string, number>
}
```

**Update frequency:** Profile recalculated every 10 events or 30 seconds, whichever comes first.

### 9.3 Behavioral Predictor

Learns the user's physical signal patterns and predicts their reaction before they act.

**Four phases:**

| Phase | Actions recorded | Behavior |
|-------|-----------------|----------|
| **Observe** | 0-9 | Record signals before every action. No predictions. |
| **Model** | 10-19 | Build signal→reaction correlation matrix. Still no predictions. |
| **Predict** | 20-29 | Start returning predictions with confidence scores. |
| **Refine** | 30+ | Every confirmed/contradicted prediction updates the model. Accuracy tracked. |

**Signal types extracted per frame:**

| Signal | Source | Extraction |
|--------|--------|-----------|
| `head_nod` | Face | headNod > 0.25 |
| `head_shake` | Face | headShake < -0.25 |
| `lean_in` | Face | leanIn > 0.25 |
| `lean_back` | Face | leanIn < -0.25 |
| `brow_raise` | Face | browRaise > 0.25 |
| `brow_furrow` | Face | browFurrow > 0.25 |
| `smile` | Face | smile > 0.25 |
| `gaze_agree` | Gaze | zone == 'agree' |
| `gaze_disagree` | Gaze | zone == 'disagree' |
| `gaze_deeper` | Gaze | zone == 'deeper' |
| `gaze_read` | Gaze | zone == 'read' |
| `gaze_wander` | Gaze | zone == 'wander' |

**Correlation model:**

For each `(signal, reaction)` pair, track:
- `count`: how many times this signal preceded this reaction
- `total`: how many times this signal was observed
- `correlation`: count / total

**Prediction logic:**
1. Extract active signals from current gaze + face state
2. For each possible reaction (agree, disagree, deeper, flip), compute weighted average correlation across active signals
3. Return highest-scoring reaction if confidence > 0.3
4. Scale confidence by historical prediction accuracy

**Output:**
```typescript
interface Prediction {
  reaction: 'agree' | 'disagree' | 'deeper' | 'flip'
  confidence: number  // 0-1
}
```

### 9.4 Content Recommender

Uses the engagement profile to surface posts the user would benefit from seeing.

**Recommendation strategies:**

| Strategy | Weight | Logic |
|----------|--------|-------|
| **Unvisited clusters** | 0.35 | Posts from clusters in `clustersUnvisited`. Prioritize clusters adjacent to visited ones on the sphere. |
| **Challenge posts** | 0.25 | Posts with opposing stance to user's `stanceLeaning`. Only if `stanceVariance` < 0.4 (echo chamber detected). |
| **High-importance skipped** | 0.20 | Posts with importance >= 7 that were visible but skipped. |
| **Gap exploration** | 0.10 | Posts near Architect-identified gaps. Nudge user toward missing perspectives. |
| **Theme deepening** | 0.10 | Posts matching top `themeAffinity` themes that haven't been read deeply. |

**Anti-echo-chamber logic:**

```
if stanceVariance < 0.4 AND clustersVisited.size >= 2:
    → "echo chamber" state
    → boost weight of Challenge posts to 0.40
    → show subtle nudge: "You might find a different angle in [cluster_name]..."

if stanceVariance > 0.7:
    → "explorer" state
    → boost Theme deepening to 0.25
    → show encouragement: "You've covered a lot of ground"
```

**Output:**
```typescript
interface Recommendation {
  postId: string
  reason: 'unvisited_cluster' | 'challenge' | 'high_importance' | 'gap' | 'theme_match'
  score: number        // 0-1 composite score
  nudgeText?: string   // optional gentle suggestion to display
}
```

**Delivery:** Top 5 recommendations recalculated every 30 seconds. Recommended posts receive a subtle golden shimmer on their card edges in the 3D view. One nudge text shown at a time (bottom-center, fades after 8 seconds).

### 9.5 Privacy Guarantees

- **100% client-side.** No behavior data is sent to the server.
- **Session-scoped.** All data lives in memory. Closing the tab erases everything.
- **No fingerprinting.** No device/browser identifiers collected.
- **No localStorage/sessionStorage.** Model is purely in-memory (refs and state).
- **Transparent.** User can see their profile in a debug overlay (PerceptionDebug component).

### 9.6 Implementation Files

| File | Role |
|------|------|
| `src/lib/adaptiveModel.ts` | Core model: EngagementTracker, BehavioralPredictor, ContentRecommender |
| `src/hooks/useAdaptiveModel.ts` | React hook: wires model to component lifecycle, exposes profile/predictions/recommendations |
| `src/lib/fusionLayer.ts` | (existing) Fuses gaze + face + mouse → IntentSignal |
| `src/lib/gazeFeatures.ts` | (existing) Fixation detection, blink rate, saccade rate, engagement estimation |
| `src/lib/faceSignals.ts` | (existing) Face expression extraction |
| `src/lib/gazeZones.ts` | (existing) Gaze zone classification |

---

## 10. Admin Dashboard

### Access

- Route: `/admin`
- Protected by a PIN entry gate (numeric PIN stored client-side in sessionStorage for session persistence)
- Styled to match the dark warm theme

### Tabs

| Tab | Features |
|-----|----------|
| **Layouts** | List all stored layouts (topic, post count, cluster count, date). Preview, Regenerate, or Delete each layout. |
| **Cache** | Clear file cache, MongoDB, or both. Shows results after clearing. |
| **Generate** | Enter a topic and run the full pipeline. Live SSE progress bar and log. |
| **Health** | Server uptime, MongoDB status, Anthropic API status, file cache stats. Auto-refreshes every 15s. |
| **Stats** | Total layouts, total posts, average processing time, topic list. |

### Regenerate

- Deletes existing layout (both MongoDB and file cache), then re-runs the full pipeline via `POST /api/admin/regenerate/:topicKey`
- SSE progress streaming with live percentage display
- Layout list auto-refreshes on completion

---

## 10. Visual Design

### Theme: Dark & Warm

| Element | Color |
|---------|-------|
| Background | `#262220` (warm dark walnut) |
| Deeper background | `#1C1A18` |
| Primary accent | `#D4B872` (gold) |
| Primary text | `#F5F2EF` (cream) |
| Secondary text | `#9E9589` (warm gray) |
| Muted text | `#6B6560` |
| Borders | `#3A3530` |
| Overlay | `rgba(38, 34, 32, 0.85)` with `backdrop-filter: blur` |

### Edge / Relationship Colors

| Relationship | Color |
|--------------|-------|
| agrees | `#8FB8A0` (sage) |
| disagrees | `#C47A5A` (terracotta) |
| builds_upon | `#D4B872` (gold) |
| tangent | `#9E9589` (warm gray) |
| rebuts | `#A85A4A` (deep terracotta) |

### Typography

- **Headings / card titles:** Georgia, "Times New Roman", serif
- **UI text / labels / metadata:** system-ui, sans-serif

---

## 11. Technical Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript ~5.9 | Type safety |
| Vite 7 | Build tooling and dev server |
| @react-three/fiber 9 | React renderer for Three.js |
| @react-three/drei 10 | Three.js helpers (Html, PerspectiveCamera) |
| Three.js | 3D rendering engine |
| Framer Motion 12 | Animations and page transitions |
| Tailwind CSS 4 | Utility styles |
| @use-gesture/react | Gesture handling |
| MediaPipe FaceLandmarker | Head pose detection (GPU, client-side) |

### Backend

| Technology | Purpose |
|------------|---------|
| Express 5 | HTTP server with SSE streaming |
| tsx | TypeScript execution for the server |
| @anthropic-ai/sdk | Claude API client |
| mongodb | MongoDB driver (Firestore-compatible) |

### Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Firebase Hosting | cosmosweb.web.app |
| Backend | Google Cloud Run | cosmos-api-*.run.app |
| Database | Firestore (MongoDB-compatible) | via MONGODB_URI |

### Dev Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both Vite dev server and Express backend |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | Express only (tsx watch) |
| `npm run build` | TypeScript check + Vite production build |
| `npm start` | Production server (serves static files + API) |

### Server API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/process` | SSE stream -- runs the full pipeline for a topic |
| GET | `/api/layout/:topic` | Fetch stored layout from MongoDB |
| POST | `/api/classify` | Classify a user post into the existing layout |
| POST | `/api/narrate` | Ask the Narrator a question about the layout |
| POST | `/api/generate-post` | Generate a new post for an existing layout |
| GET | `/api/health` | Health check |
| GET | `/api/admin/layouts` | List all stored layouts |
| DELETE | `/api/admin/layouts/:key` | Delete a layout and its posts |
| POST | `/api/admin/regenerate/:key` | Regenerate a layout (SSE progress) |
| POST | `/api/admin/cache/clear` | Clear file cache and/or MongoDB |
| GET | `/api/admin/health` | System health dashboard |
| GET | `/api/admin/stats` | Aggregate statistics |
| GET | `/api/admin/preview/:key` | Preview a layout's clusters and sample posts |

### Key Data Types

- `RawPost` -- minimal post data from generator
- `EnrichedPost` -- post with all Cartographer metadata
- `CosmosPost` -- enriched post with 3D position `[x, y, z]`
- `CosmosLayout` -- the complete layout (posts, clusters, gaps, bridge posts, metadata)
- `Cluster` -- group of related posts with center position and summary
- `Gap` -- identified missing perspective with position and description
- `Relationship` -- directional link between posts with type, strength, and reason
- `GazeTelemetry` -- gaze state, recent zones, and dwell history

### Project Structure

```
cosmos/
  server/
    index.ts                  # Express server entry (eager MongoDB connect)
    lib/
      db.ts                   # MongoDB connection singleton (4s timeout)
      store.ts                # Layout + post storage to MongoDB
    routes/
      process.ts              # SSE pipeline endpoint + file cache
      layout.ts               # GET stored layout from MongoDB
      classify.ts             # Post classification endpoint
      narrate.ts              # Narrator query endpoint
      generate-post.ts        # Generate new post endpoint
      admin.ts                # Admin API (layouts, cache, health, stats, regen, preview)
    .cache/                   # Local file cache (gitignored)
  src/
    App.tsx                   # Router: / -> Landing, /web -> Cosmos, /admin -> Admin
    main.tsx                  # React entry point
    components/
      LandingPage.tsx         # Marketing landing page with manifesto
      LandingSphere.tsx       # 3D sphere background for landing (lazy-loaded)
      CosmosExperience.tsx    # Main 3D scene orchestrator
      ControlPanel.tsx        # Scene settings UI
      ComposeOverlay.tsx      # New post / reply modal
      DetailPanel.tsx         # Left-side sidebar for browse mode
      Admin/
        AdminPage.tsx         # Admin dashboard with PIN gate
        LayoutsPanel.tsx      # Layout management (list, preview, regen, delete)
        CachePanel.tsx        # Cache clearing UI
        GeneratePanel.tsx     # Topic generation with SSE progress
        HealthPanel.tsx       # System health dashboard
        StatsPanel.tsx        # Aggregate statistics
        PreviewModal.tsx      # Layout preview modal
      ListView/
        ArticleListPage.tsx   # Flat article list view
        ArticleList.tsx       # Article list component
      MapMode/
        Canvas3D.tsx          # Three.js canvas, camera, rotation controls
        PostCard3D.tsx        # 3D card component (compact + expanded)
        EdgeNetwork.tsx       # Relationship lines between posts
        AmbientDust.tsx       # Floating particle atmosphere (150 particles)
        ClusterShells.tsx     # Cluster boundary visualization
        PostCloud.tsx         # Point cloud overview
        UserMarker.tsx        # User position marker
      ReadMode/               # Card-based reading mode (swipeable)
        CardFront.tsx
        CardBack.tsx
        CardStack.tsx
        SwipeableCard.tsx
        ArgumentDNA.tsx
      UI/
        LoadingCosmos.tsx     # Loading screen with progress
        ErrorBoundary.tsx     # Error boundary
        CameraConsent.tsx     # Camera permission + privacy notice
        FacePreview.tsx       # Bottom-left camera preview
        MiniMap.tsx           # 2D overhead mini-map with camera cone
        NarratorSheet.tsx     # Narrator Q&A sheet
        CalibrationScreen.tsx # Gaze calibration
        GestureHints.tsx      # Interaction hints
        PerceptionDebug.tsx   # Debug overlay for gaze/face tracking
        RandomArticleButton.tsx # Random article navigation
      shared/
        EmotionPalette.ts     # Color constants for emotions, edges, UI
    hooks/
      useCosmosData.ts        # SSE client for pipeline data (MongoDB check -> SSE fallback)
      useGazeTracking.ts      # getUserMedia camera stream hook
      useHeadPose.ts          # MediaPipe FaceLandmarker head pose (yaw/pitch + auto-cal)
      useGazeCardFeedback.ts  # Gaze-based card interaction
      useCameraFly.ts         # Camera animation
    lib/
      types.ts                # All TypeScript interfaces
      api.ts                  # API_BASE URL resolution
      orchestrator.ts         # Pipeline orchestrator (generate -> cartograph -> architect -> merge)
      gazeFeatures.ts         # Gaze feature extraction
      gazeZones.ts            # Gaze zone classification
      faceSignals.ts          # Face expression signals
      fusionLayer.ts          # Multi-modal intent fusion
      agents/
        base.ts               # Anthropic SDK wrapper + JSON parser
        generator.ts          # Community discussion generator
        cartographer.ts       # Post enrichment agent
        architect.ts          # Spatial layout agent
        classifier.ts         # Single-post classifier
        narrator.ts           # Narrator / guide agent
  Dockerfile                  # Cloud Run container (node:20-slim, tsx)
  firebase.json               # Firebase Hosting config (SPA rewrites, CSP headers)
```

---

*Built for the Anthropic Claude Hackathon, February 2026. By Rae.*
