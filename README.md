# COSMOS

> *"You just read. The interface reads you back."*

COSMOS transforms online discussions from flat, endless scrolls into **spatial, navigable 3D experiences** — where AI understands both the conversation and how you read it.

---

## The Problem

- **800+ comment threads are unreadable.** Reddit, HN, Twitter — every discussion is a wall of text. The shape of a conversation is invisible.
- **Your input is impoverished.** Reading is rich — your eyes linger, your brow furrows, you lean in — but the interface only knows what you click.
- **Echo chambers are structural.** Platforms feed you what you already believe. Dissent gets buried. Nuance dies.

---

## What COSMOS Does

Every post gets analyzed by Claude for **stance, emotion, hidden assumptions, and logical ancestry**. Then it gets placed in 3D space — clustered by ideology, colored by emotion, connected by argument structure.

You explore the constellation by swiping cards. Agree, disagree, flip perspective, go deeper. The interface watches your eyes and face to understand what you *feel*, not just what you click.

**Agree with something? The strongest counterargument appears next.** Not to argue — to illuminate.

---

## How It Works

```
Community Discussion
        ↓
   Claude AI Pipeline
   (analyze · cluster · position · connect)
        ↓
   3D Constellation
        ↕
   You explore it
   swipe · gaze · orbit
```

Three modes, one fluid experience:

**READ** — Swipeable argument cards. Right = agree. Left = disagree. Up = flip to the opposing perspective. Down = trace the logical ancestry.

**MAP** — 3D constellation. Posts are stars. Clusters are galaxies. Edges are gravitational relationships between arguments.

**PERCEIVE** — Webcam gaze + face tracking. The interface detects where your eyes fixate, when your brow furrows, when you nod involuntarily. Gaze enhances — it never gates.

---

## AI Architecture

COSMOS runs a **multi-agent orchestration** powered by Claude:

| Agent | Role |
|-------|------|
| **Cartographer** | Analyzes each post — stance, emotion, assumptions, logical chains |
| **Architect** | Computes spatial layout — clusters, positions, relationships |
| **Narrator** | AI guide that answers questions about the discussion in context |
| **Classifier** | Real-time classification of user-submitted posts |
| **Generator** | Synthesizes discussion content from community topics |

The **anti-echo-chamber engine** rewires what you see next based on how you swipe:

| You swipe... | Next card is... |
|-------------|----------------|
| Agree (→) | Strongest counterargument |
| Disagree (←) | Someone who agrees with what you rejected |
| Flip (↑) | Post from the opposing cluster |
| Deeper (↓) | Logical parent in the argument chain |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Three.js (R3F), Framer Motion, Tailwind v4 |
| Backend | Express 5, Claude API (Anthropic SDK) |
| 3D Engine | @react-three/fiber, @react-three/drei |
| Perception | WebGazer.js, MediaPipe FaceMesh, @use-gesture |
| Infra | Vite 7, TypeScript 5.9, Firebase |

---

## Quick Start

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

---

## Built At

Built in 3 days at the **Anthropic Opus 4.6 Hackathon** — February 2026.

By **Rae**.

---

MIT License
