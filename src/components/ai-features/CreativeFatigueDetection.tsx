import { useState, useMemo } from 'react';
import { CreativeFatigueData, FatigueTrend, FatigueAction } from '../../types/ai-features';

interface CampaignData {
  id: string;
  name: string;
  status: string;
}

interface CreativeFatigueDetectionProps {
  campaigns: CampaignData[];
  onClose?: () => void;
  onAction?: (creative: CreativeFatigueData, action: FatigueAction) => void;
  onAskAI?: (question: string) => void;
}

// Icons
const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
  </svg>
);

const TrendStableIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const trendConfig: Record<FatigueTrend, { label: string; color: string; icon: React.ReactNode }> = {
  worsening: { label: 'Worsening', color: '#EF4444', icon: <TrendDownIcon /> },
  stable: { label: 'Stable', color: '#F59E0B', icon: <TrendStableIcon /> },
  improving: { label: 'Improving', color: '#10B981', icon: <TrendUpIcon /> },
};

const actionConfig: Record<FatigueAction, { label: string; color: string; bgColor: string }> = {
  refresh: { label: 'Refresh Creative', color: '#6366F1', bgColor: 'bg-indigo-50' },
  pause: { label: 'Pause', color: '#EF4444', bgColor: 'bg-red-50' },
  monitor: { label: 'Monitor', color: '#3B82F6', bgColor: 'bg-blue-50' },
  rotate: { label: 'Rotate', color: '#8B5CF6', bgColor: 'bg-violet-50' },
  scale_down: { label: 'Scale Down', color: '#F59E0B', bgColor: 'bg-amber-50' },
};

const generateFatigueData = (campaigns: CampaignData[]): CreativeFatigueData[] => {
  const adNames = ['Video Ad A', 'Carousel Banner', 'Static Image 1', 'Story Ad', 'Display Banner'];
  const data: CreativeFatigueData[] = [];

  campaigns.filter(c => c.status === 'Active').forEach((campaign, cIdx) => {
    const numAds = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numAds; i++) {
      const fatigueScore = Math.floor(Math.random() * 100);
      const daysActive = 7 + Math.floor(Math.random() * 60);
      const ctrInitial = 2 + Math.random() * 3;
      const ctrDecline = fatigueScore * 0.5 + Math.random() * 20;
      const ctrCurrent = ctrInitial * (1 - ctrDecline / 100);

      let trend: FatigueTrend = 'stable';
      let suggestedAction: FatigueAction = 'monitor';

      if (fatigueScore > 75) { trend = 'worsening'; suggestedAction = fatigueScore > 90 ? 'pause' : 'refresh'; }
      else if (fatigueScore > 50) { trend = Math.random() > 0.5 ? 'worsening' : 'stable'; suggestedAction = 'rotate'; }
      else if (fatigueScore < 30) { trend = Math.random() > 0.7 ? 'improving' : 'stable'; }

      data.push({
        adId: `ad-${campaign.id}-${i}`,
        adName: adNames[(cIdx * numAds + i) % adNames.length],
        campaignId: campaign.id,
        campaignName: campaign.name,
        fatigueScore, trend, daysActive,
        impressions: 50000 + Math.floor(Math.random() * 500000),
        frequency: 2 + Math.random() * 6,
        ctrInitial, ctrCurrent, ctrDecline,
        recommendation: getRecommendation(fatigueScore, trend, daysActive),
        suggestedAction,
        predictedDaysUntilCritical: fatigueScore > 60 ? Math.floor((100 - fatigueScore) / 5) : undefined,
      });
    }
  });
  return data.sort((a, b) => b.fatigueScore - a.fatigueScore);
};

const getRecommendation = (score: number, trend: FatigueTrend, days: number): string => {
  if (score > 90) return 'Critical fatigue level. Immediate creative refresh strongly recommended to prevent further performance decline.';
  if (score > 75) return `High fatigue detected after ${days} days. Consider rotating this creative with fresh variants to maintain engagement.`;
  if (score > 50 && trend === 'worsening') return 'Moderate fatigue with declining trend. Plan creative refresh within the next 1-2 weeks.';
  if (score > 50) return 'Moderate fatigue but stable. Monitor closely and prepare backup creatives.';
  return 'Creative performance is healthy. Continue monitoring frequency metrics.';
};

const getFatigueColor = (score: number): string => {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#FBBF24';
  return '#10B981';
};

