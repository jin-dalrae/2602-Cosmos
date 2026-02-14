# COSMOS -- Community Product Requirements Document

**Version:** 1.1
**Date:** February 2026
**Status:** Hackathon Build

---

## 1. Overview / Vision

COSMOS is a 3D spatial discussion visualization application. It transforms community discussions into an explorable galaxy of interconnected ideas, where each post is a physical card floating in three-dimensional space. Posts are positioned along meaningful axes -- opinion spectrum, abstraction level, and novelty -- so that the spatial layout itself reveals the structure of a conversation.

The core promise: instead of scrolling a flat thread, you orbit through a living constellation of perspectives, see how ideas cluster and diverge, and discover the gaps where voices are missing.

COSMOS is built for a hackathon. It prioritizes a complete, impressive end-to-end experience over production polish.

---

## 2. Core Experience

### Entry Flow

- **No landing page.** The app goes straight into the 3D experience.
- On mount, the pipeline begins processing a default topic (`SF Richmond`).
- A loading screen (`LoadingCosmos`) shows stage and percentage progress via SSE streaming.
- As soon as the first batch of enriched posts is spatially positioned (partial layout), the 3D scene appears immediately. A "Loading more posts..." indicator shows while remaining batches arrive.
- The final architect-refined layout replaces positions smoothly once the full pipeline completes.

### App States

| State | Description |
|---|---|
| `loading` | Pipeline running, loading screen visible |
| `experience` | 3D scene active with cards, controls, compose button |

### Content Source

COSMOS supports two input modes:

1. **Reddit URL** -- fetches a real thread via Reddit JSON API, falls back to AI generation if Reddit is unreachable.
2. **Topic string** -- generates an entire community discussion (~100+ posts across 7 subtopics) using an AI generator agent.

The current default generates a neighborhood forum for the SF Richmond District.

---

## 3. 3D Scene & Camera

### Canvas

- Built with `@react-three/fiber` `<Canvas>` and `@react-three/drei` helpers.
- Background color: `#262220` (warm dark walnut).
- Ambient light at 0.6 intensity, directional light at 0.4.
- `<PerspectiveCamera>` with configurable FOV (default 8) and position (default Z = 12).

### Camera Behavior

- **OrbitControls** with configurable damping (default 0.05). Min distance 2, max distance 60.
- **Orbit target is always world center (0, 0, 0).** The target never moves to the card.
- **Rotate-to-select:** When a card is clicked, the camera **rotates around the origin** so that the card aligns with the camera's line of sight. The card is NOT pinned to screen center during the orbit -- everything in the scene moves together as the camera orbits. Animation lerp factor is **0.04** for smooth centering.
- **Camera distance slider applies as a relative offset** (`+=delta`) so it does not undo in-progress camera animations.
- **Camera distance adjusts distanceFactor proportionally** so cards maintain the same visual size regardless of zoom level. The formula is `distanceFactor = 3 * (cameraDistance / 22)`.

### Coordinate System

The Architect agent positions posts along three semantic axes:

| Axis | Range | Meaning |
|---|---|---|
| X | -8 to +8 | Primary opinion spectrum (left pole vs. right pole of the main debate) |
| Y | -6 to +6 | Abstraction level (bottom = concrete/personal, top = abstract/theoretical) |
| Z | -6 to +6 | Novelty (back = common talking points, front = novel insights) |

Positions are scaled by a configurable **Spread** multiplier (default 10) before rendering.

### Performance: Nearby Card Culling

- Only **30 nearby cards** are rendered at a time (configurable via `nearbyCount`, default 30).
- "Nearby" is determined by Euclidean distance from the selected post's position. If no post is selected, the centroid of all posts is used as the anchor.
- **Anchor position is remembered via a ref.** During auto-navigate (when `selectedPostId` is briefly `null`), the anchor stays at the last selected card's position. This prevents blinking or card pop-in caused by the anchor suddenly jumping to the centroid.
- The selected post is always included in the visible set.

### Ambient Dust Particles

- 200 floating particles spread across a 15-unit cube.
- Colors are a random mix of gold (`#D4B872`) and cream (`#F5F2EF`).
- The particle group slowly rotates (0.0002 rad/frame) with a subtle Y-axis sinusoidal drift.
- Point size 0.05, opacity 0.3, depth write disabled.

