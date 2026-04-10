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
    } else if (industry.id === 'automotive') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use vehicle segment distribution (Sedan, SUV, Truck, EV, Luxury) for product-affinity segments
- Reference ownership status (Owner, Lessee, Prospect) for lifecycle segmentation
- Cite service retention rate and avg service visit value for value-tier sizing
- Use test drive conversion rate to identify high-intent behavioral segments
- Reference churn risk distribution for at-risk segment identification`;
    } else if (industry.id === 'media') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use subscription plan distribution (Free, Basic, Standard, Premium) for tier-based segments
- Reference subscription status (Active, Cancelled, Paused, Trial) for lifecycle segmentation
- Cite session duration and content plays for engagement-based segment sizing
- Use premium upgrade rate to identify upsell-ready behavioral segments
- Reference churn risk distribution for at-risk segment identification`;
    } else if (industry.id === 'd2c') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use customer segment distribution (VIP, Active, NewBuyer, AtRisk, Lapsed) for value-tier sizing
- Reference AOV and repeat purchase rate for high-value segment identification
- Cite signup channel distribution for acquisition-source segmentation
- Use purchase frequency bands for behavioral lifecycle segments
- Reference return rate and churn risk for at-risk segment sizing`;
    } else if (industry.id === 'b2btech') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use account status (Customer, Prospect, Churned) and company size for firmographic segments
- Reference health score and expansion potential for value-tier segmentation
- Cite pipeline stage and deal amount for opportunity-based segments
- Use product usage metrics for adoption-based behavioral segments
- Reference churn risk distribution for at-risk account segment sizing`;
    } else if (industry.id === 'financial') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use primary product distribution and income bracket for product-affinity segments
- Reference AUM data and advisor assignment for wealth-tier segmentation
- Cite transaction patterns for behavioral activity segments
- Use account portfolio breadth for cross-sell opportunity segment sizing
- Reference churn risk and satisfaction scores for at-risk segment identification`;
    } else if (industry.id === 'healthcare') {
      dataInstructions = `

### Data-Driven Segment Requirements
- Use engagement score distribution and insurance type for patient segmentation
- Reference appointment completion rate and avg visits for engagement-tier sizing
- Cite portal adoption rate for digital-readiness segments
- Use chronic condition count and adherence status for care-need segments
- Reference risk score distribution for clinical priority segment identification`;
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
