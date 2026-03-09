import { AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import type { CreativeFatigue } from '../../types/optimize';

interface CreativeFatigueIndicatorProps {
  fatigue: CreativeFatigue;
  variant?: 'badge' | 'inline' | 'tooltip';
}

export default function CreativeFatigueIndicator({
  fatigue,
  variant = 'badge',
}: CreativeFatigueIndicatorProps) {
  const getSeverity = () => {
    if (fatigue.score >= 70) return 'critical';
    if (fatigue.score >= 50) return 'warning';
    return 'info';
  };

  const severity = getSeverity();

  const severityStyles = {
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      Icon: AlertTriangle,
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      Icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      Icon: Clock,
    },
  };

  const styles = severityStyles[severity];
  const { Icon } = styles;

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
        title={`${fatigue.reason}\n${fatigue.recommendation}`}
      >
        <Icon className="w-3 h-3" />
        <span>Fatigue: {fatigue.score}%</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${styles.text}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{fatigue.score}%</span>
      </div>
    );
  }

  // Tooltip variant - full card
  return (
    <div className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-5 h-5 ${styles.text} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-semibold ${styles.text}`}>
              Creative Fatigue
            </span>
            <span className={`text-lg font-bold ${styles.text}`}>
              {fatigue.score}%
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            {fatigue.reason}
          </p>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">Active:</span>
            <span className="font-medium text-gray-700">
              {fatigue.daysActive} days
            </span>
          </div>
          <p className="text-xs font-medium text-gray-700 mt-2">
            {fatigue.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
