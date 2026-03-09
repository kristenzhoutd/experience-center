import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Line,
  Legend,
} from 'recharts';
import { ArrowUp, ArrowDown, CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react';
import { campaignConfigStorage } from '../services/campaignConfigStorage';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import type { CampaignConfig } from '../types/campaignConfig';

const AudienceComparisonReport = lazy(() => import('../components/reports/AudienceComparisonReport'));
const PageDeepDiveReport = lazy(() => import('../components/reports/PageDeepDiveReport'));
type OverviewTab = 'overview' | 'audiences' | 'pages';

const OVERVIEW_TABS: { id: OverviewTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'audiences', label: 'Audience Comparison' },
  { id: 'pages', label: 'Page Deep Dive' },
];

// ── Seeded pseudo-random ────────────────────────────────────────────

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

// ── Mock data generation ────────────────────────────────────────────

type TimeFrame = '7d' | '30d' | '90d';

interface CampaignStats {
  visitors: number;
  ctr: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversionRate: number;
  revenue: number;
  personalizationLift: number;
  goalPerformance: number;
}

function generateCampaignStats(campaign: CampaignConfig, timeFrame: TimeFrame): CampaignStats {
  const tfSeed = timeFrame === '7d' ? 1 : timeFrame === '30d' ? 2 : 3;
  const rand = seededRandom(hashString(campaign.id) + tfSeed);

  const volumeMultiplier = timeFrame === '7d' ? 1 : timeFrame === '30d' ? 4 : 12;
  const goalType = campaign.setup.goalType || 'conversion';

  // Goal-type biases
  const bias: Record<string, { ctr: number; conv: number; revenue: number; bounce: number }> = {
    conversion: { ctr: 1.2, conv: 1.3, revenue: 1.0, bounce: 0.9 },
    engagement: { ctr: 1.4, conv: 0.9, revenue: 0.8, bounce: 0.8 },
    retention: { ctr: 1.0, conv: 1.1, revenue: 1.1, bounce: 0.85 },
    revenue: { ctr: 0.9, conv: 1.0, revenue: 1.5, bounce: 1.0 },
    awareness: { ctr: 1.3, conv: 0.7, revenue: 0.6, bounce: 1.1 },
  };
  const b = bias[goalType] || bias.conversion;

  const visitors = Math.round((2000 + rand() * 8000) * volumeMultiplier);
  const ctr = (2 + rand() * 6) * b.ctr;
  const avgTimeOnPage = 30 + rand() * 150;
  const bounceRate = (20 + rand() * 40) * b.bounce;
  const conversionRate = (1 + rand() * 8) * b.conv;
  const revenue = Math.round((500 + rand() * 5000) * volumeMultiplier * b.revenue);
  const personalizationLift = 5 + rand() * 30;
  const goalPerformance = 40 + rand() * 60;

  return { visitors, ctr, avgTimeOnPage, bounceRate, conversionRate, revenue, personalizationLift, goalPerformance };
}

interface AggregatedKpis {
  totalVisitors: number;
  avgCtr: number;
  avgTimeOnPage: number;
  avgBounceRate: number;
  avgConversionRate: number;
  totalRevenue: number;
  avgLift: number;
  activeCampaigns: number;
  // Trend deltas
  visitorsDelta: number;
  ctrDelta: number;
  timeDelta: number;
  bounceDelta: number;
  conversionDelta: number;
  revenueDelta: number;
  liftDelta: number;
}

