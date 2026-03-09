import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

// ---------------------------------------------------------------------------
// Audience comparison data
// ---------------------------------------------------------------------------

const AUDIENCE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'] as const;

interface AudienceData {
  id: string;
  name: string;
  color: string;
  metrics: {
    ctr: number;
    convRate: number;
    bounceRate: number;
    avgSessionDuration: number;
    pagesPerSession: number;
    aov: number;
    retentionRate: number;
  };
  radar: {
    ctr: number;
    convRate: number;
    engagement: number;
    retention: number;
    aov: number;
  };
}

const AUDIENCES: AudienceData[] = [
  {
    id: 'high-value',
    name: 'High-Value Shoppers',
    color: AUDIENCE_COLORS[0],
    metrics: {
      ctr: 6.8,
      convRate: 4.2,
      bounceRate: 28.3,
      avgSessionDuration: 7.4,
      pagesPerSession: 5.8,
      aov: 142.5,
      retentionRate: 72.1,
    },
    radar: { ctr: 85, convRate: 78, engagement: 92, retention: 88, aov: 95 },
  },
  {
    id: 'new-visitors',
    name: 'New Visitors',
    color: AUDIENCE_COLORS[1],
    metrics: {
      ctr: 3.1,
      convRate: 1.4,
      bounceRate: 58.7,
      avgSessionDuration: 2.1,
      pagesPerSession: 2.3,
      aov: 54.2,
      retentionRate: 18.5,
    },
    radar: { ctr: 42, convRate: 28, engagement: 35, retention: 22, aov: 36 },
  },
  {
    id: 'returning',
    name: 'Returning Customers',
    color: AUDIENCE_COLORS[2],
    metrics: {
      ctr: 5.4,
      convRate: 3.6,
      bounceRate: 32.1,
      avgSessionDuration: 5.9,
      pagesPerSession: 4.7,
      aov: 98.7,
      retentionRate: 64.3,
    },
    radar: { ctr: 72, convRate: 68, engagement: 78, retention: 80, aov: 66 },
  },
  {
    id: 'cart-abandoners',
    name: 'Cart Abandoners',
    color: AUDIENCE_COLORS[3],
    metrics: {
      ctr: 7.2,
      convRate: 2.1,
      bounceRate: 41.5,
      avgSessionDuration: 4.3,
      pagesPerSession: 4.1,
      aov: 112.3,
      retentionRate: 35.7,
    },
    radar: { ctr: 90, convRate: 42, engagement: 65, retention: 44, aov: 75 },
  },
  {
    id: 'newsletter',
    name: 'Newsletter Subscribers',
    color: AUDIENCE_COLORS[4],
    metrics: {
      ctr: 4.6,
      convRate: 2.8,
      bounceRate: 36.9,
      avgSessionDuration: 4.8,
      pagesPerSession: 3.9,
      aov: 76.4,
      retentionRate: 52.8,
    },
    radar: { ctr: 60, convRate: 55, engagement: 70, retention: 65, aov: 51 },
  },
];

const RADAR_METRICS = ['CTR', 'Conv Rate', 'Engagement', 'Retention', 'AOV'] as const;
const RADAR_KEYS = ['ctr', 'convRate', 'engagement', 'retention', 'aov'] as const;

// ---------------------------------------------------------------------------
// Audience reach data
// ---------------------------------------------------------------------------

const reachKpis = [
  { label: 'Total Reach', value: '245.8K', trend: 'up' as const, trendText: '+12.3%' },
  { label: 'Personalized', value: '167.2K', subtext: '68%', trend: 'up' as const, trendText: '+8.1%' },
  { label: 'Control', value: '78.6K', subtext: '32%', trend: 'down' as const, trendText: '-3.4%' },
  { label: 'Page Coverage', value: '5 / 8', trend: 'neutral' as const, trendText: 'No change' },
];

const pageReachData = [
  { page: 'Homepage', reach: 87 },
  { page: 'Product Listing', reach: 72 },
  { page: 'Product Detail', reach: 64 },
  { page: 'Cart', reach: 51 },
  { page: 'Checkout', reach: 38 },
  { page: 'Blog', reach: 29 },
];

