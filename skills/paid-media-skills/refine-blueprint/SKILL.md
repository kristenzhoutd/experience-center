---
name: refine-blueprint
description: >
  Modifies a specific campaign blueprint based on user feedback. Returns only the
  changed fields as a partial update that will be merged into the selected blueprint.
---

# Refine Blueprint Skill

## When to Use

Activate this skill when the user wants to modify, adjust, or improve a specific
blueprint after generation. Trigger phrases include but are not limited to:

- "Adjust the budget split on the blueprint"
- "Move more budget to Google Search"
- "Add TikTok as a channel"
- "Make this blueprint more aggressive"
- "Change the CTA to ..."
- "Remove the retargeting audience"
- "What if we increase the budget by 20%?"
- "Shift budget from Meta to YouTube"
- "Update the messaging to be more urgent"
- "Add a new phase for retargeting"
- Any request to edit a specific blueprint after blueprints have been generated.

**Do NOT use when:**
- No blueprints exist → use `generate-blueprints`
- The user wants to modify the campaign brief → use `refine-campaign-brief`
- The user wants a media mix recommendation → use `recommend-media-mix`
- The user wants a completely new blueprint → use `generate-blueprints`

## Input Context

You will receive:
- `<selected-blueprint>` tag with the blueprint being modified
- `<campaign-brief>` tag with the original campaign brief
- The user's modification request
- Conversation history for context

## Output Schema

Return a partial blueprint object containing **only** the fields that changed.
The application will deep-merge this into the selected blueprint.

```jsonc
{
  "id": "string — ID of the blueprint being modified (ALWAYS include this)",

  // Include ONLY fields that are being modified:

  "name": "string — updated name (max 80 chars)",
  "summary": "string — updated strategy summary (max 300 chars)",
  "confidence": "number — 0-100",

  "channels": [
    {
      "name": "string — valid channel name",
      "budgetPercent": "number — 0-100 (all channels must sum to 100)",
      "budgetAmount": "string — e.g. '$30,000'",
      "role": "Awareness | Consideration | Conversion | Retargeting",
      "formats": ["string"],
      "expectedMetrics": {
        "impressions": "string",
        "clicks": "string",
        "ctr": "string",
        "cpc": "string",
        "conversions": "string",
        "cpa": "string",
        "roas": "string"
      }
    }
  ],

  "audiences": [
    {
      "name": "string — max 60 chars",
      "type": "Prospecting | Retargeting | Lookalike | Custom",
      "priority": "Primary | Secondary",
      "channels": ["string"]
    }
  ],

  "budget": {
    "total": "string — e.g. '$90,000'",
    "pacing": "Even | Front-loaded | Back-loaded",
    "phases": [
      {
        "name": "string",
        "percent": "number — 0-100 (all phases sum to 100)",
        "amount": "string",
        "duration": "string"
      }
    ]
  },

  "metrics": {
    "estimatedReach": "string",
    "estimatedImpressions": "string",
    "estimatedClicks": "string",
    "estimatedConversions": "string",
    "estimatedRoas": "string",
    "estimatedCpa": "string"
  },

  "messaging": {
    "primaryMessage": "string — max 150 chars",
    "supportingMessages": ["string"],
    "toneAndVoice": "string — max 100 chars"
  },

  "cta": "string — max 30 chars"
}
```

## Output Format

Wrap the partial JSON in a `blueprint-update-json` code fence:

````
```blueprint-update-json
{
  "id": "bp-balanced-001",
  "channels": [ ... ],
  "metrics": { ... }
}
```
````

Before the code fence, explain what was changed and the expected impact on
campaign performance.

## Quality Rules

1. **Always include the blueprint `id`** so the application knows which blueprint
   to update.
2. **Return only changed fields.** Do not echo the entire blueprint. The
   application performs a deep merge.
3. **If the user's request is ambiguous, ask a clarifying question INSTEAD of
   emitting JSON.** For example, if the user says "change the budget" without
   specifying the new amount, ask what budget they want.
4. **Recalculate dependent fields.** If budget allocation changes, update the
   channel amounts and expected metrics accordingly.
5. **Budget percentages across channels must still sum to 100%** after the update.
   Round to whole numbers.
6. **Phase budget percentages must still sum to 100%.**
7. **Explain trade-offs.** If adding a channel, explain what was reduced to
   accommodate it. If changing budget, explain the expected impact.
8. **Maintain strategic coherence.** Changes should still make sense as a
   cohesive campaign strategy.
9. **Use only valid enum values** for channel names, roles, audience types, pacing.
10. **Recalculate aggregate metrics** when channel-level changes affect totals.

## Edge Cases

