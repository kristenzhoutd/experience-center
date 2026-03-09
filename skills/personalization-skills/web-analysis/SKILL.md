---
name: web-analysis
description: >
  Analyzes a website URL to automatically detect personalization slots (hero banners,
  skyscrapers, sticky bars, modals, CTAs, inline promos, text blocks, images).
  Produces a structured JSON output of detected content spots suitable for
  web personalization campaigns.
---

# Web Analysis Skill

## When to Use

Activate this skill when the user wants to analyze a website for personalization
opportunities. Trigger phrases include:

- "Analyze this website"
- "Find personalization spots on ..."
- "Scan this URL for content slots"
- "Identify content slots on ..."
- "What can we personalize on ..."
- "Detect slots on ..."
- Any message containing a URL paired with terms like "personalize", "spots",
  "slots", "banner", "content areas", or "analyze"

## Input Context

When a URL is detected in the user's message, the system will automatically
fetch and parse the page, injecting structured extraction data in
`<web-extraction>` tags. Use this data as the primary source for your analysis.

If no `<web-extraction>` data is provided (e.g., the user describes a page
without providing a URL), operate in LLM-only mode: infer likely personalization
slots based on common page patterns for the described website type.

## Slot Detection Taxonomy

Map detected slots to these content spot types:

| Slot Type | ContentSpotType Value | Typical Signals |
|---|---|---|
| Hero Banner | `hero_banner` | Large above-the-fold section with heading + image/background |
| Skyscraper / Sidebar | `skyscraper` | Narrow vertical rail, aside element, complementary role |
| CTA Button | `cta_button` | Prominent button/link with action text (Shop Now, Sign Up) |
| Text Block | `text_block` | Promotional section, feature highlights, value propositions |
| Image / Carousel | `image` | Picture elements, image galleries, carousels, sliders |
| Sticky Bar | `custom` | Fixed/sticky notification bars, announcement strips |
| Modal / Popup | `custom` | Dialog elements, overlay popups, lightboxes |
| Inline Promo | `custom` | Mid-page promotional insertions, cross-sell blocks |

## CRO Analysis Framework

After detecting personalization spots, analyze the page for conversion
optimization opportunities. Evaluate across these dimensions, in order of
impact:

### 1. Value Proposition Clarity (Highest Impact)

- Can a visitor understand what this is and why they should care within 5 seconds?
- Is the primary benefit clear, specific, and differentiated?
- Is it written in the customer's language (not company jargon)?
- **Common issues**: Feature-focused instead of benefit-focused; too vague or
  too clever; trying to say everything instead of the most important thing.

### 2. Headline Effectiveness

- Does it communicate the core value proposition?
- Is it specific enough to be meaningful?
- **Strong patterns**: Outcome-focused ("Get [outcome] without [pain]"),
  specific numbers/timeframes, social proof ("Join 10,000+ teams").

### 3. CTA Placement, Copy, and Hierarchy

- Is there one clear primary action visible without scrolling?
- Does the button copy communicate value, not just action?
  - Weak: "Submit," "Sign Up," "Learn More"
  - Strong: "Start Free Trial," "Get My Report," "See Pricing"
- Are CTAs repeated at key decision points?

### 4. Trust Signals and Social Proof

- Customer logos, testimonials with specifics and attribution, case study
  snippets with real numbers, review scores, security badges.
- **Placement**: Near CTAs and after benefit claims.

### 5. Objection Handling

- Are common objections addressed? (Price/value, "will this work for me?",
  implementation difficulty, "what if it doesn't work?")
- Methods: FAQ sections, guarantees, comparison content, process transparency.

### 6. Friction Points

- Too many form fields, unclear next steps, confusing navigation, mobile
  experience issues, long load times, required information that shouldn't be
  required.

## Output Format

Emit a single JSON block inside a `web-analysis-json` code fence:

