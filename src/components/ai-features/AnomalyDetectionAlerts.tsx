import { useState, useMemo, useCallback } from 'react';
import { AnomalyAlert, AnomalySeverity, AnomalyType, AnomalySummary } from '../../types/ai-features';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  healthScore: number;
}

interface AnomalyDetectionAlertsProps {
  campaigns: CampaignData[];
  onClose?: () => void;
  onInvestigate?: (alert: AnomalyAlert) => void;
  onDismiss?: (alertId: string) => void;
}

const severityConfig: Record<AnomalySeverity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  critical: { label: 'Critical', color: '#DC2626', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  warning: { label: 'Warning', color: '#D97706', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  info: { label: 'Info', color: '#2563EB', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
};

const anomalyTypeLabels: Record<AnomalyType, string> = {
  spike: 'Spike Detected',
  drop: 'Sudden Drop',
  trend_change: 'Trend Change',
  outlier: 'Outlier',
  unusual_pattern: 'Unusual Pattern',
};

const generateAnomalies = (campaigns: CampaignData[]): AnomalyAlert[] => {
  const alerts: AnomalyAlert[] = [];
  const metrics = ['CPA', 'CTR', 'ROAS', 'Spend', 'Conversions'];
  const types: AnomalyType[] = ['spike', 'drop', 'trend_change', 'outlier', 'unusual_pattern'];

  campaigns.forEach((campaign) => {
    const anomalyCount = campaign.healthScore < 50 ? 2 : campaign.healthScore < 70 ? 1 : Math.random() > 0.7 ? 1 : 0;
    for (let i = 0; i < anomalyCount; i++) {
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const severity: AnomalySeverity = campaign.healthScore < 50 ? 'critical' : campaign.healthScore < 70 ? 'warning' : 'info';
      const expectedValue = 50 + Math.random() * 100;
      const deviation = (type === 'spike' ? 1 : -1) * (20 + Math.random() * 60);
      const currentValue = expectedValue * (1 + deviation / 100);

      alerts.push({
        id: `anomaly-${campaign.id}-${i}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        severity,
        type,
        metric,
        currentValue,
        expectedValue,
        expectedRange: { min: expectedValue * 0.85, max: expectedValue * 1.15 },
        deviation,
        detectedAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        description: getDescription(campaign.name, metric, type, deviation),
        aiRecommendation: getRecommendation(metric, type, severity),
        isDismissed: false,
      });
    }
  });

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
};

const getDescription = (name: string, metric: string, type: AnomalyType, deviation: number): string => {
  const d = Math.abs(deviation).toFixed(1);
  switch (type) {
    case 'spike': return `${metric} spiked ${d}% above expected range for ${name}.`;
    case 'drop': return `${metric} dropped ${d}% below expected range for ${name}.`;
    case 'trend_change': return `Significant trend change detected in ${metric} for ${name}.`;
    case 'outlier': return `${metric} value is ${d}% outside normal distribution for ${name}.`;
    case 'unusual_pattern': return `Unusual ${metric} pattern detected that doesn't match historical behavior.`;
    default: return `Anomaly detected in ${metric} for ${name}.`;
  }
};

const getRecommendation = (metric: string, type: AnomalyType, severity: AnomalySeverity): string => {
  if (severity === 'critical') return `Immediate action recommended. Review ${metric} settings and recent changes. Consider pausing affected ad groups until resolved.`;
  if (type === 'spike' && metric === 'Spend') return 'Check for budget acceleration issues. Review bid settings and daily caps.';
  if (type === 'drop' && metric === 'CTR') return 'Creative fatigue may be causing this. Consider refreshing ad creatives or adjusting targeting.';
  if (type === 'drop' && metric === 'Conversions') return 'Review landing page performance and conversion tracking. Check for technical issues.';
  return `Monitor this metric closely. If the ${type} continues, investigate recent campaign changes.`;
};

// Icons
const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertTriangleIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const AlertCircleIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const InfoIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const AnomalyDetectionAlerts: React.FC<AnomalyDetectionAlertsProps> = ({
  campaigns,
  onClose,
  onInvestigate,
  onDismiss,
}) => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => generateAnomalies(campaigns));
  const [filterSeverity, setFilterSeverity] = useState<AnomalySeverity | 'all'>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (!showDismissed && alert.isDismissed) return false;
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
      return true;
    });
  }, [alerts, filterSeverity, showDismissed]);

  const summary: AnomalySummary = useMemo(() => {
    const active = alerts.filter(a => !a.isDismissed);
    return {
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length,
      total: active.length,
      lastChecked: new Date().toISOString(),
    };
  }, [alerts]);

  const handleDismiss = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isDismissed: true, acknowledgedAt: new Date().toISOString() } : a));
    onDismiss?.(alertId);
  }, [onDismiss]);

  const handleDismissAll = useCallback((severity?: AnomalySeverity) => {
    setAlerts(prev => prev.map(a => {
      if (a.isDismissed) return a;
      if (severity && a.severity !== severity) return a;
      return { ...a, isDismissed: true, acknowledgedAt: new Date().toISOString() };
    }));
  }, []);

  const getRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertIcon />
          <div>
            <h3 className="text-lg font-semibold">Anomaly Detection</h3>
            <p className="text-sm opacity-90">{summary.total} active alert{summary.total !== 1 ? 's' : ''} detected</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        {(['critical', 'warning', 'info'] as AnomalySeverity[]).map(severity => {
          const cfg = severityConfig[severity];
          const count = summary[severity];
          return (
            <button
              key={severity}
              onClick={() => setFilterSeverity(filterSeverity === severity ? 'all' : severity)}
              className={`px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${cfg.bgColor} ${
                filterSeverity === severity ? 'border-current' : 'border-transparent'
              }`}
              style={{ color: cfg.color, borderColor: filterSeverity === severity ? cfg.color : 'transparent' }}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs font-medium capitalize">{severity}</div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} className="w-4 h-4" />
          Show dismissed
        </label>
        {filteredAlerts.filter(a => !a.isDismissed).length > 0 && (
          <button
            onClick={() => handleDismissAll(filterSeverity === 'all' ? undefined : filterSeverity)}
            className="px-3 py-1.5 border border-gray-200 bg-white rounded-md text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Dismiss {filterSeverity === 'all' ? 'All' : filterSeverity}
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 px-6 text-center text-gray-500">
            <CheckCircleIcon />
            <h4 className="mt-4 text-base font-semibold text-emerald-500">All Clear!</h4>
            <p className="text-sm">No {filterSeverity !== 'all' ? filterSeverity + ' ' : ''}anomalies detected</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const cfg = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                className={`px-6 py-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                  alert.isDismissed ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${cfg.bgColor} border ${cfg.borderColor} flex items-center justify-center shrink-0`}>
                    {alert.severity === 'critical' ? <AlertTriangleIcon color={cfg.color} /> : alert.severity === 'warning' ? <AlertCircleIcon color={cfg.color} /> : <InfoIcon color={cfg.color} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase ${cfg.bgColor}`} style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{anomalyTypeLabels[alert.type]}</span>
                      <span className="text-[11px] text-gray-400 ml-auto">{getRelativeTime(alert.detectedAt)}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{alert.campaignName} - {alert.metric}</h4>
                    <p className="text-sm text-gray-500 leading-snug mb-2">{alert.description}</p>

                    <div className="flex gap-4 mb-3 text-xs">
                      <div><span className="text-gray-400">Current: </span><span className="font-semibold" style={{ color: cfg.color }}>{alert.currentValue.toFixed(1)}</span></div>
                      <div><span className="text-gray-400">Expected: </span><span className="font-medium text-gray-800">{alert.expectedValue.toFixed(1)}</span></div>
                      <div><span className="text-gray-400">Deviation: </span><span className={`font-semibold ${alert.deviation > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{alert.deviation > 0 ? '+' : ''}{alert.deviation.toFixed(1)}%</span></div>
                    </div>

                    <div className="bg-indigo-50 rounded-lg px-3 py-2.5 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <SparkleIcon />
                        <span className="text-[11px] font-semibold text-indigo-500">AI Recommendation</span>
                      </div>
                      <p className="text-xs text-indigo-800 leading-snug">{alert.aiRecommendation}</p>
                    </div>

                    {!alert.isDismissed && (
                      <div className="flex gap-2">
                        {onInvestigate && (
                          <button
                            onClick={() => onInvestigate(alert)}
                            className="px-3.5 py-2 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 transition-all"
                          >
                            <SearchIcon /> Investigate
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="px-3.5 py-2 bg-white text-gray-500 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AnomalyDetectionAlerts;
