---
name: refine-ad-config
description: >
  Refines an existing Meta ad launch configuration based on user feedback.
  Emits partial updates that modify, add, or remove specific items in the
  campaign hierarchy without regenerating the entire config.
---

# Refine Ad Config Skill

## When to Use

Activate this skill when the user has an existing launch configuration and wants
to modify it through chat. Trigger phrases include:

- "Change the daily budget to $50"
- "Add another ad set for millennials"
- "Update the headline to say..."
- "Remove the retargeting ad set"
- "Split the budget evenly"
- "Change the CTA to Shop Now"
- "Add a creative variant for mobile"
- "Set the objective to conversions"
- Any request to modify, add, or remove items in the current launch config

**Do NOT use when:**
- No launch config exists → use `generate-ad-config` first
- The user wants to regenerate from scratch → use `generate-ad-config`
- The user is asking about the blueprint → use `refine-blueprint`

## Input Context

You will receive:
- `<current-launch-config>` tag containing the current CampaignLaunchConfig (JSON)
- User's modification request in natural language

## Output Schema

Return a partial update object. Only include fields that are changing.
For arrays (adSets, creatives, ads), each item must include an `operation` field:

```jsonc
{
  "campaign": {
    // Only fields that are changing. Omit unchanged fields.
    "dailyBudget": "number — in cents",
    "objective": "string — Meta objective enum"
  },
  "adSets": [
    {
      "operation": "update",
      "localId": "local_1",
      // Only changed fields:
      "dailyBudget": 7500,
      "name": "Updated Ad Set Name"
    },
    {
      "operation": "add",
      // All required fields for a new ad set:
      "name": "string",
      "dailyBudget": "number — cents",
      "optimizationGoal": "string",
      "billingEvent": "IMPRESSIONS",
      "targeting": { "geoLocations": { "countries": ["US"] }, "ageMin": 18, "ageMax": 65 },
      "status": "PAUSED",
      "audienceLabel": "string"
    },
    {
      "operation": "remove",
      "localId": "local_2"
    }
  ],
  "creatives": [
    {
      "operation": "update",
      "localId": "local_3",
      "headline": "New Headline"
    }
  ],
  "ads": [
    {
      "operation": "add",
      "name": "New Ad",
      "adSetLocalId": "local_1",
      "creativeLocalId": "local_3",
      "status": "PAUSED"
    }
  ]
}
```

## Output Format

Wrap the JSON in a `launch-config-update-json` code fence:

````
```launch-config-update-json
{
  "campaign": { ... },
  "adSets": [ ... ]
}
```
````

Before the code fence, explain what changes you're making and why.

## Quality Rules

1. **Preserve existing localIds.** When updating, always reference the existing localId.
   Never change a localId — it's the stable identifier.
2. **Recalculate dependent fields.** If the user changes the total budget, recalculate
   ad set budgets proportionally. If they remove an ad set, redistribute its budget.
3. **Budget must remain balanced.** After updates, ad set budgets should still
   approximate the campaign daily budget.
4. **Only include changed fields.** Don't echo back unchanged values. This minimizes
   the risk of overwriting concurrent edits.
5. **New items (operation: "add") don't need a localId.** The app assigns one automatically.
6. **Removing an ad set also removes its ads.** Mention this in your explanation.
7. **Use valid enum values** for all fields (objective, ctaType, optimizationGoal, etc.).
8. **All budgets are in cents** (integer). $50 = 5000 cents.

## Edge Cases

- **User says "change budget" without specifying amount:** Ask for the target amount.
- **User wants to remove the last ad set:** Warn that at least one ad set is required.
- **User wants to change the objective:** Update campaign.objective and suggest
  updating optimization goals on ad sets to match.
- **User request is ambiguous:** Ask for clarification rather than guessing.

## Examples

### Example 1: Budget Change

**User:** "Change the daily budget to $75"

```launch-config-update-json
{
  "campaign": {
    "dailyBudget": 7500
  },
  "adSets": [
    { "operation": "update", "localId": "local_1", "dailyBudget": 4500 },
    { "operation": "update", "localId": "local_2", "dailyBudget": 3000 }
  ]
}
```

### Example 2: Add Ad Set

**User:** "Add an ad set targeting millennials in the US and Canada"

```launch-config-update-json
{
  "adSets": [
    {
      "operation": "add",
      "name": "Campaign — Millennials US/CA",
      "dailyBudget": 2500,
      "optimizationGoal": "LINK_CLICKS",
      "billingEvent": "IMPRESSIONS",
      "targeting": {
        "geoLocations": { "countries": ["US", "CA"] },
        "ageMin": 25,
        "ageMax": 40
      },
      "status": "PAUSED",
      "audienceLabel": "Millennials US/CA"
    }
  ]
}
```

### Example 3: Update Creative Headline

**User:** "Change the headline on the first creative to 'Summer Sale — 50% Off'"

```launch-config-update-json
{
  "creatives": [
    {
      "operation": "update",
      "localId": "local_3",
      "headline": "Summer Sale — 50% Off"
    }
  ]
}
```
