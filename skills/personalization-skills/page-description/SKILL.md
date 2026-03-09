---
name: page-description
description: >
  Analyzes saved website pages and generates personalization-focused descriptions
  for each page. These descriptions help the campaign-brief skill make smarter
  decisions about which page+spot combos to prioritize. Use when the user asks
  about their pages' purpose, what personalization suits each page, or wants
  page descriptions — even if they don't explicitly say "page description."
---

# Page Description Skill

## Input

The conversation will include an `<available-pages>` block containing the user's
saved pages with their URLs, names, and spots. Use this data to infer each
page's purpose.

If no `<available-pages>` block is present in the conversation, ask the user to
save pages first before generating descriptions.

## Output Schema

Generate a JSON array inside a `page-description-json` code fence. Each entry
describes one page:

```jsonc
[
  {
    "pageId": "string - matches the page id from available-pages",
    "description": "string - 2-3 sentence description (see guidelines below)"
  }
]
```

## Description Guidelines

Each description should be 2-3 sentences covering:

1. **Page purpose**: What the page is for, inferred from URL path, page name,
   and spot types (e.g. homepage, product listing, checkout, landing page).
2. **Visitor intent**: What visitors expect to find on this page and their
   likely mindset (browsing, comparing, ready to buy, etc.).
3. **Personalization opportunities**: Which types of personalization would be
   most impactful on this page (audience-based hero banners, dynamic product
   recommendations, segment-specific CTAs, etc.), referencing the actual
   spots available.

### Inference Rules

- **URL path** is the strongest signal: `/`, `/home` = homepage; `/products`,
  `/shop`, `/catalog` = product listing; `/cart`, `/checkout` = checkout;
  `/about`, `/contact` = informational.
- **Page name** supplements the URL when available.
- **Spot types** indicate content opportunities:
  - `hero_image` / `headline` spots → high-impact visual personalization
  - `cta_button` spots → conversion-focused messaging
  - `product_recommendation` spots → behavioral/segment-based recommendations
  - `header_greeting` spots → personalized greetings by segment
  - `navigation` spots → audience-based navigation customization
- When in doubt, describe the page in general terms and focus on what the
  available spots enable.

### Quality Rules

1. Keep descriptions concise: 2-3 sentences, no more than 80 words.
2. Focus on personalization relevance, not generic page descriptions.
3. Reference specific spot types when explaining personalization potential.
4. Generate exactly one entry per page in `<available-pages>`.
5. Use the `pageId` from the input data exactly as provided.

## Output Format

Wrap the JSON array in a `page-description-json` code fence:

````
```page-description-json
[
  {
    "pageId": "page-abc123",
    "description": "Homepage is the primary entry point showcasing seasonal promotions and featured products. Visitors arrive with broad intent, making it ideal for audience-based personalization of hero banners by visitor segment and dynamic product recommendations based on browsing history."
  },
  {
    "pageId": "page-def456",
    "description": "Product listing page where visitors browse and compare items with purchase intent. The CTA button and product recommendation spots are high-impact targets for segment-specific messaging and personalized sorting based on visitor preferences."
  }
]
```
````

You may include conversational text before or after the code fence. The
application will extract only the JSON block.
