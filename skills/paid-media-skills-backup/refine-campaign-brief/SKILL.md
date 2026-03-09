---
name: refine-campaign-brief
description: >
  Modifies specific fields of an existing campaign brief based on user feedback.
  Returns only the changed fields as a partial update, preserving all other values.
---

# Refine Campaign Brief Skill

## When to Use

Activate this skill when the user wants to modify, update, or adjust specific parts
of an existing campaign brief. Trigger phrases include but are not limited to:

- "Change the budget to ..."
- "Update the timeline to ..."
- "Add LinkedIn as a channel"
- "Remove the secondary audience"
- "Switch the primary KPI to ROAS"
- "Make it more aggressive / conservative"
- "Change the pacing to front-loaded"
- Any request to edit, tweak, or refine a specific brief field after the initial
  brief has been generated.

## Input Context

You will receive:
- The current complete campaign brief (CampaignBriefData)
- The user's modification request
- Conversation history for context

## Output Schema

Return a partial CampaignBriefData object containing only the fields that changed.
The application will deep-merge this into the existing brief.

```jsonc
{
  // Include ONLY fields that are being modified.
  // Any field from CampaignBriefData can appear here.
  // Examples:

  "budgetAmount": "string — updated budget",
  "timelineStart": "string — updated ISO date",
  "timelineEnd": "string — updated ISO date",
  "mandatoryChannels": ["string — updated channel list"],
  "primaryKpis": ["string — updated KPI list"],
  "pacing": "string — updated pacing strategy",

  // Nested objects should include the full nested object when modified:
  "campaignDetails": {
    "campaignName": "string — updated name",
    "campaignType": "string — updated type",
    "description": "string — updated description"
  },

  "phases": [
    {
      "name": "string",
      "startDate": "string",
      "endDate": "string",
      "budgetPercent": "number",
      "focus": "string"
    }
  ]
}
```

## Output Format

Wrap the partial JSON in a `brief-update-json` code fence:

````
```brief-update-json
{
  "budgetAmount": "$150,000",
  "pacing": "Front-loaded"
}
```
````

You may include conversational text before or after the code fence explaining what
was changed and why. The application will extract only the JSON block and merge it.

## Quality Rules

1. **Return only changed fields.** Do not echo back the entire brief. The application
   performs a deep merge — unchanged fields must be omitted.
2. **Preserve data integrity.** When updating arrays (like channels or KPIs), return
   the complete updated array, not just the new items to add.
3. **Maintain consistency.** If the user changes the campaign type, also update related
   fields (KPIs, pacing, phases) to stay aligned.
4. **Explain changes conversationally.** Before the code fence, briefly confirm what
   you changed and any cascading adjustments you made.
5. **Validate constraints.** Phase budget percentages must still sum to 100. Timeline
   end must be after timeline start. At least one mandatory channel is required.
