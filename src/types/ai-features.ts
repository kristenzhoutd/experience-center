// AI Features Type Definitions for Campaign Optimization

// ============================================
// FORECASTING TYPES
// ============================================

export interface ForecastPrediction {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export type ForecastMetric = 'roas' | 'conversions' | 'spend' | 'cpa' | 'ctr' | 'impressions' | 'clicks';
export type ForecastHorizon = 7 | 14 | 30;
export type TrendDirection = 'up' | 'down' | 'stable';

export interface CampaignForecast {
  campaignId: string;
  campaignName: string;
  metric: ForecastMetric;
  horizon: ForecastHorizon;
  predictions: ForecastPrediction[];
  trend: TrendDirection;
  trendPercentage: number;
  seasonalityFactors?: string[];
  aiInsight: string;
  generatedAt: string;
}

// ============================================
// ANOMALY DETECTION TYPES
// ============================================

export type AnomalySeverity = 'critical' | 'warning' | 'info';
export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'outlier' | 'unusual_pattern';

export interface AnomalyAlert {
  id: string;
  campaignId: string;
  campaignName: string;
  severity: AnomalySeverity;
  type: AnomalyType;
  metric: string;
  currentValue: number;
  expectedValue: number;
  expectedRange: { min: number; max: number };
  deviation: number; // Percentage deviation from expected
  detectedAt: string;
  description: string;
  aiRecommendation: string;
  isDismissed: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AnomalySummary {
  critical: number;
  warning: number;
  info: number;
  total: number;
  lastChecked: string;
}

// ============================================
// CREATIVE FATIGUE TYPES
// ============================================

export type FatigueTrend = 'worsening' | 'stable' | 'improving';
export type FatigueAction = 'refresh' | 'pause' | 'monitor' | 'rotate' | 'scale_down';

export interface CreativeFatigueData {
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  fatigueScore: number; // 0-100, higher = more fatigued
  trend: FatigueTrend;
  daysActive: number;
  impressions: number;
  frequency: number;
  ctrInitial: number;
  ctrCurrent: number;
  ctrDecline: number; // Percentage decline
  recommendation: string;
  suggestedAction: FatigueAction;
  predictedDaysUntilCritical?: number;
  creativePreview?: string; // URL or base64
}

// ============================================
// A/B TEST RECOMMENDATION TYPES
// ============================================

export type TestType = 'creative' | 'audience' | 'bidding' | 'placement' | 'copy' | 'landing_page' | 'schedule';
export type TestPriority = 'high' | 'medium' | 'low';

export interface TestVariant {
  name: string;
  description: string;
  expectedPerformance?: number;
}

export interface ABTestRecommendation {
  id: string;
  campaignId: string;
  campaignName: string;
  testType: TestType;
  hypothesis: string;
  variants: TestVariant[];
  estimatedSampleSize: number;
  estimatedDuration: number; // Days
  expectedLift: { min: number; max: number };
  confidence: number;
  priority: TestPriority;
  aiReasoning: string;
  suggestedStartDate?: string;
  prerequisites?: string[];
}

// ============================================
// ATTRIBUTION TYPES
// ============================================

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';

export interface AttributionData {
  channel: string;
  touchpoints: number;
  firstTouch: number; // Percentage
  lastTouch: number;
  linear: number;
  timeDecay: number;
  positionBased: number;
  dataDriven: number;
  assistedConversions: number;
  directConversions: number;
  revenue: number;
  color: string;
}

export interface AttributionPath {
  path: string[];
  pathString: string;
  conversions: number;
  revenue: number;
  avgTouchpoints: number;
  avgDaysToConvert: number;
}

export interface AttributionInsight {
  channel: string;
  insight: string;
  recommendation: string;
}

// ============================================
// CDP SEGMENT TYPES
// ============================================

export interface CDPSegment {
  id: string;
  name: string;
  description?: string;
  kind: 'batch' | 'realtime';
  audienceSize: number;
  parentSegmentId?: string;
  parentSegmentName?: string;
  createdAt: string;
  updatedAt: string;
  folder?: string;
}

export interface CDPSegmentOverlap {
  segmentA: { id: string; name: string; size: number };
  segmentB: { id: string; name: string; size: number };
  overlapSize: number;
  overlapPercentageA: number; // What % of A is in B
  overlapPercentageB: number; // What % of B is in A
}

export interface CDPSegmentPerformance {
  segmentId: string;
  segmentName: string;
  audienceSize: number;
  activeCampaigns: number;
  avgRoas: number;
  avgCpa: number;
  avgCtr: number;
  totalSpend: number;
  totalConversions: number;
  totalRevenue: number;
  trend: TrendDirection;
}

// ============================================
// COMPETITOR BENCHMARKING TYPES
// ============================================

export type Industry = 'retail' | 'ecommerce' | 'saas' | 'finance' | 'travel' | 'healthcare' | 'education' | 'entertainment' | 'general';
export type BenchmarkPosition = 'above' | 'at' | 'below';

export interface IndustryBenchmark {
  metric: string;
  metricLabel: string;
  industry: Industry;
  p25: number;
  p50: number; // Median
  p75: number;
  p90: number;
  yourValue: number;
  percentile: number;
  position: BenchmarkPosition;
  gap: number; // Difference from median
  trend: TrendDirection;
}

export interface BenchmarkComparison {
  industry: Industry;
  period: string;
  benchmarks: IndustryBenchmark[];
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  aiRecommendations: string[];
}

// ============================================
// NATURAL LANGUAGE CAMPAIGN BUILDER TYPES
// ============================================

export interface CampaignDraft {
  id: string;
  name: string;
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention';
  description?: string;
  budget: number;
  budgetType: 'daily' | 'lifetime';
  startDate: string;
  endDate?: string;
  channels: string[];
  audiences: string[];
  targetingCriteria?: Record<string, any>;
  suggestedCreatives: CreativeSuggestion[];
  estimatedReach: number;
  estimatedImpressions: number;
  estimatedConversions: number;
  estimatedCpa: number;
  aiConfidence: number;
  generatedFrom: string; // Original NL prompt
  warnings?: string[];
}

export interface CreativeSuggestion {
  type: 'image' | 'video' | 'carousel' | 'text';
  headline?: string;
  description?: string;
  callToAction?: string;
  dimensions?: string;
}

export interface NLBuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  draftUpdate?: Partial<CampaignDraft>;
}

// ============================================
// REPORT GENERATION TYPES
// ============================================

export type ReportFormat = 'pdf' | 'ppt' | 'html' | 'markdown';
export type ReportTemplate = 'executive_summary' | 'detailed_analysis' | 'weekly_report' | 'campaign_review' | 'custom';

export interface ReportSection {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'insight' | 'recommendation' | 'kpi' | 'text';
  title: string;
  content: string | object;
  order: number;
  isIncluded: boolean;
}

export interface GeneratedReport {
  id: string;
  title: string;
  template: ReportTemplate;
  sections: ReportSection[];
  campaignIds: string[];
  dateRange: { start: string; end: string };
  generatedAt: string;
  format: ReportFormat;
  downloadUrl?: string;
  aiSummary: string;
}

export interface ReportConfig {
  template: ReportTemplate;
  title: string;
  campaignIds: string[];
  dateRange: { start: string; end: string };
  includeSections: string[];
  format: ReportFormat;
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
}

// ============================================
// CAMPAIGN CLONING TYPES
// ============================================

export type CloneEnhancementType = 'optimize' | 'scale' | 'test_variant' | 'new_audience' | 'new_channel';

export interface CloneWithAIOptions {
  sourceCampaignId: string;
  sourceCampaignName: string;
  enhancementType: CloneEnhancementType;
  targetBudget?: number;
  targetBudgetMultiplier?: number;
  targetChannels?: string[];
  targetAudiences?: string[];
  includeCreatives: boolean;
  aiSuggestions: CloneSuggestion[];
}

export interface CloneSuggestion {
  category: 'budget' | 'targeting' | 'creative' | 'bidding' | 'schedule';
  suggestion: string;
  expectedImpact: string;
  isApplied: boolean;
}

export interface ClonedCampaignPreview {
  name: string;
  budget: number;
  channels: string[];
  audiences: string[];
  changes: { field: string; original: any; new: any }[];
  estimatedPerformance: {
    reach: number;
    conversions: number;
    roas: number;
  };
}

// ============================================
// PERFORMANCE COMPARISON TYPES
// ============================================

export interface ComparisonMetric {
  name: string;
  label: string;
  format: 'number' | 'currency' | 'percentage';
  values: { campaignId: string; campaignName: string; value: number; delta?: number }[];
  winner: string;
  winnerValue: number;
}

export interface CampaignComparison {
  campaigns: { id: string; name: string }[];
  metrics: ComparisonMetric[];
  dateRange: { start: string; end: string };
  overallWinner?: string;
  insights: string[];
  aiAnalysis: string;
}

// ============================================
// BUDGET PACING TYPES
// ============================================

export type PacingStatus = 'on_track' | 'underspent' | 'overspent' | 'at_risk';

export interface BudgetPacingData {
  campaignId: string;
  campaignName: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  percentSpent: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  idealDailySpend: number;
  actualDailySpend: number;
  idealPacing: { day: number; cumulative: number }[];
  actualPacing: { day: number; cumulative: number }[];
  projectedEndSpend: number;
  projectedEndDate: string;
  status: PacingStatus;
  variance: number; // Percentage variance from ideal
  aiRecommendation?: string;
}

// ============================================
// SAVED QUERIES TYPES
// ============================================

export type QueryCategory = 'performance' | 'optimization' | 'analysis' | 'reporting' | 'custom';

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  category: QueryCategory;
  description?: string;
  lastUsed: string;
  usageCount: number;
  isPinned: boolean;
  createdAt: string;
  tags?: string[];
}

