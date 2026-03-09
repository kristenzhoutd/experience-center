---
name: generate-blueprints
description: >
  Creates a single optimized campaign blueprint from a completed campaign brief.
  The blueprint includes channel mix, audience strategy, budget allocation,
  messaging, and predicted metrics — representing the best recommended approach.
---

# Generate Blueprints Skill

## When to Use

Activate this skill when the user has a completed campaign brief and wants to
generate an executable blueprint. Trigger phrases include but are not limited to:

- "Generate blueprint"
- "Create campaign plan from this brief"
- "Show me a blueprint"
- "Build media plan"
- "What's the best campaign plan?"
- Any request to move from brief to an actionable campaign plan.

## Input Context

You will receive:
- The complete CampaignBriefData object
- Optional: user preferences for emphasis (e.g. "focus on video", "prioritize ROAS")
- Optional: historical campaign performance data

## Output Schema

Return an array containing exactly 1 blueprint object — the single best recommended plan
that balances performance, risk, and the brief's constraints:

```jsonc
[
  {
    "id": "string — unique ID per generation (e.g. bp-<brief-name-slug>-001)",
    "name": "string — descriptive blueprint name",
    "variant": "balanced",
    "confidence": "number — 0-100 confidence score based on data availability",
    "summary": "string — 2-3 sentence strategy summary",
    "channels": [
      {
        "name": "string — channel name (e.g. Google Search, Meta Ads)",
        "budgetPercent": "number — percentage of total budget",
        "budgetAmount": "string — calculated dollar amount",
        "role": "string — Awareness | Consideration | Conversion | Retargeting",
        "formats": ["string — ad formats (e.g. Responsive Search, Video, Carousel)"],
        "expectedMetrics": {
          "impressions": "string — estimated impressions",
          "clicks": "string — estimated clicks",
          "ctr": "string — estimated CTR",
          "cpc": "string — estimated CPC",
          "conversions": "string — estimated conversions",
          "cpa": "string — estimated CPA",
          "roas": "string — estimated ROAS"
        }
      }
    ],
    "audiences": [
      {
        "name": "string — audience segment name",
        "type": "string — Prospecting | Retargeting | Lookalike | Custom",
        "priority": "string — Primary | Secondary",
        "channels": ["string — which channels target this audience"]
      }
    ],
    "budget": {
      "total": "string — total budget amount",
      "pacing": "string — Even | Front-loaded | Back-loaded",
      "phases": [
        {
          "name": "string — phase name",
          "percent": "number — budget percentage",
          "amount": "string — dollar amount",
          "duration": "string — e.g. Weeks 1-2"
        }
      ]
    },
    "metrics": {
      "estimatedReach": "string — total estimated reach",
      "estimatedImpressions": "string — total estimated impressions",
      "estimatedClicks": "string — total estimated clicks",
      "estimatedConversions": "string — total estimated conversions",
      "estimatedRoas": "string — overall estimated ROAS",
      "estimatedCpa": "string — overall estimated CPA"
    },
    "messaging": {
      "primaryMessage": "string — main campaign message",
      "supportingMessages": ["string — secondary messages by channel or phase"],
      "toneAndVoice": "string — creative direction"
    },
    "cta": "string — primary call-to-action"
  }
]
```

## Output Format

Wrap the JSON array in a `blueprints-json` code fence:

````
```blueprints-json
[
  { "id": "bp-summer-sale-001", "variant": "balanced", ... }
]
```
````

Before the code fence, provide a brief explanation of the recommended strategy
and why this approach best fits the campaign brief.

## Quality Rules

1. **Produce exactly 1 optimized blueprint.** This should be the single best
   recommended plan that balances performance, efficiency, and the brief's goals.
   Use `"variant": "balanced"` as the variant value.
2. **Budget allocations must sum to 100%** across channels.
3. **Metrics should be realistic.** Base estimates on industry benchmarks for the
   given channels and campaign type. Do not inflate projections.
4. **Channel recommendations must align with the brief.** Mandatory channels from
   the brief must appear in the blueprint. Include optional channels only when
   they materially improve expected outcomes.
5. **The blueprint needs a clear strategic narrative.** The summary should
   explain the "why" behind the approach, not just restate the numbers.
