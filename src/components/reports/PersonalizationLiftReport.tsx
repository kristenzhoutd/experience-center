import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewBy = 'campaign' | 'page' | 'spot';

interface LiftEntry {
  name: string;
  personalizedRate: number;
  controlRate: number;
  lift: number;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const campaignData: LiftEntry[] = [
  { name: 'Spring Sale Hero', personalizedRate: 6.2, controlRate: 4.8, lift: 29.2 },
  { name: 'New Arrivals Banner', personalizedRate: 5.1, controlRate: 4.3, lift: 18.6 },
  { name: 'Loyalty Rewards Push', personalizedRate: 4.9, controlRate: 4.1, lift: 19.5 },
  { name: 'Free Shipping Promo', personalizedRate: 4.4, controlRate: 3.9, lift: 12.8 },
  { name: 'Product Recommendations', personalizedRate: 3.8, controlRate: 3.5, lift: 8.6 },
  { name: 'Exit Intent Overlay', personalizedRate: 2.9, controlRate: 3.1, lift: -6.5 },
];

const pageData: LiftEntry[] = [
  { name: '/products/electronics', personalizedRate: 5.8, controlRate: 4.2, lift: 38.1 },
  { name: '/checkout', personalizedRate: 7.1, controlRate: 6.0, lift: 18.3 },
  { name: '/home', personalizedRate: 4.5, controlRate: 3.9, lift: 15.4 },
  { name: '/category/apparel', personalizedRate: 3.9, controlRate: 3.6, lift: 8.3 },
  { name: '/blog', personalizedRate: 2.1, controlRate: 2.3, lift: -8.7 },
];

const spotData: LiftEntry[] = [
  { name: 'Hero Banner', personalizedRate: 6.4, controlRate: 4.5, lift: 42.2 },
  { name: 'Product Grid - Row 1', personalizedRate: 5.3, controlRate: 4.1, lift: 29.3 },
  { name: 'Sidebar CTA', personalizedRate: 4.7, controlRate: 3.8, lift: 23.7 },
  { name: 'Category Header', personalizedRate: 4.2, controlRate: 3.7, lift: 13.5 },
  { name: 'Footer Recommendations', personalizedRate: 3.6, controlRate: 3.3, lift: 9.1 },
  { name: 'Inline Content Block', personalizedRate: 3.1, controlRate: 3.0, lift: 3.3 },
  { name: 'Pop-up Modal', personalizedRate: 2.5, controlRate: 2.8, lift: -10.7 },
];

const dataByView: Record<ViewBy, LiftEntry[]> = {
  campaign: campaignData,
  page: pageData,
  spot: spotData,
};

const viewLabels: Record<ViewBy, string> = {
  campaign: 'Campaign',
  page: 'Page',
  spot: 'Content Spot',
};

// ─── KPI Data ─────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Overall Lift', value: '+18.4%', trend: 'up' as const },
  { label: 'Personalized Conv Rate', value: '4.8%', trend: 'up' as const },
  { label: 'Control Conv Rate', value: '4.1%', trend: 'neutral' as const },
  { label: 'Confidence', value: '94.2%', trend: 'up' as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'down') return <ArrowDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PersonalizationLiftReport() {
  const [viewBy, setViewBy] = useState<ViewBy>('campaign');

  const activeData = dataByView[viewBy];
  const sortedForTable = [...activeData].sort((a, b) => b.lift - a.lift);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-gray-100 p-4"
          >
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              {kpi.label}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
              <TrendIcon trend={kpi.trend} />
            </div>
          </div>
        ))}
      </div>

      {/* Lift Comparison Chart */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
            Lift Comparison
          </div>
          <select
            value={viewBy}
            onChange={(e) => setViewBy(e.target.value as ViewBy)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="campaign">By Campaign</option>
            <option value="page">By Page</option>
            <option value="spot">By Content Spot</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={activeData.length * 52 + 40}>
          <BarChart
            data={activeData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v: number) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                `${(value ?? 0).toFixed(1)}%`,
                name === 'personalizedRate' ? 'Personalized' : 'Control',
              ]}
              labelStyle={{ fontSize: 11, fontWeight: 600, color: '#374151' }}
            />
            <Bar
              dataKey="personalizedRate"
              fill="#6366f1"
              name="personalizedRate"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
            <Bar
              dataKey="controlRate"
              fill="#d1d5db"
              name="controlRate"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 ml-[160px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#6366f1]" />
            <span className="text-[10px] text-gray-500">Personalized</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#d1d5db]" />
            <span className="text-[10px] text-gray-500">Control</span>
          </div>
        </div>
      </div>

      {/* Lift Table */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
          {viewLabels[viewBy]} Lift Breakdown
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-left">
                {viewLabels[viewBy]}
              </th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">
                Personalized
              </th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">
                Control
              </th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">
                Lift
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedForTable.map((row) => (
              <tr key={row.name} className="border-b border-gray-50 last:border-b-0">
                <td className="text-[11px] text-gray-700 py-2.5">{row.name}</td>
                <td className="text-[11px] text-gray-700 py-2.5 text-right">
                  {row.personalizedRate.toFixed(1)}%
                </td>
                <td className="text-[11px] text-gray-700 py-2.5 text-right">
                  {row.controlRate.toFixed(1)}%
                </td>
                <td
                  className={`text-[11px] font-semibold py-2.5 text-right ${
                    row.lift >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {row.lift >= 0 ? '+' : ''}
                  {row.lift.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
