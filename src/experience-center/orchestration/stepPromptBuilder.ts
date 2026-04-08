/**
 * Step-specific prompt builder for workflow steps.
 * Provides scenario + industry context WITHOUT conflicting output instructions.
 * The step schema (from stepSchemas.ts) is the only source of output format instructions.
 */

import type { ScenarioConfig, IndustryContext, WorkflowStepDef } from './types';

/**
 * Build the context portion of the prompt for a workflow step.
 * Includes: scenario metadata, step details, industry data, segments, metrics, channels.
 * Does NOT include output format instructions — those come from stepSchemas.ts.
 */
export function buildStepContextPrompt(
  scenario: ScenarioConfig,
  industry: IndustryContext,
  stepDef: WorkflowStepDef,
): string {
  const isLive = industry.sampleDataContext.includes('live data from');
  const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';

  return `## Scenario
Title: ${scenario.title}
Description: ${scenario.description}
Strategic Intent: ${scenario.strategicIntent || scenario.description}
${scenario.audienceFocus ? `Audience Focus: ${scenario.audienceFocus}` : ''}
Primary KPI: ${scenario.kpi}
Outcome Goal: ${scenario.outcome}
Industry: ${industry.label}

## Current Workflow Step
Step: ${stepDef.label}
Step Type: ${stepDef.stepType}
${stepDef.promptOverlay || ''}

## ${dataLabel} — Industry Context
${industry.sampleDataContext}

### Available Segments
${industry.sampleSegments.map(s => `- ${s.name} (${s.size}, ${s.valueLevel} value): ${s.description}`).join('\n')}

### Industry Metrics
${Object.entries(industry.sampleMetrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

### Preferred Channels
${industry.channelPreferences.join(', ')}
${isLive ? `
### STRICT Data Requirements
**CRITICAL: Use ONLY the exact numbers listed above. Do NOT extrapolate, estimate, or invent ANY figures.**
- When customer count is given (e.g., "1,000"), use that exact number — never round up, double, or change it
- When a rate is given (e.g., "86.6% repeat purchase rate"), quote it exactly — do not substitute a different number
- Express impact projections as percentage ranges (e.g., "15-25% improvement") rather than fabricating specific dollar amounts
- Every metric you cite in your output MUST appear in the Industry Metrics or Data Context above
- If a number is not provided above, do not invent one — say "based on available data" instead
` : ''}`;
}