---

## 4. Card System

### Compact Card (Default)

| Property | Value |
|---|---|
| Width | 300px |
| Height | 200px |
| Title font size | 20px |
| Title font | Georgia, serif |
| Overflow | Hidden |

**Visible elements:**
- Left accent strip (4px wide, colored by emotion)
- **Title** (`core_claim`)
- **Author** name
- **Emotion tag** (pill badge, colored by emotion palette)
- **Post type** badge (argument, evidence, question, anecdote, meta, rebuttal)
- **Vote controls** (upvote/downvote arrows with count)

**Hover state:** Scale 1.02, enhanced box-shadow with accent color glow.

### Expanded Card (Selected)

| Property | Value |
|---|---|
| Width | 800px |
| Max height | 600px |
| Overflow | Scrollable (`overflowY: auto`) |
| Title font size | 28px |

**Additional elements (only when selected):**
- **Full content** (the complete post text, 18px, line-height 1.7)
- **Hidden assumptions** section (listed in accent-tinted boxes)
- **Themes** (pill tags, wrapped)
- **Replies** section with reply cards (author, emotion badge, upvotes, content). Clicking a reply navigates to that post.
- **Reply button** to open the compose overlay in reply mode
- **Connected posts** section showing up to 3 related posts with relationship type labels (agrees, disagrees, builds_upon, tangent, rebuts) and color coding. Clicking navigates to the related post.

### Card Transitions

- Card open/close uses **CSS transitions** on `width` and `max-height`: `0.35s ease`.
- This produces a smooth expansion from compact to expanded size (and smooth collapse back) instead of an instant resize.

### Card Rendering in 3D

- Cards are rendered using `@react-three/drei` `<Html>` with `center` positioning at the post's 3D coordinates.
- `distanceFactor` scales proportionally with camera distance so visual size stays constant.
- `occlude={false}` -- cards are always visible.
- **Z-index ordering:** Selected cards get `zIndexRange={[10000, 10000]}`. Unselected cards get `[0, 9999]`, so nearer cards naturally render on top.

### Emotion Color Palette

Each emotion maps to a unique card color scheme:

| Emotion | Card Background | Accent | Text |
|---|---|---|---|
| passionate | `#FFF5F0` | `#E8836B` | `#5A2A1A` |
| analytical | `#F0F7F3` | `#8FB8A0` | `#1A3A28` |
| frustrated | `#FDF2EC` | `#C47A5A` | `#4A2A1A` |
| hopeful | `#FDFAF0` | `#D4B872` | `#3A3018` |
| fearful | `#F5F2FA` | `#9B8FB8` | `#2A2440` |
| sarcastic | `#F5F5EE` | `#A3A07E` | `#3A3A28` |
| neutral | `#F5F2EF` | `#B8B0A8` | `#3A3530` |
| aggressive | `#FAF0ED` | `#A85A4A` | `#3A1A12` |
| empathetic | `#FAF2F2` | `#D4A0A0` | `#3A2020` |

---

## 5. Interactions

### Click

- Clicking a compact card **selects** it: the card expands to 800px (via CSS transition), the camera rotates around the origin to center it, and the detail content loads.
- Clicking inside an expanded card does not deselect (events are stopped).
- Clicking empty space or the canvas background does not deselect (deselection happens only via drag-away).

### Scroll / Wheel

- Scrolling on an expanded card scrolls the card content (event propagation stopped).
- Scrolling on the canvas zooms the camera (via OrbitControls).

### Drag Passthrough

Dragging on a card passes through to OrbitControls:

1. On `pointerdown`, record the start position.
2. On `pointermove`, if displacement exceeds 5px, set the card's `pointerEvents` to `none` and dispatch a synthetic `pointerdown` on the canvas so OrbitControls picks up the drag.
3. On `pointerup`, restore `pointerEvents` to `auto`.

### Auto-Navigate

When the user drags away from a currently selected (expanded) card:

