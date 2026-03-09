---
name: generate-optimization-actions
description: >
  Analyzes campaign performance data and generates specific, actionable optimization
  recommendations. Each action includes type, risk level, expected impact, confidence
  score, and step-by-step implementation guidance.
---

# Generate Optimization Actions Skill

## When to Use

Activate this skill when the user wants concrete actions to improve their campaign
performance. Trigger phrases include but are not limited to:

- "How can I optimize this campaign?"
- "Give me optimization recommendations"
- "What actions should I take?"
- "Improve my campaign performance"
- "What would you change?"
- "Suggest improvements"
- "Help me get better results"
- Any request for performance improvement advice or tactical recommendations.

## Input Context

You will receive:
- Campaign performance data by channel, audience, and creative
- Campaign configuration and brief
- Current optimization status and history
- Optional: performance benchmarks
- Optional: anomaly or fatigue detection results

## Output Schema

Return a prioritized list of optimization actions:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "analyzedAt": "string — ISO datetime",
  "overallAssessment": "string — 1-2 sentence performance summary",
  "actions": [
    {
      "id": "string — unique action ID (e.g. opt-001)",
      "priority": "number — 1 is highest priority",
      "type": "string — Budget | Bidding | Targeting | Creative | Channel | Audience | Keyword | Placement | Schedule | Landing Page",
      "channel": "string — affected channel or 'All Channels'",
      "title": "string — concise action title (e.g. Increase Search budget by 20%)",
      "reason": "string — data-driven explanation of why this action is needed",
      "impact": "string — expected outcome (e.g. Estimated +15% conversions, -$3 CPA)",
      "confidence": "number — 0-100 confidence that this action will produce the expected impact",
      "risk": "string — Low | Medium | High",
      "effort": "string — Quick Win | Moderate | Significant",
      "steps": ["string — ordered implementation steps"],
      "metrics_to_watch": ["string — metrics to monitor after implementation"],
      "timeToImpact": "string — expected time for results (e.g. 3-5 days, 1-2 weeks)"
    }
  ],
  "quickWins": ["string — action IDs that can be implemented immediately"],
  "estimatedOverallImpact": {
    "roasChange": "string — projected overall ROAS change",
    "cpaChange": "string — projected overall CPA change",
    "conversionChange": "string — projected conversion volume change"
  },
  "aiInsight": "string — 2-3 sentence strategic recommendation tying the actions together"
}
```

## Output Format

Wrap the JSON in an `optimization-actions-json` code fence:

````
```optimization-actions-json
{
  "campaignId": "camp-001",
  "overallAssessment": "Campaign shows strong Search performance but underperforming Display and Social channels. Three quick wins could improve overall ROAS by 18%.",
  "actions": [
    {
      "id": "opt-001",
      "priority": 1,
      "type": "Keyword",
      "channel": "Google Search",
      "title": "Add 15 negative keywords from search term report",
      "reason": "Search term analysis shows 22% of spend going to irrelevant queries.",
      "impact": "Estimated -$2.50 CPA, +8% conversion rate",
      "confidence": 88,
      "risk": "Low",
      "effort": "Quick Win",
      "steps": ["Pull search term report for last 14 days", "Identify terms with >$50 spend and 0 conversions", "Add as negative keywords at campaign level"],
      "timeToImpact": "3-5 days"
    }
  ],
  "quickWins": ["opt-001"],
  "aiInsight": "The highest-impact opportunity is eliminating wasted Search spend through negative keywords, followed by reallocating underperforming Display budget to Meta retargeting."
}
```
````

Before the code fence, present the top 3 recommendations in plain language with
clear next steps.

## Quality Rules

1. **Prioritize by impact-to-effort ratio.** Quick wins with high impact should
   always rank first. Order the actions array by priority.
2. **Be specific and tactical.** "Improve targeting" is not actionable. "Add
   negative keywords: [list]" or "Exclude ages 18-24 on Meta" is actionable.
3. **Include implementation steps.** Each action must have 2-5 concrete steps
   that a media buyer could follow without further clarification.
4. **Ground every recommendation in data.** The `reason` field must reference
   specific metrics or patterns from the campaign data, not generic best practices.
5. **Assess risk honestly.** Actions that could temporarily hurt performance
   (e.g. pausing a high-spend ad group) should be marked Medium or High risk
   with appropriate caveats.
6. **Limit to 5-8 actions.** Too many recommendations overwhelm. Prioritize
   ruthlessly and focus on the most impactful moves.
7. **Tag quick wins explicitly.** Users want to know what they can do right now
   vs. what requires more planning.
