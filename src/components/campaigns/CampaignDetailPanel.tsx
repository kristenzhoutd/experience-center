import { useState } from 'react';
import { X, TrendingUp, AlertTriangle, Lightbulb, Target, DollarSign, BarChart3, Zap, PauseCircle, ArrowUpRight, ExternalLink, ChevronDown, ChevronUp, Trash2, Play, Pause } from 'lucide-react';
import type { Campaign } from '../../types/campaign';
import { useOptimizeStore } from '../../stores/optimizeStore';
import { usePlatformStore } from '../../stores/platformStore';

interface CampaignDetailPanelProps {
  campaign: Campaign;
  onClose: () => void;
}

interface DiagnosisItem {
  type: 'warning' | 'success' | 'info';
  label: string;
  detail: string;
}

interface OptimizationTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

function getDiagnosis(campaign: Campaign): DiagnosisItem[] {
  const items: DiagnosisItem[] = [];
  const { metrics, budgetSpent, pacing, status, spent } = campaign;
  const hasData = metrics.roas > 0 || metrics.ctr > 0 || metrics.cpa > 0 || spent > 0;

  // Status-based diagnosis
  if (status === 'Paused') {
    items.push({ type: 'warning', label: 'Campaign Paused', detail: 'No impressions or spend while paused — review settings before reactivating' });
  }
  if (status === 'Scheduled') {
    items.push({ type: 'info', label: 'Scheduled', detail: 'Campaign will start delivering on the scheduled date' });
  }

  if (hasData) {
    // ROAS
    if (metrics.roas > 0) {
      items.push(metrics.roas >= 3
        ? { type: 'success', label: 'Strong ROAS', detail: `${metrics.roas.toFixed(1)}x return — scaling opportunity` }
        : metrics.roas >= 1.5
          ? { type: 'info', label: 'Moderate ROAS', detail: `${metrics.roas.toFixed(1)}x — profitable but room to optimize` }
          : { type: 'warning', label: 'Low ROAS', detail: `${metrics.roas.toFixed(1)}x — ad spend exceeding returns` });
    }
    // CTR
    if (metrics.ctr > 0) {
      if (metrics.ctr >= 3) items.push({ type: 'success', label: 'High CTR', detail: `${metrics.ctr.toFixed(1)}% — strong creative engagement` });
      else if (metrics.ctr < 1) items.push({ type: 'warning', label: 'Low CTR', detail: `${metrics.ctr.toFixed(1)}% — creative or targeting may need refresh` });
    }
    // CPA
    if (metrics.cpa > 0) {
      if (metrics.cpa > 50) items.push({ type: 'warning', label: 'High CPA', detail: `$${metrics.cpa.toFixed(0)} per conversion — above efficient range` });
      else if (metrics.cpa <= 15) items.push({ type: 'success', label: 'Low CPA', detail: `$${metrics.cpa.toFixed(0)} per conversion — highly efficient` });
    }
    // Conversion volume
    if (metrics.conversions === 0 && spent > 0) {
      items.push({ type: 'warning', label: 'No Conversions', detail: 'Budget is being spent but no conversions recorded — check pixel/tracking setup' });
    }
    // Spend vs budget
    if (budgetSpent > 100) {
      items.push({ type: 'warning', label: 'Over Budget', detail: `${budgetSpent}% of budget used — overspending allocation` });
    } else if (budgetSpent >= 85 && status === 'Active') {
      items.push({ type: 'warning', label: 'Budget Nearly Exhausted', detail: `${budgetSpent}% used — campaign may stop delivering soon` });
    } else if (budgetSpent < 20 && status === 'Active' && pacing === 'Behind') {
      items.push({ type: 'warning', label: 'Severe Underspend', detail: `Only ${budgetSpent}% delivered — audience may be too narrow` });
    }
    // Pacing
    if (pacing === 'Behind') {
      items.push({ type: 'warning', label: 'Pacing Behind', detail: 'Delivery rate is below target — may miss campaign goals' });
    } else if (pacing === 'Ahead') {
      items.push({ type: 'info', label: 'Pacing Ahead', detail: 'Spending faster than planned — may exhaust budget early' });
    } else if (pacing === 'On Track') {
      items.push({ type: 'success', label: 'On Track', detail: 'Budget pacing aligned with schedule' });
    }
    // Impression to click ratio
    if (metrics.impressions > 0 && metrics.clicks === 0) {
      items.push({ type: 'warning', label: 'No Clicks', detail: 'Impressions served but zero clicks — ad creative needs attention' });
    }
  }

  // Always provide at least one item
  if (items.length === 0) {
    items.push({ type: 'info', label: 'Awaiting Data', detail: 'Campaign has not yet generated performance data' });
    items.push({ type: 'info', label: 'Setup Check', detail: 'Verify tracking pixel, audiences, and creative assets before launch' });
  }

  return items;
}

