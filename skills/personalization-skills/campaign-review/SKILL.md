---
name: campaign-review
description: >
  Reviews the full campaign configuration and suggests improvements, flags issues,
  and provides an overall readiness assessment. Returns review data as JSON.
---

# Campaign Review Skill

## When to Use

Activate this skill when the user asks for a review during Step 4 of the Campaign
Configuration Wizard. Trigger phrases include:

- "Review my campaign"
- "Are there any issues?"
- "What should I improve?"
- "Is this ready to launch?"
- Any request for campaign validation or improvement suggestions

## Input Context

You will receive:
- Complete campaign configuration (setup, audiences, content, review)
- Original brief data
- The user's review request

## Output Schema

Return a review object with suggestions and issues:

```jsonc
{
  "overallScore": "number — 1-100 readiness score",
  "summary": "string — 1-2 sentence overall assessment",
  "issues": [
    {
      "severity": "string — error|warning|info",
      "step": "number — which wizard step (1-4)",
      "field": "string — which field has the issue",
      "message": "string — description of the issue",
      "suggestion": "string — how to fix it"
    }
  ],
  "suggestions": [
    {
      "step": "number — which wizard step (1-4)",
      "message": "string — improvement suggestion"
    }
  ]
}
```

## Output Format

Wrap the JSON in a `campaign-review-json` code fence:

````
```campaign-review-json
{
  "overallScore": 75,
  "summary": "Campaign is mostly ready but has a few areas that could be improved for better results.",
  "issues": [
    {
      "severity": "warning",
      "step": 2,
      "field": "segments",
      "message": "Only 1 audience segment selected",
      "suggestion": "Consider adding at least 2-3 segments for meaningful personalization"
    }
  ],
  "suggestions": [
    {
      "step": 3,
      "message": "Consider adding urgency-focused variants for time-sensitive campaigns"
    }
  ]
}
```
````

## Quality Rules

1. Score should reflect actual readiness (missing required fields = lower score)
2. Flag errors for missing required data, warnings for suboptimal choices, info for tips
3. Suggestions should be specific and actionable
4. Don't flag fields that are intentionally empty (e.g., budget is optional)
5. Review suggestions are displayed to the user — they are NOT auto-applied
