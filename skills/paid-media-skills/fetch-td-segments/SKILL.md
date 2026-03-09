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
- "Show CDP audiences"
- "List audience segments"
- "What's in my CDP?"
- Any request to browse, list, or search CDP audience segments.

**Do NOT use when:**
- The user wants AI-driven audience recommendations → use `recommend-audience-segments`
- The user wants to create or modify segments → this is a read-only operation,
  direct them to the TD console
- The user wants campaign data from ad platforms → use `diagnose-campaigns`
- The user wants to connect an ad platform → use `connect-platform`

## Input Context

You will receive:
- The user's request for segment data
- Optional: filter criteria (segment name, type, or size thresholds)
- Optional: `<campaign-brief>` tag for relevance filtering

## Output Schema

This skill triggers a **deterministic IPC call** — no LLM-generated code fence
is emitted. The response follows the standard success/error pattern:

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
        "source": "string — segment source (e.g. 'CDP', 'First-Party', 'Lookalike')",
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
conversational response:

1. Summarize how many segments were found
2. Highlight segments most relevant to the current campaign context
3. Group segments by type or source if there are many
4. Suggest next steps (e.g. "Would you like me to recommend which segments
   to target for your campaign?")

## Quality Rules

1. **Do not fabricate segment data.** This skill fetches real data from TD CDP.
   If the IPC call fails, inform the user of the error and suggest retrying
   or checking their TD connection in Settings.
2. **Do not emit a code fence.** This is a deterministic skill — the IPC layer
   handles data retrieval.
3. **Help interpret results.** After segments are returned, provide context on
   which segments might be relevant based on the current campaign brief.
4. **Support filtering.** If the user asks for specific segment types or sizes,
   communicate the filter criteria clearly.
5. **Handle empty results gracefully.** If no segments are returned, explain
   possible reasons (no CDP connection configured, no segments created yet,
   filters too restrictive) and suggest next steps.
6. **Do not modify segment data.** This is a read-only operation.
7. **If the user seems to want recommendations rather than raw data**, suggest
   using the `recommend-audience-segments` skill after fetching.

## Edge Cases

- **No TD connection configured**: Explain that the user needs to configure their
  Treasure Data connection in Settings before segments can be fetched.
- **Zero segments returned**: Note that segments may need to be created in the
  TD console first. Suggest creating segments based on the campaign objectives.
- **Large number of segments** (50+): Summarize by category/source rather than
  listing every segment. Highlight the top 10 most relevant.
- **User asks to filter by specific criteria**: Pass the filter in your response
  and explain what was filtered. Note that filtering happens client-side.
- **IPC call fails or times out**: Suggest the user check their network connection
  and TD API credentials in Settings. Offer to retry.

## Examples

### Example 1: Standard Fetch

**User message:**
> Show me my TD segments

**Expected conversational response (after IPC returns data):**

I found **12 segments** in your Treasure Data CDP:

**First-Party Segments (8):**
- High-Intent Shoppers (450K profiles) — Last updated Feb 20
- Cart Abandoners (120K profiles) — Last updated Feb 22
- Loyal Customers (85K profiles) — Last updated Feb 20
- Lapsed 90d (200K profiles) — Last updated Feb 18
- ...

**Lookalike Segments (4):**
- Top Customer Lookalike 1% (1.8M profiles)
- ...

Would you like me to recommend which segments to target for your current campaign?

### Example 2: No Segments Found

**User message:**
> What segments are available?

**Expected conversational response (no segments returned):**

No segments were found in your Treasure Data CDP. This could mean:

1. **No segments have been created yet** — you can create segments in the TD console
2. **The TD connection isn't configured** — check Settings to connect your TD account

Would you like help creating a campaign brief? I can recommend audience segments
based on your campaign objectives.

### Example 3: After Fetching, User Wants Recommendations

**User message:**
> Now which ones should I use for my campaign?

**Expected response:**

Based on the segments we just fetched and your campaign brief, let me recommend
the best targeting strategy. *(Then activate the `recommend-audience-segments` skill.)*
