---
name: generate-ad-config
description: >
  Generates a complete Meta ad configuration (campaign, ad sets, creatives, ads)
  from an approved campaign blueprint and brief. Produces a full CampaignLaunchConfig
  ready for review and launch on the Campaign Launch page.
---

# Generate Ad Config Skill

## When to Use

Activate this skill when the user has an approved blueprint and wants to generate
the full Meta ad hierarchy for launch. Trigger phrases include:

- `[launch-config-gen]` prefix (auto-triggered from blueprint approval flow)
- "Generate ad configuration"
- "Create ad sets from blueprint"
- "Build the Meta campaign from this plan"
- "Set up the ads for launch"
- "Turn this blueprint into ads"

**Do NOT use when:**
- The user wants to modify an existing launch config → use `refine-ad-config`
- No blueprint exists → tell the user to generate a blueprint first
- The user is asking about the brief → use `refine-campaign-brief`
- The user wants to modify the blueprint itself → use `refine-blueprint`

## Input Context

You will receive:
- `<approved-blueprint>` tag containing the approved Blueprint object (JSON)
- `<campaign-brief>` tag containing the CampaignBriefData object (JSON)
- Optional: user preferences for ad structure

## Output Schema

Return a complete `CampaignLaunchConfig` object with all four hierarchy levels:

```jsonc
{
  "campaign": {
    "name": "string — campaign name (max 100 chars)",
    "objective": "string — Meta objective enum: OUTCOME_AWARENESS | OUTCOME_LEADS | OUTCOME_SALES | OUTCOME_ENGAGEMENT | OUTCOME_APP_PROMOTION | OUTCOME_TRAFFIC",
    "dailyBudget": "number — daily budget in CENTS (e.g. 5000 = $50.00)",
    "status": "PAUSED",
    "specialAdCategories": ["string[] — empty array or: HOUSING | EMPLOYMENT | CREDIT | ISSUES_ELECTIONS_POLITICS"],
    "buyingType": "AUCTION"
  },
  "adSets": [
    {
      "localId": "string — format: local_1, local_2, etc.",
      "name": "string — descriptive ad set name (max 100 chars)",
      "dailyBudget": "number — daily budget in CENTS",
      "optimizationGoal": "string — LINK_CLICKS | IMPRESSIONS | REACH | OFFSITE_CONVERSIONS | LANDING_PAGE_VIEWS",
      "billingEvent": "IMPRESSIONS",
      "targeting": {
        "geoLocations": { "countries": ["string — ISO country codes"] },
        "ageMin": "number — 13-65",
        "ageMax": "number — 13-65"
      },
      "status": "PAUSED",
      "audienceLabel": "string — human-readable audience name"
    }
  ],
  "creatives": [
    {
      "localId": "string — format: local_N",
      "name": "string — creative name (max 100 chars)",
      "headline": "string — ad headline (max 40 chars recommended)",
      "bodyText": "string — ad body text (max 125 chars recommended)",
      "ctaType": "string — LEARN_MORE | SHOP_NOW | SIGN_UP | SUBSCRIBE | GET_OFFER | CONTACT_US | DOWNLOAD | BOOK_TRAVEL | APPLY_NOW | BUY_NOW",
      "linkUrl": "string — destination URL (use empty string if unknown)",
      "pageId": "string — empty string (auto-populated by app)"
    }
  ],
  "ads": [
    {
      "localId": "string — format: local_N",
      "name": "string — ad name (max 100 chars)",
      "adSetLocalId": "string — references an adSet's localId",
      "creativeLocalId": "string — references a creative's localId",
      "status": "PAUSED"
    }
  ]
}
```

## Output Format

Wrap the JSON in a `launch-config-json` code fence:

````
```launch-config-json
{
  "campaign": { ... },
  "adSets": [ ... ],
  "creatives": [ ... ],
  "ads": [ ... ]
}
```
````

Before the code fence, provide a brief explanation of the ad structure decisions
and how they map to the blueprint's strategy.

## Quality Rules

1. **One ad set per audience segment.** Each audience from the blueprint gets its own ad set.
2. **Budget allocations must sum correctly.** The sum of all ad set dailyBudgets should
   approximate the campaign dailyBudget. All budgets are in CENTS (integer, not dollars).
3. **Use valid Meta objective enums.** Map the blueprint's strategy to the closest
   Meta objective: awareness → OUTCOME_AWARENESS, leads → OUTCOME_LEADS,
   sales/conversions → OUTCOME_SALES, engagement → OUTCOME_ENGAGEMENT,
   traffic/clicks → OUTCOME_TRAFFIC.
