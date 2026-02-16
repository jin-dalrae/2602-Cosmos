# COSMOS — Product Requirements Document v2
## Planetarium Spatial Model

**Version:** 2.1
**Updated:** Feb 16, 2026
**Based on:** 1-cosmos-prd-final.md + session refinements

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
| **Sphere radius** | 150 units (fixed) |
| **Article positions** | On the sphere surface, placed by the Architect agent |
| **Normalization** | All positions are normalized to radius 150 regardless of source |

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
- After computing positions, a repulsion pass pushes articles apart so they don't visually stack

### 1.5 Camera Model

- Camera is **fixed at origin (0, 0, 0)** — never moves
- **Drag** rotates the view direction (theta + phi)
- **Scroll** adjusts FOV (30°–100°, default 70°) — zoom without moving camera
- **Overview slider** shifts the base elevation angle (phi) from equator to pole
- Camera always looks outward (away from origin, toward articles)
- Damping provides momentum after releasing drag

### 1.6 Navigation

- **Click a card** → opens it, camera animates to face it
- **Drag while card is open** → closes current card, slides camera, opens nearest card in new view direction
- **Random post selected on first load** so user sees content immediately

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

All post positions are normalized to the target sphere radius in CosmosExperience:

```
direction = position / |position|
normalized_position = direction * SPHERE_RADIUS
```

This ensures posts from any source (old data, new data, user posts) sit on the sphere surface.

---

## 3. VISUAL ELEMENTS

### 3.1 Article Cards

- Positioned on sphere surface (radius 150)
- HTML cards rendered via drei `<Html sprite>` — always face the camera as flat rectangles
- `distanceFactor={50}` scales cards with distance
- Compact: 220px wide, 160px tall
- Selected: 480px wide, up to 450px tall with full content
- Selected card: z-index 10000, expanded view
- UI overlay (controls, buttons): z-index 10001, always above cards

### 3.2 Constellation Edges

- Straight lines between related posts through the sphere interior
- Only drawn between angularly nearby posts (dot product > 0.5, ~60° max)
- Color-coded by relationship type (agrees, disagrees, builds_upon, tangent, rebuts)

### 3.3 Ambient Dust (Background Stars)

- 300 particles on sphere surface at radius 26–32 (beyond the outermost articles)
- Warm gold/cream colors, slowly rotating
- Creates the planetarium dome backdrop

---

## 4. CONTROLS

| Control | Action |
|---------|--------|
| **Drag** | Rotate view direction (theta + phi) |
| **Click card** | Select/open article |
| **Scroll** | Zoom FOV (30°–100°) |
| **Overview slider** | Tilt viewing elevation from equator (0) to top pole (1) |
| **FOV slider** | Field of view (30–90°, default 70°) |
| **Damping slider** | Rotation momentum (0–0.2) |

---

## 5. KEY FILES

| File | Role |
|------|------|
| `src/lib/agents/architect.ts` | Architect prompt — spherical coordinate system |
| `src/lib/orchestrator.ts` | Position conversion (spherical→cartesian), Fibonacci fallback |
| `src/components/MapMode/Canvas3D.tsx` | RotationCamera (fixed at origin, looks outward), FOV zoom |
| `src/components/ControlPanel.tsx` | Scene settings (overview, FOV, damping) |
| `src/components/CosmosExperience.tsx` | Layout, position normalization, post selection, auto-navigate |
| `src/components/MapMode/AmbientDust.tsx` | Background star particles on dome |
| `src/components/MapMode/PostCard3D.tsx` | Card rendering (sprite mode), drag passthrough |
| `src/components/MapMode/EdgeNetwork.tsx` | Constellation edge lines |

---

## 6. UNCHANGED FROM v1

Everything not listed above remains as specified in `1-cosmos-prd-final.md`:

- Input system (gaze, face, mouse fusion)
- Agent system (Cartographer, Architect, Narrator, Classifier)
- Orchestration pipeline (batch processing, label extraction)
- Visual design (warm palette, emotion colors, typography)
- Anti-echo-chamber engine
- Adaptive learning model
- Privacy model
- Demo script structure