1. The expanded card **collapses** immediately (`selectedPostId` set to `null`).
2. A `pendingAutoSelectRef` flag is set (stored as a ref, not state).
3. After the user releases the pointer (pointerup), `handleOrbitEnd` fires. It reads `pendingAutoSelectRef` and `scaledPostsRef` (a ref to the current scaled posts array) to find the **nearest card to the current camera position** (excluding the card that was just closed).
4. That nearest card is automatically selected and the camera rotates to it.

**Implementation note:** Refs (`pendingAutoSelectRef`, `scaledPostsRef`) are used instead of state to avoid stale closure issues -- `handleOrbitEnd` always reads the most current values regardless of when the closure was created.

This creates a fluid "drag to browse" experience.

### Vote

- Toggle behavior: clicking upvote when already upvoted removes the vote; clicking downvote when upvoted switches to downvote.
- Vote state is local (in-memory `Map<string, 'up' | 'down'>`).
- Vote counts update immediately on the post object.

### Navigation

- Clicking a reply within an expanded card navigates to (selects) that reply's post.
- Clicking a connected post navigates to that post.
- Both trigger the camera orbit animation.

---

## 6. Control Panel

A collapsible panel in the top-left corner. Toggle button says "Controls" with a gear icon. Styled with backdrop blur and the dark theme.

### Sliders

Only three controls are exposed in the panel:

| Label | Actual Effect | Min | Max | Step | Default | Notes |
|---|---|---|---|---|---|---|
| Camera Distance | Camera FOV (degrees) | 5 | 20 | 1 | 8 | Label says "Camera Distance" but controls FOV |
| Field of View | Camera Z position | 5 | 60 | 1 | 12 | Label says "Field of View" but controls camera Z |
| Damping | OrbitControls damping | 0 | 0.2 | 0.01 | 0.05 | |

**Label swap note:** The "Camera Distance" and "Field of View" labels are intentionally swapped relative to their underlying parameters. "Camera Distance" controls the FOV value, and "Field of View" controls the camera Z position.

### Slider Display Precision

Slider value labels use adaptive decimal precision:
- Step < 0.1: **2 decimal places** (e.g., 0.05)
- Step < 1: **1 decimal place** (e.g., 0.5)
- Otherwise: **0 decimal places** (e.g., 12)

### Removed from Panel

- **Spread** -- still exists as a setting (default 10, multiplies all post positions) but is no longer exposed in the control panel UI.
- **Link Opacity** -- removed from the panel. Edge opacity is fixed at 0.08.

### Notes

- A "Reset to defaults" button restores all settings to their default values.
- `nearbyCount` (30) is a setting in the data model but is not currently exposed in the UI.

---

## 7. Content Pipeline (AI Generation + Caching)

### Architecture

```
Client (React)  <-- SSE -->  Express Server  -->  AI Pipeline  -->  Cache
```

- **Client** sends a POST to `/api/process` with `{ url }` or `{ topic }`.
- **Server** responds with an SSE stream of progress events.
- The pipeline runs server-side using the Anthropic SDK.

### Pipeline Stages

#### Stage 1: Harvest

- **Reddit URL path:** Fetches the thread via Reddit's `.json` API, extracts posts with id, content, author, parent_id, depth, upvotes.
- **Topic path:** The **Generator** agent creates ~100+ posts across 7 predefined subtopics (for SF Richmond: gardening, schools, parking, safety, food, housing, parks). Posts are generated in sequential batches with cross-topic references for realism.

#### Stage 2: Cartographer

An AI agent that enriches each raw post with structured metadata:

- `stance` -- descriptive label for the author's position
- `themes` -- topic tags
- `emotion` -- one of 9 categories (passionate, analytical, frustrated, hopeful, fearful, sarcastic, neutral, aggressive, empathetic)
- `post_type` -- one of 6 categories (argument, evidence, question, anecdote, meta, rebuttal)
- `importance` -- 1-10 scale
- `core_claim` -- one-sentence summary (used as the card title)
- `assumptions` -- unstated assumptions the author relies on
- `evidence_cited` -- sources or data points mentioned
- `logical_chain` -- what the post builds on, root assumption, chain depth
- `perceived_by` -- how different stance groups would frame this post
- `embedding_hint` -- 3D coordinates (opinion_axis, abstraction, novelty) each in [-1, 1]
- `relationships` -- connections to other posts (agrees, disagrees, builds_upon, tangent, rebuts) with strength and reason

