# COSMOS — Seed-Stage Business Plan
## Spatial Intelligence for How Humans Read, Discuss, and Decide

**Prepared for:** Seed Investment Round
**Founder:** Rae
**Stage:** Pre-seed / Seed
**Ask:** $1.5M seed round

---

## 1. THE PROBLEM

### 1.1 Online Discussion is Broken

Every day, 1.7 billion people read online discussions — Reddit, X, HackerNews, forums, comment sections. Every single one of these platforms presents conversation as a **flat, chronological list**. The topology of human debate — who agrees, who disagrees, what assumptions differ, where clusters form — is invisible.

The result:
- **Echo chambers** form because people can't see the full landscape of opinion
- **Nuance dies** because 800-comment threads are impossible to navigate
- **Fatigue wins** because reading 200 comments to find the 5 that matter is exhausting
- **Polarization accelerates** because algorithm-sorted lists reward extremes

### 1.2 Input Interfaces are Stuck in 1984

Every interface reduces human response to **point and click**. But reading is rich — your eyes linger on what matters, your head tilts toward what's interesting, you lean in when engaged. None of this reaches the interface.

Desktop: mouse + keyboard. Mobile: touch + scroll. AR/VR: controller + gaze. The hardware has evolved. The input paradigm hasn't.

### 1.3 AR/VR Has a Content Problem

Meta Quest sells 20M+ headsets but spatial computing lacks **spatial content**. Most VR apps are 2D panels floating in 3D space. The hardware renders a sphere around you — but the software doesn't think spatially.

---

## 2. THE SOLUTION: COSMOS

**COSMOS transforms any discourse landscape into a 3D spatial experience that you navigate with your body.**

You stand inside a planetarium sphere. Arguments float around you as cards — clustered by perspective, colored by emotion, connected by constellation lines. Multiple topics self-organize into different regions of the sky. AI understands the topology. Your head controls the view. You don't scroll. You look.

### 2.1 Core Thesis

> **Spatial arrangement of ideas + body-based navigation = the native interface for how humans think about complex topics.**

We don't think in lists. We think in landscapes — "the left thinks X, the right thinks Y, there's a middle ground somewhere between." COSMOS makes that mental model literal.

### 2.2 What Makes It Different

| Traditional | COSMOS |
|------------|--------|
| Flat list | 3D sphere (semantic topology) |
| Mouse/touch only | Head pose + mouse + pinch zoom + time scroll |
| One sort order | Spatial multi-topic landscape with temporal depth |
| Algorithm sorts for you | You see the whole landscape, scroll through time |
| Echo chamber by default | Spatial layout reveals all perspectives by design |
| Read passively | The interface reads you back (GazeLearner adapts to you) |

### 2.3 The AI Layer

Five Claude-powered agents transform raw discussion into spatial experience:

1. **Generator** — Creates synthetic discussion from any topic
2. **Cartographer** — Extracts stance, emotion, themes, assumptions, relationships from every post
3. **Architect** — Maps semantic analysis to 3D positions (opinion axis, abstraction level, novelty)
4. **Narrator** — Answers questions informed by what you've been looking at
5. **Classifier** — Places your own contribution on the sphere in real-time

This is not visualization. This is **spatial intelligence** — the AI doesn't just show you data, it understands the shape of the conversation.

### 2.4 The Spatial Model

A single sphere contains the entire discourse landscape. Different topics naturally cluster into different regions — housing in one area, transit in another, safety somewhere else. This isn't one-topic-per-sphere; it's a **living map of discourse** where the spatial position IS the meaning.

- **Angular position** = semantic content (opinion, abstraction, novelty)
- **Temporal depth** = time ordering via scroll (fog effect dims older/newer posts)
- **Pinch zoom** = FOV control to go "nearer" into the space
- **Constellation lines** = relationship edges between related arguments

---

## 3. MARKET OPPORTUNITY

### 3.1 Total Addressable Market

| Segment | Size | Why COSMOS |
|---------|------|-----------|
| **Online discussion platforms** | $15B (Reddit $10B valuation, Discord $15B) | Spatial discussion is a new category above flat threads |
| **AR/VR content** | $12B by 2028 | Headsets need spatial-native apps, not ported 2D |
| **Enterprise collaboration** | $47B (Slack, Teams, Notion) | Team decisions = discussions that need spatial mapping |
| **Digital signage & ambient displays** | $27B by 2028 | Ambient mode: living discourse displays for offices, lobbies, newsrooms |
| **Education** | $8B (edtech debate/critical thinking) | Teach perspective-taking through spatial argument exploration |
| **Media & journalism** | $3B | Visualize public discourse on any topic |

