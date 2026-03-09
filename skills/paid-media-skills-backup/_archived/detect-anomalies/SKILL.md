---
name: detect-anomalies
description: >
  Performs statistical anomaly detection across campaign metrics. Identifies unusual
  spikes, drops, or deviations from expected performance and generates alerts with
  severity levels and actionable recommendations.
---

# Detect Anomalies Skill

## When to Use

Activate this skill when the user wants to identify unusual patterns or performance
deviations in their campaign data. Trigger phrases include but are not limited to:

- "Check for anomalies"
- "Anything unusual in my campaign?"
- "Detect performance issues"
- "Are there any red flags?"
- "Scan for problems"
- "Why did my CPA spike?"
- "Something looks off with my metrics"
- Any request for automated monitoring, anomaly detection, or health checks.

## Input Context

You will receive:
- Campaign performance metrics over time (daily or hourly data)
- Campaign configuration (channels, budget, targeting)
- Optional: historical baseline metrics for comparison
- Optional: expected performance thresholds

## Output Schema

Return an anomaly detection report with prioritized alerts:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "analyzedPeriod": {
    "start": "string — ISO date",
    "end": "string — ISO date"
  },
  "totalAnomalies": "number — count of detected anomalies",
  "overallHealth": "string — Healthy | Attention Needed | Warning | Critical",
  "alerts": [
    {
      "id": "string — unique alert ID",
      "severity": "string — critical | warning | info",
      "type": "string — Spike | Drop | Trend Shift | Budget Deviation | Pacing Issue | Quality Score Change",
      "metric": "string — affected metric name (e.g. CPA, CTR, Spend)",
      "channel": "string — affected channel or 'All Channels'",
      "currentValue": "number — current metric value",
      "expectedValue": "number — expected metric value based on baseline",
      "deviation": "number — percentage deviation from expected",
      "direction": "string — Up | Down",
      "detectedAt": "string — ISO datetime when anomaly was first detected",
      "description": "string — human-readable description of the anomaly",
      "possibleCauses": ["string — potential root causes"],
      "aiRecommendation": "string — specific action to take"
    }
  ],
  "summary": "string — 2-3 sentence overview of findings"
}
```

## Output Format

Wrap the JSON in an `anomalies-json` code fence:

````
```anomalies-json
{
  "campaignId": "camp-001",
  "totalAnomalies": 3,
  "overallHealth": "Warning",
  "alerts": [
    {
      "id": "anomaly-001",
      "severity": "critical",
      "type": "Spike",
      "metric": "CPA",
      "channel": "Google Search",
      "currentValue": 45.20,
      "expectedValue": 28.50,
      "deviation": 58.6,
      "direction": "Up",
      "description": "CPA on Google Search has spiked 58.6% above the 7-day average.",
      "possibleCauses": ["Increased competition on target keywords", "Quality Score degradation", "Landing page issues"],
      "aiRecommendation": "Review search term report for irrelevant queries and add negative keywords. Check Quality Score trends for top keywords."
    }
  ],
  "summary": "One critical anomaly detected: CPA spike on Google Search requires immediate attention."
}
```
````

Before the code fence, highlight the most urgent findings and recommended
immediate actions.

## Quality Rules

1. **Prioritize by severity.** Critical alerts appear first. Use severity levels
   consistently: critical (>50% deviation), warning (25-50%), info (<25%).
2. **Provide context, not just numbers.** Each alert should explain what happened,
   why it might have happened, and what to do about it.
3. **Avoid false positives.** Small fluctuations within normal variance should not
   be flagged. Use statistical thresholds (e.g. 2+ standard deviations) as guidance.
4. **Include possible causes.** List 2-3 plausible root causes for each anomaly,
   ordered by likelihood.
5. **Make recommendations actionable.** "Investigate further" is not actionable.
   "Add negative keywords from the search term report" is actionable.
6. **Consider cross-metric correlations.** A CPA spike combined with a CTR drop
   suggests different causes than a CPA spike with stable CTR.
