# AI Suites Web

Web version of AI Suites — Treasure Data's AI-native platform for web personalization and paid media campaign management.

This is the browser-deployable counterpart to the [AI Suites desktop app](https://github.com/treasure-data/ai-suites) (Electron). Both share the same React frontend; this project replaces Electron's IPC layer with an Express server + HTTP/SSE API.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (React + Vite)                         │
│  └─ window.aiSuites = webBackend (HTTP adapter) │
└───────────────────┬─────────────────────────────┘
                    │ HTTP / SSE
┌───────────────────▼─────────────────────────────┐
│  Express Server                                 │
│  ├─ /api/chat          SSE streaming (Claude)   │
│  ├─ /api/settings      API key management       │
│  ├─ /api/segments      TD CDP parent segments   │
│  ├─ /api/blueprints    Blueprint CRUD           │
│  ├─ /api/launch        Campaign launch configs  │
│  ├─ /api/platforms     Meta/Google ad APIs      │
│  ├─ /api/web           Page proxy & extraction  │
│  ├─ /api/pdf           PDF parsing              │
│  └─ /api/chats         Chat history storage     │
└─────────────────────────────────────────────────┘
```

### Key differences from the desktop app

| Feature | Desktop (Electron) | Web |
|---------|-------------------|-----|
| AI chat | Claude Agent SDK via subprocess | Claude Agent SDK via Express server |
| Page preview | `<webview>` element | Proxied `<iframe>` via `/api/web/proxy` |
| Element picker | `webview.executeJavaScript()` | Server-injected picker script + `postMessage` |
| Parent segments | `tdx` CLI with pagination | TD CDP REST API (`api-cdp.treasuredata.com`) |
| Credential storage | macOS Keychain (encrypted) | Server-side JSON + browser localStorage |
| Blueprint storage | Electron IPC (disk) | Express route + server-side JSON |

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

This starts both the Express server (port 3001) and Vite dev server (port 5175) concurrently. Open http://localhost:5175 in your browser.

### Individual commands

```bash
npm run dev:server    # Express server only (tsx watch)
npm run dev:client    # Vite dev server only
npm run build         # Build both client and server
npm run typecheck     # Type check client and server
```

## Configuration

After starting the app, go to **Settings** and configure:

1. **Claude API Key** — Required for AI chat. This is the LLM proxy key (format: `xxxxx/xxxxx...`).
2. **TDX API Key** — Required for parent segments and audience data. This is your Treasure Data master API key.

Both keys are stored in the server's local data directory and in the browser's localStorage (sent via headers on each request).

## Deployment

### Render (Docker)

The project includes a `Dockerfile` and `render.yaml` for deployment on Render.

```bash
# Build and test locally
docker build -t ai-suites-web .
docker run -p 3001:3001 ai-suites-web
```

### Vercel (Serverless)

A `vercel.json` is included for serverless deployment. Note: some features (Claude Agent SDK subprocess, persistent storage) have limitations in serverless mode.

## Syncing from Desktop

The frontend code is shared with the desktop app. To sync the latest UI changes:

```bash
./sync-from-desktop.sh              # Sync to a new branch for review
./sync-from-desktop.sh --dry-run    # Preview changes without copying
./sync-from-desktop.sh --direct     # Sync directly on current branch
```

This copies shared directories (`src/components`, `src/pages`, `src/stores`, `src/styles`, `src/types`, `public`, `skills`, etc.) while preserving web-only files:

- `src/main.tsx` — Web entry point
- `src/services/backend.ts` — Backend adapter (Electron vs web detection)
- `src/services/web-backend.ts` — HTTP/SSE implementation of `window.aiSuites`
- `src/types/global.d.ts` — Web-specific type declarations
- `src/components/PasswordGate.tsx` — Web-only password gate

## Project Structure

```
server/                 # Express server (replaces Electron IPC)
├── index.ts            # Server entry point
├── routes/             # API route handlers
│   ├── chat.ts         # SSE chat streaming
│   ├── settings.ts     # API key and config management
│   ├── segments.ts     # TD CDP parent/child segments
│   ├── blueprints.ts   # Campaign blueprint CRUD
│   ├── launch.ts       # Launch config management
│   ├── platforms.ts    # Ad platform integrations
│   ├── web.ts          # Page proxy and extraction
│   ├── pdf.ts          # PDF parsing
│   └── chat-storage.ts # Chat history persistence
├── services/           # Backend services
│   ├── claude-agent.ts # Claude Agent SDK wrapper
│   └── storage.ts      # File-based data persistence
└── types.ts            # Server type definitions

src/                    # React frontend (shared with desktop)
├── main.tsx            # Web entry point (initializes web backend)
├── App.tsx             # Routes and layout
├── services/
│   ├── backend.ts      # Auto-detect Electron vs web
│   └── web-backend.ts  # HTTP/SSE adapter for window.aiSuites
├── components/         # Shared UI components
├── pages/              # Route-level pages
├── stores/             # Zustand state management
├── styles/             # Tailwind CSS
├── types/              # TypeScript types
└── design-system/      # Design system components

skills/                 # Claude Skills (SKILL.md files)
├── personalization-skills/
└── paid-media-skills/

public/                 # Static assets
```

## Tech Stack

- **React 19** — UI framework
- **Vite** — Build tool and dev server
- **Express** — API server
- **Zustand** — State management
- **Tailwind CSS 4** — Styling
- **Claude Agent SDK** — AI chat backend
- **TypeScript** — Language
- **Cheerio** — HTML parsing for page extraction
- **Recharts** — Charts and visualizations

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `APP_PASSWORD` | Optional password gate | — |
| `VITE_APP_PASSWORD` | Client-side password (must match `APP_PASSWORD`) | — |
| `API_KEY` | Claude API key (alternative to Settings UI) | — |
| `LLM_PROXY_URL` | LLM proxy endpoint | `https://llm-proxy.us01.treasuredata.com` |
