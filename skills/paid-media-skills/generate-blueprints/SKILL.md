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
- "Turn this brief into a blueprint"
- "Create an execution plan"
- "Generate a media plan from my brief"
- Any request to move from brief to an actionable campaign plan.

**Do NOT use when:**
- No campaign brief exists → tell the user to create a brief first
- The user wants to modify an existing blueprint → use `refine-blueprint`
- The user is asking about the brief itself → use `refine-campaign-brief`
- The user is asking for a media mix recommendation only → use `recommend-media-mix`
- The user wants budget allocation advice → use `recommend-budget-allocation`

## Input Context

You will receive:
- `<campaign-brief>` tag containing the complete CampaignBriefData object
- Optional: user preferences for emphasis (e.g. "focus on video", "prioritize ROAS")
- Optional: historical campaign performance data
- Optional: `<company-context>` tag with industry benchmarks

## Output Schema

Return an array containing exactly **1 blueprint** object — the single best
recommended plan that balances performance, risk, and the brief's constraints:

```jsonc
[
  {
    "id": "string — unique ID: bp-<brief-name-slug>-<3-digit-number> (e.g. bp-summer-sale-001)",
    "name": "string — descriptive blueprint name (max 80 chars)",
    "variant": "balanced",
    "confidence": "number — 0-100 confidence score based on data availability",
    "summary": "string — 2-3 sentence strategy summary (max 300 chars)",
    "channels": [
      {
        "name": "string — from: Google Search | Google Display | Google Shopping | Meta Ads | Instagram Ads | YouTube Ads | TikTok Ads | LinkedIn Ads | Pinterest Ads | Snapchat Ads | X Ads | Programmatic | Connected TV | Amazon Ads | Apple Search Ads | Reddit Ads | Spotify Ads",
        "budgetPercent": "number — 0-100 (all channels must sum to 100)",
        "budgetAmount": "string — calculated dollar amount (e.g. '$30,000')",
        "role": "Awareness | Consideration | Conversion | Retargeting",
        "formats": ["string — ad formats (e.g. 'Responsive Search', 'Video', 'Carousel', 'Stories')"],
        "expectedMetrics": {
          "impressions": "string — estimated impressions (e.g. '2.5M')",
          "clicks": "string — estimated clicks (e.g. '45K')",
          "ctr": "string — estimated CTR (e.g. '1.8%')",
          "cpc": "string — estimated CPC (e.g. '$1.20')",
          "conversions": "string — estimated conversions (e.g. '1,200')",
          "cpa": "string — estimated CPA (e.g. '$25')",
          "roas": "string — estimated ROAS (e.g. '4.2x')"
        }
      }
    ],
    "audiences": [
      {
        "name": "string — audience segment name (max 60 chars)",
        "type": "Prospecting | Retargeting | Lookalike | Custom",
        "priority": "Primary | Secondary",
        "channels": ["string — which channels target this audience"]
      }
    ],
    "budget": {
      "total": "string — total budget amount (e.g. '$75,000')",
      "pacing": "Even | Front-loaded | Back-loaded",
      "phases": [
        {
          "name": "string — phase name",
          "percent": "number — 0-100 (all phases must sum to 100)",
          "amount": "string — dollar amount (e.g. '$30,000')",
          "duration": "string — e.g. 'Weeks 1-2', 'June 1-14'"
        }
      ]
    },
    "metrics": {
      "estimatedReach": "string — total estimated reach (e.g. '5M')",
      "estimatedImpressions": "string — total estimated impressions (e.g. '12M')",
      "estimatedClicks": "string — total estimated clicks (e.g. '180K')",
      "estimatedConversions": "string — total estimated conversions (e.g. '3,600')",
      "estimatedRoas": "string — overall estimated ROAS (e.g. '3.8x')",
      "estimatedCpa": "string — overall estimated CPA (e.g. '$28')"
    },
    "messaging": {
      "primaryMessage": "string — main campaign message (max 150 chars)",
      "supportingMessages": ["string — secondary messages by channel or phase"],
      "toneAndVoice": "string — creative direction (max 100 chars)"
    },
    "cta": "string — primary call-to-action (max 30 chars)"
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

1. **Produce exactly 1 optimized blueprint.** Use `"variant": "balanced"`.
2. **If the brief is incomplete or missing critical data (no channels, no budget,
   no audience), ask a clarifying question INSTEAD of generating a blueprint.**
3. **Budget allocations across channels must sum to 100%.** Round to whole numbers.
4. **Phase budget percentages must sum to 100%.** Round to whole numbers.
5. **Metrics should be realistic.** Base estimates on industry benchmarks for the
   given channels and campaign type. Do not inflate projections.
6. **ALL mandatory channels from the brief MUST appear in the blueprint.** This is
   non-negotiable — if the brief lists a channel in `mandatoryChannels`, the
   blueprint MUST include it with a budget allocation and expected metrics. Do NOT
   drop, merge, or omit any mandatory channel. Optional channels from the brief
   (`optionalChannels`) should also be included when budget allows, unless there
   is a strong reason to exclude them (explain why in your conversational response).
7. **The blueprint needs a clear strategic narrative.** The summary should
   explain the "why" behind the approach, not just restate the numbers.
8. **Use only valid enum values** for channel names, roles, audience types, and pacing.
9. **Channel-level metrics must be consistent** — clicks * CPC should approximate
   budgetAmount. CTR * impressions should approximate clicks.
10. **All dollar amounts must use consistent formatting** — include currency symbol,
    use commas for thousands (e.g. "$45,000").

## Edge Cases

- **Brief has no budget**: Generate the blueprint with percentage-based allocations
  only. Leave budgetAmount and dollar amounts as empty strings. Note in your
  response that adding a budget will enable dollar-amount projections.
- **Brief has only 1 channel**: Create a single-channel blueprint. Suggest in your
  conversational response that adding channels could improve results.
- **Very small budget** (< $5,000): Recommend concentrating on 1-2 channels maximum.
  Note that small budgets limit testing and optimization potential.
- **No audience defined in brief**: Use reasonable defaults for the campaign type
  and note the assumption.
- **Brief has many channels** (5+): Include ALL mandatory channels. For each one,
  allocate at least 10% of the budget so it has enough spend to generate meaningful
  data. If the budget is too small to support all channels effectively, note this
  concern but still include every mandatory channel.

## Examples

### Example 1: Standard Conversion Campaign

**User message:**
> Generate a blueprint from my brief

**Brief context:** Summer shoe campaign, $75K budget, Google Search + Meta, women 25-44

**Expected output:**

Based on your brief, I recommend a balanced approach that splits spend between Google Search for high-intent capture and Meta for prospecting and retargeting. Here's your optimized blueprint:

```blueprints-json
[
  {
    "id": "bp-summer-shoes-001",
    "name": "Summer Shoes — Balanced Conversion Plan",
    "variant": "balanced",
    "confidence": 78,
    "summary": "A balanced conversion plan leveraging Google Search for high-intent demand capture and Meta Ads for prospecting and retargeting. Front-loaded pacing to capitalize on early-season shopping momentum.",
    "channels": [
      {
        "name": "Google Search",
        "budgetPercent": 45,
        "budgetAmount": "$33,750",
        "role": "Conversion",
        "formats": ["Responsive Search", "Shopping"],
        "expectedMetrics": {
          "impressions": "850K",
          "clicks": "34K",
          "ctr": "4.0%",
          "cpc": "$0.99",
          "conversions": "680",
          "cpa": "$49.63",
          "roas": "4.5x"
        }
      },
      {
        "name": "Meta Ads",
        "budgetPercent": 55,
        "budgetAmount": "$41,250",
        "role": "Conversion",
        "formats": ["Carousel", "Stories", "Reels"],
        "expectedMetrics": {
          "impressions": "3.2M",
          "clicks": "48K",
          "ctr": "1.5%",
          "cpc": "$0.86",
          "conversions": "520",
          "cpa": "$79.33",
          "roas": "3.2x"
        }
      }
    ],
    "audiences": [
      {
        "name": "Fashion-Forward Women 25-44",
        "type": "Prospecting",
        "priority": "Primary",
        "channels": ["Google Search", "Meta Ads"]
      },
      {
        "name": "Past Purchasers — Retargeting",
        "type": "Retargeting",
        "priority": "Secondary",
        "channels": ["Meta Ads"]
      }
    ],
    "budget": {
      "total": "$75,000",
      "pacing": "Front-loaded",
      "phases": [
        {
          "name": "Launch & Scale",
          "percent": 60,
          "amount": "$45,000",
          "duration": "Weeks 1-3"
        },
        {
          "name": "Optimize & Retarget",
          "percent": 40,
          "amount": "$30,000",
          "duration": "Weeks 4-6"
        }
      ]
    },
    "metrics": {
      "estimatedReach": "2.8M",
      "estimatedImpressions": "4.1M",
      "estimatedClicks": "82K",
      "estimatedConversions": "1,200",
      "estimatedRoas": "3.8x",
      "estimatedCpa": "$62.50"
    },
    "messaging": {
      "primaryMessage": "Step into summer with the season's hottest styles — shop the new collection.",
      "supportingMessages": [
        "Search: 'Summer shoes on sale — free shipping on orders $75+'",
        "Meta: 'New arrivals just dropped — 200+ summer styles starting at $39'"
      ],
      "toneAndVoice": "Aspirational yet accessible, fashion-forward, seasonally relevant"
    },
    "cta": "Shop the Collection"
  }
]
```

### Example 2: Missing Budget — Still Generate

**User message:**
> Create a blueprint for my brief (no budget specified)

**Expected output:**

I've created a blueprint based on your brief. Since no budget was specified, I've used percentage-based allocations. Once you add a budget to your brief, I can calculate specific dollar amounts and more precise metric projections.

```blueprints-json
[
  {
    "id": "bp-saas-launch-001",
    "name": "SaaS Launch — Google + LinkedIn Lead Gen",
    "variant": "balanced",
    "confidence": 55,
    "summary": "A lead generation plan combining Google Search for high-intent capture with LinkedIn for B2B prospecting. Budget split favors Google for proven ROI with LinkedIn for targeted awareness.",
    "channels": [
      {
        "name": "Google Search",
        "budgetPercent": 55,
        "budgetAmount": "",
        "role": "Conversion",
        "formats": ["Responsive Search"],
        "expectedMetrics": {
          "impressions": "",
          "clicks": "",
          "ctr": "3.5%",
          "cpc": "",
          "conversions": "",
          "cpa": "",
          "roas": ""
        }
      },
      {
        "name": "LinkedIn Ads",
        "budgetPercent": 45,
        "budgetAmount": "",
        "role": "Consideration",
        "formats": ["Sponsored Content", "Lead Gen Forms"],
        "expectedMetrics": {
          "impressions": "",
          "clicks": "",
          "ctr": "0.8%",
          "cpc": "",
          "conversions": "",
          "cpa": "",
          "roas": ""
        }
      }
    ],
    "audiences": [
      {
        "name": "B2B Decision Makers",
        "type": "Prospecting",
        "priority": "Primary",
        "channels": ["Google Search", "LinkedIn Ads"]
      }
    ],
    "budget": {
      "total": "",
      "pacing": "Even",
      "phases": [
        {
          "name": "Launch & Learn",
          "percent": 100,
          "amount": "",
          "duration": "Weeks 1-4"
        }
      ]
    },
    "metrics": {
      "estimatedReach": "",
      "estimatedImpressions": "",
      "estimatedClicks": "",
      "estimatedConversions": "",
      "estimatedRoas": "",
      "estimatedCpa": ""
    },
    "messaging": {
      "primaryMessage": "The modern solution for teams who need results — start your free trial today.",
      "supportingMessages": [
        "Search: 'Try [Product] free — trusted by 500+ companies'",
        "LinkedIn: 'See how leading teams are saving 10+ hours per week'"
      ],
      "toneAndVoice": "Professional, benefit-driven, trust-building"
    },
    "cta": "Start Free Trial"
  }
]
```
