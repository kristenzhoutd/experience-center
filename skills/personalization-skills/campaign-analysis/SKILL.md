---
name: campaign-analysis
description: >
  Analyzes web personalization campaign performance — produces KPI data, conversion
  breakdowns by page/spot/creative, segment comparisons, and actionable recommendations.
  Returns structured analysis data as JSON for the analysis dashboard.
---

# Campaign Analysis Skill

## When to Use

Activate this skill when the user asks to analyze campaign performance. Trigger phrases:

- "Analyze campaign" / "analyze this campaign"
- "Campaign results" / "campaign performance"
- "How is my campaign performing?"
- "Performance report" / "campaign report"
- "Show me results" / "show me the data"
- Any request for post-launch campaign analysis or performance review

## Input Context

You will receive:

- `<campaign-config>` tags containing the campaign configuration data: name, dates,
  audiences, pages, spots, variants, and conversion event settings
- Optionally `<campaign-metrics>` tags with real performance data from analytics

**When no real metrics exist**, generate realistic simulated data that:
- Is internally consistent (conversions <= visitors, CTR = clicks/impressions)
- Reflects the campaign structure (correct page names, spot names, audience segments)
- Uses industry-reasonable benchmarks for web personalization campaigns
- Shows realistic variance across segments and pages (not all identical)
- Includes both strong and weak performers to make recommendations meaningful

## Output Schema

Return a complete analysis object:

```jsonc
{
  "campaign": {
    "id": "string — campaign identifier",
    "name": "string — campaign name",
    "status": "string — active|paused|completed|draft",
    "startDate": "string — ISO date",
    "endDate": "string — ISO date",
    "audiences": ["string — audience segment names"],
    "conversionEvent": "string — primary conversion event name"
  },
  "kpis": [
    {
      "id": "string — unique KPI identifier",
      "label": "string — display label (e.g. 'Unique Visitors')",
      "value": "number — current period value",
      "formattedValue": "string — display-formatted (e.g. '24,531' or '3.2%')",
      "previousValue": "number — previous period value",
      "trend": "string — up|down|flat",
      "trendValue": "number — absolute change",
      "trendFormatted": "string — e.g. '+12.3%' or '-0.5%'",
      "invertTrend": "boolean — optional, true if down is good (e.g. bounce rate)"
    }
  ],
  "aiInsights": {
    "summary": "string — 2-3 sentence executive summary of campaign performance",
    "suggestions": [
      {
        "type": "string — success|opportunity|warning",
        "title": "string — short title",
        "description": "string — detailed actionable recommendation referencing specific pages/spots",
        "impact": "string — high|medium|low",
        "category": "string — e.g. 'content', 'targeting', 'timing', 'creative'"
      }
    ]
  },
  "conversionByPage": [
    {
      "pageId": "string",
      "pageName": "string — page name from campaign config",
      "visitors": "number",
      "conversions": "number",
      "conversionRate": "number — percentage 0-100",
      "revenue": "number — optional",
      "bounceRate": "number — percentage 0-100",
      "personalizationLift": "number — percentage lift vs. default content"
    }
  ],
  "conversionBySpot": [
    {
      "pageId": "string",
      "pageName": "string",
      "spots": [
        {
          "spotId": "string",
          "spotName": "string — spot name from campaign config",
          "impressions": "number",
          "clicks": "number",
          "ctr": "number — percentage 0-100",
          "conversions": "number",
          "personalizationLift": "number — percentage lift"
        }
      ]
    }
  ],
  "ctrBreakdown": [
    {
      "label": "string — segment name or variant label",
      "ctr": "number — percentage 0-100",
      "impressions": "number",
      "clicks": "number"
    }
  ],
  "conversionByCreative": [
    {
      "creativeId": "string",
      "creativeName": "string",
      "variant": "string — variant label",
      "impressions": "number",
      "clicks": "number",
      "ctr": "number — percentage 0-100",
      "conversions": "number",
      "conversionRate": "number — percentage 0-100",
      "status": "string — winner|underperforming|neutral"
    }
  ],
  "segmentPerformance": [
    {
      "segmentId": "string",
      "segmentName": "string — audience segment name",
      "visitors": "number",
      "conversions": "number",
      "conversionRate": "number — percentage 0-100",
      "avgTimeOnPage": "number — seconds",
      "bounceRate": "number — percentage 0-100",
      "personalizationLift": "number — percentage lift"
    }
  ],
  "statisticalSignificance": {
    "confidenceLevel": "number — 0-100 (e.g. 95)",
    "sampleSizeAdequate": "boolean",
    "daysRemaining": "number — estimated days until significance (0 if already significant)",
    "notes": "string — explanation of statistical confidence"
  }
}
```

