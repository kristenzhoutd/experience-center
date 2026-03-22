/**
 * Scenario Resolution — maps a scenario ID to its full runtime context.
 *
 * Flow: scenarioId → ScenarioConfig + IndustryContext + skill prompt
 */

import type { ScenarioConfig, IndustryContext } from '../types.js';
import { getIndustryContext } from '../industry/index.js';

export interface ResolvedScenario {
  config: ScenarioConfig;
  industry: IndustryContext;
}

export function resolveScenario(scenarioConfig: ScenarioConfig): ResolvedScenario {
  const industry = getIndustryContext(scenarioConfig.industry);
  return { config: scenarioConfig, industry };
}
