# AI Suites Web

Web version of AI Suites — Treasure Data's AI-native platform for web personalization, paid media campaign management, and the Treasure AI Experience Center.

This is the browser-deployable counterpart to the [AI Suites desktop app](https://github.com/treasure-data/ai-suites) (Electron). Both share the same React frontend; this project replaces Electron's IPC layer with an Express server + HTTP/SSE API.

## Three AI Suites

| Suite | Description |
|-------|-------------|
| **Personalization AI Suite** | Web personalization campaigns with AI-powered briefs, audiences, and content |
| **Paid Media AI Suite** | Campaign planning, blueprints, and cross-channel optimization |
| **Treasure AI Experience Center** | Guided demo for enterprise marketers — outcome-driven scenarios with AI-generated recommendations, slides, and booking |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (React + Vite)                         │
│  └─ window.aiSuites = webBackend (HTTP adapter) │
└───────────────────┬─────────────────────────────┘
                    │ HTTP / SSE
┌───────────────────▼─────────────────────────────┐
│  Express Server                                 │
│  ├─ /api/chat               SSE streaming       │
│  ├─ /api/settings           API key management  │
│  ├─ /api/segments           TD CDP segments     │
│  ├─ /api/experience-center  EC skill execution  │
│  ├─ /api/calendar           Google Calendar     │
│  ├─ /api/blueprints         Blueprint CRUD      │
│  ├─ /api/launch             Campaign configs    │
│  ├─ /api/platforms          Ad platform APIs    │
│  ├─ /api/web                Page proxy          │
│  ├─ /api/pdf                PDF parsing         │
│  ├─ /api/chats              Chat history        │
│  └─ /api/feedback           User feedback       │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 22+
- npm

## Setup

```bash
git clone https://github.com/treasure-data/ai-suites-web.git
cd ai-suites-web
npm install
```

## Development

```bash
npm run dev
```

Starts both Express server (port 3001) and Vite dev server (port 5175). Open http://localhost:5175.

```bash
npm run dev:server    # Express server only
npm run dev:client    # Vite dev server only
npm run build         # Build client + server
npm run typecheck     # Type check everything
```

## Configuration

On first visit to the Experience Center, a setup modal prompts for API keys. Or go to **Settings** to configure:

1. **LLM Proxy API Key** — Required for AI-powered generation. Connects to Treasure Data LLM proxy.
2. **TDX API Key** — Required for parent segments and audience data. Your Treasure Data master API key.

Keys are stored in browser localStorage and sent via `x-api-key` / `x-tdx-api-key` headers on every request.

## Experience Center Architecture

The Experience Center uses a modular scenario-to-skill architecture:

```
Flow: Outcome → Industry → Scenario → AI-generated output → Slides

36 curated scenarios (4 outcomes × 3 industries × 3 scenarios each)
6 skill families: campaign-brief, journey, segment-opportunity,
                  performance-analysis, insight-summary, slide-deck
3 industry sandboxes: Retail, CPG, Travel & Hospitality
5 output compositions: campaign_brief, journey_map, segment_cards,
                       performance_diagnosis, insight_summary
```

### Key directories

```
server/experience-center/
  orchestration/          # Scenario resolution, prompt assembly, LLM execution
  skills/families/        # Skill family prompt builders (6 families)
  industry/               # Industry sandbox adapters (segments, metrics, channels)

src/experience-center/
  registry/               # Scenario configs, skill family definitions, types
  output-formats/
    modules/              # 13 composable output modules + renderer
    primitives/           # 20+ visual primitives + 8 data-vis components
    slides/               # Slide modal, output viewer, preview, types
    SkillProgressBlock    # Inline progress with stage chips
    OutputLoader          # Artifact-aware skeleton loader
```

### Features

- **Modular output system** — composable modules rendered by output format key
- **Slide generation** — TD 2026 branded slides with 10 visual layouts
- **Artifact system** — multiple outputs per session with tab selector
- **Per-run progress history** — each AI run preserves its own execution trace
- **Skeleton loader** — output-type-aware loading state
- **Google Calendar booking** — real availability checking and event creation
- **Confirmation emails** — branded HTML emails via Gmail SMTP
- **Share/feedback** — email output sharing and in-app feedback collection

## Deployment

### Render

The project includes a `Dockerfile` and `render.yaml` for Render deployment.

```bash
docker build -t ai-suites-web .
docker run -p 3001:3001 ai-suites-web
```

### AWS App Runner

1. Connect GitHub repo
2. Runtime: Node.js 18
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Port: `3001`

## Project Structure

```
server/
├── index.ts                    # Server entry point (dotenv, routes, middleware)
├── routes/                     # API route handlers
│   ├── chat.ts                 # SSE chat streaming
│   ├── settings.ts             # API key and config management
│   ├── segments.ts             # TD CDP parent/child segments
│   ├── calendar.ts             # Google Calendar availability + booking
│   ├── blueprints.ts           # Campaign blueprint CRUD
│   ├── launch.ts               # Launch config management
│   ├── platforms.ts            # Ad platform integrations
│   ├── web.ts                  # Page proxy and extraction
│   ├── pdf.ts                  # PDF parsing
│   └── chat-storage.ts         # Chat history persistence
├── services/
│   ├── claude-agent.ts         # Claude Agent SDK wrapper + auth proxy
│   ├── google-calendar.ts      # Google Calendar service account integration
│   ├── booking-email.ts        # Booking confirmation emails (nodemailer)
│   └── storage.ts              # File-based data persistence
├── experience-center/          # Experience Center backend
│   ├── route.ts                # /generate + /generate-slides endpoints
│   ├── types.ts                # Server-side types
│   ├── orchestration/          # Scenario → skill → output pipeline
│   ├── skills/families/        # 6 skill family prompt builders
│   └── industry/               # 3 industry sandbox adapters
└── types.ts                    # Server type definitions

src/
├── main.tsx                    # Web entry point
├── App.tsx                     # Routes and layout
├── api/client.ts               # HTTP client with API key headers
├── services/
│   ├── backend.ts              # Auto-detect Electron vs web
│   └── web-backend.ts          # HTTP/SSE adapter for window.aiSuites
├── components/                 # Shared UI components
│   ├── Layout.tsx              # App layout (sidebar, EC full-bleed)
│   ├── BookWalkthroughModal.tsx # Calendar booking flow
│   ├── ApiKeySetupModal.tsx    # First-visit API key setup
│   └── campaigns/              # Campaign-specific components
├── pages/                      # Route-level pages
│   ├── ExperienceCenterPage.tsx      # EC landing page
│   ├── ExperienceCenterWorkflowPage.tsx  # EC workflow (chat + output)
│   ├── ChatPage.tsx            # Personalization chat
│   └── CampaignChatPage.tsx    # Paid media chat
├── experience-center/          # EC frontend architecture
│   ├── registry/               # Scenario configs, skill families, types
│   └── output-formats/         # Modules, primitives, slides, loader
├── stores/                     # Zustand state management
├── data/                       # Config data (scenarios, industries)
├── styles/                     # Tailwind CSS + custom scrollbar
├── types/                      # TypeScript types
└── design-system/              # Design system components

skills/                         # Claude Skills (SKILL.md files)
├── personalization-skills/
├── paid-media-skills/
└── experience-center-skills/
```

## Tech Stack

- **React 19** + TypeScript
- **Vite 7** — build tool and dev server
- **Express** — API server
- **Zustand** — state management
- **Tailwind CSS 4** — styling
- **Claude Agent SDK** — AI chat backend
- **Google APIs** — Calendar integration
- **Nodemailer** — email sending
- **Recharts** — charts and visualizations
- **Lucide React** — icons

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `API_KEY` | LLM proxy API key | — |
| `LLM_PROXY_URL` | LLM proxy endpoint | `https://llm-proxy.us01.treasuredata.com` |
| `MODEL` | Claude model | `claude-sonnet-4-20250514` |
| `APP_PASSWORD` | Optional password gate for API | — |
| `VITE_APP_PASSWORD` | Client-side password (must match `APP_PASSWORD`) | — |
| `GMAIL_APP_PASSWORD` | Gmail app password for booking confirmation emails | — |
| `GOOGLE_CALENDAR_ID` | Calendar email for booking | `experienceattdai@gmail.com` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Optional JSON override for service account | — |

## How to Extend

### Add a new Experience Center scenario
1. Add entry to `src/experience-center/registry/scenarioRegistry.ts`
2. Add scenario card to `src/data/experienceLabConfig.ts` scenarioMatrix

### Add a new skill family
1. Create prompt builder in `server/experience-center/skills/families/`
2. Register in `server/experience-center/skills/families/index.ts`
3. Add to `SkillFamily` type

### Add a new industry
1. Create sandbox adapter in `server/experience-center/industry/`
2. Register in `server/experience-center/industry/index.ts`

### Add a new output module
1. Add component to `src/experience-center/output-formats/modules/index.tsx`
2. Register in `moduleRegistry`

### Add a new slide layout
1. Add renderer to `src/experience-center/output-formats/slides/SlideOutput.tsx`
2. Add layout type to `src/experience-center/output-formats/slides/types.ts`
