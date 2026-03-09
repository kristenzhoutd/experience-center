---
name: campaign-setup
description: >
  Updates campaign setup fields (name, objective, goal, KPI, dates) based on
  user input. Returns partial JSON updates for merging into the wizard form.
---

# Campaign Setup Skill

## When to Use

Activate this skill when the user is on the Campaign Setup page (Step 1) and
asks to create, refine, or change any campaign setup field. The page context
`[page-context:campaign-setup]` will be present in every message from this page.

## Input Context

You will receive:
- `<current-setup>` — JSON of the current field values (name, objective, businessGoal, goalType, startDate, endDate, primaryKpi, secondaryKpis)
- The user's message describing what they want to create or change

## Behavior Rules

1. **Clarify before changing**: If the user's request is ambiguous or could be interpreted multiple ways, ask a clarifying question INSTEAD of emitting JSON. For example:
   - "Make it better" → Ask: "Which aspect would you like to improve — the objective, business goal, or KPIs?"
   - "Update the dates" → Ask: "What start and end dates would you like?"

2. **Full campaign creation**: When the user describes a new campaign (e.g. "create a 2026 sneaker campaign for Nike"), populate ALL fields with sensible values derived from the request.

3. **Targeted edits**: When the user asks to change specific fields (e.g. "change the goal to retention"), only include those fields in the output. Preserve all other fields by omitting them.

4. **Awareness of current values**: Always check `<current-setup>` before responding. If a field already has a good value and the user didn't ask to change it, don't include it in the output.

## Output Schema

Return a JSON object with **only the fields that should be updated**. Omit fields
that should remain unchanged.

```jsonc
{
  "name": "string — campaign name (optional)",
  "objective": "string — campaign objective (optional)",
  "businessGoal": "string — business goal (optional)",
  "goalType": "conversion|engagement|retention|revenue|awareness (optional)",
  "startDate": "YYYY-MM-DD (optional)",
  "endDate": "YYYY-MM-DD (optional)",
  "primaryKpi": "string — primary KPI metric (optional)",
  "secondaryKpis": ["string array — secondary KPIs (optional)"]
}
```

## Output Format

Wrap the JSON in a `campaign-setup-json` code fence:

````
```campaign-setup-json
{
  "name": "Nike Air Max 2026 Launch Campaign",
  "objective": "Drive awareness and pre-orders for the Nike Air Max 2026 line among sneaker enthusiasts aged 18-35",
  "businessGoal": "Increase pre-order conversion rate by 25%",
  "goalType": "conversion",
  "startDate": "2026-03-01",
  "endDate": "2026-04-30",
  "primaryKpi": "Pre-order conversion rate",
  "secondaryKpis": ["Page views", "Add-to-cart rate", "Email sign-ups"]
}
```
````

## Quality Rules

1. Only include fields that are being changed
2. Keep objectives specific and measurable
3. Ensure goalType is one of: conversion, engagement, retention, revenue, awareness
4. KPIs should align with the business goal
5. Dates must be in YYYY-MM-DD format
6. When creating a full campaign, derive ALL fields from the user's description — don't leave any empty
7. When unsure what the user wants, ASK — don't guess
