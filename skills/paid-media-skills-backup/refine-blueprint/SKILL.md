---
name: refine-blueprint
description: >
  Modifies a specific campaign blueprint based on user feedback. Returns only the
  changed fields as a partial update that will be merged into the selected blueprint.
---

# Refine Blueprint Skill

## When to Use

Activate this skill when the user wants to modify, adjust, or improve a specific
blueprint after generation. Trigger phrases include but are not limited to:

- "Adjust the budget split on the balanced blueprint"
- "Move more budget to Google Search"
- "Add TikTok as a channel"
- "Make this blueprint more aggressive"
- "Change the CTA to ..."
- "Remove the retargeting audience"
- "What if we increase the budget by 20%?"
- Any request to edit a specific blueprint after blueprints have been generated.

## Input Context

You will receive:
- The selected blueprint object being modified
- All three blueprint variants for reference
- The original campaign brief
- The user's modification request

## Output Schema

Return a partial blueprint object containing only the fields that changed.
The application will deep-merge this into the selected blueprint.

```jsonc
{
  "id": "string — ID of the blueprint being modified (always include this)",

  // Include ONLY fields that are being modified. Examples:
  "channels": [
    {
      "name": "string",
      "budgetPercent": "number",
      "budgetAmount": "string",
      "role": "string",
      "formats": ["string"],
      "expectedMetrics": { ... }
    }
  ],
  "budget": {
    "total": "string",
    "pacing": "string",
    "phases": [{ ... }]
  },
  "metrics": {
    "estimatedReach": "string",
    "estimatedRoas": "string"
  },
  "messaging": {
    "primaryMessage": "string"
  },
  "cta": "string"
}
```

## Output Format

Wrap the partial JSON in a `blueprint-update-json` code fence:

````
```blueprint-update-json
{
  "id": "bp-balanced-001",
  "channels": [ ... ],
  "metrics": { ... }
}
```
````

Before the code fence, explain what was changed and the expected impact on
campaign performance.

## Quality Rules

1. **Always include the blueprint id** so the application knows which blueprint
   to update.
2. **Return only changed fields.** Do not echo the entire blueprint. The
   application performs a deep merge.
3. **Recalculate dependent fields.** If budget allocation changes, update the
   channel amounts and expected metrics accordingly.
4. **Budget percentages must still sum to 100%** after the update.
5. **Explain trade-offs.** If adding a channel, explain what was reduced to
   accommodate it. If changing budget, explain the expected impact.
6. **Maintain strategic coherence.** A conservative blueprint should not be
   refined into something more aggressive than the aggressive variant.
