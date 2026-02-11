# COSMOS

### AI-Powered 3D Community Discussion Platform

> *"You just read. The interface reads you back."*

https://github.com/jin-dalrae/2602-Claude-Hackathon-Cosmos/raw/main/demo.mp4

---

## The Problem

Online discussion is fundamentally broken.

**800-comment Reddit threads** are walls of text. Twitter is outrage loops. Hacker News buries dissent under karma. Every major platform reduces discourse to a flat, chronological feed optimized for engagement, not understanding.

The real structure of a conversation — who agrees, who disagrees, what's assumed but never said, where the gaps are — is **completely invisible.**

| What users see | What actually exists |
|---|---|
| Linear thread of comments | Multi-dimensional argument graph |
| Popularity-sorted opinions | Ideological clusters with bridge posts |
| "Hot takes" and reactions | Hidden assumptions driving disagreement |
| Echo chambers by default | Unexpressed perspectives (gaps) |

The result: **polarization, misunderstanding, and the illusion of consensus.** Platforms designed for engagement actively prevent collective reasoning.

---

## The Solution

**COSMOS transforms community discussions into spatial, navigable 3D constellations** where AI reveals the invisible architecture of human argument.

Every post is analyzed by Claude for **stance, emotion, hidden assumptions, and logical ancestry** — then placed in 3D space where position carries meaning:

| Axis | What It Encodes |
|------|----------------|
| **X** | Ideology spectrum (opposing poles of opinion) |
| **Y** | Abstraction level (personal anecdote ↔ systemic analysis) |
| **Z** | Novelty (common talking point ↔ original insight) |

Posts cluster by worldview. Edges reveal logical relationships. Gaps expose missing voices. Bridge posts connect opposing camps.

**The interface doesn't just display discussion — it understands it.**

---

## Product

### 3D Constellation View

The core experience. A spatial galaxy of community posts, each floating as an interactive card in 3D space.

- **Orbit, zoom, explore** — full 3D navigation with smooth spherical camera arcs
- **Click to expand** — reveals full analysis: content, stance, emotion, hidden assumptions, logical chain, related posts
- **Emotion-coded cards** — 9 distinct color palettes (passionate, analytical, frustrated, hopeful, fearful, sarcastic, neutral, aggressive, empathetic)
- **Relationship edges** — colored lines encoding agreement, disagreement, builds-upon, tangent, rebuttal
- **Vote and reply** inline — participate in the discussion from within the constellation
- **Ambient atmosphere** — particle dust, cluster groupings, warm museum-like lighting

### Article List View

A parallel `/list` page for traditional browsing:

- Full-screen scrollable dark interface
- Sort by votes, emotion, or author
- Expand/collapse cards to read full content, assumptions, themes, and replies
- Vote and reply inline
- Seamless navigation between Map and List via react-router

### Compose & Participate

- Submit new posts or reply to existing ones
- Posts receive AI classification into the existing discussion structure
- Positioned in the constellation based on semantic analysis

---

## Technology

### Five-Agent AI Pipeline

The engine that transforms raw discussion into spatial meaning — orchestrated through Claude, streamed in real-time via SSE.

```
   Community Topic or Reddit URL
              |
   +----------v-----------+
   |   GENERATOR AGENT    |   Synthesizes 100+ realistic community voices
   |   (Claude Haiku)     |   across 7 subtopics with diverse stances
   +----------+-----------+
              |
   +----------v-----------+
   |  CARTOGRAPHER AGENT  |   Batch-enriches every post:
   |  (Claude Haiku)      |   stance, emotion, assumptions, evidence,
   |  30 posts/batch      |   logical chain, cross-group perception,
   |  3x parallel         |   3D embedding hints, relationships
   +----------+-----------+
              |
   +----------v-----------+
   |   ARCHITECT AGENT    |   Computes spatial layout:
   |   (Claude Haiku)     |   3D positions, cluster boundaries,
   |                      |   bridge posts, gap analysis
   +----------+-----------+
              |
   +----------v-----------+          +-------------------+
   |   3D CONSTELLATION   |          | CLASSIFIER AGENT  |
   |   renders live       |<-------->| classifies user   |
   |   as pipeline runs   |          | posts in real-time |
   +----------------------+          +-------------------+
                                     +-------------------+
                                     |  NARRATOR AGENT   |
                                     |  contextual Q&A   |
                                     |  about the layout  |
                                     +-------------------+
```

