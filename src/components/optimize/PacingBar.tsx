import type { PacingStatus } from '../../types/optimize';

interface PacingBarProps {
  spent: number;
  budget: number;
  daysRemaining: number;
  status: PacingStatus;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PacingBar({
  spent,
  budget,
  daysRemaining,
  status,
  showLabels = true,
  size = 'md',
}: PacingBarProps) {
  const percentSpent = Math.min((spent / budget) * 100, 100);

  const totalDays = daysRemaining + (spent / (budget / 30));
  const daysElapsed = totalDays - daysRemaining;
  const idealPacePercent = Math.min((daysElapsed / totalDays) * 100, 100);

  const getStatusColor = () => {
    switch (status) {
      case 'on_track':
        return {
          bar: 'bg-gradient-to-r from-green-500 to-emerald-400',
          text: 'text-green-600',
          badge: 'bg-green-100 text-green-700',
        };
      case 'overspent':
        return {
          bar: 'bg-gradient-to-r from-red-500 to-rose-400',
          text: 'text-red-600',
          badge: 'bg-red-100 text-red-700',
        };
      case 'underspent':
        return {
          bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          text: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700',
        };
    }
  };

  const colors = getStatusColor();

  const getStatusLabel = () => {
    switch (status) {
      case 'on_track': return 'On Track';
      case 'overspent': return 'Overspent';
      case 'underspent': return 'Underspent';
    }
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-900">
              {formatCurrency(spent)}
            </span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-xs text-gray-500">
              {formatCurrency(budget)}
            </span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
            {getStatusLabel()}
          </span>
        </div>
      )}

      <div className={`relative w-full ${heightClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`absolute top-0 left-0 h-full ${colors.bar} rounded-full transition-all duration-300`}
          style={{ width: `${percentSpent}%` }}
        />

        {size !== 'sm' && (
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-600 opacity-50"
            style={{ left: `${idealPacePercent}%` }}
            title={`Ideal pace: ${idealPacePercent.toFixed(0)}%`}
          />
        )}
      </div>

      {showLabels && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            {percentSpent.toFixed(0)}% spent
          </span>
          <span className="text-[10px] text-gray-400">
            {daysRemaining} days left
          </span>
        </div>
      )}
    </div>
  );
}