**Initial TAM:** $15B (discussion platform enhancement + AR/VR content)
**SAM:** $2B (power users who read discussions deeply: researchers, analysts, journalists, engaged citizens)
**SOM Year 1:** $5M ARR (50K paying users at $8/mo)

### 3.2 Why Now

1. **LLMs can finally understand discussion** — semantic analysis at the quality needed wasn't possible 2 years ago
2. **MediaPipe runs on-device** — head pose tracking in the browser, zero latency, zero privacy cost
3. **Meta Quest 3 + Apple Vision Pro** — spatial computing is mainstream. 30M+ headsets by 2026
4. **WebXR is mature** — same codebase runs on desktop, VR headset, and AR glasses
5. **Discussion fatigue is peak** — Reddit IPO'd, but users are burned out on infinite scroll
6. **Ambient computing is emerging** — smart displays, digital signage, always-on dashboards want spatial content

---

## 4. PRODUCT ROADMAP

### Phase 1: Web App (Now — Month 6)
**Status: Production (live at cosmosweb.web.app)**

Built and deployed:
- Browser-based 3D planetarium sphere with multi-topic spatial layout
- Head-pose navigation via webcam (MediaPipe, 60fps detection)
- Passive gaze calibration (GazeLearner — learns from natural clicks, no calibration step)
- Auto-calibration with rolling recalibration (adapts to posture changes)
- Reading protection (small head movements while reading don't trigger navigation)
- Pinch zoom (FOV 30°–110°) separate from time scroll
- Temporal depth: rank-based time ordering with fog effect, endless scroll rotation
- AI-powered discussion analysis (5 agents via SSE streaming)
- Live user post classification + spatial placement
- Voting, replies, user posts with MongoDB persistence
- Mode toggles: Gaze / Drag / Auto-open (top-right controls)
- Visibility culling + performance optimization

**Revenue:** Freemium. Free: 3 discussions/month. Pro ($8/mo): unlimited + saved spheres + narrator AI

### Phase 1.5: Ambient Mode (Month 3 — Month 6)

**COSMOS as a living display:**
- Sphere slowly auto-rotates, time scroll gently cycles through posts
- Each card briefly highlights as it comes into focus — like a slow heartbeat of discourse
- Perfect for: office lobbies, newsroom screens, conference displays, classroom walls
- Shows "what is the world thinking about X right now?" as ambient spatial art
- No interaction needed — pure observation mode
- Optional: sync to live data feeds (new posts appear as new stars)

**Use cases:**
- **Newsrooms:** Ambient public opinion landscape on today's top story
- **Corporate offices:** Team discussion sphere on the lobby screen — visitors see the company thinking spatially
- **Conferences:** Live event discussion sphere projected on screens — attendees see the conversation evolve
- **Classrooms:** "This is what the debate on climate policy looks like" — spatial critical thinking
- **Personal:** Desktop widget / screensaver — your favorite topic, always gently turning

**Revenue:** Included in Pro. Enterprise ambient license ($50/display/mo) for commercial spaces.

### Phase 2: VR/AR Native (Month 6 — Month 12)

**Meta Quest / Apple Vision Pro:**
- Same sphere, but you're physically inside it
- Hand tracking replaces mouse (pinch to select, wave to browse)
- Eye tracking replaces head pose (Quest Pro, Vision Pro have built-in eye trackers)
- Spatial audio: cluster narration comes from the direction of the cluster
- Room-scale: walk toward a cluster to zoom in

**Key insight:** Our architecture is already spatial. Porting to VR is additive (better input), not rewrite. GazeLearner transfers directly — it already learns from natural interaction.

**Meta Glass (Orion) / AR Glasses:**
- Persistent discussion sphere overlaid on the real world
- "Pin" a discussion to your desk — glance at it while working
- Head-turn navigation is the native interaction for glasses
- Notification: "The discussion you're tracking shifted — new perspective emerged"

**Revenue:** Premium tier ($15/mo) for VR/AR features. Platform partnerships with Meta/Apple.

### Phase 3: Enterprise & Collaboration (Month 12 — Month 24)

**Team COSMOS:**
- Shared spheres for team decisions (strategy, product, hiring)
- See where your team members have spent time (attention heatmaps)
- AI synthesis: "Your team clusters into 3 perspectives on this decision"
- Integration with Slack/Teams/Notion

**Analyst COSMOS:**
- Public opinion mapping for any topic (scrape Twitter, Reddit, news comments)
- Time-series: watch opinion landscape shift over days/weeks via time scroll
- Export spatial topology as reports
- API for newsrooms, research firms, political analysts

**Revenue:** Enterprise SaaS ($25-50/seat/month). Analyst API ($200/mo).

### Phase 4: Platform (Month 24+)

- **COSMOS Protocol:** Open standard for spatial discussion data
- **Embeddable widget:** `<cosmos-sphere>` web component — any site can embed a 3D discussion section
- **Cross-sphere navigation:** Jump between related discourse landscapes
- **Attention analytics:** Aggregated, anonymized gaze data — "which arguments attract the most visual attention?"
- **Reputation:** Your position across multiple spheres = your intellectual fingerprint

---

## 5. AR/VR GO-TO-MARKET

### 5.1 Meta Quest Strategy

**Why Meta wants this:**
- Quest store needs "killer apps" beyond gaming
- Discussion/social is Meta's core business — spatial discussion aligns perfectly
- Head/eye tracking hardware is underutilized by existing apps
- COSMOS showcases Quest Pro's eye tracking (a key differentiator)

**Approach:**
1. Launch on Quest App Lab (Month 6) — early access, build community
2. Apply for Meta Start fund / Horizon partnership
3. Pitch: "The first native spatial discussion app for Quest"
4. Feature request: spotlight in Quest Store "Productivity" and "Social" categories

### 5.2 Meta Ray-Ban / Orion AR Glasses

**Why it's perfect for glasses:**
- Head-turn is the ONLY input on glasses (no controller, no hand tracking in v1)
- COSMOS already uses head-pose as primary navigation — zero adaptation needed
- Always-on ambient information: pin a discussion sphere to your peripheral vision
- "Glanceable" spatial data — turn your head to browse perspectives

**Pitch to Meta:**
> "We built the first app where turning your head IS the interface. On Quest, it's immersive. On glasses, it's ambient. Same engine, same experience, native to both form factors."

### 5.3 Apple Vision Pro

- Eye tracking as primary input (visionOS design language)
- Spatial computing emphasis — Apple rewards spatial-native apps
- Premium audience willing to pay for premium content experiences
- visionOS App Store featured placement for spatial-native apps

### 5.4 Platform Partnership Model

Rather than competing with platforms, we enhance them:

| Partner | Integration | Value to Partner |
|---------|-------------|-----------------|
| **Meta** | Native Quest/glasses app | Showcases spatial computing capabilities |
| **Reddit** | Embeddable sphere widget on threads | Differentiates Reddit from competitors |
| **Discord** | Spatial view of server discussions | Premium feature for Nitro subscribers |
| **Substack** | Spatial comment sections | Engagement + differentiation |
| **News orgs** | Ambient mode on newsroom displays + embedded opinion maps | Reader engagement + editorial insight |

---

## 6. BUSINESS MODEL

### 6.1 Revenue Streams

| Stream | Price | Timeline |
|--------|-------|----------|
| **COSMOS Pro** (individual) | $8/mo | Now |
| **COSMOS Ambient** (commercial displays) | $50/display/mo | Month 4 |
| **COSMOS VR** (headset premium) | $15/mo | Month 8 |
| **COSMOS Team** (enterprise) | $25-50/seat/mo | Month 14 |
| **COSMOS API** (developers/analysts) | $200/mo base + usage | Month 12 |
| **Attention analytics** | Custom pricing | Month 18 |
| **Platform licensing** | Revenue share | Month 18 |

### 6.2 Unit Economics (Pro tier)

| Metric | Value |
|--------|-------|
| **Price** | $8/mo ($96/yr) |
| **AI cost per discussion** | ~$0.45 (Claude API) |
| **Avg discussions/user/month** | 8 |
| **AI cost/user/month** | $3.60 |
| **Gross margin** | 55% |
| **CAC (estimated)** | $15 (organic + content marketing) |
| **LTV (12-month retention)** | $96 × 0.7 retention = $67 |
| **LTV:CAC** | 4.5x |

At scale, AI costs decrease (caching, smaller models for repeat analysis, batch optimization). Target 70%+ gross margin at 100K users.

### 6.3 Cost Structure (Year 1)

| Category | Monthly | Annual |
|----------|---------|--------|
| **Founding team (3)** | $30K | $360K |
| **Cloud / AI API** | $15K | $180K |
| **VR dev hardware** | — | $20K |
| **Office / tools** | $5K | $60K |
| **Marketing / community** | $10K | $120K |
| **Legal / IP** | — | $30K |
| **Buffer** | — | $230K |
| **Total** | | **$1.0M** |

$1.5M seed provides ~18 months runway with conservative spending.

---

## 7. COMPETITIVE LANDSCAPE

### 7.1 Direct Competitors

**None.** No one combines:
- AI-powered discussion understanding
- 3D spatial visualization
- Body-based input (head pose / eye tracking)
- Passive self-calibrating gaze system
- Temporal depth with spatial ordering

### 7.2 Adjacent Players

| Company | What they do | Why we're different |
|---------|-------------|-------------------|
| **Kialo** | Structured debate (tree view) | Manual structure, 2D, no AI, no body input |
| **Pol.is** | Opinion clustering (2D scatter) | Statistical only, no AI understanding, 2D |
| **Spatial.io** | VR meeting rooms | Meeting tool, not discussion understanding |
| **Miro** | Visual collaboration boards | Manual boards, no AI topology, no body input |
| **Reddit** | Discussion platform | Flat lists, no spatial intelligence |

### 7.3 Moat

1. **AI pipeline depth:** 5 specialized agents working together — not a single API call but an orchestrated intelligence system
2. **GazeLearner:** Self-calibrating gaze system that learns from natural clicks — no explicit calibration, gets more accurate the more you use it. This is a unique interaction model.
3. **Interaction patents:** Position-based head-pose steering with auto-calibration + gaze-lead article selection + reading protection + passive gaze correction
4. **Cross-platform spatial engine:** Same architecture works desktop → VR → AR glasses → ambient displays
5. **Data network effect:** More discussions mapped → better Architect positioning → better experience → more users
6. **Ambient mode:** Transforms COSMOS from "app you open" to "surface that's always on" — dramatically increases exposure time and stickiness

---

## 8. TEAM

### Founding Team Needs

| Role | Responsibility | Status |
|------|---------------|--------|
| **CEO / Product** (Rae) | Vision, product, AI pipeline, demo | In place |
| **CTO / 3D Engineer** | WebGL, WebXR, VR optimization, spatial audio | Hiring |
| **Head of AI** | Agent system, prompt engineering, model optimization | Hiring |

### Key Hires (Month 3-6)

- VR/AR Engineer (Quest + Vision Pro native)
- Full-stack Engineer (scale web app, API)
- Designer (spatial UX, VR interaction patterns)

---

## 9. TRACTION & MILESTONES

### Current (Production Web App)

**Live at cosmosweb.web.app** — deployed on Firebase Hosting + Google Cloud Run

Built and working:
- Full 3D planetarium sphere with multi-topic spatial layout
- 5 AI agents operational (Generator, Cartographer, Architect, Narrator, Classifier)
- Head-pose tracking at 60fps with rolling recalibration + GazeLearner passive calibration
- Reading protection (eye scanning doesn't trigger navigation)
- Temporal depth with rank-based time ordering, fog effect, endless scroll rotation
- Pinch zoom (FOV control) separate from time scroll
- Mode toggles: Gaze / Drag / Auto-open
- SSE streaming for progressive discussion loading
- Live post classification and spatial placement
- Voting, replies, user posts with MongoDB persistence
- Admin dashboard for content management

### Month 3 Milestones

- [ ] Ambient mode shipped
- [ ] 1,000 beta users
- [ ] 50 saved discussion spheres
- [ ] Public launch on Product Hunt
- [ ] NPS > 40

### Month 6 Milestones

- [ ] 10,000 users (2,000 Pro subscribers = $16K MRR)
- [ ] 10 ambient mode commercial deployments ($500/mo each)
- [ ] Quest App Lab submission
- [ ] API beta for 10 partner developers
- [ ] Series A pipeline started

### Month 12 Milestones

- [ ] 50,000 users (12,000 Pro + VR subscribers = $150K MRR)
- [ ] Live on Quest Store + Vision Pro
- [ ] 100 ambient displays (newsrooms, offices, schools)
- [ ] 5 enterprise pilot customers
- [ ] Series A closed ($5-8M)

---

## 10. USE OF FUNDS ($1.5M Seed)

| Allocation | Amount | Purpose |
|-----------|--------|---------|
| **Engineering** (3 hires) | $600K | CTO, VR engineer, full-stack |
| **AI Infrastructure** | $200K | Claude API, model optimization, caching layer |
| **VR/AR Development** | $150K | Quest + Vision Pro builds, spatial audio, hand tracking |
| **Operations** | $200K | Legal, cloud, tools, office |
| **Marketing & Community** | $150K | Product Hunt, content, dev community, VR community |
| **Reserve** | $200K | 3-month buffer for market timing |

**Runway:** 18 months to Series A metrics ($150K+ MRR)

---

## 11. VISION

In 5 years, every major discussion platform offers a "spatial view." Enterprise teams map decisions spatially before making them. Students learn critical thinking by navigating argument spheres. AR glasses show you the landscape of opinion on any topic, ambient in your peripheral vision. Office lobbies display slowly turning discourse spheres — visitors see the company thinking in space.

COSMOS is not a visualization tool. It's a new medium — **spatial intelligence for human discourse**.

The mouse says what you do. Your eyes say what you see. Your head says where you're drawn. The AI understands all three — and the conversation. It learns how you look, adapts to your posture, and gets better every time you click.

**We don't read discussions anymore. They read us back.**

---

*For questions or to schedule a meeting: [contact info]*
