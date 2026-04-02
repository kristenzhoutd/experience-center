import type { ScenarioConfig, IndustryContext } from '../types';

export function buildPerformanceAnalysisPrompt(scenario: ScenarioConfig, industry: IndustryContext): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';
  const dataInstructions = isLive ? `

### Data-Driven Performance Requirements
- Use real metrics as baselines for diagnosis (e.g., 38% cart abandonment rate, 68% email open rate, 29.2% CTR)
- Compare online ($396 avg) vs in-store ($253 avg) order values to identify channel performance gaps
- Reference actual churn risk segments (31.4% High risk) as performance concerns
- Use real loyalty opt-in rate (80.4%) and tier distribution as retention performance indicators
- Ground optimization recommendations in actual conversion rate (3.2%) and CLV ($7,589)
- Cite specific RFM segments when identifying underperforming or high-opportunity groups` : '';

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