const CreativeFatigueDetection: React.FC<CreativeFatigueDetectionProps> = ({ campaigns, onClose, onAction, onAskAI }) => {
  const [fatigueData] = useState<CreativeFatigueData[]>(() => generateFatigueData(campaigns));
  const [sortBy, setSortBy] = useState<'fatigue' | 'days' | 'decline'>('fatigue');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    return [...fatigueData].sort((a, b) => {
      switch (sortBy) {
        case 'fatigue': return b.fatigueScore - a.fatigueScore;
        case 'days': return b.daysActive - a.daysActive;
        case 'decline': return b.ctrDecline - a.ctrDecline;
        default: return 0;
      }
    });
  }, [fatigueData, sortBy]);

  const summary = useMemo(() => ({
    critical: fatigueData.filter(d => d.fatigueScore >= 80).length,
    high: fatigueData.filter(d => d.fatigueScore >= 60 && d.fatigueScore < 80).length,
    moderate: fatigueData.filter(d => d.fatigueScore >= 40 && d.fatigueScore < 60).length,
    healthy: fatigueData.filter(d => d.fatigueScore < 40).length,
    total: fatigueData.length,
    avgFatigue: Math.round(fatigueData.reduce((sum, d) => sum + d.fatigueScore, 0) / fatigueData.length),
  }), [fatigueData]);

  return (
    <div className="bg-white/95 rounded-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon />
          <div>
            <h3 className="text-lg font-semibold">Creative Fatigue Detection</h3>
            <p className="text-sm opacity-90">{summary.critical} creatives need attention</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        {[
          { label: 'Critical', value: summary.critical, color: 'text-red-500' },
          { label: 'High', value: summary.high, color: 'text-amber-500' },
          { label: 'Moderate', value: summary.moderate, color: 'text-yellow-400' },
          { label: 'Healthy', value: summary.healthy, color: 'text-emerald-500' },
          { label: 'Avg Score', value: `${summary.avgFatigue}%`, color: 'text-gray-800' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 px-6 py-3 border-b border-gray-100">
        <span className="text-xs text-gray-500 self-center">Sort by:</span>
        {(['fatigue', 'days', 'decline'] as const).map(option => (
          <button key={option} onClick={() => setSortBy(option)}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium capitalize transition-all ${
              sortBy === option ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-500 hover:border-amber-400'
            }`}>
            {option === 'decline' ? 'CTR Decline' : option === 'days' ? 'Days Active' : 'Fatigue Score'}
          </button>
        ))}
      </div>

      {/* Creative List */}
      <div className="max-h-[400px] overflow-y-auto">
        {sortedData.map((creative) => {
          const fatigueColor = getFatigueColor(creative.fatigueScore);
          const trendInfo = trendConfig[creative.trend];
          const actionInfo = actionConfig[creative.suggestedAction];
          const isExpanded = expandedId === creative.adId;

          return (
            <div key={creative.adId} className="px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 last:border-b-0 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : creative.adId)}>
              <div className="flex items-center gap-4">
                {/* Fatigue Score Ring */}
                <div className="relative w-14 h-14 shrink-0">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke={fatigueColor} strokeWidth="4"
                      strokeDasharray={`${creative.fatigueScore * 1.51} 151`} strokeLinecap="round" transform="rotate(-90 28 28)" />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: fatigueColor }}>
                    {creative.fatigueScore}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-800">{creative.adName}</h4>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{ background: `${trendInfo.color}15`, color: trendInfo.color }}>
                      {trendInfo.icon} {trendInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{creative.campaignName}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <div><span className="text-gray-400">Days: </span><span className="font-medium text-gray-800">{creative.daysActive}</span></div>
                    <div><span className="text-gray-400">Freq: </span><span className="font-medium text-gray-800">{creative.frequency.toFixed(1)}</span></div>
                    <div>
                      <span className="text-gray-400">CTR: </span><span className="font-medium text-gray-800">{creative.ctrCurrent.toFixed(2)}%</span>
                      <span className="text-red-500 text-[11px] ml-1">(-{creative.ctrDecline.toFixed(1)}%)</span>
                    </div>
                    {creative.predictedDaysUntilCritical && (
                      <div><span className="text-red-500 font-medium">Critical in ~{creative.predictedDaysUntilCritical}d</span></div>
                    )}
                  </div>
                </div>

                <div className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 ${actionInfo.bgColor}`} style={{ color: actionInfo.color }}>
                  {actionInfo.label}
                </div>
                <ChevronIcon isOpen={isExpanded} />
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-indigo-50 rounded-lg px-3.5 py-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <SparkleIcon />
                      <span className="text-[11px] font-semibold text-indigo-500">AI Recommendation</span>
                    </div>
                    <p className="text-sm text-indigo-800 leading-snug">{creative.recommendation}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {onAction && (
                      <>
                        <button
                          onClick={() => onAction(creative, creative.suggestedAction)}
                          className="px-4 py-2 text-white rounded-lg text-xs font-semibold hover:-translate-y-0.5 transition-all"
                          style={{ background: `linear-gradient(135deg, ${actionInfo.color}, ${actionInfo.color}dd)` }}>
                          {actionInfo.label}
                        </button>
                        {creative.suggestedAction !== 'monitor' && (
                          <button onClick={() => onAction(creative, 'monitor')}
                            className="px-4 py-2 bg-white text-gray-500 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                            Just Monitor
                          </button>
                        )}
                      </>
                    )}
                    {onAskAI && (
                      <button
                        onClick={() => onAskAI(`Analyze the creative fatigue for "${creative.adName}" in ${creative.campaignName}. Current fatigue score is ${creative.fatigueScore}% with CTR declined ${creative.ctrDecline.toFixed(1)}%. Suggest specific creative refresh strategies.`)}
                        className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:-translate-y-0.5 transition-all">
                        <SparkleIcon /> Get AI Ideas
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreativeFatigueDetection;