function getOptimizationTips(campaign: Campaign): OptimizationTip[] {
  const tips: OptimizationTip[] = [];
  const { metrics, budgetSpent, pacing, status, spent } = campaign;
  const hasData = metrics.roas > 0 || metrics.ctr > 0 || metrics.cpa > 0 || spent > 0;

  // Performance-based tips
  if (metrics.roas > 0 && metrics.roas < 2) {
    tips.push({ icon: <Target className="w-3.5 h-3.5" />, title: 'Refine audience targeting', description: 'Use lookalike audiences based on top converters. Exclude past purchasers to focus on new customers.', impact: 'High' });
  }
  if (metrics.ctr > 0 && metrics.ctr < 1.5) {
    tips.push({ icon: <Zap className="w-3.5 h-3.5" />, title: 'Refresh ad creatives', description: 'Test 3-5 new creative variants. Try short-form video, carousel formats, and stronger CTAs to combat fatigue.', impact: 'High' });
  }
  if (metrics.cpa > 30) {
    tips.push({ icon: <DollarSign className="w-3.5 h-3.5" />, title: 'Optimize bidding strategy', description: `Switch to target CPA bidding with a cap of $${Math.round(metrics.cpa * 0.7)}. Consider value-based optimization if purchase values vary.`, impact: 'Medium' });
  }
  if (metrics.conversions === 0 && spent > 0) {
    tips.push({ icon: <AlertTriangle className="w-3.5 h-3.5" />, title: 'Verify conversion tracking', description: 'Check that your pixel/CAPI is firing correctly. Test the conversion event in Events Manager and verify the attribution window.', impact: 'High' });
  }

  // Budget & pacing tips
  if (budgetSpent > 90 && status === 'Active') {
    tips.push({ icon: <DollarSign className="w-3.5 h-3.5" />, title: 'Reallocate or increase budget', description: 'Pause underperforming ad sets and shift budget to top performers. Consider a 15-20% budget increase if ROAS is healthy.', impact: 'High' });
  }
  if (pacing === 'Behind') {
    tips.push({ icon: <BarChart3 className="w-3.5 h-3.5" />, title: 'Accelerate delivery', description: 'Broaden audience targeting, increase daily budget, or switch from lowest cost to target cost bidding.', impact: 'Medium' });
  }
  if (pacing === 'Ahead') {
    tips.push({ icon: <BarChart3 className="w-3.5 h-3.5" />, title: 'Slow down spend', description: 'Set daily spend caps or narrow targeting to prevent budget exhaustion before the campaign end date.', impact: 'Medium' });
  }

  // Scaling tips
  if (metrics.roas >= 3) {
    tips.push({ icon: <ArrowUpRight className="w-3.5 h-3.5" />, title: 'Scale this campaign', description: 'Increase budget by 20% every 3-4 days. Duplicate the best ad sets with broader audiences to find new pockets of demand.', impact: 'High' });
  }

  // Status-based tips
  if (status === 'Paused') {
    tips.push({ icon: <PauseCircle className="w-3.5 h-3.5" />, title: 'Pre-launch checklist', description: 'Before reactivating: refresh creatives, update audience exclusions, verify landing page loads, and check for ad policy warnings.', impact: 'Medium' });
    tips.push({ icon: <Target className="w-3.5 h-3.5" />, title: 'Rebuild audience signals', description: 'Paused campaigns lose algorithm learnings. Consider duplicating the campaign with a new learning phase budget.', impact: 'Medium' });
  }

  // General best practices (always show a few)
  if (!hasData || tips.length < 3) {
    tips.push({ icon: <Zap className="w-3.5 h-3.5" />, title: 'Set up automated rules', description: 'Create rules to auto-pause ads with CPA above target or increase budget on ads with strong ROAS.', impact: 'Medium' });
    tips.push({ icon: <Target className="w-3.5 h-3.5" />, title: 'Layer audience exclusions', description: 'Exclude existing customers, recent converters, and overlapping audiences to reduce wasted spend.', impact: 'Medium' });
  }
  tips.push({ icon: <Lightbulb className="w-3.5 h-3.5" />, title: 'A/B test landing pages', description: 'Test different headlines, hero images, and form lengths. Even small conversion rate lifts compound into significant ROAS gains.', impact: 'Low' });

  return tips;
}

const impactColors = { High: 'text-[#d4183d]', Medium: 'text-amber-600', Low: 'text-[#1447e6]' };
const diagnosisIcon = { warning: <AlertTriangle className="w-3.5 h-3.5 text-[#d4183d]" />, success: <TrendingUp className="w-3.5 h-3.5 text-[#008236]" />, info: <BarChart3 className="w-3.5 h-3.5 text-[#1447e6]" /> };
const diagnosisDot = { warning: 'bg-[#d4183d]', success: 'bg-[#008236]', info: 'bg-[#1447e6]' };

