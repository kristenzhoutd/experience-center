/**
 * Segment Opportunity Discovery skill family.
 *
 * Identifies high-potential customer segments with opportunity scoring,
 * sizing, and activation strategies.
 */

import type { ScenarioConfig, IndustryContext } from '../../types.js';

export function buildSegmentOpportunityPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  return `You are generating a Segment Opportunity Discovery for the Treasure AI Experience Center.

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

## Output Instructions
Generate segment discovery output:
- audienceCards: exactly 3 segments with industry-specific names, opportunity levels, and activation actions
- scenarioCore title: "Segment Discovery"
- scenarioCore sections: Segmentation Approach, Segment Sizing, Prioritization Logic, Activation Readiness
- Focus audience analysis on "${scenario.audienceFocus || 'high-opportunity segments'}"

Use "${industry.verticalTerminology.customer}" terminology. Reference sample segments and metrics.`;
}
