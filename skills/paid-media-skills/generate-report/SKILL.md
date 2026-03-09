---
name: generate-report
description: >
  Generates structured campaign performance reports with customizable sections.
  Returns report data as JSON with title, executive summary, metric sections,
  visualizations, and AI-generated insights.
---

# Generate Report Skill

## When to Use

Activate this skill when the user wants to create a campaign performance report.
Trigger phrases include but are not limited to:

- "Generate a report"
- "Create a campaign report"
- "Build a performance summary"
- "Give me a report for stakeholders"
- "Summarize campaign results"
- "Weekly / monthly performance report"
- "Prepare a deck on campaign performance"
- "Create an executive summary"
- "Show me a performance overview"
- Any request for formatted campaign reporting or executive summaries.

**Do NOT use when:**
- The user wants to see raw campaign data → use `diagnose-campaigns`
- The user wants to modify a brief → use `refine-campaign-brief`
- The user is asking about web personalization reporting → use personalization skills
- The user wants budget advice → use `recommend-budget-allocation`

## Input Context

You will receive:
- Campaign performance data (by channel, audience, creative, time period)
- Campaign configuration and brief
- Report preferences (time period, audience for the report, level of detail)
- Optional: `<report-template>` tag indicating which template to use
- Optional: comparison period data (e.g. previous month, previous campaign)
- Optional: specific sections or metrics the user wants highlighted

## Report Templates

When a template type is specified, generate sections appropriate for that template:

### executive-summary
Lead with KPI overview and AI summary. Generate **4 sections minimum**:
1. Executive Summary (`summary`) — high-level narrative
2. Key Performance Metrics (`metrics`) — top-line KPIs with period-over-period changes
3. Channel Breakdown (`table`) — performance by channel
4. Strategic Recommendations (`insights`) — AI-driven next steps

### campaign-performance
Detailed campaign-level analysis. Generate **5-6 sections**:
1. Performance Overview (`summary`)
2. Performance Trend (`chart`) — daily/weekly trend data
3. Campaign Performance Table (`table`) — campaign-level metrics
4. Budget Utilization (`metrics`) — budget pacing
5. ROAS Analysis (`comparison`)
6. Conversion Funnel (`chart`)

### creative-analysis
Creative format breakdown. Generate **5 sections**:
1. Format Performance (`table`)
2. Top Creatives (`table`)
3. Fatigue Status (`metrics`)
4. A/B Test Results (`comparison`)
5. Refresh Recommendations (`insights`)

### full-report
Comprehensive report. Generate **8+ sections** combining all above.

## Output Schema

Return a structured report object:

```jsonc
{
  "title": "string — report title (max 80 chars, e.g. 'Q1 2026 Paid Media Performance Report')",
  "subtitle": "string — campaign name or reporting period (max 60 chars)",
  "generatedAt": "string — ISO datetime (e.g. '2026-02-25T14:30:00Z')",
  "reportPeriod": {
    "start": "string — ISO date YYYY-MM-DD",
    "end": "string — ISO date YYYY-MM-DD"
  },
  "sections": [
    {
      "id": "string — unique section ID (kebab-case, e.g. 'exec-summary', 'key-metrics')",
      "title": "string — section heading (max 40 chars)",
      "type": "summary | metrics | chart | table | insights | comparison",
      "content": {
        // Structure varies by type — see Content Structures below
      },
      "order": "number — display order (1-based, sequential, no gaps)"
    }
  ],
  "aiSummary": "string — 3-5 sentence executive summary (max 500 chars)",
  "keyTakeaways": ["string — 3-5 bullet-point takeaways (each max 100 chars)"],
  "nextSteps": ["string — 3-5 recommended actions (each max 100 chars)"]
}
```

### Content Structures by Section Type

**summary:**
```jsonc
{ "text": "string — narrative paragraph (max 500 chars)" }
```

