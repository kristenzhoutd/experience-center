import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BudgetPacingData, PacingStatus } from '../../types/ai-features';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  budget: string;
  budgetSpent: number;
  dateRange: string;
}

interface BudgetPacingVisualizationProps {
  campaigns: CampaignData[];
  onClose?: () => void;
  onGetRecommendation?: (campaign: CampaignData) => void;
}

// Icons
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const TrendUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const generatePacingData = (campaign: CampaignData): BudgetPacingData => {
  const totalBudget = parseFloat(campaign.budget.replace(/[$,]/g, '') || '0');
  const spent = totalBudget * (campaign.budgetSpent / 100);
  const remaining = totalBudget - spent;
  const totalDays = 90;
  const daysElapsed = Math.floor(totalDays * (campaign.budgetSpent / 100) * 0.9 + Math.random() * 10);
  const daysRemaining = totalDays - daysElapsed;
  const idealDailySpend = totalBudget / totalDays;
  const actualDailySpend = spent / Math.max(daysElapsed, 1);

  const idealPacing: { day: number; cumulative: number }[] = [];
  const actualPacing: { day: number; cumulative: number }[] = [];

  for (let day = 0; day <= totalDays; day++) {
    idealPacing.push({ day, cumulative: (day / totalDays) * 100 });
    if (day <= daysElapsed) {
      const variance = 1 + (Math.sin(day / 5) * 0.15);
      const idealProgress = (day / totalDays) * 100;
      actualPacing.push({ day, cumulative: Math.min(idealProgress * variance, campaign.budgetSpent) });
    }
  }

  const variance = ((spent / Math.max(daysElapsed, 1)) - idealDailySpend) / idealDailySpend * 100;
  let status: PacingStatus = 'on_track';
  if (variance > 15) status = 'overspent';
  else if (variance < -15) status = 'underspent';
  else if (Math.abs(variance) > 10) status = 'at_risk';

  return {
    campaignId: campaign.id, campaignName: campaign.name, totalBudget, spent, remaining,
    percentSpent: campaign.budgetSpent, daysElapsed, daysRemaining, totalDays,
    idealDailySpend, actualDailySpend, idealPacing, actualPacing,
    projectedEndSpend: actualDailySpend * totalDays, projectedEndDate: '2024-12-31', status, variance,
  };
};

const statusConfig: Record<PacingStatus, { label: string; color: string; bgClass: string; icon: React.ReactNode }> = {
  on_track: { label: 'On Track', color: '#10B981', bgClass: 'bg-emerald-50', icon: <CheckIcon /> },
  underspent: { label: 'Underspent', color: '#3B82F6', bgClass: 'bg-blue-50', icon: <TrendDownIcon /> },
  overspent: { label: 'Overspent', color: '#EF4444', bgClass: 'bg-red-50', icon: <TrendUpIcon /> },
  at_risk: { label: 'At Risk', color: '#F59E0B', bgClass: 'bg-amber-50', icon: <AlertIcon /> },
};

