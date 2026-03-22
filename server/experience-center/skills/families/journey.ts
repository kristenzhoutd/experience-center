/**
 * Journey Creation skill family.
 *
 * Designs multi-step customer journeys with triggers, channels,
 * messaging, wait times, and success metrics.
 */

import type { ScenarioConfig, IndustryContext } from '../../types.js';

export function buildJourneyPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  return `You are generating a Lifecycle Journey for the Treasure AI Experience Center.

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
Generate the journey using the scenarioCore sections. Create 4-5 journey stages, each as a section:
- Stage name
- Content should include: Trigger, Channel, Message, Wait time, Stage goal

Also populate channelStrategy with how each channel is used across the journey.
Use "${industry.verticalTerminology.customer}" terminology throughout.`;
}
