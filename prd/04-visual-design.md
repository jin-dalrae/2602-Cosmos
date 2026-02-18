# 04 -- Visual Design

## Intent

Warm, dark, human. Not a cold tech demo. The aesthetic is a planetarium at dusk -- rich, atmospheric, inviting. You should want to spend time here.

---

## Skybox

A full-sphere shader background (radius 500) with rainbow hue mapped to horizontal angle.

**Design decisions from conversation:**
- Started as a sunset gradient (indigo to amber). Worked but felt flat -- no directional meaning.
- Switched to rainbow HSL hue rotation by theta. Now different directions on the sphere have different colors, giving spatial orientation cues.
- Wisps/nebula noise was added then removed -- "i don't want the wisps"
- Poles are brighter, equator is darker: "rainbow color should get lighter by it goes to pole"
- Subtle static white noise grain (0.04 intensity) adds film-like texture

**Current shader parameters:**
- Hue: `theta / (2*PI) + 0.5` (full rainbow around horizontal)
- Brightness: `0.22 + poleBlend * 0.20` (darker at equator, lighter at poles)
- Saturation: `0.42 * (1 - poleBlend * 0.45)` (more saturated at equator, paler at poles)
- North pole: fades to warm white `(0.85, 0.83, 0.80)` -- gives orientation, feels like looking at a bright sky
- South pole: fades to deep navy `(0.08, 0.08, 0.18)` -- grounding, like looking at deep water
- Pole blend: `smoothstep(0.4, 1.0, absPole)` -- starts blending ~65deg from equator
- White noise: `(grain - 0.5) * 0.04`

## Theme: Dark & Warm

| Element | Color |
|---------|-------|
| Background | `#262220` (warm dark walnut) |
| Deeper background | `#1C1A18` |
| Canvas background | `#1E1914` |
| Primary accent | `#D4B872` (gold) |
| Primary text | `#F5F2EF` (cream) |
| Secondary text | `#9E9589` (warm gray) |
| Muted text | `#6B6560` |
| Borders | `#3A3530` |
| Overlay | `rgba(38, 34, 32, 0.85)` with `backdrop-filter: blur` |

## Card Design

Paper-like rectangles with a 4px emotion-colored accent strip on the left edge.

**Compact (not selected):**
- 300px wide, 200px tall
- Title (core_claim), author, timestamp, emotion tag, post type, vote controls
- Georgia serif for title
- system-ui sans-serif for metadata

**Expanded (selected):**
- 550px wide, up to 600px tall (scrollable)
- Full content, assumptions, themes, replies, connected posts, reply button
- `distanceFactor` changes: 50 (compact) vs 75*articleScale (expanded)

**Transitions:** `transform 0.15s, opacity 0.15s, filter 0.15s`

## Emotion Color Palette

| Emotion | Accent | Card bg | Text |
|---------|--------|---------|------|
| passionate | `#E8836B` | `#2A2018` | `#F5E6D8` |
| analytical | `#8FB8A0` | `#1E2420` | `#E8F0EC` |
| frustrated | `#C47A5A` | `#2A1E18` | `#F5E0D0` |
| hopeful | `#D4B872` | `#282418` | `#F5F0E0` |
| fearful | `#9B8FB8` | `#221E28` | `#EDE8F5` |
| sarcastic | `#A3A07E` | `#242420` | `#F0F0E8` |
| neutral | `#B8B0A8` | `#242220` | `#F0EDE8` |
| aggressive | `#A85A4A` | `#2A1C18` | `#F5DDD0` |
| empathetic | `#D4A0A0` | `#2A2020` | `#F5E8E8` |

## Edge / Relationship Colors

| Relationship | Color |
|--------------|-------|
| agrees | `#8FB8A0` (sage) |
| disagrees | `#C47A5A` (terracotta) |
| builds_upon | `#D4B872` (gold) |
| tangent | `#9E9589` (warm gray) |
| rebuts | `#A85A4A` (deep terracotta) |

## Typography

- Headings / card titles: Georgia, "Times New Roman", serif
- UI text / labels / metadata: system-ui, sans-serif

## Ambient Dust

- 150 particles on sphere surface (radius 26-32)
- Warm gold/cream colors, slowly rotating
- Creates planetarium dome backdrop
- Subtle Y drift (sine wave, 0.2 units amplitude)

## Key Files

- `src/components/MapMode/Canvas3D.tsx` -- NebulaSky shader
- `src/components/shared/EmotionPalette.ts` -- all color constants
- `src/components/MapMode/PostCard3D.tsx` -- card rendering
- `src/components/MapMode/AmbientDust.tsx` -- particle atmosphere
