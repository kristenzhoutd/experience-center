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
- Any upload of a PDF followed by a request to create or populate a campaign brief.

## Input Context

You will receive:
- Extracted text content from the uploaded PDF
- The user's instructions or preferences about the extraction
- Optional: conversation history with prior context

## Output Schema

Generate a JSON object matching the full CampaignBriefData schema. Every field is
required; use an empty string `""` or empty array `[]` when a value cannot be
extracted from the document.

```jsonc
{
  "campaignDetails": {
    "campaignName": "string — extracted or derived campaign name",
    "campaignType": "string — Awareness | Consideration | Conversion | Retention | Full-Funnel",
    "description": "string — 1-3 sentence campaign summary from the document"
  },
  "brandProduct": "string — brand, product, or service mentioned in the document",
  "businessObjective": "string — primary business objective extracted from the document",
  "businessObjectiveTags": ["string — categorized objective tags"],
  "primaryGoals": ["string — specific primary goals from the document"],
  "secondaryGoals": ["string — supporting goals from the document"],
  "primaryKpis": ["string — primary KPIs mentioned in the document"],
  "secondaryKpis": ["string — secondary KPIs mentioned in the document"],
  "inScope": ["string — what the document says is in scope"],
  "outOfScope": ["string — what the document says is out of scope"],
  "primaryAudience": [
    {
      "name": "string — audience segment name",
      "description": "string — targeting criteria from the document",
      "estimatedSize": "string — reach estimate if provided"
    }
  ],
  "secondaryAudience": [
    {
      "name": "string — audience segment name",
      "description": "string — targeting criteria from the document",
      "estimatedSize": "string — reach estimate if provided"
    }
  ],
  "mandatoryChannels": ["string — channels specified in the document"],
  "optionalChannels": ["string — suggested or optional channels"],
  "budgetAmount": "string — budget from the document or empty",
  "pacing": "string — Even | Front-loaded | Back-loaded | Custom",
  "phases": [
    {
      "name": "string — phase name",
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

Before the code fence, include a summary of what was extracted, what was inferred,
and what could not be found in the document. The application will extract only the
JSON block.

## Quality Rules

1. **Extract before inferring.** Always prefer values directly stated in the PDF
   over inferred defaults. Clearly note in your conversational response which
   fields were extracted vs. inferred.
2. **Handle messy documents.** PDFs may have tables, bullet points, headers, or
   unstructured text. Parse all formats and consolidate into the schema.
3. **Normalize dates.** Convert any date format found in the document to ISO
   YYYY-MM-DD format. If only a month or quarter is mentioned, use the first
   and last day of that period.
4. **Normalize currency.** Strip currency symbols and format consistently.
   Preserve the original currency if specified (e.g. "$50,000", "EUR 30,000").
5. **Flag gaps.** In your conversational response, list any required fields
   that could not be extracted so the user can fill them manually.
6. **Do not fabricate data.** If a value is not in the document and cannot be
   reasonably inferred, use empty string or empty array rather than inventing
   numbers or audiences.
