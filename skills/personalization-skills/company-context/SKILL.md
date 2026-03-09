---
name: company-context
description: >
  Gathers and structures company intelligence — industry, regulations, competitors,
  benchmarks, personas — so downstream skills (campaign-brief, copywriter,
  brand-compliance) can produce better, more informed output. Use when the user
  provides company details, sets up or updates company context, mentions competitors
  or personas, shares a URL to build a company profile from, or discusses industry
  regulations and benchmarks, even if they don't explicitly say "company context."
---

# Company Context Skill

## Full vs Partial Output

Use the **full** output (`company-context-json`) when the user is setting up
context from scratch or providing comprehensive company information. Use the
**partial update** output (`company-context-update-json`) when the user is adding
or modifying individual items (e.g., "add a competitor", "update our industry").

## Schema

### Full Company Context

```jsonc
{
  "companyDescription": {
    "name": "string — company name",
    "description": "string — 1-2 sentence company description",
    "products": ["string — key products or product categories"],
    "source": "user-provided | ai-inferred"
  },
  "industry": {
    "primary": "string — primary industry (e.g. 'E-commerce', 'Financial Services')",
    "subIndustry": "string — sub-industry or vertical (e.g. 'Fashion Retail', 'Wealth Management')",
    "source": "user-provided | ai-inferred"
  },
  "regulatoryFrameworks": [
    {
      "name": "string — regulation name (e.g. 'GDPR', 'FTC Guidelines', 'CCPA')",
      "description": "string — brief description of the regulation",
      "copyImplications": ["string — specific implications for marketing copy"],
      "source": "user-provided | ai-inferred"
    }
  ],
  "seasonalTrends": [
    {
      "event": "string — event or season name (e.g. 'Black Friday', 'Back to School')",
      "timing": "string — when it occurs (e.g. 'Late November', 'August-September')",
      "relevance": "string — why it matters for this company",
      "source": "user-provided | ai-inferred"
    }
  ],
  "categoryBenchmarks": [
    {
      "metric": "string — metric name (e.g. 'Email Open Rate', 'Conversion Rate')",
      "industryAverage": "string — typical value (e.g. '2.5%', '$45')",
      "topQuartile": "string — top performer value (e.g. '4.2%', '$72')",
      "source": "user-provided | ai-inferred"
    }
  ],
  "competitors": [
    {
      "name": "string — competitor company name",
      "description": "string — 1-sentence description of the competitor",
      "valueProps": ["string — their key value propositions"],
      "differentiators": ["string — how we differ from them"],
      "source": "user-provided | ai-inferred"
    }
  ],
  "personas": [
    {
      "name": "string — persona name (e.g. 'Budget-Conscious Parent')",
      "role": "string — their role or relationship to the product",
      "demographics": "string — key demographic info",
      "goals": ["string — what they want to achieve"],
      "painPoints": ["string — frustrations or challenges"],
      "preferredChannels": ["string — where they engage (e.g. 'Instagram', 'Email')"],
      "messagingAngle": "string — recommended messaging approach for this persona",
      "source": "user-provided | ai-inferred"
    }
  ],
  "lastUpdated": "string — ISO datetime"
}
```

### Partial Update

When updating individual fields, emit only the changed fields. Array fields
(competitors, personas, regulatoryFrameworks, seasonalTrends, categoryBenchmarks)
will be **appended** to existing data, with deduplication by name. Scalar fields
(companyDescription, industry) will **overwrite** existing values.

## URL-Based Context Building

When a `<website-content>` block is present in the message, the user wants to
build company context from a website URL. Follow this protocol:

### 1. Extract from Website Content

Use the `<website-content>` data as the primary source:
- **companyDescription.name**: Extract from the `title`, headings, or hostname.
- **companyDescription.description**: Synthesize from `metaDescription`, headings, and body text.
- **companyDescription.products**: Identify products/services from headings, body text, and navigation links.
- **industry**: Infer primary industry and sub-industry from the website content.
- Mark all facts derived from the website as `source: "user-provided"`.

### 2. Deep Research Protocol

After extracting from the website, use **WebSearch** to research and fill in the
remaining context fields. Limit to **3-5 web searches** to avoid timeout:

1. **Competitors**: Search `"[company name] competitors"` or `"[company name] alternatives"`.
   Populate the `competitors` array with 3-5 results including value props and differentiators.
2. **Category Benchmarks**: Search `"[industry] marketing benchmarks 2026"`.
   Populate `categoryBenchmarks` with realistic industry metrics.
3. **Regulatory Frameworks**: Search `"[industry] regulations marketing compliance"`.
   Populate `regulatoryFrameworks` with relevant regulations and copy implications.
