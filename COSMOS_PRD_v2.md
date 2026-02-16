# COSMOS — Product Requirements Document v2
## Planetarium Spatial Model + Head-Pose Navigation

**Version:** 2.2
**Updated:** Feb 16, 2026
**Based on:** 1-cosmos-prd-final.md + full implementation refinements

---

## 1. SPATIAL MODEL — Planetarium (Inner-Sphere)

The user stands inside a sphere, looking outward at articles arranged on the dome surface — like a planetarium or snow globe.

### 1.1 Fixed User Position

**The user's camera is ALWAYS fixed at the origin (0, 0, 0).** This is a hard constraint:

- The camera never moves from (0, 0, 0)
- All navigation is done by **rotating** the view direction, not moving the camera
- Scroll adjusts FOV (zoom), not camera position
- The "Overview" control tilts the viewing elevation (phi), not camera distance
- There is no orbit mode, no pull-back, no external view — the user is always inside the sphere

### 1.2 Article Sphere

| Property | Value |
|----------|-------|
| **Sphere radius** | 150 units (fixed, animated via group scale) |
| **Article positions** | On the sphere surface, placed by the Architect agent |
| **Normalization** | All positions normalized to unit sphere; group scale = radius |
| **Pole clamping** | phi clamped to [30°, 150°] — no articles at poles |

### 1.3 Article Position on the Sphere

Each article is a unique vector on the sphere surface:

| Dimension | Maps to | Range |
|-----------|---------|-------|
| **theta** (longitude) | Opinion spectrum | 0–360° |
| **phi** (latitude) | Abstraction level | 30°–150° |
| **r_offset** | Subtle depth variation | -1 to +1 (±5% of radius) |

- **Distance** between articles on the sphere surface = how different/dissimilar they are
- **Direction** = what kind of difference (opinion vs abstraction)
- **Clusters** form visible constellations — groups of semantically related articles
- **Edges** between related posts look like constellation lines

### 1.4 Dispersion Rules

- Cluster centers must be at least **60°** apart
- Individual posts within **25–35°** of their cluster center
- Use the FULL range of theta (0–360°) and phi (30–150°)
- After computing positions, a **15-iteration repulsion pass** pushes articles apart (minimum ~25° angular separation)
- **Re-clamp pass** after repulsion ensures no posts pushed toward poles

### 1.5 Camera Model