**metrics:**
```jsonc
{
  "metrics": [
    {
      "label": "string — metric name (max 30 chars)",
      "value": "string — formatted value (e.g. '$45,230', '3.2x', '2.4%')",
      "change": "string — vs comparison period (e.g. '+12%', '-5%')",
      "changeDirection": "up | down | flat",
      "status": "positive | negative | neutral"
    }
  ]
}
```

**chart:**
```jsonc
{
  "chartType": "line | bar | pie | area | funnel",
  "chartTitle": "string — chart title (max 40 chars)",
  "dataPoints": [
    {
      "label": "string — x-axis label or category",
      "values": { "key": "number" }
    }
  ]
}
```

**table:**
```jsonc
{
  "headers": ["string — column headers"],
  "rows": [["string — cell values"]]
}
```

**comparison:**
```jsonc
{
  "periods": [
    {
      "label": "string — period label (e.g. 'This Month', 'Last Month')",
      "metrics": { "key": "value" }
    }
  ]
}
```

**insights:**
```jsonc
{
  "insights": [
    {
      "type": "positive | negative | neutral | opportunity",
      "text": "string — insight statement (max 150 chars)"
    }
  ]
}
```

## Output Format

Wrap the JSON in a `report-json` code fence:

````
```report-json
{
  "title": "February 2026 Paid Media Performance Report",
  "subtitle": "Brand Awareness Campaign — Google + Meta",
  "generatedAt": "2026-02-25T14:30:00Z",
  "reportPeriod": { "start": "2026-02-01", "end": "2026-02-28" },
  "sections": [ ... ],
  "aiSummary": "...",
  "keyTakeaways": ["..."],
  "nextSteps": ["..."]
}
```
````

Before the code fence, provide a brief conversational summary of the report
highlights.

## Quality Rules

1. **If no campaign data is available, ask what campaign or time period to
   report on INSTEAD of generating empty data.**
2. **Structure for the audience.** Executive reports lead with summary and KPIs.
   Tactical reports include granular breakdowns.
3. **Include at minimum 4 sections:** Executive Summary, Key Metrics, Channel
   Performance, and Insights/Next Steps.
4. **Use consistent formatting.** Percentages with %, currency with $, large
   numbers with commas.
5. **Make comparisons meaningful.** Calculate percentage changes and indicate
   whether changes are positive or negative for the business (a CPA decrease
   is positive, a ROAS decrease is negative).
6. **AI summary should be stakeholder-ready.** Write as if presenting to a CMO.
7. **Separate findings from recommendations.** Report sections present data;
   nextSteps presents recommended actions.
8. **Order sections logically:** summary → metrics → breakdowns → insights → next steps.
9. **Match the template type** when specified. Include all sections for that template.
10. **Use realistic data.** Generate plausible metric values and trends that
    reflect real-world paid media patterns.
11. **Section IDs must be unique** within the report.
12. **Section order values must be sequential** starting at 1 with no gaps.

## Edge Cases

- **No performance data available**: Generate a report structure with placeholder
  metrics and note that real data will replace them once campaigns are running.
- **User asks for a specific date range with no data**: Note the data gap and
  suggest alternative date ranges where data may be available.
- **Multiple campaigns**: Generate a consolidated report unless the user specifies
  a single campaign. Include a campaign breakdown table.
- **User asks for both executive and detailed views**: Use the `full-report` template.

## Examples

### Example 1: Executive Summary Report

**User message:**
> Generate an executive summary report for February

**Expected output:**

Here's your February executive summary. Highlights: overall ROAS improved 18% month-over-month, with Google Search driving the strongest efficiency. Meta awareness spend is generating solid top-of-funnel volume but CPA is trending up.

