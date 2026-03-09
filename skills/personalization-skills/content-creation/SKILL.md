---
name: content-configuration
description: >
  Generates content configuration for web personalization spots. Produces per-page,
  per-spot default content and segment-targeted variants. Output matches the
  ContentConfiguration schema used by Step 3 of the Campaign Configuration Wizard.
---

# Content Configuration Skill

## When to Use

Activate this skill when the user asks for content suggestions during Step 3 of the
Campaign Configuration Wizard. Trigger phrases include:

- "Generate content for all spots"
- "Write a more urgent headline for loyalty members on the hero banner"
- "Create personalized variants for the homepage spots"
- "Suggest content for cart abandoners"
- Any request to generate or modify content for web personalization spots

## Input Context

You will receive:
- Campaign brief JSON (campaign name, objective, business goal, offer details)
- Pages configuration: list of pages with their configured spots (pageId, pageName, spotId, spotName, spotType, selector)
- Available segments/audiences list (names and IDs from Step 2)
- Optionally: existing content configuration (to fill missing fields only, do not overwrite user edits)

## Output Schema

Return a JSON object matching the ContentConfiguration structure:

```jsonc
{
  "pages": [
    {
      "pageId": "string — MUST match an existing page ID from Pages step",
      "pageName": "string",
      "pageUrlPattern": "string — URL pattern from Pages step",
      "spots": [
        {
          "spotId": "string — MUST match an existing spot ID from Pages step",
          "spotName": "string",
          "spotType": "string — e.g., CONTAINER, IMAGE, CTA, HEADING",
          "selector": "string — CSS selector from Pages step",
          "targetingMode": "default_only | segment_variants",
          "defaultVariant": {
            "headline": "string — under 10 words",
            "body": "string — under 30 words",
            "ctaText": "string — under 4 words",
            "imageUrl": "string — image URL or empty",
            "deepLinkUrl": "string — link destination or empty"
          },
          "variants": [
            {
              "variantId": "string — unique ID, prefix with var-new- for new variants",
              "audienceType": "segment",
              "audienceName": "string — MUST match a segment name from Step 2",
              "audienceRefId": "string — segment ID from Step 2",
              "priority": 1,
              "content": {
                "headline": "string",
                "body": "string",
                "ctaText": "string",
                "imageUrl": "string",
                "deepLinkUrl": "string"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Output Format

Wrap the JSON in a `content-configuration-json` code fence:

````
```content-configuration-json
{
  "pages": [
    {
      "pageId": "page-abc123",
      "pageName": "Homepage",
      "pageUrlPattern": "https://example.com/",
      "spots": [
        {
          "spotId": "spot-hero-1",
          "spotName": "Hero Banner",
          "spotType": "CONTAINER",
          "selector": "#hero-section",
          "targetingMode": "segment_variants",
          "defaultVariant": {
            "headline": "Welcome to Our Store",
            "body": "Discover curated products just for you.",
            "ctaText": "Shop Now",
            "imageUrl": "",
            "deepLinkUrl": "/collections"
          },
          "variants": [
            {
              "variantId": "var-new-1",
              "audienceType": "segment",
              "audienceName": "Loyalty Members",
              "audienceRefId": "seg-loyalty",
              "priority": 1,
              "content": {
                "headline": "Exclusive Rewards Await",
                "body": "Earn 3x points on your next purchase.",
                "ctaText": "View Rewards",
                "imageUrl": "",
                "deepLinkUrl": "/rewards"
              }
            }
          ]
        }
      ]
    }
  ]
}
```
````

## Marketing Psychology Techniques

When generating variant copy, apply these psychological principles to increase
persuasion and conversion. Choose techniques that match the campaign objective,
audience segment, and spot placement.

### Persuasion & Influence

| Technique | How to Apply | Best For |
|-----------|-------------|----------|
| **Loss Aversion** | Frame around what the visitor loses by not acting. "Don't miss your exclusive offer" > "Check out our offer" | Urgency campaigns, cart recovery, limited offers |
| **Scarcity & Urgency** | Highlight genuine limits — time ("Ends tonight"), quantity ("Only 3 left"), access ("Members only") | Flash sales, seasonal campaigns, loyalty exclusives |
| **Social Proof** | Reference crowd behavior — "Join 50,000+ members", "Bestseller", "Most popular plan" | Homepage heroes, signup CTAs, pricing pages |
| **Reciprocity** | Offer value first before asking — free guide, discount, useful tool | Lead gen, email capture, first-visit popups |
| **Authority Bias** | Cite expert endorsements, certifications, awards, press mentions | Trust-building spots, B2B campaigns |
| **Anchoring** | Present a higher reference point first to make the offer feel like a deal — "Was $99, now $49" | Pricing, promotional banners, upgrade CTAs |

### Cognitive Biases for Copy

| Bias | Copy Implication | Example |
|------|-----------------|---------|
| **Framing Effect** | Same info, different frame changes decisions. Frame positively for benefits, negatively for risk | "95% satisfaction rate" vs "Only 5% unsatisfied" |
| **Endowment Effect** | People value what they already have more. Use trial/preview language | "Your free trial is waiting" — they already "own" it |
| **Status-Quo Bias** | Reduce friction of switching. Emphasize ease and continuity | "Switch in 5 minutes — keep all your data" |
| **Paradox of Choice** | Too many options paralyze. Limit choices per spot, recommend one path | One primary CTA per spot, highlight "most popular" |
| **Peak-End Rule** | People judge by the peak moment and the end. Make CTAs and final impressions strong | End each content section with an emotionally resonant line |
| **Mere Exposure Effect** | Familiarity breeds preference. Consistent messaging across variants | Repeat core value prop with varied phrasing across spots |

### Applying Psychology to Variants

When creating segment-targeted variants, match psychology to segment:

- **New visitors** → Reciprocity (give value first), Social Proof (reduce
  uncertainty), Authority (build trust fast)
- **Returning visitors** → Endowment Effect (reference their history),
  Mere Exposure (reinforce familiar messaging)
- **Loyalty / VIP segments** → Scarcity (exclusive access), Loss Aversion
  (don't lose your perks), Reciprocity (reward their loyalty)
- **Cart abandoners** → Loss Aversion (items won't last), Anchoring
  (show savings), Urgency (limited stock/time)
- **Price-sensitive segments** → Anchoring (was/now pricing), Framing
  (cost per day vs total), Social Proof (popular choice)

Name the technique used in the variant's rationale or in your conversational
response so the user understands the persuasion strategy behind each variant.

## Quality Rules

1. **Page/spot IDs must match**: Only include pages and spots that exist in the provided Pages configuration. Never invent new page or spot IDs.
2. **Segment names must match**: Only use segment names and IDs from the provided segments list. Never invent segment names.
3. **Always include a defaultVariant**: Every spot must have a complete defaultVariant (applies to all visitors).
4. **Recommend 1–3 top pages**: If there are many pages, prioritize based on the campaign brief:
   - Conversion campaign → Homepage hero, PDP promo
   - Cart recovery → Cart page, mini-cart, homepage banner
   - Category push → Category page carousel, PDP module
5. **Create 0–3 variants per spot**: Only create segment variants if the campaign implies targeting. Use `targetingMode: "default_only"` if no segment targeting is needed for a spot.
6. **Copy constraints**: Headlines under 10 words, body under 30 words, CTA under 4 words.
7. **Tailor to spot type**: Consider the spot's type and location when generating content (hero banner gets prominent messaging, sidebar gets secondary offers, etc.).
8. **Preserve user edits**: If existing content configuration is provided, only fill in empty/missing fields. Do not overwrite content that the user has already edited.
