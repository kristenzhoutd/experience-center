import type { ScenarioConfig, IndustryContext } from './types';
import { getIndustryContext } from './industry/index';

export interface ResolvedScenario {
  config: ScenarioConfig;
  industry: IndustryContext;
}

export function resolveScenario(scenarioConfig: ScenarioConfig): ResolvedScenario {
  const industry = getIndustryContext(scenarioConfig.industry);
  return { config: scenarioConfig, industry };
}
