# SIGGRAPH 2026 Review → Roadmap

Captured from the SIGGRAPH 2026 Poster review (rejected). This document distills three reviewer reports into a concrete punch list plus a longer-term direction.

**TL;DR of the reviews:**
- Reviewer 1: "Strong and imaginative concept." Major asks: focus, reading state, AI transparency, accessibility, user study.
- Reviewer 2: "Very high originality... genuinely distinctive perspective." Fit-for-venue mismatch (SIGGRAPH skews graphics, not text).
- Reviewer 3: Visual execution lags ambition. "Four-agent pipeline" oversold. AR/VR claimed but not demoed. No user evaluation.

The verdict isn't "this idea is wrong." It's "this idea isn't proven yet."

---

## Done since the review

- [x] **VR mode (basic)** — `@react-three/xr` integrated. Reviewer 3 said AR/VR was claimed but not demoed. Now it is. (`src/components/UI/VRButton.tsx`, `src/lib/xrStore.ts`)
- [x] **Three.js dedupe** — `@react-three/xr` pulled in transitive copies; aliased in `vite.config.ts` to keep singletons consistent.

---

## Near-term TODOs (weekend-scoped)

### 1. Aggressive focus when an article is open
**From:** R1 ("too many cards competing for attention... others could fade, blur, or move further into the background")
**From:** R3 ("visually unremarkable... no distinctive visual language")

Today: non-focal cards stay at full brightness and clarity.
Target: when an article opens, the rest of the cosmos commits to background.

Specifically:
- [ ] Increase brightness drop on non-focal cards from current value to ~30%
- [ ] Add light gaussian blur (1–2px) to non-focal cards
- [ ] Slight depth pull-back — non-focal cards translate inward 5% so the focused card visually dominates
- [ ] Constellation edges to non-focal cards dim further

Files to touch: `src/components/MapMode/PostCard3D.tsx`, `src/components/MapMode/EdgeNetwork.tsx`

### 2. Read state visual treatment
**From:** R1 ("no clear indication of reading progress, such as which posts have been read, unread, new, or directly related to the current post")

Today: every card looks identical regardless of whether the user has read it.
Target: at a glance, the user sees what they've covered.

