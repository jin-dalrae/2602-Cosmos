import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CosmosPost } from '../../lib/types'
import { getEmotionColors, UI_COLORS, BG_DARK } from '../shared/EmotionPalette'

interface ArgumentDNAProps {
  post: CosmosPost
  allPosts: CosmosPost[]
  onClose: () => void
}

interface AncestryNode {
  post: CosmosPost
  depth: number
}

/**
 * Recursively walks `builds_on` to build the logical ancestry chain
 * from the current post down to the root assumption.
 */
function buildAncestryChain(
  post: CosmosPost,
  allPosts: CosmosPost[],
): AncestryNode[] {
  const postMap = new Map(allPosts.map((p) => [p.id, p]))
  const chain: AncestryNode[] = [{ post, depth: 0 }]
  const visited = new Set<string>([post.id])

  let current = post
  let depth = 1

  while (current.logical_chain.builds_on.length > 0) {
    const parentId = current.logical_chain.builds_on[0]
    if (visited.has(parentId)) break

    const parent = postMap.get(parentId)
    if (!parent) break

    visited.add(parentId)
    chain.push({ post: parent, depth })
    current = parent
    depth++
  }

  return chain
}

/**
 * Finds posts that share the same root_assumption but are in different clusters.
 */
function findUnexpectedAllies(
  post: CosmosPost,
  allPosts: CosmosPost[],
): CosmosPost[] {
  const rootAssumption = post.logical_chain.root_assumption
  if (!rootAssumption) return []

  return allPosts.filter(
    (p) =>
      p.id !== post.id &&
      p.logical_chain.root_assumption === rootAssumption &&
      p.stance !== post.stance,
  )
}

export default function ArgumentDNA({ post, allPosts, onClose }: ArgumentDNAProps) {
  const ancestryChain = useMemo(
    () => buildAncestryChain(post, allPosts),
    [post, allPosts],
  )

  const unexpectedAllies = useMemo(
    () => findUnexpectedAllies(post, allPosts),
    [post, allPosts],
  )

  const rootAssumption = post.logical_chain.root_assumption

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: UI_COLORS.overlay }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl p-6 pb-10"
          style={{
            backgroundColor: BG_DARK,
            borderTop: '2px solid #D4B872',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: UI_COLORS.textSecondary,
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>

          {/* Title */}
          <h3
            className="text-sm font-medium uppercase tracking-wider mb-5"
            style={{ color: '#D4B872' }}
          >
            Argument DNA
          </h3>

          {/* Ancestry chain */}
          <div className="relative pl-4">
            {ancestryChain.map((node, index) => {
              const colors = getEmotionColors(node.post.emotion)
              const isFirst = index === 0
              const isLast = index === ancestryChain.length - 1

              return (
                <div key={node.post.id} className="relative">
                  {/* Vertical connector line */}
                  {!isLast && (
                    <div
                      className="absolute left-0 top-full w-px"
                      style={{
                        height: 24,
                        backgroundColor: '#D4B872',
                        opacity: 0.5,
                        transform: 'translateX(11px)',
                      }}
                    />
                  )}

                  {/* Node dot on the line */}
                  <div
                    className="absolute left-0 top-3 w-[7px] h-[7px] rounded-full"
                    style={{
                      backgroundColor: isFirst ? '#D4B872' : colors.accent,
                      transform: 'translateX(8px)',
                      boxShadow: isFirst ? '0 0 8px rgba(212,184,114,0.5)' : 'none',
                    }}
                  />

                  {/* Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    className="ml-6 mb-6 rounded-lg p-3"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderLeft: `3px solid ${colors.accent}`,
                    }}
                  >
                    <p
                      className="text-sm leading-snug mb-1.5"
                      style={{
                        color: UI_COLORS.textPrimary,
                        fontFamily: 'Georgia, "Times New Roman", serif',
                      }}
                    >
                      {node.post.core_claim}
                    </p>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${colors.accent}25`,
                        color: colors.accent,
                        fontSize: 11,
                      }}
                    >
                      {node.post.stance}
                    </span>
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* Root assumption highlight */}
          {rootAssumption && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: ancestryChain.length * 0.08 + 0.1, duration: 0.3 }}
              className="mt-2 mb-6 rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(212, 184, 114, 0.08)',
                border: '1px dashed rgba(212, 184, 114, 0.35)',
              }}
            >
              <span
                className="block text-xs uppercase tracking-wider mb-2 font-medium"
                style={{ color: '#D4B872', fontSize: 10 }}
              >
                Root Assumption
              </span>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: UI_COLORS.textPrimary,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                {rootAssumption}
              </p>
            </motion.div>
          )}

          {/* Unexpected allies */}
          {unexpectedAllies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ancestryChain.length * 0.08 + 0.25, duration: 0.3 }}
            >
              <h4
                className="text-xs uppercase tracking-wider mb-3 font-medium"
                style={{ color: UI_COLORS.textSecondary, fontSize: 10 }}
              >
                Unexpected Allies
              </h4>
              <p
                className="text-xs mb-3"
                style={{ color: UI_COLORS.textMuted, lineHeight: 1.5 }}
              >
                These posts share the same root assumption but take a different stance.
              </p>
              <div className="flex flex-col gap-2">
                {unexpectedAllies.slice(0, 5).map((ally) => {
                  const allyColors = getEmotionColors(ally.emotion)
                  return (
                    <div
                      key={ally.id}
                      className="rounded-md p-2.5"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderLeft: `2px solid ${allyColors.accent}`,
                      }}
                    >
                      <p
                        className="text-xs leading-snug mb-1"
                        style={{ color: UI_COLORS.textPrimary }}
                      >
                        {ally.core_claim}
                      </p>
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${allyColors.accent}20`,
                          color: allyColors.accent,
                          fontSize: 10,
                        }}
                      >
                        {ally.stance}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
