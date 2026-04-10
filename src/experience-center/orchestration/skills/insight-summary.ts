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
    } else if (industry.id === 'automotive') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between test drive volume and conversion rate as an acquisition efficiency insight
- Reference service retention rate against churn risk for lifecycle health patterns
- Use vehicle segment distribution to identify cross-sell opportunities between segments
- Cite ownership status transitions (Prospect to Owner, Owner to repeat) for loyalty trends
- Compare email engagement to dealer visit patterns for channel preference insights
- Present avg service visit value trends across vehicle segments for revenue opportunity patterns`;
    } else if (industry.id === 'media') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between free tier size and premium upgrade rate as a conversion opportunity insight
- Reference session duration patterns across subscription tiers for engagement depth trends
- Use content plays distribution to identify content-type affinity patterns
- Cite subscription status transitions (Trial to Active, Active to Cancelled) for lifecycle trends
- Compare email engagement to in-app metrics for channel effectiveness insights
- Present churn risk alongside content engagement for predictive retention patterns`;
    } else if (industry.id === 'd2c') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between NewBuyer segment size and repeat purchase rate as a conversion opportunity
- Reference AOV trends across customer segments for value migration patterns
- Use signup channel distribution to identify highest-quality acquisition sources
- Cite return rate alongside purchase frequency for product-market fit signals
- Compare email + SMS + social engagement for cross-channel effectiveness insights
- Present churn risk alongside lifetime value for high-impact retention opportunities`;
    } else if (industry.id === 'b2btech') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between health score and expansion potential as a growth opportunity insight
- Reference pipeline stage distribution to identify conversion bottleneck patterns
- Use product usage metrics to discover adoption depth trends across account segments
- Cite churn risk alongside deal amount for revenue-at-risk prioritization
- Compare email engagement to event attendance for multi-touch attribution insights
- Present account status transitions for customer lifecycle velocity patterns`;
    } else if (industry.id === 'financial') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between product holdings and cross-sell potential as a wallet share opportunity
- Reference AUM distribution across income brackets for wealth tier migration patterns
- Use transaction patterns to identify digital adoption behavioral trends
- Cite churn risk alongside satisfaction scores for early warning signal insights
- Compare email engagement to login event patterns for channel preference insights
- Present advisor assignment rate alongside account portfolio for service model effectiveness patterns`;
    } else if (industry.id === 'healthcare') {
      dataInstructions = `

### Data-Driven Insight Requirements
- Surface gap between appointment scheduling and completion rate as a care gap insight
- Reference engagement score distribution to identify patient activation patterns
- Use portal adoption rate alongside insurance type for digital readiness trends
- Cite chronic condition count alongside adherence status for care intervention opportunities
- Compare email engagement to portal login patterns for outreach effectiveness insights
- Present risk score distribution alongside engagement for proactive care prioritization patterns`;
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
