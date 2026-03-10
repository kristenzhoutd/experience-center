import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, MoreHorizontal, Pencil, FileText, Layers, Settings, Trash2, BarChart3 } from 'lucide-react';
import CampaignCard from './CampaignCard';
import CampaignDetailPanel from './CampaignDetailPanel';
import CalendarView from './CalendarView';
import GanttView from './GanttView';
import { useCampaignStore } from '../../stores/campaignStore';
import { useOptimizeStore } from '../../stores/optimizeStore';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useCampaignLaunchStore } from '../../stores/campaignLaunchStore';
import { useBriefStore } from '../../stores/briefStore';
import { useProgramStore } from '../../stores/programStore';
import { formatMessaging } from '../../utils/messagingHelpers';
import { resetAllProgramState } from '../../utils/resetProgramState';
import type { PaidMediaProgram } from '../../types/program';
import type { Campaign, CampaignStats, CampaignStatus, CampaignPacing } from '../../types/campaign';
import type { LiveCampaign } from '../../types/optimize';
import type { Blueprint } from '../../../electron/utils/ipc-types';

type ViewMode = 'gallery' | 'calendar' | 'gantt';

interface CampaignsPageProps {
  onCampaignClick?: (campaign: Campaign) => void;
}

// Inline mock campaigns so the UI is always visible when Meta data is unavailable
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Spring Collection Launch',
    description: 'Seasonal promotion campaign',
    type: 'Conversion',
    status: 'Active',
    dateRange: 'Feb 10 - Apr 15, 2026',
    startDate: '2026-02-10',
    endDate: '2026-04-15',
    conversions: '12,453',
    reach: '2.4M',
    budget: '$45,000',
    spent: 30150,
    pacing: 'On Track',
    budgetSpent: 67,
    channels: ['Meta', 'Google', 'TikTok'],
    metrics: { impressions: 5200000, clicks: 124000, ctr: 2.38, conversions: 12453, cpa: 2.42, roas: 4.1, spend: 30150 },
  },
  {
    id: '2',
    name: 'Brand Awareness Q1',
    description: 'Brand visibility campaign',
    type: 'Awareness',
    status: 'Active',
    dateRange: 'Jan 15 - Mar 31, 2026',
    startDate: '2026-01-15',
    endDate: '2026-03-31',
    conversions: '8,234',
    reach: '5.1M',
    budget: '$75,000',
    spent: 33750,
    pacing: 'Ahead',
    budgetSpent: 45,
    channels: ['YouTube', 'Meta', 'Display'],
    metrics: { impressions: 12000000, clicks: 310000, ctr: 2.58, conversions: 8234, cpa: 4.1, roas: 3.2, spend: 33750 },
  },
  {
    id: '3',
    name: 'Product V2 Launch',
    description: 'New product launch campaign',
    type: 'Awareness',
    status: 'Scheduled',
    dateRange: 'Mar 10 - Apr 30, 2026',
    startDate: '2026-03-10',
    endDate: '2026-04-30',
    conversions: '-',
    reach: '-',
    budget: '$120,000',
    spent: 0,
    pacing: 'Not Started',
    budgetSpent: 0,
    channels: ['Meta', 'Google', 'LinkedIn', 'TikTok'],
    metrics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0, spend: 0 },
  },
  {
    id: '4',
    name: 'Retargeting - Cart Abandoners',
    description: 'Re-engage cart abandoners',
    type: 'Retargeting',
    status: 'Active',
    dateRange: 'Jan 1 - Jun 30, 2026',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    conversions: '3,892',
    reach: '890K',
    budget: '$25,000',
    spent: 22250,
    pacing: 'Behind',
    budgetSpent: 89,
    channels: ['Meta', 'Google'],
    metrics: { impressions: 1800000, clicks: 54000, ctr: 3.0, conversions: 3892, cpa: 5.72, roas: 2.8, spend: 22250 },
  },
  {
    id: '5',
    name: 'Summer Campaign 2026',
    description: 'Summer seasonal push',
    type: 'Conversion',
    status: 'Draft',
    dateRange: 'May 1 - Jul 31, 2026',
    startDate: '2026-05-01',
    endDate: '2026-07-31',
    conversions: '-',
    reach: '-',
    budget: '$200,000',
    spent: 0,
    pacing: 'Not Started',
    budgetSpent: 0,
    channels: ['Meta', 'Google', 'TikTok', 'Pinterest'],
    metrics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0, spend: 0 },
  },
  {
    id: '6',
    name: 'Email Retargeting',
    description: 'Email subscriber engagement',
    type: 'Engagement',
    status: 'Completed',
    dateRange: 'Dec 1, 2025 - Feb 15, 2026',
    startDate: '2025-12-01',
    endDate: '2026-02-15',
    conversions: '15,234',
    reach: '1.2M',
    budget: '$30,000',
    spent: 30000,
    pacing: 'Complete',
    budgetSpent: 100,
    channels: ['Email', 'Meta'],
    metrics: { impressions: 3200000, clicks: 96000, ctr: 3.0, conversions: 15234, cpa: 1.97, roas: 6.2, spend: 30000 },
  },
];

