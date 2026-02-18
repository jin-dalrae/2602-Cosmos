# 10 -- Tech Stack & Deployment

## Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript ~5.9 | Type safety |
| Vite 7 | Build tooling and dev server |
| @react-three/fiber 9 | React renderer for Three.js |
| @react-three/drei 10 | Three.js helpers (Html, PerspectiveCamera) |
| Three.js | 3D rendering engine |
| Framer Motion 12 | Animations and page transitions |
| Tailwind CSS 4 | Utility styles |
| MediaPipe FaceLandmarker | Head pose detection (GPU, client-side) |

## Backend

| Technology | Purpose |
|------------|---------|
| Express 5 | HTTP server with SSE streaming |
| tsx | TypeScript execution |
| @anthropic-ai/sdk | Claude API client |
| mongodb | MongoDB driver (Firestore-compatible) |

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Firebase Hosting | cosmosweb.web.app |
| Backend | Google Cloud Run | cosmos-api-*.us-central1.run.app |
| Database | Firestore (MongoDB-compatible) | via MONGODB_URI |

## Dev Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Express together |
| `npm run dev:client` | Vite only |
| `npm run dev:server` | Express only (tsx watch) |
| `npm run build` | TypeScript check + Vite production build |
| `npm start` | Production server (static files + API) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/process` | SSE pipeline for topic |
| GET | `/api/layout/:topic` | Fetch stored layout |
| POST | `/api/classify` | Classify user post |
| POST | `/api/narrate` | Narrator query |
| POST | `/api/posts` | Create user post |
| GET | `/api/posts/:topic` | List user posts for topic |
| POST | `/api/vote` | Persist vote delta |
| GET | `/api/health` | Health check |
| GET | `/api/admin/layouts` | List layouts |
| DELETE | `/api/admin/layouts/:key` | Delete layout |
| POST | `/api/admin/regenerate/:key` | Regenerate layout (SSE) |
| POST | `/api/admin/cache/clear` | Clear caches |
| GET | `/api/admin/health` | System health |
| GET | `/api/admin/stats` | Statistics |
| GET | `/api/admin/preview/:key` | Preview layout |

## Key Data Types

- `RawPost` -- minimal post from generator
- `EnrichedPost` -- post with Cartographer metadata
- `CosmosPost` -- enriched post with 3D position + created_at
- `CosmosLayout` -- complete layout (posts, clusters, gaps, bridges, metadata)
- `Cluster` -- group of related posts with center and summary
- `Gap` -- identified missing perspective with position
- `Relationship` -- directional link with type, strength, reason
