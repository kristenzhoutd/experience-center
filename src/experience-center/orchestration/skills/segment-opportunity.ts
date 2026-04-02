import type { ScenarioConfig, IndustryContext } from '../types';

export function buildSegmentOpportunityPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';

  let dataInstructions = '';
  if (isLive) {
    if (industry.id === 'retail') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use real RFM segment names and sizes (Potential Loyalists 122, Hibernating 112, At Risk 103, Champions 95, etc.)
- Ground opportunity scores in actual behavioral metrics (repeat purchase rate, CLV, churn risk)
- Reference actual loyalty tier sizes (Bronze 310, Silver 246, Gold 166, Platinum 82) for segment sizing
- Use real online vs in-store buyer counts (886 online, 846 in-store) for channel affinity analysis
- Cite specific metrics when explaining why a segment matters (e.g., "Champions represent 95 customers with the highest CLV")`;
    } else if (industry.id === 'travel') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use real loyalty tier sizes for segment sizing
- Ground opportunity scores in rebooking rate, churn risk, and booking value
- Reference cabin preferences for premium segmentation
- Cite booking completion and cancellation rates for behavioral segments
- Use ancillary purchaser data for cross-sell segment identification`;
    } else if (industry.id === 'cpg') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use brand loyalty distribution (High/Medium/Low/Switcher) for loyalty-based segments
- Reference price sensitivity distribution for value-based segmentation
- Cite buyer penetration and lapsed rate for lifecycle segments
- Use promo rate for deal-sensitivity segments
- Reference coupon redeemer count for promotional responsiveness segments`;
    }
  }

  return `You are generating a Segment Opportunity Discovery for the Treasure AI Experience Center.

## Scenario
Title: ${scenario.title}
Description: ${scenario.description}
Strategic Intent: ${scenario.strategicIntent || scenario.description}
${scenario.audienceFocus ? `Audience Focus: ${scenario.audienceFocus}` : ''}
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
Generate segment discovery output:
- audienceCards: exactly 3 segments with industry-specific names, opportunity levels, and activation actions
- scenarioCore title: "Segment Discovery"
- scenarioCore sections: Segmentation Approach, Segment Sizing, Prioritization Logic, Activation Readiness
- Focus audience analysis on "${scenario.audienceFocus || 'high-opportunity segments'}"

Use "${industry.verticalTerminology.customer}" terminology. Reference segments and metrics.`;
}
