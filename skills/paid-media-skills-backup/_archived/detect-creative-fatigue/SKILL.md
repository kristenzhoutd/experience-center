---
name: detect-creative-fatigue
description: >
  Analyzes ad creative performance over time to detect fatigue signals. Scores each
  creative 0-100 on fatigue level and provides trend analysis, suggested actions,
  and refresh recommendations.
---

# Detect Creative Fatigue Skill

## When to Use

Activate this skill when the user wants to assess whether their ad creatives are
losing effectiveness. Trigger phrases include but are not limited to:

- "Check for creative fatigue"
- "Are my ads getting stale?"
- "Detect ad fatigue"
- "Which creatives need refreshing?"
- "Is my CTR dropping because of fatigue?"
- "Creative performance analysis"
- "When should I refresh my ads?"
- Any concern about declining creative performance or ad frequency impact.

## Input Context

You will receive:
- Creative-level performance data over time (impressions, clicks, CTR, conversions,
  frequency, cost per result)
- Campaign configuration and targeting details
- Optional: creative asset metadata (format, age, messaging themes)
- Optional: historical refresh cadence data

## Output Schema

Return a creative fatigue analysis with per-creative scores:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "analyzedPeriod": {
    "start": "string — ISO date",
    "end": "string — ISO date"
  },
  "overallFatigueLevel": "string — Fresh | Mild | Moderate | Severe | Critical",
  "results": [
    {
      "creativeId": "string — creative or ad ID",
      "creativeName": "string — creative display name",
      "channel": "string — channel where this creative runs",
      "format": "string — ad format (e.g. Image, Video, Carousel, RSA)",
      "fatigueScore": "number — 0-100 where 100 is completely fatigued",
      "trend": "string — Stable | Increasing | Accelerating | Plateaued",
      "daysActive": "number — how long this creative has been running",
      "currentFrequency": "number — average frequency per user",
      "metrics": {
        "ctrCurrent": "number — current CTR",
        "ctrPeak": "number — peak CTR during this creative's run",
        "ctrDecline": "number — percentage decline from peak",
        "conversionRateCurrent": "number — current conversion rate",
        "conversionRatePeak": "number — peak conversion rate",
        "conversionRateDecline": "number — percentage decline from peak"
      },
      "suggestedAction": "string — Keep | Monitor | Refresh Soon | Replace Immediately",
      "recommendation": "string — specific recommendation for this creative"
    }
  ],
  "refreshPlan": {
    "immediateRefresh": ["string — creative IDs needing immediate replacement"],
    "scheduledRefresh": [
      {
        "creativeId": "string — creative ID",
        "suggestedRefreshDate": "string — ISO date",
        "reason": "string — why this date"
      }
    ],
    "suggestions": ["string — creative refresh ideas based on performance patterns"]
  },
  "aiInsight": "string — 2-3 sentence strategic summary of creative health"
}
```

## Output Format

Wrap the JSON in a `creative-fatigue-json` code fence:

````
```creative-fatigue-json
{
  "campaignId": "camp-001",
  "overallFatigueLevel": "Moderate",
  "results": [
    {
      "creativeId": "cr-001",
      "creativeName": "Summer Sale Hero Banner",
      "fatigueScore": 72,
      "trend": "Accelerating",
      "suggestedAction": "Refresh Soon",
      "recommendation": "CTR has declined 35% from peak. Consider new imagery while retaining the offer messaging that performed well."
    }
  ],
  "aiInsight": "Two of five creatives show moderate to severe fatigue. Prioritize refreshing display and social creatives where frequency exceeds 4x."
}
```
````

Before the code fence, summarize the overall creative health and highlight
which creatives need immediate attention.

## Quality Rules

1. **Score fatigue consistently.** 0-20: Fresh, 21-40: Mild, 41-60: Moderate,
   61-80: Severe, 81-100: Critical. Scores should correlate with CTR/conversion
   rate decline from peak.
2. **Consider frequency as a primary signal.** High frequency (>5x) combined
   with declining CTR is the strongest fatigue indicator.
3. **Account for creative age.** Newer creatives with declining performance may
   have targeting issues, not fatigue. Flag this distinction.
4. **Provide specific refresh suggestions.** Instead of "refresh this creative",
   suggest what to change (new imagery, different messaging angle, updated offer).
5. **Differentiate by format.** Video creatives fatigue differently than static
   images. Search ads fatigue slower than display ads. Reflect this in scoring.
6. **Include a refresh plan.** Prioritize which creatives to replace first and
   suggest a staggered refresh schedule to maintain performance continuity.
