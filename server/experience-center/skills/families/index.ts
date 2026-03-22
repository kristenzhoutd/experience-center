import type { SkillFamily, ScenarioConfig, IndustryContext } from '../../types.js';
import { buildCampaignBriefPrompt } from './campaign-brief.js';
import { buildJourneyPrompt } from './journey.js';
import { buildSegmentOpportunityPrompt } from './segment-opportunity.js';
import { buildPerformanceAnalysisPrompt } from './performance-analysis.js';
import { buildInsightSummaryPrompt } from './insight-summary.js';

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
