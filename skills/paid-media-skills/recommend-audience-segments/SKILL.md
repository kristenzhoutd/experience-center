---
name: recommend-audience-segments
description: >
  Analyzes the campaign brief and available CDP segments to recommend the best
  audience segments for the campaign. Returns ranked recommendations with
  confidence scores and suggested roles.
---

# Recommend Audience Segments Skill

## When to Use

Activate this skill when the user wants AI-driven audience recommendations for
their campaign. Trigger phrases include but are not limited to:

- "Recommend audiences for this campaign"
- "Which segments should I target?"
- "Suggest audiences based on my brief"
- "What audiences would work best?"
- "Help me pick the right segments"
- "Match segments to my campaign goals"
- "Show me relevant TD segments"
- "What segments should I use from CDP?"
- "Recommend targeting for my campaign"
- Any request for audience selection guidance after a brief has been created.

**Do NOT use when:**
- The user wants to view raw segment data → use `fetch-td-segments`
- The user wants to modify the brief's audience fields → use `refine-campaign-brief`
- No campaign brief exists → tell the user to create a brief first for best results
- The user is asking about web personalization audiences → use personalization
  audience-selection skill

## Input Context

You will receive:
- `<campaign-brief>` tag with the current campaign brief (CampaignBriefData)
- `<td-segments>` tag with available TD CDP segments (if fetched)
- Optional: historical campaign performance data by segment
- Optional: user preferences or constraints

## Output Schema

Return an object containing an array of segment recommendations ranked by relevance:

```jsonc
{
  "recommendations": [
    {
      "segmentId": "string — TD segment ID from the available segments list, or 'new-<name-slug>' if suggesting a new segment",
      "segmentName": "string — segment display name (max 60 chars)",
      "reason": "string — 1-2 sentence explanation of why this segment fits the campaign (max 200 chars)",
      "confidence": "High | Medium | Low",
      "suggestedRole": "prospecting | retargeting | suppression"
    }
  ]
}
```

**Field constraints:**
- `recommendations` array: 3-8 items (minimum 3 for a useful strategy, maximum 8 to stay focused)
- `confidence`: Use "High" when segment directly matches brief criteria, "Medium" when inferred, "Low" when speculative
- `suggestedRole`: Must be one of the three allowed values
- `segmentId`: Must reference a real segment ID from the provided list, or use `new-` prefix for suggested new segments
- `segmentName`: Must match the name from the segment list for existing segments

## Output Format

Wrap the JSON in an `audience-recommendation-json` code fence:

````
```audience-recommendation-json
{
  "recommendations": [
    {
      "segmentId": "seg-001",
      "segmentName": "High-Intent Shoppers",
      "reason": "This segment aligns with conversion-focused campaigns and has shown 3x higher purchase rates in past campaigns.",
      "confidence": "High",
      "suggestedRole": "prospecting"
    }
  ]
}
```
````

Before the code fence, provide a strategic summary explaining the overall audience
strategy and how the recommended segments work together.

## Quality Rules

1. **Rank by relevance.** The most impactful segments should appear first.
2. **If no segments are available and no brief exists, ask a clarifying question
   INSTEAD of emitting JSON.** You need at least a campaign objective to make
   meaningful recommendations.
3. **Match segments to campaign objectives.** Awareness campaigns need broad reach
   segments; conversion campaigns need high-intent segments.
4. **Suggest roles, not just segments.** Each recommendation must have a clear
   role — prospecting, retargeting, or suppression.
5. **Reference real segment IDs** when available. Only recommend segments that
   exist in the available segments list. For suggested new segments, use the
   `new-` prefix.
6. **Explain the "why"** for each recommendation. Connect segment characteristics
   to specific campaign goals or KPIs.
7. **Include at least one suppression recommendation** when strategically valuable
   (e.g. exclude recent purchasers for acquisition campaigns).
8. **Limit recommendations to 3-8 segments** to keep the strategy focused.
9. **Deduplicate**: Do not recommend the same segment twice with different roles.
10. **If available segments don't match the brief well**, note this and suggest
    what new segments could be created.

## Edge Cases

- **No TD segments available**: Recommend audience personas based on the brief's
  target audience. Use `new-` prefixed IDs and note that these need to be created
  in TD CDP.
