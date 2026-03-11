---
name: extract-brief-from-pdf
description: >
  Parses an uploaded PDF document (media plan, RFP, or campaign brief) and extracts
  a structured campaign brief as JSON. Maps document content to the CampaignBriefData
  schema for rendering in the CampaignBriefEditor.
---

# Extract Brief from PDF Skill

## When to Use

Activate this skill when the user uploads a PDF and wants to extract a campaign
brief from it. Trigger phrases include but are not limited to:

- "Extract a brief from this PDF"
- "Parse this media plan"
- "Import this RFP as a campaign brief"
- "Use this document to create a brief"
- "Read this PDF and build a campaign plan"
- "Pull the campaign details from this document"
- "Convert this media plan to a brief"
- Any upload of a PDF followed by a request to create or populate a campaign brief.

**Do NOT use when:**
- No PDF content is provided → use `generate-campaign-brief` instead
- The user is describing a campaign in natural language (no document) → use
  `generate-campaign-brief`
- The user wants to modify an existing brief → use `refine-campaign-brief`

## Input Context

You will receive:
- `<pdf-content>` tag containing extracted text content from the uploaded PDF
- The user's instructions or preferences about the extraction
- Optional: conversation history with prior context

## Output Schema

Generate a JSON object matching the full CampaignBriefData schema. Every field is
required; use an empty string `""` or empty array `[]` when a value cannot be
extracted from the document.

```jsonc
{
  "programName": "string — concise program name (max 40 chars). Extracted from the document or derived from brand/product + purpose.",
  "campaignDetails": {
    "campaignName": "string — extracted or derived campaign name (max 80 chars)",
    "campaignType": "Awareness | Consideration | Conversion | Retention | Full-Funnel",
    "description": "string — 1-3 sentence campaign summary from the document (max 300 chars)"
  },
  "brandProduct": "string — brand, product, or service mentioned in the document",
  "businessObjective": "string — primary business objective extracted from the document",
  "businessObjectiveTags": [
    "string — 1-3 tags from: Revenue Growth | Brand Awareness | Lead Generation | Customer Acquisition | Market Expansion | Product Launch | Customer Retention | Competitive Conquest"
  ],
  "primaryGoals": ["string — specific primary goals from the document"],
  "secondaryGoals": ["string — supporting goals from the document"],
  "primaryKpis": [
    "string — primary KPIs from: ROAS | CPA | CTR | CPM | Conversion Rate | Cost Per Lead | Impression Share | Revenue"
  ],
  "secondaryKpis": [
    "string — secondary KPIs from: View-Through Rate | Engagement Rate | Bounce Rate | Average Order Value | Customer Lifetime Value | Click-to-Conversion Rate | Video Completion Rate"
  ],
  "inScope": ["string — what the document says is in scope"],
  "outOfScope": ["string — what the document says is out of scope"],
  "primaryAudience": [
    {
      "name": "string — audience segment name (max 60 chars)",
      "description": "string — targeting criteria from the document (max 200 chars)",
      "estimatedSize": "string — reach estimate if provided, or empty"
    }
  ],
  "secondaryAudience": [
    {
      "name": "string — audience segment name (max 60 chars)",
      "description": "string — targeting criteria from the document (max 200 chars)",
      "estimatedSize": "string — reach estimate if provided, or empty"
    }
  ],
  "mandatoryChannels": ["string — channels specified in the document (use standard names)"],
  "optionalChannels": ["string — suggested or optional channels (use standard names)"],
  "budgetAmount": "string — budget from the document with currency symbol, or empty",
  "pacing": "Even | Front-loaded | Back-loaded | Custom",
  "phases": [
    {
      "name": "string — phase name",
      "startDate": "string — ISO date YYYY-MM-DD",
      "endDate": "string — ISO date YYYY-MM-DD",
      "budgetPercent": "number — 0-100, all phases sum to 100",
      "focus": "string — primary focus (max 100 chars)"
    }
  ],
  "timelineStart": "string — ISO date YYYY-MM-DD",
  "timelineEnd": "string — ISO date YYYY-MM-DD"
}
```

## Output Format

Wrap the JSON brief in a `campaign-brief-json` code fence:

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

Before the code fence, include a summary of:
1. What was **extracted** directly from the document
2. What was **inferred** from context
3. What **could not be found** and was left empty or defaulted

## Extraction Guidelines

### Program Name
- If the document contains an explicit program or campaign name, use it in concise form.
- Otherwise, derive a short name from the brand/product + document purpose.
- Max 40 chars, scannable. Avoid generic names like "New Campaign" or leading verbs.

## Quality Rules

1. **Extract before inferring.** Always prefer values directly stated in the PDF
   over inferred defaults. Clearly note in your conversational response which
   fields were extracted vs. inferred.
2. **If the PDF content is too sparse to produce a meaningful brief, ask the user
   to provide more details** INSTEAD of emitting a mostly-empty JSON block.
3. **Handle messy documents.** PDFs may have tables, bullet points, headers, or
   unstructured text. Parse all formats and consolidate into the schema.
4. **Normalize dates.** Convert any date format found in the document to ISO
   YYYY-MM-DD format. If only a month or quarter is mentioned, use the first
   and last day of that period.
5. **Normalize currency.** Strip currency symbols and format consistently.
   Preserve the original currency if specified (e.g. "$50,000", "EUR 30,000").