## Output Format

Wrap the JSON in a `campaign-analysis-json` code fence:

````
```campaign-analysis-json
{
  "campaign": { ... },
  "kpis": [ ... ],
  "aiInsights": { ... },
  "conversionByPage": [ ... ],
  "conversionBySpot": [ ... ],
  "ctrBreakdown": [ ... ],
  "conversionByCreative": [ ... ],
  "segmentPerformance": [ ... ],
  "statisticalSignificance": { ... }
}
```
````

## Quality Rules

1. **Minimum 4 KPIs** — Always include at least: Unique Visitors, Avg CTR, Avg Time on Page, Bounce Rate. Add Revenue or Conversions when relevant.

2. **Internal consistency** — All numbers must be mathematically consistent:
   - conversions <= visitors for every page and segment
   - CTR = clicks / impressions (within rounding)
   - Sum of segment visitors should approximately equal total unique visitors
   - Personalization lift should be plausible (typically 5-30% for web personalization)

3. **Specific suggestions** — Every suggestion must reference specific pages, spots, or segments by name from the campaign config. Never give generic advice like "improve your content."

4. **Minimum 3 suggestions** — At least 3 suggestions with at least 1 of type "opportunity."

5. **Honest statistical significance** — If the campaign is new or has low traffic, set `sampleSizeAdequate: false` and note the limitation. Don't claim significance without adequate sample size.

6. **Use campaign structure** — Page names, spot names, audience names, and conversion events must match what's in the campaign config. Don't invent pages or audiences that aren't configured.

7. **Segment-level comparison** — Show meaningful variance across segments. Different audiences should have different performance characteristics, not identical metrics.

8. **Creative status** — Mark at most 1 creative as "winner" per spot and at least 1 as "underperforming" if variance exists. Use "neutral" when differences aren't meaningful.

9. **Trend direction** — Set `invertTrend: true` for metrics where down is positive (bounce rate). Trend values should be realistic period-over-period changes.

10. **Personalization lift** — Always include personalization lift for pages, spots, and segments. This is the core value proposition — show how personalized content compares to default.

## Best Practices for Analysis

1. **Segment comparison** — Compare how each audience segment performs relative to others. Identify which segments benefit most from personalization.

2. **Page-level funnel** — Identify which pages drive conversions and where visitors drop off. Recommend focusing personalization on high-traffic, low-conversion pages.

3. **Spot effectiveness** — Rank content spots by engagement and conversion contribution. Highlight underperforming spots that need content refresh.

4. **Creative A/B results** — Present clear winners and underperformers per segment. Recommend rolling out winning variants.

5. **Personalization lift** — Quantify the delta between personalized and default content. This justifies the personalization investment.

6. **Statistical significance** — Be honest about whether observed differences are statistically meaningful. Small sample sizes should trigger cautious language.

7. **Mobile vs. desktop** — When relevant, note differences in performance across device types in suggestions.

8. **Time-based trends** — Reference trend direction in KPIs and suggest timing optimizations when patterns emerge.

9. **Impact prioritization** — Order suggestions by expected impact (high > medium > low). Give the most actionable items first.

10. **Conversion alignment** — Tie all metrics back to the primary conversion event. Frame spot/page/segment performance in terms of how they contribute to the conversion goal.
