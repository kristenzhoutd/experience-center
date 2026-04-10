import type { ScenarioConfig, IndustryContext } from '../types';

export function buildJourneyPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';

  let dataInstructions = '';
  if (isLive) {
    if (industry.id === 'retail') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Reference actual repeat purchase rate (86.6%) when designing re-engagement triggers
- Use real churn risk distribution (31.4% High, 32.4% Medium) to set journey urgency
- Design channel mix based on actual consent data and email performance (68% open rate, 29.2% CTR)
- Reference RFM segments (Champions, At Risk, Hibernating, etc.) as journey entry/exit criteria
- Use actual CLV ($7,589) to justify investment in high-value journey stages
- Ground wait times and touchpoint frequency in real engagement patterns`;
    } else if (industry.id === 'travel') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use rebooking rate when designing re-engagement triggers
- Reference churn risk distribution to set journey urgency
- Design channel mix based on email performance metrics
- Use loyalty tiers as journey entry/exit criteria
- Reference ancillary attach rate for upsell journey stages
- Ground wait times in booking patterns and lead time data`;
    } else if (industry.id === 'cpg') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use lapsed rate to trigger win-back journeys
- Reference coupon redemption rate for promotional journey stages
- Design replenishment triggers using purchase frequency patterns
- Use brand loyalty levels as journey branching criteria
- Reference CSAT score for post-purchase satisfaction touchpoints
- Ground channel mix in email engagement metrics`;
    } else if (industry.id === 'automotive') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use ownership status (Owner, Lessee, Prospect) as journey entry criteria
- Reference test drive conversion rate to design acquisition journey triggers
- Design service reminder stages using service retention rate and avg visit value
- Use vehicle segment preference as journey branching criteria
- Reference churn risk distribution to set urgency on retention journey stages
- Ground channel mix in email engagement metrics and dealer visit data`;
    } else if (industry.id === 'media') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use subscription status (Active, Cancelled, Paused, Trial) as journey entry criteria
- Reference session duration and content plays for engagement journey triggers
- Design upgrade stages using premium upgrade rate data
- Use subscription plan tier as journey branching criteria
- Reference churn risk distribution to set urgency on win-back stages
- Ground channel mix in email engagement and in-app notification metrics`;
    } else if (industry.id === 'd2c') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use customer segment (VIP, Active, NewBuyer, AtRisk, Lapsed) as journey entry criteria
- Reference repeat purchase rate and AOV for repurchase journey triggers
- Design loyalty stages using purchase frequency band data
- Use signup channel as journey branching for acquisition flows
- Reference return rate and churn risk to set urgency on retention stages
- Ground channel mix in email + SMS + social engagement metrics`;
    } else if (industry.id === 'b2btech') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use account status (Customer, Prospect, Churned) as journey entry criteria
- Reference health score to trigger expansion or at-risk journey paths
- Design onboarding stages using product usage metrics
- Use pipeline stage and deal amount as journey branching for sales flows
- Reference churn risk distribution to set urgency on renewal journey stages
- Ground channel mix in email engagement and event attendance data`;
    } else if (industry.id === 'financial') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use primary product and account portfolio as journey entry criteria
- Reference transaction patterns and digital engagement for activation triggers
- Design cross-sell stages using product holding breadth data
- Use income bracket and AUM as journey branching for wealth tiers
- Reference churn risk and satisfaction scores to set urgency on retention stages
- Ground channel mix in email engagement and login event data`;
    } else if (industry.id === 'healthcare') {
      dataInstructions = `

### Data-Driven Journey Requirements
- Use engagement score and insurance type as journey entry criteria
- Reference appointment completion rate for care outreach triggers
- Design wellness stages using chronic condition count and adherence status
- Use portal adoption rate as journey branching for digital vs traditional paths
- Reference risk score distribution to set urgency on intervention stages
- Ground channel mix in email engagement and portal login data`;
    }
  }

  return `You are generating a Lifecycle Journey for the Treasure AI Experience Center.

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

### Preferred Channels
${industry.channelPreferences.join(', ')}
${dataInstructions}

## Output Instructions
Generate the journey using the scenarioCore sections. Create 4-5 journey stages, each as a section:
- Stage name
- Content should include: Trigger, Channel, Message, Wait time, Stage goal

Also populate channelStrategy with how each channel is used across the journey.
Use "${industry.verticalTerminology.customer}" terminology throughout.`;
}
