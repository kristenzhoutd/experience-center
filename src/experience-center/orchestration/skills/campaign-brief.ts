import type { ScenarioConfig, IndustryContext } from '../types';

export function buildCampaignBriefPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';
  const dataInstructions = isLive ? `

### Data-Driven Campaign Requirements
- Define target audience using real segment sizes and actual CLV ($7,589 avg predicted CLV)
- Use actual channel consent rates from the CDP data for channel strategy
- Ground budget allocation in real email performance (68% open rate, 29.2% CTR)
- Reference actual cart abandonment rate (38%, $319 avg abandoned cart) if relevant to the campaign
- Use real loyalty tier distribution to inform offer strategy (Bronze/Silver/Gold/Platinum)
- Set KPI targets based on actual baseline metrics, not generic industry benchmarks` : '';

  return `You are generating a Campaign Brief for the Treasure AI Experience Center.

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
Generate the campaign brief using the scenarioCore sections:
1. Campaign Objective — tie to "${scenario.kpi}" and the strategic intent
2. Target Audience — describe the primary segment with behavioral signals, using "${industry.verticalTerminology.customer}" terminology
3. Messaging Direction — tone, personalization approach, content themes
4. Offer / Content Strategy — phased content approach (awareness → personalization → conversion)
5. Timeline — week-by-week or phase-by-phase (typically 6-8 weeks)
6. Budget Guidance — allocation percentages across channels and phases

Use industry-specific language for ${industry.label}. Reference segments by name where relevant.`;
}
