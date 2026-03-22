/**
 * Insight Summary skill family.
 *
 * Surfaces actionable business insights from customer
 * and campaign signals with strategic implications.
 */

import type { ScenarioConfig, IndustryContext } from '../../types.js';

export function buildInsightSummaryPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  return `You are generating a Business Insight Summary for the Treasure AI Experience Center.

## Scenario
Title: ${scenario.title}
Description: ${scenario.description}
Strategic Intent: ${scenario.strategicIntent || scenario.description}
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
Generate insight summary output:
- scenarioCore title: "Insight Summary"
- scenarioCore sections: Key Finding, Supporting Evidence, Strategic Implication, Recommended Action
- audienceCards: 3 segments most relevant to the insight, with opportunity scoring
- Focus insights on "${scenario.kpi}" and how it connects to the strategic intent

Present insights as discoveries, not prescriptions. Use ${industry.label} context and sample data.`;
}