function aggregateKpis(campaigns: CampaignConfig[], timeFrame: TimeFrame): AggregatedKpis {
  if (campaigns.length === 0) {
    return {
      totalVisitors: 0, avgCtr: 0, avgTimeOnPage: 0, avgBounceRate: 0,
      avgConversionRate: 0, totalRevenue: 0, avgLift: 0, activeCampaigns: 0,
      visitorsDelta: 0, ctrDelta: 0, timeDelta: 0, bounceDelta: 0,
      conversionDelta: 0, revenueDelta: 0, liftDelta: 0,
    };
  }

  const stats = campaigns.map(c => generateCampaignStats(c, timeFrame));
  const n = stats.length;

  const totalVisitors = stats.reduce((s, x) => s + x.visitors, 0);
  const avgCtr = stats.reduce((s, x) => s + x.ctr, 0) / n;
  const avgTimeOnPage = stats.reduce((s, x) => s + x.avgTimeOnPage, 0) / n;
  const avgBounceRate = stats.reduce((s, x) => s + x.bounceRate, 0) / n;
  const avgConversionRate = stats.reduce((s, x) => s + x.conversionRate, 0) / n;
  const totalRevenue = stats.reduce((s, x) => s + x.revenue, 0);
  const avgLift = stats.reduce((s, x) => s + x.personalizationLift, 0) / n;

  // Delta uses a shifted seed to get different-but-stable "previous period" values
  const rand = seededRandom(hashString('delta') + (timeFrame === '7d' ? 10 : timeFrame === '30d' ? 20 : 30));
  const visitorsDelta = -5 + rand() * 20;
  const ctrDelta = -3 + rand() * 10;
  const timeDelta = -8 + rand() * 18;
  const bounceDelta = -6 + rand() * 8;
  const conversionDelta = -2 + rand() * 12;
  const revenueDelta = -4 + rand() * 18;
  const liftDelta = -3 + rand() * 14;

  return {
    totalVisitors, avgCtr, avgTimeOnPage, avgBounceRate, avgConversionRate,
    totalRevenue, avgLift, activeCampaigns: n,
    visitorsDelta, ctrDelta, timeDelta, bounceDelta, conversionDelta, revenueDelta, liftDelta,
  };
}

// ── Insights generation ─────────────────────────────────────────────

