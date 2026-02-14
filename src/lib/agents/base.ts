// A2: Opus 4.6 call wrapper using @anthropic-ai/sdk

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL_OPUS = 'claude-opus-4-6-20250219'
const MODEL_HAIKU = 'claude-haiku-4-5-20251001'
const MAX_RETRIES = 2

interface CallOpusParams {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
  model?: 'opus' | 'haiku'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse JSON from a model response, stripping markdown fences if present.
 * Attempts to recover truncated JSON arrays by finding the last complete object.
 */
export function parseJSON<T>(text: string): T {
  // Strip markdown code fences
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[\w]*\n?/, '')
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }
  cleaned = cleaned.trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Attempt to recover truncated JSON arrays
    if (cleaned.startsWith('[')) {
      console.warn('[parseJSON] Attempting truncated JSON array recovery...')
      // Find the last complete object boundary: "}," or "}" followed by possible whitespace
      const lastCompleteObj = cleaned.lastIndexOf('},')
      const lastObj = cleaned.lastIndexOf('}')
      const cutPoint = lastCompleteObj > 0 ? lastCompleteObj + 1 : lastObj > 0 ? lastObj + 1 : -1

      if (cutPoint > 1) {
        const repaired = cleaned.slice(0, cutPoint) + ']'
        try {
          const result = JSON.parse(repaired) as T
          const count = Array.isArray(result) ? result.length : '?'
          console.log(`[parseJSON] Recovered ${count} items from truncated array`)
          return result
        } catch (e2) {
          console.error('[parseJSON] Recovery also failed:', e2)
        }
      }
    }
    // Re-throw original error if recovery fails
    throw new Error(`JSON parse failed (length=${cleaned.length}): ${cleaned.slice(0, 100)}...`)
  }
}

/**
 * Call Opus 4.6 with retry logic (max 2 retries, exponential backoff).
 * Returns the raw text content from the response.
 */
export async function callOpus({
  systemPrompt,
  userMessage,
  maxTokens = 16000,
  model = 'haiku',
}: CallOpusParams): Promise<string> {
  const modelId = model === 'haiku' ? MODEL_HAIKU : MODEL_OPUS
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      })

      // Warn if response was truncated
      if (response.stop_reason === 'max_tokens') {
        console.warn(`[Opus] Response truncated (hit max_tokens=${maxTokens}). Output may be incomplete.`)
      }

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