4. **Use valid CTA type enums.** Choose the CTA that best matches the blueprint's
   call-to-action messaging.
5. **localId format must be `local_1`, `local_2`, etc.** Sequential integers starting from 1.
   Each entity (ad set, creative, ad) gets a unique localId across all arrays.
6. **Generate multiple creative variants** when the blueprint's messaging supports
   different angles. At minimum, create one creative per distinct messaging angle.
7. **Every ad set should have at least one ad** linking it to a creative.
8. **Set all statuses to PAUSED.** Users approve and activate manually.
9. **Derive the campaign name** from the blueprint name if not specified.
10. **Calculate daily budget from the blueprint's total budget** divided by the
    campaign duration (default 30 days if not specified). Result in cents.
11. **Set pageId to empty string.** The app auto-assigns the Facebook Page.
12. **Set linkUrl to empty string** if the blueprint doesn't specify a destination URL.
13. **Optimization goal should match the objective.** Traffic → LINK_CLICKS,
    Conversions/Sales → OFFSITE_CONVERSIONS, Awareness → REACH, etc.

## Edge Cases

- **Blueprint has no audiences:** Create one ad set with "Broad Audience" label.
- **Blueprint has no budget:** Use a default of $50/day (5000 cents) campaign budget.
- **Blueprint has many audiences (5+):** Create one ad set per audience. Split budget evenly.
- **Blueprint messaging is vague:** Create a single creative with the CTA from the blueprint.

## Examples

### Example 1: Two-Audience Campaign

**Input blueprint:** Summer Shoes campaign, $75K total, 30-day flight, Google Search + Meta Ads,
audiences: "Fashion-Forward Women 25-44" and "Past Purchasers — Retargeting"

**Expected output:**

Based on your blueprint, I've structured a Meta campaign with two targeted ad sets
and two creative variants optimized for your audiences:

```launch-config-json
{
  "campaign": {
    "name": "Summer Shoes — Balanced Conversion Plan",
    "objective": "OUTCOME_SALES",
    "dailyBudget": 137500,
    "status": "PAUSED",
    "specialAdCategories": [],
    "buyingType": "AUCTION"
  },
  "adSets": [
    {
      "localId": "local_1",
      "name": "Summer Shoes — Fashion-Forward Women 25-44",
      "dailyBudget": 82500,
      "optimizationGoal": "OFFSITE_CONVERSIONS",
      "billingEvent": "IMPRESSIONS",
      "targeting": {
        "geoLocations": { "countries": ["US"] },
        "ageMin": 25,
        "ageMax": 44
      },
      "status": "PAUSED",
      "audienceLabel": "Fashion-Forward Women 25-44"
    },
    {
      "localId": "local_2",
      "name": "Summer Shoes — Past Purchasers Retargeting",
      "dailyBudget": 55000,
      "optimizationGoal": "OFFSITE_CONVERSIONS",
      "billingEvent": "IMPRESSIONS",
      "targeting": {
        "geoLocations": { "countries": ["US"] },
        "ageMin": 18,
        "ageMax": 65
      },
      "status": "PAUSED",
      "audienceLabel": "Past Purchasers — Retargeting"
    }
  ],
  "creatives": [
    {
      "localId": "local_3",
      "name": "Summer Shoes — Prospecting Creative",
      "headline": "Shop the Collection",
      "bodyText": "Step into summer with the season's hottest styles — 200+ new arrivals starting at $39.",
      "ctaType": "SHOP_NOW",
      "linkUrl": "",
      "pageId": ""
    },
    {
      "localId": "local_4",
      "name": "Summer Shoes — Retargeting Creative",
      "headline": "Still Thinking About These?",
      "bodyText": "Your favorites are selling fast. Complete your order and get free shipping on $75+.",
      "ctaType": "SHOP_NOW",
      "linkUrl": "",
      "pageId": ""
    }
  ],
  "ads": [
    {
      "localId": "local_5",
      "name": "Fashion-Forward Women — Prospecting Ad",
      "adSetLocalId": "local_1",
      "creativeLocalId": "local_3",
      "status": "PAUSED"
    },
    {
      "localId": "local_6",
      "name": "Past Purchasers — Retargeting Ad",
      "adSetLocalId": "local_2",
      "creativeLocalId": "local_4",
      "status": "PAUSED"
    }
  ]
}
```