**Key capabilities:**
- **Incremental rendering** — 3D scene appears after the first batch; posts stream in as they're enriched
- **Parallel batch processing** — Cartographer runs up to 3 batches concurrently
- **Robust JSON recovery** — handles truncated API responses, retries with exponential backoff
- **Two-layer caching** — local file + Firestore prevents re-processing
- **SSE streaming** — live progress events (Connecting → Harvesting → Enriching → Architecting → Ready)

### Cartographer Output Per Post

Each post is enriched with:

```
{
  stance:          "pro-density-housing"
  emotion:         "passionate"
  post_type:       "argument" | "evidence" | "anecdote" | "question" | "rebuttal" | "meta"
  core_claim:      "Rent control helps existing tenants but discourages new construction"
  assumptions:     ["Free market produces optimal housing", "New construction lowers prices"]
  evidence_cited:  ["Stanford 2019 rent control study"]
  importance:      8
  logical_chain:   { builds_on: ["post_42"], root_assumption: "Markets self-correct", depth: 3 }
  perceived_by:    { renters: "dismissive of lived experience", developers: "economically sound" }
  embedding_hint:  { opinion_axis: 0.6, abstraction: 0.8, novelty: 0.3 }
  relationships:   [{ target: "post_17", type: "disagrees", strength: 0.9, reason: "..." }]
}
```

### 3D Rendering Stack

| Component | What It Does |
|-----------|-------------|
| **Canvas3D** | Three.js canvas via React Three Fiber. PerspectiveCamera, OrbitControls, spherical interpolation for camera arcs |
| **PostCard3D** | HTML-in-3D cards (300px compact → 800px expanded). Emotion-colored, with drag passthrough for orbit controls |
| **EdgeNetwork** | Vertex-colored line segments encoding 5 relationship types. Proximity-filtered to reduce clutter |
| **AmbientDust** | 200 floating particles, gold/cream, slow rotation — depth and atmosphere |
| **ControlPanel** | Runtime scene tuning: FOV, camera distance, damping, spread scale, nearby card count |

**Performance:** Only 15–30 nearest cards rendered at any time (distance-culled from camera anchor). Selected post always included.

### Perception Layer (Built, Integration-Ready)

A complete perception system for reading the reader:

| Signal | Technology | What It Detects |
|--------|-----------|-----------------|
| **Gaze** | WebGazer.js | Eye fixation zones (read, agree, disagree, deeper, flip, wander) |
| **Face** | MediaPipe FaceMesh | Head nod/shake, lean in/back, brow furrow/raise, smile |
| **Fusion** | Custom engine | Combines gaze + face + mouse into unified `IntentSignal` with confidence |
| **Adaptation** | Behavioral model | Learns user patterns, transitions through observe → model → predict → refine |

**Fusion rules (examples):**
- Eyes + mouse same area → high-confidence intent
- Brow furrow + steady gaze → engaged (not confused)
- Lean back + gaze wander → pulling away
- Head nod + eyes right → agree

### Anti-Echo Chamber Engine

When integrated with the swipe-card mode:

| You swipe... | Next card is... |
|-------------|----------------|
| Agree (right) | Strongest counterargument |
| Disagree (left) | Someone who agrees with what you rejected |
| Flip (up) | Post from the opposing cluster |
| Deeper (down) | Logical parent in the argument chain |

**The system actively fights filter bubbles by design.**

---

## Architecture

