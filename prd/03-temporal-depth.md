# 03 -- Temporal Depth

## Intent

Posts age. Older discussions shouldn't disappear, but they should recede -- like stars further away in the sky. The idea: "posts of past could be in the more outer sphere, with a bit of shade."

Scrolling smoothly rotates the visual ordering of cards by time. No positions change, no discrete jumps -- just a continuous shift of which time period is in focus.

**Key insight:** "If the card is already ordered by their timestamps, do we need separate layers?" -- No. Continuous ordering is more natural than discrete shells.

---

## Rank-Based Age Ordering

Every post gets an evenly-spaced `ageNorm` value based on its **rank** in the timestamp order:

- Posts sorted by `created_at` (newest first)
- `ageNorm = rank / totalPosts` -- evenly distributed across [0, 1]
- This ensures every card has its own distinct slot in the rotation cycle

**Why rank-based, not raw time?** With raw timestamps, posts from the same day cluster at nearly identical values. Scrolling would rapidly flicker between them. Rank-based spacing guarantees each card gets visited in order.

## Fog Effect (Visual Ordering)

Cards don't move when you scroll -- only their visual prominence changes. The scroll shifts which time period is "in focus":

```
depthOffset = ageNorm - timeScroll  (circular)
fogDistance = abs(depthOffset)
ageFade = max(0.6, 1.0 - fogDistance * 0.6)
```

- Circular distance: wraps around seamlessly (depthOffset clamped to [-0.5, 0.5])
- At focal point: full brightness
- Furthest from focal point: 60% brightness (subtle, not dramatic)
- Applied as CSS `brightness(ageFade)` filter

**Decision:** Light fog, not heavy shading. The dimming should be subtle -- "a bit of shade" between the cards, not dramatic darkening. Cards are always readable.

**Exception:** Selected (open) cards always show at full brightness regardless of their position in the rotation.

## Time Scrolling

- **Regular two-finger scroll** rotates through the time ordering
- Slow, deliberate speed: `Math.sign(raw) * Math.min(Math.abs(raw) / 400, 0.03)`
- **Wraps around endlessly** -- no start or end, continuous cycling through all posts
- Every card is visited in order, one at a time

**Previous approaches (removed):**
1. Ctrl+wheel for discrete layer switching (0/1/2) -- discrete jumps broke the spatial metaphor
2. Angular rotation (shifting card theta) -- moved cards around the sphere, user only wanted visual ordering
3. Radial depth (changing card radius) -- changed distances, user only wanted ordering
4. Fast scroll speed -- caused flickering between clustered cards

## Pinch Zoom (Separate Gesture)

Pinch-to-zoom (ctrl+wheel / two-finger pinch) is **separate** from time scrolling:

- Pinch → adjusts FOV (30°–110°) to zoom into/out of the space
- Scroll → rotates through time ordering
- Browser native zoom is blocked so UI elements stay in place

## Z-Ordering

Cards are z-ordered by their circular distance from the focal point:

- Closest to focal point → highest z-index → visually on top
- Farthest from focal point → lowest z-index → visually behind
- Selected card: always z-index 10000 (on top of everything)

## Spherical Position Preservation

Posts keep their same theta/phi (subject position) regardless of time scrolling. Scrolling only changes brightness and stacking order -- no card moves. A post about "housing" is always in the same direction on the sphere.

## Timestamps

- `created_at` field (ISO 8601) on every CosmosPost
- Displayed as relative time ("3d ago", "2mo ago") via `formatTimeAgo()`
- Shown next to author name in cards, detail panel, and list view

## Key Files

- `src/components/CosmosExperience.tsx` -- ageNormByPost (rank-based), timeScroll state, fog calculation, ageNormMap
- `src/components/MapMode/PostCard3D.tsx` -- ageFade prop, brightness filter, zLayer prop
- `src/components/MapMode/Canvas3D.tsx` -- WheelHandler (scroll vs pinch split), FovZoom
- `src/lib/timeFormat.ts` -- formatTimeAgo utility
- `src/lib/types.ts` -- created_at on CosmosPost