- Camera is **fixed at origin (0, 0, 0)** — never moves
- **Drag** rotates the view direction using **screen-space quaternion rotation** (horizontal around world Y axis, vertical around camera's right vector). Avoids gimbal lock near poles.
- **Drag direction** is FPS-style: drag right → look left, drag up → look down
- **FOV:** 78° default (wider for better article dispersion)
- **Damping:** 0 (no momentum — panning, not spinning)
- Camera always looks outward (away from origin, toward articles)
- **Focus animation:** When a post is selected, camera smoothly rotates to center it (lerp factor 0.025)

### 1.6 Navigation

- **Click a card** → opens it, camera smoothly animates to face it
- **Drag while card is open** → closes current card, slides camera, opens nearest card in new view direction
- **Random post selected on first load** so user sees content immediately
- **Head-pose gaze mode** → hands-free navigation (see Section 7)

### 1.7 Browse Mode

A toggle mode where dragging around the sphere shows the nearest post's content in a **fixed 2D sidebar panel** (DetailPanel) instead of expanding cards in 3D. Reduces eye fatigue since compact cards stay compact on the sphere — only the sidebar content changes.

- **Toggle:** "Browse" button in top-right (gold border when active, muted when inactive)
- **Nearest-post tracking:** Every 100ms during camera rotation, computes the look direction and finds the post with the highest dot product (within 40° threshold). Updates the sidebar to show that post.
- **3D expansion suppressed:** In browse mode, no cards expand. The browsed card gets a subtle glow highlight (`isBrowsed` prop on PostCard3D).
- **Sidebar:** Reuses `DetailPanel` component (right-side panel, 420px wide)
- **Handler overrides:**
  - `handleOrbitEnd` early-returns (no auto-select logic)
  - `handleSelect` updates `browsedPostId` instead of `selectedPostId`
- **Entering browse mode:** clears `selectedPostId`
- **Exiting browse mode:** clears `browsedPostId`

---

## 2. COORDINATE SYSTEM

### 2.1 Architect Output (Spherical)

The Architect agent outputs positions as `[theta_deg, phi_deg, r_offset]`:

- `theta_deg`: 0–360 (longitude, opinion spectrum)
- `phi_deg`: 30–150 (latitude, abstraction)
- `r_offset`: -1 to +1 (fine depth adjustment, ±5% of sphere radius)

Cluster centers and gap positions also use `[theta_deg, phi_deg, 0]`.

### 2.2 Conversion (Orchestrator)

The orchestrator converts spherical to cartesian using the architect's refined_positions:

```
theta_rad = theta_deg * π / 180
phi_rad = phi_deg * π / 180
radius = ARTICLE_RADIUS * (1 + r_offset * 0.05)

x = radius * sin(phi) * cos(theta)
y = radius * cos(phi)
z = radius * sin(phi) * sin(theta)
```

Fallback: if a post is missing from architect output, Fibonacci spiral placement is used.

### 2.3 Position Normalization

All post positions are normalized to unit sphere in CosmosExperience, then scaled by group transform:

```
direction = position / |position|
unit_position = direction * 1.0    // unit sphere
// Canvas3D ScaledSphere group scales to actual radius
```

Pole clamping: `|y| > cos(30°)` → clamp y, redistribute to xz plane.

---

## 3. VISUAL ELEMENTS

### 3.1 Article Cards

- Positioned on sphere surface (radius 150 via group scale)
- HTML cards rendered via drei `<Html sprite>` — always face the camera
- `distanceFactor={50}` scales cards with distance
- Compact: 220px wide, 160px tall
- Selected: 480px wide, up to 450px tall with full content
- Selected card: z-index 10000
- UI overlay (controls, buttons): z-index 10001, always above cards
- **Performance:** `React.memo` with custom comparator — visibility quantized to 5 steps (0, 0.2, 0.4, 0.6, 0.8, 1.0)
- **CSS:** `will-change: opacity, transform`, `contain: layout style paint` for GPU compositing

### 3.2 Visibility Culling

Articles not in the viewing cone are not rendered:

| Zone | Angular distance from look direction | Opacity |
|------|--------------------------------------|---------|
| Inner cone | 0°–45° | 1.0 (fully visible) |
| Fade zone | 45°–65° | Linear fade 1→0 |
| Culled | 65°+ | Not rendered (0) |

Selected, browsed, and gaze-highlighted posts always render at full opacity regardless of angle.

### 3.3 Constellation Edges

- Straight lines between related posts through the sphere interior
- Only drawn between angularly nearby posts (dot product > 0.5, ~60° max)
- Color-coded by relationship type (agrees, disagrees, builds_upon, tangent, rebuts)

### 3.4 Ambient Dust (Background Stars)

- **150 particles** on sphere surface at radius 26–32 (beyond outermost articles)
- Warm gold/cream colors, slowly rotating
- Creates the planetarium dome backdrop
- Subtle Y drift (sine wave, 0.2 units amplitude)

### 3.5 Sunset Sky

- Full-sphere shader background (radius 500)
- Gradient: deep indigo (top) → dusty plum → warm rose → amber (horizon) → warm sand → dark earth (bottom)
- `THREE.BackSide` rendering, no depth write

---

## 4. CONTROLS

| Control | Action |
|---------|--------|
| **Drag** | Rotate view direction (screen-space quaternion rotation) |
| **Click card** | Select/open article (in browse mode: updates sidebar) |
| **Browse toggle** | Toggle browse mode (sidebar shows nearest post) |
| **Gaze toggle** | Enable/disable head-pose tracking mode |
| **Overview slider** | Tilt viewing elevation |
| **FOV slider** | Field of view (30–90°, default 78°) |
| **Damping slider** | Rotation momentum (default 0 — no coast) |

---

## 5. INPUT SYSTEM — Head-Pose Tracking

### 5.1 Architecture

The input system uses the webcam for **head-pose detection** via MediaPipe FaceLandmarker. WebGazer was removed — only head pose (yaw/pitch from face transformation matrix) is used, not pixel-level gaze estimation.

```
Camera stream (getUserMedia)
    ↓
MediaPipe FaceLandmarker (GPU delegate)
    ↓
4x4 facial transformation matrix
    ↓
Extract yaw (atan2) + pitch (asin) → normalize to [-1, +1]
    ↓
Auto-calibration offset subtracted
    ↓
EMA smoothing (α=0.5)
    ↓
Position-based camera steering + article auto-open
```

### 5.2 Camera Stream (useGazeTracking)

Simple `getUserMedia` wrapper — no ML, no WebGazer:
- Requests `{ facingMode: 'user', width: 640, height: 480 }`
- Returns `{ videoStream, isTracking, start, stop }`
- Stream passed to `useHeadPose` for MediaPipe processing

### 5.3 Head Pose Detection (useHeadPose)

| Parameter | Value |
|-----------|-------|
| **Detection FPS** | 30 (throttled via `requestAnimationFrame`) |
| **Smoothing** | EMA with α = 0.5 |
| **Normalization** | ±20° head turn = full [-1, +1] range |
| **Auto-calibration** | First 30 frames (~1s) averaged as neutral offset |
| **Model** | `face_landmarker/float16` via CDN |
| **GPU delegate** | Enabled |

**Auto-calibration:** The first ~1 second of face readings are collected. Their average yaw/pitch becomes the neutral offset. All subsequent readings subtract this offset, so the user's natural resting head position = center (0, 0). No manual calibration step needed.

### 5.4 Position-Based Steering Model

Head position maps to an **angular offset** from a base rotation — NOT a velocity/joystick model. Holding your head still does NOT cause continuous rotation.

```
baseRotation = last drag endpoint or focus animation endpoint
headOffset = applyAxis(headPose.yaw) × maxOffset    // ±25° max
targetRotation = baseRotation + headOffset
camera lerps toward targetRotation at 0.06/frame
```

| Parameter | Value |
|-----------|-------|
| **Max angular offset** | ±25° from base rotation |
| **Dead zone** | 0.15 (ignore resting face micro-movements) |
| **Lerp speed** | 0.06 per frame |
| **Base rotation sync** | Updated after drag release and focus animation |

The dead zone prevents resting face position from causing drift. The position model means: turn head right → camera looks right of base; return head to center → camera returns to base.

### 5.5 Gaze Mode States

```
'off' → 'consent' → 'active'
         ↑                ↓
         └── toggle off ──┘
```

- **off:** No camera, no tracking
- **consent:** Shows CameraConsent overlay (explains camera usage, privacy)
- **active:** Camera streaming, head pose tracked, articles auto-open

No calibration step — consent goes directly to active. Auto-calibration happens silently during the first second.

### 5.6 Article Auto-Open (Gaze Browse)

When gaze mode is active, the system automatically opens the nearest article based on head direction:

**GAZE_LEAD offset (45°):** The article search looks **ahead** of the camera in the direction the head is pointing, not just at the current view center. This feels natural — you look toward something and it opens.

```
gazeTheta = cameraTheta + headPose.yaw × GAZE_LEAD
gazePhi = cameraPhi - headPose.pitch × GAZE_LEAD
// Find nearest post to (gazeTheta, gazePhi) within 40° cone
```

**Timing rules:**
| Parameter | Value | Purpose |
|-----------|-------|---------|
| `MIN_DISPLAY_MS` | 3,000ms | Minimum time an article stays open |
| `AWAY_CLOSE_MS` | 500ms | How long attention must move away before switching |

**Switching logic:**
1. No article open → open nearest immediately
2. Same article → reset away timer (attention returned)
3. Different article, within min display time → keep current, don't switch
4. Different article, past min display time → start 500ms away timer → switch

### 5.7 Reading Pause

Camera rotation is **paused** while an article is selected (`selectedPostId` set):
- `gazeSteer` prop is set to `null` when `selectedPostId` exists
- The user can read without the sphere moving

**Mouse hover freeze:** When the mouse hovers over an **open (selected)** article card, gaze switching is paused (`mouseOverCardRef`). Mouse on compact cards does NOT trigger this — only expanded articles.

### 5.8 Face Preview

- **Position:** Fixed, bottom-left (left: 16px, bottom: 20px)
- **Size:** 320×240, border-radius 16px
- **Opacity:** 1.0 (fully visible)
- **Mirror:** CSS `scaleX(-1)` for natural mirror effect
- **Toggle:** Closeable, only shown when gaze mode active

### 5.9 Privacy

- MediaPipe FaceLandmarker runs **100% client-side**
- No video frames leave the browser
- No video is recorded
- Only derived features (yaw, pitch) used for steering
- Camera preview visible to user at all times
- Toggle on/off anytime
- WebGazer removed entirely — no pixel-level gaze data collected

---

## 6. PERFORMANCE OPTIMIZATIONS

### 6.1 Rendering

| Optimization | Detail |
|-------------|--------|
| **Canvas DPR** | Capped at `[1, 1.5]` (not full retina) |
| **Performance hint** | `performance={{ min: 0.5 }}` — R3F auto-reduces quality under load |
| **Particle count** | 150 (reduced from 300) |
| **Camera state updates** | Throttled to ~10fps via 100ms debounce |
| **startTransition** | Camera rotation state updates wrapped in `startTransition` for non-blocking |

### 6.2 Card Rendering

| Optimization | Detail |
|-------------|--------|
| **React.memo** | Custom comparator skips re-render unless meaningful props change |
| **Visibility quantization** | Opacity quantized to 5 steps (0.2 increments) — fewer re-renders |
| **CSS containment** | `contain: layout style paint` isolates card repaint from siblings |
| **will-change** | `will-change: opacity, transform` promotes to GPU layer |
| **No box-shadow transitions** | Removed animated box-shadows (expensive composite) |

### 6.3 Cone Culling

- Cards beyond 65° from look direction are not rendered at all
- Reduces DOM node count significantly (typically 30-50% of total posts visible)
- Selected/browsed/highlighted posts exempt from culling

---

## 7. KEY FILES

| File | Role |
|------|------|
| `src/lib/agents/architect.ts` | Architect prompt — spherical coordinate system |
| `src/lib/orchestrator.ts` | Position conversion (spherical→cartesian), Fibonacci fallback |
| `src/components/MapMode/Canvas3D.tsx` | RotationCamera (position-based head steering, focus animation, drag rotation) |
| `src/components/ControlPanel.tsx` | Scene settings (overview, FOV, damping defaults) |
| `src/components/CosmosExperience.tsx` | Layout, position normalization, repulsion, pole clamping, visibility culling, gaze mode, article auto-open, browse mode |
| `src/components/DetailPanel.tsx` | Right-side sidebar for browse mode |
| `src/components/MapMode/AmbientDust.tsx` | Background star particles (150 particles) |
| `src/components/MapMode/PostCard3D.tsx` | Card rendering (React.memo + custom comparator, hover detection) |
| `src/components/MapMode/EdgeNetwork.tsx` | Constellation edge lines |
| `src/hooks/useGazeTracking.ts` | Simple getUserMedia camera stream hook |
| `src/hooks/useHeadPose.ts` | MediaPipe FaceLandmarker head pose (yaw/pitch + auto-calibration) |
| `src/components/UI/FacePreview.tsx` | Bottom-left camera preview (fixed position) |
| `src/components/UI/CameraConsent.tsx` | Camera permission consent overlay |
| `src/components/UI/MiniMap.tsx` | 2D overhead mini-map with camera cone indicator |

---

## 8. TECH STACK

```
Vite + React 19               Frontend bundler + UI framework
React Three Fiber + drei      3D scene (planetarium sphere)
Three.js                      WebGL rendering
framer-motion                 Card animations
@use-gesture/react            Touch/drag handling
MediaPipe FaceLandmarker      Head pose detection (GPU, client-side)
Tailwind CSS v4               Styling
TypeScript                    Throughout (verbatimModuleSyntax)
Anthropic Claude API          All AI agents (Opus 4.6)
Express                       Backend API server
concurrently                  Dev: Vite + Express together
```

**Removed:** WebGazer.js (replaced by MediaPipe FaceLandmarker for head pose only)

---

## 9. AGENT SYSTEM

### 9.1 Platform Agents (5)

| Agent | Called When | Input → Output |
|-------|-----------|----------------|
| **Generator** | User picks a topic (not Reddit) | Topic → synthetic discussion posts |
| **Cartographer** | New thread imported | Raw posts → enriched posts (semantic + DNA + perspective + spatial hints) |
| **Architect** | After Cartographer | All enriched posts → clusters, gaps, 3D positions, perspective labels |
| **Narrator** | User asks question | Layout + question → text + highlights |
| **Classifier** | User adds their take | User text + existing labels → classification + position |

### 9.2 Orchestration

- Cartographer runs in batches of ~30. Batch 1 establishes labels. Batches 2-N run in parallel (max 3 concurrent).
- **SSE streaming:** Progressive layout updates sent to client during pipeline processing
- Architect waits for all batches, runs once, outputs refined positions
- Narrator and Classifier are on-demand

---

## 10. VISUAL DESIGN

### 10.1 Warm Palette

- **Background:** Dark walnut (#262220 → #1C1A18), NOT black
- **Canvas background:** #1E1914
- **Sunset sky:** Multi-stop gradient shader (indigo → plum → rose → amber → sand → earth)

### 10.2 Card Design

Paper-like rectangle with 3px emotion-color strip on left edge. Full content in selected view, compact headline in unselected. Emotion + type tags. Author + upvotes. Warm serif typography (Georgia).

### 10.3 Emotion Colors

| Emotion | Accent |
|---------|--------|
| Passionate | #E8836B |
| Analytical | #8FB8A0 |
| Frustrated | #C47A5A |
| Hopeful | #D4B872 |
| Fearful | #9B8FB8 |
| Sarcastic | #A3A07E |
| Neutral | #B8B0A8 |
| Aggressive | #A85A4A |
| Empathetic | #D4A0A0 |

---

## 11. UNCHANGED FROM v1

Everything not listed above remains as specified in `1-cosmos-prd-final.md`:

- Anti-echo-chamber engine (agree → counterargument, disagree → why others agree)
- Live Mutation (user adds take → classify → materialize on sphere)
- Privacy model (all CV client-side, no video transmitted)
- Argument DNA (trace logical ancestry to root assumptions)
