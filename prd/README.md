# COSMOS -- Product Requirements

**Status:** Production build (not a hackathon project)
**By:** Rae

---

## Feature Documents

| File | Feature |
|------|---------|
| [01-spatial-model.md](./01-spatial-model.md) | Planetarium inner-sphere, coordinate system, article placement |
| [02-navigation.md](./02-navigation.md) | Drag, click, browse mode, focus animation, smooth browsing |
| [03-temporal-depth.md](./03-temporal-depth.md) | Rank-based time ordering, fog effect, pinch zoom, scroll rotation |
| [04-visual-design.md](./04-visual-design.md) | Skybox, card design, emotion colors, warm theme |
| [05-head-pose.md](./05-head-pose.md) | Head-pose camera steering, gaze auto-browse, GazeLearner, auto-open toggle, privacy |
| [06-content-pipeline.md](./06-content-pipeline.md) | AI agents, SSE streaming, caching, data loading |
| [07-community.md](./07-community.md) | Voting, replies, user posts, persistence |
| [08-performance.md](./08-performance.md) | Visibility culling, card rendering, GPU compositing |
| [09-admin.md](./09-admin.md) | Admin dashboard, regeneration, cache management |
| [10-stack.md](./10-stack.md) | Tech stack, deployment, project structure |
| [11-legal-analytics.md](./11-legal-analytics.md) | Terms, Privacy (CCPA), Firebase Analytics, footer |

---

## Design Principles

These emerged from building the product. They're non-negotiable.

1. **Smooth browsing above all.** The experience must feel fluid and responsive at every moment. Stickiness, lag, or jank are bugs. Every interaction parameter (drag speed, animation duration, update rate) exists to serve this.

2. **Don't add features without discussion.** This is a real product, not a demo. Every user-facing change should be intentional and discussed first.

3. **Shading, not transparency.** Visual hierarchy uses brightness/darkness, not opacity. Cards dim via CSS `brightness()` filter, never go transparent.

4. **The user is inside.** The camera never moves from the origin. You rotate to look, you don't fly. This constraint makes the planetarium metaphor work.

5. **Spatial meaning.** Position on the sphere is not decorative -- it encodes opinion, abstraction, and time. The layout IS the content.
