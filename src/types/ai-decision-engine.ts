// AI Decision Engine type definitions
// Supports Executive Summary, RFM Segments, Channel Efficiency, Product Performance,
// Strategic Recommendations, and Implementation Roadmap features.

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';
export type GradeScale = 'A' | 'B' | 'C' | 'D';
export type RFMSegment =
  | 'Champions'
  | 'Loyal'
  | 'Potential Loyal'
  | 'At Risk'
  | 'Hibernating'
  | 'New Customers'
  | 'Need Attention'
  | 'About to Sleep'
  | 'Lost';

export interface AIInsightCard {
  id: string;
  title: string;
  severity: InsightSeverity;
  summary: string;
  metric: string;
  metricLabel: string;
  change: string;
  changePositive: boolean;
  agentSource: string;
}

export interface TopHighlightCard {
  id: string;
  category: 'segment' | 'channel' | 'product';
  label: string;
  name: string;
  primaryMetric: string;
  primaryMetricLabel: string;
  secondaryMetric: string;
}

export interface SegmentPerformanceRow {
  id: string;
  segment: RFMSegment;
  customerCount: number;
  revenue: number;
  avgLTV: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'flat';
  trendData: { date: string; value: number }[];
  rfmScore: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ChannelEfficiencyPoint {
  channel: string;
  roi: number;
  revenuePerConversion: number;
  spend: number;
  conversions: number;
  color: string;
}

export interface StrategicRecommendation {
  id: string;
  title: string;
  description: string;
  impact: GradeScale;
  timeline: GradeScale;
  effort: GradeScale;
  confidence: GradeScale;
  category: 'segment' | 'channel' | 'product' | 'campaign';
  estimatedRevenue: string;
  agentSource: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProductPerformanceRow {
  id: string;
  product: string;
  revenue: number;
  units: number;
  avgOrderValue: number;
  conversionRate: number;
  topChannel: string;
  trend: 'up' | 'down' | 'flat';
}

export interface ImplementationPhase {
  phase: 'Immediate' | 'Mid-term' | 'Long-term';
  timeframe: string;
  items: {
    title: string;
    description: string;
    status: 'not_started' | 'in_progress' | 'completed';
  }[];
}
