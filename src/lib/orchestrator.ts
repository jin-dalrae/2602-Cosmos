// A7: Full pipeline orchestrator
// harvest -> cartographer (batch 1 -> extract labels -> remaining batches in parallel) -> architect -> merge

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
 * Process a topic string into a COSMOS layout.
 */
// Sphere layout constants - articles on sphere surface around user at origin
const ARTICLE_RADIUS = 150  // radius of sphere where articles live

/**
 * Convert spherical coords (theta, phi in radians, radius) to cartesian [x, y, z].
 */
function sphericalToCartesian(theta: number, phi: number, r: number): [number, number, number] {
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ]
}

/**
 * Generate N points uniformly distributed on a sphere using Fibonacci spiral.
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
/**
 * Repulsion pass: push articles apart on the sphere surface so they don't visually stack.
 * Ensures a minimum angular separation between any two posts.
 */
function applyRepulsion(posts: CosmosPost[], minAngle: number, iterations: number): void {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const a = posts[i].position
        const b = posts[j].position
        const aLen = Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2) || 1
        const bLen = Math.sqrt(b[0] ** 2 + b[1] ** 2 + b[2] ** 2) || 1
        // Normalized directions
        const ax = a[0] / aLen, ay = a[1] / aLen, az = a[2] / aLen
        const bx = b[0] / bLen, by = b[1] / bLen, bz = b[2] / bLen
        // Angular distance via dot product
        const dot = ax * bx + ay * by + az * bz
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)))

        if (angle < minAngle) {
          // Push apart along the great circle between them
          // Cross product gives the rotation axis
          const cx = ay * bz - az * by
          const cy = az * bx - ax * bz
          const cz = ax * by - ay * bx
          const cLen = Math.sqrt(cx ** 2 + cy ** 2 + cz ** 2)

          if (cLen < 0.0001) continue // nearly identical or opposite, skip

          // Push each post away by half the deficit
          const push = (minAngle - angle) * 0.5
          // Perpendicular direction on sphere for each post
          // For post A: push away from B (toward the tangent direction)
          const tAx = by * az - bz * ay, tAy = bz * ax - bx * az, tAz = bx * ay - by * ax
          const tALen = Math.sqrt(tAx ** 2 + tAy ** 2 + tAz ** 2) || 1
          // For post B: opposite direction
          const rA = aLen, rB = bLen

          posts[i].position = [
            (ax + (tAx / tALen) * push) * rA,
            (ay + (tAy / tALen) * push) * rA,
            (az + (tAz / tALen) * push) * rA,
          ] as [number, number, number]
          // Re-normalize to sphere
          const newALen = Math.sqrt(posts[i].position[0] ** 2 + posts[i].position[1] ** 2 + posts[i].position[2] ** 2) || 1
          posts[i].position = [
            (posts[i].position[0] / newALen) * rA,
            (posts[i].position[1] / newALen) * rA,
            (posts[i].position[2] / newALen) * rA,
          ]

          posts[j].position = [
            (bx - (tAx / tALen) * push) * rB,
            (by - (tAy / tALen) * push) * rB,
            (bz - (tAz / tALen) * push) * rB,
          ] as [number, number, number]
          const newBLen = Math.sqrt(posts[j].position[0] ** 2 + posts[j].position[1] ** 2 + posts[j].position[2] ** 2) || 1
          posts[j].position = [
            (posts[j].position[0] / newBLen) * rB,
            (posts[j].position[1] / newBLen) * rB,
            (posts[j].position[2] / newBLen) * rB,
          ]
        }
      }
    }
  }
}

/**
 * Cluster posts by their ID prefix (e.g. "gd", "sc", "ai") and distribute
 * each cluster around its own center on the sphere. O(n), no AI needed.
 *
 * Algorithm:
 * 1. Group posts by 2-letter ID prefix → subtopic clusters
 * 2. Space cluster centers evenly on the equatorial band via golden angle
 * 3. Within each cluster, spread posts in a tight local patch using Fibonacci
 * 4. Light repulsion pass to prevent overlap
 */
