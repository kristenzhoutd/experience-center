---
name: recommend-media-mix
description: >
  Recommends the optimal channel mix and budget allocation for a campaign blueprint.
  Analyzes campaign objectives, audience, budget, and existing channels to suggest
  which channels to include, their roles, and how to split budget across them.
---

# Recommend Media Mix Skill

## When to Use

Activate this skill when the user wants AI-driven recommendations for their
media channel mix and budget allocation within a campaign blueprint. Trigger
phrases include but are not limited to:

- "Recommend channels for my campaign"
- "Optimize my media mix"
- "Which channels should I use?"
- "Improve my channel allocation"
- "Help me with the media mix"
- "Suggest better budget allocation"
- "AI edit media mix" (triggered by the AI Edit button on Media Mix section)
- "What's the best channel mix for my budget?"
- "Should I add or remove any channels?"
- Any request for channel selection, media planning, or budget distribution.

**Do NOT use when:**
- The user wants to change the total budget amount → use `refine-campaign-brief`
  or `refine-blueprint`
- The user wants audience recommendations → use `recommend-audience-segments`
- The user wants to modify specific blueprint fields → use `refine-blueprint`
- The user is asking about web personalization → use personalization skills

## Input Context

You will receive:
- `<campaign-brief>` tag with campaign brief data (objectives, KPIs, audiences, budget, timeline)
- `<selected-blueprint>` tag with current blueprint including media mix
- Campaign type (awareness, consideration, conversion, retention)
- Budget amount and pacing

## Output Schema

Return a complete recommended media mix with channel allocations:

```jsonc
{
  "channels": [
    {
      "name": "string — from: Meta Ads | Google Ads | Google Search | Google Display | Google Shopping | YouTube | YouTube Ads | YouTube Shorts | TikTok Ads | LinkedIn Ads | Pinterest Ads | Snapchat Ads | X Ads | Programmatic | Connected TV | Spotify Ads | Amazon Ads | Apple Search Ads | Reddit Ads | Instagram Ads",
      "role": "string — channel role: Primary Acquisition | Demand Capture | Discovery | Retargeting | Awareness | Scale | Consideration | Conversion",
      "percentage": "number — 0-100 (all channel percentages must sum to 100)",
      "rationale": "string — 1-2 sentence explanation (max 200 chars)"
    }
  ],
  "removedChannels": [
    {
      "name": "string — channel that should be removed from current mix",
      "reason": "string — why it should be removed (max 150 chars)"
    }
  ],
  "addedChannels": [
    {
      "name": "string — channel that should be added",
      "reason": "string — why it should be added (max 150 chars)"
    }
  ],
  "strategy": "string — overall media strategy summary in 1-2 sentences (max 250 chars)",
  "expectedImpact": {
    "reach": "string — estimated reach improvement (e.g. '+25%')",
    "efficiency": "string — estimated efficiency improvement (e.g. '+15% ROAS')",
    "confidence": "High | Medium | Low"
  }
}
```

**Field constraints:**
- `channels` array: 2-6 items (minimum 2 for diversification, maximum 6 to avoid dilution)
- `channels[].percentage` values must sum to exactly 100
- `removedChannels` and `addedChannels` should be empty arrays if no changes
- Each channel can only appear once in the `channels` array
- Use only valid channel names from the enum list

## Output Format

Wrap the JSON in a `media-mix-json` code fence:

````
```media-mix-json
{
  "channels": [
    { "name": "Meta Ads", "role": "Primary Acquisition", "percentage": 40, "rationale": "Strong targeting capabilities for new customer acquisition" },
    { "name": "Google Ads", "role": "Demand Capture", "percentage": 30, "rationale": "Captures high-intent search demand" }
  ],
  "removedChannels": [],
  "addedChannels": [],
  "strategy": "Focus on proven acquisition channels while testing emerging platforms.",
  "expectedImpact": { "reach": "+25%", "efficiency": "+15% ROAS", "confidence": "High" }
}
```
````

Before the code fence, briefly explain the recommended changes and reasoning.

## Quality Rules

1. **Allocation percentages must sum to exactly 100%.** Round to whole numbers.
   If rounding causes a total of 99 or 101, adjust the largest allocation by 1.
2. **If the campaign brief is missing or has no channels and no budget, ask a
   clarifying question INSTEAD of emitting JSON.**
3. **Use only valid channel names** from the enum list above. Do not invent
   channel names.
4. **Match channels to campaign type:**
   - Awareness → YouTube Ads, Connected TV, Programmatic, TikTok Ads
   - Consideration → Meta Ads, Google Display, Instagram Ads, Pinterest Ads
   - Conversion → Google Search, Google Shopping, Meta Ads, Amazon Ads
   - B2B → LinkedIn Ads, Google Search, Reddit Ads
   - Retention → Meta Ads (retargeting), Google Display (remarketing)
