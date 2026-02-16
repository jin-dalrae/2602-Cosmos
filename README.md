# COSMOS

### A Planetarium for Discourse

> *Feeds are linear. Conversations are not. What if you could stand inside a discussion and just look around?*

---

## The Problem with Feeds

Every major platform — Reddit, Twitter, Hacker News — reduces conversation to a single stream. One post after another. Scroll down. Scroll more. An algorithm decides what's next.

This linearity does two things to readers:

1. **It makes you passive.** You don't explore — you receive. The feed moves, you absorb. There's no agency in scrolling.
2. **It hides the landscape.** A 500-comment thread has structure — clusters of agreement, pockets of dissent, bridges between worldviews, gaps where no one has spoken. Feeds flatten all of this into a wall of text sorted by karma.

The result: you finish reading a thread and have no idea what the conversation actually looked like. You saw a slice. The feed chose which slice.

---

## What COSMOS Does Differently

COSMOS places you **inside** a sphere of content. Every post is a card on the sphere's inner surface. You stand at the center and look outward.

You don't scroll. You don't click. You **drag to look around**, and whatever your gaze lands on appears in a sidebar panel. Content arrives as you move — a continuous stream shaped by your curiosity, not an algorithm.

This changes three things:

**There is no "next."** A feed has a single direction: down. A sphere has every direction. Two readers starting from the same point will browse completely different paths based on which way they drift. Your curiosity determines the sequence.

**Topics become places.** Community posts about neighborhood gardening occupy one region of the sphere. AI and startup discussions live on another. You can feel the conceptual distance between them. Drag slowly from one zone toward another and you'll pass through bridge posts — ideas that connect both worlds. The topology of the conversation becomes something you navigate, not something described to you.

**Friction disappears.** Every click is a micro-decision: "Is this worth my attention?" Browse mode removes that question entirely. You look, and content is there. The 30-degree detection cone is generous on purpose — this isn't precision targeting, it's peripheral awareness. You don't select articles. You wander through them.

---

## The Design Philosophy

### Why a sphere? Why inside it?

A sphere has no edges, no top, no bottom. There's no privileged position. Content doesn't have a rank or an order — it has a *location*. Being inside it makes the content feel like an environment rather than a list. You're surrounded by voices, like standing in a room full of conversations that you can tune into by turning your head.

### Why no clicks in browse mode?

Clicking interrupts flow. It forces a binary decision at every moment: engage or keep scrolling. That decision fatigue is what makes feeds exhausting. By removing the click — by making gaze the only interaction — the reader stays in a state of continuous awareness. You're not making choices about individual posts. You're drifting through an information space, and things catch your attention naturally.

### Why multiple topic regions?

COSMOS currently renders SF Richmond neighborhood discussions alongside AI and startup content on the same sphere. This isn't a category system. It's a bet on **accidental drift** — the idea that the most valuable discovery happens when you didn't plan to find something. You came to read about community gardening, but your gaze drifted 90 degrees and landed on a post about how AI is changing local businesses. That moment of unplanned connection is what feeds can never produce, because feeds only show you what they think you want.

### What changes about the reader?

The goal isn't productivity or entertainment. It's **awareness**. A feed reader finishes a thread knowing what was popular. A COSMOS reader finishes a session knowing the shape of the conversation — where the clusters are, where the gaps are, how ideas relate across the full landscape. They saw the whole room, not just the loudest voice in it.

---

## How It Works

### The Browsing Experience

- **Drag** to look around the sphere — content cards float on the inner surface
- **Browse mode** — the nearest article auto-opens in a sidebar panel as you drag. No clicking needed.
- **Compact cards** stay compact on the sphere — they're landmarks, not content. The sidebar is where you read.
- **Smooth cross-fade** between articles as your gaze drifts — content transitions feel continuous, not discrete
- **Emotion-coded colors** — 9 palettes (passionate, analytical, frustrated, hopeful, fearful, sarcastic, neutral, aggressive, empathetic) give you a feel for the conversation's mood at a glance

### AI-Powered Spatial Layout

