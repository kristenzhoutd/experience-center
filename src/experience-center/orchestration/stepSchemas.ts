/**
 * Step-specific output schemas for workflow steps.
 * Each step type gets a focused schema so the LLM generates exactly what the card needs.
 */

import type { StepType } from './types';

const ANALYZE_SCHEMA = `
{
  "headline": "string — 1-2 sentence key finding or strategic recommendation",
  "impactStatement": "string — projected impact statement with specific metrics and timeframe",
  "findings": [
    {
      "name": "string — segment or pattern name",
      "insight": "string — why this matters for the objective",
      "level": "High | Medium | Low"
    }
  ],
  "metrics": [
    { "label": "string — metric name (e.g., Avg CLV, Churn Rate)", "value": "string — metric value (e.g., $2,847, 31%)" }
  ],
  "rationale": "string — 2-3 sentences explaining the analysis rationale and how the data supports the recommendation"
}

Rules:
- findings: exactly 3 items
- metrics: exactly 3 items
- All fields required, no null or empty values
`;

const INSPECT_SCHEMA = `
{
  "headline": "string — 1-2 sentence key finding from the deep-dive",
  "impactStatement": "string — projected impact with metrics",
  "profiles": [
    {
      "name": "string — profile or segment name",
      "level": "High | Medium | Low",
      "behavior": "string — key behavioral pattern observed",
      "action": "string — recommended action for this profile"
    }
  ],
  "sections": [
    { "label": "string — section heading", "content": "string — 2-3 sentences of analysis" }
  ]
}

Rules:
- profiles: exactly 3 items
- sections: exactly 3-4 items (e.g., Behavioral Patterns, Disengagement Drivers, Recovery Levers, Recommended Approach)
- All fields required
`;

const CREATE_SCHEMA = `
{
  "headline": "string — 1-2 sentence summary of what was created",
  "impactStatement": "string — projected impact with metrics",
  "sections": [
    { "label": "string — section heading", "content": "string — 2-4 sentences" }
  ],
  "channels": [
    { "name": "string — channel name", "role": "string — how this channel is used" }
  ],
  "nextSteps": [
    { "action": "string — specific action item", "priority": "Do now | Test next | Scale later" }
  ]
}

Rules:
- sections: 4-6 items (e.g., Objective, Target Audience, Messaging, Timeline, Budget)
- channels: 3-5 items
- nextSteps: 3-4 items
- All fields required
`;

const COMPARE_SCHEMA = `
{
  "headline": "string — 1-2 sentence comparison conclusion",
  "impactStatement": "string — projected impact with metrics",
  "options": [
    {
      "name": "string — option name",
      "description": "string — 1-2 sentence description",
      "score": "string — relative strength (e.g., 85/100, Strong, Best ROI)",
      "recommended": true or false
    }
  ],
  "metrics": [
    { "label": "string — comparison metric name", "value": "string — metric value" }
  ]
}

Rules:
- options: exactly 3 items, with exactly one having recommended: true
- metrics: 3-4 items
- All fields required
`;

const ACTIVATE_SCHEMA = `
{
  "headline": "string — 1-2 sentence activation plan summary",
  "impactStatement": "string — projected impact with metrics",
  "summary": "string — 2-3 sentence overview of the activation approach",
  "destinations": [
    {
      "channel": "string — destination/channel name",
      "role": "string — what this destination does",
      "detail": "string — specific configuration or approach"
    }
  ],
  "sections": [
    { "label": "string — section heading", "content": "string — 2-3 sentences" }
  ]
}

Rules:
- destinations: 3-4 items
- sections: 2-3 items (e.g., Audience Definition, Timing Strategy, Expected Results)
- All fields required
`;

const OPTIMIZE_SCHEMA = `
{
  "headline": "string — 1-2 sentence optimization recommendation",
  "impactStatement": "string — projected impact with metrics",
  "rationale": "string — 2-3 sentences explaining why these optimizations matter",
  "metrics": [
    { "label": "string — metric being optimized", "value": "string — current or target value" }
  ],
  "changes": [
    { "action": "string — specific optimization action", "priority": "Do now | Test next | Scale later" }
  ]
}

Rules:
- metrics: 3-4 items
- changes: 3-5 items
- All fields required
`;

const schemas: Record<StepType, string> = {
  analyze: ANALYZE_SCHEMA,
  inspect: INSPECT_SCHEMA,
  create: CREATE_SCHEMA,
  compare: COMPARE_SCHEMA,
  activate: ACTIVATE_SCHEMA,
  optimize: OPTIMIZE_SCHEMA,
};

/**
 * Build step-specific schema instructions for the LLM prompt.
 */
export function getStepSchemaInstructions(stepType: StepType): string {
  const schema = schemas[stepType];
  return `
## Output Schema

Generate a JSON object matching this schema exactly.

\`\`\`jsonc
${schema}
\`\`\`

## Output Format
Wrap the JSON in an \`experience-output-json\` code fence:
\`\`\`\`
\`\`\`experience-output-json
{ ... }
\`\`\`
\`\`\`\`

Do NOT include any text outside the code fence.
`;
}
