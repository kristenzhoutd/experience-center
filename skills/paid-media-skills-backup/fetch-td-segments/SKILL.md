---
name: fetch-td-segments
description: >
  Retrieves available audience segments from Treasure Data CDP via deterministic
  IPC call. This is a system-level skill that does not require LLM generation —
  it triggers a direct API call to TD and returns the segment list.
---

# Fetch TD Segments Skill

## When to Use

Activate this skill when the user wants to see available audience segments from
Treasure Data CDP. Trigger phrases include but are not limited to:

- "Show me available segments"
- "List my TD segments"
- "What audiences are available?"
- "Fetch segments from CDP"
- "Pull my Treasure Data audiences"
- "What segments can I use?"
- Any request to browse, list, or search CDP audience segments.

## Input Context

You will receive:
- The user's request for segment data
- Optional: filter criteria (segment name, type, or size thresholds)
- Optional: campaign brief context for relevance filtering

## Output Schema

This skill triggers a deterministic IPC call. The response follows the standard
success/error pattern:

```jsonc
// Success response (returned by the IPC handler):
{
  "success": true,
  "data": {
    "segments": [
      {
        "id": "string — TD segment ID",
        "name": "string — segment display name",
        "description": "string — segment description",
        "size": "number — estimated audience size",
        "lastUpdated": "string — ISO date of last refresh",
        "source": "string — segment source (e.g. CDP, First-Party, Lookalike)",
        "tags": ["string — segment tags or categories"]
      }
    ],
    "totalCount": "number — total segments available",
    "lastSynced": "string — ISO datetime of last CDP sync"
  }
}

// Error response:
{
  "success": false,
  "error": "string — error message"
}
```

## Output Format

This is a **deterministic skill** — no LLM-generated code fence is needed.
The IPC handler returns the segment data directly to the UI. In your
conversational response, summarize the available segments and help the user
understand which ones are relevant to their campaign.

## Quality Rules

1. **Do not fabricate segment data.** This skill fetches real data from TD CDP.
   If the IPC call fails, inform the user of the error and suggest retrying.
2. **Help interpret results.** After segments are returned, provide context on
   which segments might be relevant based on the current campaign brief.
3. **Support filtering.** If the user asks for specific segment types or sizes,
   communicate the filter criteria clearly.
4. **Handle empty results gracefully.** If no segments are returned, explain
   possible reasons (no CDP connection, no segments configured, filters too
   restrictive) and suggest next steps.
5. **Do not modify segment data.** This is a read-only operation.
