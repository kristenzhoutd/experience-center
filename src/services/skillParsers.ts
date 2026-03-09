/**
 * Skill Parsers — Generic code-fence parser factory for all 21 paid-media skills.
 *
 * Each skill emits JSON inside a named code fence (e.g. ```campaign-brief-json).
 * The parsers extract and validate the JSON from streamed content.
 */

import type { CampaignBriefData } from '../types/campaignBriefEditor';
import type { Blueprint } from '../../electron/utils/ipc-types';
import type { CampaignSetupData, WizardSegment } from '../types/campaignConfig';
import type { CampaignAnalysisOutput } from '../types/campaignAnalysis';

// ============ Generic Parser Factory ============

/**
 * Create a parser that extracts JSON from a named code fence.
 * Returns null if no fence found or JSON is invalid.
 */
function createCodeFenceParser<T>(fenceName: string): (content: string) => T | null {
  return (content: string): T | null => {
    const pattern = new RegExp('```' + fenceName + '\\s*\\n([\\s\\S]*?)\\n\\s*```');
    const match = content.match(pattern);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as T;
    } catch {
      return null;
    }
  };
}

// ============ Category A: Campaign Planning ============

/** Campaign Setup: Partial updates to wizard Step 1 fields */
export const parseCampaignSetup = createCodeFenceParser<Partial<CampaignSetupData>>('campaign-setup-json');

/** Audience Selection: Segment recommendations for wizard Step 2 */
export const parseAudienceSelection = createCodeFenceParser<WizardSegment[]>('audience-selection-json');

/** Skill 1: Extract structured brief from natural language */
export const parseCampaignBrief = createCodeFenceParser<CampaignBriefData>('campaign-brief-json');

/** Skill 2: Partial brief updates from user instruction */
export const parseBriefUpdate = createCodeFenceParser<Partial<CampaignBriefData>>('brief-update-json');

/** Skill 4: Generate optimized blueprint */
export interface BlueprintsOutput {
  blueprints: Array<{
    id: string;
    name: string;
    variant: 'conservative' | 'balanced' | 'aggressive';
    confidence: 'High' | 'Medium' | 'Low';
    channels: string[];
    audiences: string[];
    budget: { amount: string; pacing: string };
    metrics: { reach: string; ctr: string; roas: string; conversions: string };
    messaging: string;
    cta: string;
    creativeBrief?: {
      primaryAngle: string;
      confidence: string;
      supportingMessages: string[];
      recommendedFormats: string[];
      fatigueRisk: string[];
      refreshPlan: string[];
    };
  }>;
}
export const parseBlueprints = createCodeFenceParser<BlueprintsOutput>('blueprints-json');

/** Skill 5: Partial blueprint updates */
export const parseBlueprintUpdate = createCodeFenceParser<Partial<Blueprint>>('blueprint-update-json');

/** Ad Set Config: 3 AI-generated ad set variants (conservative / balanced / aggressive) */
export interface AdSetConfigOutput {
  configs: Array<{
    id: string;
    name: string;
    variant: 'conservative' | 'balanced' | 'aggressive';
    confidence: 'High' | 'Medium' | 'Low';
    dailyBudget: number;
    optimizationGoal: string;
    billingEvent: string;
    targeting: { countries: string[]; ageMin: number; ageMax: number };
    status: string;
    rationale: string;
    estimatedMetrics: {
      dailyReach: string;
      estimatedCtr: string;
      estimatedCpa: string;
      estimatedConversions: string;
    };
  }>;
}
export const parseAdSetConfig = createCodeFenceParser<AdSetConfigOutput>('adset-config-json');

/** Launch Config: Full AI-generated campaign launch hierarchy */
export interface LaunchConfigOutput {
  campaign: { name: string; objective: string; dailyBudget: number; status: string; specialAdCategories: string[]; buyingType: string };
  adSets: Array<{ localId: string; name: string; dailyBudget: number; optimizationGoal: string; billingEvent: string; targeting: { geoLocations?: { countries: string[] }; ageMin?: number; ageMax?: number }; status: string; audienceLabel: string }>;
  creatives: Array<{ localId: string; name: string; headline: string; bodyText: string; ctaType: string; linkUrl: string; pageId: string }>;
  ads: Array<{ localId: string; name: string; adSetLocalId: string; creativeLocalId: string; status: string }>;
}
export const parseLaunchConfig = createCodeFenceParser<LaunchConfigOutput>('launch-config-json');

