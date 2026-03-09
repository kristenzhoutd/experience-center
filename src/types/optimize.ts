// In-Flight Optimization type definitions

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'scheduled';
export type PacingStatus = 'on_track' | 'underspent' | 'overspent';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'budget' | 'performance' | 'audience' | 'creative' | 'pacing';
export type AdStatus = 'active' | 'paused';
export type CreativeType = 'image' | 'video' | 'carousel';

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface CampaignMetrics {
  roas: number;
  conversions: number;
  cpa: number;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  cpa: number;
  roas: number;
}

// Previous period metrics for delta comparisons
export interface PreviousMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  cpa: number;
  roas: number;
}

// Creative fatigue detection
export interface CreativeFatigue {
  score: number; // 0-100 (100 = very fatigued)
  reason: string; // "CTR dropped 23% in 7 days"
  recommendation: string; // "Consider refreshing creative"
  daysActive: number;
}

export interface Ad {
  id: string;
  name: string;
  status: AdStatus;
  creative: {
    type: CreativeType;
    thumbnail?: string;
  };
  metrics: AdMetrics;
  trendData?: TrendDataPoint[]; // 7-day trend for sparklines
  previousMetrics?: PreviousMetrics; // For delta indicators
  fatigue?: CreativeFatigue; // Creative fatigue detection
  launchDate?: string; // When the ad was launched
}

export interface AdGroupMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpa: number;
  roas: number;
}

export interface AdGroup {
  id: string;
  name: string;
  status: AdStatus;
  targeting: string;
  ads: Ad[];
  metrics: AdGroupMetrics;
}

export interface LiveCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channel: string; // Primary channel (deprecated, use channels)
  channels?: string[]; // Multiple channels the campaign runs on
  budget: number;
  spent: number;
  pacingStatus: PacingStatus;
  metrics: CampaignMetrics;
  trendData: TrendDataPoint[];
  startDate: string;
  endDate: string;
  daysRemaining: number;
  adGroups?: AdGroup[];
  platformCampaignId?: string;
  platform?: 'meta' | 'google' | 'tiktok';
}

export interface OptimizationAlert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  campaignId?: string;
  campaignName?: string;
  createdAt: string;
  isDismissed: boolean;
}

export interface ChannelPerformance {
  channel: string;
  spend: number;
  roas: number;
  conversions: number;
  cpa: number;
  color: string;
}

export interface AudienceSegment {
  name: string;
  spend: number;
  roas: number;
  conversions: number;
  performance: 'above' | 'on_target' | 'below';
}

export interface OptimizationDashboardData {
  campaigns: LiveCampaign[];
  alerts: OptimizationAlert[];
  channelPerformance: ChannelPerformance[];
  audienceSegments: AudienceSegment[];
  summary: {
    totalBudget: number;
    totalSpent: number;
    overallRoas: number;
    totalConversions: number;
    activeCampaigns: number;
  };
}

// Semi-autonomous optimization actions
export type OptimizationActionType = 'pause_ad' | 'activate_ad' | 'reallocate_budget' | 'pause_campaign' | 'pause_adgroup';
export type OptimizationRiskLevel = 'low' | 'high';
export type OptimizationActionStatus = 'pending' | 'approved' | 'rejected' | 'auto_applied';

export interface OptimizationAction {
  id: string;
  type: OptimizationActionType;
  risk: OptimizationRiskLevel;
  status: OptimizationActionStatus;
  targetId: string; // Ad, campaign, or ad group ID
  targetName: string;
  reason: string;
  impact: string;
  timestamp: Date;
  confidence: number; // 0-100 confidence score
}
