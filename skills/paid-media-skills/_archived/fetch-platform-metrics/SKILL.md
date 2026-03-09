---
name: fetch-platform-metrics
description: >
  Pulls campaign performance metrics from advertising platforms (Google Ads, Meta Ads,
  LinkedIn, etc.) via platform APIs. This is a deterministic skill that triggers
  IPC-based API calls — no LLM generation is required for the data fetch.
---

# Fetch Platform Metrics Skill

## When to Use

Activate this skill when the user wants to retrieve live or recent performance data
from their advertising platforms. Trigger phrases include but are not limited to:

- "Pull metrics from Google Ads"
- "Get my Meta campaign data"
- "Fetch platform performance"
- "Show me live campaign metrics"
- "Sync my ad platform data"
- "Import metrics from my ad accounts"
- "Get the latest numbers from Google"
- Any request to pull, fetch, import, or sync metrics from advertising platforms.

## Input Context

You will receive:
- The target advertising platform(s) to fetch from
- Campaign identifiers or account-level scope
- Date range for metrics
- Optional: specific metrics to retrieve
- Optional: granularity (daily, weekly, campaign-level, ad group-level)

## Output Schema

This skill triggers a deterministic IPC call to the platform metrics service. No
LLM-generated code fence is needed.

```jsonc
// IPC request (sent by the application):
{
  "platforms": [
    {
      "name": "string — Google Ads | Meta Ads | LinkedIn Ads | TikTok Ads | DV360",
      "accountId": "string — platform account identifier",
      "campaignIds": ["string — specific campaign IDs to fetch, or empty for all"]
    }
  ],
  "dateRange": {
    "start": "string — ISO date",
    "end": "string — ISO date"
  },
  "granularity": "string — daily | weekly | monthly | campaign | adGroup | ad",
  "metrics": ["string — specific metrics to retrieve, or empty for defaults"]
}

// IPC response:
{
  "success": true,
  "data": [
    {
      "platform": "string — platform name",
      "accountId": "string — account identifier",
      "campaigns": [
        {
          "campaignId": "string — platform campaign ID",
          "campaignName": "string — campaign name on platform",
          "status": "string — Active | Paused | Ended | Draft",
          "metrics": {
            "spend": "number",
            "impressions": "number",
            "clicks": "number",
            "conversions": "number",
            "ctr": "number",
            "cpc": "number",
            "cpa": "number",
            "roas": "number",
            "reach": "number",
            "frequency": "number"
          },
          "dailyBreakdown": [
            {
              "date": "string — ISO date",
              "metrics": {}
            }
          ]
        }
      ],
      "lastUpdated": "string — ISO datetime of data freshness"
    }
  ],
  "fetchedAt": "string — ISO datetime"
}
```

## Output Format

This is a **deterministic skill** — no LLM-generated code fence is needed.
The metrics fetch is handled entirely by the IPC handler and platform APIs.
In your conversational response, confirm which platforms and date ranges are
being queried and summarize the returned data for the user.

## Quality Rules

1. **Clarify scope before fetching.** Confirm which platforms, accounts, campaigns,
   and date ranges the user wants before triggering the fetch.
2. **Set data freshness expectations.** Platform APIs may have 2-24 hour data
   latency. Inform the user of the last updated timestamp.
3. **Handle authentication errors.** If platform credentials are missing or
   expired, guide the user to the settings page to reconnect.
4. **Handle partial failures gracefully.** If one platform succeeds but another
   fails, return the successful data and report the error separately.
5. **Summarize results after fetching.** Once data is returned, provide a brief
   conversational summary highlighting key metrics and notable trends.
6. **Do not cache or modify platform data.** Always fetch fresh data from the
   platform APIs. Report numbers exactly as returned by the platform.