interface Insight {
  type: 'success' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

function generateInsights(kpis: AggregatedKpis, campaigns: CampaignConfig[]): { summary: string; suggestions: Insight[] } {
  const summary = `Across ${kpis.activeCampaigns} launched campaign${kpis.activeCampaigns !== 1 ? 's' : ''}, personalization is driving a ${kpis.avgLift.toFixed(1)}% average lift over non-personalized experiences. Total revenue impact is $${kpis.totalRevenue.toLocaleString()} with ${kpis.totalVisitors.toLocaleString()} unique visitors reached.`;

  const suggestions: Insight[] = [];

  if (kpis.conversionDelta > 0) {
    suggestions.push({
      type: 'success',
      title: 'Conversion rate trending up',
      description: `Average conversion rate increased ${kpis.conversionDelta.toFixed(1)}% vs previous period. ${campaigns.length > 1 ? 'Top-performing campaigns are driving the gain.' : 'Your campaign is performing well.'}`,
      impact: kpis.conversionDelta > 5 ? 'high' : 'medium',
    });
  } else {
    suggestions.push({
      type: 'warning',
      title: 'Conversion rate declining',
      description: `Conversion rate dropped ${Math.abs(kpis.conversionDelta).toFixed(1)}% vs previous period. Consider refreshing content variants or adjusting audience targeting.`,
      impact: 'high',
    });
  }

  if (kpis.avgBounceRate > 40) {
    suggestions.push({
      type: 'opportunity',
      title: 'High bounce rate detected',
      description: `Average bounce rate is ${kpis.avgBounceRate.toFixed(1)}%. Consider adding more engaging above-the-fold content or refining audience segments to improve relevance.`,
      impact: 'medium',
    });
  } else {
    suggestions.push({
      type: 'success',
      title: 'Low bounce rate',
      description: `Bounce rate of ${kpis.avgBounceRate.toFixed(1)}% is below average, indicating strong content relevance for your targeted audiences.`,
      impact: 'low',
    });
  }

  suggestions.push({
    type: 'opportunity',
    title: 'Expand personalization coverage',
    description: `With ${kpis.avgLift.toFixed(0)}% average lift, consider creating new campaigns targeting additional pages or content spots to maximize personalization ROI.`,
    impact: 'high',
  });

  return { summary, suggestions };
}

// ── Chart data generators ───────────────────────────────────────────

function generateTopCampaignsData(campaigns: CampaignConfig[], timeFrame: TimeFrame) {
  return campaigns
    .map(c => ({
      name: (c.setup.name || 'Untitled').slice(0, 28),
      performance: generateCampaignStats(c, timeFrame).goalPerformance,
      id: c.id,
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 10);
}

function generateCtrByPageData(campaigns: CampaignConfig[], timeFrame: TimeFrame) {
  const pageMap = new Map<string, { clicks: number; impressions: number }>();
  const tfSeed = timeFrame === '7d' ? 1 : timeFrame === '30d' ? 2 : 3;

  for (const c of campaigns) {
    for (const page of c.content.pages) {
      const rand = seededRandom(hashString(c.id + page.pageId) + tfSeed);
      const existing = pageMap.get(page.pageName) || { clicks: 0, impressions: 0 };
      const impressions = Math.round(1000 + rand() * 5000);
      existing.impressions += impressions;
      existing.clicks += Math.round(impressions * (0.02 + rand() * 0.08));
      pageMap.set(page.pageName, existing);
    }
  }

  return Array.from(pageMap.entries())
    .map(([name, d]) => ({ name: name.slice(0, 24), ctr: (d.clicks / d.impressions) * 100 }))
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 8);
}

function generateConvBySegmentData(campaigns: CampaignConfig[], timeFrame: TimeFrame) {
  const segMap = new Map<string, { conversions: number; visitors: number }>();
  const tfSeed = timeFrame === '7d' ? 1 : timeFrame === '30d' ? 2 : 3;

  for (const c of campaigns) {
    for (const seg of c.audiences.segments) {
      if (!seg.isSelected) continue;
      const rand = seededRandom(hashString(c.id + seg.id) + tfSeed);
      const existing = segMap.get(seg.name) || { conversions: 0, visitors: 0 };
      const visitors = Math.round(500 + rand() * 3000);
      existing.visitors += visitors;
      existing.conversions += Math.round(visitors * (0.01 + rand() * 0.09));
      segMap.set(seg.name, existing);
    }
  }

  return Array.from(segMap.entries())
    .map(([name, d]) => ({ name: name.slice(0, 24), convRate: (d.conversions / d.visitors) * 100 }))
    .sort((a, b) => b.convRate - a.convRate)
    .slice(0, 8);
}

function generateSpotEngagementData(campaigns: CampaignConfig[], timeFrame: TimeFrame) {
  const spotMap = new Map<string, { impressions: number; clicks: number }>();
  const tfSeed = timeFrame === '7d' ? 1 : timeFrame === '30d' ? 2 : 3;

  for (const c of campaigns) {
    for (const page of c.content.pages) {
      for (const spot of page.spots) {
        const rand = seededRandom(hashString(c.id + spot.spotId) + tfSeed);
        const existing = spotMap.get(spot.spotName) || { impressions: 0, clicks: 0 };
        const impressions = Math.round(800 + rand() * 4000);
        existing.impressions += impressions;
        existing.clicks += Math.round(impressions * (0.03 + rand() * 0.07));
        spotMap.set(spot.spotName, existing);
      }
    }
  }

  return Array.from(spotMap.entries())
    .map(([name, d]) => ({ name: name.slice(0, 20), impressions: d.impressions, clicks: d.clicks }))
    .slice(0, 6);
}

function generateDeviceData(timeFrame: TimeFrame) {
  const rand = seededRandom(hashString('device') + (timeFrame === '7d' ? 1 : timeFrame === '30d' ? 2 : 3));
  const desktop = 50 + rand() * 15;
  const mobile = 30 + rand() * 12;
  const tablet = 100 - desktop - mobile;
  return [
    { name: 'Desktop', value: Math.round(desktop * 10) / 10 },
    { name: 'Mobile', value: Math.round(mobile * 10) / 10 },
    { name: 'Tablet', value: Math.round(tablet * 10) / 10 },
  ];
}

const DEVICE_COLORS = ['#6366f1', '#10b981', '#f59e0b'];

function generateTrendData(campaigns: CampaignConfig[], timeFrame: TimeFrame) {
  const days = timeFrame === '7d' ? 7 : timeFrame === '30d' ? 30 : 90;
  const data: { date: string; visitors: number; ctr: number }[] = [];
  const baseSeed = hashString(campaigns.map(c => c.id).join(''));

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dayOfWeek = d.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;

    const rand = seededRandom(baseSeed + i * 7);
    const sinWave = Math.sin((i / days) * Math.PI * 2) * 0.15;
    const baseVisitors = (800 + rand() * 2000) * campaigns.length * weekendFactor * (1 + sinWave);
    const baseCtr = (2.5 + rand() * 3) * (1 + sinWave * 0.5);

    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: Math.round(baseVisitors),
      ctr: Math.round(baseCtr * 100) / 100,
    });
  }
  return data;
}

function generateLiftData(campaigns: CampaignConfig[], timeFrame: TimeFrame) {
  const tfSeed = timeFrame === '7d' ? 1 : timeFrame === '30d' ? 2 : 3;
  return campaigns.slice(0, 8).map(c => {
    const rand = seededRandom(hashString(c.id + 'lift') + tfSeed);
    const control = 1 + rand() * 6;
    const liftPct = 5 + rand() * 30;
    const personalized = control * (1 + liftPct / 100);
    return {
      name: (c.setup.name || 'Untitled').slice(0, 22),
      control: Math.round(control * 100) / 100,
      personalized: Math.round(personalized * 100) / 100,
      lift: Math.round(liftPct * 10) / 10,
    };
  });
}

