# Prompt: Generate Architecture Diagram for Experience Center

## Instructions for Claude Code

You are tasked with producing a **comprehensive architecture document** for the Treasure AI Experience Center repo at `/Users/rahul.mulchandani/NewAItools/PLG/experience-center`.

Your output should be a single markdown file saved to `docs/architecture.md` inside the repo.

---

## What to explore

### 1. Codebase (read thoroughly)

Explore the full repo. Key areas to cover:

- **Entry points:** `src/main.tsx`, `src/App.tsx`, routing setup
- **Pages:** all files in `src/pages/`
- **State management:** Zustand stores in `src/store/` or wherever they live
- **Orchestration layer:** `src/orchestration/` — scenario registry, skill families, prompt building, skill execution
- **Output rendering:** `src/components/modules/`, `src/components/primitives/`, `src/components/slides/`
- **API & services:** `src/api/`, `src/services/` — LLM client, CDP API, web backend adapter
- **Server:** `server/index.ts` — proxy routes, auth header injection, app password guard
- **Configuration:** `.env`, `vite.web.config.ts`, `render.yaml`, `Dockerfile`, `vercel.json`
- **Docs:** everything in `docs/` including `legal-security-privacy-review.md`

### 2. GitHub PRs

Use `gh pr list --repo treasure-data/experience-center --state all --limit 30` to list all PRs.

Then read the body and title of each PR to understand the evolution of the architecture — what was added, changed, or removed over time. This context should inform the architecture narrative.

---

## What to produce

Save the output to `docs/architecture.md`. The document must include:

### Section 1: Overview
- What the app is and does (1 paragraph)
- Who uses it and how (persona + user journey)

### Section 2: High-Level Architecture Diagram
A **Mermaid** `graph TD` diagram showing:
- Browser (React app)
- Express proxy server
- TD LLM Proxy (external)
- TD CDP API (external)
- sessionStorage
- GitHub / Render / Vercel (deployment)

### Section 3: Frontend Architecture
A **Mermaid** diagram of the React component tree and page routing, covering:
- Router → Pages → Layout components → Feature components → Primitives
- Zustand store connections

### Section 4: Orchestration & LLM Data Flow
A **Mermaid** `sequenceDiagram` showing the full flow of a scenario run:
- User selects goal → industry → scenario
- Scenario registry lookup
- Prompt assembly (skill family + industry context + output schema)
- LLM call via proxy
- Response parsing
- Output rendering via modules

### Section 5: Slide Generation Flow
A **Mermaid** `sequenceDiagram` for the slide generation path (separate LLM call, storyboard resolution, slide renderer).

### Section 6: CDP Integration
- How the TDX API key is used
- Direct browser → `api-cdp.treasuredata.com` calls
- What data is fetched (parent segments, child segments)
- How it's used in the app vs. hardcoded sample data

### Section 7: Security & Privacy Architecture
Draw on `docs/legal-security-privacy-review.md` and the actual code. Cover:
- sessionStorage-only data (no server-side user data, tab-scoped)
- App password guard (`APP_PASSWORD` / `VITE_APP_PASSWORD`)
- API key handling (client → proxy → TD LLM Proxy, never logged)
- CORS considerations and `VITE_LLM_DIRECT` flag
- Sample data only (no real PII in LLM prompts)
- Deployment secrets (Render env vars)
- What data leaves the browser and where it goes

### Section 8: Deployment Architecture
A **Mermaid** diagram showing:
- Local dev (concurrently: Vite + tsx watch)
- Render deployment (Docker, `render.yaml`, env vars, auto-deploy)
- Vercel deployment (serverless, `vercel.json`, `api/[...path].ts`)
- Build-time env var baking (`VITE_SANDBOX_API_KEY`, `VITE_APP_PASSWORD`)

### Section 9: Configuration Reference
A table of all environment variables, their purpose, where they're used (server/client/both), and whether they're build-time or runtime.

### Section 10: Evolution & Key Design Decisions
Based on the PR history, summarize the major architectural decisions made over time:
- Why sessionStorage over localStorage
- Why the proxy server exists (TD1 auth header injection)
- Why orchestration moved to the browser
- Why the Agent SDK was removed
- Why direct LLM mode (`VITE_LLM_DIRECT`) was added

---

## Quality requirements

- All Mermaid diagrams must be valid and renderable
- Use actual component/file names from the codebase — no invented names
- If you find something ambiguous or undocumented, note it explicitly with a `> ⚠️ Note:` blockquote
- The document should be thorough enough that a new engineer could understand the full system without reading the code
