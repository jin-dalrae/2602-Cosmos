// A7: Full pipeline orchestrator
// harvest -> cartographer (batch 1 -> extract labels -> remaining batches in parallel) -> architect -> merge

import { fetchRedditThread } from './reddit.js'
import { generateDiscussion } from './agents/generator.js'
import { runCartographer, extractLabels } from './agents/cartographer.js'
import { runArchitect } from './agents/architect.js'
import { runNarrator } from './agents/narrator.js'
import { runClassifier } from './agents/classifier.js'
import type {
  EnrichedPost,
  CosmosPost,
  CosmosLayout,
  Labels,
  ProgressEvent,
  NarratorResponse,
  ClassifiedPost,
  SwipeEvent,
  UserPosition,
} from './types.js'

const BATCH_SIZE = 30
const MAX_CONCURRENT = 3

/**
 * Execute an async function over an array with limited concurrency.
 */
async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const idx = nextIndex++
      results[idx] = await fn(items[idx], idx)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  )
  await Promise.all(workers)
  return results
}

/**
 * Split an array into batches of a given size.
 */
function batch<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size))
  }
  return batches
}

/**
 * Check if the input looks like a URL.
 */
function isUrl(input: string): boolean {
  return /^https?:\/\//.test(input.trim())
}

/**
 * Process a discussion — from a Reddit URL or a topic string.
 * If a Reddit URL is provided but fetching fails, falls back to AI-generated discussion.
 */
// Sphere layout constants
const RADIUS_MIN = 16  // newest posts (closest to user at center)
const RADIUS_MAX = 24  // oldest posts (furthest from user)

/**
 * Convert spherical coords (theta in radians, phi in radians, radius) to cartesian [x, y, z].
 */
function sphericalToCartesian(theta: number, phi: number, r: number): [number, number, number] {
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

/**
 * Generate N points uniformly distributed on a sphere using the Fibonacci spiral.
 * Returns array of { theta, phi } in radians.
 */
function fibonacciSphere(n: number): { theta: number; phi: number }[] {
  const golden = Math.PI * (3 - Math.sqrt(5)) // golden angle
  const points: { theta: number; phi: number }[] = []
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * i) / (n - 1 || 1) // -1 to 1
    const theta = golden * i
    const phi = Math.acos(Math.max(-1, Math.min(1, y)))
    points.push({ theta, phi })
  }
  return points
}

/**
 * Build a rough CosmosLayout from enriched posts using embedding_hint values.
 * Used for partial/incremental rendering before the architect runs.
 * Posts are placed on a sphere: surface position from semantic hints, radius from age (index order).
 */
function buildPartialLayout(
  enrichedPosts: EnrichedPost[],
  topic: string,
  source: string,
  labels: Labels,
  startTime: number
): CosmosLayout {
  const total = enrichedPosts.length
  const fibs = fibonacciSphere(total)
  const cosmosPosts: CosmosPost[] = enrichedPosts.map((post, index) => {
    const { theta, phi } = fibs[index]
    // Age-based radius: earlier index = older = further from user
    const ageRatio = total > 1 ? index / (total - 1) : 0.5
    const r = RADIUS_MIN + ageRatio * (RADIUS_MAX - RADIUS_MIN)
    const position = sphericalToCartesian(theta, phi, r)
    return { ...post, position }
  })

  return {
    topic,
    source,
    clusters: [],
    gaps: [],
    posts: cosmosPosts,
    bridge_posts: [],
    spatial_summary: '',
    metadata: {
      total_posts: cosmosPosts.length,
      processing_time_ms: Date.now() - startTime,
      stance_labels: labels.stances,
      theme_labels: labels.themes,
      root_assumption_labels: labels.roots,
    },
  }
}