```
cosmos/
├── src/
│   ├── App.tsx                          # Router: Loading → Map (/) or List (/list)
│   ├── components/
│   │   ├── CosmosExperience.tsx         # 3D orchestrator (state, selection, voting)
│   │   ├── MapMode/
│   │   │   ├── Canvas3D.tsx             # Three.js canvas, camera, orbit controls
│   │   │   ├── PostCard3D.tsx           # Interactive 3D cards (compact/expanded)
│   │   │   ├── EdgeNetwork.tsx          # Relationship edge visualization
│   │   │   └── AmbientDust.tsx          # Atmospheric particle field
│   │   ├── ListView/
│   │   │   ├── ArticleList.tsx          # Scrollable flat list with sorting
│   │   │   └── ArticleListPage.tsx      # /list route page wrapper
│   │   ├── ComposeOverlay.tsx           # New post / reply modal
│   │   ├── ControlPanel.tsx             # Scene settings UI
│   │   ├── UI/                          # Loading, calibration, debug screens
│   │   └── shared/EmotionPalette.ts     # Color system (9 emotions, 5 edge types)
│   ├── hooks/
│   │   ├── useCosmosData.ts             # SSE client for pipeline streaming
│   │   ├── useGazeTracking.ts           # WebGazer integration
│   │   ├── useFusedInput.ts             # Multi-modal intent fusion
│   │   └── useAdaptiveModel.ts          # Behavioral pattern learning
│   └── lib/
│       ├── agents/                      # 5 Claude-powered specialist agents
│       │   ├── base.ts                  # SDK wrapper, JSON recovery, retry logic
│       │   ├── generator.ts             # Discussion synthesis
│       │   ├── cartographer.ts          # Post enrichment (batch, parallel)
│       │   ├── architect.ts             # Spatial layout computation
│       │   ├── classifier.ts            # Real-time user post classification
│       │   └── narrator.ts              # Contextual Q&A guide
│       ├── orchestrator.ts              # Pipeline coordination + SSE emission
│       ├── types.ts                     # Full domain model (292 lines)
│       ├── antiEchoChamber.ts           # Filter bubble avoidance logic
│       ├── fusionLayer.ts               # Perception signal fusion
│       └── adaptiveModel.ts             # User behavior adaptation
├── server/
│   ├── index.ts                         # Express 5 server
│   └── routes/
│       ├── process.ts                   # SSE pipeline endpoint
│       ├── classify.ts                  # Post classification API
│       └── narrate.ts                   # Narrator Q&A API
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 | TypeScript 5.9 | Vite 7 |
| **3D Engine** | Three.js 0.182 | @react-three/fiber | @react-three/drei |
| **Animation** | Framer Motion 12 | @use-gesture/react |
| **Routing** | react-router-dom 7 |
| **Styling** | Tailwind CSS 4 |
| **AI** | Claude API (Anthropic SDK) | Haiku 4.5 (speed) | Opus 4.6 (quality) |
| **Backend** | Express 5 | SSE streaming |
| **Perception** | WebGazer.js | MediaPipe FaceMesh |
| **Cache** | Local file + Firebase/Firestore |

---

## Market Opportunity

Every platform with community discussion faces the same structural problem. COSMOS's technology applies to:

| Vertical | Application |
|----------|------------|
| **Social platforms** | Reddit, HN, community forums — visualize discussion structure, surface hidden assumptions |
| **Enterprise** | Slack, Teams, internal forums — understand org-wide sentiment and argument patterns |
| **Civic tech** | Town halls, public comments, parliamentary debates — make democratic discourse navigable |
| **Education** | Classroom discussions, peer review — reveal reasoning structure to students |
| **Media** | Comment sections, reader feedback — extract signal from noise |
| **Research** | Qualitative data analysis — spatial mapping of interview/survey responses |

**The wedge:** Community platforms with 100+ comment threads where users currently give up reading.

---

## What Makes This Different

**1. Structural revelation, not sentiment analysis.**
We don't just detect "positive/negative." We extract hidden assumptions, logical ancestry, cross-group perception, and argument gaps — the *why* behind disagreement.

**2. Spatial meaning, not decoration.**
Position in the 3D space encodes ideology, abstraction level, and novelty. Clusters and gaps emerge from the argument structure, not arbitrary grouping.

**3. Perception-aware interaction.**
The interface reads the reader. Eye tracking + facial expression + mouse behavior fuse into a unified intent signal that adapts what you see next.

**4. Anti-echo by architecture.**
The anti-echo chamber engine is structural, not algorithmic. Counterarguments surface based on *argument graph traversal*, not engagement metrics.

**5. Incremental, streaming AI.**
Results appear as they're computed. No waiting for a full pipeline to finish — the constellation builds itself in real time.

---

## Quick Start

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev             # starts both client (Vite) and server (Express)
```

Open `http://localhost:5173` — the pipeline starts automatically on the demo topic (SF Richmond community).

Navigate to `/list` for the article list view.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/process` | SSE stream — runs full pipeline for a topic or Reddit URL |
| `POST` | `/api/classify` | Classify a user-submitted post into existing layout |
| `POST` | `/api/narrate` | Narrator answers questions about the discussion |
| `GET` | `/api/health` | Health check |

---

## Built At

**Anthropic Claude Hackathon** — 3 days, February 2026.

By **Rae**.

---

MIT License