// ── Component ───────────────────────────────────────────────────────

export default function CampaignOverviewPage() {
  const navigate = useNavigate();
  const [allCampaigns, setAllCampaigns] = useState<CampaignConfig[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d');
  const [activeTab, setActiveTab] = useState<OverviewTab>('overview');

  useEffect(() => {
    setAllCampaigns(campaignConfigStorage.listConfigs());
  }, []);

  const handleCreate = useCallback(() => {
    const id = useCampaignConfigStore.getState().initNewConfig();
    navigate(`/campaigns/${id}`);
  }, [navigate]);

  const launched = useMemo(() => allCampaigns.filter(c => c.status === 'launched'), [allCampaigns]);

  const kpis = useMemo(() => aggregateKpis(launched, timeFrame), [launched, timeFrame]);
  const insights = useMemo(() => generateInsights(kpis, launched), [kpis, launched]);
  const topCampaigns = useMemo(() => generateTopCampaignsData(launched, timeFrame), [launched, timeFrame]);
  const ctrByPage = useMemo(() => generateCtrByPageData(launched, timeFrame), [launched, timeFrame]);
  const convBySegment = useMemo(() => generateConvBySegmentData(launched, timeFrame), [launched, timeFrame]);
  const spotEngagement = useMemo(() => generateSpotEngagementData(launched, timeFrame), [launched, timeFrame]);
  const deviceData = useMemo(() => generateDeviceData(timeFrame), [timeFrame]);
  const trendData = useMemo(() => generateTrendData(launched, timeFrame), [launched, timeFrame]);
  const liftData = useMemo(() => generateLiftData(launched, timeFrame), [launched, timeFrame]);

  const renderReportTab = () => {
    switch (activeTab) {
      case 'audiences': return <AudienceComparisonReport />;
      case 'pages': return <PageDeepDiveReport />;
      default: return null;
    }
  };

  // ── Empty state ─────────────────────────────────────────────────
  if (launched.length === 0) {
    return (
      <div className="h-full p-4">
        <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 mb-1">No launched campaigns yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Launch your first campaign to see analytics and performance insights here.
          </p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Campaign
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────
  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Tab bar */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {OVERVIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative whitespace-nowrap pb-3 px-3 text-[13px] font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab !== 'overview' ? (
            <div className="p-6">
              <Suspense fallback={
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              }>
                {renderReportTab()}
              </Suspense>
            </div>
          ) : (
          <>
          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Overview</h1>
              <p className="text-sm text-gray-500 mt-1">
                Showing analytics for {launched.length} launched campaign{launched.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFrame}
                onChange={e => setTimeFrame(e.target.value as TimeFrame)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:border-gray-400 focus:outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Campaign
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Row 1: Primary KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard
                label="Unique Visitors"
                value={kpis.totalVisitors.toLocaleString()}
                delta={kpis.visitorsDelta}
              />
              <KpiCard
                label="Avg CTR"
                value={`${kpis.avgCtr.toFixed(2)}%`}
                delta={kpis.ctrDelta}
              />
              <KpiCard
                label="Avg Time on Page"
                value={`${Math.floor(kpis.avgTimeOnPage / 60)}m ${Math.round(kpis.avgTimeOnPage % 60)}s`}
                delta={kpis.timeDelta}
              />
              <KpiCard
                label="Bounce Rate"
                value={`${kpis.avgBounceRate.toFixed(1)}%`}
                delta={kpis.bounceDelta}
                invertTrend
              />
            </div>

            {/* Row 2: Secondary KPIs + AI Insights */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7 grid grid-cols-2 gap-4">
                <KpiCard
                  label="Avg Conversion Rate"
                  value={`${kpis.avgConversionRate.toFixed(2)}%`}
                  delta={kpis.conversionDelta}
                />
                <KpiCard
                  label="Total Revenue"
                  value={`$${kpis.totalRevenue.toLocaleString()}`}
                  delta={kpis.revenueDelta}
                />
                <KpiCard
                  label="Personalization Lift"
                  value={`+${kpis.avgLift.toFixed(1)}%`}
                  delta={kpis.liftDelta}
                />
                <KpiCard
                  label="Active Campaigns"
                  value={String(kpis.activeCampaigns)}
                  delta={0}
                />
              </div>
              <div className="col-span-5">
                <InsightsPanel summary={insights.summary} suggestions={insights.suggestions} />
              </div>
            </div>

            {/* Row 3: Top Performing Campaigns */}
            {topCampaigns.length > 0 && (
              <ChartCard title="Top Performing Campaigns" subtitle="Ranked by goal performance score">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCampaigns} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={140} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'Performance']}
                      />
                      <Bar dataKey="performance" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {/* Row 4: CTR by Page + Conversion by Segment */}
            <div className="grid grid-cols-2 gap-4">
              {ctrByPage.length > 0 && (
                <ChartCard title="Click-Through Rate by Page">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ctrByPage} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={120} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                          formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)}%`, 'CTR']}
                        />
                        <Bar dataKey="ctr" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}
              {convBySegment.length > 0 && (
                <ChartCard title="Conversion Rate by Segment">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={convBySegment} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={120} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                          formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)}%`, 'Conv Rate']}
                        />
                        <Bar dataKey="convRate" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}
            </div>

            {/* Row 5: Content Spot Engagement + Device Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {spotEngagement.length > 0 && (
                <ChartCard title="Content Spot Engagement" subtitle="Impressions vs Clicks">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spotEngagement} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="impressions" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={14} name="Impressions" />
                        <Bar dataKey="clicks" fill="#a5b4fc" radius={[4, 4, 0, 0]} barSize={14} name="Clicks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}
              <ChartCard title="Device Breakdown">
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, bottom: 20 }}>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''} ${value ?? 0}%`}
                      >
                        {deviceData.map((_, idx) => (
                          <Cell key={idx} fill={DEVICE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Row 6: Performance Trend */}
            <ChartCard title="Performance Trend Over Time" subtitle="Daily visitors and click-through rate">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ left: -10, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis yAxisId="visitors" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis yAxisId="ctr" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area
                      yAxisId="visitors"
                      type="monotone"
                      dataKey="visitors"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#visitorsGrad)"
                      name="Visitors"
                    />
                    <Line
                      yAxisId="ctr"
                      type="monotone"
                      dataKey="ctr"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name="CTR %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Row 7: Revenue Impact / Personalization Lift */}
            {liftData.length > 0 && (
              <ChartCard title="Revenue Impact — Control vs Personalized" subtitle="Conversion rate comparison showing personalization lift">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liftData} margin={{ left: -10, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        formatter={(value: number | undefined, name: string | undefined) => [
                          `${(value ?? 0).toFixed(2)}%`,
                          name === 'control' ? 'Control' : 'Personalized',
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="control" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={14} name="Control" />
                      <Bar dataKey="personalized" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} name="Personalized" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Lift badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {liftData.map(d => (
                    <span key={d.name} className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                      <ArrowUp className="w-2.5 h-2.5" />
                      {d.name}: +{d.lift}%
                    </span>
                  ))}
                </div>
              </ChartCard>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline sub-components ───────────────────────────────────────────

function KpiCard({ label, value, delta, invertTrend = false }: {
  label: string;
  value: string;
  delta: number;
  invertTrend?: boolean;
}) {
  const trend = delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat';
  const isPositive = invertTrend ? trend === 'down' : trend === 'up';
  const isNegative = invertTrend ? trend === 'up' : trend === 'down';

  const trendColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400';
  const bgColor = isPositive
    ? 'bg-green-50 border-green-100'
    : isNegative
      ? 'bg-red-50 border-red-100'
      : 'bg-gray-50 border-gray-100';

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : null;

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
        {TrendIcon && <TrendIcon className="w-3 h-3" />}
        <span className="text-[10px] font-semibold">{Math.abs(delta).toFixed(1)}%</span>
        <span className="text-[10px] text-gray-400 ml-1">vs prev</span>
      </div>
    </div>
  );
}

function InsightsPanel({ summary, suggestions }: { summary: string; suggestions: Insight[] }) {
  const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
    opportunity: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    warning: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
  };
  const impactBadge: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-full">
      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-2">AI Generated Insights</p>
      <p className="text-xs text-gray-600 leading-relaxed mb-4">{summary}</p>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => {
          const cfg = typeConfig[suggestion.type] || typeConfig.success;
          const Icon = cfg.icon;
          return (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl border p-3 ${cfg.bg}`}>
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-900">{suggestion.title}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${impactBadge[suggestion.impact] || impactBadge.low}`}>
                    {suggestion.impact}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{suggestion.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}
