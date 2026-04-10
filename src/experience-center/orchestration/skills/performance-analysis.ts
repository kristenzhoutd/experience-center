import type { ScenarioConfig, IndustryContext } from '../types';

export function buildPerformanceAnalysisPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';

  let dataInstructions = '';
  if (isLive) {
    if (industry.id === 'retail') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use real metrics as baselines for diagnosis (e.g., 38% cart abandonment rate, 68% email open rate, 29.2% CTR)
- Compare online ($396 avg) vs in-store ($253 avg) order values to identify channel performance gaps
- Reference actual churn risk segments (31.4% High risk) as performance concerns
- Use real loyalty opt-in rate (80.4%) and tier distribution as retention performance indicators
- Ground optimization recommendations in actual conversion rate (3.2%) and CLV ($7,589)
- Cite specific RFM segments when identifying underperforming or high-opportunity groups`;
    } else if (industry.id === 'travel') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use email rates as channel performance baselines
- Compare booking completion vs cancellation rates for conversion analysis
- Reference ancillary revenue as upsell performance indicator
- Use churn risk distribution for retention performance diagnosis
- Cite review rating for guest satisfaction performance
- Ground optimization recommendations in rebooking rate`;
    } else if (industry.id === 'cpg') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use promo rate and coupon redemption rate as promotion performance baselines
- Reference avg basket vs avg purchase amount for basket composition analysis
- Use brand loyalty distribution for brand health performance
- Cite lapsed rate as retention performance concern
- Reference CSAT score for customer satisfaction diagnosis
- Ground recommendations in buyer penetration and email rates`;
    } else if (industry.id === 'automotive') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use test drive conversion rate as acquisition performance baseline
- Compare service retention rate against churn risk distribution for retention diagnosis
- Reference avg service visit value for service revenue performance analysis
- Use vehicle segment distribution to identify high-performing vs underperforming segments
- Cite email engagement metrics and dealer visit data for channel efficiency analysis
- Ground optimization recommendations in ownership status conversion rates`;
    } else if (industry.id === 'media') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use premium upgrade rate as upsell performance baseline
- Compare session duration and content plays across subscription tiers for engagement diagnosis
- Reference churn risk distribution against subscription status for retention performance
- Use subscription plan distribution to identify conversion bottlenecks between tiers
- Cite email engagement and in-app metrics for channel efficiency analysis
- Ground optimization recommendations in content engagement and renewal rates`;
    } else if (industry.id === 'd2c') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use AOV and repeat purchase rate as revenue performance baselines
- Compare customer segment distribution (VIP, Active, NewBuyer, AtRisk, Lapsed) for lifecycle health diagnosis
- Reference return rate alongside churn risk for retention performance concerns
- Use signup channel distribution for acquisition channel efficiency analysis
- Cite email + SMS + social engagement metrics for channel performance comparison
- Ground optimization recommendations in purchase frequency and lifetime value data`;
    } else if (industry.id === 'b2btech') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use health score distribution as account performance baseline
- Compare expansion potential against pipeline stage for growth performance diagnosis
- Reference deal amount and win rate for pipeline efficiency analysis
- Use product usage metrics for adoption performance measurement
- Cite email engagement and event attendance for channel efficiency analysis
- Ground optimization recommendations in churn risk and renewal rate data`;
    } else if (industry.id === 'financial') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use AUM growth and advisor assignment rate as wealth management performance baselines
- Compare transaction patterns across product types for cross-sell performance diagnosis
- Reference digital engagement and login events for channel adoption efficiency
- Use account portfolio breadth for product penetration performance analysis
- Cite churn risk and satisfaction scores for retention performance measurement
- Ground optimization recommendations in income bracket conversion and activation rates`;
    } else if (industry.id === 'healthcare') {
      dataInstructions = `

### Data-Driven Performance Requirements
- Use appointment completion rate as care delivery performance baseline
- Compare engagement score distribution across insurance types for outreach effectiveness diagnosis
- Reference portal adoption rate for digital channel performance analysis
- Use chronic condition count and adherence status for care program performance measurement
- Cite risk score distribution for patient outcome performance tracking
- Ground optimization recommendations in email engagement and portal login conversion rates`;
    }
  }

  return `You are generating a Performance Analysis for the Treasure AI Experience Center.

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

### Preferred Channels
${industry.channelPreferences.join(', ')}
${dataInstructions}

## Output Instructions
Generate performance analysis output:
- scenarioCore title: "Performance Analysis"
- scenarioCore sections: Performance Diagnosis, Root Cause Analysis, Recommended Optimizations, Impact Forecast
- audienceCards: 3 audience groups (underperforming, hidden opportunity, efficiency leaders)
- channelStrategy: analyze channel performance and optimization opportunities
- Focus on "${scenario.kpi}" as the primary metric

Use ${industry.label} benchmarks and terminology.`;
}