export async function processDiscussion(
  input: string,
  onProgress?: (event: ProgressEvent) => void,
  onPartialLayout?: (layout: CosmosLayout) => void
): Promise<CosmosLayout> {
  const startTime = Date.now()
  const progress = (stage: string, percent: number, detail?: string) => {
    onProgress?.({ stage, percent, detail })
  }

  // ── Step 1: Harvest (Reddit URL or generate from topic) ──
  let rawPosts: import('./types.js').RawPost[]
  let topic: string

  if (isUrl(input)) {
    // Try Reddit first, fall back to generation
    try {
      progress('Fetching Reddit discussion...', 5)
      const result = await fetchRedditThread(input)
      rawPosts = result.posts
      topic = result.topic
      progress('Discussion fetched', 10, `${rawPosts.length} posts found`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      progress('Reddit unavailable — generating discussion...', 3, msg)
      const urlTopic = input
        .replace(/.*\/comments\/[^/]+\//, '')
        .replace(/\/$/, '')
        .replace(/_/g, ' ')
        .replace(/\.json.*/, '')
      const result = await generateDiscussion(urlTopic || 'community discussion', (batchIdx, totalBatches, subtopic, postsSoFar) => {
        const pct = 3 + Math.round(((batchIdx + 1) / totalBatches) * 12)
        progress(`Generated ${subtopic}`, pct, `${postsSoFar} posts so far`)
      })
      rawPosts = result.posts
      topic = result.topic
      progress('Community generated', 15, `${rawPosts.length} posts created`)
    }
  } else {
    // Input is a topic — generate community discussion in batches
    progress('Generating community discussion...', 3)
    const result = await generateDiscussion(input.trim(), (batchIdx, totalBatches, subtopic, postsSoFar) => {
      const pct = 3 + Math.round(((batchIdx + 1) / totalBatches) * 12)
      progress(`Generated ${subtopic}`, pct, `${postsSoFar} posts so far`)
    })
    rawPosts = result.posts
    topic = result.topic
    progress('Community generated', 15, `${rawPosts.length} posts across 7 topics`)
  }

  if (rawPosts.length === 0) {
    throw new Error('No posts found in this discussion')
  }

  // ── Step 2: Cartographer (batch processing) ──
  const batches = batch(rawPosts, BATCH_SIZE)
  const totalBatches = batches.length

  // Batch 1: Establish labels
  progress('Analyzing first batch...', 15, `Batch 1/${totalBatches}`)
  const firstBatchEnriched = await runCartographer(
    batches[0],
    0,
    totalBatches
  )
  const labels = extractLabels(firstBatchEnriched)
  progress('Labels established', 25, `${labels.stances.length} stances, ${labels.themes.length} themes`)

  // Remaining batches: process in parallel with concurrency limit
  let allEnriched: EnrichedPost[] = [...firstBatchEnriched]

  // Emit first partial layout
  if (onPartialLayout) {
    onPartialLayout(buildPartialLayout(allEnriched, topic, input, labels, startTime))
  }

  if (batches.length > 1) {
    const remainingBatches = batches.slice(1)
    const batchResults = await parallelMap(
      remainingBatches,
      async (batchPosts, idx) => {
        const batchIdx = idx + 1 // offset by 1 since batch 0 already processed
        progress(
          'Analyzing posts...',
          25 + Math.round((batchIdx / totalBatches) * 35),
          `Batch ${batchIdx + 1}/${totalBatches}`
        )
        const result = await runCartographer(batchPosts, batchIdx, totalBatches, labels)

        // Emit partial layout with accumulated posts
        if (onPartialLayout) {
          allEnriched = allEnriched.concat(result)
          onPartialLayout(buildPartialLayout(allEnriched, topic, input, labels, startTime))
        }

        return result
      },
      MAX_CONCURRENT
    )

    if (!onPartialLayout) {
      for (const batchResult of batchResults) {
        allEnriched = allEnriched.concat(batchResult)
      }
    }
  }

  // Update labels with all batches
  const finalLabels = extractLabels(allEnriched)
  progress('All posts analyzed', 60, `${allEnriched.length} posts enriched`)

  // ── Step 3: Architect ──
  progress('Building spatial layout...', 65)
  const architectResult = await runArchitect(allEnriched, finalLabels, topic)
  progress('Layout computed', 85, `${architectResult.clusters.length} clusters`)

  // ── Step 4: Merge ──
  // Convert architect's spherical [theta_deg, phi_deg, r_offset] → cartesian
  // Radius is determined by post age (index order), with architect's r_offset as fine-tuning
  progress('Assembling COSMOS...', 90)

  const totalPosts = allEnriched.length
  const finalFibs = fibonacciSphere(totalPosts)
  const cosmosPosts: CosmosPost[] = allEnriched.map((post, index) => {
    const { theta, phi } = finalFibs[index]
    const ageRatio = totalPosts > 1 ? index / (totalPosts - 1) : 0.5
    const r = RADIUS_MIN + ageRatio * (RADIUS_MAX - RADIUS_MIN)
    const position = sphericalToCartesian(theta, phi, r)
    return { ...post, position }
  })

  // Convert cluster centers and gap positions from spherical to cartesian
  const RADIUS_MID = (RADIUS_MIN + RADIUS_MAX) / 2
  const layout: CosmosLayout = {
    topic,
    source: input,
    clusters: architectResult.clusters.map((c) => {
      const thetaRad = (c.center[0] * Math.PI) / 180
      const phiRad = (c.center[1] * Math.PI) / 180
      return { ...c, center: sphericalToCartesian(thetaRad, phiRad, RADIUS_MID) }
    }),
    gaps: architectResult.gaps.map((g) => {
      const thetaRad = (g.position[0] * Math.PI) / 180
      const phiRad = (g.position[1] * Math.PI) / 180
      return { ...g, position: sphericalToCartesian(thetaRad, phiRad, RADIUS_MID) }
    }),
    posts: cosmosPosts,
    bridge_posts: architectResult.bridge_posts,
    spatial_summary: architectResult.spatial_summary,
    metadata: {
      total_posts: cosmosPosts.length,
      processing_time_ms: Date.now() - startTime,
      stance_labels: finalLabels.stances,
      theme_labels: finalLabels.themes,
      root_assumption_labels: finalLabels.roots,
    },
  }

  progress('COSMOS ready', 100)
  return layout
}

/**
 * Classify a user's post within an existing COSMOS layout.
 */
export async function classifyUserPost(
  text: string,
  layout: CosmosLayout
): Promise<ClassifiedPost> {
  const labels: Labels = {
    stances: layout.metadata.stance_labels,
    themes: layout.metadata.theme_labels,
    roots: layout.metadata.root_assumption_labels,
  }

  return runClassifier(text, layout, labels)
}

/**
 * Ask the Narrator a question about a COSMOS layout.
 */
export async function askNarrator(
  question: string,
  layout: CosmosLayout,
  swipeHistory?: SwipeEvent[],
  userPosition?: UserPosition
): Promise<NarratorResponse> {
  return runNarrator(question, layout, swipeHistory, userPosition)
}
