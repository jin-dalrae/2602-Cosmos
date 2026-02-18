# 09 -- Admin Dashboard

## Intent

Manage topics, monitor health, regenerate layouts. Simple, functional, matches the dark theme.

---

## Access

- Route: `/admin`
- PIN-protected gate (numeric PIN in sessionStorage)
- Dark warm theme matching main app

## Tabs

| Tab | Features |
|-----|----------|
| **Layouts** | List all stored layouts (topic, post count, cluster count, date). Preview, Regenerate, or Delete. |
| **Cache** | Clear file cache, MongoDB, or both. Shows results. |
| **Generate** | Enter topic, run full pipeline. Live SSE progress bar and log. |
| **Health** | Server uptime, MongoDB status, Anthropic API status, file cache stats. Auto-refreshes 15s. |
| **Stats** | Total layouts, total posts, avg processing time, topic list. |

## Regenerate

- Deletes existing layout (MongoDB + file cache)
- Re-runs full pipeline via `POST /api/admin/regenerate/:topicKey`
- SSE progress streaming with live percentage
- Layout list auto-refreshes on completion

## Key Files

- `src/components/Admin/AdminPage.tsx` -- PIN gate + tab layout
- `src/components/Admin/LayoutsPanel.tsx` -- layout management
- `src/components/Admin/CachePanel.tsx` -- cache clearing
- `src/components/Admin/GeneratePanel.tsx` -- topic generation
- `src/components/Admin/HealthPanel.tsx` -- system health
- `src/components/Admin/StatsPanel.tsx` -- statistics
- `server/routes/admin.ts` -- all admin API endpoints
