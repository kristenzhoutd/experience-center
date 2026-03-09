---
name: forecast-campaign-performance
description: >
  Generates 7-day, 14-day, and 30-day performance forecasts for a campaign based on
  current performance data, historical trends, and industry benchmarks. Returns
  predictions with confidence intervals and AI insights.
---

# Forecast Campaign Performance Skill

## When to Use

Activate this skill when the user wants to predict future campaign performance.
Trigger phrases include but are not limited to:

- "Forecast this campaign"
- "What will performance look like next week?"
- "Predict my ROAS for the next 30 days"
- "Show me a performance forecast"
- "How will this campaign perform?"
- "Project the results forward"
- Any request for predictive analytics or performance projections.

## Input Context

You will receive:
- Current campaign performance metrics (impressions, clicks, conversions, spend, etc.)
- Campaign configuration (channels, audiences, budget, timeline)
- Optional: historical performance data from similar campaigns
- Optional: seasonality or market context

## Output Schema

Return a forecast object with multi-horizon predictions:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "generatedAt": "string — ISO datetime of forecast generation",
  "currentPerformance": {
    "spend": "number — current total spend",
    "impressions": "number — current total impressions",
    "clicks": "number — current total clicks",
    "conversions": "number — current total conversions",
    "ctr": "number — current CTR as decimal",
    "cpa": "number — current CPA",
    "roas": "number — current ROAS"
  },
  "predictions": [
    {
      "horizon": "string — 7d | 14d | 30d",
      "metrics": {
        "spend": { "low": "number", "mid": "number", "high": "number" },
        "impressions": { "low": "number", "mid": "number", "high": "number" },
        "clicks": { "low": "number", "mid": "number", "high": "number" },
        "conversions": { "low": "number", "mid": "number", "high": "number" },
        "ctr": { "low": "number", "mid": "number", "high": "number" },
        "cpa": { "low": "number", "mid": "number", "high": "number" },
        "roas": { "low": "number", "mid": "number", "high": "number" }
      },
      "confidence": "number — 0-100 confidence in this horizon's prediction"
    }
  ],
  "trend": "string — Improving | Stable | Declining | Volatile",
  "trendFactors": ["string — key factors influencing the trend"],
  "aiInsight": "string — 2-3 sentence strategic insight about the forecast",
  "risks": [
    {
      "factor": "string — risk factor name",
      "likelihood": "string — Low | Medium | High",
      "impact": "string — description of potential impact",
      "mitigation": "string — suggested mitigation action"
    }
  ]
}
```

## Output Format

Wrap the JSON in a `forecast-json` code fence:

````
```forecast-json
{
  "campaignId": "camp-001",
  "generatedAt": "2026-02-18T14:30:00Z",
  "currentPerformance": { ... },
  "predictions": [ ... ],
  "trend": "Improving",
  "aiInsight": "Campaign is trending upward with CTR improving 12% week-over-week. The 14-day forecast shows strong ROAS potential if current creative performance holds."
}
```
````

Before the code fence, provide a narrative summary of the forecast including
key takeaways and recommended actions.

## Quality Rules

1. **Use three confidence levels.** Low, mid, and high values represent the
   pessimistic, expected, and optimistic scenarios respectively.
2. **Decrease confidence with longer horizons.** 7-day forecasts should have
   higher confidence than 30-day forecasts. Reflect this in the scores.
3. **Base predictions on available data.** If only a few days of data exist,
   lower confidence scores and widen the prediction range.
4. **Account for known factors.** Weekends, holidays, and seasonal patterns
   should be factored into daily-level projections.
5. **Include risk factors.** Identify 2-4 specific risks that could cause
   actual performance to deviate from the forecast.
6. **Metrics must be internally consistent.** CTR should equal clicks/impressions,
   CPA should equal spend/conversions, etc.
