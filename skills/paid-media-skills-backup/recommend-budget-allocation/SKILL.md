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
- Any request for budget optimization, reallocation, or distribution strategy.

## Input Context

You will receive:
- Current budget allocation and spend data by channel
- Campaign performance metrics by channel
- Campaign brief with objectives and KPIs
- Optional: historical performance data
- Optional: budget constraints or minimums per channel

## Output Schema

Return a budget allocation recommendation with impact projections:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "totalBudget": "string — total budget being allocated",
  "strategy": "string — Maximize ROAS | Maximize Reach | Balanced Growth | Minimize CPA",
  "allocations": [
    {
      "channel": "string — channel name",
      "currentPercent": "number — current allocation percentage",
      "currentAmount": "string — current dollar amount",
      "recommendedPercent": "number — recommended allocation percentage",
      "recommendedAmount": "string — recommended dollar amount",
      "changePercent": "number — percentage point change (positive = increase)",
      "rationale": "string — why this change is recommended",
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
    "overallRoasChange": "string — projected ROAS change (e.g. +15%)",
    "overallCpaChange": "string — projected CPA change (e.g. -12%)",
    "overallConversionChange": "string — projected conversion volume change",
    "confidenceLevel": "number — 0-100 confidence in projections"
  },
  "constraints": ["string — any constraints considered (e.g. minimum spend thresholds, platform minimums)"],
  "alternativeScenarios": [
    {
      "name": "string — scenario name",
      "description": "string — brief description",
      "keyDifference": "string — how it differs from primary recommendation"
    }
  ],
  "aiInsight": "string — 2-3 sentence strategic rationale for the recommended allocation"
}
```

## Output Format

Wrap the JSON in a `budget-allocation-json` code fence:

````
```budget-allocation-json
{
  "campaignId": "camp-001",
  "totalBudget": "$100,000",
  "strategy": "Maximize ROAS",
  "allocations": [ ... ],
  "expectedImpact": {
    "overallRoasChange": "+22%",
    "overallCpaChange": "-18%",
    "overallConversionChange": "+35 conversions",
    "confidenceLevel": 75
  },
  "aiInsight": "Shifting 15% of Display budget to Google Search and 10% to Meta Retargeting is projected to improve overall ROAS by 22%, based on the strong efficiency of these channels in the current campaign."
}
```
````

Before the code fence, walk through the key budget shifts and explain the
strategic reasoning in plain language.

## Quality Rules

1. **Allocation percentages must sum to 100%.** Validate that both current and
   recommended allocations total 100%.
2. **Ground recommendations in data.** Cite specific performance metrics that
   justify each reallocation (e.g. "Google Search has 3.2x ROAS vs. 1.1x for Display").
3. **Respect minimum thresholds.** Some channels have minimum effective budgets.
   Do not recommend budgets below platform minimums or learning thresholds.
4. **Consider diminishing returns.** Doubling budget on a channel does not double
   results. Reflect diminishing marginal returns in projections.
5. **Provide alternatives.** Include 1-2 alternative scenarios for users who
   have different risk appetites or strategic priorities.
6. **Show the delta clearly.** Each allocation should show the before/after so
   users can see exactly what is changing and by how much.
