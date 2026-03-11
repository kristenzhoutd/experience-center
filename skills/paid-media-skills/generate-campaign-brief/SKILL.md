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
- "I need a campaign brief"
- "Help me plan a campaign for Q2"
- "We want to promote our new product launch"
- Any message mentioning ad spend, media channels, audience targeting, or campaign
  KPIs in a paid media context.

**Do NOT use when:**
- The user is asking to modify an **existing** brief → use `refine-campaign-brief`
- The user is uploading a PDF to extract a brief → use `extract-brief-from-pdf`
- The user is asking about web personalization (not paid ads) → use personalization
  campaign-brief skill
- The user is asking to generate blueprints from an existing brief → use
  `generate-blueprints`

## Input Context

You will receive:
- The user's natural language campaign description
- Optional: `<campaign-brief>` tag containing existing brief data if editing
- Optional: `<company-context>` tag with organization/brand intelligence
- Optional: `<brand-guidelines>` tag with brand compliance rules
- Optional: `<available-td-segments>` tag with real Treasure Data CDP child segments (id, name, count, description)
- Optional: conversation history with prior context

## Output Schema

Generate a JSON object matching this schema exactly. Every field is required;
use an empty string `""` or empty array `[]` when no value can be inferred.

```jsonc
{
  "programName": "string — concise program name (max 40 chars). AI-generated unless the user explicitly provides one.",
  "campaignDetails": {
    "campaignName": "string — descriptive campaign name (max 80 chars)",
    "campaignType": "Awareness | Consideration | Conversion | Retention | Full-Funnel",
    "description": "string — 1-3 sentence campaign summary (max 300 chars)"
  },
  "brandProduct": "string — brand, product, or service being promoted",
  "businessObjective": "string — primary business objective in 1-2 sentences",
  "businessObjectiveTags": [
    "string — 1-3 tags from: Revenue Growth | Brand Awareness | Lead Generation | Customer Acquisition | Market Expansion | Product Launch | Customer Retention | Competitive Conquest"
  ],
  "primaryGoals": ["string — 2-4 specific, measurable primary goals"],
  "secondaryGoals": ["string — 1-3 supporting goals"],
  "primaryKpis": [
    "string — 2-4 KPIs from: ROAS | CPA | CTR | CPM | Conversion Rate | Cost Per Lead | Impression Share | Revenue"
  ],
  "secondaryKpis": [
    "string — 2-4 KPIs from: View-Through Rate | Engagement Rate | Bounce Rate | Average Order Value | Customer Lifetime Value | Click-to-Conversion Rate | Video Completion Rate"
  ],
  "inScope": ["string — what is included in this campaign"],
  "outOfScope": ["string — what is explicitly excluded"],
  "primaryAudience": [
    {
      "name": "string — audience segment name (max 60 chars)",
      "description": "string — targeting criteria or persona description (max 200 chars)",
      "estimatedSize": "string — estimated reach (e.g. '~500K', '1.2M') or empty"
    }
  ],
  "secondaryAudience": [
    {
      "name": "string — audience segment name (max 60 chars)",
      "description": "string — targeting criteria or persona description (max 200 chars)",
      "estimatedSize": "string — estimated reach or empty"
    }
  ],
  "mandatoryChannels": [
    "string — from: Google Search | Google Display | Google Shopping | Meta Ads | Instagram Ads | YouTube Ads | TikTok Ads | LinkedIn Ads | Pinterest Ads | Snapchat Ads | X Ads | Programmatic | Connected TV | Amazon Ads | Apple Search Ads | Reddit Ads | Spotify Ads"
  ],
  "optionalChannels": ["string — suggested but not required channels (same valid values)"],
  "budgetAmount": "string — total budget amount formatted with currency symbol (e.g. '$50,000') or empty if unknown",
  "pacing": "Even | Front-loaded | Back-loaded | Custom",
  "phases": [
    {
      "name": "string — phase name (e.g. 'Awareness Push', 'Retargeting', 'Conversion')",
      "startDate": "string — ISO date YYYY-MM-DD",
      "endDate": "string — ISO date YYYY-MM-DD",
      "budgetPercent": "number — percentage of total budget (0-100, all phases must sum to 100)",
      "focus": "string — primary focus of this phase (max 100 chars)"
    }
  ],
  "timelineStart": "string — ISO date YYYY-MM-DD",
  "timelineEnd": "string — ISO date YYYY-MM-DD",
  "recommendedSegments": [
    {
      "segmentId": "string — exact segment ID from <available-td-segments> or 'new-<slug>' for new audiences",
      "segmentName": "string — exact segment name from TD or descriptive name for new audiences",
      "suggestedRole": "prospecting | retargeting | suppression",
      "reason": "string — why this segment fits the campaign"
    }
  ]
}
```

