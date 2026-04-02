import type { ScenarioConfig, IndustryContext } from '../types';

export function buildJourneyPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';
  const dataInstructions = isLive ? `

### Data-Driven Journey Requirements
- Reference actual repeat purchase rate (86.6%) when designing re-engagement triggers
- Use real churn risk distribution (31.4% High, 32.4% Medium) to set journey urgency
- Design channel mix based on actual consent data and email performance (68% open rate, 29.2% CTR)
- Reference RFM segments (Champions, At Risk, Hibernating, etc.) as journey entry/exit criteria
- Use actual CLV ($7,589) to justify investment in high-value journey stages
- Ground wait times and touchpoint frequency in real engagement patterns` : '';

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
