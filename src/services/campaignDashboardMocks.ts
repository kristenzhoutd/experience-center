/**
 * Campaign Dashboard Mock Data Generator
 *
 * Generates consistent, seeded mock analytics data for individual campaign dashboards.
 * Uses campaign ID and date ranges to ensure stable, reproducible metrics.
 */

import type { CampaignConfig } from '../types/campaignConfig';
import type {
  CampaignAnalysisOutput,
  AnalysisKpi,
  AnalysisSuggestion,
  ConversionByPage,
  ConversionBySpot,
  CtrBreakdownEntry,
  ConversionByCreative,
  SegmentPerformance,
  StatisticalSignificance,
  MetricTrend,
} from '../types/campaignAnalysis';

// ── Seeded random number generator ────────────────────────────────────

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ── KPI Generation ────────────────────────────────────────────────────

function generateKpis(campaign: CampaignConfig, seed: number): AnalysisKpi[] {
  const rand = seededRandom(seed);

  // Use campaign-specific factors to create more variation
  const pageCount = campaign.content.pages.length || 1;
  const spotCount = campaign.content.pages.reduce((acc, p) => acc + p.spots.length, 0) || 1;
  const segmentCount = campaign.audiences.segments.filter(s => s.isSelected).length || 1;

  // Scale metrics based on campaign scope
  const scopeMultiplier = Math.sqrt(pageCount * spotCount * segmentCount);

  const visitors = Math.round((2000 + rand() * 10000) * scopeMultiplier);
  const prevVisitors = Math.round(visitors * (0.75 + rand() * 0.4));
  const visitorsDelta = ((visitors - prevVisitors) / prevVisitors) * 100;

  const ctr = (2 + rand() * 6) * (1 + (scopeMultiplier - 1) * 0.1);
  const prevCtr = ctr * (0.8 + rand() * 0.3);
  const ctrDelta = ((ctr - prevCtr) / prevCtr) * 100;

  const conversionRate = (1.5 + rand() * 7) * (1 + segmentCount * 0.05);
  const prevConversion = conversionRate * (0.7 + rand() * 0.5);
  const conversionDelta = ((conversionRate - prevConversion) / prevConversion) * 100;

  const revenue = Math.round((500 + rand() * 8000) * scopeMultiplier * (1 + segmentCount * 0.2));
  const prevRevenue = Math.round(revenue * (0.7 + rand() * 0.5));
  const revenueDelta = ((revenue - prevRevenue) / prevRevenue) * 100;

  const bounceRate = (20 + rand() * 35) * (1 - spotCount * 0.02);
  const prevBounce = bounceRate * (0.85 + rand() * 0.3);
  const bounceDelta = ((bounceRate - prevBounce) / prevBounce) * 100;

  const avgTimeOnPage = (30 + rand() * 100) * (1 + spotCount * 0.05);
  const prevTime = avgTimeOnPage * (0.8 + rand() * 0.4);
  const timeDelta = ((avgTimeOnPage - prevTime) / prevTime) * 100;

  const lift = (8 + rand() * 30) * (1 + (pageCount * spotCount) * 0.02);
  const prevLift = lift * (0.7 + rand() * 0.5);
  const liftDelta = ((lift - prevLift) / prevLift) * 100;

  const formatTrend = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrend = (delta: number): MetricTrend => {
    if (Math.abs(delta) < 2) return 'flat';
    return delta > 0 ? 'up' : 'down';
  };

  return [
    {
      id: 'visitors',
      label: 'Visitors',
      value: visitors,
      formattedValue: visitors.toLocaleString(),
      previousValue: prevVisitors,
      trend: getTrend(visitorsDelta),
      trendValue: visitorsDelta,
      trendFormatted: formatTrend(visitorsDelta),
    },
    {
      id: 'ctr',
      label: 'CTR',
      value: ctr,
      formattedValue: `${ctr.toFixed(2)}%`,
      previousValue: prevCtr,
      trend: getTrend(ctrDelta),
      trendValue: ctrDelta,
      trendFormatted: formatTrend(ctrDelta),
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      value: conversionRate,
      formattedValue: `${conversionRate.toFixed(2)}%`,
      previousValue: prevConversion,
      trend: getTrend(conversionDelta),
      trendValue: conversionDelta,
      trendFormatted: formatTrend(conversionDelta),
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: revenue,
      formattedValue: `$${revenue.toLocaleString()}`,
      previousValue: prevRevenue,
      trend: getTrend(revenueDelta),
      trendValue: revenueDelta,
      trendFormatted: formatTrend(revenueDelta),
    },
    {
      id: 'bounce_rate',
      label: 'Bounce Rate',
      value: bounceRate,
      formattedValue: `${bounceRate.toFixed(1)}%`,
      previousValue: prevBounce,
      trend: getTrend(bounceDelta),
      trendValue: bounceDelta,
      trendFormatted: formatTrend(bounceDelta),
      invertTrend: true,
    },
    {
      id: 'avg_time',
      label: 'Avg. Time on Page',
      value: avgTimeOnPage,
      formattedValue: `${Math.round(avgTimeOnPage)}s`,
      previousValue: prevTime,
      trend: getTrend(timeDelta),
      trendValue: timeDelta,
      trendFormatted: formatTrend(timeDelta),
    },
    {
      id: 'personalization_lift',
      label: 'Personalization Lift',
      value: lift,
      formattedValue: `${lift.toFixed(1)}%`,
      previousValue: prevLift,
      trend: getTrend(liftDelta),
      trendValue: liftDelta,
      trendFormatted: formatTrend(liftDelta),
    },
  ];
}

