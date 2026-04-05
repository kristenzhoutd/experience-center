/**
 * Workflow Registry — resolves WorkflowDef for any scenario
 * using outcome-based templates via the factory.
 */

import type { WorkflowDef } from '../../orchestration/types';
import { createWorkflowFromScenario } from './workflow-factory';
import { getScenarioConfig } from '../scenarioRegistry';

/**
 * Get the workflow definition for a scenario.
 * All scenarios use factory-generated templates based on their outcome.
 */
export function getWorkflowDef(scenarioId: string): WorkflowDef | undefined {
  const scenarioConfig = getScenarioConfig(scenarioId);
  if (!scenarioConfig) return undefined;
  return createWorkflowFromScenario(scenarioConfig);
}
