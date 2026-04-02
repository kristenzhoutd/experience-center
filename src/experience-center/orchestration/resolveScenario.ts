import type { ScenarioConfig, IndustryContext } from './types';
import { resolveIndustryContext } from './industry/index';

export interface ResolvedScenario {
  config: ScenarioConfig;
  industry: IndustryContext;
}

export async function resolveScenario(
  scenarioConfig: ScenarioConfig,
  parentSegmentId?: string | null
): Promise<ResolvedScenario> {
  const industry = await resolveIndustryContext(scenarioConfig.industry, parentSegmentId);
  return { config: scenarioConfig, industry };
}