// ── AI Insights Generation ────────────────────────────────────────────

function generateInsights(campaign: CampaignConfig, kpis: AnalysisKpi[], seed: number): { summary: string; suggestions: AnalysisSuggestion[] } {
  const rand = seededRandom(seed + 100);

  const visitors = kpis.find(k => k.id === 'visitors')?.value || 0;
  const revenue = kpis.find(k => k.id === 'revenue')?.value || 0;
  const lift = kpis.find(k => k.id === 'personalization_lift')?.value || 0;
  const conversionRate = kpis.find(k => k.id === 'conversion_rate')?.value || 0;
  const bounceRate = kpis.find(k => k.id === 'bounce_rate')?.value || 0;

  const summary = `${campaign.setup.name || 'This campaign'} has reached ${visitors.toLocaleString()} unique visitors with a ${lift.toFixed(1)}% personalization lift. Revenue impact is $${revenue.toLocaleString()} with a ${conversionRate.toFixed(2)}% conversion rate.`;

  const suggestions: AnalysisSuggestion[] = [];

  // Conversion trend suggestion
  const conversionTrend = kpis.find(k => k.id === 'conversion_rate')?.trendValue || 0;
  if (conversionTrend > 5) {
    suggestions.push({
      type: 'success',
      title: 'Strong conversion growth',
      description: `Conversion rate increased ${conversionTrend.toFixed(1)}% vs previous period. Your personalization strategy is working well.`,
      impact: 'high',
      category: 'performance',
    });
  } else if (conversionTrend < -5) {
    suggestions.push({
      type: 'warning',
      title: 'Conversion rate declining',
      description: `Conversion rate dropped ${Math.abs(conversionTrend).toFixed(1)}% vs previous period. Consider refreshing creative variants or refining audience targeting.`,
      impact: 'high',
      category: 'optimization',
    });
  }

  // Bounce rate suggestion
  if (bounceRate > 40) {
    suggestions.push({
      type: 'opportunity',
      title: 'High bounce rate detected',
      description: `Bounce rate of ${bounceRate.toFixed(1)}% suggests visitors aren't finding relevant content. Try adding more engaging above-the-fold personalization.`,
      impact: 'medium',
      category: 'engagement',
    });
  } else if (bounceRate < 30) {
    suggestions.push({
      type: 'success',
      title: 'Excellent engagement',
      description: `Low bounce rate of ${bounceRate.toFixed(1)}% indicates strong content relevance for your targeted segments.`,
      impact: 'low',
      category: 'engagement',
    });
  }

  // Personalization lift suggestion
  if (lift > 20) {
    suggestions.push({
      type: 'success',
      title: 'Exceptional personalization lift',
      description: `${lift.toFixed(1)}% lift demonstrates highly effective personalization. Consider expanding this strategy to similar audience segments.`,
      impact: 'high',
      category: 'scaling',
    });
  } else if (lift < 10) {
    suggestions.push({
      type: 'opportunity',
      title: 'Personalization lift below target',
      description: `Current lift of ${lift.toFixed(1)}% is below the 15% benchmark. Review segment definitions and creative relevance.`,
      impact: 'medium',
      category: 'optimization',
    });
  }

  // Add general opportunity if we don't have enough suggestions
  while (suggestions.length < 3) {
    const randomSuggestions = [
      {
        type: 'opportunity' as const,
        title: 'Expand to additional pages',
        description: 'Consider deploying similar personalization to other high-traffic pages to maximize reach.',
        impact: 'medium' as const,
        category: 'scaling',
      },
      {
        type: 'opportunity' as const,
        title: 'Test new creative variants',
        description: 'A/B test additional creative variants to identify top performers and further optimize conversion rates.',
        impact: 'medium' as const,
        category: 'testing',
      },
      {
        type: 'success' as const,
        title: 'Campaign health is good',
        description: 'All core metrics are performing within expected ranges. Continue monitoring for optimization opportunities.',
        impact: 'low' as const,
        category: 'monitoring',
      },
    ];

    const idx = Math.floor(rand() * randomSuggestions.length);
    if (!suggestions.find(s => s.title === randomSuggestions[idx].title)) {
      suggestions.push(randomSuggestions[idx]);
    }
  }

  return { summary, suggestions: suggestions.slice(0, 4) };
}

