# COSMOS

> *"You just read. The interface reads you back."*

---

## The Vision

Online discussions are broken. 800-comment Reddit threads are walls of text. Twitter is outrage loops. The shape of a conversation — who agrees, who disagrees, what's assumed but never said — is completely invisible.

**COSMOS makes the invisible visible.** It transforms community discussions into spatial, navigable 3D constellations where AI reveals the structure of human argument.

Every post gets analyzed by Claude for **stance, emotion, hidden assumptions, and logical ancestry**. Then it gets placed in 3D space — clustered by ideology, colored by emotion, connected by argument structure.

---

## What's Built

### The Full AI Pipeline

A multi-agent orchestration system powered by Claude that processes any community topic end-to-end:

```
Community Topic (e.g. "SF Richmond")
        ↓
   Generator Agent ─── synthesizes realistic community discussion
        ↓
   Cartographer Agent ─── analyzes each post: stance, emotion,
                          assumptions, logical chains
        ↓
   Architect Agent ─── computes spatial layout: 3D positions,
                       clusters, edge relationships
        ↓
   3D Constellation ── explore it live
```

| Agent | What It Does | Status |
|-------|-------------|--------|
| **Generator** | Synthesizes diverse community voices around a topic — not scraping, *creating* realistic discourse | Working |
| **Cartographer** | Analyzes stance (−1 to +1), emotion, hidden assumptions, argument ancestry for every post | Working |
| **Architect** | Computes 3D layout — cluster positions, intra/inter-cluster spacing, edge weights | Working |
| **Narrator** | AI guide that answers questions about the discussion in context | Built |
| **Classifier** | Real-time stance/topic classification for user-submitted posts | Built |

The pipeline runs via SSE streaming — the UI shows live progress as each agent completes its work.

### 3D Constellation View (MAP Mode)

The core visual experience. Each post is a 3D card floating in space:

- **PostCloud** — renders all posts as interactive 3D elements with stance-based coloring
- **EdgeNetwork** — animated lines showing argument relationships between posts
- **ClusterShells** — translucent spheres grouping ideologically similar posts
- **AmbientDust** — particle field giving depth and atmosphere
- **PostCard3D** — interactive card that expands on click to show full analysis: stance, emotion, assumptions, argument chain
- **UserMarker** — tracks camera/user position in the constellation

All rendered in `@react-three/fiber` with orbit controls and camera fly animations.

### Perception Layer (PERCEIVE Mode)

Built but not yet integrated into the main experience flow:

- **WebGazer.js** gaze tracking — detects where your eyes fixate on screen
- **MediaPipe FaceMesh** — reads facial micro-expressions (brow furrow, nod, lean)
- **Fusion Layer** — combines mouse + gaze + face signals into a unified intent stream
- **Adaptive Model** — adjusts UI behavior based on fused perception signals
- **Gaze-Card Feedback** — maps gaze zones to card interaction cues

The perception hooks (`useGazeTracking`, `useFusedInput`, `useAdaptiveModel`, `useGazeCardFeedback`) are complete. The consent flow (`CameraConsent`) and calibration screen (`CalibrationScreen`) exist. Integration into the main experience is the next step.

### Card System (READ Mode)

Built as standalone components, pending integration:

- **SwipeableCard** — gesture-driven card with spring physics (right = agree, left = disagree, up = flip, down = deeper)
- **CardStack** — manages card queue and navigation
- **CardFront / CardBack** — flip card showing post content → detailed analysis
- **ArgumentDNA** — visual representation of an argument's logical structure
- **Anti-Echo Chamber Engine** — rewires what you see next based on how you swipe:

| You swipe... | Next card is... |
|-------------|----------------|
| Agree (→) | Strongest counterargument |
| Disagree (←) | Someone who agrees with what you rejected |
| Flip (↑) | Post from the opposing cluster |
| Deeper (↓) | Logical parent in the argument chain |

### Landing Page

Polished hero page with animated feature cards, radial glow effects, and "Enter COSMOS" CTA that triggers the full pipeline on the demo topic (SF Richmond community).

### Supporting UI

- **LoadingCosmos** — staged loading screen showing pipeline progress
- **ComposeOverlay** — submit your own post into the discussion
- **NarratorSheet** — AI narrator panel for contextual Q&A
- **GestureHints** — onboarding overlays for interaction guidance
- **LiveMutation** — real-time visual feedback on discussion changes
- **ConstellationCard** — summary card for cluster-level insights
- **ErrorBoundary** — graceful error handling
- **EmotionPalette** — consistent emotion→color mapping across all views

---

## Architecture

```
cosmos/
├── src/
│   ├── App.tsx                    ← Hero → Loading → 3D Experience flow
│   ├── components/
│   │   ├── CosmosExperience.tsx   ← Main 3D canvas orchestrator
│   │   ├── MapMode/              ← 3D constellation (Canvas3D, PostCloud, Edges, Clusters)
│   │   ├── ReadMode/             ← Card system (Swipeable, Stack, Front/Back, ArgumentDNA)
│   │   ├── UI/                   ← Narrator, Loading, Calibration, Perception debug
│   │   └── shared/               ← EmotionPalette
│   ├── hooks/                    ← State management (gaze, fusion, adaptive, navigation)
│   └── lib/
│       ├── agents/               ← Claude-powered agents (5 specialists + base)
│       ├── orchestrator.ts       ← Pipeline coordination
│       ├── antiEchoChamber.ts    ← Card reordering logic
│       ├── fusionLayer.ts        ← Mouse + gaze + face signal fusion
│       ├── adaptiveModel.ts      ← Perception-driven UI adaptation
│       ├── types.ts              ← 292-line type system covering the full domain
│       └── demoData.ts           ← Pre-cached 3D layout for offline dev
├── server/                       ← Express 5 backend (SSE pipeline, API routes)
└── public/
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Three.js via React Three Fiber, Framer Motion, Tailwind v4 |
| Backend | Express 5, Claude API (Anthropic SDK), SSE streaming |
| 3D Engine | @react-three/fiber, @react-three/drei, custom shaders |
| Perception | WebGazer.js, MediaPipe FaceMesh, @use-gesture/react |
| Build | Vite 7, TypeScript 5.9 |

---

## The Goal

COSMOS is a proof of concept for **discussion interfaces that understand both the conversation and how you read it.**

Three forms of input — mouse, gaze, face — fuse into a single intent signal. Five agents — generator, cartographer, architect, narrator, classifier — turn raw text into spatial meaning. The anti-echo-chamber engine ensures you don't just see what you already believe.

The current build demonstrates the AI pipeline and 3D visualization end-to-end. The card-swipe experience and perception integration are the next frontier.

---

## Quick Start

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

---

## Built At

3 days. **Anthropic Opus 4.6 Hackathon** — February 2026.

By **Rae**.

---

MIT License
