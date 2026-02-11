import type { CosmosPost, Reaction, Cluster } from './types'

/**
 * Anti-echo-chamber next-card selection.
 *
 * agree   -> strongest counterargument (opposing stance, highest importance)
 * disagree -> find a post that agrees with the disagreed post (same stance, evidence preferred)
 * deeper  -> logical parent (from builds_on chain)
 * flip    -> post from opposing cluster
 */
export function selectNextCard(
  currentPost: CosmosPost,
  reaction: Reaction,
  allPosts: CosmosPost[],
  clusters: Cluster[],
): CosmosPost | null {
  // Exclude the current post from candidates
  const others = allPosts.filter((p) => p.id !== currentPost.id)
  if (others.length === 0) return null

  switch (reaction) {
    case 'agree':
      return findStrongestCounterargument(currentPost, others)

    case 'disagree':
      return findAgreementWithDisagreed(currentPost, others)

    case 'deeper':
      return findLogicalParent(currentPost, others)

    case 'flip':
      return findFromOpposingCluster(currentPost, others, clusters)

    default:
      return null
  }
}

/**
 * agree -> find strongest counterargument
 * Looks for posts with an opposing stance and picks the one with highest importance.
 * Falls back to posts that explicitly disagree or rebut the current post.
 */
function findStrongestCounterargument(
  current: CosmosPost,
  candidates: CosmosPost[],
): CosmosPost | null {
  // First try: posts with a different stance, sorted by importance
  const opposingStance = candidates
    .filter((p) => p.stance !== current.stance)
    .sort((a, b) => b.importance - a.importance)

  if (opposingStance.length > 0) {
    return opposingStance[0]
  }

  // Fallback: posts that have a 'disagrees' or 'rebuts' relationship with current
  const directCounters = candidates.filter((p) =>
    p.relationships.some(
      (r) =>
        r.target_id === current.id &&
        (r.type === 'disagrees' || r.type === 'rebuts'),
    ),
  )

  if (directCounters.length > 0) {
    return directCounters.sort((a, b) => b.importance - a.importance)[0]
  }

  // Last fallback: any post with highest importance
  return candidates.sort((a, b) => b.importance - a.importance)[0] ?? null
}

/**
 * disagree -> find a post that agrees with the disagreed post
 * Same stance as the disagreed post, preferring evidence type.
 */
function findAgreementWithDisagreed(
  current: CosmosPost,
  candidates: CosmosPost[],
): CosmosPost | null {
  const sameStance = candidates.filter((p) => p.stance === current.stance)

  if (sameStance.length === 0) {
    // Fallback: return the most important remaining post
    return candidates.sort((a, b) => b.importance - a.importance)[0] ?? null
  }

  // Prefer evidence-type posts
  const evidencePosts = sameStance.filter((p) => p.post_type === 'evidence')
  if (evidencePosts.length > 0) {
    return evidencePosts.sort((a, b) => b.importance - a.importance)[0]
  }

  // Otherwise, highest importance among same-stance
  return sameStance.sort((a, b) => b.importance - a.importance)[0] ?? null
}

/**
 * deeper -> find logical parent from builds_on chain
 * Walks the current post's logical_chain.builds_on to find the most recent ancestor.
 */
function findLogicalParent(
  current: CosmosPost,
  candidates: CosmosPost[],
): CosmosPost | null {
  const buildsOn = current.logical_chain.builds_on

  if (buildsOn.length > 0) {
    // Walk the chain from most recent to oldest
    for (const ancestorId of [...buildsOn].reverse()) {
      const parent = candidates.find((p) => p.id === ancestorId)
      if (parent) return parent
    }
  }

  // Fallback: find posts that this post has a 'builds_upon' relationship with
  for (const rel of current.relationships) {
    if (rel.type === 'builds_upon') {
      const target = candidates.find((p) => p.id === rel.target_id)
      if (target) return target
    }
  }

  // Second fallback: find the post's parent by parent_id
  if (current.parent_id) {
    const parent = candidates.find((p) => p.id === current.parent_id)
    if (parent) return parent
  }

  // Last fallback: most important post with deeper chain_depth
  const deeperPosts = candidates
    .filter((p) => p.logical_chain.chain_depth > current.logical_chain.chain_depth)
    .sort((a, b) => b.importance - a.importance)

  return deeperPosts[0] ?? candidates.sort((a, b) => b.importance - a.importance)[0] ?? null
}

/**
 * flip -> find a post from the opposing cluster
 * Identifies which cluster the current post belongs to, then picks
 * a high-importance post from a different cluster.
 */
function findFromOpposingCluster(
  current: CosmosPost,
  candidates: CosmosPost[],
  clusters: Cluster[],
): CosmosPost | null {
  // Find the cluster this post belongs to
  const homeCluster = clusters.find((c) => c.post_ids.includes(current.id))

  if (!homeCluster) {
    // Can't determine cluster; return highest importance from different stance
    const different = candidates
      .filter((p) => p.stance !== current.stance)
      .sort((a, b) => b.importance - a.importance)
    return different[0] ?? candidates[0] ?? null
  }

  // Find posts from other clusters
  const otherClusterPostIds = new Set(
    clusters
      .filter((c) => c.id !== homeCluster.id)
      .flatMap((c) => c.post_ids),
  )

  const opposingPosts = candidates
    .filter((p) => otherClusterPostIds.has(p.id))
    .sort((a, b) => b.importance - a.importance)

  return opposingPosts[0] ?? candidates.sort((a, b) => b.importance - a.importance)[0] ?? null
}