5. **Consider audience fit.** Recommend channels where the target audience
   is most active and engaged.
6. **Respect budget constraints.** Budgets under $10,000/month should use 2-3
   channels max. Budgets over $100,000/month can support 4-6 channels.
7. **Provide clear rationale** for each channel explaining its role and why
   the allocation percentage is appropriate.
8. **Highlight changes explicitly.** Populate `addedChannels` and
   `removedChannels` when the recommendation differs from the current mix.
9. **Minimum 10% allocation per channel.** Below 10%, a channel typically can't
   generate meaningful data for optimization.
10. **Deduplicate channel names.** "Google Ads" and "Google Search" are different;
    "Meta Ads" and "Facebook Ads" are the same (use "Meta Ads").

## Edge Cases

- **No existing media mix**: Recommend a mix from scratch based on campaign type,
  audience, and budget. Set `removedChannels` and `addedChannels` to empty arrays.
- **User asks to keep current mix**: If the current mix is already optimal, say so
  and provide minor optimization suggestions (percentage adjustments).
- **User specifies a channel that's not in the valid list**: Map to the closest
  valid channel name (e.g. "Facebook" → "Meta Ads") and note the mapping.
- **Very small budget**: Recommend 2 channels maximum with at least 40% each.
  Note that small budgets should concentrate rather than diversify.
- **Conflicting user request and campaign data**: Prioritize the user's explicit
  request but note any concerns (e.g. "You asked for TikTok but your target
  audience is 55+ — consider that TikTok skews younger").

## Examples

### Example 1: Optimizing Existing Mix

**User message:**
> Optimize my media mix. I'm currently 50/50 Google and Meta but my conversions are mostly coming from Google.

**Expected output:**

Since Google is driving more conversions, I recommend shifting the mix to favor Google while keeping Meta for prospecting. I'm also suggesting TikTok as a test channel given your target demographic.

```media-mix-json
{
  "channels": [
    { "name": "Google Search", "role": "Demand Capture", "percentage": 45, "rationale": "Your primary conversion driver. Increasing allocation to capture more high-intent search demand." },
    { "name": "Meta Ads", "role": "Primary Acquisition", "percentage": 35, "rationale": "Reduced from 50% but still essential for prospecting and building retargeting audiences." },
    { "name": "TikTok Ads", "role": "Discovery", "percentage": 20, "rationale": "Test budget for reaching younger demographics with engaging short-form video at lower CPMs." }
  ],
  "removedChannels": [],
  "addedChannels": [
    { "name": "TikTok Ads", "reason": "Cost-effective awareness and discovery channel for the target demographic" }
  ],
  "strategy": "Concentrate spend on proven conversion channel (Google) while maintaining Meta for pipeline and testing TikTok for incremental reach.",
  "expectedImpact": { "reach": "+20%", "efficiency": "+12% ROAS", "confidence": "Medium" }
}
```

### Example 2: New Mix from Scratch

**User message:**
> What channels should I use for a $30,000/month B2B SaaS campaign?

**Expected output:**

For a B2B SaaS campaign at $30K/month, I recommend a focused 2-channel approach. Google Search captures active demand from people searching for solutions, while LinkedIn targets the specific job titles and industries you need to reach.

```media-mix-json
{
  "channels": [
    { "name": "Google Search", "role": "Demand Capture", "percentage": 55, "rationale": "Captures high-intent B2B search queries. Best ROI channel for SaaS lead generation." },
    { "name": "LinkedIn Ads", "role": "Primary Acquisition", "percentage": 45, "rationale": "Unmatched B2B targeting by job title, company size, and industry. Essential for reaching decision-makers." }
  ],
  "removedChannels": [],
  "addedChannels": [],
  "strategy": "A focused two-channel B2B strategy: Google Search for demand capture and LinkedIn for targeted prospecting.",
  "expectedImpact": { "reach": "", "efficiency": "", "confidence": "Medium" }
}
```

### Example 3: Ambiguous Request

**User message:**
> Help with channels

**No brief or context available.**

**Expected output (no code fence):**

I'd be happy to recommend a channel mix. To make a useful recommendation, I need to know:

1. **What is the campaign goal?** (e.g., brand awareness, lead generation, online sales)
2. **Who is your target audience?** (e.g., consumers 25-44, B2B decision-makers)
3. **What is your monthly budget?** (this determines how many channels to use)
4. **Are there channels you're already using or required to use?**

With these details I can build a tailored media mix recommendation.
