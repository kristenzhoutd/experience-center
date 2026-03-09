// Campaign Analysis type definitions

export type MetricTrend = 'up' | 'down' | 'flat';
export type SuggestionType = 'success' | 'opportunity' | 'warning';
export type SuggestionImpact = 'high' | 'medium' | 'low';
export type CreativeStatus = 'winner' | 'underperforming' | 'neutral';
export type SignificanceLevel = 'significant' | 'trending' | 'insufficient_data';

export interface AnalysisKpi {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  previousValue: number;
  trend: MetricTrend;
  trendValue: number;
  trendFormatted: string;
  invertTrend?: boolean;
}

export interface AnalysisSuggestion {
  type: SuggestionType;
  title: string;
  description: string;
  impact: SuggestionImpact;
  category: string;
}

export interface ConversionByPage {
  pageId: string;
  pageName: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  bounceRate: number;
  personalizationLift: number;
}

export interface ConversionBySpot {
  pageId: string;
  pageName: string;
  spots: Array<{
    spotId: string;
    spotName: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    personalizationLift: number;
  }>;
}

export interface CtrBreakdownEntry {
  label: string;
  ctr: number;
  impressions: number;
  clicks: number;
}

export interface ConversionByCreative {
  creativeId: string;
  creativeName: string;
  variant: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  status: CreativeStatus;
}

export interface SegmentPerformance {
  segmentId: string;
  segmentName: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
  personalizationLift: number;
}

export interface StatisticalSignificance {
  confidenceLevel: number;
  sampleSizeAdequate: boolean;
  daysRemaining: number;
  notes: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface CampaignAnalysisOutput {
  campaign: {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed' | 'draft';
    startDate: string;
    endDate: string;
    audiences: string[];
    conversionEvent: string;
  };
  kpis: AnalysisKpi[];
  aiInsights: {
    summary: string;
    suggestions: AnalysisSuggestion[];
  };
  conversionByPage: ConversionByPage[];
  conversionBySpot: ConversionBySpot[];
  ctrBreakdown: CtrBreakdownEntry[];
  conversionByCreative: ConversionByCreative[];
  segmentPerformance: SegmentPerformance[];
  statisticalSignificance: StatisticalSignificance;
  timeSeriesData: TimeSeriesDataPoint[];
}
