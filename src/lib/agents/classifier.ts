// A6: Classifier agent — fast single-post classification for user-submitted takes

import { callOpus, parseJSON } from './base.js'
import type {
  CosmosLayout,
  Labels,
  ClassifiedPost,
} from '../types.js'

const SYSTEM_PROMPT = `You are the Classifier for COSMOS, a spatial discussion visualization platform. Your job: rapidly classify a single user-submitted post into the existing discussion structure.

You receive:
1. The user's text
2. The established label vocabulary (stances, themes, root assumptions)
3. Cluster summaries from the existing layout

OUTPUT FORMAT (JSON only):
{
  "id": "user_post",
  "content": "<the user's text>",
  "author": "user",
  "parent_id": null,
  "depth": 0,
  "upvotes": 0,
  "stance": "<one of the established stances, or a new one if truly novel>",
  "themes": ["<theme1>", "<theme2>"],
  "emotion": "<passionate | analytical | frustrated | hopeful | fearful | sarcastic | neutral | aggressive | empathetic>",
  "post_type": "<argument | evidence | question | anecdote | meta | rebuttal>",
  "importance": <1-10>,
  "core_claim": "<one-sentence summary>",
  "assumptions": ["<assumption>"],
  "evidence_cited": [],
  "logical_chain": {
    "builds_on": [],
    "root_assumption": "<root assumption>",
    "chain_depth": 0
  },
  "perceived_by": {
    "<cluster_label>": {
      "relevance": <0.0-1.0>,
      "framing": "<how this group would see the user's take>"
    }
  },
  "embedding_hint": {
    "opinion_axis": <-1.0 to 1.0>,
    "abstraction": <-1.0 to 1.0>,
    "novelty": <-1.0 to 1.0>
  },
  "relationships": [
    {
      "target_id": "<closest existing post id>",
      "type": "<agrees | disagrees | builds_upon | tangent | rebuts>",
      "strength": <0.0-1.0>,
      "reason": "<brief explanation>"
    }
  ],
  "closest_posts": ["<id1>", "<id2>", "<id3>"],
  "relationship_to_closest": "<agrees | disagrees | builds_upon | tangent | rebuts>",
  "narrator_comment": "<A warm, brief 1-2 sentence comment from the narrator perspective about where this post fits in the discussion cosmos>"
}

RULES:
- Prefer existing labels over inventing new ones.
- closest_posts should be 2-4 post IDs that are most semantically similar.
- relationship_to_closest describes the dominant relationship to the closest set.
- narrator_comment should be friendly and spatial: "Your take lands right in the heart of the pragmatist cluster..." etc.`

export async function runClassifier(
  userText: string,
  layout: CosmosLayout,
  labels: Labels
): Promise<ClassifiedPost> {
  const clusterSummaries = layout.clusters.map((c) => ({
    id: c.id,
    label: c.label,
    summary: c.summary,
    center: c.center,
    post_ids: c.post_ids.slice(0, 5), // Just a sample for context
  }))

  // Include key posts for relationship matching
  const existingPosts = layout.posts
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 40)
    .map((p) => ({
      id: p.id,
      stance: p.stance,
      core_claim: p.core_claim,
      themes: p.themes,
      position: p.position,
    }))

  const userMessage = `USER'S TEXT:
${userText}

ESTABLISHED LABELS:
Stances: ${labels.stances.join(', ')}
Themes: ${labels.themes.join(', ')}
Root assumptions: ${labels.roots.join(', ')}

CLUSTERS:
${JSON.stringify(clusterSummaries, null, 2)}

EXISTING POSTS (most important):
${JSON.stringify(existingPosts, null, 2)}`

  const response = await callOpus({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4000,
  })

  return parseJSON<ClassifiedPost>(response)
}
