// A2: Opus 4.6 call wrapper using @anthropic-ai/sdk

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-opus-4-6-20250219'
const MAX_RETRIES = 2

interface CallOpusParams {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse JSON from a model response, stripping markdown fences if present.
 */
export function parseJSON<T>(text: string): T {
  // Strip markdown code fences
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    // Remove opening fence (possibly with language tag)
    cleaned = cleaned.replace(/^```[\w]*\n?/, '')
    // Remove closing fence
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }
  return JSON.parse(cleaned) as T
}

/**
 * Call Opus 4.6 with retry logic (max 2 retries, exponential backoff).
 * Returns the raw text content from the response.
 */
export async function callOpus({
  systemPrompt,
  userMessage,
  maxTokens = 16000,
}: CallOpusParams): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      })

      // Extract text content
      const textBlock = response.content.find((block) => block.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Opus response')
      }

      return textBlock.text
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(
        `[Opus] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        lastError.message
      )

      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s
        console.log(`[Opus] Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  throw lastError ?? new Error('callOpus failed after retries')
}