4. **Seasonal Trends**: Search `"[industry] seasonal trends marketing"`.
   Populate `seasonalTrends` with relevant events and timing.
5. **Competitor Deep Dive** (optional): Use **WebFetch** on 1-2 competitor websites
   to extract value propositions and differentiators for richer competitor entries.

### 3. Infer Personas

Based on the website content and industry research, infer 2-4 target personas.
Each persona should have specific goals, pain points, and a concrete messaging
angle. Mark these as `source: "ai-inferred"`.

### 4. Source Tagging

- `"user-provided"`: Facts directly from the website content (company name,
  description, products, anything explicitly stated on the site).
- `"ai-inferred"`: Data derived from web research (competitors, benchmarks,
  regulations, personas, seasonal trends).

### 5. Output

Always emit a **full `company-context-json`** code fence (not a partial update)
since you are building the context from scratch. Include all sections:
companyDescription, industry, regulatoryFrameworks, seasonalTrends,
categoryBenchmarks, competitors, personas, and lastUpdated.

## Extraction Guidelines

### Company Description
- **name**: Use the exact company name provided by the user.
- **description**: Write a concise 1-2 sentence description capturing what the
  company does and its market position.
- **products**: List key products or product categories. If the user mentions
  specific products, use those. Otherwise infer from context.
- **source**: `"user-provided"` if the user explicitly stated it, `"ai-inferred"`
  if you derived it from context.

### Industry
- **primary**: Categorize into a standard industry (E-commerce, Financial Services,
  Healthcare, Technology, Travel & Hospitality, Food & Beverage, Automotive,
  Education, Media & Entertainment, etc.).
- **subIndustry**: More specific vertical within the primary industry.

### Regulatory Frameworks
- Identify regulations relevant to the company's industry and geography.
- **copyImplications** must be specific and actionable for marketers — e.g.,
  "Must include opt-out language in email campaigns" rather than "Must comply
  with GDPR."
- Common frameworks: GDPR, CCPA/CPRA, FTC Guidelines, CAN-SPAM, HIPAA,
  PCI-DSS, SOX, FDA regulations, FCC rules.

### Seasonal Trends
- Identify key seasonal events relevant to the company's industry.
- **relevance** should explain why this event matters for this specific company,
  not just the industry in general.

### Category Benchmarks
- Provide realistic industry benchmarks for common marketing metrics.
- Benchmarks must be realistic and sourced from industry knowledge — do NOT
  fabricate precise numbers. Use ranges or approximations when uncertain.
- Common metrics: Conversion Rate, Email Open Rate, Click-Through Rate,
  Average Order Value, Customer Acquisition Cost, ROAS, Bounce Rate.

### Competitors
- **valueProps**: What the competitor claims or is known for (2-3 items).
- **differentiators**: How the user's company is different or better (2-3 items).
  If the user doesn't specify, infer reasonable differentiators.
- Never fabricate competitor details. If uncertain, mark `source: "ai-inferred"`
  and note assumptions in your conversational response.

### Personas
- **name**: Use a descriptive name that captures the persona's defining trait.
- **role**: Their relationship to the product (buyer, influencer, end-user, etc.).
- **goals** and **painPoints**: Make these specific and actionable, not generic.
- **messagingAngle**: A concrete recommendation for how to message to this
  persona — this is directly consumed by the campaign-brief and copywriter skills.
- Each persona must be distinct enough to warrant different messaging.

## Output Format

### Full Context

Wrap the JSON in a `company-context-json` code fence:

````
```company-context-json
{
  "companyDescription": { ... },
  "industry": { ... },
  "regulatoryFrameworks": [ ... ],
  "seasonalTrends": [ ... ],
  "categoryBenchmarks": [ ... ],
  "competitors": [ ... ],
  "personas": [ ... ],
  "lastUpdated": "2026-02-19T12:00:00Z"
}
```
````

### Partial Update

Wrap the JSON in a `company-context-update-json` code fence. Only include
fields that changed:

````
```company-context-update-json
{
  "competitors": [
    {
      "name": "NewCo",
      "description": "Emerging competitor in the premium segment",
      "valueProps": ["Premium quality", "Sustainable materials"],
      "differentiators": ["We offer better pricing", "Wider product range"],
      "source": "user-provided"
    }
  ],
  "lastUpdated": "2026-02-19T12:00:00Z"
}
```
````

You may include conversational text before or after the code fence. Before the
fence, summarize what you captured. After the fence, confirm what was saved and
suggest what else the user might want to add.

## Edge Cases

### Minimal Input

