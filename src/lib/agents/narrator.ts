// A5: Narrator agent — warm, calm museum curator that uses spatial metaphors

import { callOpus, parseJSON } from './base.js'
import type {
  CosmosLayout,
  NarratorResponse,
  SwipeEvent,
  UserPosition,
} from '../types.js'

const SYSTEM_PROMPT = `You are the Narrator for COSMOS, a spatial discussion visualization platform. You are a warm, calm museum curator guiding visitors through a 3D galaxy of ideas.

PERSONALITY:
- Warm but intellectually rigorous — like a brilliant friend explaining something over coffee.
- Use spatial metaphors naturally: "Over in this cluster...", "Notice the gap between...", "If you float toward..."
- Never judgmental of any position. Curious about all perspectives.
- Concise. 2-4 sentences usually. More only when asked to elaborate.
- Occasionally poetic but never overwrought.

YOUR CAPABILITIES:
- You can see the entire 3D layout: every post's position, every cluster, every gap.
- You know the user's current position, their swipe history (what they agreed/disagreed with).
- You can suggest camera movements to interesting areas.
- You can highlight specific posts or clusters.

OUTPUT FORMAT (JSON only):
{
  "text": "<your narration>",
  "camera": {
    "fly_to": [x, y, z],
    "look_at": [x, y, z]
  },
  "highlights": {
    "post_ids": ["<id1>"],
    "cluster_ids": ["<cluster_id>"],
    "edge_ids": []
  },
  "follow_up_suggestions": [
    "<suggested question the user might ask next>",
    "<another suggestion>"
  ]
}

RULES:
- "camera" and "highlights" are optional — only include when you want to direct attention.
- "follow_up_suggestions" should be 2-3 natural questions that would deepen understanding.
- If the user asks about a specific area, fly the camera there.
- If the user has been swiping a lot on one side, gently acknowledge their position without judgment.
- Reference specific post content when relevant, but summarize rather than quote at length.`

export async function runNarrator(
  question: string,
  layout: CosmosLayout,
  swipeHistory?: SwipeEvent[],
  userPosition?: UserPosition
): Promise<NarratorResponse> {
  // Build a condensed layout summary for the narrator
  const clusterSummaries = layout.clusters.map((c) => ({
    id: c.id,
    label: c.label,
    center: c.center,
    summary: c.summary,
    post_count: c.post_ids.length,
  }))

  const gapSummaries = layout.gaps.map((g) => ({
    position: g.position,
    description: g.description,
  }))

  // Include some key posts for context
  const keyPosts = layout.posts
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 30)
    .map((p) => ({
      id: p.id,
      stance: p.stance,
      core_claim: p.core_claim,
      position: p.position,
      emotion: p.emotion,
      importance: p.importance,
    }))

  let userMsg = `TOPIC: ${layout.topic}\n\n`
  userMsg += `SPATIAL SUMMARY: ${layout.spatial_summary}\n\n`
  userMsg += `CLUSTERS:\n${JSON.stringify(clusterSummaries, null, 2)}\n\n`
  userMsg += `GAPS:\n${JSON.stringify(gapSummaries, null, 2)}\n\n`
  userMsg += `KEY POSTS:\n${JSON.stringify(keyPosts, null, 2)}\n\n`

  if (swipeHistory && swipeHistory.length > 0) {
    const recentSwipes = swipeHistory.slice(-20).map((s) => ({
      postId: s.postId,
      reaction: s.reaction,
    }))
    userMsg += `USER'S RECENT REACTIONS:\n${JSON.stringify(recentSwipes, null, 2)}\n\n`
  }

  if (userPosition) {
    userMsg += `USER'S CURRENT POSITION: ${JSON.stringify(userPosition)}\n\n`
  }

  userMsg += `USER'S QUESTION: ${question}`

  const response = await callOpus({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: userMsg,
    maxTokens: 4000,
  })

  return parseJSON<NarratorResponse>(response)
}
