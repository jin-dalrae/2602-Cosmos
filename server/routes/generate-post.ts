// Generate a random AI post (content only — classification happens on submit)

import type { Request, Response } from 'express'
import { callOpus, parseJSON } from '../../src/lib/agents/base.js'
import type { CosmosLayout } from '../../src/lib/types.js'

const GENERATE_PROMPT = `You are a creative community member contributing to an online discussion. Generate a single realistic discussion post on the given topic.

OUTPUT FORMAT (JSON only):
{
  "title": "<short punchy headline, 5-12 words>",
  "content": "<1-3 sentences, conversational and opinionated>",
  "author": "<realistic username>"
}

RULES:
- Be creative and varied — pick a unique angle or perspective
- Use a mix of emotions: passionate, analytical, sarcastic, hopeful, frustrated, etc.
- Write naturally like a real person would in an online forum
- Keep it concise (1-3 sentences max)
- The title should be a catchy, opinionated headline
- The author name should be a creative username (e.g., "ParkSloper42", "TechSkeptic_99")`

export async function generatePostRoute(req: Request, res: Response) {
  const { layout } = req.body as { layout?: CosmosLayout }

  if (!layout) {
    res.status(400).json({ error: 'Missing layout' })
    return
  }

  try {
    // Sample some existing posts for context
    const samplePosts = layout.posts
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
      .map(p => p.core_claim)

    const existingThemes = layout.metadata.theme_labels.slice(0, 10).join(', ')

    const userMessage = `DISCUSSION TOPIC: ${layout.topic}

EXISTING THEMES: ${existingThemes}

SOME EXISTING POSTS (for context, don't repeat these):
${samplePosts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Generate one new, unique post that adds a fresh perspective to this discussion.`

    const raw = await callOpus({
      systemPrompt: GENERATE_PROMPT,
      userMessage,
      maxTokens: 500,
      model: 'haiku',
    })

    const generated = parseJSON<{ title: string; content: string; author: string }>(raw)

    // Return just the generated text — classification happens when user submits
    res.json({
      title: generated.title,
      content: generated.content,
      author: generated.author,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[GeneratePost] Error:', message)
    res.status(500).json({ error: message })
  }
}
