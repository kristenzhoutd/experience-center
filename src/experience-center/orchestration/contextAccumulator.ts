/**
 * Context Accumulator — serializes workflow step history into
 * LLM-consumable context for multi-step prompt injection.
 */

import type { StepResult } from './types';

/**
 * Build a context string from the workflow step history
 * that can be injected into the LLM prompt for subsequent steps.
 */
export function buildCumulativeContext(
  stepHistory: StepResult[],
  cumulativeContext: Record<string, string>,
  currentStepLabel: string,
): string {
  if (stepHistory.length === 0) return '';

  const lines: string[] = ['## Prior Workflow Context', ''];

  for (const step of stepHistory) {
    const branchLabel = step.chosenBranchId
      ? step.stepDef.branches.find(b => b.branchId === step.chosenBranchId)?.label || step.chosenBranchId
      : 'completed';

    lines.push(`### Step ${stepHistory.indexOf(step) + 1}: ${step.stepDef.label} (${step.stepDef.stepType})`);
    lines.push(step.summary);
    if (step.chosenBranchId) {
      lines.push(`User chose: "${branchLabel}"`);
    }
    lines.push('');
  }

  // Add accumulated context keys
  const contextEntries = Object.entries(cumulativeContext);
  if (contextEntries.length > 0) {
    lines.push('### Accumulated Context');
    for (const [key, value] of contextEntries) {
      lines.push(`- ${key}: ${value}`);
    }
    lines.push('');
  }

  lines.push(`## Current Step: ${currentStepLabel}`);
  lines.push('Build on the analysis and decisions above. Reference specific findings from prior steps.');

  return lines.join('\n');
}
