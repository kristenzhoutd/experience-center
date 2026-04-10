/**
 * Chart Components for Workflow Cards
 * Visualizations using Recharts for richer user experience
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

// ── Comparison Bar Chart ──
// Visualizes comparison scores across options

interface ComparisonOption {
  name: string;
  score: string;
  recommended?: boolean;
}

export function ComparisonBarChart({ options }: { options: ComparisonOption[] }) {
  // Parse scores (e.g., "92/100" → 92, "Strong" → null)
  const chartData = options.map(opt => {
    const scoreMatch = opt.score.match(/(\d+(?:\.\d+)?)/);
    const numericScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;

    return {
      name: opt.name,
      score: numericScore,
      recommended: opt.recommended,
      label: opt.score,
    };
  }).filter(d => d.score !== null);

  if (chartData.length === 0) return null;

  return (
    <div className="mb-4 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Performance Comparison
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any) => [value, 'Score']}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.recommended ? '#3b82f6' : '#94a3b8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Metric Trend Visualization ──
// Shows metrics as a mini trend line or sparkline

interface Metric {
  label: string;
  value: string;
}

export function MetricTrendChart({ metrics }: { metrics: Metric[] }) {
  // Extract numeric values for visualization
  const chartData = metrics.map((m, i) => {
    const numMatch = m.value.match(/(\d+(?:,\d+)?(?:\.\d+)?)/);
    const num = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : null;

    return {
      index: i,
      label: m.label,
      value: num,
      displayValue: m.value,
    };
  }).filter(d => d.value !== null);

  if (chartData.length < 2) return null; // Need at least 2 points for a trend

  return (
    <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-100">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Metric Overview
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: any, name: any, props: any) => [props.payload.displayValue, props.payload.label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#metricGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Journey Flow Diagram ──
// Visualizes customer journey flow across stages with funnel visualization

interface JourneyStage {
  name: string;
  steps: any[];
  entryCriteria?: string;
}

export function JourneySankeyDiagram({ stages }: { stages: JourneyStage[] }) {
  if (stages.length === 0) return null;

  // Calculate flow percentages (simulating drop-off)
  const flowData = stages.map((stage, i) => {
    const percentage = 100 * Math.pow(0.75, i); // 25% drop-off per stage
    return {
      name: stage.name,
      percentage: Math.round(percentage),
      width: percentage,
    };
  });

  return (
    <div className="mt-4 mb-4 bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-xl p-5 border border-purple-100">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Journey Flow Visualization
      </div>

      {/* Funnel visualization */}
      <div className="space-y-3">
        {flowData.map((stage, i) => (
          <div key={i} className="relative">
            <div className="flex items-center gap-3">
              {/* Stage number */}
              <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>

              {/* Flow bar */}
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">{stage.name}</span>
                  <span className="text-xs font-bold text-purple-600">{stage.percentage}%</span>
                </div>
                <div className="relative h-8 bg-white rounded-lg border border-purple-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-700 flex items-center px-3"
                    style={{ width: `${stage.width}%` }}
                  >
                    <span className="text-[10px] font-medium text-white opacity-80">
                      {stages[i].steps?.length || 0} step{stages[i].steps?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow connector */}
            {i < flowData.length - 1 && (
              <div className="flex items-center justify-center my-2">
                <svg width="20" height="20" viewBox="0 0 20 20" className="text-purple-300">
                  <path
                    d="M10 2 L10 14 M10 14 L6 10 M10 14 L14 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-400"></div>
          <span>Stage Flow</span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-gray-400">Width represents engagement rate</span>
      </div>
    </div>
  );
}

// ── Metric Comparison Bars ──
// Simple horizontal bars for quick metric comparison

export function MetricComparisonBars({ metrics }: { metrics: Metric[] }) {
  const chartData = metrics.map(m => {
    const numMatch = m.value.match(/(\d+(?:,\d+)?(?:\.\d+)?)/);
    const num = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : null;
    const percentMatch = m.value.match(/(\d+(?:\.\d+)?)%/);
    const percent = percentMatch ? parseFloat(percentMatch[1]) : null;

    return {
      label: m.label,
      value: percent || num || 0,
      displayValue: m.value,
      isPercent: !!percentMatch,
    };
  });

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="mt-4 space-y-3">
      {chartData.map((m, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">{m.label}</span>
            <span className="text-xs font-bold text-gray-900">{m.displayValue}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(m.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
