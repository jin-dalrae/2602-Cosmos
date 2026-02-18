# 06 -- Content Pipeline

## Intent

Generate an entire community discussion from a topic, enrich it with semantic metadata, and arrange it spatially. The pipeline should feel fast -- show partial results immediately, refine in the background.

---

## Architecture

```
Client (React)  <-- SSE -->  Express Server  -->  AI Pipeline  -->  Cache (File + MongoDB)
```

## Three-Tier Data Loading

Priority order for loading a layout:

1. **CDN / MongoDB check** -- `GET /api/layout/:topic`. If a stored layout exists, show it instantly.
2. **User posts merge** -- background fetch of `GET /api/posts/:topic`, deduplicate by ID, merge into layout.
3. **SSE pipeline** -- `POST /api/process` with `{ topic }`. Full AI pipeline with streaming progress.

The scene appears as soon as tier 1 or the first SSE batch lands.

## Pipeline Stages

### Stage 1: Generator

AI agent creates ~150+ posts across 7-10 subtopics. Sequential batches with cross-topic references.

### Stage 2: Cartographer

Enriches each raw post with structured metadata:

- `stance` -- descriptive label
- `themes` -- topic tags
- `emotion` -- one of 9 categories
- `post_type` -- argument, evidence, question, anecdote, meta, rebuttal
- `importance` -- 1-10
- `core_claim` -- one-sentence summary (card title)
- `assumptions` -- unstated assumptions
- `logical_chain` -- builds_on, root_assumption, chain_depth
- `perceived_by` -- how different stance groups frame this post
- `embedding_hint` -- 3D coordinates for rough positioning
- `relationships` -- connections with type, strength, reason

**Batch processing:** 30 posts per batch, max 3 concurrent. Batch 1 establishes labels. After each batch, a partial layout streams to client.

### Stage 3: Architect

Final spatial layout:
- 3-7 natural clusters
- Refined spherical positions `[theta_deg, phi_deg, r_offset]`
- Bridge posts spanning clusters
- Gaps -- empty regions where missing perspectives would exist
- Spatial summary

### Stage 4: Merge

Combine enriched data with architect positions. Cluster layout as base, architect refinements overlaid. Final repulsion pass.

## Additional Agents

- **Classifier:** Classifies a user post into the existing discussion. Returns position, closest posts, narrator comment.
- **Narrator:** "Warm, calm museum curator" that answers questions using spatial metaphors. Suggests camera movements, highlights posts.

## Caching

### File Cache (server-side)
- `server/.cache/` as JSON files
- Checked first on every SSE request
- If hit, returns immediately (no AI calls)

### MongoDB
- Connected via `MONGODB_URI` with 4s timeout
- Stores layouts and individual posts
- Pre-connects at startup
- Gracefully degrades if unavailable

## AI Model

- Anthropic API via `@anthropic-ai/sdk`
- Model: Claude (configurable per agent)
- Retry: max 2 retries with exponential backoff
- JSON parsing includes truncated-array recovery

## Key Files

- `src/hooks/useCosmosData.ts` -- SSE client, MongoDB check, user post merge
- `src/lib/orchestrator.ts` -- pipeline orchestrator
- `src/lib/agents/` -- generator, cartographer, architect, classifier, narrator
- `server/routes/process.ts` -- SSE endpoint + file cache
- `server/routes/layout.ts` -- MongoDB layout fetch
- `server/lib/db.ts` -- MongoDB connection
- `server/lib/store.ts` -- layout + post storage
