import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MetricKey = 'visitors' | 'conversions' | 'ctr' | 'bounceRate';
type Granularity = 'daily' | 'weekly';

interface DataPoint {
  label: string;
  visitors: number;
  conversions: number;
  ctr: number;
  bounceRate: number;
}

interface KpiDefinition {
  key: MetricKey;
  label: string;
  formattedValue: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  invertTrend?: boolean;
  current: string;
  previous: string;
}

// ---------------------------------------------------------------------------
// Demo data generators
// ---------------------------------------------------------------------------

function generateDailyData(): DataPoint[] {
  const base = {
    visitors: 3800,
    conversions: 180,
    ctr: 2.9,
    bounceRate: 40.5,
  };
  return Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const noise = () => 0.85 + Math.sin(day * 0.4) * 0.15 + (day / 30) * 0.2;
    return {
      label: `Jan ${day}`,
      visitors: Math.round(base.visitors * noise()),
      conversions: Math.round(base.conversions * noise()),
      ctr: +(base.ctr * noise()).toFixed(2),
      bounceRate: +(base.bounceRate * (1.15 - noise() * 0.15)).toFixed(1),
    };
  });
}

function generateWeeklyData(): DataPoint[] {
  const base = {
    visitors: 28000,
    conversions: 1300,
    ctr: 3.0,
    bounceRate: 39.8,
  };
  return Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    const noise = () => 0.88 + Math.sin(week * 0.7) * 0.12 + (week / 12) * 0.18;
    return {
      label: `W${week}`,
      visitors: Math.round(base.visitors * noise()),
      conversions: Math.round(base.conversions * noise()),
      ctr: +(base.ctr * noise()).toFixed(2),
      bounceRate: +(base.bounceRate * (1.12 - noise() * 0.12)).toFixed(1),
    };
  });
}

const DAILY_DATA = generateDailyData();
const WEEKLY_DATA = generateWeeklyData();

// ---------------------------------------------------------------------------
// KPI definitions
// ---------------------------------------------------------------------------

const KPI_CARDS: KpiDefinition[] = [
  {
    key: 'visitors',
    label: 'Visitors',
    formattedValue: '124.5K',
    change: '+10.9%',
    trend: 'up',
    current: '124,500',
    previous: '112,300',
  },
  {
    key: 'conversions',
    label: 'Conversions',
    formattedValue: '5,890',
    change: '+15.2%',
    trend: 'up',
    current: '5,890',
    previous: '5,113',
  },
  {
    key: 'ctr',
    label: 'CTR',
    formattedValue: '3.2%',
    change: '+0.4pp',
    trend: 'up',
    current: '3.2%',
    previous: '2.8%',
  },
  {
    key: 'bounceRate',
    label: 'Bounce Rate',
    formattedValue: '38.2%',
    change: '-3.3pp',
    trend: 'down',
    invertTrend: true,
    current: '38.2%',
    previous: '41.5%',
  },
];

// ---------------------------------------------------------------------------
// Metric selector options
// ---------------------------------------------------------------------------

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: 'visitors', label: 'Visitors' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'ctr', label: 'CTR' },
  { value: 'bounceRate', label: 'Bounce Rate' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({ kpi }: { kpi: KpiDefinition }) {
  const isPositive = kpi.invertTrend
    ? kpi.trend === 'down'
    : kpi.trend === 'up';
  const isNegative = kpi.invertTrend
    ? kpi.trend === 'up'
    : kpi.trend === 'down';

  const trendColor = isPositive
    ? 'text-green-600'
    : isNegative
      ? 'text-red-500'
      : 'text-gray-400';

  const TrendIcon =
    kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : Minus;

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
        {kpi.label}
      </p>
      <p className="text-xl font-bold text-gray-900">{kpi.formattedValue}</p>
      <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        <span className="text-[10px] font-semibold">{kpi.change}</span>
        <span className="text-[10px] text-gray-400 ml-1">vs prev</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TrendAnalysisReport() {
  const [metric, setMetric] = useState<MetricKey>('visitors');
  const [granularity, setGranularity] = useState<Granularity>('daily');

  const data = granularity === 'daily' ? DAILY_DATA : WEEKLY_DATA;

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setGranularity('daily')}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
              granularity === 'daily'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setGranularity('weekly')}
            className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
              granularity === 'weekly'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {METRIC_OPTIONS.find((o) => o.value === metric)?.label} Trend
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Period-over-Period Summary
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2">
                Metric
              </th>
              <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2">
                Current
              </th>
              <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2">
                Previous
              </th>
              <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2">
                Change
              </th>
              <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {KPI_CARDS.map((kpi) => {
              const isPositive = kpi.invertTrend
                ? kpi.trend === 'down'
                : kpi.trend === 'up';
              const isNegative = kpi.invertTrend
                ? kpi.trend === 'up'
                : kpi.trend === 'down';
              const color = isPositive
                ? 'text-green-600'
                : isNegative
                  ? 'text-red-500'
                  : 'text-gray-400';
              const TrendIcon =
                kpi.trend === 'up'
                  ? ArrowUp
                  : kpi.trend === 'down'
                    ? ArrowDown
                    : Minus;

              return (
                <tr key={kpi.key} className="border-b border-gray-50 last:border-0">
                  <td className="text-[11px] text-gray-700 py-2.5">{kpi.label}</td>
                  <td className="text-right text-[11px] text-gray-700 py-2.5">
                    {kpi.current}
                  </td>
                  <td className="text-right text-[11px] text-gray-700 py-2.5">
                    {kpi.previous}
                  </td>
                  <td className={`text-right text-[11px] font-medium py-2.5 ${color}`}>
                    {kpi.change}
                  </td>
                  <td className="py-2.5">
                    <div className={`flex justify-center ${color}`}>
                      <TrendIcon className="w-3.5 h-3.5" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
