# Treasure AI Experience Center

Guided demo for enterprise marketers — outcome-driven scenarios with AI-generated recommendations and slides, powered by Treasure Data.

Built with a **browser-only architecture** for public website hosting. No server-side state, no cross-user data leakage. All user data lives in sessionStorage and auto-clears on tab close.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (React + Vite)                             │
│  ├─ sessionStorage        All user data (tab-scoped)│
│  ├─ TD CDP API (direct)   Segments (CORS supported) │
│  ├─ Orchestration         Prompt assembly + parsing  │
│  └─ web-backend           HTTP adapter               │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / SSE (stateless)
┌───────────────────▼─────────────────────────────────┐
│  Minimal Proxy Server (4 files)                     │
│  ├─ /api/chat              SSE streaming (SDK)      │
│  ├─ /api/llm               LLM proxy pass-through   │
│  └─ /api/test-connection   Connection health check   │
└─────────────────────────────────────────────────────┘
```

## How It Works

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

## Prerequisites

- Node.js 22+
- npm

## Setup

```bash
git clone https://github.com/treasure-data/experience-center.git
cd experience-center
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

On first visit, a setup modal prompts for API keys. Click **Powered by Treasure AI** in the top bar to configure:

1. **LLM Proxy API Key** — Required for AI-powered generation. Connects to Treasure Data LLM proxy.
2. **TDX API Key** — Required for parent segments and audience data. Your Treasure Data master API key.

Keys are stored in browser sessionStorage and sent via `x-api-key` / `x-tdx-api-key` headers. They clear when the tab closes.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Proxy server port | `3001` |
| `API_KEY` | LLM proxy API key (fallback if not set in browser) | - |
| `LLM_PROXY_URL` | LLM proxy endpoint | `https://llm-proxy.us01.treasuredata.com` |
| `MODEL` | Claude model | `claude-sonnet-4-20250514` |
| `APP_PASSWORD` | Optional password gate for API routes | - |
| `VITE_APP_PASSWORD` | Client-side password (must match `APP_PASSWORD`) | - |
| `VITE_API_BASE` | API base URL for production | `/api` |

## Deployment

### Render (Single Service)

```bash
npm run build
npm start    # Serves static files + proxy API
```

### Static Site + Separate Proxy

```bash
npm run build:static
# Deploy dist/client/ to any static host
# Set VITE_API_BASE to proxy URL at build time
```

## Project Structure

```
server/                              # Minimal stateless proxy (4 files)
  index.ts                           # Express + /api/llm + /api/test-connection
  routes/chat.ts                     # SSE chat streaming via Claude Agent SDK
  services/claude-agent.ts           # SDK wrapper + auth proxy (x-api-key -> TD1)
  types.ts                           # ChatStreamEvent types

src/
  App.tsx                            # Routes: /experience-center, /settings
  main.tsx                           # Entry point
  api/client.ts                      # Experience Center API client
  components/
    Layout.tsx                       # Top bar with logo + "Book a walkthrough"
    ApiKeySetupModal.tsx             # API key configuration modal
    PasswordGate.tsx                 # Optional access control
  pages/
    ExperienceCenterPage.tsx         # Landing page (goal selection)
    ExperienceCenterWorkflowPage.tsx # Workflow (chat + output)
    SettingsPage.tsx                 # API key and config settings
  experience-center/
    registry/                        # Scenario configs, skill families, types
    orchestration/                   # Browser-side prompt assembly + LLM execution
      executeSkill.ts                # LLM call via /api/llm proxy
      buildSkillRequest.ts           # System + user prompt assembly
      resolveScenario.ts             # Scenario -> industry context resolution
      industry/                      # 3 industry sandbox adapters
      skills/                        # 6 skill family prompt builders
    output-formats/
      modules/                       # 13 composable output modules
      primitives/                    # 20+ visual primitives + data-vis
      slides/                        # Slide modal, output viewer, preview
  services/
    web-backend.ts                   # HTTP/SSE adapter (sessionStorage-backed)
    cdp-api.ts                       # Direct browser calls to TD CDP API
  stores/                            # Zustand state (in-memory)
  data/                              # Scenario config data
  design-system/                     # Shared UI component library
  styles/                            # Tailwind CSS
  utils/
    storage.ts                       # sessionStorage wrapper
```

## Tech Stack

- **React 19** + TypeScript
- **Vite 7** — build tool and dev server
- **Express** — minimal stateless proxy
- **Zustand** — state management (in-memory)
- **Tailwind CSS 4** — styling
- **Claude Agent SDK** — AI chat (server-side only)
- **Recharts** — charts and visualizations
- **Lucide React** — icons

## How to Extend

### Add a new scenario
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
