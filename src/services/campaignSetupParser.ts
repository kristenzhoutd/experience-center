/**
 * Parser for campaign-setup-json code fence output.
 * Extracts partial CampaignSetupData from AI response.
 */

import type { CampaignSetupData } from '../types/campaignConfig';

const FENCE_REGEX = /```campaign-setup-json\s*\n([\s\S]*?)```/;

export function parseCampaignSetupOutput(content: string): Partial<CampaignSetupData> | null {
  const match = content.match(FENCE_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    const result: Partial<CampaignSetupData> = {};

    if (typeof parsed.name === 'string') result.name = parsed.name;
    if (typeof parsed.objective === 'string') result.objective = parsed.objective;
    if (typeof parsed.businessGoal === 'string') result.businessGoal = parsed.businessGoal;
    if (typeof parsed.goalType === 'string') result.goalType = parsed.goalType as CampaignSetupData['goalType'];
    if (typeof parsed.startDate === 'string') result.startDate = parsed.startDate;
    if (typeof parsed.endDate === 'string') result.endDate = parsed.endDate;
    if (typeof parsed.primaryKpi === 'string') result.primaryKpi = parsed.primaryKpi;
    if (Array.isArray(parsed.secondaryKpis)) result.secondaryKpis = parsed.secondaryKpis;
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    console.warn('[CampaignSetupParser] Failed to parse JSON from code fence');
    return null;
  }
}