// Map LiveCampaign (real Meta data) → Campaign (display type)
function liveToCampaign(lc: LiveCampaign): Campaign {
  const statusMap: Record<string, CampaignStatus> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    scheduled: 'Scheduled',
  };
  const pacingMap: Record<string, CampaignPacing> = {
    on_track: 'On Track',
    overspent: 'Ahead',
    underspent: 'Behind',
  };

  // Paused campaigns from Meta show as "Not Started"
  const pacing = lc.status === 'paused' ? 'Not Started' : (pacingMap[lc.pacingStatus] || 'On Track');

  const fmt = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const budget = lc.budget || 0;
  const budgetSpent = budget > 0 ? Math.round((lc.spent / budget) * 100) : 0;

  return {
    id: lc.id,
    name: lc.name,
    description: lc.channel || 'Meta Ads campaign',
    type: 'Conversion',
    status: statusMap[lc.status] || 'Active',
    dateRange: lc.startDate && lc.endDate ? `${fmt(lc.startDate)} - ${fmt(lc.endDate)}` : '',
    startDate: lc.startDate,
    endDate: lc.endDate,
    conversions: lc.metrics.conversions > 0 ? lc.metrics.conversions.toLocaleString() : '-',
    reach: '-',
    budget: `$${budget.toLocaleString()}`,
    spent: lc.spent,
    pacing,
    budgetSpent,
    channels: lc.channels || [lc.channel],
    metrics: { ...lc.metrics, spend: lc.spent },
  };
}

function computeStatsFromCampaigns(campaigns: Campaign[]): CampaignStats {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    activeCampaigns: campaigns.filter((c) => c.status === 'Active').length,
    needsAttention: campaigns.filter(
      (c) => c.pacing === 'Behind' || (c.metrics.roas > 0 && c.metrics.roas < 1.0)
    ).length,
    overBudget: campaigns.filter((c) => c.budgetSpent > 100).length,
    launchingThisWeek: campaigns.filter((c) => {
      if (c.status !== 'Scheduled' || !c.startDate) return false;
      const start = new Date(c.startDate);
      return start >= now && start <= nextWeek;
    }).length,
    activeCampaignsChange: 0,
    needsAttentionChange: 0,
    overBudgetChange: 0,
    launchingThisWeekChange: 0,
  };
}