- **User wants to add a channel but no budget to reallocate**: Reduce the lowest-
  performing or least-critical channel's allocation proportionally. Explain the
  trade-off.
- **User wants to remove the only channel**: Ask which channel to replace it with.
  A blueprint must have at least one channel.
- **Budget increase/decrease**: Scale all channel amounts proportionally unless
  the user specifies otherwise.
- **Conflicting instructions**: If the user says "cut the budget by 50% but keep
  the same conversion targets", note that this creates unrealistic expectations
  and suggest revised targets.

## Examples

### Example 1: Channel Budget Reallocation

**User message:**
> Move 15% of the Meta budget to Google Search

**Expected output:**

I'll shift 15 percentage points from Meta Ads to Google Search. This increases Search's share from 45% to 60% and reduces Meta from 55% to 40%. Since Google Search typically has higher intent, I'd expect CPA to improve slightly, though total reach will decrease.

```blueprint-update-json
{
  "id": "bp-summer-shoes-001",
  "channels": [
    {
      "name": "Google Search",
      "budgetPercent": 60,
      "budgetAmount": "$45,000",
      "role": "Conversion",
      "formats": ["Responsive Search", "Shopping"],
      "expectedMetrics": {
        "impressions": "1.1M",
        "clicks": "44K",
        "ctr": "4.0%",
        "cpc": "$1.02",
        "conversions": "880",
        "cpa": "$51.14",
        "roas": "4.4x"
      }
    },
    {
      "name": "Meta Ads",
      "budgetPercent": 40,
      "budgetAmount": "$30,000",
      "role": "Conversion",
      "formats": ["Carousel", "Stories", "Reels"],
      "expectedMetrics": {
        "impressions": "2.3M",
        "clicks": "35K",
        "ctr": "1.5%",
        "cpc": "$0.86",
        "conversions": "380",
        "cpa": "$78.95",
        "roas": "3.2x"
      }
    }
  ],
  "metrics": {
    "estimatedReach": "2.4M",
    "estimatedImpressions": "3.4M",
    "estimatedClicks": "79K",
    "estimatedConversions": "1,260",
    "estimatedRoas": "4.0x",
    "estimatedCpa": "$59.52"
  }
}
```

### Example 2: Adding a New Channel

**User message:**
> Add TikTok Ads with 20% of the budget

**Expected output:**

I'll add TikTok Ads at 20% of the budget. To accommodate this, I'll proportionally reduce Google Search from 60% to 48% and Meta Ads from 40% to 32%. TikTok is strong for reaching younger demographics with short-form video and should complement your existing channels.

```blueprint-update-json
{
  "id": "bp-summer-shoes-001",
  "channels": [
    {
      "name": "Google Search",
      "budgetPercent": 48,
      "budgetAmount": "$36,000",
      "role": "Conversion",
      "formats": ["Responsive Search", "Shopping"],
      "expectedMetrics": {
        "impressions": "900K",
        "clicks": "36K",
        "ctr": "4.0%",
        "cpc": "$1.00",
        "conversions": "720",
        "cpa": "$50.00",
        "roas": "4.5x"
      }
    },
    {
      "name": "Meta Ads",
      "budgetPercent": 32,
      "budgetAmount": "$24,000",
      "role": "Conversion",
      "formats": ["Carousel", "Stories"],
      "expectedMetrics": {
        "impressions": "1.8M",
        "clicks": "27K",
        "ctr": "1.5%",
        "cpc": "$0.89",
        "conversions": "290",
        "cpa": "$82.76",
        "roas": "3.0x"
      }
    },
    {
      "name": "TikTok Ads",
      "budgetPercent": 20,
      "budgetAmount": "$15,000",
      "role": "Awareness",
      "formats": ["In-Feed Video", "Spark Ads"],
      "expectedMetrics": {
        "impressions": "1.5M",
        "clicks": "22K",
        "ctr": "1.5%",
        "cpc": "$0.68",
        "conversions": "150",
        "cpa": "$100.00",
        "roas": "2.5x"
      }
    }
  ],
  "metrics": {
    "estimatedReach": "3.5M",
    "estimatedImpressions": "4.2M",
    "estimatedClicks": "85K",
    "estimatedConversions": "1,160",
    "estimatedRoas": "3.6x",
    "estimatedCpa": "$64.66"
  }
}
```

### Example 3: Ambiguous Request

**User message:**
> Change the budget

**Expected output (no code fence):**

I'd be happy to update the budget. Could you tell me:

1. **What should the new total budget be?** (or by what percentage should it increase/decrease?)
2. **Should the channel allocation percentages stay the same**, or do you want to adjust how it's split?