const coverageTrendData = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  coverage: Math.round(42 + i * 4.2 + Math.sin(i) * 5),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  if (trend === 'up') return <ArrowUp className="w-3 h-3" />;
  if (trend === 'down') return <ArrowDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const trendColor = (trend: 'up' | 'down' | 'neutral') => {
  if (trend === 'up') return 'text-green-600';
  if (trend === 'down') return 'text-red-500';
  return 'text-gray-400';
};

const tooltipStyle = {
  fontSize: 11,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AudienceComparisonReport() {
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(
    AUDIENCES.map((a) => a.id),
  );

  const toggleAudience = (id: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const activeAudiences = AUDIENCES.filter((a) => selectedAudiences.includes(a.id));

  // Build radar chart data: one entry per metric, with a key per audience
  const radarData = RADAR_METRICS.map((metric, idx) => {
    const entry: Record<string, string | number> = { metric };
    for (const aud of activeAudiences) {
      entry[aud.id] = aud.radar[RADAR_KEYS[idx]];
    }
    return entry;
  });

  // Build bar chart data: one entry per active audience
  const barData = activeAudiences.map((aud) => ({
    name: aud.name,
    convRate: aud.metrics.convRate,
    fill: aud.color,
  }));

  return (
    <div className="space-y-6">
      {/* ── Reach KPI cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {reachKpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              {kpi.label}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {kpi.value}
              {kpi.subtext && (
                <span className="text-xs font-normal text-gray-400 ml-1">({kpi.subtext})</span>
              )}
            </p>
            <div className={`flex items-center gap-1 mt-1.5 ${trendColor(kpi.trend)}`}>
              <TrendIcon trend={kpi.trend} />
              <span className="text-[10px] font-semibold">{kpi.trendText}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Audience selector ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        {AUDIENCES.map((aud) => (
          <label key={aud.id} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedAudiences.includes(aud.id)}
              onChange={() => toggleAudience(aud.id)}
              className="sr-only"
            />
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                selectedAudiences.includes(aud.id)
                  ? 'border-transparent'
                  : 'border-gray-300 bg-white'
              }`}
              style={
                selectedAudiences.includes(aud.id)
                  ? { backgroundColor: aud.color }
                  : undefined
              }
            >
              {selectedAudiences.includes(aud.id) && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: aud.color }}
            />
            <span className="text-xs text-gray-700">{aud.name}</span>
          </label>
        ))}
      </div>

      {/* ── Radar + Conversion comparison ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
            Audience Performance Radar
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                />
                {activeAudiences.map((aud) => (
                  <Radar
                    key={aud.id}
                    name={aud.name}
                    dataKey={aud.id}
                    stroke={aud.color}
                    fill={aud.color}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
            Conversion Rate Comparison
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'Conv. Rate']}
                />
                <Bar dataKey="convRate" radius={[4, 4, 0, 0]} barSize={36}>
                  {barData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Reach by Page + Coverage Trend ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
            Reach % by Page
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pageReachData}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  domain={[0, 100]}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="page"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  width={100}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Reach']}
                />
                <Bar dataKey="reach" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
            Coverage Trend (12 weeks)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={coverageTrendData}
                margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Coverage']}
                />
                <Area
                  type="monotone"
                  dataKey="coverage"
                  stroke="#10b981"
                  fillOpacity={0.1}
                  fill="#10b981"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── All Metrics table ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
          All Metrics
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">
                  Audience
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  CTR
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Conv Rate
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Bounce Rate
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Avg Session Duration
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Pages/Session
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  AOV
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">
                  Retention Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {AUDIENCES.map((aud) => (
                <tr
                  key={aud.id}
                  className={`border-b border-gray-50 ${
                    selectedAudiences.includes(aud.id) ? '' : 'opacity-40'
                  }`}
                >
                  <td className="py-2 pr-3 text-[11px] text-gray-700">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: aud.color }}
                      />
                      {aud.name}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">
                    {aud.metrics.ctr.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">
                    {aud.metrics.convRate.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">
                    {aud.metrics.bounceRate.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">
                    {aud.metrics.avgSessionDuration.toFixed(1)} min
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">
                    {aud.metrics.pagesPerSession.toFixed(1)}
                  </td>
                  <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">
                    ${aud.metrics.aov.toFixed(2)}
                  </td>
                  <td className="py-2 text-[11px] text-gray-700 text-right">
                    {aud.metrics.retentionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