function getAttentionReason(campaign: Campaign): string {
  if (campaign.status === 'Paused') return 'Paused';
  if (campaign.pacing === 'Behind') return 'Behind Pace';
  if (campaign.budgetSpent >= 90) return 'Over Budget';
  if (campaign.metrics.roas < 2.0) return 'Low ROAS';
  return '';
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ onCampaignClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const openCampaignId = (location.state as { openCampaignId?: string } | null)?.openCampaignId;

  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [blueprintToDelete, setBlueprintToDelete] = useState<Blueprint | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const {
    setCampaigns,
    setStats,
  } = useCampaignStore();

  const { blueprints, loadBlueprints, deleteBlueprint } = useBlueprintStore();
  const { briefs: allBriefs, loadBriefs, deleteBrief: deleteSavedBrief } = useBriefStore();
  const briefs = useMemo(() => allBriefs.filter((b) => b.suite !== 'personalization'), [allBriefs]);
  const savedConfigs = useCampaignLaunchStore((s) => s.savedConfigs);
  const loadSavedConfigs = useCampaignLaunchStore((s) => s.loadSavedConfigs);
  const deleteSavedConfig = useCampaignLaunchStore((s) => s.deleteSavedConfig);
  const [configToDelete, setConfigToDelete] = useState<{ id: string; name: string } | null>(null);

  // Programs
  const programs = useProgramStore((s) => s.programs);
  const loadPrograms = useProgramStore((s) => s.loadPrograms);
  const [programToDelete, setProgramToDelete] = useState<PaidMediaProgram | null>(null);
  const [menuOpenProgramId, setMenuOpenProgramId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [renamingProgramId, setRenamingProgramId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');


  const {
    campaigns: liveCampaigns,
    fetchCampaigns: fetchMetaCampaigns,
    isLoading: isFetchingCampaigns,
    error: fetchError,
  } = useOptimizeStore();

  const isRefreshing = isFetchingCampaigns;

  // Convert live campaigns from Meta
  const convertedCampaigns = useMemo(() => {
    if (liveCampaigns.length === 0) return [];
    return liveCampaigns.map(liveToCampaign);
  }, [liveCampaigns]);

  // Merge demo + live campaigns and keep campaign store in sync
  const allCampaigns = useMemo(() => {
    const liveIds = new Set(convertedCampaigns.map((c) => c.id));
    // Demo campaigns that don't collide with real IDs
    const demo = mockCampaigns.filter((c) => !liveIds.has(c.id));
    return [...convertedCampaigns, ...demo];
  }, [convertedCampaigns]);

  useEffect(() => {
    setCampaigns(allCampaigns);
    setStats(computeStatsFromCampaigns(allCampaigns));
  }, [allCampaigns]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch campaigns from Meta and load blueprints on mount
  useEffect(() => {
    if (openCampaignId) {
      // Just launched a campaign — clear the cache so we get fresh data
      useOptimizeStore.setState({ lastFetchedAt: null });
    }
    fetchMetaCampaigns().catch(() => {
      // Platform not connected or token expired
    });
    loadBlueprints();
    loadBriefs();
    loadSavedConfigs();
    loadPrograms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    useOptimizeStore.setState({ lastFetchedAt: null });
    fetchMetaCampaigns().then(() => {
      setLastRefreshed(new Date());
    });
  };

  // Auto-select a campaign after launch navigation
  const openHandledRef = useRef(false);
  useEffect(() => {
    if (!openCampaignId || openHandledRef.current) return;
    if (allCampaigns.length === 0) return;
    const match = allCampaigns.find((c) => c.id === openCampaignId);
    if (match) {
      openHandledRef.current = true;
      setSelectedCampaign(match);
    }
  }, [openCampaignId, allCampaigns]);

  const campaigns = allCampaigns;

  // Needs Attention: active campaigns that are underperforming (with actual spend)
  const needsAttentionCampaigns = campaigns.filter(
    (c) =>
      c.status === 'Active' && c.pacing !== 'Not Started' &&
      (c.pacing === 'Behind' || c.budgetSpent >= 90 || (c.metrics.roas < 2.0 && c.metrics.spend > 0))
  );

  // Active Campaigns: exclude those already shown in Needs Attention
  const needsAttentionIds = new Set(needsAttentionCampaigns.map((c) => c.id));
  const activeCampaigns = campaigns.filter((c) => !needsAttentionIds.has(c.id));

  const viewModes: { id: ViewMode; label: string }[] = [
    { id: 'gallery', label: 'Gallery' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'gantt', label: 'Gantt' },
  ];

  return (
    <div className="h-full overflow-hidden flex flex-col bg-[#F7F8FB]">
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-5">
          {/* Page header with refresh */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Campaigns</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  resetAllProgramState();
                  const program = useProgramStore.getState().createProgram('New Campaign Program');
                  const result = await useProgramStore.getState().openProgram(program.id);
                  if (result) navigate(result.targetRoute, { state: result.navigationState });
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors border-none cursor-pointer"
              >
                + New Program
              </button>
              <span className="text-[10px] text-gray-300">
                Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading indicator */}
          {isFetchingCampaigns && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              Loading campaigns from Meta...
            </div>
          )}

          {/* Error message */}
          {fetchError && !isFetchingCampaigns && (
            <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <span className="text-sm text-red-600">{fetchError}</span>
              <button
                onClick={() => {
                  useOptimizeStore.setState({ lastFetchedAt: null });
                  fetchMetaCampaigns();
                }}
                className="text-xs font-medium text-red-700 bg-red-100 px-3 py-1 rounded-lg border-none cursor-pointer hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Section 0: Programs */}
          {programs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Programs</h2>
                <span className="bg-gray-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {programs.length}
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                  {programs.map((program) => {
                    const completedSteps = program.steps.filter((s) => s.status === 'completed').length;
                    const statusColor: Record<string, string> = {
                      draft: 'bg-gray-100 text-gray-600',
                      in_progress: 'bg-blue-100 text-blue-700',
                      ready_to_launch: 'bg-green-100 text-green-700',
                      launched: 'bg-purple-100 text-purple-700',
                    };
                    const enabledChannels = program.channels.filter((ch) => ch.enabled);
                    const hasLaunchConfigs = program.channels.some((ch) => ch.enabled && ch.launchConfigIds.length > 0);

                    return (
                      <div
                        key={program.id}
                        onClick={async () => {
                          const result = await useProgramStore.getState().openProgram(program.id);
                          if (result) navigate(result.targetRoute, { state: result.navigationState });
                        }}
                        className="group relative min-w-[280px] max-w-[300px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-md"
                      >
                        {/* Action menu button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menuOpenProgramId === program.id) {
                              setMenuOpenProgramId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setMenuOpenProgramId(program.id);
                            }
                          }}
                          className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center transition-opacity hover:bg-gray-100 hover:text-gray-600 border-none cursor-pointer ${menuOpenProgramId === program.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          title="Program actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Name (inline rename) */}
                        {renamingProgramId === program.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (renameValue.trim()) {
                                  useProgramStore.getState().renameProgramById(program.id, renameValue);
                                }
                                setRenamingProgramId(null);
                              }
                              if (e.key === 'Escape') {
                                setRenamingProgramId(null);
                              }
                            }}
                            onBlur={() => {
                              if (renameValue.trim()) {
                                useProgramStore.getState().renameProgramById(program.id, renameValue);
                              }
                              setRenamingProgramId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-semibold text-gray-800 mb-1 pr-8 w-full bg-white border border-blue-400 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        ) : (
                          <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-8">
                            {program.name}
                          </h4>
                        )}

                        {/* Status badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor[program.status] || 'bg-gray-100 text-gray-600'}`}>
                            {program.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Step {program.currentStepId} of 4
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="bg-gray-100 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            {program.steps.map((step) => (
                              <div
                                key={step.stepId}
                                className={`flex-1 h-1.5 rounded-full ${
                                  step.status === 'completed'
                                    ? 'bg-green-500'
                                    : step.status === 'in_progress'
                                      ? 'bg-blue-500'
                                      : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {completedSteps}/4 steps completed
                          </div>
                        </div>

                        {/* Channel icons */}
                        {enabledChannels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {enabledChannels.map((ch) => (
                              <span
                                key={ch.platform}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                                  ch.isConfigured
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                                }`}
                              >
                                {ch.platform}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-[10px] text-gray-400">
                          {new Date(program.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Program action menu (rendered outside overflow container to avoid clipping) */}
          {menuOpenProgramId && menuPosition && (() => {
            const menuProgram = programs.find((p) => p.id === menuOpenProgramId);
            if (!menuProgram) return null;
            const menuHasLaunchConfigs = menuProgram.channels.some((ch) => ch.enabled && ch.launchConfigIds.length > 0);
            return (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpenProgramId(null); setMenuPosition(null); }} />
                <div
                  className="fixed z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-left"
                  style={{ top: menuPosition.top, right: menuPosition.right }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenamingProgramId(menuProgram.id); setRenameValue(menuProgram.name); setMenuOpenProgramId(null); setMenuPosition(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" /> Rename
                  </button>
                  {menuProgram.briefSnapshot && (
                    <button
                      onClick={async (e) => { e.stopPropagation(); setMenuOpenProgramId(null); setMenuPosition(null); const result = await useProgramStore.getState().openProgram(menuProgram.id, { targetStep: 1, editBrief: true }); if (result) navigate(result.targetRoute, { state: result.navigationState }); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-400" /> Edit Brief
                    </button>
                  )}
                  {menuProgram.approvedBlueprintId && (
                    <button
                      onClick={async (e) => { e.stopPropagation(); setMenuOpenProgramId(null); setMenuPosition(null); const result = await useProgramStore.getState().openProgram(menuProgram.id, { targetStep: 2 }); if (result) navigate(result.targetRoute, { state: result.navigationState }); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                    >
                      <Layers className="w-3.5 h-3.5 text-gray-400" /> Edit Campaign Plan
                    </button>
                  )}
                  {menuHasLaunchConfigs && (
                    <button
                      onClick={async (e) => { e.stopPropagation(); setMenuOpenProgramId(null); setMenuPosition(null); const result = await useProgramStore.getState().openProgram(menuProgram.id, { targetStep: 3 }); if (result) navigate(result.targetRoute, { state: result.navigationState }); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" /> Edit Campaign Config
                    </button>
                  )}
                  {menuProgram.status === 'launched' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenProgramId(null); setMenuPosition(null); navigate('/unified-view'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-gray-400" /> View Dashboard
                    </button>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenProgramId(null); setMenuPosition(null); setProgramToDelete(menuProgram); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Program
                  </button>
                </div>
              </>
            );
          })()}

          {/* Section 1: Needs Attention */}
          {needsAttentionCampaigns.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Needs Attention</h2>
                <span className="bg-red-100 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {needsAttentionCampaigns.length}
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                  {needsAttentionCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="min-w-[320px] max-w-[340px] flex-shrink-0"
                    >
                      <div className="border-l-2 border-red-400 rounded-2xl overflow-hidden">
                        <CampaignCard
                          campaign={campaign}
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            onCampaignClick?.(campaign);
                          }}
                          onEdit={async () => {
                            const liveCampaign = useOptimizeStore.getState().campaigns.find((lc) => lc.id === campaign.id);
                            if (liveCampaign) {
                              await useCampaignLaunchStore.getState().initFromLiveCampaign(liveCampaign);
                            }
                            navigate('/campaign-launch', { state: { campaignId: campaign.id } });
                          }}
                          onViewDashboard={() => {
                            navigate('/unified-view', { state: { campaignId: campaign.id } });
                          }}
                        />
                      </div>
                      <span className="inline-block mt-1.5 ml-1 text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">
                        {getAttentionReason(campaign)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Active Campaigns */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Active Campaigns</h2>
              {/* View mode toggle pills */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
                {viewModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${
                      viewMode === mode.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery view */}
            {viewMode === 'gallery' && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                {activeCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      onCampaignClick?.(campaign);
                    }}
                    onEdit={async () => {
                      const liveCampaign = useOptimizeStore.getState().campaigns.find((lc) => lc.id === campaign.id);
                      if (liveCampaign) {
                        await useCampaignLaunchStore.getState().initFromLiveCampaign(liveCampaign);
                      }
                      navigate('/campaign-launch', { state: { campaignId: campaign.id } });
                    }}
                    onViewDashboard={() => {
                      navigate('/unified-view', { state: { campaignId: campaign.id } });
                    }}
                  />
                ))}
              </div>
            )}

            {/* Calendar view */}
            {viewMode === 'calendar' && (
              <CalendarView campaigns={activeCampaigns} onCampaignClick={onCampaignClick} />
            )}

            {/* Gantt view */}
            {viewMode === 'gantt' && (
              <GanttView campaigns={activeCampaigns} onCampaignClick={onCampaignClick} />
            )}
          </div>

          {/* Section 3–5 hidden: artifacts are managed within programs */}
          {false && savedConfigs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Campaign Configurations</h2>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {savedConfigs.length}
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                  {savedConfigs.map((sc) => {
                    const objectiveLabel = sc.config.campaign.objective
                      ?.replace('OUTCOME_', '')
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/^\w/, (c: string) => c.toUpperCase()) || 'Unknown';
                    const dailyBudget = `$${(sc.config.campaign.dailyBudget / 100).toFixed(0)}/day`;
                    const adSetCount = sc.config.adSets.length;
                    const creativeCount = sc.config.creatives.length;
                    const adCount = sc.config.ads.length;

                    return (
                      <div
                        key={sc.id}
                        onClick={() => {
                          navigate('/campaign-launch', { state: { savedConfigId: sc.id } });
                        }}
                        className="group relative min-w-[280px] max-w-[300px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:border-indigo-400 hover:shadow-md"
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfigToDelete({ id: sc.id, name: sc.name });
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 border-none cursor-pointer"
                          title="Delete configuration"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        {/* Name */}
                        <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-6">
                          {sc.name}
                        </h4>

                        {/* Source blueprint */}
                        {sc.sourceBlueprintName && (
                          <p className="text-[10px] text-gray-400 mb-2 truncate">
                            From: {sc.sourceBlueprintName}
                          </p>
                        )}

                        {/* Edit mode badge */}
                        {sc.isEditMode && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 mb-2">
                            Edit Mode
                          </span>
                        )}

                        {/* Inner card */}
                        <div className="bg-indigo-50/60 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                              {objectiveLabel}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 text-gray-600 border border-gray-200/60">
                              {dailyBudget}
                            </span>
                          </div>

                          {/* Counts */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-1.5 bg-white/80 rounded-lg">
                              <div className="text-[10px] text-gray-400 mb-0.5">Ad Sets</div>
                              <div className="text-xs font-semibold text-gray-800">{adSetCount}</div>
                            </div>
                            <div className="text-center p-1.5 bg-white/80 rounded-lg">
                              <div className="text-[10px] text-gray-400 mb-0.5">Creatives</div>
                              <div className="text-xs font-semibold text-gray-800">{creativeCount}</div>
                            </div>
                            <div className="text-center p-1.5 bg-white/80 rounded-lg">
                              <div className="text-[10px] text-gray-400 mb-0.5">Ads</div>
                              <div className="text-xs font-semibold text-gray-800">{adCount}</div>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-[10px] text-gray-400">
                          {new Date(sc.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {false && blueprints.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Campaign Blueprints</h2>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {blueprints.length}
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                  {blueprints
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((blueprint) => {
                      const confidenceColor =
                        blueprint.confidence === 'High'
                          ? 'bg-green-100 text-green-700'
                          : blueprint.confidence === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700';
                      const variantColor =
                        blueprint.variant === 'aggressive'
                          ? 'bg-red-50 text-red-600'
                          : blueprint.variant === 'balanced'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-green-50 text-green-600';

                      return (
                        <div
                          key={blueprint.id}
                          onClick={() => {
                            useBlueprintStore.getState().selectBlueprint(blueprint.id);
                            useBlueprintStore.getState().setHasGeneratedPlan(true);
                            navigate(`/campaign-chat?blueprintId=${blueprint.id}`);
                          }}
                          className="group relative min-w-[280px] max-w-[300px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-md"
                        >
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBlueprintToDelete(blueprint);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 border-none cursor-pointer"
                            title="Delete blueprint"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          {/* Name */}
                          <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-6">
                            {blueprint.name}
                          </h4>

                          {/* Description */}
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                            {formatMessaging(blueprint.messaging) || 'No description available'}
                          </p>

                          {/* Inner card */}
                          <div className="bg-blue-50/60 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceColor}`}>
                                {blueprint.confidence} Confidence
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${variantColor}`}>
                                {blueprint.variant}
                              </span>
                            </div>

                            {/* Channels */}
                            {blueprint.channels && blueprint.channels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {blueprint.channels.slice(0, 3).map((ch, idx) => {
                                  const channelName = typeof ch === 'string' ? ch : (ch as any)?.name || String(ch);
                                  return (
                                    <span key={`${channelName}-${idx}`} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/80 text-gray-600 border border-gray-200/60">
                                      {channelName}
                                    </span>
                                  );
                                })}
                                {blueprint.channels.length > 3 && (
                                  <span className="text-[10px] text-gray-400">+{blueprint.channels.length - 3} more</span>
                                )}
                              </div>
                            )}

                            {/* Budget */}
                            {blueprint.budget && (
                              <div className="text-[11px] text-gray-500">
                                Budget: <span className="font-medium text-gray-700">{blueprint.budget.amount}</span>
                                {blueprint.budget.pacing && (
                                  <span className="text-gray-400"> &middot; {blueprint.budget.pacing}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Metrics grid */}
                          {blueprint.metrics && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-[10px] text-gray-400 mb-0.5">Reach</div>
                                <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.reach}</div>
                              </div>
                              <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-[10px] text-gray-400 mb-0.5">CTR</div>
                                <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.ctr}</div>
                              </div>
                              <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-[10px] text-gray-400 mb-0.5">ROAS</div>
                                <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.roas}</div>
                              </div>
                              <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-[10px] text-gray-400 mb-0.5">Conversions</div>
                                <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.conversions}</div>
                              </div>
                            </div>
                          )}

                          {/* Created date */}
                          <div className="mt-3 text-[10px] text-gray-400">
                            {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {false && briefs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Campaign Briefs</h2>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {briefs.length}
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                  {briefs
                    .slice()
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((brief) => {
                      const statusColor =
                        brief.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : brief.status === 'in_review'
                          ? 'bg-yellow-100 text-yellow-700'
                          : brief.status === 'active'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600';

                      const filledSections = [
                        brief.sections.overview?.campaignName,
                        brief.sections.audience?.primaryAudience,
                        brief.sections.experience?.headline || brief.sections.experience?.ctaText,
                        brief.sections.measurement?.primaryKpi,
                      ].filter(Boolean).length;

                      return (
                        <div
                          key={brief.id}
                          onClick={() => {
                            navigate('/campaign-chat', { state: { briefId: brief.id } });
                          }}
                          className="group relative min-w-[260px] max-w-[280px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:border-purple-400 hover:shadow-md"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedBrief(brief.id);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 border-none cursor-pointer"
                            title="Delete brief"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-6">{brief.name}</h4>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor}`}>
                              {brief.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-gray-400">{filledSections}/4 sections</span>
                          </div>
                          <div className="bg-purple-50/60 rounded-lg p-3 mb-3">
                            {brief.sections.overview?.objective && (
                              <p className="text-xs text-gray-600 line-clamp-2 mb-1">{brief.sections.overview.objective}</p>
                            )}
                            {brief.sections.overview?.businessGoal && (
                              <p className="text-[11px] text-gray-500 line-clamp-1">Goal: {brief.sections.overview.businessGoal}</p>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(brief.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Program Confirmation Modal */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setProgramToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Program</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-700">"{programToDelete.name}"</span>? This will remove the program but keep its individual artifacts (briefs, blueprints, configs).
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setProgramToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  useProgramStore.getState().deleteProgram(programToDelete.id);
                  setProgramToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors border-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Blueprint Confirmation Modal */}
      {blueprintToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setBlueprintToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Blueprint</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-700">"{blueprintToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBlueprintToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBlueprint(blueprintToDelete.id);
                  setBlueprintToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors border-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Config Confirmation Modal */}
      {configToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfigToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Configuration</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-700">"{configToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfigToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSavedConfig(configToDelete.id);
                  setConfigToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors border-none cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Panel */}
      {selectedCampaign && (
        <CampaignDetailPanel
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};

export default CampaignsPage;
