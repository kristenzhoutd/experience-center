---
name: recommend-budget-allocation
description: >
  Analyzes campaign performance and objectives to recommend optimal budget distribution
  across channels, audiences, and time periods. Returns allocation percentages with
  expected impact projections.
---

# Recommend Budget Allocation Skill

## When to Use

Activate this skill when the user wants AI-driven recommendations for how to
distribute their campaign budget. Trigger phrases include but are not limited to:

- "How should I allocate my budget?"
- "Optimize my budget split"
- "Where should I spend more?"
- "Recommend budget distribution"
- "Reallocate budget based on performance"
- "Which channels deserve more budget?"
- "I have $X — how should I split it?"
- "Shift budget to better-performing channels"
- "What's the optimal budget mix?"
- Any request for budget optimization, reallocation, or distribution strategy.

**Do NOT use when:**
- The user wants to change the total budget amount on the brief → use
  `refine-campaign-brief`
- The user wants to change a blueprint's budget → use `refine-blueprint`
- The user is asking about channel selection (not budget) → use `recommend-media-mix`
- The user has no campaign context → ask them to create a brief first

## Input Context

You will receive:
- `<campaign-brief>` tag with campaign brief including objectives and KPIs
- `<selected-blueprint>` tag with current blueprint and channel allocations
- Optional: current performance metrics by channel
- Optional: historical performance data
- Optional: budget constraints or minimums per channel

## Output Schema

Return a budget allocation recommendation with impact projections:

```jsonc
{
  "campaignId": "string — campaign or blueprint identifier",
  "totalBudget": "string — total budget being allocated (e.g. '$100,000')",
  "strategy": "Maximize ROAS | Maximize Reach | Balanced Growth | Minimize CPA",
  "allocations": [
    {
      "channel": "string — from: Google Search | Google Display | Google Shopping | Meta Ads | Instagram Ads | YouTube Ads | TikTok Ads | LinkedIn Ads | Pinterest Ads | Snapchat Ads | X Ads | Programmatic | Connected TV | Amazon Ads | Apple Search Ads | Reddit Ads | Spotify Ads",
      "currentPercent": "number — 0-100 current allocation percentage",
      "currentAmount": "string — current dollar amount (e.g. '$30,000')",
      "recommendedPercent": "number — 0-100 recommended allocation percentage",
      "recommendedAmount": "string — recommended dollar amount (e.g. '$40,000')",
      "changePercent": "number — percentage point change (positive = increase, negative = decrease)",
      "rationale": "string — why this change is recommended (max 200 chars)",
      "expectedMetrics": {
        "impressions": "string — estimated impressions at new budget",
        "clicks": "string — estimated clicks",
        "conversions": "string — estimated conversions",
        "cpa": "string — estimated CPA",
        "roas": "string — estimated ROAS"
      }
    }
  ],
  "expectedImpact": {
    "overallRoasChange": "string — projected ROAS change (e.g. '+15%')",
    "overallCpaChange": "string — projected CPA change (e.g. '-12%')",
    "overallConversionChange": "string — projected conversion volume change (e.g. '+50 conversions')",
    "confidenceLevel": "number — 0-100 confidence in projections"
  },
  "constraints": ["string — any constraints considered (e.g. 'minimum $5,000 per channel', 'platform learning phase minimums')"],
  "alternativeScenarios": [
    {
      "name": "string — scenario name (max 40 chars)",
      "description": "string — brief description (max 150 chars)",
      "keyDifference": "string — how it differs from primary recommendation (max 100 chars)"
    }
  ],
  "aiInsight": "string — 2-3 sentence strategic rationale for the recommended allocation (max 300 chars)"
}
```

**Field constraints:**
- `allocations[].currentPercent` values must sum to 100
- `allocations[].recommendedPercent` values must sum to 100
- `alternativeScenarios` array: 1-2 items
- `expectedImpact.confidenceLevel`: 0-100
- Dollar amounts must include currency symbol and commas (e.g. "$45,000")
- Percentage changes must include sign (e.g. "+15%", "-8%")

## Output Format

Wrap the JSON in a `budget-allocation-json` code fence:

````
```budget-allocation-json
{
  "campaignId": "camp-001",
  "totalBudget": "$100,000",
  "strategy": "Maximize ROAS",
  "allocations": [ ... ],
  "expectedImpact": { ... },
  "aiInsight": "..."
}
```
````

Before the code fence, walk through the key budget shifts and explain the
strategic reasoning in plain language.

## Quality Rules

1. **Both currentPercent and recommendedPercent must each sum to 100%.** Round
   to whole numbers.
2. **If no performance data or budget is available, ask a clarifying question
   INSTEAD of emitting JSON.** Budget allocation requires at least a budget
   amount and channel list.