States:
- **Unread** — default appearance
- **Read** — desaturated, subtle, fading toward background. Stays visible (don't hide history).
- **New** — gentle accent pulse (1–2 cycles), then settles to unread
- **Related to current** — subtle outline accent in current emotion color

Storage: persist read state in localStorage by `(userId or anonymous session, postId)`. No backend dependency for v1.

Files to touch: `src/components/MapMode/PostCard3D.tsx`, add `src/lib/readState.ts` for storage.

### 3. AI label inspection panel
**From:** R1 ("How reliable is the AI classification of stance, emotion, assumptions, and relationships? Can users inspect or correct AI-generated labels?")

Today: AI extractions are invisible. Users see the result of the placement but not the reasoning.
Target: any opened card shows a "why is this here?" disclosure.

Specifically:
- [ ] Add an "AI labels" toggle on the article panel
- [ ] Reveal: stance, emotion, core claim, assumptions list, relationship targets
- [ ] Each label has a small "disagree" button — clicking records the disagreement to telemetry
- [ ] (Later) disagreements feed back into a label-correction loop

Files to touch: `src/components/DetailPanel.tsx`, server-side endpoint for label feedback.

### 4. Polish font rendering on distant/faded cards
**From:** R1 ("font rendering is not very clear, and small text is hard to read, especially on distant or faded cards")

Today: text uses default Three.js HTML overlay rendering, which can blur on transformed cards.
Target: crisp readable text at every visible distance.

Specifically:
- [ ] Bump minimum font size on faded/distant cards from current to ≥14px
- [ ] Verify `transform: translateZ(0)` or `backface-visibility` is set for subpixel AA
- [ ] Test on a 27" 4K display + a 13" 1080p laptop — current tuning is biased to retina

Files to touch: `src/components/MapMode/PostCard3D.tsx`.

---

## Medium-term (1–4 weeks)

### 5. Accessibility lane: pure mouse/keyboard mode
**From:** R1 ("How accessible is the system for desktop users, low-vision users, or people uncomfortable with gaze/head-movement navigation?")

The story today is mostly "head-pose is optional." The story should be "every interaction has a pure mouse/keyboard equivalent."

- [ ] Keyboard arrows = rotate sphere
- [ ] Enter = open focused card
- [ ] Tab = cycle through visible cards
- [ ] Esc = close article
- [ ] Add an "Accessibility" section to the Control Panel
- [ ] Document the keymap in `USER_MANUAL.md`

### 6. The user study (the single biggest leverage point)
**From:** R1 and R3 both flagged the absence of evaluation.

A 10–12 person comparison study:
- **Conditions:** COSMOS vs. a threaded feed view (we already have ListView)
- **Same dataset:** e.g. a 150-post Reddit thread, exact same content in both views
- **Measures:** post-task comprehension quiz, recall, time spent, qualitative comments
- **Outcome:** publishable result either way (positive = vindication, negative = next iteration target)

This is also re-submittable to a better venue (CHI, IEEE VIS, DIS, UIST) where evaluation is expected, not optional.

### 7. Narrow the technical claim
**From:** R3 ("four-agent AI pipeline is standard LLM prompt engineering")

R3 is being uncharitable but technically correct: pipelines of structured-output LLM calls aren't a contribution. The contribution is the spatial-layout-from-extractions mapping.

- [ ] Stop leading with "five agents" in marketing copy
- [ ] Lead with "AI extractions drive spatial position" — the actual novelty
- [ ] In any future paper, dedicate a section to *how* extractions map to sphere position (longitude = opinion axis, latitude = abstraction, etc.) — this is the part that's genuinely novel

---

## Long-term direction (months)

### 8. Venue strategy
SIGGRAPH was wrong-fit. Reviewer 2 named it: "limited fit with SIGGRAPH's core focus." Right venues:

- **CHI** (ACM Conference on Human Factors in Computing Systems) — primary fit
- **IEEE VIS** — strong fit if we lean into the visualization angle
- **DIS** (Designing Interactive Systems) — fit for the design-research framing
- **UIST** — fit if we emphasize the input novelty (GazeLearner)

Plan: target CHI 2027 (papers due ~Sept 2026), with the user study from #6 as the empirical anchor.

### 9. The 10-star product question
**From:** /plan-ceo-review thinking (not from reviewers, but worth keeping here)

If COSMOS is more than a beautiful demo, what's the version that becomes the default way people consume online conversation? Open questions:

- Does the spatial format work for live discussion (real-time chat) or only static archives?
- Does it work for non-discussion content (research papers, news, court filings)?
- Is there a "Save This Cosmos" workflow — book-club–style return to a shared view of a thread?
- Is there an enterprise wedge — board meetings, design reviews, hiring debriefs — where spatial mapping of opinions is uniquely valuable?

### 10. The R3 challenge: show, don't claim
**From:** R3 ("Title claims AR/VR; work demonstrates neither convincingly. Visual and interaction design need significant development to match the conceptual scope.")

VR mode is now basic-functional. The next bar is "VR mode is the *better* way to use COSMOS." That requires:

- [ ] Hand-tracking grab gestures (Quest 3 supports this natively)
- [ ] Eye-tracking-driven gaze on Quest Pro / Vision Pro (skip the head-pose proxy)
- [ ] Controller raycast for card selection at distance
- [ ] Spatial audio — distant posts have quiet ambient murmur, focused post has clear voice
- [ ] A killer 60-second VR demo video that makes the case visually

---

## What's NOT a takeaway

A few critiques are worth pushing back on, even quietly:

- **R3: "Nelson's lineage is invoked more than built upon."** Fair, but Nelson was an inspiration, not an architecture. The README can reduce Nelson references — or, alternatively, *actually* build a more Nelson-grounded version (transclusion of posts between cosmoses?). Either fix is honest.
- **R3: "Spatializing discourse has precedents in argument mapping and tools like Deliberatorium."** True. But Deliberatorium is structured trees of claims; COSMOS is unstructured posts arranged by latent semantics. They share an ancestor and almost nothing else. A future paper should acknowledge Deliberatorium specifically and explain the architectural divergence.

---

## Status snapshot

| Item | Status | Owner | Target |
|------|--------|-------|--------|
| VR mode (basic) | Done | jin-dalrae | 2026-05-23 |
| Aggressive focus on read | Todo | jin-dalrae | Weekend 1 |
| Read state visual | Todo | jin-dalrae | Weekend 1 |
| AI label inspection | Todo | jin-dalrae | Weekend 2 |
| Font polish | Todo | jin-dalrae | Weekend 2 |
| Mouse/keyboard accessibility | Todo | jin-dalrae | Week 3 |
| User study | Planning | TBD | Month 2 |
| Narrow the claim | Todo | jin-dalrae | Ongoing |
| CHI 2027 submission | Planning | jin-dalrae | Sept 2026 |
| VR deep features | Todo | jin-dalrae | Month 3 |

---

*Filed 2026-05-23 from the SIGGRAPH 2026 Poster decision. Rejection is information, not verdict.*