// ── Conversion by Page Generation ─────────────────────────────────────

function generateConversionByPage(campaign: CampaignConfig, seed: number): ConversionByPage[] {
  const rand = seededRandom(seed + 200);
  const pages = campaign.content.pages.filter(p => p.pageUrlPattern);

  if (pages.length === 0) {
    return [
      {
        pageId: 'home',
        pageName: 'Homepage',
        visitors: Math.round(3000 + rand() * 5000),
        conversions: Math.round(100 + rand() * 200),
        conversionRate: 3 + rand() * 4,
        revenue: Math.round(1000 + rand() * 3000),
        bounceRate: 25 + rand() * 20,
        personalizationLift: 10 + rand() * 20,
      },
    ];
  }

  return pages.map(page => {
    const visitors = Math.round(1000 + rand() * 4000);
    const conversions = Math.round(visitors * (0.02 + rand() * 0.06));
    const conversionRate = (conversions / visitors) * 100;
    const revenue = Math.round(conversions * (20 + rand() * 80));
    const bounceRate = 20 + rand() * 30;
    const personalizationLift = 8 + rand() * 22;

    return {
      pageId: page.pageId,
      pageName: page.pageName || page.pageUrlPattern,
      visitors,
      conversions,
      conversionRate,
      revenue,
      bounceRate,
      personalizationLift,
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);
}

// ── Conversion by Spot Generation ─────────────────────────────────────

function generateConversionBySpot(campaign: CampaignConfig, seed: number): ConversionBySpot[] {
  const rand = seededRandom(seed + 300);
  const pages = campaign.content.pages.filter(p => p.spots.length > 0);

  return pages.map(page => {
    const spots = page.spots.map(spot => {
      const impressions = Math.round(2000 + rand() * 8000);
      const clicks = Math.round(impressions * (0.02 + rand() * 0.08));
      const ctr = (clicks / impressions) * 100;
      const conversions = Math.round(clicks * (0.1 + rand() * 0.3));
      const personalizationLift = 5 + rand() * 25;

      return {
        spotId: spot.spotId,
        spotName: spot.spotName || `Spot ${spot.spotId.slice(-4)}`,
        impressions,
        clicks,
        ctr,
        conversions,
        personalizationLift,
      };
    });

    return {
      pageId: page.pageId,
      pageName: page.pageName || page.pageUrlPattern,
      spots,
    };
  });
}

// ── CTR Breakdown Generation ──────────────────────────────────────────

function generateCtrBreakdown(campaign: CampaignConfig, seed: number): CtrBreakdownEntry[] {
  const rand = seededRandom(seed + 400);
  const segments = campaign.audiences.segments.filter(s => s.isSelected);

  if (segments.length === 0) {
    return [
      { label: 'All Visitors', ctr: 3 + rand() * 4, impressions: 10000, clicks: Math.round(10000 * 0.05) },
    ];
  }

  return segments.map(segment => {
    const impressions = Math.round(2000 + rand() * 6000);
    const ctr = 2.5 + rand() * 5.5;
    const clicks = Math.round(impressions * (ctr / 100));

    return {
      label: segment.name,
      ctr,
      impressions,
      clicks,
    };
  }).sort((a, b) => b.ctr - a.ctr);
}

// ── Conversion by Creative Generation ─────────────────────────────────

function generateConversionByCreative(campaign: CampaignConfig, seed: number): ConversionByCreative[] {
  const rand = seededRandom(seed + 500);
  const creatives: ConversionByCreative[] = [];

  // Generate mock creatives from spots
  campaign.content.pages.forEach(page => {
    page.spots.forEach((spot, idx) => {
      const impressions = Math.round(1500 + rand() * 5000);
      const ctr = 2 + rand() * 6;
      const clicks = Math.round(impressions * (ctr / 100));
      const conversionRate = 1.5 + rand() * 5;
      const conversions = Math.round(clicks * (conversionRate / 100));

      let status: 'winner' | 'underperforming' | 'neutral' = 'neutral';
      if (ctr > 6 && conversionRate > 4) status = 'winner';
      else if (ctr < 3 || conversionRate < 2) status = 'underperforming';

      creatives.push({
        creativeId: `${spot.spotId}-variant-${idx}`,
        creativeName: spot.spotName || `Spot ${spot.spotId.slice(-4)}`,
        variant: idx % 2 === 0 ? 'Variant A' : 'Variant B',
        impressions,
        clicks,
        ctr,
        conversions,
        conversionRate,
        status,
      });
    });
  });

  if (creatives.length === 0) {
    return [
      {
        creativeId: 'default-1',
        creativeName: 'Hero Banner',
        variant: 'Variant A',
        impressions: 5000,
        clicks: 250,
        ctr: 5,
        conversions: 15,
        conversionRate: 6,
        status: 'winner',
      },
    ];
  }

  return creatives.slice(0, 8).sort((a, b) => b.conversionRate - a.conversionRate);
}

// ── Segment Performance Generation ────────────────────────────────────

function generateSegmentPerformance(campaign: CampaignConfig, seed: number): SegmentPerformance[] {
  const rand = seededRandom(seed + 600);
  const segments = campaign.audiences.segments.filter(s => s.isSelected);

  if (segments.length === 0) {
    return [];
  }

  return segments.map(segment => {
    const visitors = Math.round(1000 + rand() * 5000);
    const conversionRate = 2 + rand() * 6;
    const conversions = Math.round(visitors * (conversionRate / 100));
    const avgTimeOnPage = 40 + rand() * 80;
    const bounceRate = 20 + rand() * 30;
    const personalizationLift = 8 + rand() * 20;

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      visitors,
      conversions,
      conversionRate,
      avgTimeOnPage,
      bounceRate,
      personalizationLift,
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);
}

// ── Statistical Significance Generation ───────────────────────────────

function generateStatisticalSignificance(campaign: CampaignConfig, seed: number): StatisticalSignificance {
  const rand = seededRandom(seed + 700);

  const confidenceLevel = 85 + Math.round(rand() * 10);
  const sampleSizeAdequate = confidenceLevel >= 90;
  const daysRemaining = sampleSizeAdequate ? 0 : Math.round(3 + rand() * 10);

  const notes = sampleSizeAdequate
    ? 'Sample size is adequate for statistically significant results.'
    : `Continue running for ${daysRemaining} more days to reach statistical significance at 95% confidence.`;

  return {
    confidenceLevel,
    sampleSizeAdequate,
    daysRemaining,
    notes,
  };
}

// ── Time Series Data Generation ───────────────────────────────────────

function generateTimeSeriesData(campaign: CampaignConfig, seed: number): import('../types/campaignAnalysis').TimeSeriesDataPoint[] {
  const rand = seededRandom(seed + 800);
  const days = 30; // Last 30 days
  const data: import('../types/campaignAnalysis').TimeSeriesDataPoint[] = [];

  // Scale based on campaign configuration
  const pageCount = campaign.content.pages.length || 1;
  const spotCount = campaign.content.pages.reduce((acc, p) => acc + p.spots.length, 0) || 1;
  const segmentCount = campaign.audiences.segments.filter(s => s.isSelected).length || 1;
  const scopeMultiplier = Math.sqrt(pageCount * spotCount * segmentCount);

  const baseVisitors = (150 + rand() * 400) * scopeMultiplier;
  const baseConversionRate = (1.5 + rand() * 5) * (1 + segmentCount * 0.05);
  const baseRevenue = (30 + rand() * 200) * scopeMultiplier;

  // Create unique trend patterns based on campaign ID
  const trendPattern = (seed % 3) as 0 | 1 | 2; // 0: upward, 1: stable, 2: declining then recovering

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayProgress = (days - i) / days;
    const randomVariation = 0.7 + rand() * 0.6;

    // Apply different trend patterns
    let trendFactor = 1;
    if (trendPattern === 0) {
      // Upward trend
      trendFactor = 0.8 + dayProgress * 0.5;
    } else if (trendPattern === 1) {
      // Stable with fluctuation
      trendFactor = 0.95 + Math.sin(dayProgress * Math.PI * 3) * 0.15;
    } else {
      // Declining then recovering (V-shape)
      trendFactor = dayProgress < 0.5
        ? 1 - dayProgress * 0.4
        : 0.8 + (dayProgress - 0.5) * 0.6;
    }

    const visitors = Math.round(baseVisitors * trendFactor * randomVariation);
    const conversionRate = baseConversionRate * trendFactor * (0.85 + rand() * 0.3);
    const conversions = Math.round(visitors * (conversionRate / 100));
    const revenue = Math.round(baseRevenue * trendFactor * randomVariation * (1 + conversions / visitors));

    data.push({
      date: dateStr,
      visitors,
      conversions,
      conversionRate,
      revenue,
    });
  }

  return data;
}

// ── Main Mock Data Generator ──────────────────────────────────────────

export function generateCampaignDashboardMocks(campaign: CampaignConfig): CampaignAnalysisOutput {
  const seed = hashString(campaign.id);

  const kpis = generateKpis(campaign, seed);
  const insights = generateInsights(campaign, kpis, seed);
  const conversionByPage = generateConversionByPage(campaign, seed);
  const conversionBySpot = generateConversionBySpot(campaign, seed);
  const ctrBreakdown = generateCtrBreakdown(campaign, seed);
  const conversionByCreative = generateConversionByCreative(campaign, seed);
  const segmentPerformance = generateSegmentPerformance(campaign, seed);
  const statisticalSignificance = generateStatisticalSignificance(campaign, seed);
  const timeSeriesData = generateTimeSeriesData(campaign, seed);

  const selectedSegments = campaign.audiences.segments.filter(s => s.isSelected);

  return {
    campaign: {
      id: campaign.id,
      name: campaign.setup.name || 'Untitled Campaign',
      status: campaign.status === 'launched' ? 'active' : campaign.status === 'ready' ? 'paused' : 'draft',
      startDate: campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A',
      endDate: 'Ongoing',
      audiences: selectedSegments.map(s => s.name),
      conversionEvent: campaign.setup.goalType || 'conversion',
    },
    kpis,
    aiInsights: insights,
    conversionByPage,
    conversionBySpot,
    ctrBreakdown,
    conversionByCreative,
    segmentPerformance,
    statisticalSignificance,
    timeSeriesData,
  };
}