/** Launch Config Update: Partial updates from chat-driven refinement */
export interface LaunchConfigUpdateOutput {
  campaign?: Partial<LaunchConfigOutput['campaign']>;
  adSets?: Array<{ operation?: 'update' | 'add' | 'remove'; localId?: string; [key: string]: unknown }>;
  creatives?: Array<{ operation?: 'update' | 'add' | 'remove'; localId?: string; [key: string]: unknown }>;
  ads?: Array<{ operation?: 'update' | 'add' | 'remove'; localId?: string; [key: string]: unknown }>;
}
export const parseLaunchConfigUpdate = createCodeFenceParser<LaunchConfigUpdateOutput>('launch-config-update-json');

// ============ Category B: Audience & Targeting ============

/** Skill 7: Audience segment recommendations */
export interface AudienceRecommendationOutput {
  recommendations: Array<{
    segmentId: string;
    segmentName: string;
    reason: string;
    confidence: 'High' | 'Medium' | 'Low';
    suggestedRole: 'prospecting' | 'retargeting' | 'suppression';
  }>;
}
export const parseAudienceRecommendation = createCodeFenceParser<AudienceRecommendationOutput>('audience-recommendation-json');

/** Skill 8: Segment overlap analysis */
export interface SegmentOverlapOutput {
  overlaps: Array<{
    segmentA: string;
    segmentB: string;
    overlapPercentage: number;
    recommendation: string;
  }>;
  totalUniqueReach: number;
}
export const parseSegmentOverlap = createCodeFenceParser<SegmentOverlapOutput>('segment-overlap-json');

// ============ Category C: Performance Analysis ============

