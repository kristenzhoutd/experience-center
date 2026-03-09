---
name: recommend-ab-tests
description: >
  Generates A/B test hypotheses and experiment designs based on campaign performance
  data. Returns structured test recommendations with variants, expected lift,
  sample size requirements, and success criteria.
---

# Recommend A/B Tests Skill

## When to Use

Activate this skill when the user wants ideas for experiments to improve campaign
performance. Trigger phrases include but are not limited to:

- "Suggest A/B tests"
- "What should I test?"
- "Recommend experiments"
- "How can I improve performance through testing?"
- "Generate test hypotheses"
- "What experiments would help this campaign?"
- "Help me set up a test"
- Any request for testing ideas, experiment design, or hypothesis generation.

## Input Context

You will receive:
- Campaign performance data (by channel, audience, creative)
- Campaign configuration and brief
- Optional: past test results
- Optional: specific areas the user wants to test

## Output Schema

Return an array of A/B test recommendations:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "recommendations": [
    {
      "id": "string — unique test ID (e.g. test-001)",
      "priority": "number — 1 is highest priority",
      "testType": "string — Creative | Audience | Bidding | Landing Page | Budget | Channel | Messaging | Targeting",
      "channel": "string — which channel this test applies to, or 'Cross-Channel'",
      "hypothesis": "string — clear hypothesis statement (If we X, then Y, because Z)",
      "rationale": "string — data-driven reason for proposing this test",
      "variants": [
        {
          "name": "string — variant name (e.g. Control, Variant A)",
          "description": "string — what makes this variant different",
          "isControl": "boolean — true for the control variant"
        }
      ],
      "primaryMetric": "string — the key metric to measure (e.g. CTR, CPA, ROAS)",
      "secondaryMetrics": ["string — supporting metrics to track"],
      "expectedLift": "string — estimated improvement (e.g. +10-15% CTR)",
      "confidenceToDetect": "string — statistical power and minimum sample size needed",
      "estimatedDuration": "string — how long the test needs to run (e.g. 7-14 days)",
      "riskLevel": "string — Low | Medium | High",
      "implementationNotes": "string — practical steps to set up the test"
    }
  ],
  "testingStrategy": "string — 2-3 sentence overall testing strategy recommendation",
  "sequencing": "string — recommended order to run tests and why"
}
```

## Output Format

Wrap the JSON in an `ab-tests-json` code fence:

````
```ab-tests-json
{
  "campaignId": "camp-001",
  "recommendations": [
    {
      "id": "test-001",
      "priority": 1,
      "testType": "Creative",
      "channel": "Meta Ads",
      "hypothesis": "If we replace static images with short-form video creatives, then CTR will increase by 15-20%, because video content consistently outperforms static on Meta for this audience demographic.",
      "expectedLift": "+15-20% CTR",
      "riskLevel": "Low"
    }
  ],
  "testingStrategy": "Focus on high-impact, low-risk creative tests first, then move to audience and bidding experiments in weeks 3-4."
}
```
````

Before the code fence, summarize the recommended testing roadmap and explain
which tests offer the highest expected impact.

## Quality Rules

1. **Prioritize by expected impact and effort.** High-impact, low-effort tests
   should be ranked first. Order the recommendations array by priority.
2. **Write clear hypotheses.** Use the "If X, then Y, because Z" format. Every
   hypothesis must be specific and falsifiable.
3. **Include a control variant.** Every test must have exactly one control
   variant marked with `isControl: true`.
4. **Be realistic about sample sizes.** Small-budget campaigns cannot run
   multiple complex tests simultaneously. Recommend sequential testing when
   budget or traffic is limited.
5. **Limit to 3-6 recommendations.** Too many test ideas dilute focus. Prioritize
   and suggest sequencing for the rest.
6. **Ground recommendations in data.** Each test should be motivated by a specific
   performance pattern or gap identified in the campaign data.
7. **Consider test interactions.** Flag when running two tests simultaneously
   could produce confounding results.