- **Brief has no audience defined**: Infer reasonable audiences from the campaign
  type and product. Note the assumption.
- **Too many matching segments**: Prioritize by relevance and consolidate similar
  segments. Recommend the top 5-6 and note others are available.
- **Conflicting segment data**: If segment sizes seem unrealistic or overlap
  significantly, note this concern in your response.

## Examples

### Example 1: Segments Available from TD CDP

**User message:**
> Which segments should I target for my summer shoe campaign?

**TD segments available:** High-Intent Shoppers (seg-101), Loyal Customers (seg-102), Cart Abandoners (seg-103), New Visitors (seg-104), Lapsed 90d (seg-105)

**Expected output:**

Here's my recommended audience strategy for your summer shoe campaign. I've prioritized high-intent segments for your conversion objective while including retargeting and suppression segments to maximize efficiency.

```audience-recommendation-json
{
  "recommendations": [
    {
      "segmentId": "seg-101",
      "segmentName": "High-Intent Shoppers",
      "reason": "Directly aligns with conversion goals — these users have browsed shoe categories recently and are primed to purchase.",
      "confidence": "High",
      "suggestedRole": "prospecting"
    },
    {
      "segmentId": "seg-103",
      "segmentName": "Cart Abandoners",
      "reason": "High-value retargeting audience — users who added shoes to cart but didn't purchase. Strong conversion potential with targeted offers.",
      "confidence": "High",
      "suggestedRole": "retargeting"
    },
    {
      "segmentId": "seg-104",
      "segmentName": "New Visitors",
      "reason": "Broad prospecting pool for reaching new customers. Best suited for awareness and consideration channels like Meta and YouTube.",
      "confidence": "Medium",
      "suggestedRole": "prospecting"
    },
    {
      "segmentId": "seg-102",
      "segmentName": "Loyal Customers",
      "reason": "Suppress from prospecting to avoid wasting budget on users who already purchase regularly. Retarget with new collection messaging instead.",
      "confidence": "High",
      "suggestedRole": "suppression"
    },
    {
      "segmentId": "seg-105",
      "segmentName": "Lapsed 90d",
      "reason": "Win-back opportunity — lapsed customers who haven't purchased in 90+ days. Summer collection may re-engage them.",
      "confidence": "Medium",
      "suggestedRole": "retargeting"
    }
  ]
}
```

### Example 2: No Segments Available

**User message:**
> Recommend audiences for my B2B SaaS campaign

**No TD segments available.**

**Expected output:**

Since no CDP segments are available yet, I'll recommend audience personas based on your campaign brief. These can be created as segments in Treasure Data CDP.

```audience-recommendation-json
{
  "recommendations": [
    {
      "segmentId": "new-decision-makers",
      "segmentName": "B2B Decision Makers",
      "reason": "VP/Director-level professionals in target industries — the primary buying persona for SaaS products.",
      "confidence": "Medium",
      "suggestedRole": "prospecting"
    },
    {
      "segmentId": "new-technical-evaluators",
      "segmentName": "Technical Evaluators",
      "reason": "Senior engineers and architects who research and evaluate tools. Key influencers in the B2B buying process.",
      "confidence": "Medium",
      "suggestedRole": "prospecting"
    },
    {
      "segmentId": "new-website-visitors",
      "segmentName": "Website Visitors — Last 30 Days",
      "reason": "Users who visited your site but didn't convert. High-intent retargeting audience for demo/trial offers.",
      "confidence": "Low",
      "suggestedRole": "retargeting"
    },
    {
      "segmentId": "new-existing-customers",
      "segmentName": "Existing Customers",
      "reason": "Exclude from acquisition campaigns to avoid wasting budget on users who are already paying customers.",
      "confidence": "High",
      "suggestedRole": "suppression"
    }
  ]
}
```

### Example 3: Ambiguous Request

**User message:**
> Help me with audiences

**No brief exists.**

**Expected output (no code fence):**

I'd be happy to recommend audience segments. To give you the best recommendations, I need a bit more context:

1. **What is the campaign about?** (product, service, or promotion)
2. **What is the primary goal?** (e.g., drive sales, generate leads, build awareness)
3. **Do you have a target demographic in mind?** (e.g., age range, industry, interests)

If you've already created a campaign brief, I can use that to generate tailored recommendations. Would you like to create a brief first?
