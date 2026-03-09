---
name: campaign-brief
description: >
  Analyzes a user's campaign or personalization request and generates a structured
  campaign brief as JSON. The brief covers overview, audience, experience,
  and measurement sections — ready for rendering in the CampaignBriefEditor.
---

# Campaign Brief Skill

## When to Use

Activate this skill whenever the user describes a campaign, promotion, sale,
personalization request, or marketing initiative. Trigger phrases include but
are not limited to:

- "Create a ... campaign"
- "Build a personalization for ..."
- "Launch a ... sale"
- "Set up a ... experience for ..."
- "I want to target ... with ..."
- Any message mentioning audiences, A/B tests, or KPIs in a campaign context.

## Brief Schema

Generate a JSON object matching this schema exactly. Every field is required;
use an empty string `""` or empty array `[]` when no value can be inferred.

```jsonc
{
  "overview": {
    "campaignName": "string — descriptive campaign name",
    "objective": "string — 1-2 sentence campaign objective",
    "businessGoal": "string — primary business goal (e.g. Increase Conversion Rate)",
    "timelineStart": "string — ISO date YYYY-MM-DD",
    "timelineEnd": "string — ISO date YYYY-MM-DD"
  },
  "audience": {
    "primaryAudience": "string — main audience segment name",
    "segments": ["string — segment names"],
    "recommendedAudiences": [
      {
        "name": "string — segment name",
        "description": "string — 1-sentence behavioral description of the segment",
        "status": "new",
        "estimatedSize": "string — estimated profile count (e.g. '~45K', '~1.2M')",
        "isSelected": true
      }
    ]
  },
  "experience": {
    "headline": "string — primary headline for the campaign creative (default/fallback)",
    "bodyMessage": "string — supporting body copy (default/fallback)",
    "ctaText": "string — call-to-action button text (default/fallback)",
    "segmentMessages": [
      {
        "segmentName": "string — matches a segment from audience.segments",
        "messages": [
          {
            "headline": "string — segment-specific headline",
            "bodyMessage": "string — segment-specific body copy",
            "ctaText": "string — segment-specific CTA"
          }
        ]
      }
    ],
    "spotCreatives": [
      {
        "spotId": "string — spot id from available-pages",
        "spotName": "string — spot name",
        "spotType": "string — spot type (headline, cta_button, hero_image, etc.)",
        "pageName": "string — page name",
        "pageId": "string — page id",
        "defaultContent": { "headline": "...", "bodyMessage": "...", "ctaText": "..." },
        "segmentContent": [
          { "segmentName": "string — matches audience.segments", "content": { "headline": "...", "bodyMessage": "...", "ctaText": "..." } }
        ]
      }
    ]
  },
  "measurement": {
    "primaryKpi": "string — single most important KPI",
    "secondaryKpis": ["string — additional KPIs"],
    "secondaryMetrics": ["string — supporting metrics"],
    "successCriteria": ["string — measurable success thresholds"],
    "risks": ["string — potential risks or challenges"]
  }
}
```

## Extraction Guidelines

Follow these rules when populating the brief from the user's message:

### Overview
- **campaignName**: Derive from the campaign theme or seasonal event. Append
  "Web Personalization Campaign" (e.g. "Black Friday Web Personalization Campaign").
- **objective**: Write a concise 1-2 sentence objective that captures the campaign intent.
- **businessGoal**: Infer from context — engagement keywords map to
  "Boost Customer Engagement", retention/loyalty to "Improve Customer Retention",
  revenue/AOV to "Maximize Revenue", brand/awareness to "Increase Brand Awareness".
  Default: "Increase Conversion Rate".
- **timelineStart / timelineEnd**: Infer from seasonal keywords (Black Friday:
  Nov 25-30, Summer: Jun 1 - Aug 31, Holiday: Dec 1-31, etc.). If unspecified,
  use a reasonable 3-week window starting from the current date.