const BudgetPacingVisualization: React.FC<BudgetPacingVisualizationProps> = ({ campaigns, onClose, onGetRecommendation }) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.filter(c => c.status === 'Active')[0]?.id || campaigns[0]?.id || null
  );

  const activeCampaigns = useMemo(() => campaigns.filter(c => c.status === 'Active' || c.budgetSpent > 0), [campaigns]);
  const selectedCampaign = useMemo(() => activeCampaigns.find(c => c.id === selectedCampaignId), [activeCampaigns, selectedCampaignId]);
  const pacingData = useMemo(() => selectedCampaign ? generatePacingData(selectedCampaign) : null, [selectedCampaign]);

  const chartData = useMemo(() => {
    if (!pacingData) return [];
    const maxDay = Math.max(pacingData.daysElapsed + 10, pacingData.totalDays);
    return Array.from({ length: maxDay + 1 }, (_, day) => {
      const ideal = pacingData.idealPacing.find(p => p.day === day)?.cumulative || (day / pacingData.totalDays) * 100;
      const actual = pacingData.actualPacing.find(p => p.day === day)?.cumulative;
      let projected: number | undefined;
      if (day >= pacingData.daysElapsed) {
        const projectionRate = pacingData.actualDailySpend / pacingData.idealDailySpend;
        projected = Math.min(pacingData.percentSpent + ((day - pacingData.daysElapsed) / pacingData.totalDays) * 100 * projectionRate, 120);
      }
      return { day, ideal: Math.min(ideal, 100), actual: actual !== undefined ? Math.min(actual, 100) : undefined, projected: day > pacingData.daysElapsed ? projected : undefined };
    });
  }, [pacingData]);

  if (!pacingData || !selectedCampaign) return null;
  const statusInfo = statusConfig[pacingData.status];

  return (
    <div className="bg-white/95 rounded-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarIcon />
          <div>
            <h3 className="text-lg font-semibold">Budget Pacing</h3>
            <p className="text-sm opacity-90">Track spend velocity against targets</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Campaign Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Select Campaign</label>
          <div className="flex gap-2 flex-wrap">
            {activeCampaigns.map(campaign => {
              const pacing = generatePacingData(campaign);
              const cfg = statusConfig[pacing.status];
              return (
                <button key={campaign.id} onClick={() => setSelectedCampaignId(campaign.id)}
                  className={`px-4 py-2.5 rounded-lg border-2 flex items-center gap-2 transition-all ${
                    selectedCampaignId === campaign.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-sm font-medium text-gray-800">{campaign.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-6">
          <div className={`${statusInfo.bgClass} rounded-xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: statusInfo.color }}>{statusInfo.icon}</div>
            <div>
              <p className="text-xs" style={{ color: statusInfo.color }}>Status</p>
              <p className="mt-1 text-base font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Spent</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">${pacingData.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pacingData.percentSpent}%`, background: statusInfo.color }} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Remaining</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">${pacingData.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="mt-1 text-xs text-gray-400">{pacingData.daysRemaining} days left</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Daily Spend</p>
            <div className="flex items-baseline gap-1">
              <p className="mt-1 text-lg font-semibold text-gray-800">${pacingData.actualDailySpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <span className="text-xs text-gray-400">/ ${pacingData.idealDailySpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} ideal</span>
            </div>
            <p className={`mt-1 text-xs ${pacingData.variance > 0 ? 'text-red-500' : pacingData.variance < 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
              {pacingData.variance > 0 ? '+' : ''}{pacingData.variance.toFixed(1)}% variance
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 rounded-xl p-5 mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Pacing Over Time</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2}/><stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={{ stroke: '#E2E8F0' }} axisLine={{ stroke: '#E2E8F0' }} label={{ value: 'Day', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={{ stroke: '#E2E8F0' }} axisLine={{ stroke: '#E2E8F0' }} tickFormatter={(value) => `${value}%`} domain={[0, 110]} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} labelFormatter={(day) => `Day ${day}`} formatter={(value: number | undefined, name: string | undefined) => [`${(value ?? 0).toFixed(1)}%`, name === 'ideal' ? 'Ideal' : name === 'actual' ? 'Actual' : 'Projected']} />
                <ReferenceLine x={pacingData.daysElapsed} stroke="#64748B" strokeDasharray="5 5" label={{ value: 'Today', position: 'top', fill: '#64748B', fontSize: 11 }} />
                <Area type="monotone" dataKey="ideal" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fill="url(#idealGradient)" name="ideal" />
                <Area type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} fill="url(#actualGradient)" name="actual" />
                <Area type="monotone" dataKey="projected" stroke="#F59E0B" strokeWidth={2} strokeDasharray="3 3" fill="none" name="projected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-6 justify-center mt-3">
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-gray-400 opacity-60" /><span className="text-xs text-gray-500">Ideal Pacing</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-[3px] bg-blue-500 rounded" /><span className="text-xs text-gray-500">Actual Spend</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-amber-500" /><span className="text-xs text-gray-500">Projected</span></div>
          </div>
        </div>

        {onGetRecommendation && selectedCampaign && (
          <button onClick={() => onGetRecommendation(selectedCampaign)}
            className="w-full py-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 transition-all">
            <SparkleIcon /> Get Pacing Recommendations
          </button>
        )}
      </div>
    </div>
  );
};

export default BudgetPacingVisualization;
