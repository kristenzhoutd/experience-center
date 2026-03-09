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
- Any request for formatted campaign reporting or executive summaries.

## Input Context

You will receive:
- Campaign performance data (by channel, audience, creative, time period)
- Campaign configuration and brief
- Report preferences (time period, audience for the report, level of detail)
- Optional: comparison period data (e.g. previous month, previous campaign)
- Optional: specific sections or metrics the user wants highlighted

## Output Schema

Return a structured report object:

```jsonc
{
  "title": "string — report title (e.g. Q1 2026 Paid Media Performance Report)",
  "subtitle": "string — campaign name or reporting period",
  "generatedAt": "string — ISO datetime",
  "reportPeriod": {
    "start": "string — ISO date",
    "end": "string — ISO date"
  },
  "sections": [
    {
      "id": "string — unique section ID",
      "title": "string — section heading",
      "type": "string — summary | metrics | chart | table | insights | comparison",
      "content": {
        // Content structure varies by type:

        // For type: "summary"
        "text": "string — narrative summary paragraph",

        // For type: "metrics"
        "metrics": [
          {
            "label": "string — metric name",
            "value": "string — formatted metric value",
            "change": "string — change vs comparison period (e.g. +12%)",
            "changeDirection": "string — up | down | flat",
            "status": "string — positive | negative | neutral"
          }
        ],

        // For type: "chart"
        "chartType": "string — line | bar | pie | area | funnel",
        "chartTitle": "string — chart title",
        "dataPoints": [
          {
            "label": "string — x-axis label or category",
            "values": {}
          }
        ],

        // For type: "table"
        "headers": ["string — column headers"],
        "rows": [["string — cell values"]],

        // For type: "comparison"
        "periods": [
          {
            "label": "string — period label",
            "metrics": {}
          }
        ],

        // For type: "insights"
        "insights": [
          {
            "type": "string — positive | negative | neutral | opportunity",
            "text": "string — insight statement"
          }
        ]
      },
      "order": "number — display order (1-based)"
    }
  ],
  "aiSummary": "string — 3-5 sentence executive summary of campaign performance",
  "keyTakeaways": ["string — 3-5 bullet-point takeaways for stakeholders"],
  "nextSteps": ["string — recommended actions based on report findings"]
}
```

## Output Format

Wrap the JSON in a `report-json` code fence:

````
```report-json
{
  "title": "February 2026 Paid Media Performance Report",
  "subtitle": "Brand Awareness Campaign — Google + Meta",
  "sections": [
    {
      "id": "exec-summary",
      "title": "Executive Summary",
      "type": "summary",
      "content": { "text": "..." },
      "order": 1
    },
    {
      "id": "key-metrics",
      "title": "Key Performance Metrics",
      "type": "metrics",
      "content": { "metrics": [ ... ] },
      "order": 2
    }
  ],
  "aiSummary": "Campaign delivered strong results across Search and Social...",
  "keyTakeaways": ["ROAS exceeded target by 22%", "..."],
  "nextSteps": ["Increase Search budget by 15%", "..."]
}
```
````

Before the code fence, provide a brief conversational summary of the report
highlights.

## Quality Rules

1. **Structure for the audience.** Executive reports should lead with summary
   and key metrics. Tactical reports should include granular channel and creative
   breakdowns.
2. **Include at minimum 4 sections:** Executive Summary, Key Metrics, Channel
   Performance, and Insights/Next Steps.
3. **Use consistent formatting.** Metric values should be formatted appropriately
   (percentages with %, currency with $, large numbers with commas).
4. **Make comparisons meaningful.** When comparing periods, calculate and display
   the percentage change and indicate whether changes are positive or negative
   for the business.
5. **AI summary should be stakeholder-ready.** Write the executive summary as
   if presenting to a CMO — concise, focused on business impact, avoiding jargon.
6. **Separate findings from recommendations.** Report sections present data;
   the nextSteps array presents recommended actions.
7. **Order sections logically.** Summary first, then high-level metrics, then
   detailed breakdowns, then insights and next steps.