**Batch processing:**
- Batch size: 30 posts.
- Batch 1 establishes labels (stances, themes, root assumptions).
- Remaining batches run in parallel (max concurrency: 3) with the established labels for consistency.
- After each batch completes, a **partial layout** is emitted to the client using `embedding_hint` values for rough positioning, allowing the 3D scene to appear before the full pipeline finishes.

#### Stage 3: Architect

An AI agent that produces the final spatial layout:

- Identifies 3-7 natural clusters based on stance, themes, and embedding hints.
- Assigns refined 3D positions for every post (cluster centers at least 4 units apart, posts within ~2 units of their cluster center).
- Identifies bridge posts that span multiple clusters.
- Identifies gaps -- empty regions where missing perspectives would logically exist.
- Produces a spatial summary describing the layout structure.

Positions are scaled by 0.6 before final output.

#### Stage 4: Merge

Combines enriched post data with architect positions into the final `CosmosLayout` object.

### Additional Agents

- **Classifier:** Rapidly classifies a single user-submitted post into the existing discussion structure. Returns the post's position, closest existing posts, and a narrator comment about where it fits.
- **Narrator:** A "warm, calm museum curator" that answers questions about the discussion layout using spatial metaphors. Can suggest camera movements and highlight specific posts or clusters.

### AI Model

- All agents use the Anthropic API via `@anthropic-ai/sdk`.
- Default model: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) for speed.
- Opus 4.6 available as an option for higher quality.
- Retry logic: max 2 retries with exponential backoff (1s, 2s).
- JSON parsing includes truncated-array recovery for robustness.

### Caching (Two-Layer)

1. **Local file cache** (always active):
   - Stored in `server/.cache/` as JSON files.
   - Filename derived from the input string (sanitized, max 80 chars).
   - Checked first on every request. If hit, returns immediately with no AI calls.

2. **Firestore cache** (optional, for URLs only):
   - Requires Firebase credentials (`FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS` env var).
   - Gracefully degrades -- if no credentials, caching is simply disabled.
   - Stores the full serialized layout with metadata (topic, post count, processing time, timestamp).

**Cache priority:** Local file > Firestore > Full pipeline run.

---

## 8. Visual Design

### Theme: Dark & Warm

| Element | Color |
|---|---|
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
|---|---|
| agrees | `#8FB8A0` (sage) |
| disagrees | `#C47A5A` (terracotta) |
| builds_upon | `#D4B872` (gold) |
| tangent | `#9E9589` (warm gray) |
| rebuts | `#A85A4A` (deep terracotta) |

### Edge Network

- Lines between related posts rendered as `<lineSegments>` with vertex colors based on relationship type.
- Transparent with fixed opacity **0.08** (very subtle).
- Depth write disabled.

### Typography

- **Headings / card titles:** Georgia, "Times New Roman", serif
- **UI text / labels / metadata:** system-ui, sans-serif
- **Control values:** monospace

### Compose Overlay

- Centered modal, 420px wide, dark card (`#2E2A28`), rounded corners (16px).
- Author field (defaults to "Anonymous") and content textarea.
- Gold submit button (`#D4B872`), disabled state uses muted gray.
- Backdrop blur overlay dismisses on click.

### Hints

- A bottom-center hint bar appears when no card is selected: "Click a card to read. Drag to orbit. Scroll to zoom."
- Styled as a muted, semi-transparent pill with backdrop blur.

### New Post Button

- Fixed bottom-right, gold accent color, "New Post" with a plus icon.
- Rounded (12px), elevated shadow.

---

## 9. Technical Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript ~5.9 | Type safety |
| Vite 7 | Build tooling and dev server |
| @react-three/fiber 9 | React renderer for Three.js |
| @react-three/drei 10 | Three.js helpers (Html, OrbitControls, PerspectiveCamera) |
| Three.js 0.182 | 3D rendering engine |
| Framer Motion 12 | Page transitions and animations |
| Tailwind CSS 4 | Utility styles (used sparingly, mostly inline styles) |
| @use-gesture/react | Gesture handling |