function clusterLayout(posts: EnrichedPost[]): CosmosPost[] {
  // Group by prefix
  const groups = new Map<string, EnrichedPost[]>()
  for (const p of posts) {
    const prefix = p.id.replace(/[0-9]+$/, '') // e.g. "gd01" → "gd"
    if (!groups.has(prefix)) groups.set(prefix, [])
    groups.get(prefix)!.push(p)
  }

  const clusterKeys = [...groups.keys()]
  const numClusters = clusterKeys.length
  const golden = Math.PI * (3 - Math.sqrt(5))

  const cosmosPosts: CosmosPost[] = []

  clusterKeys.forEach((key, ci) => {
    const members = groups.get(key)!
    // Cluster center: spread around sphere using golden angle, stay in equatorial band
    const centerTheta = golden * ci * 3.5 // wider spread between clusters
    const centerPhi = Math.PI * 0.35 + (ci / Math.max(numClusters - 1, 1)) * Math.PI * 0.3 // phi 63°–117° band

    // Local Fibonacci spiral within cluster — tight radius (~15° patch)
    const clusterSpread = 0.26 // radians (~15°), how wide each cluster is
    const localFibs = fibonacciSphere(members.length)

    members.forEach((post, i) => {
      // Map local Fibonacci point to a small patch around cluster center
      const localTheta = localFibs[i].theta * clusterSpread * 0.5
      const localPhi = (localFibs[i].phi - Math.PI / 2) * clusterSpread * 0.5

      const theta = centerTheta + localTheta
      const phi = Math.max(0.35, Math.min(Math.PI - 0.35, centerPhi + localPhi))

      const position = sphericalToCartesian(theta, phi, ARTICLE_RADIUS)
      cosmosPosts.push({ ...post, position })
    })
  })

  // Light repulsion — just prevent direct overlap (~6°)
  applyRepulsion(cosmosPosts, 0.07, 6)

  return cosmosPosts
}

function buildPartialLayout(
  enrichedPosts: EnrichedPost[],
  topic: string,
  source: string,
  labels: Labels,
  startTime: number
): CosmosLayout {
  const cosmosPosts = clusterLayout(enrichedPosts)

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

  // ── Step 1: Generate community discussion from topic ──
  progress('Generating community discussion...', 3)
  const result = await generateDiscussion(input.trim(), (batchIdx, totalBatches, subtopic, postsSoFar) => {
    const pct = 3 + Math.round(((batchIdx + 1) / totalBatches) * 12)
    progress(`Generated ${subtopic}`, pct, `${postsSoFar} posts so far`)
  })
  const rawPosts = result.posts
  const topic = result.topic
  progress('Community generated', 15, `${rawPosts.length} posts across 7 topics`)

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
  // Use the architect's refined_positions when available, fallback to Fibonacci spiral
  progress('Assembling COSMOS...', 90)

  // Use cluster layout as base, then overlay architect refinements where available
  const cosmosPosts = clusterLayout(allEnriched)

  // Apply architect refinements for posts that have them
  for (const cp of cosmosPosts) {
    const refined = architectResult.refined_positions[cp.id]
    if (refined) {
      const thetaRad = (refined[0] * Math.PI) / 180
      const phiRad = (refined[1] * Math.PI) / 180
      const r = ARTICLE_RADIUS * (1 + refined[2] * 0.05)
      cp.position = sphericalToCartesian(thetaRad, phiRad, r)
    }
  }

  // Light repulsion to prevent overlap after architect adjustments (~6°)
  applyRepulsion(cosmosPosts, 0.07, 6)

  // Convert cluster centers and gap positions to sphere coordinates
  const layout: CosmosLayout = {
    topic,
    source: input,
    clusters: architectResult.clusters.map((c) => {
      const thetaRad = (c.center[0] * Math.PI) / 180
      const phiRad = (c.center[1] * Math.PI) / 180
      return { ...c, center: sphericalToCartesian(thetaRad, phiRad, ARTICLE_RADIUS) }
    }),
    gaps: architectResult.gaps.map((g) => {
      const thetaRad = (g.position[0] * Math.PI) / 180
      const phiRad = (g.position[1] * Math.PI) / 180
      return { ...g, position: sphericalToCartesian(thetaRad, phiRad, ARTICLE_RADIUS) }
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
