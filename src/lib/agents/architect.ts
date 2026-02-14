// A4: Architect agent — produces spatial layout with clusters, gaps, and 3D positions

import { callOpus, parseJSON } from './base.js'
import type { EnrichedPost, Labels, ArchitectResult } from '../types.js'

const SYSTEM_PROMPT = `You are the Architect, the spatial layout engine for COSMOS — a 3D discussion visualization platform that places posts on the inner surface of a sphere (planetarium model).

You receive all enriched posts (with their embedding_hints, stances, themes, and relationships) plus the established label vocabulary. Your job is to produce a coherent spatial layout on a sphere surface.

COORDINATE SYSTEM (spherical):
- theta (0–360°): Longitude / opinion spectrum. Opposing viewpoints sit on opposite sides of the sphere (~180° apart). Similar opinions cluster nearby.
- phi (30–150°): Latitude / abstraction level. 30° (near top pole) = abstract/theoretical/systemic. 150° (near bottom pole) = concrete/personal/anecdotal. Equator (~90°) = moderate abstraction.
- r_offset (-1 to +1): Fine depth adjustment. 0 = exactly on the sphere surface. Positive = slightly outward, negative = slightly inward. Use this for subtle differentiation within clusters.

SPATIAL RULES:
1. Identify 3-7 natural clusters based on stance + themes + embedding_hints.
2. Cluster centers must be at least 40° apart in angular distance from each other.
3. Individual posts should be within ~15° of their cluster center.
4. Use the FULL range of theta (0–360°) and phi (30–150°) — don't clump everything in one region.
5. Posts with similar semantic content should be CLOSE together on the sphere surface. Distance = dissimilarity.
6. Bridge posts (those that span multiple clusters) should be positioned between relevant clusters on the sphere.
7. Gaps should be in empty angular regions where missing perspectives would logically exist.

OUTPUT FORMAT (JSON only, no commentary):
{
  "clusters": [
    {
      "id": "<cluster_id>",
      "label": "<human-readable cluster name>",
      "center": [theta_deg, phi_deg, 0],
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
      "position": [theta_deg, phi_deg, 0],
      "description": "<what perspective is missing here>",
      "why_it_matters": "<why this gap matters to the discussion>"
    }
  ],
  "refined_positions": {
    "<post_id>": [theta_deg, phi_deg, r_offset],
    ...
  },
  "bridge_posts": ["<post_id_that_spans_clusters>", ...],
  "spatial_summary": "<A 2-3 sentence overview of the spatial layout and what it reveals about the discussion structure>"
}

CRITICAL RULES:
- Every post in the input MUST appear in refined_positions AND in exactly one cluster's post_ids.
- theta must be 0–360, phi must be 30–150, r_offset must be -1 to +1. All numeric (not strings).
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
