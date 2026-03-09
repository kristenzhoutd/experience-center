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
- Any request to view, fetch, show, or refresh campaign performance data.

## Output Format

Emit a `campaign-fetch-json` code fence with the following JSON:

```campaign-fetch-json
{
  "action": "fetch_campaigns",
  "platform": "meta"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `action` | `"fetch_campaigns"` | The operation to perform |
| `platform` | `"meta"` \| `"google"` \| `"tiktok"` \| `"all"` | Platform to fetch from |
| `dateRange` | `{ start: string, end: string }` | Optional ISO date range filter |

### Platform Values

- **meta**: Fetch campaigns from Meta Ads (Facebook/Instagram)
- **google**: Fetch campaigns from Google Ads
- **tiktok**: Fetch campaigns from TikTok Ads
- **all**: Fetch from all connected platforms

## Quality Rules

1. **Check connection first.** If the user asks for campaigns but the platform is
   not connected, the system will prompt them to connect. Acknowledge this gracefully.
2. **Infer the platform.** If the user says "show my Facebook campaigns", map to
   `"meta"`. If they don't specify a platform, use `"all"`.
3. **Provide context.** After emitting the code fence, briefly explain what's
   happening (e.g., "Fetching your Meta campaigns — they'll appear in the panel on
   the right.").
4. **Handle date ranges.** If the user specifies a date range (e.g., "last 30 days",
   "this month"), include the `dateRange` field with ISO dates.
5. **One fetch per response.** Emit a single `campaign-fetch-json` fence per response.
