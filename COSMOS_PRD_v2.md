# COSMOS — Product Requirements Document v2
## Planetarium Spatial Model

**Version:** 2.0
**Updated:** Feb 14, 2026
**Based on:** 1-cosmos-prd-final.md + session refinements

---

## 1. SPATIAL MODEL — Planetarium (Inner-Sphere)

The user stands inside a sphere, looking outward at articles arranged on the dome surface — like a planetarium or snow globe.

### 1.1 Two Spheres

| Sphere | What | Radius |
|--------|------|--------|
| **Outer (Article) Sphere** | Articles/posts live here | 16–24 units |
| **Inner (User) Sphere** | Camera orbits here | `ARTICLE_RADIUS - cameraDistance` |

The **gap** between the two spheres is the **camera distance** — adjustable via slider (2–18, default 10). Smaller gap = closer to articles.

### 1.2 Article Position on the Outer Sphere

Each article is a unique vector on the sphere surface:

| Dimension | Maps to | Range |
|-----------|---------|-------|
| **theta** (longitude) | Opinion spectrum | 0–360° |
| **phi** (latitude) | Abstraction level | 30°–150° |
| **radius** | Article age | 16 (newest, closest) – 24 (oldest, furthest) |

- **Distance** between articles on the sphere surface = how different/dissimilar they are
- **Direction** = what kind of difference (opinion vs abstraction)
- **Depth from user** (radius) = how old the article is. Newer articles are closer to the user, older ones further away
- **Clusters** form visible constellations — groups of semantically related articles
- **Edges** between related posts look like constellation lines

### 1.3 Dispersion

After computing positions, a repulsion pass pushes articles apart so they don't visually stack. Minimum angular separation ~7° (0.12 rad), 8 iterations of pairwise repulsion.

### 1.4 Camera Model

- Camera lives on the **inner sphere**, looking **outward** toward the article sphere
- **Drag** moves the camera along the inner sphere surface (custom rotation, not OrbitControls)
- **Scroll** adjusts FOV (30°–100°, default 60°) — dolly zoom effect without moving camera
- **Camera distance slider** changes the inner sphere radius (gap between spheres)
- Camera always looks outward (away from origin, toward articles)
- Damping provides momentum after releasing drag

### 1.5 Navigation

- **Click a card** → opens it, camera animates to face it on the inner sphere
- **Drag while card is open** → closes current card, slides camera, opens nearest card in new view direction
- **Random post selected on first load** so user sees content immediately

---

## 2. COORDINATE SYSTEM

### 2.1 Architect Output (Spherical)

The Architect agent outputs positions as `[theta_deg, phi_deg, r_offset]`:

- `theta_deg`: 0–360 (longitude, opinion spectrum)
- `phi_deg`: 30–150 (latitude, abstraction)
- `r_offset`: -1 to +1 (fine depth adjustment)

Cluster centers and gap positions also use `[theta_deg, phi_deg, 0]`.

### 2.2 Conversion (Orchestrator)

The orchestrator converts spherical to cartesian:

```
theta_rad = theta_deg * π / 180
phi_rad = phi_deg * π / 180
age_ratio = post_index / (total - 1)
radius = RADIUS_MIN + age_ratio * (RADIUS_MAX - RADIUS_MIN) + r_offset

x = radius * sin(phi) * cos(theta)
y = radius * cos(phi)
z = radius * sin(phi) * sin(theta)
```

### 2.3 Partial Layout (Before Architect)

During incremental loading, embedding hints map directly:

- `opinion_axis (-1..1)` → theta (0..2π)
- `abstraction (-1..1)` → phi (~30°..150°)
- Post index → radius (age proxy)

---

## 3. VISUAL ELEMENTS

### 3.1 Article Cards

- Positioned on outer sphere surface
- HTML cards rendered via drei `<Html>` — always face the camera (billboard)
- `distanceFactor` scales with camera-to-card distance (~20 units)
- Selected card: z-index 10000, expanded view with full content
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
| **Drag** | Move camera on inner sphere to look around |
| **Click card** | Select/open article |
| **Scroll** | Zoom FOV (30°–100°) |
| **Camera Distance slider** | Adjust gap between user and articles (2–18) |
| **FOV slider** | Field of view (30–100°) |
| **Damping slider** | Rotation momentum (0–0.2) |

---

## 5. KEY FILES

| File | Role |
|------|------|
| `src/lib/agents/architect.ts` | Architect prompt — spherical coordinate system |
| `src/lib/orchestrator.ts` | Position conversion (spherical→cartesian), age-based radius, dispersion |
| `src/components/MapMode/Canvas3D.tsx` | Custom SphereCamera (inner sphere, looks outward), FOV zoom |
| `src/components/ControlPanel.tsx` | Scene settings (FOV, cameraDistance, damping) |
| `src/components/CosmosExperience.tsx` | Layout, post selection, auto-navigate, angular distance |
| `src/components/MapMode/AmbientDust.tsx` | Background star particles on dome |
| `src/components/MapMode/PostCard3D.tsx` | Card rendering, drag passthrough |
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
