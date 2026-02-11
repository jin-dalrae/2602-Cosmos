// A7: Full pipeline orchestrator
// harvest -> cartographer (batch 1 -> extract labels -> remaining batches in parallel) -> architect -> merge

import { fetchRedditThread } from './reddit.js'
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
 * Process a Reddit discussion URL through the full COSMOS pipeline.
 */
export async function processDiscussion(
  redditUrl: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<CosmosLayout> {
  const startTime = Date.now()
  const progress = (stage: string, percent: number, detail?: string) => {
    onProgress?.({ stage, percent, detail })
  }

  // ── Step 1: Harvest ──
  progress('Fetching Reddit discussion...', 5)
  const { posts: rawPosts, topic } = await fetchRedditThread(redditUrl)
  progress('Discussion fetched', 10, `${rawPosts.length} posts found`)

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
        return runCartographer(batchPosts, batchIdx, totalBatches, labels)
      },
      MAX_CONCURRENT
    )

    for (const batchResult of batchResults) {
      allEnriched = allEnriched.concat(batchResult)
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
  progress('Assembling COSMOS...', 90)

  const cosmosPosts: CosmosPost[] = allEnriched.map((post) => {
    const position = architectResult.refined_positions[post.id]
    return {
      ...post,
      position: position ?? [0, 0, 0] as [number, number, number],
    }
  })

  const layout: CosmosLayout = {
    topic,
    source: redditUrl,
    clusters: architectResult.clusters,
    gaps: architectResult.gaps,
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
