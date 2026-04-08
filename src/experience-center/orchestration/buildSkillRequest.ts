import type { ScenarioConfig, IndustryContext } from './types';
import { buildSkillPrompt } from './skills/index';

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
  "executiveSummary": "string — 3 SHORT sentences separated by newlines: what it does, the approach, expected outcome. Keep each sentence under 20 words.",
  "audienceCards": [
    {
      "name": "string — industry-specific segment name",
      "whyItMatters": "string — why this segment matters for the objective",
      "opportunityLevel": "High | Medium | Low",
      "suggestedAction": "string — recommended activation tactic",
      "score": "integer 40-95 — opportunity score, High=80-95, Medium=55-75, Low=40-54"
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
    { "type": "Primary | Secondary | Leading Indicator | Optimization", "name": "string", "note": "string", "trend": "[8 integers 20-80 showing upward trend]" }
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

function isLiveCdpData(industry: IndustryContext): boolean {
  return industry.sampleDataContext.includes('live data from');
}

const LIVE_DATA_INSTRUCTIONS = `
## STRICT Data-Driven Analysis Requirements
You have access to REAL customer data from the Treasure Data CDP. You MUST follow these rules:

**CRITICAL: Use ONLY the exact numbers provided in the data context. Do NOT extrapolate, estimate, project, or invent ANY numbers.**
- When the data says "1,000 customers", say "1,000 customers" — never round up to 2,000 or any other number
- When the data says "86.6% repeat purchase rate", use exactly "86.6%" — do not change it to 95% or any other value
- When projecting impact, express it as a percentage range (e.g., "15-25% improvement") rather than fabricating dollar amounts
- If a specific number is not provided in the data context, say "based on available data" rather than inventing a figure

**Required data references:**
- Reference specific metrics by their EXACT values from the data (e.g., "$396 avg online order value", "86.6% repeat purchase rate")
- Name specific segments and their actual sizes from the CDP data
- Use actual loyalty tier distributions when discussing loyalty (e.g., Bronze 310, Silver 246, Gold 166, Platinum 82)
- Use actual churn risk distribution when discussing retention (e.g., 36.2% Low, 32.4% Medium, 31.4% High)
- Reference at least 3 specific metrics from the CDP data in your output
- In insightPanel.whatChanged, cite specific data points that shaped the recommendation

**Never do this:**
- Do NOT double or multiply customer counts (total is provided in data context)
- Do NOT fabricate revenue projections with specific dollar amounts unless the math is shown from provided metrics
- Do NOT invent percentages or rates not present in the data context
`;

export function buildSkillRequest(scenario: ScenarioConfig, industry: IndustryContext, workflowContext?: string): AssembledRequest {
  const skillPrompt = buildSkillPrompt(scenario.skillFamily, scenario, industry);
  const usesLiveData = isLiveCdpData(industry);

  const dataFraming = usesLiveData
    ? 'Outputs are grounded in real customer data from the Treasure Data CDP. Use ONLY the exact numbers provided in the data context — do not extrapolate, estimate, or invent any figures. When you cite a metric, it must match the data exactly.'
    : 'All outputs use sample data and should be framed as illustrative recommendations that showcase Treasure AI capabilities.';

  const contextBlock = workflowContext ? `\n${workflowContext}\n` : '';

  const systemPrompt = `You are the Treasure AI Experience Center, generating polished, business-ready recommendations for enterprise marketers. ${dataFraming}

${skillPrompt}
${contextBlock}${usesLiveData ? LIVE_DATA_INSTRUCTIONS : ''}
${OUTPUT_SCHEMA_INSTRUCTIONS}`;

  const userPrompt = `Generate the output for this scenario now. Output ONLY the JSON code fence.`;

  return { systemPrompt, userPrompt };
}
