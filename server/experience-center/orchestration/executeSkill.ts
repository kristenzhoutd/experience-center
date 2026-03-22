/**
 * Skill Execution — calls the LLM proxy and parses the structured output.
 */

import { loadSettings } from '../../services/storage.js';
import type { ScenarioConfig, IndustryContext } from '../types.js';
import { resolveScenario } from './resolveScenario.js';
import { buildSkillRequest } from './buildSkillRequest.js';

interface OutputData {
  summaryBanner: { goal: string; audience: string; topRecommendation: string; impactFraming: string };
  executiveSummary: string;
  audienceCards: Array<{ name: string; whyItMatters: string; opportunityLevel: string; suggestedAction: string }>;
  channelStrategy: Array<{ channel: string; role: string; messageAngle: string; reason: string }>;
  scenarioCore: { title: string; sections: Array<{ label: string; content: string }> };
  kpiFramework: Array<{ type: string; name: string; note: string }>;
  nextActions: Array<{ action: string; priority: string }>;
  insightPanel: { whyThisRecommendation: string; businessImpact: string[]; whatChanged: string[]; howTreasureHelps: string[] };
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const settings = loadSettings();
  const apiKey = process.env.API_KEY || settings.apiKey;
  const llmProxyUrl = (process.env.LLM_PROXY_URL || settings.llmProxyUrl || 'https://llm-proxy.us01.treasuredata.com').replace(/\/$/, '');
  const model = process.env.MODEL || settings.model || 'claude-sonnet-4-20250514';

  if (!apiKey) throw new Error('No API key configured. Please set your API key in Settings.');

  const response = await fetch(`${llmProxyUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `TD1 ${apiKey}`,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`LLM proxy returned HTTP ${response.status}: ${body.substring(0, 200)}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text?: string }> };
  const textBlock = data.content?.find(b => b.type === 'text');
  if (!textBlock?.text) throw new Error('No text content in LLM response');
  return textBlock.text;
}

function parseOutput(raw: string): OutputData {
  const fenceMatch = raw.match(/```experience-output-json\s*\n([\s\S]*?)\n```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : raw;
  const parsed = JSON.parse(jsonStr.trim());

  const required = ['summaryBanner', 'executiveSummary', 'audienceCards', 'channelStrategy', 'scenarioCore', 'kpiFramework', 'nextActions', 'insightPanel'];
  for (const field of required) {
    if (!(field in parsed)) throw new Error(`Missing required field: ${field}`);
  }
  return parsed as OutputData;
}

export type ExecutionResult = {
  success: true;
  data: OutputData;
  meta: { skillFamily: string; industry: string; scenarioId: string; durationMs: number };
} | {
  success: false;
  error: string;
};

export async function executeScenarioSkill(scenarioConfig: ScenarioConfig): Promise<ExecutionResult> {
  const start = Date.now();
  try {
    const { config, industry } = resolveScenario(scenarioConfig);
    const { systemPrompt, userPrompt } = buildSkillRequest(config, industry);
    const rawResponse = await callLLM(systemPrompt, userPrompt);
    const outputData = parseOutput(rawResponse);

    return {
      success: true,
      data: outputData,
      meta: {
        skillFamily: config.skillFamily,
        industry: config.industry,
        scenarioId: config.scenarioId,
        durationMs: Date.now() - start,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ExperienceCenter] Skill execution failed:', message);
    return { success: false, error: message };
  }
}