Every post is analyzed by Claude for stance, emotion, hidden assumptions, and logical relationships — then positioned on the sphere where location carries meaning:

| Dimension | What It Encodes |
|-----------|----------------|
| **Longitude** | Opinion spectrum — opposing views sit across the sphere |
| **Latitude** | Abstraction — personal stories near the equator, systemic analysis toward the poles |
| **Clustering** | Worldview — posts that share assumptions naturally group together |

Gaps on the sphere surface reveal missing perspectives. Bridge posts sit between clusters, connecting opposing camps.

### Five-Agent Pipeline

```
   Topic or Reddit URL
          |
   [GENERATOR]      Synthesizes 150+ realistic community voices
          |          across 10 subtopics with diverse stances
   [CARTOGRAPHER]   Enriches every post: stance, emotion,
          |          assumptions, logical chain, relationships
   [ARCHITECT]      Computes spatial positions — clusters,
          |          bridges, gaps — on the sphere surface
   [CLASSIFIER]     Classifies new user posts in real-time
   [NARRATOR]       Answers questions about the discussion
```

The constellation builds incrementally — cards appear as they're analyzed, not after the full pipeline completes.

### What the AI Extracts Per Post

```
stance:          "pro-density-housing"
emotion:         "passionate"
core_claim:      "Rent control helps tenants but discourages construction"
assumptions:     ["Free market produces optimal housing"]
logical_chain:   { builds_on: ["post_42"], root: "Markets self-correct" }
perceived_by:    { renters: "dismissive", developers: "economically sound" }
relationships:   [{ target: "post_17", type: "disagrees", strength: 0.9 }]
```

---

## Architecture

```
cosmos/
├── src/
│   ├── App.tsx                          # Entry: landing → loading → experience
│   ├── components/
│   │   ├── CosmosExperience.tsx         # Master orchestrator — state, browse mode, selection
│   │   ├── DetailPanel.tsx              # Sidebar panel for browse mode reading
│   │   ├── ComposeOverlay.tsx           # New post / reply modal
│   │   ├── ControlPanel.tsx             # Scene settings
│   │   ├── MapMode/
│   │   │   ├── Canvas3D.tsx             # Three.js canvas, quaternion camera rotation
│   │   │   ├── PostCard3D.tsx           # Compact 3D cards with emotion colors
│   │   │   ├── EdgeNetwork.tsx          # Relationship edge visualization
│   │   │   └── AmbientDust.tsx          # Atmospheric particle field
│   │   ├── ListView/                    # Traditional scrollable article list
│   │   └── shared/EmotionPalette.ts     # Color system (9 emotions, 5 edge types)
│   ├── hooks/
│   │   └── useCosmosData.ts             # SSE client for pipeline streaming
│   └── lib/
│       ├── agents/                      # 5 Claude-powered specialist agents
│       ├── orchestrator.ts              # Pipeline coordination + SSE
│       └── types.ts                     # Domain model
├── server/
│   ├── index.ts                         # Express server
│   └── routes/                          # API endpoints (process, classify, narrate)
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **3D Engine** | Three.js, @react-three/fiber, @react-three/drei |
| **Animation** | Framer Motion, @use-gesture/react |
| **Styling** | Tailwind CSS 4 |
| **AI** | Claude API (Anthropic SDK) — Haiku for speed, Opus for quality |
| **Backend** | Express 5, SSE streaming |
| **Hosting** | Firebase Hosting |
| **Cache** | Local file + Firestore |

---

## Quick Start

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev             # starts client (5173) and server (3001)
```

Open `http://localhost:5173` — the pipeline runs automatically on the demo topic (SF Richmond + AI/Startup).

---

## Where This Goes

The sphere works for any body of discourse. Research papers cluster by methodology. News articles arrange by ideology. Public comments on a city proposal reveal the actual fault lines of disagreement. Classroom discussions show students the structure of their own reasoning.

But the core idea stays the same: **stop reading feeds. Start standing inside conversations.**

---

Built at the **Anthropic Claude Hackathon** — February 2026.

By **Rae**.

MIT License