// ============================================
// TIMELINE / GANTT TYPES
// ============================================

export type TimelineStatus = 'active' | 'scheduled' | 'completed' | 'paused' | 'draft';

export interface TimelineEvent {
  id: string;
  campaignId: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  channel: string;
  channels: string[];
  budget: number;
  status: TimelineStatus;
  color: string;
  overlaps: string[]; // Campaign IDs that overlap
  progress: number; // 0-100
}

export interface TimelineConfig {
  viewMode: 'day' | 'week' | 'month' | 'quarter';
  startDate: string;
  endDate: string;
  showOverlaps: boolean;
  groupByChannel: boolean;
}

// ============================================
// QUICK ACTIONS TYPES
// ============================================

export type QuickActionType =
  | 'edit'
  | 'duplicate'
  | 'clone_with_ai'
  | 'pause'
  | 'resume'
  | 'analyze'
  | 'generate_report'
  | 'view_forecast'
  | 'compare'
  | 'archive';

export interface QuickAction {
  id: QuickActionType;
  label: string;
  icon: string;
  description?: string;
  variant?: 'default' | 'warning' | 'danger';
  requiresConfirmation?: boolean;
  isDisabled?: (campaign: any) => boolean;
}

// ============================================
// SHARED / UTILITY TYPES
// ============================================

export interface DateRange {
  start: string;
  end: string;
}

export interface AIGeneratedContent {
  content: string;
  confidence: number;
  generatedAt: string;
  model?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  progress?: number;
}