### Backend

| Technology | Purpose |
|---|---|
| Express 5 | HTTP server with SSE streaming |
| tsx | TypeScript execution for the server |
| @anthropic-ai/sdk | Claude API client |
| firebase-admin | Firestore cache (optional) |
| concurrently | Run client + server in parallel during dev |

### Dev Commands

| Command | Description |
|---|---|
| `npm run dev` | Start both Vite dev server and Express backend |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | Express only (tsx watch) |
| `npm run build` | TypeScript check + Vite production build |

### Server API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/process` | SSE stream -- runs the full pipeline for a URL or topic |
| POST | `/api/classify` | Classify a user post into the existing layout |
| POST | `/api/narrate` | Ask the Narrator a question about the layout |
| GET | `/api/health` | Health check |

### Key Data Types

- `RawPost` -- minimal post data from Reddit or generator
- `EnrichedPost` -- post with all Cartographer metadata
- `CosmosPost` -- enriched post with 3D position `[x, y, z]`
- `CosmosLayout` -- the complete layout (posts, clusters, gaps, bridge posts, metadata)
- `Cluster` -- group of related posts with center position and summary
- `Gap` -- identified missing perspective with position and description
- `Relationship` -- directional link between posts with type, strength, and reason

### Project Structure

```
cosmos/
  server/
    index.ts                  # Express server entry
    routes/
      process.ts              # SSE pipeline endpoint + file cache
      classify.ts             # Post classification endpoint
      narrate.ts              # Narrator query endpoint
    .cache/                   # Local file cache (gitignored)
  src/
    App.tsx                   # Root component, state machine (loading -> experience)
    main.tsx                  # React entry point
    components/
      CosmosExperience.tsx    # Main 3D scene orchestrator
      ControlPanel.tsx        # Scene settings UI
      ComposeOverlay.tsx      # New post / reply modal
      DetailPanel.tsx         # (Legacy) detail side panel
      MapMode/
        Canvas3D.tsx          # Three.js canvas, camera, orbit controls
        PostCard3D.tsx        # 3D card component (compact + expanded)
        EdgeNetwork.tsx       # Relationship lines between posts
        AmbientDust.tsx       # Floating particle atmosphere
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
        CalibrationScreen.tsx # Gaze calibration
        CameraConsent.tsx     # Camera permission request
        PerceptionDebug.tsx   # Debug overlay for gaze/face tracking
        ConstellationCard.tsx
        GestureHints.tsx
        LiveMutation.tsx
        NarratorSheet.tsx
      shared/
        EmotionPalette.ts     # Color constants for emotions, edges, UI
    hooks/
      useCosmosData.ts        # SSE client for pipeline data
      useCardNavigation.ts    # Card navigation state
      useSwipeHistory.ts      # Swipe interaction tracking
      useCameraFly.ts         # Camera animation
      useReadMapBlend.ts      # Read/Map mode blending
      useGazeTracking.ts      # WebGazer integration
      useFusedInput.ts        # Gaze + face + mouse fusion
      useUserPosition.ts      # User position in 3D space
      useAdaptiveModel.ts     # Behavioral pattern learning
      useGazeCardFeedback.ts  # Gaze-based card interaction
    lib/
      types.ts                # All TypeScript interfaces
      orchestrator.ts         # Pipeline orchestrator
      cache.ts                # Firestore cache client
      reddit.ts               # Reddit API fetcher
      demoData.ts             # Demo/fallback data
      antiEchoChamber.ts      # Echo chamber detection
      gazeFeatures.ts         # Gaze feature extraction
      gazeZones.ts            # Gaze zone classification
      faceSignals.ts          # Face expression signals
      fusionLayer.ts          # Multi-modal intent fusion
      adaptiveModel.ts        # User behavior model
      agents/
        base.ts               # Anthropic SDK wrapper + JSON parser
        generator.ts          # Community discussion generator
        cartographer.ts       # Post enrichment agent
        architect.ts          # Spatial layout agent
        classifier.ts         # Single-post classifier
        narrator.ts           # Narrator / guide agent
```

---

*Built for the Anthropic Hackathon, February 2026.*