export default function CampaignDetailPanel({ campaign, onClose }: CampaignDetailPanelProps) {
  const [showTips, setShowTips] = useState(true);
  const [showAdSets, setShowAdSets] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const diagnosis = getDiagnosis(campaign);
  const tips = getOptimizationTips(campaign);

  const liveCampaign = useOptimizeStore((s) => s.campaigns.find((lc) => lc.id === campaign.id));
  const adGroups = liveCampaign?.adGroups ?? [];
  const totalAds = adGroups.reduce((sum, ag) => sum + ag.ads.length, 0);
  const platformId = liveCampaign?.platformCampaignId || campaign.id;
  const platform = liveCampaign?.platform || (campaign.channels.some((c) => /meta|facebook|instagram/i.test(c)) ? 'meta' : undefined);
  const metaConn = usePlatformStore((s) => s.connections.find((c) => c.platform === 'meta'));
  const metaActId = metaConn?.accountId?.replace(/^act_/, '') || '';
  const metaBizId = metaConn?.businessId || '';
  const adsManagerUrl = platform === 'meta'
    ? metaActId
      ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?${metaBizId ? `global_scope_id=${metaBizId}&business_id=${metaBizId}&` : ''}act=${metaActId}&selected_campaign_ids=${platformId}`
      : `https://www.facebook.com/adsmanager/manage/campaigns?campaign_ids=${platformId}`
    : platform === 'google' ? `https://ads.google.com/aw/campaigns?campaignId=${platformId}` : null;

  const hasMetrics = campaign.metrics.roas > 0 || campaign.metrics.ctr > 0 || campaign.metrics.cpa > 0 || campaign.spent > 0;

  const statusClass: Record<string, string> = {
    Active: 'bg-[#030213] text-white', Paused: 'bg-amber-100 text-amber-800',
    Completed: 'bg-[#eceef2] text-[#030213]', Scheduled: 'border border-[rgba(0,0,0,0.1)] text-[#0a0a0a] bg-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative w-[440px] bg-white shadow-xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#eff2f8] px-5 py-4 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[#0a0a0a] leading-snug">{campaign.name}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${statusClass[campaign.status] || statusClass.Completed}`}>{campaign.status}</span>
              {liveCampaign && (campaign.status === 'Active' || campaign.status === 'Paused') && (
                <button
                  onClick={async () => {
                    setIsUpdatingStatus(true);
                    setDeleteError(null);
                    const newStatus = campaign.status === 'Active' ? 'PAUSED' : 'ACTIVE';
                    try {
                      const result = await (window as any).aiSuites.campaigns.update(platformId, { status: newStatus });
                      if (result.success) {
                        useOptimizeStore.setState({ lastFetchedAt: null });
                        await useOptimizeStore.getState().fetchCampaigns();
                        onClose();
                      } else {
                        setDeleteError(result.error || 'Failed to update campaign status');
                      }
                    } catch {
                      setDeleteError('Failed to update campaign status');
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? (
                    <div className="w-3 h-3 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                  ) : campaign.status === 'Active' ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  {campaign.status === 'Active' ? 'Pause' : 'Resume'}
                </button>
              )}
              {campaign.channels.map((ch) => (
                <span key={ch} className="text-[11px] text-[#878f9e]">{ch}</span>
              ))}
              {campaign.dateRange && <span className="text-[11px] text-[#b6bdc9]">{campaign.dateRange}</span>}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-[#878f9e] cursor-pointer hover:bg-gray-100 transition-colors flex-shrink-0 ml-2 border-none bg-transparent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick stats row */}
        <div className="px-5 py-4 border-b border-[#eff2f8] grid grid-cols-4 gap-2">
          <MiniStat label="Budget" value={campaign.budget} />
          <MiniStat label="Spent" value={campaign.spent > 0 ? `$${campaign.spent.toLocaleString()}` : '$0'} />
          <MiniStat label="Ads" value={String(totalAds || 1)} />
          <MiniStat label="Ad Sets" value={String(adGroups.length || 1)} />
        </div>

        {/* Ad set breakdown — collapsible */}
        {adGroups.length > 0 && (
          <div className="px-5 py-3 border-b border-[#eff2f8]">
            <button onClick={() => setShowAdSets(!showAdSets)} className="flex items-center justify-between w-full text-left cursor-pointer border-none bg-transparent p-0">
              <span className="text-xs font-medium text-[#636a77]">{adGroups.length} Ad Sets</span>
              {showAdSets ? <ChevronUp className="w-3.5 h-3.5 text-[#878f9e]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#878f9e]" />}
            </button>
            {showAdSets && (
              <div className="mt-2 flex flex-col gap-1.5">
                {adGroups.map((ag) => (
                  <div key={ag.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ag.status === 'active' ? 'bg-[#0ea572]' : ag.status === 'paused' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                      <span className="text-xs text-[#464b55] truncate">{ag.name}</span>
                    </div>
                    <span className="text-[10px] text-[#878f9e] flex-shrink-0 ml-2">{ag.ads.length} ads</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metrics — only if there's data */}
        {hasMetrics && (
          <div className="px-5 py-4 border-b border-[#eff2f8]">
            <h3 className="text-xs font-semibold text-[#878f9e] uppercase tracking-wide mb-2.5">Performance</h3>
            <div className="grid grid-cols-3 gap-2">
              {campaign.metrics.roas > 0 && <MiniStat label="ROAS" value={`${campaign.metrics.roas.toFixed(1)}x`} />}
              {campaign.metrics.ctr > 0 && <MiniStat label="CTR" value={`${campaign.metrics.ctr.toFixed(1)}%`} />}
              {campaign.metrics.cpa > 0 && <MiniStat label="CPA" value={`$${campaign.metrics.cpa.toFixed(0)}`} />}
              {campaign.metrics.conversions > 0 && <MiniStat label="Conv." value={campaign.conversions} />}
              {campaign.budgetSpent > 0 && <MiniStat label="Used" value={`${campaign.budgetSpent}%`} />}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        <div className="px-5 py-4 border-b border-[#eff2f8]">
          <h3 className="text-xs font-semibold text-[#878f9e] uppercase tracking-wide mb-2.5">Diagnosis</h3>
          <div className="flex flex-col gap-2">
            {diagnosis.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="mt-1">{diagnosisIcon[item.type]}</div>
                <div>
                  <span className="text-sm font-medium text-[#0a0a0a]">{item.label}</span>
                  <span className="text-sm text-[#878f9e] ml-1">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Tips — collapsible */}
        <div className="px-5 py-4 border-b border-[#eff2f8]">
          <button onClick={() => setShowTips(!showTips)} className="flex items-center justify-between w-full text-left cursor-pointer border-none bg-transparent p-0">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#0a0a0a]" />
              <h3 className="text-xs font-semibold text-[#878f9e] uppercase tracking-wide">Optimization Tips</h3>
              <span className="text-[10px] text-[#b6bdc9]">{tips.length}</span>
            </div>
            {showTips ? <ChevronUp className="w-3.5 h-3.5 text-[#878f9e]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#878f9e]" />}
          </button>
          {showTips && (
            <div className="mt-3 flex flex-col gap-2.5">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#878f9e] mt-0.5">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#0a0a0a]">{tip.title}</span>
                      <span className={`text-[10px] font-medium ${impactColors[tip.impact]}`}>{tip.impact}</span>
                    </div>
                    <p className="text-xs text-[#878f9e] mt-0.5">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ads Manager Link */}
        {adsManagerUrl && (
          <div className="px-5 py-4">
            <a
              href={adsManagerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 border border-[#eff2f8] rounded-lg text-sm font-medium text-[#1447e6] no-underline hover:bg-[#f8f9fb] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Ads Manager
            </a>
          </div>
        )}

        {/* Delete Campaign */}
        {liveCampaign && (
          <div className="px-5 py-4 border-t border-[#eff2f8]">
            {deleteError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {deleteError}
              </div>
            )}
            {!showDeleteConfirm ? (
              <button
                onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Campaign
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 m-0">Delete campaign?</h4>
                    <p className="text-xs text-gray-600 mt-1 m-0 leading-relaxed">
                      This will permanently delete <span className="font-medium text-gray-900">&ldquo;{campaign.name}&rdquo;</span> from your Meta ad account.
                    </p>
                  </div>
                </div>
                <ul className="text-xs text-red-700 space-y-1 ml-11 m-0 list-disc pl-4">
                  <li>All ad sets and ads within this campaign will be deleted</li>
                  <li>Any active ads will stop delivering immediately</li>
                  <li>Historical performance data may no longer be accessible</li>
                </ul>
                <p className="text-xs font-medium text-red-700 ml-11 m-0">This action cannot be undone.</p>
                <div className="flex items-center gap-2 ml-11">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsDeleting(true);
                      setDeleteError(null);
                      try {
                        const result = await (window as any).aiSuites.campaigns.delete(platformId);
                        if (result.success) {
                          useOptimizeStore.setState({ lastFetchedAt: null });
                          await useOptimizeStore.getState().fetchCampaigns();
                          onClose();
                        } else {
                          setDeleteError(result.error || 'Failed to delete campaign');
                          setIsDeleting(false);
                        }
                      } catch {
                        setDeleteError('Failed to delete campaign');
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors border-none cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      'Delete Permanently'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#b6bdc9] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-[#0a0a0a] mt-0.5">{value}</p>
    </div>
  );
}
