// Discussion generator agent — creates realistic community discussions
// Generates posts in batches by subtopic, then combines them

import { callOpus, parseJSON } from './base.js'
import type { RawPost } from '../types.js'

const SYSTEM_PROMPT = `You are a community forum simulator for COSMOS. You generate realistic neighborhood discussion posts.

Given a community context and a subtopic, generate the requested number of posts that feel like a real neighborhood forum (like Nextdoor, a local subreddit, or a community board).

REQUIREMENTS:
1. Generate the exact number of posts requested with diverse viewpoints.
2. Mix of: advice requests, personal stories, complaints, recommendations, debates, questions, helpful tips, rants, and supportive replies.
3. Mix of emotions: helpful, frustrated, passionate, sarcastic, grateful, analytical, concerned.
4. Some posts should be top-level (parent_id: null, depth: 0). Others should be replies.
5. Upvotes range from 5 to 500+ for popular posts.
6. Posts should be 1-4 sentences — casual, real, conversational. Not essays.
7. Usernames should feel like real neighborhood forum handles.
8. Include some disagreements and different perspectives.
9. Make replies reference the parent post naturally.

OUTPUT FORMAT (JSON array only, no other text):
[
  {
    "id": "XX01",
    "content": "Post text...",
    "author": "username",
    "parent_id": null,
    "depth": 0,
    "upvotes": 127
  }
]

RULES:
- IDs must use the PREFIX provided, followed by sequential numbers: PREFIX01, PREFIX02, etc.
- Top-level posts: parent_id: null, depth: 0
- Replies: parent_id references another post ID from THIS batch, depth: parent_depth + 1
- Keep it real — typos are fine, casual tone, some posts short and punchy
- NO markdown formatting in post content`

export interface SubtopicConfig {
  subtopic: string
  prefix: string
  count: number
}

export const SF_RICHMOND_SUBTOPICS: SubtopicConfig[] = [
  { subtopic: 'Community gardening — plots, shared gardens, plant exchanges, composting, growing food in foggy Richmond climate, succulents, backyard chickens', prefix: 'gd', count: 18 },
  { subtopic: 'Local schools and education — school quality, after-school programs, tutoring, school choice, playground safety, language immersion, PTA drama', prefix: 'sc', count: 15 },
  { subtopic: 'Parking and traffic — street parking wars, garage permits, double parking, delivery trucks blocking lanes, bike lanes vs car lanes, street cleaning tickets', prefix: 'pk', count: 15 },
  { subtopic: 'Neighborhood safety and crime — package theft, car break-ins, suspicious activity, neighborhood watch, police response times, catalytic converter theft', prefix: 'sf', count: 15 },
  { subtopic: 'Local restaurants and food — best dim sum on Clement St, new cafes, food trucks, beloved restaurant closures, supporting local businesses, bakery recommendations', prefix: 'fd', count: 15 },
  { subtopic: 'Housing and rent — rent increases, evictions, new construction, landlord issues, housing shortage, ADUs, roommate searches, noise complaints', prefix: 'hs', count: 14 },
  { subtopic: 'Parks and outdoor spaces — Golden Gate Park, Land\'s End trails, Ocean Beach bonfires, dog walking etiquette, playground equipment, foggy morning runs', prefix: 'pr', count: 12 },
]

export async function generateBatch(
  communityContext: string,
  subtopic: string,
  prefix: string,
  count: number,
  existingTopics?: string,
): Promise<RawPost[]> {
  let userMessage = `COMMUNITY: ${communityContext}\n\n`
  userMessage += `SUBTOPIC: ${subtopic}\n\n`
  userMessage += `Generate exactly ${count} posts. Use ID prefix "${prefix}" (e.g., ${prefix}01, ${prefix}02, ...).\n`

  if (existingTopics) {
    userMessage += `\nOther topics being discussed in this community: ${existingTopics}\n`
    userMessage += `Some posts can casually reference other community topics to feel connected.\n`
  }

  const response = await callOpus({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 8000,
  })

  return parseJSON<RawPost[]>(response)
}

/**
 * Generate a full community discussion with 100+ posts across multiple subtopics.
 * Calls onBatchComplete after each subtopic batch for progress reporting.
 */
export async function generateDiscussion(
  topic: string,
  onBatchComplete?: (batchIndex: number, totalBatches: number, subtopic: string, postsSoFar: number) => void,
): Promise<{
  posts: RawPost[]
  topic: string
}> {
  const subtopics = SF_RICHMOND_SUBTOPICS
  const communityContext = `${topic} — a neighborhood community forum for SF Richmond District, San Francisco. The Richmond is a foggy, diverse neighborhood between Golden Gate Park and the Presidio, known for great Asian food on Clement Street, Ocean Beach sunsets, and a strong sense of community. Residents are a mix of longtime families, young professionals, students, and retirees.`

  const allPosts: RawPost[] = []
  const completedTopics: string[] = []

  for (let i = 0; i < subtopics.length; i++) {
    const config = subtopics[i]
    const existingTopics = completedTopics.length > 0
      ? completedTopics.join(', ')
      : undefined

    const posts = await generateBatch(
      communityContext,
      config.subtopic,
      config.prefix,
      config.count,
      existingTopics,
    )

    allPosts.push(...posts)
    completedTopics.push(config.subtopic.split('—')[0].trim())

    onBatchComplete?.(i, subtopics.length, config.subtopic.split('—')[0].trim(), allPosts.length)
  }

  return {
    posts: allPosts,
    topic: 'SF Richmond District Community',
  }
}
