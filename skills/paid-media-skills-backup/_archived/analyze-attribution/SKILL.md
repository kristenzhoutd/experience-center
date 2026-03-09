---
name: analyze-attribution
description: >
  Runs campaign performance through six attribution models (Last Click, First Click,
  Linear, Time Decay, Position Based, Data-Driven) and returns per-channel credit
  allocation with comparative insights.
---

# Analyze Attribution Skill

## When to Use

Activate this skill when the user wants to understand how credit for conversions
should be distributed across channels and touchpoints. Trigger phrases include
but are not limited to:

- "Run attribution analysis"
- "Show me attribution models"
- "How should I attribute conversions?"
- "Which channel is actually driving results?"
- "Compare attribution models"
- "Last click vs. data-driven attribution"
- "What's the real value of my display ads?"
- Any question about channel contribution, conversion paths, or attribution methodology.

## Input Context

You will receive:
- Campaign performance data by channel (impressions, clicks, conversions, spend)
- Conversion path data if available (touchpoint sequences)
- Campaign configuration (channels, budget allocation)
- Optional: existing attribution settings or preferred model

## Output Schema

Return an attribution analysis with all six models compared:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "totalConversions": "number — total conversions being attributed",
  "totalRevenue": "number — total revenue being attributed",
  "analyzedPeriod": {
    "start": "string — ISO date",
    "end": "string — ISO date"
  },
  "channels": [
    {
      "name": "string — channel name",
      "spend": "number — total channel spend",
      "rawConversions": "number — platform-reported conversions",
      "attribution": {
        "lastClick": {
          "conversions": "number",
          "percentage": "number — share of total conversions",
          "roas": "number"
        },
        "firstClick": {
          "conversions": "number",
          "percentage": "number",
          "roas": "number"
        },
        "linear": {
          "conversions": "number",
          "percentage": "number",
          "roas": "number"
        },
        "timeDecay": {
          "conversions": "number",
          "percentage": "number",
          "roas": "number"
        },
        "positionBased": {
          "conversions": "number",
          "percentage": "number",
          "roas": "number"
        },
        "dataDriven": {
          "conversions": "number",
          "percentage": "number",
          "roas": "number"
        }
      },
      "insight": "string — channel-specific insight based on model comparison"
    }
  ],
  "modelComparison": {
    "recommendedModel": "string — which model best fits this campaign",
    "reasoning": "string — why this model is recommended",
    "keyDifferences": ["string — notable differences between models"]
  },
  "insights": [
    {
      "type": "string — Undervalued Channel | Overvalued Channel | Assist Role | Converter Role",
      "channel": "string — channel name",
      "finding": "string — specific insight",
      "recommendation": "string — budget or strategy recommendation"
    }
  ],
  "aiSummary": "string — 2-3 sentence executive summary of attribution findings"
}
```

## Output Format

Wrap the JSON in an `attribution-json` code fence:

````
```attribution-json
{
  "campaignId": "camp-001",
  "totalConversions": 1250,
  "channels": [ ... ],
  "modelComparison": {
    "recommendedModel": "Position Based",
    "reasoning": "This campaign has a clear awareness-to-conversion funnel where both first and last touchpoints play critical roles."
  },
  "aiSummary": "Display advertising is significantly undervalued by Last Click, receiving only 5% of credit vs. 18% under Position Based. Consider increasing display budget by 20%."
}
```
````

Before the code fence, explain the attribution findings in accessible language,
focusing on the strategic implications for budget allocation.

## Quality Rules

1. **Conversions must sum consistently.** Total attributed conversions across
   channels should equal the total for each model (allowing for fractional rounding).
2. **Explain model differences in plain language.** Not all users understand
   attribution methodology. Provide brief model descriptions when helpful.
3. **Highlight undervalued channels.** The biggest value of multi-model attribution
   is revealing channels that Last Click undervalues (typically upper-funnel channels).
4. **Make budget recommendations.** Connect attribution insights to specific
   budget reallocation suggestions.
5. **Be transparent about data limitations.** If conversion path data is incomplete,
   note which models are less reliable and lower confidence.
6. **Position Based should use 40/20/40.** First touch 40%, middle touches 20%
   (split evenly), last touch 40%. This is the standard convention.
