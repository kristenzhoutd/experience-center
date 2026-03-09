---
name: generate-campaign-brief
description: >
  Extracts a structured paid media campaign brief from a natural language request.
  Parses user intent into campaign details, objectives, KPIs, audiences, channels,
  budget, and timeline — ready for rendering in the CampaignBriefEditor.
---

# Generate Campaign Brief Skill

## When to Use

Activate this skill whenever the user describes a paid media campaign they want to
plan, launch, or explore. Trigger phrases include but are not limited to:

- "Create a campaign for ..."
- "Plan a paid media campaign ..."
- "I want to run ads for ..."
- "Launch a campaign targeting ..."
- "Set up a ... campaign with $X budget"
- "Build a media plan for ..."
- Any message mentioning ad spend, media channels, audience targeting, or campaign
  KPIs in a paid media context.

## Input Context

You will receive:
- The user's natural language campaign description
- Optional: existing brief data if the user is starting from a template
- Optional: organization or brand context from prior conversation

## Output Schema

Generate a JSON object matching this schema exactly. Every field is required;
use an empty string `""` or empty array `[]` when no value can be inferred.

```jsonc
{
  "campaignDetails": {
    "campaignName": "string — descriptive campaign name",
    "campaignType": "string — Awareness | Consideration | Conversion | Retention | Full-Funnel",
    "description": "string — 1-3 sentence campaign summary"
  },
  "brandProduct": "string — brand, product, or service being promoted",
  "businessObjective": "string — primary business objective in 1-2 sentences",
  "businessObjectiveTags": ["string — short tags: e.g. Revenue Growth, Brand Awareness, Lead Generation, Customer Acquisition"],
  "primaryGoals": ["string — specific, measurable primary goals"],
  "secondaryGoals": ["string — supporting goals"],
  "primaryKpis": ["string — e.g. ROAS, CPA, CTR, CPM, Conversion Rate"],
  "secondaryKpis": ["string — e.g. Impression Share, View-Through Rate, Engagement Rate"],
  "inScope": ["string — what is included in this campaign"],
  "outOfScope": ["string — what is explicitly excluded"],
  "primaryAudience": [
    {
      "name": "string — audience segment name",
      "description": "string — targeting criteria or persona description",
      "estimatedSize": "string — estimated reach or empty"
    }
  ],
  "secondaryAudience": [
    {
      "name": "string — audience segment name",
      "description": "string — targeting criteria or persona description",
      "estimatedSize": "string — estimated reach or empty"
    }
  ],
  "mandatoryChannels": ["string — e.g. Google Search, Meta Ads, Display, YouTube, LinkedIn"],
  "optionalChannels": ["string — suggested but not required channels"],
  "budgetAmount": "string — total budget amount or empty if unknown",
  "pacing": "string — Even | Front-loaded | Back-loaded | Custom",
  "phases": [
    {
      "name": "string — phase name (e.g. Awareness Push, Retargeting, Conversion)",
      "startDate": "string — ISO date YYYY-MM-DD",
      "endDate": "string — ISO date YYYY-MM-DD",
      "budgetPercent": "number — percentage of total budget",
      "focus": "string — primary focus of this phase"
    }
  ],
  "timelineStart": "string — ISO date YYYY-MM-DD",
  "timelineEnd": "string — ISO date YYYY-MM-DD"
}
```

## Extraction Guidelines

Follow these rules when populating the brief from the user's message:

### Campaign Details
- **campaignName**: Derive from the product, event, or objective. Use a clear,
  descriptive name (e.g. "Q1 2026 Brand Awareness — Google + Meta").
- **campaignType**: Infer from goals — brand/reach keywords map to "Awareness",
  traffic/engagement to "Consideration", sales/leads/ROAS to "Conversion",
  winback/loyalty to "Retention". Default: "Conversion".
- **description**: Write a concise 1-3 sentence summary of the campaign intent.

### Objectives & Goals
- **businessObjective**: Write a specific, measurable objective statement.
- **businessObjectiveTags**: Select 1-3 relevant tags from: Revenue Growth, Brand
  Awareness, Lead Generation, Customer Acquisition, Market Expansion, Product Launch,
  Customer Retention, Competitive Conquest.
- **primaryGoals**: Extract 2-4 specific goals. Make them measurable where possible.
- **secondaryGoals**: Extract 1-3 supporting goals.

### KPIs
- **primaryKpis**: Align with campaign type — Awareness: CPM, Reach, Impression Share;
  Consideration: CTR, CPC, Engagement Rate; Conversion: ROAS, CPA, Conversion Rate;
  Retention: Customer Lifetime Value, Repeat Purchase Rate.
- **secondaryKpis**: Include 2-4 complementary metrics.

### Scope
- **inScope**: List what the campaign covers (channels, geos, product lines).
- **outOfScope**: List explicit exclusions. Default to empty array if not mentioned.

### Audiences
- **primaryAudience**: Extract the main target segments. If none mentioned, default to
  a reasonable audience based on campaign type.
- **secondaryAudience**: Extract secondary or lookalike audiences.

### Channels
- **mandatoryChannels**: Extract explicitly mentioned ad platforms. Default to
  ["Google Search", "Meta Ads"] if not specified.
- **optionalChannels**: Suggest complementary channels based on campaign type and audience.

### Budget & Pacing
- **budgetAmount**: Extract if mentioned; otherwise leave empty.
- **pacing**: Infer from campaign type — short burst campaigns: "Front-loaded",
  sustained campaigns: "Even", end-of-quarter pushes: "Back-loaded". Default: "Even".

### Timeline & Phases
- **timelineStart / timelineEnd**: Infer from seasonal or contextual clues. If
  unspecified, use a 4-week window starting from the current date.
- **phases**: Break into logical phases if campaign is longer than 2 weeks or the user
  mentions phases. Otherwise, create a single phase covering the full timeline.

## Output Format

Wrap the JSON brief in a `campaign-brief-json` code fence. This MUST appear in
your response so the application can detect and parse it:

````
```campaign-brief-json
{
  "campaignDetails": { ... },
  "brandProduct": "...",
  "businessObjective": "...",
  ...
}
```
````

You may include conversational text before or after the code fence — the
application will extract only the JSON block.

## Quality Rules

1. **Fill intelligent defaults** for every field. Never leave a field as `null`
   or `undefined`. Use empty string `""` or empty array `[]` only when truly
   no value applies.
2. **Be specific and measurable.** Avoid vague goals like "increase sales".
   Instead write "Achieve 4:1 ROAS on Google Search within the first 30 days".
3. **Align KPIs to campaign type.** Awareness campaigns should not have CPA as
   a primary KPI; conversion campaigns should not lead with CPM.
4. **Use industry best practices** for channel selection. B2B campaigns should
   favor LinkedIn and Google Search; DTC should favor Meta and Google Shopping.
5. **Keep phases realistic.** A 2-week campaign does not need 4 phases. A 3-month
   campaign should have at least 2-3 phases.
6. **Budget percentages in phases must sum to 100.**
