# 02 -- Navigation & Interaction

## Intent

**Smooth browsing is the most important trait.** Every parameter -- drag speed, animation duration, update rate, threshold -- exists to make the experience feel fluid. If something feels "sticky," it's a bug.

The browsing experience should feel like naturally looking around a room, not operating a machine.

---

## Drag Rotation

- Screen-space quaternion rotation (horizontal around world Y, vertical around camera right vector)
- Avoids gimbal lock near poles
- FPS-style: drag right = look left, drag up = look down
- Drag speed: `0.004` (tuned for responsiveness)
- Drag threshold: `3px` before drag kicks in (lowered from 5px -- the dead zone was making it feel sticky)
- Damping: `0` default (no momentum -- panning, not spinning)

## Focus Animation

When you click a card, the camera smoothly rotates to center it.

- Ease-out interpolation: faster when far, decelerates as it arrives
- Lerp factor: `0.08 + min(dist, 1) * 0.10` (adaptive)
- This should feel like a smooth glide, not a snap

## Click Behavior

- Click compact card -> select it, camera rotates to center, card expands
- Click inside expanded card -> no deselect (you're reading)
- Click empty canvas -> close any open card
- Random post selected on first load so user sees content immediately

## Drag Passthrough

Cards are DOM elements overlaying the 3D canvas. When you drag on a card:

1. Record start position on pointerdown
2. If displacement > 3px, set `pointerEvents: none` and forward to canvas
3. On pointerup, restore pointer events

This lets you drag from anywhere, even over cards.

## Auto-Navigate

When dragging away from an open card:

1. Card stays open during drag (doesn't collapse until drag ends)
2. After pointer release, nearest card to look direction auto-selects (within 30deg)
3. Previous card excluded from nearest-search

## Four Interaction Modes

| Mode | Card behavior | Sidebar | Camera control |
|------|--------------|---------|----------------|
| **Normal** | Expand in-place (0.15s transition) | None | Drag + focus animation |
| **Browse** | Stay compact, glow highlight | DetailPanel shows nearest post | Drag only, no focus |
| **Gaze** | Expand in-place | None | Head-pose steering + auto-open |
| **VR** | Expand in-place | None | WebXR reference space — headset pose owns the camera |

### Browse Mode

- Toggle via "Drag Mode" button (top-right)
- Nearest post tracked by dot product at ~40fps
- 40deg threshold for "nearest" detection
- Sidebar slides in from left (0.18s, framer-motion)
- Content cross-fades when switching posts (150ms delay + 0.15s transition)
- No card expansion -- only sidebar updates
- Entering browse mode clears any selected card
- Exiting browse mode clears sidebar

### VR Mode (WebXR)

- Toggle via "VR" button (top-right). Button auto-hides on devices that don't pass `navigator.xr.isSessionSupported('immersive-vr')`.
- Implementation: `@react-three/xr` v6 with a shared `createXRStore()` singleton (`src/lib/xrStore.ts`)
- Scene wrapped in `<XR store={xrStore}>` inside `Canvas3D.tsx`
- When `useXR((s) => s.session)` reports an active session, `RotationCamera` and `FovZoom` skip their `useFrame` so they don't fight the WebXR reference space pose
- Camera stays at origin (matches design principle #4 -- "the user is inside"). Headset rotation drives orientation; physical room-scale walking is not used.
- Drag, gaze, and time-scroll inputs are not used while in VR -- the headset pose IS the input.
- Production HTTPS is required (WebXR refuses on `http://`); cosmosweb.web.app serves over HTTPS via Firebase Hosting.

## Smoothness Tuning History

These values were tuned iteratively based on feel:

| Parameter | Final value | Why |
|-----------|-------------|-----|
| Drag threshold | 3px | 5px had a noticeable dead zone |
| Card transition | 0.15s | 0.35s felt heavy, 0.2s was OK but 0.15s felt best |
| Camera update rate | 25ms (~40fps) | 100ms made cards pop in late |
| Visibility cone | 35-55deg | Fewer cards = less DOM pressure = smoother |
| Focus lerp | 0.08-0.18 | Smooth glide, not snappy |

## Key Files

- `src/components/MapMode/Canvas3D.tsx` -- RotationCamera, drag handling, focus animation, `<XR>` wrapper
- `src/components/MapMode/PostCard3D.tsx` -- click, drag passthrough, transitions
- `src/components/CosmosExperience.tsx` -- mode switching, auto-navigate, nearest-post tracking
- `src/components/DetailPanel.tsx` -- browse sidebar
- `src/components/UI/VRButton.tsx` -- WebXR support detection + enter/exit toggle
- `src/lib/xrStore.ts` -- shared `createXRStore()` singleton