## Extraction Guidelines

Follow these rules when populating the brief from the user's message:

### Program Name
- If the user explicitly states a program name (e.g., "call it Summer Push"), use that exactly.
- Otherwise, generate a short, descriptive name (max 40 chars) from the brand/product + objective.
- Should be shorter and more scannable than `campaignName` (e.g., "Summer Shoes Launch" not "Summer Shoe Collection — Google + Meta Conversion Campaign").
- Avoid generic names like "New Campaign", "Campaign 1", or leading verbs ("Create...", "Plan...").

### Campaign Details
- **campaignName**: Derive from the product, event, or objective. Use a clear,
  descriptive name (e.g. "Q1 2026 Brand Awareness — Google + Meta").
- **campaignType**: Infer from goals — brand/reach keywords map to "Awareness",
  traffic/engagement to "Consideration", sales/leads/ROAS to "Conversion",
  winback/loyalty to "Retention". Default: "Conversion".
- **description**: Write a concise 1-3 sentence summary of the campaign intent.

### Objectives & Goals
- **businessObjective**: Write a specific, measurable objective statement.
- **businessObjectiveTags**: Select 1-3 relevant tags from the allowed enum values.
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
- **recommendedSegments**: When `<available-td-segments>` is present in context, match
  audience descriptions against the available segments by name. Output a
  `recommendedSegments` array mapping audiences to real segment IDs. Use the exact
  segment ID from the provided list. If an audience has no match, use `new-<slug>` as
  the segmentId. Assign each segment a `suggestedRole` of `prospecting`, `retargeting`,
  or `suppression` based on its name and campaign strategy. If no
  `<available-td-segments>` is provided, omit this field or use an empty array.

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
2. **If the user's request is ambiguous, ask a clarifying question INSTEAD of
   emitting JSON.** For example, if the user says "create a campaign" with no
   other details, ask what product/service, budget range, and target audience
   they have in mind.
3. **Be specific and measurable.** Avoid vague goals like "increase sales".
   Instead write "Achieve 4:1 ROAS on Google Search within the first 30 days".
4. **Align KPIs to campaign type.** Awareness campaigns should not have CPA as
   a primary KPI; conversion campaigns should not lead with CPM.
5. **Use industry best practices** for channel selection. B2B campaigns should
   favor LinkedIn and Google Search; DTC should favor Meta and Google Shopping.
6. **Keep phases realistic.** A 2-week campaign does not need 4 phases. A 3-month
   campaign should have at least 2-3 phases.
7. **Budget percentages in phases must sum to 100.** Round to whole numbers.
8. **Use only valid enum values** for campaignType, pacing, businessObjectiveTags,
   and channel names. Do not invent new values.
9. **campaignName must be unique and descriptive** — include the product/event
   and primary channel or campaign type.
10. **Dates must be valid ISO format** (YYYY-MM-DD). timelineEnd must be after
    timelineStart. Phase dates must fall within the campaign timeline.

## Edge Cases

- **No budget mentioned**: Leave `budgetAmount` as empty string. Note in your
  conversational response that the user should add a budget to enable more
  accurate planning.
- **No audience mentioned**: Default to reasonable segments for the campaign type
  (e.g. "In-Market Shoppers" for conversion, "Category Browsers" for awareness).
- **Conflicting objectives**: If the user mentions both awareness and conversion
  goals, use "Full-Funnel" as campaignType and split phases accordingly.
- **Very short timeline** (< 1 week): Use a single phase. Note that short
  campaigns may not allow sufficient optimization time.
- **Very long timeline** (> 3 months): Split into 3-4 phases with distinct
  strategic focuses. Note that creative refresh may be needed.

## Examples

### Example 1: Standard Campaign (All Data Available)

**User message:**
> Create a Google and Meta campaign for our summer shoe collection. Budget is $75,000 over 6 weeks. Target women 25-44 interested in fashion. Goal is 4:1 ROAS.

**Expected output:**