/** Skill 9: Campaign performance forecasting */
export interface ForecastOutput {
  predictions: Array<{
    date: string;
    predicted: number;
    lowerBound: number;
    upperBound: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  aiInsight: string;
}
export const parseForecast = createCodeFenceParser<ForecastOutput>('forecast-json');

/** Skill 10: Anomaly detection alerts */
export interface AnomaliesOutput {
  alerts: Array<{
    campaignId: string;
    severity: 'critical' | 'warning' | 'info';
    type: 'spike' | 'drop' | 'trend_change';
    metric: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    aiRecommendation: string;
  }>;
}
export const parseAnomalies = createCodeFenceParser<AnomaliesOutput>('anomalies-json');

/** Skill 11: Creative fatigue detection */
export interface CreativeFatigueOutput {
  results: Array<{
    adId: string;
    fatigueScore: number;
    trend: 'worsening' | 'stable' | 'improving';
    suggestedAction: 'refresh' | 'pause' | 'monitor' | 'rotate';
    recommendation: string;
  }>;
}
export const parseCreativeFatigue = createCodeFenceParser<CreativeFatigueOutput>('creative-fatigue-json');

/** Skill 12: Attribution analysis */
export interface AttributionOutput {
  channels: Array<{
    channel: string;
    firstTouch: number;
    lastTouch: number;
    linear: number;
    timeDecay: number;
    positionBased: number;
    dataDriven: number;
    revenue: number;
  }>;
  insights: Array<{
    channel: string;
    insight: string;
    recommendation: string;
  }>;
}
export const parseAttribution = createCodeFenceParser<AttributionOutput>('attribution-json');

/** Skill 13: Performance benchmarking */
export interface BenchmarkOutput {
  benchmarks: Array<{
    metric: string;
    yourValue: number;
    p25: number;
    p50: number;
    p75: number;
    percentile: number;
    position: 'above' | 'at' | 'below';
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
export const parseBenchmark = createCodeFenceParser<BenchmarkOutput>('benchmark-json');

// ============ Category C-2: Media Mix ============

/** Skill: Media mix recommendations */
export interface MediaMixOutput {
  channels: Array<{
    name: string;
    role: string;
    percentage: number;
    rationale: string;
  }>;
  removedChannels: Array<{
    name: string;
    reason: string;
  }>;
  addedChannels: Array<{
    name: string;
    reason: string;
  }>;
  strategy: string;
  expectedImpact: {
    reach: string;
    efficiency: string;
    confidence: 'High' | 'Medium' | 'Low';
  };
}
export const parseMediaMix = createCodeFenceParser<MediaMixOutput>('media-mix-json');

// ============ Category D: Optimization ============

/** Skill 14: Budget allocation recommendations */
export interface BudgetAllocationOutput {
  allocations: Array<{
    channel: string;
    currentBudget: number;
    recommendedBudget: number;
    change: number;
    reasoning: string;
  }>;
  expectedImpact: {
    projectedRoas: number;
    projectedConversions: number;
    projectedCpa: number;
  };
}
export const parseBudgetAllocation = createCodeFenceParser<BudgetAllocationOutput>('budget-allocation-json');

/** Skill 15: A/B test recommendations */
export interface ABTestsOutput {
  recommendations: Array<{
    testType: string;
    hypothesis: string;
    variants: Array<{ name: string; description: string }>;
    estimatedSampleSize: number;
    expectedLift: { min: number; max: number };
    priority: 'high' | 'medium' | 'low';
  }>;
}
export const parseABTests = createCodeFenceParser<ABTestsOutput>('ab-tests-json');

/** Skill 16: Optimization actions */
export interface OptimizationActionsOutput {
  actions: Array<{
    type: 'pause_ad' | 'reallocate_budget' | 'adjust_bid';
    risk: 'low' | 'high';
    targetId: string;
    reason: string;
    impact: string;
    confidence: number;
  }>;
}
export const parseOptimizationActions = createCodeFenceParser<OptimizationActionsOutput>('optimization-actions-json');

/** Skill 17: Campaign cloning */
export interface CloneCampaignOutput {
  clonedCampaign: Record<string, unknown>;
  changes: Array<{ field: string; original: unknown; new: unknown }>;
  suggestions: string[];
}
export const parseCloneCampaign = createCodeFenceParser<CloneCampaignOutput>('clone-campaign-json');

// ============ Category E: Company Context ============

/** Company context — full context setup */
export interface CompanyContextOutput {
  companyDescription: {
    name: string;
    description: string;
    products: string[];
    source: 'user-provided' | 'ai-inferred';
  };
  industry: {
    primary: string;
    subIndustry: string;
    source: 'user-provided' | 'ai-inferred';
  };
  regulatoryFrameworks: Array<{
    name: string;
    description: string;
    copyImplications: string[];
    source: 'user-provided' | 'ai-inferred';
  }>;
  seasonalTrends: Array<{
    event: string;
    timing: string;
    relevance: string;
    source: 'user-provided' | 'ai-inferred';
  }>;
  categoryBenchmarks: Array<{
    metric: string;
    industryAverage: string;
    topQuartile: string;
    source: 'user-provided' | 'ai-inferred';
  }>;
  competitors: Array<{
    name: string;
    description: string;
    valueProps: string[];
    differentiators: string[];
    source: 'user-provided' | 'ai-inferred';
  }>;
  personas: Array<{
    name: string;
    role: string;
    demographics: string;
    goals: string[];
    painPoints: string[];
    preferredChannels: string[];
    messagingAngle: string;
    source: 'user-provided' | 'ai-inferred';
  }>;
  lastUpdated: string;
}
export const parseCompanyContext = createCodeFenceParser<CompanyContextOutput>('company-context-json');

/** Company context — partial update */
export const parseCompanyContextUpdate = createCodeFenceParser<Partial<CompanyContextOutput>>('company-context-update-json');

// ============ Category F: Brand Compliance ============

/** Brand compliance check against brand guidelines */
export interface BrandComplianceOutput {
  overallStatus: 'pass' | 'warn' | 'fail';
  summary: string;
  score: number;
  violations: Array<{
    field: string;
    category: 'tone_voice' | 'terminology' | 'messaging' | 'legal' | 'format' | 'inclusive_language';
    severity: 'error' | 'warning' | 'info';
    rule: string;
    currentText: string;
    issue: string;
    suggestedFix: string;
  }>;
  passedChecks: Array<{
    category: string;
    detail: string;
  }>;
  guidelinesApplied: string[];
}
export const parseBrandCompliance = createCodeFenceParser<BrandComplianceOutput>('brand-compliance-json');

// ============ Category G: Web Analysis ============

/** Web analysis — detected personalization spots */
export interface WebAnalysisSpot {
  name: string;
  type: 'headline' | 'cta_button' | 'hero_image' | 'header_greeting' | 'navigation' | 'product_recommendation' | 'testimonial' | 'custom';
  selector: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  dimensions?: { width?: string; height?: string };
  currentContent?: { text?: string; imageUrl?: string; hasImage: boolean };
  personalizationPotential: 'high' | 'medium' | 'low';
}

export interface WebAnalysisOutput {
  websiteUrl: string;
  websiteName: string;
  pageName: string;
  pageSummary: string;
  spots: WebAnalysisSpot[];
}
export const parseWebAnalysis = createCodeFenceParser<WebAnalysisOutput>('web-analysis-json');

// ============ Category H: Page Description ============

/** Page description — AI-generated descriptions for saved pages */
export interface PageDescriptionEntry {
  pageId: string;
  description: string;
}
export const parsePageDescription = createCodeFenceParser<PageDescriptionEntry[]>('page-description-json');

// ============ Category I: Spot Recommendation ============

/** Spot recommendation — campaign-aware spot placement suggestions */
export interface SpotRecommendationOutput {
  recommendations: Array<{
    pageId: string;
    pageName: string;
    pageType: 'homepage' | 'product' | 'category' | 'cart' | 'landing' | 'other';
    recommendedSpots: Array<{
      spotId: string;
      spotName: string;
      spotType: 'headline' | 'cta_button' | 'hero_image' | 'header_greeting' | 'navigation' | 'product_recommendation' | 'testimonial' | 'custom';
      selector: string;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
      suggestedTargetingMode: 'default_only' | 'segment_variants';
      audienceAlignment: Array<{
        segmentName: string;
        messagingAngle: string;
      }>;
    }>;
    pageRelevanceScore: 'high' | 'medium' | 'low';
    pageRelevanceReason: string;
  }>;
  summary: {
    totalPages: number;
    totalSpots: number;
    topPrioritySpots: string[];
    strategyNote: string;
  };
}
export const parseSpotRecommendation = createCodeFenceParser<SpotRecommendationOutput>('spot-recommendation-json');

// ============ Category J: Content Agent ============

/** Content agent — AI-driven content editing for wizard Step 3 */
export interface ContentAgentTarget {
  pageId?: string;
  spotId?: string;
  variantId?: string;
}

export interface ContentAgentOutput {
  action: 'update_copy' | 'generate_spot_content' | 'create_variant' | 'content_audit' | 'tone_shift' | 'suggest_copy_options';
  target?: ContentAgentTarget;
  updateCopy?: {
    fields: {
      headline?: string;
      body?: string;
      ctaText?: string;
      imageUrl?: string;
      deepLinkUrl?: string;
    };
    rationale: string;
  };
  generateSpotContent?: {
    content: {
      headline: string;
      body: string;
      ctaText: string;
      imageUrl: string;
      deepLinkUrl: string;
    };
    rationale: string;
  };
  createVariant?: {
    audienceName: string;
    audienceRefId: string;
    content: {
      headline: string;
      body: string;
      ctaText: string;
      imageUrl: string;
      deepLinkUrl: string;
    };
    rationale: string;
  };
  contentAudit?: {
    overallScore: number;
    summary: string;
    findings: Array<{
      pageId: string;
      pageName: string;
      spotId: string;
      spotName: string;
      variantId: string;
      severity: 'error' | 'warning' | 'info';
      category: string;
      issue: string;
      suggestion: string;
    }>;
  };
  suggestCopyOptions?: {
    field: 'headline' | 'body' | 'ctaText';
    options: Array<{ label: string; value: string; rationale: string }>;
  };
  toneShift?: {
    targetTone: string;
    scope: 'current_spot' | 'all_spots';
    updates: Array<{
      pageId: string;
      spotId: string;
      variantId?: string;
      fields: {
        headline?: string;
        body?: string;
        ctaText?: string;
      };
    }>;
    rationale: string;
  };
}
export const parseContentAgent = createCodeFenceParser<ContentAgentOutput>('content-agent-json');

// ============ Category K: Campaign Analysis ============

/** Campaign analysis — post-launch performance analysis for personalization campaigns */
export const parseCampaignAnalysis = createCodeFenceParser<CampaignAnalysisOutput>('campaign-analysis-json');

// ============ Category F: Reporting ============

/** Skill 18: Report generation */
export interface ReportOutput {
  title: string;
  subtitle: string;
  generatedAt: string;
  reportPeriod: { start: string; end: string };
  sections: Array<{
    id: string;
    title: string;
    type: 'summary' | 'metrics' | 'chart' | 'table' | 'insights' | 'comparison';
    content: Record<string, unknown>;
    order: number;
  }>;
  aiSummary: string;
  keyTakeaways: string[];
  nextSteps: string[];
}
export const parseReport = createCodeFenceParser<ReportOutput>('report-json');

// ============ Category G: Platform Actions ============

/** Skill: connect-platform */
export interface PlatformActionOutput {
  action: 'connect' | 'disconnect' | 'status';
  platform: 'meta' | 'google' | 'tiktok';
}
export const parsePlatformAction = createCodeFenceParser<PlatformActionOutput>('platform-action-json');

/** Skill: diagnose-campaigns */
export interface CampaignFetchOutput {
  action: 'fetch_campaigns';
  platform: 'meta' | 'google' | 'tiktok' | 'all';
  dateRange?: { start: string; end: string };
}
export const parseCampaignFetch = createCodeFenceParser<CampaignFetchOutput>('campaign-fetch-json');

// ============ Multi-Parser Dispatch ============

/**
 * All parsers with their fence names, for use in chatStore.finalizeStream().
 * Iterates through all parsers and returns the first match.
 */
export const SKILL_PARSERS = [
  { name: 'campaign-setup', parse: parseCampaignSetup },
  { name: 'audience-selection', parse: parseAudienceSelection },
  { name: 'campaign-brief', parse: parseCampaignBrief },
  { name: 'brief-update', parse: parseBriefUpdate },
  { name: 'blueprints', parse: parseBlueprints },
  { name: 'blueprint-update', parse: parseBlueprintUpdate },
  { name: 'adset-config', parse: parseAdSetConfig },
  { name: 'launch-config', parse: parseLaunchConfig },
  { name: 'launch-config-update', parse: parseLaunchConfigUpdate },
  { name: 'audience-recommendation', parse: parseAudienceRecommendation },
  { name: 'segment-overlap', parse: parseSegmentOverlap },
  { name: 'forecast', parse: parseForecast },
  { name: 'anomalies', parse: parseAnomalies },
  { name: 'creative-fatigue', parse: parseCreativeFatigue },
  { name: 'attribution', parse: parseAttribution },
  { name: 'benchmark', parse: parseBenchmark },
  { name: 'media-mix', parse: parseMediaMix },
  { name: 'budget-allocation', parse: parseBudgetAllocation },
  { name: 'ab-tests', parse: parseABTests },
  { name: 'optimization-actions', parse: parseOptimizationActions },
  { name: 'clone-campaign', parse: parseCloneCampaign },
  { name: 'report', parse: parseReport },
  { name: 'brand-compliance', parse: parseBrandCompliance },
  { name: 'company-context', parse: parseCompanyContext },
  { name: 'company-context-update', parse: parseCompanyContextUpdate },
  { name: 'web-analysis', parse: parseWebAnalysis },
  { name: 'page-description', parse: parsePageDescription },
  { name: 'spot-recommendation', parse: parseSpotRecommendation },
  { name: 'content-agent', parse: parseContentAgent },
  { name: 'campaign-analysis', parse: parseCampaignAnalysis },
  { name: 'platform-action', parse: parsePlatformAction },
  { name: 'campaign-fetch', parse: parseCampaignFetch },
] as const;

/**
 * Try all skill parsers against content. Returns the first match with its skill name.
 */
export function detectSkillOutput(content: string): { skillName: string; data: unknown } | null {
  for (const { name, parse } of SKILL_PARSERS) {
    const result = parse(content);
    if (result) {
      return { skillName: name, data: result };
    }
  }
  return null;
}