6. **Normalize channel names.** Map document terms to standard channel names
   (e.g. "Facebook" → "Meta Ads", "AdWords" → "Google Search", "IG" →
   "Instagram Ads").
7. **Flag gaps.** In your conversational response, list any required fields
   that could not be extracted so the user can fill them manually.
8. **Do not fabricate data.** If a value is not in the document and cannot be
   reasonably inferred, use empty string or empty array rather than inventing
   numbers or audiences.
9. **Phase budget percentages must sum to 100.** If the document lists budgets
   per phase, calculate percentages from the total.
10. **Use valid enum values only** for campaignType, pacing, businessObjectiveTags,
    and channel names.

## Edge Cases

- **PDF is a spreadsheet/table-heavy document**: Extract column headers as field
  names and row values as data. Convert tabular budget splits into phases.
- **PDF mentions multiple campaigns**: Ask the user which campaign to extract, or
  extract the first/primary one and note the others in your response.
- **PDF has no dates**: Use a 4-week window from the current date and note this
  in your response.
- **PDF is in a non-English language**: Extract what you can and note any
  translation uncertainty.
- **Budget in multiple currencies**: Normalize to the primary currency mentioned
  and note the conversion assumption.

## Examples

### Example 1: Well-Structured Media Plan PDF

**User message:**
> Extract a brief from this PDF

**PDF content (summarized):**
> Campaign: Holiday Gift Guide 2026
> Client: Luxe Home
> Budget: $150,000
> Timeline: November 15 - December 31, 2026
> Channels: Google Search (40%), Meta (35%), Pinterest (25%)
> Audience: Affluent homeowners, age 30-55, HHI $100K+
> KPIs: ROAS 5:1, CPA < $45

**Expected output:**

I extracted the following from your media plan:

**Extracted directly:** Campaign name, budget ($150,000), timeline (Nov 15 - Dec 31), channels with allocation percentages, audience demographics, and KPI targets.

**Inferred:** Campaign type (Conversion, based on ROAS/CPA KPIs), business objective tags, secondary goals, and pacing strategy.

**Not found:** Secondary audience, out-of-scope items, phase breakdown (using a 2-phase default).

```campaign-brief-json
{
  "programName": "Luxe Home Holiday 2026",
  "campaignDetails": {
    "campaignName": "Holiday Gift Guide 2026 — Luxe Home",
    "campaignType": "Conversion",
    "description": "Drive holiday gift sales for Luxe Home through Google Search, Meta, and Pinterest with a $150K budget targeting affluent homeowners."
  },
  "brandProduct": "Luxe Home — Holiday Gift Guide",
  "businessObjective": "Achieve 5:1 ROAS while maintaining CPA below $45 during the holiday gift-giving season.",
  "businessObjectiveTags": ["Revenue Growth"],
  "primaryGoals": [
    "Achieve 5:1 ROAS across all channels",
    "Maintain CPA below $45",
    "Drive maximum revenue during peak holiday shopping period"
  ],
  "secondaryGoals": [
    "Build retargeting audiences for post-holiday campaigns",
    "Increase brand awareness among affluent homeowner segment"
  ],
  "primaryKpis": ["ROAS", "CPA", "Conversion Rate"],
  "secondaryKpis": ["CTR", "Average Order Value", "Impression Share"],
  "inScope": ["Google Search ads", "Meta Ads (feed + stories)", "Pinterest Ads", "US market", "Holiday gift guide products"],
  "outOfScope": [],
  "primaryAudience": [
    {
      "name": "Affluent Homeowners 30-55",
      "description": "Adults 30-55 with household income $100K+, interested in home decor and gifting",
      "estimatedSize": ""
    }
  ],
  "secondaryAudience": [],
  "mandatoryChannels": ["Google Search", "Meta Ads", "Pinterest Ads"],
  "optionalChannels": ["Google Shopping"],
  "budgetAmount": "$150,000",
  "pacing": "Back-loaded",
  "phases": [
    {
      "name": "Early Holiday",
      "startDate": "2026-11-15",
      "endDate": "2026-12-07",
      "budgetPercent": 40,
      "focus": "Build awareness and capture early holiday shoppers"
    },
    {
      "name": "Peak Holiday",
      "startDate": "2026-12-08",
      "endDate": "2026-12-31",
      "budgetPercent": 60,
      "focus": "Maximize conversions during peak gift-buying period"
    }
  ],
  "timelineStart": "2026-11-15",
  "timelineEnd": "2026-12-31"
}
```

### Example 2: Sparse PDF — Ask for More Details

**User message:**
> Parse this document into a brief

**PDF content:**
> Meeting notes - Q2 marketing planning
> Action item: launch digital campaign
> Budget TBD

**Expected output (no code fence):**

The document appears to be meeting notes with very limited campaign details. I found:

- **Mentioned:** A digital campaign planned for Q2
- **Missing:** Campaign name, target audience, channels, KPIs, budget, specific dates, and objectives

To create a useful campaign brief, could you provide:

1. **What product or service** is this campaign for?
2. **Who is the target audience?**
3. **What is the primary goal?** (e.g., drive sales, generate leads, build awareness)
4. **What channels** are you considering? (e.g., Google, Meta, LinkedIn)

With these details I can build a complete brief for you.
