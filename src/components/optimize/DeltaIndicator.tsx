import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DeltaIndicatorProps {
  current: number;
  previous: number;
  format?: 'percent' | 'number' | 'currency';
  invertColors?: boolean; // For metrics where lower is better (CPA)
  showIcon?: boolean;
  size?: 'sm' | 'md';
  period?: string;
}

export default function DeltaIndicator({
  current,
  previous,
  format = 'percent',
  invertColors = false,
  showIcon = true,
  size = 'sm',
  period = '7d',
}: DeltaIndicatorProps) {
  const delta = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const absoluteDelta = Math.abs(delta);

  const isPositive = invertColors ? delta < 0 : delta > 0;
  const isNeutral = absoluteDelta < 2;

  const getColor = () => {
    if (isNeutral) return 'text-gray-500';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const formatValue = () => {
    const prefix = delta > 0 ? '+' : '';

    switch (format) {
      case 'percent':
        return `${prefix}${delta.toFixed(1)}%`;
      case 'currency': {
        const currencyDiff = current - previous;
        return `${currencyDiff >= 0 ? '+' : ''}$${Math.abs(currencyDiff).toFixed(2)}`;
      }
      case 'number': {
        const diff = current - previous;
        return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}`;
      }
      default:
        return `${prefix}${delta.toFixed(1)}%`;
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;

    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    if (isNeutral) {
      return <Minus className={`${iconSize} ${getColor()}`} />;
    }

    return isPositive ? (
      <TrendingUp className={`${iconSize} ${getColor()}`} />
    ) : (
      <TrendingDown className={`${iconSize} ${getColor()}`} />
    );
  };

  const sizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-0.5 ${getColor()} ${sizeClasses[size]}`}>
      {getIcon()}
      <span className="font-medium">{formatValue()}</span>
      {period && size === 'md' && (
        <span className="text-gray-400 ml-0.5">
          vs {period}
        </span>
      )}
    </div>
  );
}

// Helper component for showing delta below a metric value
interface MetricWithDeltaProps {
  label: string;
  value: string | number;
  current: number;
  previous: number;
  format?: 'percent' | 'number' | 'currency';
  invertColors?: boolean;
}

export function MetricWithDelta({
  label,
  value,
  current,
  previous,
  format = 'percent',
  invertColors = false,
}: MetricWithDeltaProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
      <DeltaIndicator
        current={current}
        previous={previous}
        format={format}
        invertColors={invertColors}
        size="sm"
      />
    </div>
  );
}
