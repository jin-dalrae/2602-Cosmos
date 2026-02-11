// A3: Cartographer agent — analyzes discussion posts in batches, extracts rich metadata

import { callOpus, parseJSON } from './base.js'
import type { RawPost, EnrichedPost, Labels } from '../types.js'

const SYSTEM_PROMPT = `You are the Cartographer, an expert discourse analyst for COSMOS — a spatial discussion visualization platform.

Your job: Analyze a batch of discussion posts and produce rich, structured metadata for each one.

For EACH post, output:
{
  "id": "<post id>",
  "stance": "<descriptive label for the author's position>",
  "themes": ["<theme1>", "<theme2>"],
  "emotion": "<one of: passionate | analytical | frustrated | hopeful | fearful | sarcastic | neutral | aggressive | empathetic>",
  "post_type": "<one of: argument | evidence | question | anecdote | meta | rebuttal>",
  "importance": <1-10 integer — how central is this to the discussion?>,
  "core_claim": "<one-sentence summary of what this post argues or states>",
  "assumptions": ["<unstated assumption the author relies on>"],
  "evidence_cited": ["<any evidence, sources, or data points mentioned>"],
  "logical_chain": {
    "builds_on": ["<ids of posts this logically extends>"],
    "root_assumption": "<the foundational belief this argument chain rests on>",
    "chain_depth": <how many logical steps from a root assumption, 0-5>
  },
  "perceived_by": {
    "<cluster/stance label>": {
      "relevance": <0.0-1.0>,
      "framing": "<how this group would perceive/frame this post>"
    }
  },
  "embedding_hint": {
    "opinion_axis": <-1.0 to 1.0 — where this sits on the main opinion spectrum>,
    "abstraction": <-1.0 to 1.0 — concrete/personal (-1) to abstract/theoretical (+1)>,
    "novelty": <-1.0 to 1.0 — common refrain (-1) to genuinely novel point (+1)>
  },
  "relationships": [
    {
      "target_id": "<id of related post>",
      "type": "<one of: agrees | disagrees | builds_upon | tangent | rebuts>",
      "strength": <0.0-1.0>,
      "reason": "<brief explanation>"
    }
  ]
}

CRITICAL RULES:
1. Use CONSISTENT labels across all posts. If batch 1 established stance labels like "pro-regulation" and "free-market", reuse those exact strings.
2. The "perceived_by" field should reference the major stance clusters you identify. Each post should show how 2-3 different groups would perceive it.
3. Relationships should reference actual post IDs from the batch. Only reference IDs you can see.
4. embedding_hint values are crucial for spatial layout — be precise and spread values across the full range.
5. importance should follow a power distribution: most posts 3-6, few at 1-2 or 8-10.

Output a JSON array of enriched post objects. Nothing else — no commentary, no markdown, just valid JSON.`

function buildUserMessage(
  posts: RawPost[],
  batchIndex: number,
  totalBatches: number,
  existingLabels?: Labels
): string {
  let msg = `BATCH ${batchIndex + 1} of ${totalBatches}\n\n`

  if (existingLabels && batchIndex > 0) {
    msg += `ESTABLISHED LABELS (you MUST reuse these for consistency):\n`
    msg += `Stances: ${existingLabels.stances.join(', ')}\n`
    msg += `Themes: ${existingLabels.themes.join(', ')}\n`
    msg += `Root assumptions: ${existingLabels.roots.join(', ')}\n\n`
  }

  msg += `POSTS TO ANALYZE:\n\n`

  for (const post of posts) {
    msg += `---\n`
    msg += `ID: ${post.id}\n`
    msg += `Author: ${post.author}\n`
    msg += `Parent: ${post.parent_id ?? 'none (top-level)'}\n`
    msg += `Depth: ${post.depth}\n`
    msg += `Upvotes: ${post.upvotes}\n`
    msg += `Content: ${post.content}\n\n`
  }

  return msg
}

/**
 * Run the Cartographer agent on a batch of posts.
 */
export async function runCartographer(
  posts: RawPost[],
  batchIndex: number,
  totalBatches: number,
  existingLabels?: Labels
): Promise<EnrichedPost[]> {
  const userMessage = buildUserMessage(posts, batchIndex, totalBatches, existingLabels)

  const response = await callOpus({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 16000,
  })

  const enriched = parseJSON<EnrichedPost[]>(response)

  // Merge raw post data that might have been lost
  return enriched.map((enrichedPost) => {
    const raw = posts.find((p) => p.id === enrichedPost.id)
    return {
      ...enrichedPost,
      content: raw?.content ?? enrichedPost.content,
      author: raw?.author ?? enrichedPost.author,
      parent_id: raw?.parent_id ?? enrichedPost.parent_id,
      depth: raw?.depth ?? enrichedPost.depth,
      upvotes: raw?.upvotes ?? enrichedPost.upvotes,
    }
  })
}

/**
 * Extract unique labels from a batch of enriched posts for cross-batch consistency.
 */
export function extractLabels(posts: EnrichedPost[]): Labels {
  const stances = new Set<string>()
  const themes = new Set<string>()
  const roots = new Set<string>()

  for (const post of posts) {
    if (post.stance) stances.add(post.stance)
    if (post.themes) {
      for (const t of post.themes) themes.add(t)
    }
    if (post.logical_chain?.root_assumption) {
      roots.add(post.logical_chain.root_assumption)
    }
  }

  return {
    stances: [...stances],
    themes: [...themes],
    roots: [...roots],
  }
}
