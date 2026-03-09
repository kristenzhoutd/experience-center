import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { TrendDataPoint } from '../../types/optimize';

interface SparklineChartProps {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
  color?: 'default' | 'success' | 'warning' | 'danger';
  showTrend?: boolean;
}

export default function SparklineChart({
  data,
  width = 60,
  height = 24,
  color = 'default',
  showTrend = true,
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return <div className="w-[60px] h-[24px] bg-gray-100 rounded animate-pulse" />;
  }

  // Calculate trend direction
  const firstValue = data[0]?.value ?? 0;
  const lastValue = data[data.length - 1]?.value ?? 0;
  const trendUp = lastValue > firstValue;
  const trendFlat = Math.abs(lastValue - firstValue) / firstValue < 0.02;

  // Determine line color based on trend or explicit color
  const getLineColor = () => {
    if (color !== 'default') {
      switch (color) {
        case 'success': return '#10b981';
        case 'warning': return '#f59e0b';
        case 'danger': return '#ef4444';
        default: return '#6366f1';
      }
    }

    if (showTrend) {
      if (trendFlat) return '#6b7280';
      return trendUp ? '#10b981' : '#ef4444';
    }

    return '#6366f1';
  };

  const lineColor = getLineColor();

  const getTrendIndicator = () => {
    if (!showTrend) return null;

    if (trendFlat) {
      return (
        <span className="text-gray-400 text-[10px] ml-1">&mdash;</span>
      );
    }

    return (
      <span className={`text-[10px] ml-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
        {trendUp ? '\u2191' : '\u2193'}
      </span>
    );
  };

  return (
    <div className="flex items-center">
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {getTrendIndicator()}
    </div>
  );
}
