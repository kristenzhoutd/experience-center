/**
 * Workflow Engine — executes workflow steps using the existing skill pipeline.
 * Handles both LLM-powered and simulated steps.
 */

import type { ScenarioConfig, WorkflowStepDef, StepResult } from './types';
import { resolveScenario } from './resolveScenario';
import { buildStepContextPrompt } from './stepPromptBuilder';
import { buildCumulativeContext } from './contextAccumulator';
import { getStepSchemaInstructions } from './stepSchemas';
import { storage } from '../../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getApiKey(): string {
  return import.meta.env.VITE_SANDBOX_API_KEY || storage.getItem('ai-suites-api-key') || '';
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
  if (!apiKey) throw new Error('No API key configured.');

  const response = await fetch(`${API_BASE}/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
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

function parseStepOutput(raw: string): Record<string, unknown> {
  const fenceMatch = raw.match(/```experience-output-json\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
  }
  // Try outermost braces
  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(raw.substring(braceStart, braceEnd + 1)); } catch { /* fall through */ }
  }
  throw new Error('Could not parse step output JSON');
}

/**
 * Resolve the industry context for a workflow step (call before executeWorkflowStep).
 * Returns the enriched IndustryContext with sandbox metrics.
 */
export async function resolveWorkflowStepContext(
  baseScenarioConfig: ScenarioConfig,
): Promise<{ industry: import('./types').IndustryContext; parentSegmentId: string | null }> {
  const settingsJson = storage.getItem('ai-suites:settings');
  const selectedParentSegmentId = settingsJson ? JSON.parse(settingsJson).selectedParentSegmentId : null;
  const defaultSegments: Record<string, string> = { retail: '1312648', travel: '1313380', cpg: '1313389' };
  const apiKey = getApiKey();
  const isSandbox = apiKey.startsWith('13232/');
  const parentSegmentId = selectedParentSegmentId || (isSandbox ? defaultSegments[baseScenarioConfig.industry] : null);
  const { industry } = await resolveScenario(baseScenarioConfig, parentSegmentId);
  return { industry, parentSegmentId };
}

/**
 * Execute a single workflow step.
 * For LLM steps: builds a modified scenario config, injects cumulative context, calls LLM.
 * For simulated steps: returns mock data (to be implemented in Phase 2).
 * Accepts optional pre-resolved industry context to avoid double-resolving.
 */
export async function executeWorkflowStep(
  stepDef: WorkflowStepDef,
  baseScenarioConfig: ScenarioConfig,
  stepHistory: StepResult[],
  cumulativeContext: Record<string, string>,
  preResolvedIndustry?: import('./types').IndustryContext,
): Promise<{ output: Record<string, unknown>; summary: string }> {
  if (stepDef.executionMode === 'simulated') {
    // Phase 2: load from mock artifacts
    return {
      output: {
        summaryBanner: { goal: 'Simulated', audience: 'Demo', topRecommendation: 'This is a simulated product screen preview.', impactFraming: 'Preview mode' },
        executiveSummary: 'This step shows a simulated Treasure Data product screen.',
        audienceCards: [],
        channelStrategy: [],
        scenarioCore: { title: stepDef.label, sections: [{ label: 'Preview', content: 'This is a simulated artifact that represents a real Treasure Studio product screen.' }] },
        kpiFramework: [],
        nextActions: [],
        insightPanel: { whyThisRecommendation: '', businessImpact: [], whatChanged: [], howTreasureHelps: [] },
      },
      summary: stepDef.summaryTemplate,
    };
  }

  // LLM-powered step
  const modifiedConfig: ScenarioConfig = {
    ...baseScenarioConfig,
    skillFamily: stepDef.skillFamily || baseScenarioConfig.skillFamily,
    outputModules: stepDef.outputModules.length > 0 ? stepDef.outputModules : baseScenarioConfig.outputModules,
    strategicIntent: [baseScenarioConfig.strategicIntent || '', stepDef.promptOverlay || ''].filter(Boolean).join('. '),
  };

  // Use pre-resolved industry context if available, otherwise resolve now
  let industry: import('./types').IndustryContext;
  if (preResolvedIndustry) {
    industry = preResolvedIndustry;
  } else {
    const resolved = await resolveWorkflowStepContext(modifiedConfig);
    industry = resolved.industry;
  }

  // Build step-specific prompt (context + schema, no conflicting old output instructions)
  const stepContext = buildStepContextPrompt(modifiedConfig, industry, stepDef);
  const contextStr = buildCumulativeContext(stepHistory, cumulativeContext, stepDef.label);
  const schemaInstructions = getStepSchemaInstructions(stepDef.stepType, stepDef.skillFamily);

  const systemPrompt = `You are the Treasure AI Experience Center, generating focused, step-specific output for a guided workflow.

${stepContext}
${contextStr ? `\n${contextStr}\n` : ''}
${schemaInstructions}`;

  const userPrompt = `Generate the output for this workflow step: "${stepDef.label}". Output ONLY the JSON code fence.`;

  console.log(`[WorkflowEngine] Executing step "${stepDef.label}" (${stepDef.stepType}, ${stepDef.skillFamily})`);

  const rawResponse = await callLLM(systemPrompt, userPrompt);
  const output = parseStepOutput(rawResponse);

  // Extract summary from output
  const summary = (output.headline as string) || stepDef.summaryTemplate;

  return { output, summary };
}
