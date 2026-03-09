---
name: recommend-media-mix
description: >
  Recommends the optimal channel mix and budget allocation for a campaign blueprint.
  Analyzes campaign objectives, audience, budget, and existing channels to suggest
  which channels to include, their roles, and how to split budget across them.
---

# Recommend Media Mix Skill

## When to Use

Activate this skill when the user wants AI-driven recommendations for their
media channel mix and budget allocation within a campaign blueprint. Trigger
phrases include but are not limited to:

- "Recommend channels for my campaign"
- "Optimize my media mix"
- "Which channels should I use?"
- "Improve my channel allocation"
- "Help me with the media mix"
- "Suggest better budget allocation"
- "AI edit media mix" (triggered by the AI Edit button on Media Mix section)
- Any request for channel selection, media planning, or budget distribution.

## Input Context

You will receive:
- Campaign brief data (objectives, KPIs, audiences, budget, timeline)
- Current media mix (channels, roles, allocation percentages)
- Campaign type (awareness, consideration, conversion, retention)
- Budget amount and pacing

## Output Schema

Return a complete recommended media mix with channel allocations:

```jsonc
{
  "channels": [
    {
      "name": "string — channel name (e.g. Meta Ads, Google Ads, TikTok Ads)",
      "role": "string — channel role (e.g. Primary Acquisition, Demand Capture, Discovery, Retargeting, Awareness, Scale)",
      "percentage": "number — recommended budget allocation percentage (0-100)",
      "rationale": "string — 1-2 sentence explanation of why this channel and allocation"
    }
  ],
  "removedChannels": [
    {
      "name": "string — channel that should be removed from current mix",
      "reason": "string — why it should be removed"
    }
  ],
  "addedChannels": [
    {
      "name": "string — channel that should be added",
      "reason": "string — why it should be added"
    }
  ],
  "strategy": "string — overall media strategy summary in 1-2 sentences",
  "expectedImpact": {
    "reach": "string — estimated reach improvement",
    "efficiency": "string — estimated efficiency improvement",
    "confidence": "string — High | Medium | Low"
  }
}
```

## Output Format

Wrap the JSON in a `media-mix-json` code fence:

````
```media-mix-json
{
  "channels": [
    { "name": "Meta Ads", "role": "Primary Acquisition", "percentage": 40, "rationale": "Strong targeting capabilities for new customer acquisition" },
    { "name": "Google Ads", "role": "Demand Capture", "percentage": 30, "rationale": "Captures high-intent search demand" },
    { "name": "TikTok Ads", "role": "Discovery", "percentage": 15, "rationale": "Reaches younger demographics with engaging short-form content" },
    { "name": "YouTube Shorts", "role": "Awareness", "percentage": 15, "rationale": "Cost-effective upper-funnel reach" }
  ],
  "removedChannels": [],
  "addedChannels": [
    { "name": "TikTok Ads", "reason": "Strong for the target demographic and cost-effective awareness" }
  ],
  "strategy": "Concentrate spend on proven acquisition channels while testing emerging platforms for incremental reach.",
  "expectedImpact": { "reach": "+25%", "efficiency": "+15% ROAS", "confidence": "High" }
}
```
````

Before the code fence, briefly explain the recommended changes and reasoning.

## Quality Rules

1. **Allocation percentages must sum to 100%.** Validate the total.
2. **Use valid channel names.** Only recommend channels from this list:
   Meta Ads, Google Ads, Google Search, Google Display, Google Shopping,
   YouTube, YouTube Ads, YouTube Shorts, TikTok Ads, LinkedIn Ads,
   Pinterest Ads, Snapchat Ads, X Ads, Programmatic, Connected TV,
   Spotify Ads, Amazon Ads, Apple Search Ads, Reddit Ads, Instagram Ads.
3. **Match channels to campaign type.** Awareness campaigns should emphasize
   reach channels; conversion campaigns should favor direct-response channels;
   B2B campaigns should include LinkedIn.
4. **Consider audience fit.** Recommend channels where the target audience
   is most active and engaged.
5. **Respect budget constraints.** Small budgets should concentrate on fewer
   channels; large budgets can spread across more.
6. **Provide clear rationale.** Each channel should have a concise reason
   for its inclusion and allocation level.
7. **Highlight changes.** If channels are being added or removed from the
   current mix, list them in addedChannels/removedChannels.
