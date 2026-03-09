import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { AnalysisKpi } from '../../types/campaignAnalysis';

interface AnalysisKpiCardProps {
  kpi: AnalysisKpi;
}

export default function AnalysisKpiCard({ kpi }: AnalysisKpiCardProps) {
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

  const bgColor = isPositive
    ? 'bg-green-50 border-green-100'
    : isNegative
      ? 'bg-red-50 border-red-100'
      : 'bg-gray-50 border-gray-100';

  const TrendIcon = kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : Minus;

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
        {kpi.label}
      </p>
      <p className="text-xl font-bold text-gray-900">{kpi.formattedValue}</p>
      <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        <span className="text-[10px] font-semibold">{kpi.trendFormatted}</span>
        <span className="text-[10px] text-gray-400 ml-1">vs prev</span>
      </div>
    </div>
  );
}
