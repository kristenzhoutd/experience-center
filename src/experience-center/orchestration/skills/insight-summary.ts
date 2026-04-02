import type { ScenarioConfig, IndustryContext } from '../types';

export function buildInsightSummaryPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';

  let dataInstructions = '';
  if (isLive) {
    if (industry.id === 'retail') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface specific anomalies or opportunities from the real metrics (e.g., the gap between online $396 and in-store $253 avg order value)
- Reference actual RFM distribution to identify hidden patterns (e.g., "Potential Loyalists at 122 is the largest RFM segment — a conversion opportunity")
- Use real churn risk data (31.4% High) to frame urgency of retention insights
- Cite email engagement metrics (68% open, 29.2% CTR) as evidence for channel effectiveness insights
- Compare loyalty tier sizes to identify tier migration opportunities
- Present findings as data-backed discoveries, not generic observations`;
    } else if (industry.id === 'travel') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between rebooking rate and churn risk as a retention insight
- Reference ancillary attach rate as a revenue opportunity pattern
- Use loyalty tier distribution to identify tier migration opportunities
- Cite email click rate vs open rate for engagement gap insights
- Compare cabin preferences to loyalty tiers for premium conversion patterns
- Present review rating trends as satisfaction signals`;
    } else if (industry.id === 'cpg') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between buyer penetration and brand loyalty High as a loyalty conversion opportunity
- Reference coupon redemption rate vs promo rate for promotional efficiency insights
- Use price sensitivity distribution to identify premium migration opportunities
- Cite lapsed rate alongside brand switcher rate for at-risk patterns
- Compare email engagement to coupon source distribution for channel effectiveness
- Present CSAT alongside support category distribution for VoC insights`;
    }
  }

  return `You are generating a Business Insight Summary for the Treasure AI Experience Center.

## Scenario
Title: ${scenario.title}
Description: ${scenario.description}
Strategic Intent: ${scenario.strategicIntent || scenario.description}
Primary KPI: ${scenario.kpi}
Outcome Goal: ${scenario.outcome}
Industry: ${industry.label}

## ${dataLabel} — Industry Context
${industry.sampleDataContext}

### Available Segments
${industry.sampleSegments.map(s => `- ${s.name} (${s.size}, ${s.valueLevel} value): ${s.description}`).join('\n')}

### Industry Metrics
${Object.entries(industry.sampleMetrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
${dataInstructions}

## Output Instructions
Generate insight summary output:
- scenarioCore title: "Insight Summary"
- scenarioCore sections: Key Finding, Supporting Evidence, Strategic Implication, Recommended Action
- audienceCards: 3 segments most relevant to the insight, with opportunity scoring
- Focus insights on "${scenario.kpi}" and how it connects to the strategic intent

Present insights as discoveries, not prescriptions. Use ${industry.label} context and data.`;
}
