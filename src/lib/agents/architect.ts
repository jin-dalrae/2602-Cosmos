// A4: Architect agent — produces spatial layout with clusters, gaps, and 3D positions

import { callOpus, parseJSON } from './base.js'
import type { EnrichedPost, Labels, ArchitectResult } from '../types.js'

const SYSTEM_PROMPT = `You are the Architect, the spatial layout engine for COSMOS — a 3D discussion visualization platform.

You receive all enriched posts (with their embedding_hints, stances, themes, and relationships) plus the established label vocabulary. Your job is to produce a coherent 3D spatial layout.

COORDINATE SYSTEM:
- X axis: Primary opinion spectrum (-8 to +8). Left = one pole of the main debate, Right = the other.
- Y axis: Abstraction level (-6 to +6). Bottom = concrete/personal/anecdotal, Top = abstract/theoretical/systemic.
- Z axis: Novelty (-6 to +6). Back = common/repeated talking points, Front = novel insights.

SPATIAL RULES:
1. Identify 3-7 natural clusters based on stance + themes + embedding_hints.
2. Cluster centers must be at least 4 units apart from each other.
3. Individual posts should be within ~2 units of their cluster center.
4. Use the FULL range of the coordinate system — don't clump everything near origin.
5. Bridge posts (those that span multiple clusters) should be positioned between relevant clusters.
6. Gaps should be in empty regions of the space where missing perspectives would logically exist.

OUTPUT FORMAT (JSON only, no commentary):
{
  "clusters": [
    {
      "id": "<cluster_id>",
      "label": "<human-readable cluster name>",
      "center": [x, y, z],
      "summary": "<2-3 sentence summary of what this cluster represents>",
      "post_ids": ["<id1>", "<id2>", ...],
      "root_assumptions": ["<shared assumption 1>", ...],
      "perceived_as": {
        "<other_cluster_label>": "<how the other cluster sees this one>"
      }
    }
  ],
  "gaps": [
    {
      "position": [x, y, z],
      "description": "<what perspective is missing here>",
      "why_it_matters": "<why this gap matters to the discussion>"
    }
  ],
  "refined_positions": {
    "<post_id>": [x, y, z],
    ...
  },
  "bridge_posts": ["<post_id_that_spans_clusters>", ...],
  "spatial_summary": "<A 2-3 sentence overview of the spatial layout and what it reveals about the discussion structure>"
}

CRITICAL RULES:
- Every post in the input MUST appear in refined_positions AND in exactly one cluster's post_ids.
- Position values must be numeric (not strings).
- Cluster IDs should be descriptive lowercase slugs (e.g., "pro-regulation", "personal-stories").
- The spatial_summary should help a user understand the landscape at a glance.`

export async function runArchitect(
  posts: EnrichedPost[],
  labels: Labels,
  topic: string
): Promise<ArchitectResult> {
  // Build a condensed representation of each post for the architect
  const postSummaries = posts.map((p) => ({
    id: p.id,
    stance: p.stance,
    themes: p.themes,
    emotion: p.emotion,
    post_type: p.post_type,
    importance: p.importance,
    core_claim: p.core_claim,
    embedding_hint: p.embedding_hint,
    relationships: p.relationships,
    logical_chain: p.logical_chain,
    parent_id: p.parent_id,
    upvotes: p.upvotes,
  }))

  const userMessage = `TOPIC: ${topic}

ESTABLISHED LABELS:
Stances: ${labels.stances.join(', ')}
Themes: ${labels.themes.join(', ')}
Root assumptions: ${labels.roots.join(', ')}

TOTAL POSTS: ${posts.length}

ENRICHED POSTS:
${JSON.stringify(postSummaries, null, 2)}`

  const response = await callOpus({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 16000,
  })

  return parseJSON<ArchitectResult>(response)
}
