# COSMOS

### Spatial Intelligence for Human Discourse

> *1.7 billion people read online discussions daily. Every platform shows them as a flat list. We built the first interface where you stand inside the conversation and navigate it with your body.*

**Live:** [cosmosweb.web.app](https://cosmosweb.web.app) | **By:** [Rae Jin](https://raejin.web.app) | **X:** [@DalraeJin](https://x.com/DalraeJin)

---

## The Problem

Every major platform — Reddit, X, HackerNews, Discord — reduces conversation to **one post after another**. The topology of debate — who agrees, who disagrees, what assumptions differ, where clusters form — is completely invisible.

| What feeds do | What happens |
|---------------|-------------|
| Flatten everything into one stream | Readers have zero agency — the algorithm chooses the sequence |
| Hide the landscape | 500-comment threads have structure: clusters, bridges, gaps. Feeds erase all of it |
| Reward extremes | Polarization accelerates because sorted lists surface the loudest voice, not the most nuanced |
| Exhaust readers | Decision fatigue from clicking "is this worth my attention?" on every post |

The result: you finish a thread and have no idea what the conversation actually looked like. You saw a slice. The feed chose which slice.

---

## The Solution

**COSMOS transforms any discourse landscape into a 3D spatial experience navigated with your body.**

You stand inside a planetarium sphere. Arguments float around you as cards — clustered by perspective, colored by emotion, connected by constellation lines. Multiple topics self-organize into different regions of the sky. AI understands the topology. Your head controls the view.

### What changes

**There is no "next."** A sphere has every direction. Two readers starting from the same point browse completely different paths. Your curiosity determines the sequence.

**Topics become places.** Neighborhood gardening on one side, AI startups on another. Drag slowly between them and you pass through bridge posts — ideas connecting both worlds. The topology of conversation becomes something you navigate.

**The interface reads you back.** GazeLearner passively learns from your natural clicks — no calibration step, no setup. The more you browse, the better it understands where you're looking. The system adapts to you, not the other way around.

---

## Core Technology

### Five-Agent AI Pipeline

```
Topic Input
    |
[GENERATOR]     150+ realistic voices across 10+ subtopics
    |            Diverse stances, emotions, post types
[CARTOGRAPHER]  Enriches every post: stance, emotion,
    |            assumptions, logical chain, relationships
[ARCHITECT]     Computes 3D positions — clusters,
    |            bridges, gaps — on the sphere surface
[CLASSIFIER]    Places new user posts in real-time
[NARRATOR]      Answers questions about the discussion
```

This is not visualization. This is **spatial intelligence** — the AI doesn't just show data, it understands the shape of the conversation.

### What the AI Extracts Per Post

```
stance:          "pro-density-housing"
emotion:         "passionate"
core_claim:      "Rent control helps tenants but discourages construction"
assumptions:     ["Free market produces optimal housing"]
logical_chain:   { builds_on: ["post_42"], root: "Markets self-correct" }
perceived_by:    { renters: "dismissive", developers: "economically sound" }
relationships:   [{ target: "post_17", type: "disagrees", strength: 0.9 }]
embedding_hint:  [0.3, 0.7, -0.2]  →  position on the sphere
```

### Spatial Encoding

| Sphere Axis | What It Encodes |
|-------------|----------------|
| **Longitude (theta)** | Opinion spectrum — opposing views sit across the sphere |
| **Latitude (phi)** | Abstraction — personal stories near equator, systemic analysis toward poles |
| **Clustering** | Worldview — posts sharing assumptions naturally group together |
| **Gaps** | Missing perspectives — visible empty regions on the sphere surface |
| **Constellation edges** | Relationships between arguments (agrees, disagrees, extends, challenges) |

---

## Input Paradigm

COSMOS introduces a multi-modal input system that goes beyond point-and-click:

| Input | What It Does |
|-------|-------------|
| **Drag** | Rotate the sphere — quaternion-based, 3px threshold, 40fps camera updates |
| **Head pose** | Hands-free navigation — MediaPipe at 60fps, position-based steering (not velocity) |
| **Two-finger scroll** | Rotate through time ordering — rank-based, endless wrapping, fog effect |
| **Pinch zoom** | Adjust FOV (30°–110°) — go nearer into the space |
| **Click** | Open an article (optional — auto-open handles this in gaze/drag mode) |

### GazeLearner: Self-Calibrating Gaze

Traditional gaze systems require explicit calibration ("look at these 9 dots"). COSMOS uses **passive calibration from natural clicks**:

1. User browses with head-pose steering
2. Every click records head pose + card direction as ground truth
3. After 5 samples, weighted linear regression starts correcting raw head input
4. Full confidence at 20 samples — exponential time decay (60s half-life) prioritizes recent behavior
5. System continuously adapts to posture changes via rolling recalibration (alpha=0.005)

The result: gaze navigation gets more accurate the longer you use it, with zero setup.

### Reading Protection

Small head movements while reading (eye scanning a text) don't trigger article switching. Cards hidden behind the currently open article are excluded from gaze targeting. The system distinguishes between "reading" and "looking away."

---

## Temporal Depth

Posts age. Older discussions don't disappear — they recede, like distant stars.

- **Rank-based ordering:** Every post gets an evenly-spaced slot in the rotation cycle (no timestamp clustering)
- **Fog effect:** Cards near the focal time are bright; others dim to 60% via CSS `brightness()` — subtle shade, always readable
- **Endless rotation:** Two-finger scroll wraps around seamlessly — no start or end, continuous cycling through all posts
- **Circular distance:** Z-ordering and brightness use circular distance so wrapping is seamless

Cards don't move when you scroll. Their positions stay fixed on the sphere. Only visual prominence and stacking order change.

---

## Visual Design

A planetarium at dusk — warm, dark, atmospheric. Not a cold tech demo.

| Element | Design |
|---------|--------|
| **Skybox** | Rainbow hue (by longitude) + north pole white + south pole deep navy |
| **Cards** | Paper-like, Georgia serif, 9-emotion color accents |
| **Fog** | Brightness-based depth (not opacity — never transparent) |
| **Dust** | 150 ambient particles for atmosphere |
| **Edges** | 5 relationship types: agrees, disagrees, extends, builds-on, challenges |

**Design principle:** Shading, not transparency. Cards dim via brightness filter, never go ghost-like. The fog metaphor is "peering through atmosphere to see distant stars."

---

## Architecture

```
cosmos/
├── src/
│   ├── main.tsx                           # Entry + Firebase Analytics init
│   ├── App.tsx                            # Routes: landing, web, admin, terms, privacy
│   ├── lib/
│   │   ├── firebase.ts                    # Firebase SDK + Analytics
│   │   ├── gazeLearner.ts                 # Passive gaze calibration (WLS regression)
│   │   ├── orchestrator.ts                # Pipeline coordination + SSE
│   │   ├── agents/                        # 5 Claude-powered specialist agents
│   │   ├── api.ts                         # API client
│   │   └── types.ts                       # Domain model (CosmosPost, CosmosLayout)
│   ├── hooks/
│   │   ├── useCosmosData.ts               # SSE client for pipeline streaming
│   │   └── useHeadPose.ts                 # MediaPipe FaceLandmarker + calibration
│   ├── components/
│   │   ├── CosmosExperience.tsx           # Master orchestrator — all state + logic
│   │   ├── LandingPage.tsx                # Marketing page with 3D sphere background
│   │   ├── ControlPanel.tsx               # Card size, article zoom sliders
│   │   ├── MapMode/
│   │   │   ├── Canvas3D.tsx               # Three.js canvas, quaternion camera, FOV zoom
│   │   │   ├── PostCard3D.tsx             # 3D cards with emotion colors + transitions
│   │   │   ├── EdgeNetwork.tsx            # Relationship constellation lines
│   │   │   └── AmbientDust.tsx            # Atmospheric particle field
│   │   ├── ListView/                      # Traditional scrollable article list
│   │   ├── Admin/                         # Admin dashboard (PIN-protected)
│   │   ├── UI/                            # Camera consent, face preview, loading
│   │   ├── TermsPage.tsx                  # Terms of Service
│   │   └── PrivacyPage.tsx                # Privacy Policy (CCPA)
│   └── index.css
├── server/
│   ├── index.ts                           # Express 5 + static serving + SPA fallback
│   ├── lib/                               # Server-side AI pipeline
│   └── routes/                            # API: process, classify, narrate, admin
├── prd/                                   # Product requirements (11 feature docs)
├── firebase.json                          # Hosting config + CSP headers
├── Dockerfile                             # Cloud Run container
└── COSMOS_BUSINESS_PLAN.md                # Seed-stage business plan
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **3D Engine** | Three.js + @react-three/fiber | Declarative 3D in React, GPU-accelerated |
| **Frontend** | React 19, TypeScript 5.9, Vite 7 | Type-safe, fast builds, modern toolchain |
| **Animation** | Framer Motion 12 | Smooth page/card transitions |
| **Head Tracking** | MediaPipe FaceLandmarker | 60fps on-device, zero privacy cost |
| **AI** | Claude API (Anthropic SDK) | Semantic analysis at the quality spatial layout requires |
| **Backend** | Express 5, SSE streaming | Progressive loading — cards appear as analyzed |
| **Database** | MongoDB | User posts, votes, layouts |
| **Hosting** | Firebase Hosting + Cloud Run | CDN frontend + containerized API |
| **Analytics** | Firebase Analytics | Page views, sessions, engagement |

---

## Market Opportunity

| Segment | Size | COSMOS Fit |
|---------|------|-----------|
| **Online discussion platforms** | $15B | Spatial discussion is a new category above flat threads |
| **AR/VR content** | $12B by 2028 | Headsets need spatial-native apps, not ported 2D panels |
| **Enterprise collaboration** | $47B | Team decisions = discussions that need spatial mapping |
| **Digital signage** | $27B by 2028 | Ambient mode: living discourse displays for offices, newsrooms |
| **Education** | $8B | Teach critical thinking through spatial argument exploration |

**Why now:** LLMs enable the semantic analysis quality needed. MediaPipe runs head tracking in the browser at zero latency. 30M+ AR/VR headsets by 2026. Discussion fatigue is at peak.

---

## Competitive Landscape

**No direct competitor** combines AI-powered discussion understanding + 3D spatial visualization + body-based input + self-calibrating gaze.

| Adjacent Player | Gap |
|----------------|-----|
| **Kialo** (structured debate) | Manual structure, 2D, no AI, no body input |
| **Pol.is** (opinion clustering) | Statistical only, 2D scatter plot, no spatial navigation |
| **Spatial.io** (VR meetings) | Meeting tool, not discussion understanding |
| **Reddit / X / HN** | Flat lists, no spatial intelligence |

### Defensible Moat

1. **AI pipeline depth** — 5 specialized agents, not a single API call
2. **GazeLearner** — self-calibrating from natural clicks (unique interaction model)
3. **Cross-platform spatial engine** — same architecture: desktop → VR → AR glasses → ambient displays
4. **Data network effect** — more discussions mapped → better positioning → better experience

---

## Roadmap

| Phase | Timeline | What Ships |
|-------|----------|-----------|
| **Web App** | **Now (live)** | Full 3D sphere, 5 AI agents, head-pose, GazeLearner, temporal depth, pinch zoom |
| **Ambient Mode** | Month 3–6 | Auto-rotating display mode for offices, newsrooms, conferences |
| **VR/AR Native** | Month 6–12 | Quest + Vision Pro — hand tracking, eye tracking, spatial audio |
| **Enterprise** | Month 12–24 | Team spheres, attention heatmaps, Slack/Teams integration, Analyst API |
| **Platform** | Month 24+ | Embeddable `<cosmos-sphere>` widget, attention analytics, cross-sphere navigation |

---

## Quick Start

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY and MONGODB_URI
npm run dev             # starts client (5173) and server (3001)
```

Open `http://localhost:5173` — the pipeline runs automatically.

---

## Legal

- [Terms of Service](https://cosmosweb.web.app/terms)
- [Privacy Policy](https://cosmosweb.web.app/privacy) (CCPA compliant)
- All camera processing is 100% client-side. No video data leaves the browser.

---

**Live:** [cosmosweb.web.app](https://cosmosweb.web.app)

Built with Claude Opus 4.6 — February 2026.

(c) 2026 Rae Jin. All rights reserved.
