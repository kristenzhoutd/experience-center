---
name: diagnose-campaigns
description: >
  Fetches and displays live campaign data from connected advertising platforms.
  Campaign hierarchy (campaigns, ad groups, ads) appears in the right panel
  via the HierarchicalTable component.
---

# Diagnose Campaigns Skill

## When to Use

Activate this skill when the user wants to view, refresh, or analyze their live
campaign data from connected advertising platforms. Trigger phrases include:

- "Show my campaigns"
- "How are my Meta campaigns doing?"
- "Pull my campaign data"
- "What campaigns are running?"
- "Show me my ad performance"
- "Refresh campaign data"
- "Get my latest campaign metrics"
- "What's the status of my ads?"
- "Fetch my Google campaigns"
- "Show all active campaigns"
- Any request to view, fetch, show, or refresh campaign performance data.

**Do NOT use when:**
- The user wants to generate a formatted report → use `generate-report`
- The user wants to create or modify a campaign brief → use brief skills
- The user wants to connect a platform → use `connect-platform`
- The user wants CDP segment data → use `fetch-td-segments`
- The user wants budget advice → use `recommend-budget-allocation`

## Input Context

You will receive:
- The user's request
- Optional: current platform connection status
- Optional: date range preferences

## Output Schema

Emit a JSON object specifying the fetch action:

```jsonc
{
  "action": "fetch_campaigns",
  "platform": "meta | google | tiktok | all",
  "dateRange": {
    "start": "string — ISO date YYYY-MM-DD (optional)",
    "end": "string — ISO date YYYY-MM-DD (optional)"
  }
}
```

**Field constraints:**
- `action`: Must be `"fetch_campaigns"`
- `platform`: Must be one of: `"meta"`, `"google"`, `"tiktok"`, `"all"`
- `dateRange`: Optional object. Omit entirely if no date range specified.
  When present, both `start` and `end` are required and must be valid ISO dates.
  `end` must be on or after `start`.

### Platform Mapping

| User says | Maps to |
|-----------|---------|
| Facebook, Meta, Instagram | `"meta"` |
| Google, AdWords, YouTube ads | `"google"` |
| TikTok | `"tiktok"` |
| All, everything, all platforms | `"all"` |
| (no platform specified) | `"all"` |

### Date Range Mapping

| User says | Maps to |
|-----------|---------|
| "last 7 days" | `{ start: 7 days ago, end: today }` |
| "last 30 days" | `{ start: 30 days ago, end: today }` |
| "this month" | `{ start: 1st of month, end: today }` |
| "last month" | `{ start: 1st of last month, end: last day of last month }` |
| "this week" | `{ start: Monday, end: today }` |
| (no date specified) | Omit `dateRange` entirely |

## Output Format

Wrap the JSON in a `campaign-fetch-json` code fence:

````
```campaign-fetch-json
{
  "action": "fetch_campaigns",
  "platform": "meta"
}
```
````

After emitting the code fence, briefly explain what's happening (e.g., "Fetching
your Meta campaigns — they'll appear in the panel on the right.").

## Quality Rules

1. **If the user asks for campaigns but doesn't specify a platform and the
   request is clearly about one platform, infer it.** Otherwise default to
   `"all"`.
2. **If the user's request is ambiguous about whether they want to fetch data
   or do something else (like create a report), ask a clarifying question.**
3. **One fetch per response.** Emit a single `campaign-fetch-json` fence.
4. **Handle date ranges correctly.** Calculate actual ISO dates from relative
   references like "last 7 days" based on today's date.
5. **Acknowledge connection requirements.** If it's unclear whether the platform
   is connected, note that the fetch will fail if not connected and suggest
   using `connect-platform` first.
6. **Use valid platform values only.** Never output a platform not in the
   allowed list.
7. **Do not fabricate campaign data.** This skill fetches real data — your
   response should explain what will happen, not present mock data.

## Edge Cases

- **Platform not connected**: The system will handle the error gracefully.
  Acknowledge it and suggest connecting the platform first.
- **User asks for a platform not supported**: Explain that only Meta, Google,
  and TikTok are supported. Do not emit a code fence.
- **Very old date range**: Allow it but note that platforms may not have data
  beyond 90-180 days.
- **User asks "why is my campaign underperforming?"**: Fetch the data first,
  then once results appear, you can analyze the metrics conversationally.

## Examples

### Example 1: Fetch All Campaigns

**User message:**
> Show me my campaigns

**Expected output:**

Fetching campaigns from all connected platforms. They'll appear in the panel on the right.

```campaign-fetch-json
{
  "action": "fetch_campaigns",
  "platform": "all"
}
```

### Example 2: Platform-Specific with Date Range

**User message:**
> How did my Meta campaigns do last month?

**Expected output:**

Fetching your Meta campaigns for January 2026. The data will appear in the panel on the right.

```campaign-fetch-json
{
  "action": "fetch_campaigns",
  "platform": "meta",
  "dateRange": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  }
}
```

### Example 3: Ambiguous Request

**User message:**
> How are things going?

**Expected output (no code fence):**

I can help you check on your campaigns. Would you like me to:

1. **Fetch your latest campaign data** from connected platforms?
2. **Generate a performance report** with analysis and recommendations?
3. **Check which platforms are connected?**
