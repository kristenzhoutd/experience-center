/**
 * Performance Analysis skill family.
 *
 * Diagnoses campaign performance issues and generates
 * optimization recommendations with impact forecasts.
 */

import type { ScenarioConfig, IndustryContext } from '../../types.js';

export function buildPerformanceAnalysisPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  return `You are generating a Performance Analysis for the Treasure AI Experience Center.

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

### Preferred Channels
${industry.channelPreferences.join(', ')}

## Output Instructions
Generate performance analysis output:
- scenarioCore title: "Performance Analysis"
- scenarioCore sections: Performance Diagnosis, Root Cause Analysis, Recommended Optimizations, Impact Forecast
- audienceCards: 3 audience groups (underperforming, hidden opportunity, efficiency leaders)
- channelStrategy: analyze channel performance and optimization opportunities
- Focus on "${scenario.kpi}" as the primary metric

Use ${industry.label} benchmarks and terminology.`;
}
