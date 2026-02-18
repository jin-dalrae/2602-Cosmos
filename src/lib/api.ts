// API base URL: use VITE_API_URL env var for deployed frontend pointing to external API server
// Falls back to '' (same origin) for local dev where Vite proxies /api to Express
export const API_BASE = import.meta.env.VITE_API_URL ?? ''
