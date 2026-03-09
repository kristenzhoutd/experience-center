---
name: analyze-segment-overlap
description: >
  Detects audience overlap between selected campaign segments. Identifies shared
  users across segments and recommends strategies to reduce wasted spend from
  duplicate targeting.
---

# Analyze Segment Overlap Skill

## When to Use

Activate this skill when the user wants to understand how their selected audience
segments overlap. Trigger phrases include but are not limited to:

- "Check for audience overlap"
- "Are my segments overlapping?"
- "Detect duplicate audiences"
- "How much overlap is there between these segments?"
- "Will I be bidding against myself?"
- "Analyze my audience segments for conflicts"
- Any concern about targeting the same users across multiple segments or campaigns.

## Input Context

You will receive:
- The list of selected audience segments with IDs, names, and sizes
- The campaign brief for context on targeting strategy
- Optional: blueprint channel assignments per segment
- Optional: historical overlap data from CDP

## Output Schema

Return an overlap analysis with pairwise comparisons and recommendations:

```jsonc
{
  "totalSegments": "number — count of segments analyzed",
  "overallOverlapPercent": "number — weighted average overlap across all pairs",
  "riskLevel": "string — Low | Medium | High | Critical",
  "pairwiseOverlaps": [
    {
      "segmentA": {
        "id": "string — segment ID",
        "name": "string — segment name",
        "size": "number — audience size"
      },
      "segmentB": {
        "id": "string — segment ID",
        "name": "string — segment name",
        "size": "number — audience size"
      },
      "overlapSize": "number — estimated shared users",
      "overlapPercent": "number — overlap as percentage of smaller segment",
      "severity": "string — Low | Medium | High",
      "recommendation": "string — how to handle this overlap"
    }
  ],
  "recommendations": [
    {
      "type": "string — Exclude | Merge | Prioritize | Split",
      "description": "string — actionable recommendation",
      "impactedSegments": ["string — segment IDs affected"],
      "estimatedSavings": "string — estimated budget saved by resolving"
    }
  ],
  "aiInsight": "string — strategic summary of overlap implications"
}
```

## Output Format

Wrap the JSON in a `segment-overlap-json` code fence:

````
```segment-overlap-json
{
  "totalSegments": 4,
  "overallOverlapPercent": 23,
  "riskLevel": "Medium",
  "pairwiseOverlaps": [ ... ],
  "recommendations": [ ... ],
  "aiInsight": "Two segment pairs show significant overlap that could lead to 15-20% wasted ad spend from duplicate impressions."
}
```
````

Before the code fence, explain the overlap findings in plain language and
highlight the most critical areas to address.

## Quality Rules

1. **Analyze all pairwise combinations.** For N segments, produce N*(N-1)/2
   overlap pairs. Sort by overlap severity (highest first).
2. **Be realistic about estimates.** If exact overlap data is not available,
   use demographic and behavioral overlap heuristics and clearly state that
   numbers are estimates.
3. **Provide actionable recommendations.** Each overlap should have a clear
   mitigation strategy — exclusion lists, segment merging, or priority rules.
4. **Quantify impact.** Estimate budget waste from overlap where possible.
   This helps users prioritize which overlaps to address.
5. **Consider channel-level overlap.** Overlap on the same channel is more
   costly than overlap across different channels. Flag same-channel conflicts
   with higher severity.
