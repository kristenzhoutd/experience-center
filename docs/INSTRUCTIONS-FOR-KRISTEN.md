# Experience Center: Real CDP Data Integration

## Goal

Replace static dummy data with real CDP data by integrating with llm-api Chat API.

## Why llm-api Chat API?

Current flow uses td-llm-proxy for direct LLM calls, but this cannot query actual TD data. The llm-api Chat API has **PlazmaQueryTool** which allows Agents to execute TD/Trino queries and use the results in responses.

```
Current: Experience Center → td-llm-proxy → LLM (with static data in prompts)

Target:  Experience Center → llm-api Chat API → Agent with PlazmaQueryTool → TD Query → LLM (with real data)
```

## Prerequisites

### CORS Support (PRs pending merge)

These PRs must be merged before browser access works:

| Service | PR | Status |
|---------|-----|--------|
| td-llm-proxy | [#284](https://github.com/treasure-data/td-llm-proxy/pull/284) | Awaiting review |
| td-cdp-api | [#4937](https://github.com/treasure-data/td-cdp-api/pull/4937) | CI passed, awaiting review |
| llm-api | [#1611](https://github.com/treasure-data/llm-api/pull/1611) | Awaiting review |

### Agent Setup

Create an Agent in AI Agent Foundry UI with:
- **PlazmaQueryTool** enabled
- Access to the sandbox database
- System prompt appropriate for Experience Center use cases

## Implementation Direction

### 1. Create llm-api Chat API Client

Create a new service file that:
- Calls `POST /api/chats` to create a chat session (JSON:API format)
- Calls `POST /api/chats/:id/continue` to send messages
- Handles SSE (Server-Sent Events) streaming responses
- Uses TD1 authentication header

**Primary Reference: tdx source code** (included in Treasure Studio)

The tdx CLI has a complete TypeScript implementation of the Chat API client:

| File | What to learn |
|------|---------------|
| `tdx/src/sdk/client/llm-api-client.ts` | `startChat()` and `continueChat()` methods - API format, request structure |
| `tdx/src/utils/sse-parser.ts` | `parseSSEStream()` - SSE stream parsing logic |
| `tdx/src/sdk/types/index.ts` | TypeScript types for Chat, ChatEvent, etc. |

Key points from tdx implementation:
- `startChat()` creates a chat with `POST /api/chats` (JSON:API format with `data.type: 'chats'`)
- `continueChat()` sends messages with `POST /api/chats/{id}/continue` (simple `{ input: message }`)
- SSE parser handles `data:` lines, empty line message boundaries, and JSON parsing

**Additional reference in this repo:**
- `src/services/cdp-api.ts` - Similar pattern for TD API calls
- `src/api/client.ts` - Existing API client patterns

### 2. Add Settings for Agent Configuration

Add to settings:
- llm-api endpoint URL
- Agent ID to use
- Toggle for "Use Real CDP Data" mode

### 3. Integrate with Skill Execution

Modify `src/experience-center/orchestration/executeSkill.ts` to optionally use the Chat API client instead of direct LLM calls when real data mode is enabled.

### 4. Handle Streaming Responses

The Chat API returns SSE events. You'll need to:
- Parse `data:` lines from the stream
- Handle different event types (content, keepalive, errors)
- Accumulate the full response

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/experience-center/orchestration/executeSkill.ts` | Current LLM call logic |
| `src/experience-center/orchestration/buildSkillRequest.ts` | Prompt building |
| `src/services/cdp-api.ts` | Existing CDP API client (reference for patterns) |
| `src/stores/settingsStore.ts` | Settings state management |

## Files Created as Reference

- `src/services/cdp-context.ts` - Transforms CDP segments to IndustryContext format (may be useful if you fetch segment metadata separately)
- `docs/CDP-DATA-INTEGRATION.md` - Detailed architecture notes

## Notes

- Wait for CORS PRs to merge before testing browser access
- Use read-only API key for sandbox account
- Test with llm-api development environment first if possible

## Quick Reference: tdx Chat API Files

The tdx source code (included in Treasure Studio) has everything you need:

```
tdx/src/sdk/client/llm-api-client.ts
  - startChat() - POST /api/chats
  - continueChat() - POST /api/chats/{id}/continue (async generator)

tdx/src/utils/sse-parser.ts
  - parseSSEStream() - Parse SSE events from Response

tdx/src/sdk/types/index.ts
  - Chat, ChatEvent, ChatStreamEvent types
```
