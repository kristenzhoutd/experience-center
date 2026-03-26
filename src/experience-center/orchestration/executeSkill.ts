/**
 * Browser-side Skill Execution — calls the LLM proxy and parses structured output.
 * Routes through /api/llm proxy (until TD LLM Proxy supports CORS).
 */

import { storage } from '../../utils/storage';
import type { ScenarioConfig } from './types';
import { resolveScenario } from './resolveScenario';
import { buildSkillRequest } from './buildSkillRequest';
import { buildSlidePrompt } from './skills/slide-deck';

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

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getApiKey(): string {
  return storage.getItem('ai-suites-api-key') || '';
}

function getModel(): string {
  try {
    const settingsJson = storage.getItem('ai-suites:settings');
    return settingsJson ? JSON.parse(settingsJson).model || 'claude-sonnet-4-20250514' : 'claude-sonnet-4-20250514';
  } catch {
    return 'claude-sonnet-4-20250514';
  }
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key configured. Please set your API key in Settings.');

  const response = await fetch(`${API_BASE}/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 3000,
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
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
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
    return { success: false, error: message };
  }
}

// ── Slide Deck Generation ──

interface SlideSkillInput {
  outputData: Record<string, unknown>;
  deckLength: number;
  deckStyle: string;
  customTitle?: string;
  scenarioContext: Record<string, string | undefined>;
}

export type SlideResult = {
  success: true;
  data: Record<string, unknown>;
} | {
  success: false;
  error: string;
};

export async function executeSlideSkill(input: SlideSkillInput): Promise<SlideResult> {
  try {
    const systemPrompt = 'You are the Treasure AI Experience Center, generating presentation decks from structured AI output for enterprise marketers.';
    const userPrompt = buildSlidePrompt(input);
    const rawResponse = await callLLM(systemPrompt, userPrompt);

    const fenceMatch = rawResponse.match(/```slide-deck-json\s*\n([\s\S]*?)\n```/);
    const jsonStr = fenceMatch ? fenceMatch[1] : rawResponse;
    const parsed = JSON.parse(jsonStr.trim());

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      throw new Error('Invalid slide deck: missing slides array');
    }

    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
