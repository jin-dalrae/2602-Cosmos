// A1: Reddit fetcher — fetches a Reddit thread and flattens comments into RawPost[]

import type { RawPost } from './types.js'

const MAX_POSTS = 150

interface RedditComment {
  kind: string
  data: {
    id: string
    body?: string
    title?: string
    selftext?: string
    author?: string
    parent_id?: string
    depth?: number
    ups?: number
    children?: RedditComment[]
    replies?: {
      kind: string
      data: {
        children: RedditComment[]
      }
    } | ''
  }
}

interface RedditListing {
  kind: string
  data: {
    children: RedditComment[]
  }
}

function flattenComments(
  children: RedditComment[],
  posts: RawPost[],
  depth: number = 0
): void {
  for (const child of children) {
    if (posts.length >= MAX_POSTS) return

    if (child.kind === 'more') continue

    const d = child.data
    const body = d.body ?? ''
    const author = d.author ?? '[deleted]'

    // Filter out deleted/removed
    if (
      author === '[deleted]' ||
      author === '[removed]' ||
      body === '[deleted]' ||
      body === '[removed]' ||
      body.trim() === ''
    ) {
      // Still recurse into replies so we don't lose nested content
      if (d.replies && typeof d.replies === 'object' && d.replies.data?.children) {
        flattenComments(d.replies.data.children, posts, depth + 1)
      }
      continue
    }

    // Derive parent_id: Reddit prefixes with t1_ for comments, t3_ for posts
    let parentId: string | null = null
    if (d.parent_id) {
      // Strip the kind prefix (t1_, t3_, etc.)
      const stripped = d.parent_id.replace(/^t\d_/, '')
      parentId = stripped
    }

    posts.push({
      id: d.id,
      content: body,
      author,
      parent_id: parentId,
      depth: d.depth ?? depth,
      upvotes: d.ups ?? 0,
    })

    // Recurse into replies
    if (d.replies && typeof d.replies === 'object' && d.replies.data?.children) {
      flattenComments(d.replies.data.children, posts, depth + 1)
    }
  }
}

export async function fetchRedditThread(redditUrl: string): Promise<{
  posts: RawPost[]
  topic: string
}> {
  // Normalize URL: remove trailing slash, add .json
  let url = redditUrl.replace(/\/+$/, '')
  if (!url.endsWith('.json')) {
    url += '.json'
  }

  // Remove any query parameters before .json, then add raw_json=1
  const urlObj = new URL(url)
  urlObj.searchParams.set('raw_json', '1')
  urlObj.searchParams.set('limit', '500')

  const response = await fetch(urlObj.toString(), {
    headers: {
      'User-Agent': 'COSMOS:v0.1.0 (spatial discussion visualizer)',
    },
  })

  if (!response.ok) {
    throw new Error(`Reddit API returned ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as RedditListing[]

  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Unexpected Reddit API response format')
  }

  // First listing is the post itself
  const postData = data[0].data.children[0]?.data
  const topic = postData?.title ?? postData?.body ?? 'Unknown Discussion'

  // Second listing contains comments
  const commentChildren = data[1].data.children

  const posts: RawPost[] = []

  // Include the original post if it has a selftext body
  if (postData?.selftext && postData.selftext.trim() !== '' && postData.selftext !== '[deleted]' && postData.selftext !== '[removed]') {
    posts.push({
      id: postData.id,
      content: postData.selftext,
      author: postData.author ?? '[deleted]',
      parent_id: null,
      depth: 0,
      upvotes: postData.ups ?? 0,
    })
  }

  flattenComments(commentChildren, posts)

  return { posts: posts.slice(0, MAX_POSTS), topic: String(topic) }
}
