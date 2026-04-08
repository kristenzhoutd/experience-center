# Experience Center — Browser-Side API Architecture

> All TD APIs proxied through Express to avoid CORS. Keys live in browser sessionStorage.

```mermaid
flowchart TB
    subgraph Browser["BROWSER - Port 5175"]
        direction TB
        CS["chat-client.ts\nexecuteSkill.ts\nworkflowEngine.ts"]
        CDP["cdp-api.ts"]
        LLMCHAT["llm-chat-api.ts"]
        ENGAGE["engage-api.ts\n(inline HTML email)"]
        EXPORT["export-slides.ts | export-pdf.ts"]
    end

    subgraph Proxy["EXPRESS PROXY - Port 3001 - server/index.ts"]
        direction TB
        AUTH["x-api-key -> Authorization: TD1 apiKey"]
        R1["/api/llm"]
        R2["/api/cdp/*"]
        R3["/api/chat/create\n/api/chat/:id/continue"]
        R4["/api/engage/send"]
    end

    CS -- "POST /api/llm\nx-api-key header" --> R1
    CDP -- "GET /api/cdp/*\nx-api-key header" --> R2
    LLMCHAT -- "POST /api/chat/*\nx-api-key header" --> R3
    ENGAGE -- "POST /api/engage/send\ninline HTML body" --> R4

    subgraph TDApis["TREASURE DATA Cloud"]
        direction TB
        LLMP["LLM Proxy\nllm-proxy.us01.treasuredata.com\n/v1/messages\n\nClaude Sonnet"]
        CHATP["Chat API\nllm-api.us01.treasuredata.com\n/api/chats SSE\n\nAgent: data-fetcher\n9 tools 3 per industry"]
        CDPA["CDP API\napi-cdp.treasuredata.com\n/audiences\n/audiences/:id\n/audiences/:id/segments"]
        ENGA["Engage Delivery API\ndelivery-api.us01.treasuredata.com\nemail_campaign_test\n\nnoreply@plg.treasure-engage-testing.link"]
    end

    R1 -- "TD1 auth" --> LLMP
    R3 -- "TD1 auth" --> CHATP
    R2 -- "TD1 auth" --> CDPA
    R4 -- "TD1 auth\nsame 13232 key" --> ENGA

    subgraph Uses["FEATURE to API MAPPING"]
        direction LR
        F1["Scenario generation\nWorkflow steps\nChat assistant"]
        F2["Live metrics\nretail / travel / cpg"]
        F3["Segment enrichment\nattrs / behaviors"]
        F4["Share: email recap\n+ PPTX/PDF download"]
    end

    F1 -. "LLM Proxy" .-> LLMP
    F2 -. "Chat API" .-> CHATP
    F3 -. "CDP API" .-> CDPA
    F4 -. "Engage API" .-> ENGA
```

## Color Legend

| Color | API Path | Files |
|-------|----------|-------|
| Deep Blue `#2D40AA` | **LLM Proxy** — scenario generation, workflow steps | `executeSkill.ts`, `workflowEngine.ts`, `chat-client.ts` |
| Orchid `#C466D4` | **Chat API** — live metrics via AI Foundry agent | `llm-chat-api.ts` |
| Sky Blue `#80B3FA` | **CDP API** — segment enrichment, attrs, behaviors | `cdp-api.ts` |
| Purple `#847BF2` | **Engage API** — email recap with inline HTML | `engage-api.ts` |
| Peach `#FDB893` | **Browser-only export** — PPTX + PDF generation (no server) | `export-slides.ts`, `export-pdf.ts` |

## API Details

| Route | Upstream | Auth | Purpose |
|-------|----------|------|---------|
| `POST /api/llm` | `llm-proxy.us01.treasuredata.com/v1/messages` | TD1 | Claude Sonnet — all LLM calls (workflow steps, scenario generation, slide decks) |
| `POST /api/chat/create` | `llm-api.us01.treasuredata.com/api/chats` | TD1 | Create agent chat session |
| `POST /api/chat/:id/continue` | `llm-api.us01.treasuredata.com/api/chats/:id/continue` | TD1 | Send message to agent (SSE streaming) |
| `GET /api/cdp/*` | `api-cdp.treasuredata.com/*` | TD1 | Parent segments, child segments, attributes, behaviors |
| `POST /api/engage/send` | `delivery-api.us01.treasuredata.com/api/email_transactions/email_campaign_test` | TD1 | Send inline HTML email via Engage |
| `GET /api/config` | — | — | Returns sandbox API key at runtime (for Docker deploys) |

> **Note:** PPTX and PDF generation happens entirely in the browser using `pptxgenjs` and `jsPDF`. No server call or LLM call is made — the export reformats existing workflow step data into the output format.
