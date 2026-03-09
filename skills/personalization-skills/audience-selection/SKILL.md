---
name: audience-selection
description: >
  Suggests audience segments for a campaign based on the brief context and
  available TDX segments. Recommends which existing segments to select and
  proposes new segments when no match exists. Returns structured JSON.
---

# Audience Selection Skill

## When to Use

Activate this skill when the user asks about audience segments during Step 2 of the
Campaign Configuration Wizard. Trigger phrases include:

- "Suggest segments for cart abandoners"
- "Add a high-value customer segment"
- "What audiences should I target?"
- "Which existing segments should I use?"
- "Recommend segments from the list"
- Any request to add, modify, or suggest audience segments

## Input Context

You will receive:
- The original brief audience data (target audiences and goals)
- The list of available existing TDX child segments under the selected parent segment
- Currently selected segments
- The user's request

## Behavior

1. **Recommend existing segments first** — Match the brief's audience goals against the
   available TDX child segments. Suggest selecting existing segments that align with the
   campaign objectives.
2. **Propose new segments only when needed** — If the brief describes an audience that
   doesn't match any existing segment, suggest creating a new one with clear targeting rules.
3. **Explain your reasoning** — For each recommendation, briefly explain why the segment
   fits the campaign goals.

## Output Schema

Return an array of segment objects:

```jsonc
[
  {
    "id": "string — segment ID (use existing segment name for TDX matches, or 'seg-suggested-N' for new)",
    "name": "string — segment display name",
    "parentSegmentId": "string — parent segment name",
    "description": "string — why this segment fits the campaign",
    "isNew": false,
    "isSelected": true,
    "source": "tdx | brief"
  }
]
```

- Set `source: "tdx"` and `isNew: false` for existing segments being recommended
- Set `source: "brief"` and `isNew: true` for new segments that don't exist yet

## Output Format

Wrap the JSON in an `audience-selection-json` code fence:

````
```audience-selection-json
[
  {
    "id": "High Value Cart Abandoners",
    "name": "High Value Cart Abandoners",
    "parentSegmentId": "Active Shoppers",
    "description": "Matches the brief's goal of re-engaging users who abandoned high-value carts",
    "isNew": false,
    "isSelected": true,
    "source": "tdx"
  },
  {
    "id": "seg-suggested-1",
    "name": "First-Time Visitors with High Intent",
    "parentSegmentId": "Active Shoppers",
    "description": "No existing segment covers first-time visitors showing purchase intent signals",
    "isNew": true,
    "isSelected": true,
    "source": "brief"
  }
]
```
````

## Quality Rules

1. Prioritize recommending existing TDX segments over creating new ones
2. Each segment must have a clear description explaining why it fits the campaign
3. Use the existing segment name as the `id` for TDX segments
4. Use "seg-suggested-N" as the `id` prefix for new segments
5. Set `isNew: false` for existing segments, `isNew: true` for new suggestions
6. Consider the campaign objective and goals when recommending segments
7. Avoid recommending segments that are already selected
