// Campaign-related type definitions

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  attachments?: AttachedFile[];
}

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  base64Data?: string;
  source?: 'file' | 'image' | 'campaign' | 'brief';
  contentText?: string;
}

export interface CampaignBriefFields {
  budget: boolean;
  channels: boolean;
  audiences: boolean;
  objective: boolean;
  timeline: boolean;
  messaging: boolean;
  kpis: boolean;
  pacing: boolean;
  creativeMix: boolean;
}

export interface ChannelBudget {
  channel: string;
  amount: string;
  percentage: number;
  description?: string;
}

export interface CreativeBriefData {
  primaryAngle: string;
  confidence: string;
  supportingMessages: string[];
  recommendedFormats: string[];
  fatigueRisk: string[];
  refreshPlan: string[];
}

export interface TargetingData {
  primary: {
    name: string;
    confidence: 'High' | 'Medium' | 'Low';
    tags: string[];
    source: string;
    runsOn: string[];
    spendPriority: 'High' | 'Medium' | 'Low';
  };
  secondary?: {
    name: string;
    confidence: 'High' | 'Medium' | 'Low';
    tags: string[];
    source: string;
    runsOn: string[];
    spendPriority: 'High' | 'Medium' | 'Low';
  };
  exclusions: string[];
  risksAndNotes: { title: string; description: string }[];
}

export interface ExtractedCampaignData {
  budget: string;
  channels: string[];
  audiences: string[];
  objective: string;
  timeline: string;
  messaging: string;
  kpis: { reach?: string; ctr?: string; roas?: string; conversions?: string };
  pacing: string;
  creativeMix: string[];
  channelBudgets: ChannelBudget[];
  creativeBrief?: CreativeBriefData;
  targeting?: TargetingData;
  brandName: string;
  campaignName: string;
}

export interface MissingFieldInfo {
  field: string;
  label: string;
  prompt: string;
}

export const FIELD_WEIGHTS: Record<keyof CampaignBriefFields, number> = {
  budget: 1.0,
  objective: 1.0,
  audiences: 0.9,
  channels: 0.8,
  timeline: 0.7,
  messaging: 0.5,
  kpis: 0.4,
  pacing: 0.3,
  creativeMix: 0.3,
};

export const FIELD_KEYWORDS: Record<keyof CampaignBriefFields, string[]> = {
  budget: ['budget', 'spend', 'investment', 'cost', '£', '$', '€'],
  objective: ['objective', 'goal', 'target', 'awareness', 'conversion', 'leads'],
  audiences: ['audience', 'target', 'demographic', 'persona', 'segment'],
  channels: ['channel', 'platform', 'facebook', 'instagram', 'google', 'meta', 'tiktok', 'linkedin'],
  timeline: ['timeline', 'duration', 'weeks', 'months', 'schedule', 'launch'],
  messaging: ['messaging', 'copy', 'headline', 'creative', 'message'],
  kpis: ['kpi', 'metric', 'ctr', 'roas', 'reach', 'impressions', 'conversion rate'],
  pacing: ['pacing', 'daily', 'weekly', 'even', 'accelerated', 'front-loaded'],
  creativeMix: ['creative', 'format', 'video', 'static', 'carousel', 'stories'],
};

// Campaign Data Types (for campaigns page)
export type CampaignType = 'Awareness' | 'Conversion' | 'Engagement' | 'Retargeting';
export type CampaignStatus = 'Active' | 'Paused' | 'Completed' | 'Draft' | 'Scheduled';
export type CampaignPacing = 'On Track' | 'Ahead' | 'Behind' | 'Not Started' | 'Complete';

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
  spend: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  dateRange: string;
  startDate: string;
  endDate: string;
  conversions: string;
  reach: string;
  budget: string;
  spent: number;
  pacing: CampaignPacing;
  budgetSpent: number;
  channels: string[];
  metrics: CampaignMetrics;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignStats {
  activeCampaigns: number;
  needsAttention: number;
  overBudget: number;
  launchingThisWeek: number;
  activeCampaignsChange: number;
  needsAttentionChange: number;
  overBudgetChange: number;
  launchingThisWeekChange: number;
}

export type OptimizationIcon = 'pause' | 'budget' | 'exclude';
export type OptimizationStatus = 'pending' | 'dismissed' | 'reviewed';

export interface OptimizationOpportunity {
  id: string;
  icon: OptimizationIcon;
  title: string;
  confidence: string;
  description: string;
  details?: string;
  campaignId?: string;
  status: OptimizationStatus;
  createdAt?: string;
}

export interface CampaignFilters {
  status?: CampaignStatus | CampaignStatus[];
  type?: CampaignType | CampaignType[];
  channel?: string | string[];
  search?: string;
  performance?: 'above_target' | 'below_target' | 'on_target';
  roasThreshold?: number;
  budgetMin?: number;
  budgetMax?: number;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'name_asc' | 'name_desc' | 'spend_asc' | 'spend_desc' | 'roas_asc' | 'roas_desc' | 'date_asc' | 'date_desc';
}

export type StatCardType = 'active' | 'attention' | 'budget' | 'launching';