```campaign-brief-json
{
  "programName": "Summer Shoes Launch",
  "campaignDetails": {
    "campaignName": "Summer Shoe Collection — Google + Meta Conversion Campaign",
    "campaignType": "Conversion",
    "description": "Drive online sales of the summer shoe collection through targeted Google Search and Meta Ads campaigns, optimizing for ROAS among fashion-forward women 25-44."
  },
  "brandProduct": "Summer Shoe Collection",
  "businessObjective": "Achieve 4:1 ROAS on paid media spend while maximizing revenue from the summer shoe collection launch.",
  "businessObjectiveTags": ["Revenue Growth", "Product Launch"],
  "primaryGoals": [
    "Achieve 4:1 ROAS across Google and Meta",
    "Drive 500+ online purchases within 6 weeks",
    "Maintain CPA below $35"
  ],
  "secondaryGoals": [
    "Build email list with 2,000+ new subscribers",
    "Increase brand search volume by 20%"
  ],
  "primaryKpis": ["ROAS", "CPA", "Conversion Rate"],
  "secondaryKpis": ["CTR", "Average Order Value", "View-Through Rate"],
  "inScope": ["Google Search ads", "Meta feed and story ads", "US market", "Summer shoe collection SKUs"],
  "outOfScope": ["Organic social", "Email marketing", "International markets"],
  "primaryAudience": [
    {
      "name": "Fashion-Forward Women 25-44",
      "description": "Women aged 25-44 with interests in fashion, shoes, and online shopping. In-market for footwear.",
      "estimatedSize": "~2.5M"
    }
  ],
  "secondaryAudience": [
    {
      "name": "Past Purchasers — Retargeting",
      "description": "Previous customers who purchased shoes in the last 12 months",
      "estimatedSize": "~120K"
    },
    {
      "name": "Lookalike — Top Customers",
      "description": "1% lookalike audience based on top 20% customers by LTV",
      "estimatedSize": "~1.8M"
    }
  ],
  "mandatoryChannels": ["Google Search", "Meta Ads"],
  "optionalChannels": ["Google Shopping", "Instagram Ads"],
  "budgetAmount": "$75,000",
  "pacing": "Front-loaded",
  "phases": [
    {
      "name": "Launch & Scale",
      "startDate": "2026-06-01",
      "endDate": "2026-06-21",
      "budgetPercent": 60,
      "focus": "Drive initial awareness and sales velocity with broad targeting"
    },
    {
      "name": "Optimize & Retarget",
      "startDate": "2026-06-22",
      "endDate": "2026-07-12",
      "budgetPercent": 40,
      "focus": "Shift budget to top performers and retargeting audiences"
    }
  ],
  "timelineStart": "2026-06-01",
  "timelineEnd": "2026-07-12"
}
```

### Example 2: Minimal Input (Inference Required)

**User message:**
> I want to run ads for our new SaaS product

**Expected output:**

The AI should ask a clarifying question instead of guessing:

> I'd be happy to help you plan a campaign for your SaaS product. To create an effective brief, I need a few more details:
>
> 1. **What is the product name and what does it do?**
> 2. **Who is your target audience?** (e.g., SMBs, enterprise, developers)
> 3. **Do you have a budget range in mind?**
> 4. **What's your primary goal?** (e.g., demo signups, free trial starts, brand awareness)
>
> With these details I can build a tailored campaign brief for you.

If the user insists on a brief without details, generate with reasonable B2B SaaS defaults:

```campaign-brief-json
{
  "programName": "SaaS Product Launch",
  "campaignDetails": {
    "campaignName": "SaaS Product Launch — Google + LinkedIn Campaign",
    "campaignType": "Conversion",
    "description": "Generate qualified leads and trial signups for the new SaaS product through targeted B2B advertising on Google Search and LinkedIn."
  },
  "brandProduct": "New SaaS Product",
  "businessObjective": "Drive qualified demo requests and free trial signups to build the initial user base.",
  "businessObjectiveTags": ["Lead Generation", "Product Launch"],
  "primaryGoals": [
    "Generate 200+ qualified demo requests in 4 weeks",
    "Achieve cost per lead below $75",
    "Drive 500+ free trial signups"
  ],
  "secondaryGoals": [
    "Build awareness among target decision-makers",
    "Establish baseline conversion metrics for future optimization"
  ],
  "primaryKpis": ["Cost Per Lead", "Conversion Rate", "CTR"],
  "secondaryKpis": ["Impression Share", "Engagement Rate", "Click-to-Conversion Rate"],
  "inScope": ["Google Search ads", "LinkedIn Sponsored Content", "US and UK markets"],
  "outOfScope": ["Organic social", "Content marketing", "PR"],
  "primaryAudience": [
    {
      "name": "B2B Decision Makers",
      "description": "VP/Director-level professionals in target industries evaluating SaaS solutions",
      "estimatedSize": "~800K"
    }
  ],
  "secondaryAudience": [
    {
      "name": "Technical Evaluators",
      "description": "Senior developers and architects researching tools in the category",
      "estimatedSize": "~400K"
    }
  ],
  "mandatoryChannels": ["Google Search", "LinkedIn Ads"],
  "optionalChannels": ["Google Display", "Reddit Ads"],
  "budgetAmount": "",
  "pacing": "Even",
  "phases": [
    {
      "name": "Launch & Learn",
      "startDate": "2026-03-11",
      "endDate": "2026-04-07",
      "budgetPercent": 100,
      "focus": "Test messaging and audiences, establish baseline metrics"
    }
  ],
  "timelineStart": "2026-03-11",
  "timelineEnd": "2026-04-07"
}
```

### Example 3: Edge Case — Conflicting Objectives

**User message:**
> We need a campaign that builds brand awareness AND drives immediate sales for our electronics line. Budget $200K, 3 months, US only.

**Expected output:**

```campaign-brief-json
{
  "programName": "Electronics Full-Funnel",
  "campaignDetails": {
    "campaignName": "Electronics Full-Funnel Campaign — US Market",
    "campaignType": "Full-Funnel",
    "description": "A phased full-funnel campaign combining brand awareness on YouTube and Connected TV with conversion-focused Google Search and Meta retargeting to drive electronics sales."
  },
  "brandProduct": "Electronics Product Line",
  "businessObjective": "Build brand awareness among US electronics shoppers while driving measurable sales through a full-funnel paid media strategy.",
  "businessObjectiveTags": ["Brand Awareness", "Revenue Growth"],
  "primaryGoals": [
    "Increase aided brand recall by 15% (measured via brand lift study)",
    "Achieve 3.5:1 blended ROAS across all channels",
    "Drive $700K+ in attributable revenue"
  ],
  "secondaryGoals": [
    "Grow remarketing audience pool by 50%",
    "Achieve 60%+ video completion rate on awareness creatives"
  ],
  "primaryKpis": ["ROAS", "CPM", "Conversion Rate"],
  "secondaryKpis": ["Video Completion Rate", "CTR", "View-Through Rate", "Average Order Value"],
  "inScope": ["YouTube video ads", "Connected TV", "Google Search", "Meta retargeting", "US market", "Full electronics product line"],
  "outOfScope": ["International markets", "Organic social", "Email marketing", "In-store promotions"],
  "primaryAudience": [
    {
      "name": "US Electronics Shoppers",
      "description": "Adults 25-54 in the US with interest in electronics, tech, and gadgets",
      "estimatedSize": "~15M"
    }
  ],
  "secondaryAudience": [
    {
      "name": "Site Visitors — Retargeting",
      "description": "Users who visited product pages but did not purchase in the last 30 days",
      "estimatedSize": "~350K"
    },
    {
      "name": "Lookalike — High-Value Customers",
      "description": "1% lookalike based on customers with $200+ lifetime spend",
      "estimatedSize": "~2M"
    }
  ],
  "mandatoryChannels": ["YouTube Ads", "Google Search", "Meta Ads"],
  "optionalChannels": ["Connected TV", "Google Display", "Google Shopping"],
  "budgetAmount": "$200,000",
  "pacing": "Front-loaded",
  "phases": [
    {
      "name": "Awareness & Reach",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "budgetPercent": 40,
      "focus": "Build brand awareness through YouTube and CTV with broad targeting"
    },
    {
      "name": "Consideration & Engagement",
      "startDate": "2026-05-01",
      "endDate": "2026-05-31",
      "budgetPercent": 30,
      "focus": "Drive site visits and product page engagement through Search and Display"
    },
    {
      "name": "Conversion & Retargeting",
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "budgetPercent": 30,
      "focus": "Maximize conversions through retargeting and high-intent Search"
    }
  ],
  "timelineStart": "2026-04-01",
  "timelineEnd": "2026-06-30"
}
```
