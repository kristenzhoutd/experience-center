import type { SkillFamily, ScenarioConfig, IndustryContext } from '../types';
import { buildCampaignBriefPrompt } from './campaign-brief';
import { buildJourneyPrompt } from './journey';
import { buildSegmentOpportunityPrompt } from './segment-opportunity';
import { buildPerformanceAnalysisPrompt } from './performance-analysis';
import { buildInsightSummaryPrompt } from './insight-summary';

const builders: Record<SkillFamily, (scenario: ScenarioConfig, industry: IndustryContext) => string> = {
  'campaign-brief': buildCampaignBriefPrompt,
  'journey': buildJourneyPrompt,
  'segment-opportunity': buildSegmentOpportunityPrompt,
  'performance-analysis': buildPerformanceAnalysisPrompt,
  'insight-summary': buildInsightSummaryPrompt,
};

export function buildSkillPrompt(skillFamily: SkillFamily, scenario: ScenarioConfig, industry: IndustryContext): string {
  const builder = builders[skillFamily];
  if (!builder) throw new Error(`Unknown skill family: ${skillFamily}`);
  return builder(scenario, industry);
}
