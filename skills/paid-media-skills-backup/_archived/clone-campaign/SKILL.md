---
name: clone-campaign
description: >
  Clones an existing campaign configuration with AI-powered improvements. Analyzes
  the source campaign's performance to suggest optimizations for the cloned version,
  including updated targeting, budget allocation, and creative direction.
---

# Clone Campaign Skill

## When to Use

Activate this skill when the user wants to duplicate a campaign with intelligent
modifications. Trigger phrases include but are not limited to:

- "Clone this campaign"
- "Duplicate this campaign with improvements"
- "Create a new version of this campaign"
- "Copy this campaign for next quarter"
- "Relaunch this campaign with updates"
- "Use this campaign as a template"
- "Make a similar campaign for a different audience"
- Any request to replicate a campaign with or without modifications.

## Input Context

You will receive:
- The source campaign configuration (brief, blueprint, settings)
- Source campaign performance data
- The user's instructions for what to change or improve
- Optional: target audience or market for the new campaign
- Optional: new budget or timeline constraints

## Output Schema

Return a cloned campaign object with AI-suggested changes:

```jsonc
{
  "sourceCampaignId": "string — ID of the campaign being cloned",
  "clonedCampaign": {
    "campaignDetails": {
      "campaignName": "string — updated campaign name indicating it is a new version",
      "campaignType": "string — same or updated campaign type",
      "description": "string — updated campaign description"
    },
    "brandProduct": "string",
    "businessObjective": "string",
    "businessObjectiveTags": ["string"],
    "primaryGoals": ["string"],
    "secondaryGoals": ["string"],
    "primaryKpis": ["string"],
    "secondaryKpis": ["string"],
    "inScope": ["string"],
    "outOfScope": ["string"],
    "primaryAudience": [
      {
        "name": "string",
        "description": "string",
        "estimatedSize": "string"
      }
    ],
    "secondaryAudience": [
      {
        "name": "string",
        "description": "string",
        "estimatedSize": "string"
      }
    ],
    "mandatoryChannels": ["string"],
    "optionalChannels": ["string"],
    "budgetAmount": "string",
    "pacing": "string",
    "phases": [
      {
        "name": "string",
        "startDate": "string",
        "endDate": "string",
        "budgetPercent": "number",
        "focus": "string"
      }
    ],
    "timelineStart": "string — ISO date",
    "timelineEnd": "string — ISO date"
  },
  "changes": [
    {
      "field": "string — which field was changed",
      "previousValue": "string — value in source campaign",
      "newValue": "string — value in cloned campaign",
      "reason": "string — why this change was made"
    }
  ],
  "suggestions": [
    {
      "category": "string — Performance | Audience | Creative | Budget | Timing",
      "suggestion": "string — specific improvement suggestion",
      "basedOn": "string — what data or insight this is based on",
      "expectedImpact": "string — projected improvement"
    }
  ],
  "aiSummary": "string — 2-3 sentence summary of what was cloned and what was improved"
}
```

## Output Format

Wrap the JSON in a `clone-campaign-json` code fence:

````
```clone-campaign-json
{
  "sourceCampaignId": "camp-001",
  "clonedCampaign": { ... },
  "changes": [
    {
      "field": "budgetAmount",
      "previousValue": "$50,000",
      "newValue": "$65,000",
      "reason": "Original campaign was budget-constrained on Search. Increasing budget to capture additional high-intent traffic."
    }
  ],
  "suggestions": [ ... ],
  "aiSummary": "Cloned Q4 Search campaign with 30% budget increase, refined audience targeting based on conversion data, and updated timeline for Q1 2026."
}
```
````

Before the code fence, explain the key changes and improvements made in the
cloned campaign and why they are expected to perform better.

## Quality Rules

1. **Preserve what worked.** Do not change high-performing elements unless the
   user specifically requests it. Focus improvements on underperforming areas.
2. **Document every change.** The `changes` array must list every field that
   differs from the source campaign with a clear reason.
3. **Learn from performance data.** Suggestions should be grounded in the source
   campaign's actual performance, not generic best practices.
4. **Update timeline appropriately.** Cloned campaigns should have future dates.
   Do not copy past dates verbatim.
5. **Rename the campaign clearly.** The cloned campaign name should indicate it
   is a new version (e.g. "Q1 2026 Search Campaign v2" or "Spring Relaunch").
6. **Separate changes from suggestions.** Changes are applied to the cloned
   campaign. Suggestions are additional ideas the user may want to consider but
   are not yet applied.