```jsonc
{
  "websiteUrl": "string — the analyzed URL",
  "websiteName": "string — site name or hostname",
  "pageName": "string — page title or descriptive name",
  "pageSummary": "string — 1-2 sentence summary of the page purpose and content",
  "spots": [
    {
      "name": "string — descriptive slot name (e.g. 'Hero Banner', 'Sidebar Rail')",
      "type": "hero_banner | skyscraper | cta_button | text_block | image | custom",
      "selector": "string — valid CSS selector targeting this element",
      "confidence": "high | medium | low",
      "reasoning": "string — why this slot was identified and what signals support it",
      "dimensions": {
        "width": "string — estimated or detected width (e.g. '100%', '300px')",
        "height": "string — estimated or detected height (e.g. '600px', 'auto')"
      },
      "currentContent": {
        "text": "string — truncated current text content (max 200 chars)",
        "imageUrl": "string — URL of primary image if present",
        "hasImage": "boolean — whether the slot contains image content"
      },
      "personalizationPotential": "high | medium | low"
    }
  ],
  "croAnalysis": {
    "overallScore": "string — good | needs_work | poor",
    "quickWins": [
      {
        "area": "string — which CRO dimension (e.g. 'CTA Copy', 'Value Proposition')",
        "issue": "string — what's wrong",
        "recommendation": "string — specific fix",
        "impact": "high | medium"
      }
    ],
    "highImpactChanges": [
      {
        "area": "string — which CRO dimension",
        "issue": "string — current problem",
        "recommendation": "string — what to change and why",
        "impact": "high"
      }
    ],
    "testIdeas": [
      {
        "hypothesis": "string — what to test and expected outcome",
        "element": "string — which page element to test",
        "variants": "string — suggested A/B variant description"
      }
    ]
  }
}
```

## Quality Rules

1. **Valid CSS selectors** — Every `selector` must be a syntactically valid CSS
   selector. Prefer `#id` > `[data-testid]` > `.stable-class` > tag path.
   Never use hashed/generated class names (e.g., `css-1a2b3c`, `sc-xyz123`).

2. **3-10 spots per page** — Aim for 3-10 spots. Fewer than 3 suggests the
   page is too simple or detection missed opportunities. More than 10 is
   overwhelming for campaign setup.

3. **Confidence levels** — Map to signal strength:
   - `high` — Multiple strong signals (semantic role + descriptive class + structural position)
   - `medium` — At least one strong signal (semantic element or descriptive class)
   - `low` — Inferred from position/context only

4. **Personalization potential** — Rate based on:
   - `high` — Above-the-fold, high-visibility, content-rich (hero banners, sticky bars, primary CTAs)
   - `medium` — Visible but secondary (sidebars, inline promos, carousels)
   - `low` — Below-the-fold or niche (footer sections, deeply nested content)

5. **Deduplication** — Never report the same DOM element as two different spots.

6. **Descriptive names** — Use human-readable names like "Hero Banner",
   "Product Recommendation Rail", "Free Shipping Bar" rather than technical
   names like "div-3" or "section-hero-123".

7. **When using `<web-extraction>` data** — Preserve the exact selectors from
   the extraction. Enhance with better names and reasoning based on context.

8. **LLM-only mode** — When no extraction data is available, suggest realistic
   spots with generic but plausible selectors (e.g., `[data-section="hero"]`,
   `.hero-banner`, `#main-cta`). Clearly note in reasoning that these are
   suggestions and may need adjustment.

9. **Always include `croAnalysis`** — Every web analysis should include CRO
   recommendations. Provide at least 2 quick wins, 1-2 high-impact changes,
   and 1-2 test ideas. Base recommendations on what you can observe in the
   page content, structure, and detected spots.

10. **CRO recommendations should be specific** — Don't say "improve the CTA."
    Say "Change the hero CTA from 'Learn More' to 'Start Free Trial' to
    communicate value instead of effort." Reference the actual page content
    in your recommendations.

11. **Connect spots to CRO** — When a personalization spot aligns with a CRO
    recommendation (e.g., hero banner has a weak headline), reference the
    spot name in the CRO analysis so the user can act on both together.
