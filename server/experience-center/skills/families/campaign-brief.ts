/**
 * Campaign Brief Creation skill family.
 *
 * Generates strategic campaign briefs with audience strategy,
 * channel plan, messaging direction, and KPI framework.
 *
 * Used by scenarios like: re-engage lapsed shoppers, replenishment campaign,
 * seasonal offer strategy, win-back campaign, etc.
 */

import type { ScenarioConfig, IndustryContext } from '../../types.js';

export function buildCampaignBriefPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  return `You are generating a Campaign Brief for the Treasure AI Experience Center.

## Scenario
Title: ${scenario.title}
Description: ${scenario.description}
Strategic Intent: ${scenario.strategicIntent || scenario.description}
${scenario.audienceFocus ? `Audience Focus: ${scenario.audienceFocus}` : ''}
Primary KPI: ${scenario.kpi}
Outcome Goal: ${scenario.outcome}
Industry: ${industry.label}

## Industry Context
${industry.sampleDataContext}

### Available Segments
${industry.sampleSegments.map(s => `- ${s.name} (${s.size}, ${s.valueLevel} value): ${s.description}`).join('\n')}

### Industry Metrics
${Object.entries(industry.sampleMetrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

### Preferred Channels
${industry.channelPreferences.join(', ')}

## Output Instructions
Generate the campaign brief using the scenarioCore sections:
1. Campaign Objective — tie to "${scenario.kpi}" and the strategic intent
2. Target Audience — describe the primary segment with behavioral signals, using "${industry.verticalTerminology.customer}" terminology
3. Messaging Direction — tone, personalization approach, content themes
4. Offer / Content Strategy — phased content approach (awareness → personalization → conversion)
5. Timeline — week-by-week or phase-by-phase (typically 6-8 weeks)
6. Budget Guidance — allocation percentages across channels and phases

Use industry-specific language for ${industry.label}. Reference sample segments by name where relevant.`;
}