If the user provides only a company name (e.g., "Set up company context for Acme")
without additional details, infer what you can from general knowledge, mark all
inferred fields as `source: "ai-inferred"`, and ask what additional details they
can provide — particularly competitors, target personas, and any regulatory
constraints specific to their business.

### Existing Context

When company context already exists, a full `company-context-json` output
**replaces** all fields. If the user only wants to change a few things, suggest
using a partial update instead. When in doubt, ask whether they want to replace
or update.

## Quality Rules

1. **Never fabricate company details.** If the user says "we're a fashion
   retailer," don't invent their product catalog. Use `source: "ai-inferred"`
   for anything derived from context and note assumptions.
2. **Source-track everything.** Every section must have a `source` field. This
   lets the user distinguish between what they told you and what you inferred.
3. **Benchmarks must be realistic.** Use well-known industry ranges. If you're
   unsure about a specific metric, use a range or omit it rather than guessing.
4. **Competitors need value props.** A competitor entry without value props and
   differentiators is not actionable. Ask for more details if needed.
5. **Personas must be actionable.** Each persona should have enough detail that
   a copywriter could write segment-specific messaging from it. If a persona
   is too vague, ask clarifying questions.
6. **Partial updates should be minimal.** When the user says "add a competitor,"
   only emit the `competitors` array and `lastUpdated` — don't re-emit the
   entire context.
7. **Always set `lastUpdated`** to the current ISO datetime.

## Examples

### Example 1: Full Context Setup

**User message:**
> Set up company context for TechStyle. We're a fashion e-commerce company selling
> clothing and accessories online. Our competitors are ASOS, Zara, and H&M. Target
> personas are budget-conscious millennials and trend-seeking Gen Z shoppers.

```company-context-json
{
  "companyDescription": {
    "name": "TechStyle",
    "description": "Online fashion retailer specializing in clothing and accessories, targeting young, style-conscious consumers.",
    "products": ["Clothing", "Accessories"],
    "source": "user-provided"
  },
  "industry": {
    "primary": "E-commerce",
    "subIndustry": "Fashion Retail",
    "source": "ai-inferred"
  },
  "regulatoryFrameworks": [
    {
      "name": "FTC Guidelines",
      "description": "Federal Trade Commission rules on advertising disclosures and endorsements",
      "copyImplications": [
        "Discount claims must reflect genuine price reductions",
        "Influencer partnerships must be clearly disclosed"
      ],
      "source": "ai-inferred"
    }
  ],
  "seasonalTrends": [
    {
      "event": "Black Friday / Cyber Monday",
      "timing": "Late November",
      "relevance": "Peak sales period for online fashion — highest traffic and conversion window",
      "source": "ai-inferred"
    }
  ],
  "categoryBenchmarks": [
    {
      "metric": "Conversion Rate",
      "industryAverage": "1.5-2.5%",
      "topQuartile": "3.5-5%",
      "source": "ai-inferred"
    }
  ],
  "competitors": [
    {
      "name": "ASOS",
      "description": "Global online fashion retailer targeting 20-somethings with a wide product range",
      "valueProps": ["Massive product selection", "Free returns", "Fast delivery"],
      "differentiators": ["TechStyle offers more curated selections", "Stronger personalization"],
      "source": "user-provided"
    }
  ],
  "personas": [
    {
      "name": "Budget-Conscious Millennial",
      "role": "Primary buyer — shops for value and versatility",
      "demographics": "Ages 28-40, mid-range income, urban/suburban",
      "goals": ["Find stylish clothing at affordable prices", "Build a versatile wardrobe"],
      "painPoints": ["Overwhelmed by choices", "Skeptical of quality at low price points"],
      "preferredChannels": ["Email", "Instagram", "Web"],
      "messagingAngle": "Lead with value and versatility — show how pieces work across multiple outfits and occasions. Emphasize quality-to-price ratio.",
      "source": "user-provided"
    }
  ],
  "lastUpdated": "2026-02-19T12:00:00Z"
}
```

### Example 2: Partial Update — Add a Competitor

**User message:**
> Add Shein as a competitor. They're known for ultra-low prices and viral social media marketing.

```company-context-update-json
{
  "competitors": [
    {
      "name": "Shein",
      "description": "Ultra-fast fashion retailer with aggressive social media marketing and rock-bottom prices",
      "valueProps": ["Extremely low prices", "Massive product catalog", "Viral social media presence"],
      "differentiators": ["TechStyle offers higher quality materials", "Better sustainability practices", "More curated shopping experience"],
      "source": "user-provided"
    }
  ],
  "lastUpdated": "2026-02-19T14:30:00Z"
}
```
