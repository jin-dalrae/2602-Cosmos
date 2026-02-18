# 01 -- Spatial Model

## Intent

The core metaphor: you stand inside a planetarium dome, looking outward at a constellation of ideas. Posts aren't in a list -- they're placed in space where their position means something. Distance between posts = how different they are. Direction = what kind of difference.

This isn't a visualization gimmick. The spatial layout IS the primary way to understand a discussion.

---

## Fixed Camera

The camera is always at `(0, 0, 0)`. This is a hard constraint.

- No orbit mode, no pull-back, no external view
- All navigation is rotation, never translation
- This makes the planetarium feel real -- you're inside, not observing from outside

## Article Sphere

| Property | Value |
|----------|-------|
| Sphere radius | 150 units (animated via group scale) |
| Positions | On sphere surface, placed by Architect agent |
| Normalization | All positions normalized to unit sphere; group scale = radius |
| Pole clamping | phi clamped to [30deg, 150deg] -- no articles at poles |

## Position Axes

Each article's position encodes meaning:

| Axis | Maps to | Range |
|------|---------|-------|
| theta (longitude) | Opinion spectrum | 0-360deg |
| phi (latitude) | Abstraction level | 30-150deg |
| r (radius) | Time shell | See [03-temporal-depth.md](./03-temporal-depth.md) |

## Dispersion

- Cluster centers at least 60deg apart
- Posts within 25-35deg of their cluster center
- Use full theta (0-360deg) and phi (30-150deg) range
- 15-iteration repulsion pass pushes posts apart (minimum ~25deg angular separation)
- Re-clamp pass after repulsion keeps posts away from poles

## Coordinate Conversion

Architect outputs spherical `[theta_deg, phi_deg, r_offset]`. The orchestrator converts:

```
theta_rad = theta_deg * pi / 180
phi_rad = phi_deg * pi / 180
radius = ARTICLE_RADIUS * (1 + r_offset * 0.05)

x = radius * sin(phi) * cos(theta)
y = radius * cos(phi)
z = radius * sin(phi) * sin(theta)
```

Fallback: Fibonacci spiral placement for posts missing from architect output.

## Key Files

- `src/components/CosmosExperience.tsx` -- position normalization, repulsion, pole clamping
- `src/lib/orchestrator.ts` -- spherical-to-cartesian conversion
- `src/components/MapMode/Canvas3D.tsx` -- ScaledSphere group, camera
