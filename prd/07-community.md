# 07 -- Community Features

## Intent

This is a real community platform, not a read-only visualization. People should be able to add their voice, agree or disagree, and reply. Their contributions persist and become part of the constellation.

---

## User Posts

### New Post Flow
1. Click "New Post" button (bottom-right)
2. ComposeOverlay opens (title + content + author fields)
3. On submit, post is sent to `/api/classify` for AI classification
4. Classifier returns: position, emotion, themes, relationships, closest posts
5. Post materializes on the sphere at the classified position
6. Related posts briefly highlighted (2s golden shimmer)
7. Post persisted to MongoDB via `/api/posts` (fire-and-forget)

### Reply Flow
1. Click "Reply" on an expanded card
2. ComposeOverlay opens in reply mode (content + author)
3. Reply placed near parent post (slight offset)
4. Reply persisted to MongoDB (fire-and-forget)
5. Shows in parent's "Replies" section

## Voting

- Toggle behavior: upvote again = remove vote
- Vote state: in-memory `Map<string, 'up' | 'down'>` per session
- Counts update immediately (optimistic)
- Persisted to MongoDB via `POST /api/vote` (fire-and-forget)
- Vote delta updates both `posts` collection and `layouts` document

## User Post Merge

After loading the base layout (CDN/MongoDB), user posts are merged in the background:

1. Fetch `GET /api/posts/:topic`
2. Deduplicate by ID against existing posts
3. Merge into layout
4. Scene updates without disruption

## Timestamps

Every post carries `created_at` (ISO 8601). Displayed as relative time:
- < 60s: "just now"
- < 60min: "Xm ago"
- < 24h: "Xh ago"
- < 30d: "Xd ago"
- < 12mo: "Xmo ago"
- 12mo+: "Xy ago"

## Key Files

- `src/components/ComposeOverlay.tsx` -- post/reply composition UI
- `src/components/CosmosExperience.tsx` -- handleComposeSubmit, handleVote, handleReply
- `src/components/ListView/ArticleListPage.tsx` -- list view voting + replies
- `server/routes/vote.ts` -- vote persistence
- `server/routes/user-post.ts` -- post creation
- `server/routes/user-posts-list.ts` -- fetch user posts for merge
- `src/hooks/useCosmosData.ts` -- mergeUserPosts
- `src/lib/timeFormat.ts` -- formatTimeAgo
