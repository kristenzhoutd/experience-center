---
name: benchmark-performance
description: >
  Compares campaign performance against industry benchmarks and peer averages.
  Returns percentile rankings, strengths, weaknesses, and improvement opportunities
  based on vertical and channel-specific data.
---

# Benchmark Performance Skill

## When to Use

Activate this skill when the user wants to understand how their campaign performance
compares to industry standards or competitors. Trigger phrases include but are not
limited to:

- "How does my campaign compare to benchmarks?"
- "Am I above or below average?"
- "Show me industry benchmarks"
- "Benchmark my performance"
- "Is my CTR good for this industry?"
- "How do I stack up against competitors?"
- "Compare to industry averages"
- Any request for competitive context or performance grading.

## Input Context

You will receive:
- Campaign performance metrics by channel
- Campaign configuration (industry/vertical, channels, campaign type)
- Optional: specific metrics the user wants benchmarked
- Optional: competitor or industry context

## Output Schema

Return a benchmark analysis with percentile rankings:

```jsonc
{
  "campaignId": "string — campaign identifier",
  "industry": "string — industry vertical used for benchmarking",
  "campaignType": "string — campaign type (e.g. Search, Display, Social)",
  "analyzedPeriod": {
    "start": "string — ISO date",
    "end": "string — ISO date"
  },
  "benchmarks": [
    {
      "channel": "string — channel name",
      "metrics": [
        {
          "name": "string — metric name (e.g. CTR, CPC, CPA, ROAS, Conversion Rate)",
          "yourValue": "number — campaign's actual value",
          "industryAverage": "number — industry average",
          "topQuartile": "number — 75th percentile value",
          "bottomQuartile": "number — 25th percentile value",
          "percentile": "number — campaign's percentile ranking (0-100)",
          "rating": "string — Excellent | Good | Average | Below Average | Poor",
          "trend": "string — Improving | Stable | Declining"
        }
      ]
    }
  ],
  "overallGrade": "string — A+ | A | B | C | D | F",
  "strengths": [
    {
      "metric": "string — metric name",
      "channel": "string — channel name",
      "finding": "string — what's going well and why"
    }
  ],
  "weaknesses": [
    {
      "metric": "string — metric name",
      "channel": "string — channel name",
      "finding": "string — what's underperforming",
      "improvementTarget": "string — specific target to aim for",
      "suggestion": "string — how to improve"
    }
  ],
  "aiSummary": "string — 2-3 sentence executive summary of benchmark performance"
}
```

## Output Format

Wrap the JSON in a `benchmark-json` code fence:

````
```benchmark-json
{
  "campaignId": "camp-001",
  "industry": "E-commerce",
  "overallGrade": "B+",
  "benchmarks": [ ... ],
  "strengths": [ ... ],
  "weaknesses": [ ... ],
  "aiSummary": "Campaign performs above average on Search (72nd percentile CTR) but below average on Display CPA (35th percentile). Focusing on display targeting refinement could move overall grade to A-."
}
```
````

Before the code fence, provide a clear, non-technical summary of where the
campaign excels and where it needs improvement.

## Quality Rules

1. **Use realistic benchmark data.** Base industry averages on well-known published
   benchmarks (Google Ads benchmarks, Meta averages, industry reports). Do not
   invent unrealistic numbers.
2. **Contextualize by industry and channel.** A 2% CTR is excellent for Display
   but below average for Search. Always benchmark within the correct context.
3. **Grade consistently.** Percentile ratings should follow: 90+: Excellent,
   70-89: Good, 40-69: Average, 20-39: Below Average, <20: Poor.
4. **Balance strengths and weaknesses.** Highlight what's working (to reinforce)
   as well as what needs improvement (to fix). Most campaigns have both.
5. **Make improvement targets specific.** Instead of "improve CTR", write
   "Increase Search CTR from 3.2% to 4.5% (industry top quartile)".
6. **Account for campaign maturity.** New campaigns may underperform benchmarks
   during learning phases — note this when relevant.
