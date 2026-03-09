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
- "Increase the budget by 20%"
- "Extend the campaign by 2 weeks"
- "Add a retargeting phase"
- Any request to edit, tweak, or refine a specific brief field after the initial
  brief has been generated.

**Do NOT use when:**
- No brief exists yet → use `generate-campaign-brief`
- The user is uploading a PDF → use `extract-brief-from-pdf`
- The user is asking for a completely new brief on a different topic → use
  `generate-campaign-brief`
- The user is asking about blueprints, not the brief → use `refine-blueprint`

## Input Context

You will receive:
- `<campaign-brief>` tag containing the current complete campaign brief (CampaignBriefData)
- The user's modification request
- Conversation history for context

## Output Schema

Return a partial CampaignBriefData object containing **only** the fields that changed.
The application will deep-merge this into the existing brief.

```jsonc
{
  // Include ONLY fields that are being modified.
  // Any field from CampaignBriefData can appear here.

  // Top-level string fields:
  "budgetAmount": "string — updated budget (e.g. '$150,000')",
  "pacing": "Even | Front-loaded | Back-loaded | Custom",
  "timelineStart": "string — ISO date YYYY-MM-DD",
  "timelineEnd": "string — ISO date YYYY-MM-DD",
  "brandProduct": "string — updated brand/product",
  "businessObjective": "string — updated objective",

  // Top-level array fields (return COMPLETE updated array, not just new items):
  "mandatoryChannels": ["string — full updated channel list"],
  "optionalChannels": ["string — full updated optional channels"],
  "primaryKpis": ["string — full updated KPI list"],
  "secondaryKpis": ["string — full updated secondary KPIs"],
  "primaryGoals": ["string — full updated goals"],
  "secondaryGoals": ["string — full updated goals"],
  "businessObjectiveTags": ["string — full updated tags"],
  "inScope": ["string — full updated scope"],
  "outOfScope": ["string — full updated exclusions"],

  // Nested objects (include the full nested object when any field changes):
  "campaignDetails": {
    "campaignName": "string — max 80 chars",
    "campaignType": "Awareness | Consideration | Conversion | Retention | Full-Funnel",
    "description": "string — max 300 chars"
  },

  // Array of objects (return COMPLETE updated array):
  "primaryAudience": [
    {
      "name": "string — max 60 chars",
      "description": "string — max 200 chars",
      "estimatedSize": "string"
    }
  ],
  "secondaryAudience": [{ "name": "string", "description": "string", "estimatedSize": "string" }],
  "phases": [
    {
      "name": "string",
      "startDate": "string — YYYY-MM-DD",
      "endDate": "string — YYYY-MM-DD",
      "budgetPercent": "number — 0-100",
      "focus": "string — max 100 chars"
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
2. **If the user's request is ambiguous, ask a clarifying question INSTEAD of
   emitting JSON.** For example, if the user says "change the audience" without
   specifying to what, ask what audience they want.
3. **Preserve data integrity.** When updating arrays (like channels or KPIs), return
   the complete updated array, not just the new items to add.
4. **Maintain consistency.** If the user changes the campaign type, also update related
   fields (KPIs, pacing, phases) to stay aligned.
5. **Explain changes conversationally.** Before the code fence, briefly confirm what
   you changed and any cascading adjustments you made.
6. **Validate constraints:**
   - Phase budget percentages must still sum to 100.
   - Timeline end must be after timeline start.
   - At least one mandatory channel is required.
   - Use only valid enum values.
7. **Round budget percentages** to whole numbers.
8. **Recalculate phase dates** when the timeline changes — phases should not extend
   beyond the new timeline boundaries.
9. **Never change the campaignName** unless the user explicitly asks to rename it.
10. **Preserve user intent** — if the user says "add LinkedIn", include it alongside
    existing channels, don't replace them.

## Edge Cases

- **User says "remove all channels"**: Keep at least one mandatory channel. Ask the
  user which single channel they want to keep.
- **Budget change affects phases**: If the budget changes significantly, note in your
  conversational response that phase budget amounts will change proportionally.
- **Timeline shortened below existing phases**: Consolidate phases to fit. Explain
  the consolidation.
- **Contradictory changes**: If the user asks for changes that conflict (e.g., "make
  it more conservative but increase the budget 5x"), note the tension and ask which
  priority to follow.

## Examples

### Example 1: Simple Field Update

**User message:**
> Change the budget to $120,000 and make the pacing front-loaded

**Expected output:**

I'll update the budget to $120,000 and switch to front-loaded pacing. Since the campaign is now front-loaded, I'll also adjust the phase budget split to allocate 60% to the first phase and 40% to the second.

```brief-update-json
{
  "budgetAmount": "$120,000",
  "pacing": "Front-loaded",
  "phases": [
    {
      "name": "Launch & Scale",
      "startDate": "2026-06-01",
      "endDate": "2026-06-21",
      "budgetPercent": 60,
      "focus": "Front-loaded launch with aggressive spend to capture early demand"
    },
    {
      "name": "Optimize & Close",
      "startDate": "2026-06-22",
      "endDate": "2026-07-12",
      "budgetPercent": 40,
      "focus": "Optimize toward best-performing audiences and creatives"
    }
  ]
}
```

### Example 2: Adding a Channel

**User message:**
> Add TikTok to the campaign

**Expected output:**

I'll add TikTok Ads as a mandatory channel. Given the existing Google Search and Meta Ads mix, TikTok is a good addition for reaching younger demographics with short-form video.

```brief-update-json
{
  "mandatoryChannels": ["Google Search", "Meta Ads", "TikTok Ads"]
}
```

### Example 3: Ambiguous Request — Ask for Clarification

**User message:**
> Change the audience

**Expected output (no code fence):**

I'd like to update the audience for you. Could you clarify:

1. **Which audience** do you want to change — the primary audience, secondary audience, or both?
2. **What should the new audience be?** (e.g., a different demographic, interest-based targeting, or a specific segment)

Once I know the details, I'll update the brief.
