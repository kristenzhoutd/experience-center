/**
 * Skill Request Assembly — combines skill family prompt, industry context,
 * scenario overlay, and output format instructions into a final LLM request.
 */

import type { ScenarioConfig, IndustryContext } from '../types.js';
import { buildSkillPrompt } from '../skills/families/index.js';

export interface AssembledRequest {
  systemPrompt: string;
  userPrompt: string;
}

const OUTPUT_SCHEMA_INSTRUCTIONS = `
## Output Schema

Generate a JSON object matching this schema exactly. Every field is required.

\`\`\`jsonc
{
  "summaryBanner": {
    "goal": "string — the business outcome",
    "audience": "string — the target audience label",
    "topRecommendation": "string — 1-2 sentence strategic recommendation",
    "impactFraming": "string — projected impact statement with metrics and timeframe"
  },
  "executiveSummary": "string — 2-3 paragraphs: what/who/why, phased approach, benchmark comparison",
  "audienceCards": [
    {
      "name": "string — industry-specific segment name",
      "whyItMatters": "string — why this segment matters for the objective",
      "opportunityLevel": "High | Medium | Low",
      "suggestedAction": "string — recommended activation tactic"
    }
  ],
  "channelStrategy": [
    {
      "channel": "string — channel name",
      "role": "string — role in the strategy",
      "messageAngle": "string — messaging approach",
      "reason": "string — why this channel was selected"
    }
  ],
  "scenarioCore": {
    "title": "string — output format title",
    "sections": [
      { "label": "string — section heading", "content": "string — 2-4 sentences" }
    ]
  },
  "kpiFramework": [
    { "type": "Primary | Secondary | Leading Indicator | Optimization", "name": "string", "note": "string" }
  ],
  "nextActions": [
    { "action": "string — specific action", "priority": "Do now | Test next | Scale later" }
  ],
  "insightPanel": {
    "whyThisRecommendation": "string — 2-3 sentences explaining strategic rationale",
    "businessImpact": ["string — 4 projected impact statements with metrics"],
    "whatChanged": ["string — 3-4 statements showing how selections shaped output"],
    "howTreasureHelps": ["string — 5 platform capability statements"]
  }
}
\`\`\`

## Quality Rules
1. Every field must be populated — no null or empty values
2. Use realistic metrics plausible for the industry
3. audienceCards: exactly 3 cards with industry-specific names
4. kpiFramework: exactly 4 entries (Primary, Secondary, Leading Indicator, Optimization)
5. nextActions: exactly 5 (2 "Do now", 2 "Test next", 1 "Scale later")
6. Wrap output in an \`experience-output-json\` code fence
7. Do NOT include any text outside the code fence

## Output Format
\`\`\`\`
\`\`\`experience-output-json
{ ... }
\`\`\`
\`\`\`\`
`;

export function buildSkillRequest(scenario: ScenarioConfig, industry: IndustryContext): AssembledRequest {
  const skillPrompt = buildSkillPrompt(scenario.skillFamily, scenario, industry);

  const systemPrompt = `You are the Treasure AI Experience Center, generating polished, business-ready recommendations for enterprise marketers. All outputs use sample data and should be framed as illustrative recommendations that showcase Treasure AI capabilities.

${skillPrompt}

${OUTPUT_SCHEMA_INSTRUCTIONS}`;

  const userPrompt = `Generate the output for this scenario now. Output ONLY the JSON code fence.`;

  return { systemPrompt, userPrompt };
}
