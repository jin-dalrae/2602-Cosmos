# 08 -- Performance

## Intent

Smooth browsing is the #1 priority. Performance isn't about benchmarks -- it's about feel. If the user says "it feels sticky," something is wrong regardless of what the profiler says.

---

## Visibility Culling

Only render cards within the viewing cone:

| Zone | Angle from look direction | Behavior |
|------|--------------------------|----------|
| Full | 0-35deg | opacity 1.0 |
| Fade | 35-55deg | linear fade 1->0 |
| Culled | 55deg+ | not rendered |

**Decision:** Tightened from 45-65deg to 35-55deg. Fewer DOM nodes = smoother dragging.

Selected, browsed, and gaze-highlighted posts always render at full opacity.

## Card Rendering

| Optimization | Detail |
|-------------|--------|
| React.memo | Custom comparator -- only re-renders on meaningful prop changes |
| Visibility quantization | Opacity quantized to 5 steps (0.2 increments) -- fewer re-renders |
| CSS containment | `contain: layout style paint` isolates card repaint |
| will-change | `will-change: opacity, transform` promotes to GPU layer |
| No animated box-shadows | Removed -- expensive composite operation |

## Camera State Updates

- Camera itself runs at 60fps via `useFrame` (always smooth)
- React state updates (for visibility culling) throttled to ~40fps (25ms interval)
- Wrapped in `startTransition` for non-blocking renders

**Decision:** Originally 100ms (~10fps). Cards popped in/out with visible delay. Reduced to 25ms (~40fps) -- much smoother.

## Drag Responsiveness

| Parameter | Value | Why |
|-----------|-------|-----|
| Drag threshold | 3px | 5px had noticeable dead zone |
| Drag speed | 0.004 | Responsive without being twitchy |
| Card transitions | 0.15s | Fast enough to not feel heavy |

## Canvas Settings

| Setting | Value |
|---------|-------|
| DPR | `[1, 1.5]` (not full retina) |
| Performance hint | `min: 0.5` -- R3F auto-reduces quality under load |
| Particle count | 150 (reduced from 300) |

## DOM Pressure

Each card is a real DOM element (drei `<Html>`) projected into 3D. More visible cards = more DOM manipulation per frame.

Mitigations:
- Tight visibility cone (fewer cards rendered)
- React.memo prevents unnecessary re-renders
- CSS containment isolates repaint boundaries
- Quantized opacity reduces state update frequency

## Key Files

- `src/components/CosmosExperience.tsx` -- culling logic, camera throttle
- `src/components/MapMode/PostCard3D.tsx` -- memo comparator, CSS perf
- `src/components/MapMode/Canvas3D.tsx` -- drag threshold, canvas settings
