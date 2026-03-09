---
name: recommend-audience-segments
description: >
  Analyzes the campaign brief and available CDP segments to recommend the best
  audience segments for the campaign. Returns ranked recommendations with
  confidence scores and suggested roles.
---

# Recommend Audience Segments Skill

## When to Use

Activate this skill when the user wants AI-driven audience recommendations for
their campaign. Trigger phrases include but are not limited to:

- "Recommend audiences for this campaign"
- "Which segments should I target?"
- "Suggest audiences based on my brief"
- "What audiences would work best?"
- "Help me pick the right segments"
- "Match segments to my campaign goals"
- Any request for audience selection guidance after a brief has been created.

## Input Context

You will receive:
- The current campaign brief (CampaignBriefData)
- Available TD CDP segments (from fetch-td-segments or provided in context)
- Optional: historical campaign performance data by segment
- Optional: user preferences or constraints

## Output Schema

Return an array of segment recommendations ranked by relevance:

```jsonc
[
  {
    "segmentId": "string — TD segment ID from the available segments list",
    "segmentName": "string — segment display name",
    "reason": "string — 1-2 sentence explanation of why this segment fits the campaign",
    "confidence": "number — 0-100 confidence score for this recommendation",
    "suggestedRole": "string — Primary Target | Secondary Target | Exclusion | Suppression | Seed for Lookalike",
    "estimatedSize": "string — estimated audience size",
    "expectedImpact": "string — predicted impact on campaign KPIs",
    "channelFit": ["string — which channels this segment works best on"]
  }
]
```

## Output Format

Wrap the JSON array in an `audience-recommendation-json` code fence:

````
```audience-recommendation-json
[
  {
    "segmentId": "seg-001",
    "segmentName": "High-Intent Shoppers",
    "reason": "This segment aligns with conversion-focused campaigns and has shown 3x higher purchase rates in past campaigns.",
    "confidence": 92,
    "suggestedRole": "Primary Target",
    "estimatedSize": "450,000",
    "expectedImpact": "Expected 25% higher conversion rate vs. broad targeting",
    "channelFit": ["Google Search", "Meta Ads", "Display"]
  }
]
```
````

Before the code fence, provide a strategic summary explaining the overall audience
strategy and how the recommended segments work together.

## Quality Rules

1. **Rank by relevance.** The most impactful segments should appear first. Use
   confidence scores to communicate certainty.
2. **Match segments to campaign objectives.** Awareness campaigns need broad reach
   segments; conversion campaigns need high-intent segments.
3. **Suggest roles, not just segments.** Each recommendation should have a clear
   role — primary targeting, exclusion, or lookalike seeding.
4. **Reference real segment IDs.** Only recommend segments that exist in the
   available segments list. Do not invent segment IDs.
5. **Explain the "why".** Each reason should connect the segment characteristics
   to specific campaign goals or KPIs.
6. **Include exclusion recommendations.** Suggest segments to exclude (e.g. recent
   purchasers for acquisition campaigns) when strategically valuable.
7. **Limit recommendations to 5-8 segments** to keep the strategy focused.
