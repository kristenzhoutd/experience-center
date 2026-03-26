# AI Suites — Browser-Only Edition

Browser-only version of AI Suites for hosting on Treasure Data's public website. Designed for anonymous users with **privacy by architecture** — no server-side state, no cross-user data leakage.

This is a fork of [ai-suites-web](https://github.com/treasure-data/ai-suites-web) with the Express server stripped to a minimal stateless proxy.

## Three AI Suites

| Suite | Description |
|-------|-------------|
| **Personalization AI Suite** | Web personalization campaigns with AI-powered briefs, audiences, and content |
| **Paid Media AI Suite** | Campaign planning, blueprints, and cross-channel optimization |
| **Treasure AI Experience Center** | Guided demo for enterprise marketers — outcome-driven scenarios with AI-generated recommendations and slides |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (React + Vite)                             │
│  ├─ sessionStorage          All user data (tab-scoped) │
│  ├─ TD CDP API (direct)     Segments (CORS supported)  │
│  ├─ Experience Center       Orchestration + prompts    │
│  └─ window.aiSuites        HTTP adapter               │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / SSE (stateless)
┌───────────────────▼─────────────────────────────────┐
│  Minimal Proxy Server (4 files)                     │
│  ├─ /api/chat              SSE streaming (SDK)      │
│  ├─ /api/llm               LLM proxy pass-through   │
│  └─ /api/test-connection   Connection health check   │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **sessionStorage only** — all user data auto-clears on tab close. No persistence.
- **No server-side storage** — the proxy stores nothing. No /tmp, no /data, no files.
- **TD CDP API called directly from browser** — CORS supported, no server proxy needed.
- **Experience Center runs in browser** — prompt assembly, LLM calls (via `/api/llm` proxy), and output parsing all happen client-side.
- **Minimal proxy** — exists only because TD LLM Proxy doesn't support CORS yet. Once it does, the proxy can be removed entirely.

## Prerequisites

- Node.js 22+
- npm

## Setup

```bash
git clone https://github.com/treasure-data/ai-suites-browser-only.git
cd ai-suites-browser-only
npm install
```

## Development

```bash
npm run dev
```

Starts both the minimal proxy (port 3001) and Vite dev server (port 5175). Open http://localhost:5175.

```bash
npm run dev:server    # Proxy server only
npm run dev:client    # Vite dev server only
npm run build         # Build client + server
npm run build:static  # Build client only (static files)
npm run start:proxy   # Start proxy server only
npm run typecheck     # Type check everything
```

## Configuration

On first visit, a setup modal prompts for API keys. Or go to **Settings** to configure:

1. **LLM Proxy API Key** — Required for AI-powered generation. Connects to Treasure Data LLM proxy.
2. **TDX API Key** — Required for parent segments and audience data. Your Treasure Data master API key.

Keys are stored in browser sessionStorage and sent via `x-api-key` / `x-tdx-api-key` headers on every request. They are cleared when the tab closes.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Proxy server port | `3001` |
| `API_KEY` | LLM proxy API key (fallback if not provided via browser) | — |
| `LLM_PROXY_URL` | LLM proxy endpoint | `https://llm-proxy.us01.treasuredata.com` |
| `MODEL` | Claude model | `claude-sonnet-4-20250514` |
| `APP_PASSWORD` | Optional password gate for API routes | — |
| `VITE_APP_PASSWORD` | Client-side password (must match `APP_PASSWORD`) | — |
| `VITE_API_BASE` | API base URL for production (e.g., `https://proxy.example.com/api`) | `/api` |

## Experience Center

The Experience Center uses a modular scenario-to-skill architecture:

```
Flow: Outcome -> Industry -> Scenario -> AI-generated output -> Slides

36 curated scenarios (4 outcomes x 3 industries x 3 scenarios each)
6 skill families: campaign-brief, journey, segment-opportunity,
                  performance-analysis, insight-summary, slide-deck
3 industry sandboxes: Retail, CPG, Travel & Hospitality
5 output compositions: campaign_brief, journey_map, segment_cards,
                       performance_diagnosis, insight_summary
```

### Features

- **Modular output system** — composable modules rendered by output format key
- **Slide generation** — TD 2026 branded slides with 10 visual layouts
- **Artifact system** — multiple outputs per session with tab selector
- **Per-run progress history** — each AI run preserves its own execution trace
- **Skeleton loader** — output-type-aware loading state

## Deployment

### Static Site + Proxy (Render)

```bash
# Build everything
npm run build

# Start the proxy (serves static files + API)
npm start
```

The proxy server serves the built client files and handles `/api/chat`, `/api/llm`, and `/api/test-connection` routes.

### Static Site Only (CDN)

```bash
npm run build:static
# Deploy dist/client/ to any static host (S3, CloudFront, Netlify, etc.)
# Set VITE_API_BASE to point to the proxy URL at build time
```

## Project Structure

```
server/                              # Minimal stateless proxy (4 files)
  index.ts                           # Express + CORS + /api/llm + /api/test-connection
  routes/chat.ts                     # SSE chat streaming via Claude Agent SDK
  services/claude-agent.ts           # SDK wrapper + auth proxy (x-api-key -> TD1)
  types.ts                           # ChatStreamEvent types

src/
  main.tsx                           # Web entry point
  App.tsx                            # Routes and layout
  api/client.ts                      # HTTP client with API key headers
  services/
    web-backend.ts                   # HTTP/SSE adapter (sessionStorage-backed)
    cdp-api.ts                       # Direct browser calls to TD CDP API
  experience-center/
    registry/                        # Scenario configs, skill families, types
    orchestration/                   # Browser-side prompt assembly + LLM execution
      executeSkill.ts                # LLM call via /api/llm proxy
      buildSkillRequest.ts           # System + user prompt assembly
      resolveScenario.ts             # Scenario -> industry context resolution
      industry/                      # 3 industry sandbox adapters
      skills/                        # 6 skill family prompt builders
    output-formats/
      modules/                       # 13 composable output modules + renderer
      primitives/                    # 20+ visual primitives + data-vis components
      slides/                        # Slide modal, output viewer, preview
  components/                        # Shared UI components
  pages/                             # Route-level pages
  stores/                            # Zustand state management (in-memory)
  utils/
    storage.ts                       # sessionStorage wrapper
    companyContextStorage.ts         # Company context (sessionStorage)
    brandGuidelinesStorage.ts        # Brand guidelines (sessionStorage)
  styles/                            # Tailwind CSS
  types/                             # TypeScript types

skills/                              # Claude Skills (SKILL.md files)
```

## Tech Stack

- **React 19** + TypeScript
- **Vite 7** — build tool and dev server
- **Express** — minimal stateless proxy
- **Zustand** — state management (in-memory)
- **Tailwind CSS 4** — styling
- **Claude Agent SDK** — AI chat backend (server-side only)
- **Recharts** — charts and visualizations
- **Lucide React** — icons

## How to Extend

### Add a new Experience Center scenario
1. Add entry to `src/experience-center/registry/scenarioRegistry.ts`
2. Add scenario card to `src/data/experienceLabConfig.ts` scenarioMatrix

### Add a new skill family
1. Create prompt builder in `src/experience-center/orchestration/skills/`
2. Register in `src/experience-center/orchestration/skills/index.ts`
3. Add to `SkillFamily` type in `src/experience-center/orchestration/types.ts`

### Add a new industry
1. Create sandbox adapter in `src/experience-center/orchestration/industry/`
2. Register in `src/experience-center/orchestration/industry/index.ts`

### Add a new output module
1. Add component to `src/experience-center/output-formats/modules/index.tsx`
2. Register in `moduleRegistry`

### Add a new slide layout
1. Add renderer to `src/experience-center/output-formats/slides/SlideOutput.tsx`
2. Add layout type to `src/experience-center/output-formats/slides/types.ts`

## Removed Features (vs ai-suites-web)

These features required server-side state or secrets and were removed for the browser-only architecture:

- Google Calendar booking → use external Calendly link instead
- Email confirmation → removed
- PDF text extraction → removed
- Web page extraction / proxy → removed
- Server-side blueprint/chat/settings storage → sessionStorage
- Google Sheets feedback → removed
- Ad platform integrations (Meta/Google/TikTok) → removed
