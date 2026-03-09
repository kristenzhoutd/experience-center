---
name: spot-recommendation
description: >
  Recommends which content spots to configure on which pages based on campaign
  context (objective, audiences, goal type). Bridges campaign planning and
  content configuration by mapping campaign goals to optimal spot placements.
---

# Spot Recommendation Skill

## When to Use

Activate this skill when the user wants recommendations on which content spots
to use for their campaign. Trigger phrases include:

- "Which spots should I use?"
- "Recommend spots for this campaign"
- "Suggest placements for ..."
- "Where should I personalize?"
- "What spots for [goal type]?"
- "Help me pick content spots"
- "Best placements for a ... campaign"
- Auto-triggered when transitioning from audience selection (Step 2) to content
  configuration (Step 3) in the wizard

## Input Context

The system auto-injects context when this skill is activated:

- `<campaign-brief>` — Campaign objective, business goal, goal type from Step 1
- `<selected-segments>` — Audience segments selected in Step 2
- `<available-pages>` — Pages and detected spots from pageStore (web analysis
  results or manually added pages)
- `<company-context>` — Company info if available

Use all available context to make informed recommendations. If some context is
missing, make reasonable assumptions and note them.

## Recommendation Logic

### Goal Type to Spot Priority Matrix

Use these mappings as a starting point, adjusting based on specific campaign
details:

| Goal Type | High Priority Spots | Medium Priority Spots |
|---|---|---|
| `conversion` | Hero Banner (primary CTA), Sticky Bar (urgency), Inline Promo (social proof) | CTA Button, Text Block |
| `engagement` | Hero Banner (discovery), Text Block (editorial), Image (visual stories) | Carousel, Sidebar |
| `retention` | Sticky Bar (loyalty offer), Hero Banner (welcome back), Inline Promo (recommendations) | CTA Button, Text Block |
| `revenue` | Hero Banner (upsell), Skyscraper (cross-sell), Sticky Bar (free shipping threshold) | Inline Promo, CTA Button |
| `awareness` | Hero Banner (brand story), Image (campaign visual), Text Block (value prop) | Carousel, Sticky Bar |

### Page Type to Spot Relevance

| Page Type | Best Spot Types |
|---|---|
| Homepage | Hero Banner, Sticky Bar, Inline Promo, Carousel |
| Product page | Skyscraper (related products), CTA Button (add to cart variant), Inline Promo |
| Category page | Hero Banner (category-specific), Text Block (curated picks) |
| Cart / Checkout | Sticky Bar (urgency/free shipping), Inline Promo (cross-sell) |
| Landing page | Hero Banner (campaign hero), CTA Button (primary conversion) |

### Audience to Spot Customization

| Audience Type | Spot Preferences | Avoid |
|---|---|---|
| New Visitors | Hero Banner (welcome/intro), Text Block (value prop) | Modals (friction) |
| Returning Customers | Inline Promo (new arrivals), Sticky Bar (loyalty) | Generic hero content |
| Cart Abandoners | Sticky Bar (urgency), Hero Banner (reminder) | Upsell-heavy content |
| VIP / Loyal | Sticky Bar (exclusive offer), Hero Banner (VIP access) | Discount-heavy messaging |
| Bargain Seekers | Hero Banner (deals), Sticky Bar (flash sale countdown) | Premium-only messaging |

## Output Format

Emit a single JSON block inside a `spot-recommendation-json` code fence:

```jsonc
{
  "recommendations": [
    {
      "pageId": "string — page ID from available pages",
      "pageName": "string — human-readable page name",
      "pageType": "homepage | product | category | cart | landing | other",
      "recommendedSpots": [
        {
          "spotId": "string — existing spot ID if available, or 'suggested-{n}'",
          "spotName": "string — descriptive name for the spot",
          "spotType": "hero_banner | skyscraper | cta_button | text_block | image | custom",
          "selector": "string — CSS selector (from web analysis or suggested)",
          "priority": "high | medium | low",
          "reasoning": "string — why this spot matters for this campaign + audience",
          "suggestedTargetingMode": "default_only | segment_variants",
          "audienceAlignment": [
            {
              "segmentName": "string — segment name from Step 2",
              "messagingAngle": "string — brief suggestion for this segment on this spot"
            }
          ]
        }
      ],
      "pageRelevanceScore": "high | medium | low",
      "pageRelevanceReason": "string — why this page matters for the campaign"
    }
  ],
  "summary": {
    "totalPages": "number — count of pages with recommendations",
    "totalSpots": "number — total recommended spots across all pages",
    "topPrioritySpots": ["string — ordered list of top 3-5 spot names across all pages"],
    "strategyNote": "string — 1-2 sentence strategic rationale tying spots to campaign goal"
  }
}
```

## Quality Rules

1. **Only recommend spots on existing pages** — Every `pageId` must correspond
   to a page in the available pages data. Do not invent pages.

2. **Match segment names** — Every `segmentName` in `audienceAlignment` must
   match a segment from the Step 2 selection. Use exact names.

3. **1-4 spots per page** — Keep recommendations focused. More than 4 spots
   per page is overwhelming for content creation.

4. **Above-the-fold priority** — High-priority spots should be elements that
   are visible without scrolling (hero banners, sticky bars, primary CTAs).

5. **Mobile awareness** — If a spot type is typically desktop-only (e.g.,
   skyscraper sidebars), note this in the reasoning.

6. **Reuse web analysis data** — If web analysis data is available, reuse
   exact selectors and spot IDs from the analysis. Do not generate new
   selectors when existing ones are available.

7. **Targeting mode guidance** — Recommend `segment_variants` when different
   audience segments should see different content. Recommend `default_only`
   when the same personalized content works for all segments.

8. **Actionable messaging angles** — Each `messagingAngle` should be specific
   enough to guide content creation, not generic platitudes.
   Good: "Show loyalty points balance and exclusive early access badge"
   Bad: "Personalize for this audience"