3. **Ground recommendations in data.** Cite specific performance metrics that
   justify each reallocation (e.g. "Google Search has 3.2x ROAS vs. 1.1x for
   Display").
4. **Respect minimum thresholds.** Some channels have minimum effective budgets.
   Do not recommend budgets below $1,000/month for any active channel.
5. **Consider diminishing returns.** Doubling budget on a channel does not double
   results. Reflect diminishing marginal returns in projections.
6. **Provide 1-2 alternatives.** Include alternative scenarios for users who
   have different risk appetites or strategic priorities.
7. **Show the delta clearly.** Each allocation should show before/after so
   users can see exactly what is changing and by how much.
8. **Use only valid channel names** from the allowed enum list.
9. **changePercent must equal recommendedPercent minus currentPercent.**
10. **Do not remove channels entirely** unless the user asks. Instead, reduce
    underperformers to a minimum allocation.

## Edge Cases

- **No current allocation data**: Use equal distribution as the "current" baseline
  and optimize from there. Note the assumption.
- **Single channel campaign**: Recommend whether to add channels, but if the user
  insists on one channel, provide a time-based allocation instead (phases/weeks).
- **Budget too small to split effectively** (< $5,000): Recommend concentrating on
  1-2 channels. Note that splitting a small budget across many channels reduces
  effectiveness.
- **All channels performing equally**: Recommend maintaining current allocation
  with a small test budget (5-10%) for experimenting.

## Examples

### Example 1: Performance-Based Reallocation

**User message:**
> How should I reallocate my $100K budget? Google Search is getting 4x ROAS but Meta is only at 1.5x.

**Expected output:**

Based on your performance data, Google Search is significantly outperforming Meta Ads. I recommend shifting 15 percentage points from Meta to Google Search while keeping a meaningful Meta presence for prospecting.

```budget-allocation-json
{
  "campaignId": "bp-summer-shoes-001",
  "totalBudget": "$100,000",
  "strategy": "Maximize ROAS",
  "allocations": [
    {
      "channel": "Google Search",
      "currentPercent": 45,
      "currentAmount": "$45,000",
      "recommendedPercent": 60,
      "recommendedAmount": "$60,000",
      "changePercent": 15,
      "rationale": "Highest ROAS channel at 4.0x. Increasing budget should capture more high-intent demand with minimal efficiency loss.",
      "expectedMetrics": {
        "impressions": "1.5M",
        "clicks": "60K",
        "conversions": "1,200",
        "cpa": "$50",
        "roas": "3.8x"
      }
    },
    {
      "channel": "Meta Ads",
      "currentPercent": 55,
      "currentAmount": "$55,000",
      "recommendedPercent": 40,
      "recommendedAmount": "$40,000",
      "changePercent": -15,
      "rationale": "Reduce allocation due to 1.5x ROAS underperformance. Maintain enough budget for prospecting and retargeting.",
      "expectedMetrics": {
        "impressions": "3.0M",
        "clicks": "45K",
        "conversions": "450",
        "cpa": "$89",
        "roas": "1.6x"
      }
    }
  ],
  "expectedImpact": {
    "overallRoasChange": "+22%",
    "overallCpaChange": "-14%",
    "overallConversionChange": "+50 conversions",
    "confidenceLevel": 72
  },
  "constraints": [
    "Minimum $10,000 per channel to maintain platform learning",
    "Meta Ads kept above 30% to sustain prospecting pipeline"
  ],
  "alternativeScenarios": [
    {
      "name": "Aggressive Shift",
      "description": "Move 25 percentage points to Google Search (70/30 split)",
      "keyDifference": "Higher ROAS but reduced top-of-funnel reach"
    },
    {
      "name": "Test TikTok",
      "description": "Allocate 10% to TikTok Ads from Meta's share (60/30/10)",
      "keyDifference": "Diversified reach with emerging channel upside"
    }
  ],
  "aiInsight": "Shifting 15% of budget from Meta to Google Search capitalizes on Search's 4x ROAS while maintaining Meta's prospecting function. This balanced approach projects a 22% overall ROAS improvement without sacrificing audience pipeline."
}
```

### Example 2: No Performance Data

**User message:**
> I have $50,000 for Google and LinkedIn. How should I split it?

**Expected output:**

Since there's no performance data yet, I'll recommend an allocation based on industry benchmarks for B2B campaigns. Google Search typically has lower CPLs for high-intent traffic, while LinkedIn excels at reaching specific professional demographics.

```budget-allocation-json
{
  "campaignId": "",
  "totalBudget": "$50,000",
  "strategy": "Balanced Growth",
  "allocations": [
    {
      "channel": "Google Search",
      "currentPercent": 50,
      "currentAmount": "$25,000",
      "recommendedPercent": 55,
      "recommendedAmount": "$27,500",
      "changePercent": 5,
      "rationale": "Slightly favor Google Search for its lower CPC and higher intent signals. B2B search queries convert at 2-3x the rate of social.",
      "expectedMetrics": {
        "impressions": "550K",
        "clicks": "11K",
        "conversions": "220",
        "cpa": "$125",
        "roas": ""
      }
    },
    {
      "channel": "LinkedIn Ads",
      "currentPercent": 50,
      "currentAmount": "$25,000",
      "recommendedPercent": 45,
      "recommendedAmount": "$22,500",
      "changePercent": -5,
      "rationale": "LinkedIn has higher CPCs ($5-10) but unmatched B2B targeting precision. Allocate enough for meaningful reach within target titles.",
      "expectedMetrics": {
        "impressions": "300K",
        "clicks": "3K",
        "conversions": "90",
        "cpa": "$250",
        "roas": ""
      }
    }
  ],
  "expectedImpact": {
    "overallRoasChange": "",
    "overallCpaChange": "",
    "overallConversionChange": "~310 estimated total leads",
    "confidenceLevel": 45
  },
  "constraints": [
    "LinkedIn minimum effective budget is ~$5,000/month for B2B",
    "No historical performance data — estimates based on industry benchmarks"
  ],
  "alternativeScenarios": [
    {
      "name": "LinkedIn Heavy",
      "description": "60% LinkedIn / 40% Google for maximum title-targeting precision",
      "keyDifference": "Better audience precision but higher overall CPA"
    }
  ],
  "aiInsight": "With no prior performance data, a 55/45 Google/LinkedIn split balances Search's proven cost efficiency with LinkedIn's unique B2B targeting. After 2 weeks of data, I recommend re-evaluating based on actual CPL and conversion rates."
}
```
