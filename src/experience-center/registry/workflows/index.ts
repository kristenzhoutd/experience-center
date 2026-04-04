/**
 * Workflow Registry — maps scenarioId to WorkflowDef.
 * Scenarios without a workflow definition use the existing one-shot generation.
 */

import type { WorkflowDef } from '../../orchestration/types';
import { retRetail3Workflow } from './ret-retail-3';
import { perfTravel1Workflow } from './perf-travel-1';
import { insCpg3Workflow } from './ins-cpg-3';

const workflowRegistry: Record<string, WorkflowDef> = {
  'ret-retail-3': retRetail3Workflow,
  'perf-travel-1': perfTravel1Workflow,
  'ins-cpg-3': insCpg3Workflow,
};

export function getWorkflowDef(scenarioId: string): WorkflowDef | undefined {
  return workflowRegistry[scenarioId];
}

export { workflowRegistry };