```report-json
{
  "title": "February 2026 Paid Media Executive Summary",
  "subtitle": "Summer Shoe Collection Campaign",
  "generatedAt": "2026-02-25T14:30:00Z",
  "reportPeriod": { "start": "2026-02-01", "end": "2026-02-28" },
  "sections": [
    {
      "id": "exec-summary",
      "title": "Executive Summary",
      "type": "summary",
      "content": {
        "text": "February delivered strong performance across all channels, with total spend of $62,400 against a $75,000 monthly budget (83% utilization). Blended ROAS reached 3.8x, exceeding the 3.5x target. Google Search was the top performer at 4.5x ROAS. Meta CPA increased 8% month-over-month, warranting creative refresh."
      },
      "order": 1
    },
    {
      "id": "key-metrics",
      "title": "Key Performance Metrics",
      "type": "metrics",
      "content": {
        "metrics": [
          { "label": "Total Spend", "value": "$62,400", "change": "+5%", "changeDirection": "up", "status": "neutral" },
          { "label": "ROAS", "value": "3.8x", "change": "+18%", "changeDirection": "up", "status": "positive" },
          { "label": "Conversions", "value": "1,248", "change": "+12%", "changeDirection": "up", "status": "positive" },
          { "label": "CPA", "value": "$50.00", "change": "-6%", "changeDirection": "down", "status": "positive" },
          { "label": "CTR", "value": "2.1%", "change": "+0.3%", "changeDirection": "up", "status": "positive" }
        ]
      },
      "order": 2
    },
    {
      "id": "channel-breakdown",
      "title": "Channel Performance",
      "type": "table",
      "content": {
        "headers": ["Channel", "Spend", "Impressions", "Clicks", "CTR", "Conversions", "CPA", "ROAS"],
        "rows": [
          ["Google Search", "$28,080", "750K", "30K", "4.0%", "620", "$45.29", "4.5x"],
          ["Meta Ads", "$34,320", "2.8M", "42K", "1.5%", "628", "$54.65", "3.2x"]
        ]
      },
      "order": 3
    },
    {
      "id": "recommendations",
      "title": "Strategic Recommendations",
      "type": "insights",
      "content": {
        "insights": [
          { "type": "positive", "text": "Google Search ROAS at 4.5x — consider increasing budget allocation by 10-15%." },
          { "type": "negative", "text": "Meta CPA trending up 8% MoM — schedule creative refresh to combat ad fatigue." },
          { "type": "opportunity", "text": "Test Google Shopping ads to capture product-specific search demand." },
          { "type": "neutral", "text": "Budget utilization at 83% — review pacing to ensure full spend by month end." }
        ]
      },
      "order": 4
    }
  ],
  "aiSummary": "February was a strong month for the Summer Shoe campaign. Blended ROAS of 3.8x exceeded the 3.5x target, driven by Google Search at 4.5x. Total conversions grew 12% month-over-month. The main area of concern is rising Meta CPA (+8%), which suggests creative fatigue. Recommend reallocating 10% of Meta budget to Google Search and refreshing Meta creatives.",
  "keyTakeaways": [
    "ROAS exceeded target: 3.8x vs 3.5x goal (+18% MoM)",
    "Google Search is the efficiency leader at 4.5x ROAS",
    "Meta CPA trending up 8% — creative refresh needed",
    "Budget utilization at 83% — on track for full monthly spend"
  ],
  "nextSteps": [
    "Shift 10% of Meta budget to Google Search",
    "Refresh Meta ad creatives (carousel and video formats)",
    "Launch Google Shopping test with 5% of total budget",
    "Review audience segments for overlap and suppression opportunities"
  ]
}
```

### Example 2: No Data Available

**User message:**
> Create a report

**No campaigns or performance data available.**

**Expected output (no code fence):**

I'd be happy to generate a report. I need a bit more information:

1. **Which campaign** should the report cover? (or should it be all campaigns?)
2. **What time period?** (e.g., last 7 days, this month, custom range)
3. **What type of report?** Executive summary, detailed performance, or creative analysis?

If you don't have live campaign data yet, I can generate a report template with placeholder data that you can fill in later.
