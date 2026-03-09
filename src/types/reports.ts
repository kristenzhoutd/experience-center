// Reports & Analysis type definitions

export type MetricTrend = 'up' | 'down' | 'flat';
export type PerformanceStatus = 'above_goal' | 'on_goal' | 'below_goal';

export interface TimeSeriesDataPoint {
  date: string;
  spend: number;
  conversions: number;
  impressions: number;
  clicks: number;
  roas: number;
}

export interface ExecutiveMetric {
  label: string;
  value: number;
  formattedValue: string;
  goal?: number;
  trend: MetricTrend;
  trendValue: number;
  status: PerformanceStatus;
}

export interface ChannelBreakdown {
  channel: string;
  spend: number;
  roas: number;
  conversions: number;
  cpa: number;
  impressions: number;
  clicks: number;
  ctr: number;
  contribution: number; // percentage of total
  color: string;
}

export interface AudienceInsight {
  segment: string;
  roas: number;
  conversions: number;
  spend: number;
  performance: 'top' | 'good' | 'underperforming';
  recommendation?: string;
}

export interface AIInsight {
  id: string;
  type: 'success' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact?: string;
  actionable: boolean;
}

export interface CampaignReport {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  dateRange: {
    start: string;
    end: string;
  };
  executiveMetrics: ExecutiveMetric[];
  timeSeriesData: TimeSeriesDataPoint[];
  channelBreakdown: ChannelBreakdown[];
  audienceInsights: AudienceInsight[];
  aiInsights: AIInsight[];
}

export interface ReportsDashboardData {
  campaigns: { id: string; name: string; status: string }[];
  selectedCampaign: CampaignReport | null;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'ppt';
  sections: {
    executiveSummary: boolean;
    performanceTimeline: boolean;
    channelBreakdown: boolean;
    audienceInsights: boolean;
    aiInsights: boolean;
  };
  includeCharts: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}