### Audience
- **primaryAudience**: The first or most prominent audience mentioned.
- **segments**: Extract all audience segments mentioned (New Visitors, Returning
  Customers, VIP, Cart Abandoners, Loyal Members, etc.). If none mentioned,
  default to ["New Visitors", "Returning Customers", "Loyal Members"].
- **recommendedAudiences**: For each segment in `segments`, generate a recommended
  audience entry with:
  - `name`: The segment name (must match a value in `segments`)
  - `description`: A 1-sentence behavioral description (e.g. "Customers with 2+
    purchases in the last 90 days")
  - `status`: Always `"new"` (the client will reconcile with existing TDX segments)
  - `estimatedSize`: An estimated profile count for the segment, prefixed with `~`
    (e.g. `"~45K"`, `"~1.2M"`). Base estimates on typical audience proportions:
    New Visitors ~25-35% of total, Returning Customers ~15-25%, Loyal Members
    ~5-10%, Cart Abandoners ~10-15%, Lapsed Customers ~10-20%, VIP ~3-5%.
    The client will replace with actual counts for existing TDX segments.
  - `isSelected`: `true` by default

### Experience
- **headline / bodyMessage / ctaText**: These serve as the DEFAULT (fallback)
  creative. Generate a compelling, on-brand version incorporating the campaign theme.
- **segmentMessages**: For each segment in `audience.segments`, generate 2-3
  message variants with distinct creative angles. When `<available-pages>` spots
  are available, tailor messaging to match the spot types (e.g. short punchy copy
  for CTA buttons, longer narrative for headline spots, visual descriptions for
  hero images):
  - **New Visitors** → discovery/welcome angles (e.g. welcome offer, bestsellers)
  - **Returning Customers** → continuity/new arrivals angles
  - **Loyal Members** → exclusivity/rewards angles
  - **Cart Abandoners** → urgency/reminder angles
  - **Lapsed Customers** → winback/re-engagement angles
  - Each variant must have a unique `headline`, `bodyMessage`, and `ctaText`.

### Company Context
When `<company-context>` tags are present in the conversation context, use the
structured company intelligence to enhance the brief:
- **Benchmarks for KPIs**: Use `categoryBenchmarks` to set realistic
  `successCriteria` and inform `primaryKpi`/`secondaryKpis` targets.
- **Regulatory frameworks**: Check `regulatoryFrameworks.copyImplications` and
  apply them as constraints on all generated headlines, body messages, and CTAs.
  Note any applied regulations in your conversational response.
- **Competitors**: Use `competitors.differentiators` to ensure campaign messaging
  emphasizes differentiation. Avoid messaging that could be confused with
  competitor value props.
- **Personas**: Map `personas` to `audience.segments` and use each persona's
  `messagingAngle` to inform `segmentMessages`. Align headline/body/CTA tone
  with the persona's `preferredChannels` and `painPoints`.
- **Seasonal trends**: Cross-reference `seasonalTrends` with the campaign
  timeline to enhance the objective and messaging relevance.

### Brand Compliance
When `<brand-guidelines>` tags are present in the conversation context, generate
all headlines, body messages, and CTAs in strict conformance with:
- Brand voice and tone rules
- Prohibited and required terminology
- Messaging hierarchy and formatting rules
- Note any guideline sections applied in your conversational response (not in JSON).

### Available Pages & Spots
When `<available-pages>` tags are present in the conversation context, the user
has already configured website pages with personalization spots.

Page descriptions are generated by the `page-description` skill and saved per
page. Each description captures the page's purpose, visitor intent, and
personalization opportunities. When a page has a `description` field, use it to
write better personalized content:

- **Match copy to page purpose and visitor intent.** A homepage hero should
  use broad discovery messaging; a product page CTA should use high-intent
  conversion copy; a checkout page banner should use urgency/reassurance
  language. The description tells you what visitors expect on each page —
  write content that fits that context.
- **Adapt segment messaging per page.** The same segment (e.g. "Loyal Members")
  should receive different copy on different pages. On a homepage, emphasize
  exclusivity and new arrivals; on a product page, emphasize personalized
  recommendations; on checkout, emphasize rewards or free shipping. Use the
  description's visitor-intent signal to choose the right angle.
- **Prioritize high-impact spots** identified in the description. Focus the
  strongest creative on spots the description calls out as most impactful
  for personalization (e.g. hero banners for awareness, CTAs for conversion).
- **Reference page context in your conversational response** — explain why
  certain pages/spots received specific creative treatment based on their
  descriptions.

When descriptions are absent, fall back to inferring page purpose from the
page name, URL, and spot types.

Use this data to:
- **Populate `spotCreatives`** with one entry per spot across all pages. For each
  spot, use the actual `spotId`, `spotName`, `spotType`, `pageName`, and `pageId`
  from the `<available-pages>` data. Generate:
  - `defaultContent`: tailored to both the spot type (see rules below) and the
    page's description (visitor intent, page purpose). Copy should feel native
    to the page context — not generic across all pages.
  - `segmentContent`: one entry per segment from `audience.segments`, each with
    content tailored to the segment angle, the spot type, AND the page context.
    The same segment should get different copy on different pages based on what
    the visitor is doing on that page.
- **Every spot MUST have unique messaging.** Never reuse the same headline,
  body, or CTA across multiple spots. Each spot serves a different purpose on
  the page — a hero banner introduces the campaign theme, a CTA drives action,
  a product recommendation section guides discovery. Write copy that reflects
  each spot's distinct role. Even two headline spots on different pages should
  have different wording that matches each page's context and visitor intent.
- **Tailor copy per spot type:**
  - `cta_button` spots → short, action-oriented copy (2-4 words for CTA text);
    headline and bodyMessage can be empty strings
  - `headline` / `header_greeting` spots → only `headline` (concise, under
    10 words); bodyMessage and ctaText should be empty strings — omit them
    unless the user specifically requests them
  - `hero_image` spots → strong headline + reference visual direction in body;
    ctaText can be empty string
  - `product_recommendation` spots → recommendation-oriented messaging with all
    three fields populated
  - `container` spots → only `bodyMessage` (the main rich-text content area);
    headline and ctaText are optional — omit them unless the user specifically
    requests them
  - `custom` or unknown types → populate all three fields
- **Still populate flat fields** (`headline`, `bodyMessage`, `ctaText`,
  `segmentMessages`) as fallbacks — use the most prominent spot's content
  (typically the hero or first headline spot).
- **Reference page names** in your conversational response to help the user
  understand where each placement will appear.
- **Omit `spotCreatives`** entirely when `<available-pages>` is NOT present.

If `<available-pages>` is NOT present, do not include `spotCreatives` in the
output.

### Measurement
- **primaryKpi**: Align with businessGoal — conversion → "Conversion Rate (CR)",
  engagement → "Pages per Session", retention → "Customer Lifetime Value (CLV)",
  revenue → "Revenue per Visitor (RPV)", awareness → "New Visitor Return Rate".
- **secondaryKpis**: Include 2-3 relevant secondary KPIs (e.g. Average Order Value,
  Revenue per Visitor, Click-Through Rate).
- **secondaryMetrics**: Include supporting metrics (Bounce Rate, Time on Site,
  Pages per Session, Add-to-Cart Rate).
- **successCriteria**: Generate 2-3 measurable targets
  (e.g. "+15% conversion rate vs control", "+10% average order value").
- **risks**: Include 2-3 relevant risks (e.g. "Low traffic during campaign period",
  "Creative fatigue from repeated exposure", "Audience overlap between segments").

## Output Format

Wrap the JSON brief in a `campaign-brief-json` code fence. This MUST appear in
your response so the application can detect and parse it:

````
```campaign-brief-json
{
  "overview": { ... },
  "audience": { ... },
  "experience": { ... },
  "measurement": { ... }
}
```
````

You may include conversational text before or after the code fence — the
application will extract only the JSON block.

## Quality Rules

1. **Fill intelligent defaults** for every field. Never leave a field as `null`
   or `undefined`. Use empty string `""` or empty array `[]` only when truly
   no value applies.
2. **Add `notes`** to any section where you had to make significant assumptions.
   Do NOT include notes in the JSON — they are only for your conversational
   response text.
3. **Use industry best practices** for KPIs and success criteria. Tie them to
   the stated business goal.
4. **Be specific and actionable.** Avoid vague objectives like "improve things".
   Instead write "Increase homepage-to-PDP conversion rate by 15% for new visitors".
5. **Keep copy concise.** Headlines under 10 words, body messages under 30 words,
   CTAs under 4 words.
6. **Unique copy per spot.** Every `spotCreative` entry must have distinct
   messaging. Never duplicate headlines, body copy, or CTAs across spots.
   Each spot's content should reflect its specific role on the page.

## Examples

### Example 1: Seasonal Sale

**User message:**
> Create a Black Friday campaign targeting new visitors and loyal members with 30% off sitewide

**Expected output:**

```campaign-brief-json
{
  "overview": {
    "campaignName": "Black Friday Web Personalization Campaign",
    "objective": "Deliver personalized Black Friday shopping experiences to maximize sitewide sales with a 30% discount offer.",
    "businessGoal": "Increase Conversion Rate",
    "timelineStart": "2026-11-25",
    "timelineEnd": "2026-11-30"
  },
  "audience": {
    "primaryAudience": "New Visitors",
    "segments": ["New Visitors", "Loyal Members"],
    "recommendedAudiences": [
      { "name": "New Visitors", "description": "First-time site visitors with no purchase history", "status": "new", "estimatedSize": "~120K", "isSelected": true },
      { "name": "Loyal Members", "description": "Loyalty program members with high repeat purchase rate", "status": "new", "estimatedSize": "~35K", "isSelected": true }
    ]
  },
  "experience": {
    "headline": "Black Friday: 30% Off Everything",
    "bodyMessage": "Unlock exclusive Black Friday savings across all categories, curated just for you.",
    "ctaText": "Shop Now",
    "segmentMessages": [
      {
        "segmentName": "New Visitors",
        "messages": [
          { "headline": "Welcome — 30% Off Your First Order", "bodyMessage": "New here? Enjoy our biggest sale of the year with an exclusive welcome discount.", "ctaText": "Start Shopping" },
          { "headline": "Black Friday Picks for You", "bodyMessage": "Discover our best sellers and trending items, all at 30% off.", "ctaText": "Explore Deals" }
        ]
      },
      {
        "segmentName": "Loyal Members",
        "messages": [
          { "headline": "VIP Early Access: 30% Off + Free Shipping", "bodyMessage": "As a valued member, get early access and free shipping on all Black Friday deals.", "ctaText": "Shop Exclusives" },
          { "headline": "Your Loyalty Pays Off This Black Friday", "bodyMessage": "Stack your rewards points with 30% off sitewide for double the savings.", "ctaText": "Redeem & Save" }
        ]
      }
    ]
  },
  "measurement": {
    "primaryKpi": "Conversion Rate (CR)",
    "secondaryKpis": ["Average Order Value", "Revenue per Visitor"],
    "secondaryMetrics": ["Bounce Rate", "Time on Site", "Add-to-Cart Rate"],
    "successCriteria": ["+15% conversion rate vs control", "+10% average order value", "+20% revenue per visitor"],
    "risks": ["High competition during Black Friday weekend", "Creative fatigue from repeated exposure"]
  }
}
```

### Example 2: Retention Campaign

**User message:**
> I want to improve retention for lapsed customers with a free shipping offer via email and web

**Expected output:**

```campaign-brief-json
{
  "overview": {
    "campaignName": "Customer Winback Web Personalization Campaign",
    "objective": "Re-engage lapsed customers through personalized free shipping offers across email and web channels.",
    "businessGoal": "Improve Customer Retention",
    "timelineStart": "2026-03-01",
    "timelineEnd": "2026-03-21"
  },
  "audience": {
    "primaryAudience": "Lapsed Customers",
    "segments": ["Lapsed Customers"],
    "recommendedAudiences": [
      { "name": "Lapsed Customers", "description": "Previously active customers with no purchases in 90+ days", "status": "new", "estimatedSize": "~60K", "isSelected": true }
    ]
  },
  "experience": {
    "headline": "We Miss You — Free Shipping Inside",
    "bodyMessage": "Come back and enjoy free shipping on your next order. Your favorites are waiting.",
    "ctaText": "Shop Now",
    "segmentMessages": [
      {
        "segmentName": "Lapsed Customers",
        "messages": [
          { "headline": "We Miss You — Here's Free Shipping", "bodyMessage": "It's been a while! Come back and enjoy complimentary shipping on your next order.", "ctaText": "Return & Save" },
          { "headline": "A Lot Has Changed Since You Left", "bodyMessage": "Check out our newest arrivals and rediscover why you loved shopping with us.", "ctaText": "See What's New" }
        ]
      }
    ]
  },
  "measurement": {
    "primaryKpi": "Customer Lifetime Value (CLV)",
    "secondaryKpis": ["Reactivation Rate", "Repeat Purchase Rate"],
    "secondaryMetrics": ["Email Open Rate", "Click-Through Rate", "Time on Site"],
    "successCriteria": ["+10% reactivation rate for lapsed segment", "+5% repeat purchase rate within 30 days"],
    "risks": ["Low email deliverability for dormant accounts", "Audience too small for statistical significance"]
  }
}
```

### Example 3: Minimal Input

**User message:**
> Build a summer sale campaign

**Expected output:**

```campaign-brief-json
{
  "overview": {
    "campaignName": "Summer Sale Web Personalization Campaign",
    "objective": "Drive personalized summer shopping experiences to boost seasonal sales and engagement.",
    "businessGoal": "Increase Conversion Rate",
    "timelineStart": "2026-06-01",
    "timelineEnd": "2026-08-31"
  },
  "audience": {
    "primaryAudience": "New Visitors",
    "segments": ["New Visitors", "Returning Customers", "Loyal Members"],
    "recommendedAudiences": [
      { "name": "New Visitors", "description": "First-time site visitors with no purchase history", "status": "new", "estimatedSize": "~150K", "isSelected": true },
      { "name": "Returning Customers", "description": "Customers with 2+ purchases in the last 90 days", "status": "new", "estimatedSize": "~90K", "isSelected": true },
      { "name": "Loyal Members", "description": "Loyalty program members with high repeat purchase rate", "status": "new", "estimatedSize": "~40K", "isSelected": true }
    ]
  },
  "experience": {
    "headline": "Summer Deals Made for You",
    "bodyMessage": "Discover personalized offers and hand-picked recommendations for the season.",
    "ctaText": "Shop Now",
    "segmentMessages": [
      {
        "segmentName": "New Visitors",
        "messages": [
          { "headline": "Welcome — Summer Savings Start Here", "bodyMessage": "Explore our top summer picks, handpicked for first-time shoppers.", "ctaText": "Start Exploring" },
          { "headline": "New Here? Enjoy 10% Off", "bodyMessage": "Sign up and save on your first summer order with an exclusive welcome discount.", "ctaText": "Claim Offer" }
        ]
      },
      {
        "segmentName": "Returning Customers",
        "messages": [
          { "headline": "Welcome Back — Summer Arrivals Await", "bodyMessage": "We've added fresh summer picks since your last visit. See what's new.", "ctaText": "See What's New" },
          { "headline": "Your Summer Favorites Are Back", "bodyMessage": "Based on your history, we've curated summer deals you'll love.", "ctaText": "Continue Shopping" }
        ]
      },
      {
        "segmentName": "Loyal Members",
        "messages": [
          { "headline": "Members-Only Summer Preview", "bodyMessage": "Get exclusive early access to our summer collection before everyone else.", "ctaText": "Shop Exclusives" },
          { "headline": "Double Points This Summer", "bodyMessage": "Earn 2x loyalty points on all summer purchases. Your rewards, amplified.", "ctaText": "Shop & Earn" }
        ]
      }
    ]
  },
  "measurement": {
    "primaryKpi": "Conversion Rate (CR)",
    "secondaryKpis": ["Average Order Value", "Revenue per Visitor"],
    "secondaryMetrics": ["Bounce Rate", "Time on Site", "Pages per Session"],
    "successCriteria": ["+15% conversion rate vs control", "+10% average order value"],
    "risks": ["Low traffic during early summer", "Creative fatigue from extended campaign duration", "Audience overlap between segments"]
  }
}
```

### Example 4: With Available Pages (spotCreatives)

**User message:**
> Create a spring sale campaign for new visitors and loyal members

**With `<available-pages>` context providing:**
- Homepage (page-1): Hero Banner (hero_image, spot-a), Main CTA (cta_button, spot-b)
- Product Page (page-2): Product Recommendations (product_recommendation, spot-c)

**Expected output (experience section):**

```campaign-brief-json
{
  "overview": { "..." : "..." },
  "audience": { "..." : "..." },
  "experience": {
    "headline": "Spring Into Savings",
    "bodyMessage": "Fresh deals on spring essentials, curated just for you.",
    "ctaText": "Shop Now",
    "segmentMessages": [
      {
        "segmentName": "New Visitors",
        "messages": [
          { "headline": "Welcome — Spring Deals Await", "bodyMessage": "Explore trending spring picks for first-time shoppers.", "ctaText": "Start Exploring" }
        ]
      },
      {
        "segmentName": "Loyal Members",
        "messages": [
          { "headline": "VIP Spring Preview", "bodyMessage": "Early access to our spring collection for valued members.", "ctaText": "Shop Exclusives" }
        ]
      }
    ],
    "spotCreatives": [
      {
        "spotId": "spot-a",
        "spotName": "Hero Banner",
        "spotType": "hero_image",
        "pageName": "Homepage",
        "pageId": "page-1",
        "defaultContent": { "headline": "Spring Into Savings", "bodyMessage": "Fresh deals on spring essentials, curated just for you.", "ctaText": "" },
        "segmentContent": [
          { "segmentName": "New Visitors", "content": { "headline": "Welcome — Spring Deals Await", "bodyMessage": "Discover trending spring picks handpicked for you.", "ctaText": "" } },
          { "segmentName": "Loyal Members", "content": { "headline": "VIP Spring Preview", "bodyMessage": "Early access to our spring collection, just for members.", "ctaText": "" } }
        ]
      },
      {
        "spotId": "spot-b",
        "spotName": "Main CTA",
        "spotType": "cta_button",
        "pageName": "Homepage",
        "pageId": "page-1",
        "defaultContent": { "headline": "", "bodyMessage": "", "ctaText": "Shop Now" },
        "segmentContent": [
          { "segmentName": "New Visitors", "content": { "headline": "", "bodyMessage": "", "ctaText": "Start Exploring" } },
          { "segmentName": "Loyal Members", "content": { "headline": "", "bodyMessage": "", "ctaText": "Shop Exclusives" } }
        ]
      },
      {
        "spotId": "spot-c",
        "spotName": "Product Recommendations",
        "spotType": "product_recommendation",
        "pageName": "Product Page",
        "pageId": "page-2",
        "defaultContent": { "headline": "Trending This Spring", "bodyMessage": "Hand-picked recommendations based on your preferences.", "ctaText": "View All" },
        "segmentContent": [
          { "segmentName": "New Visitors", "content": { "headline": "Popular Spring Picks", "bodyMessage": "Our best sellers to get you started.", "ctaText": "Explore" } },
          { "segmentName": "Loyal Members", "content": { "headline": "Curated for You", "bodyMessage": "Recommendations based on your purchase history.", "ctaText": "View Picks" } }
        ]
      }
    ]
  },
  "measurement": { "..." : "..." }
}
```
