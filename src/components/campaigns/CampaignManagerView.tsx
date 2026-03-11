/**
 * CampaignManagerView — Operational view for campaign managers
 * Shows detailed campaign management tools, chat panel, AI opportunities sidebar
 * Extracted from CombinedCampaignsPage to support view switching
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOptimizeStore } from '../../stores/optimizeStore';
import { useProgramStore } from '../../stores/programStore';
import CampaignKPICards from './CampaignKPICards';
import ViewTabs, { type MainTab, type CampaignView } from './ViewTabs';
import ProgramCard from './ProgramCard';
import CampaignCard from './CampaignCard';
import CampaignTreeView from './CampaignTreeView';
import CampaignGanttView from './CampaignGanttView';
import CampaignCalendarView from './CampaignCalendarView';
import CampaignDetailPanel from './CampaignDetailPanel';
import { MessageSquare } from 'lucide-react';
import AIOpportunitiesSidebar, {
  type OptimizationOpportunity,
} from '../optimize/AIOpportunitiesSidebar';
import CampaignChatPanel from './CampaignChatPanel';
import type { Campaign } from '../../types/campaign';
import type { LiveCampaign } from '../../types/optimize';

// ── Demo Campaigns ───────────────────────────────────────────────────────────

const demoCampaigns: Campaign[] = [
  {
    id: 'demo-1',
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
    id: 'demo-2',
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
    id: 'demo-3',
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
    id: 'demo-4',
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
    id: 'demo-5',
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
    id: 'demo-6',
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

/** Demo campaigns as LiveCampaign for tree/gantt/calendar views */
const demoLiveCampaigns: LiveCampaign[] = demoCampaigns.map((c) => ({
  id: c.id,
  name: c.name,
  status: c.status === 'Active' ? 'active' as const : c.status === 'Completed' ? 'completed' as const : 'paused' as const,
  channel: c.channels[0] || 'Meta',
  channels: c.channels,
  budget: c.spent + (c.budgetSpent > 0 ? Math.round(c.spent / (c.budgetSpent / 100)) - c.spent : 0),
  spent: c.spent,
  pacingStatus: (c.pacing === 'Ahead' ? 'overspent' : c.pacing === 'Behind' ? 'underspent' : 'on_track') as LiveCampaign['pacingStatus'],
  metrics: c.metrics,
  trendData: [],
  startDate: c.startDate || '',
  endDate: c.endDate || '',
  daysRemaining: c.endDate ? Math.max(0, Math.round((new Date(c.endDate).getTime() - Date.now()) / 86400000)) : 0,
}));

// ── Mock Opportunities Data ──────────────────────────────────────────────────

const mockOpportunities: OptimizationOpportunity[] = [
  {
    id: 'opp-1',
    title: 'Budget Reallocation',
    description: 'Shift 53% from YouTube to TikTok based on 2.3x higher video completion rates',
    impact: '+$4,200 monthly ROAS',
    confidence: 96,
    priority: 'high',
    savings: '$4,200',
  },
  {
    id: 'opp-2',
    title: 'Creative Refresh Needed',
    description: '3 ads showing performance decline. Refresh creative to maintain engagement',
    impact: 'CTR improvement',
    confidence: 88,
    priority: 'high',
    savings: '$3,850',
  },
  {
    id: 'opp-3',
    title: 'Audience Expansion',
    description: 'Lookalike audience opportunity identified. Reach 2.4K more high-intent users',
    impact: 'Reach +2.4K users',
    confidence: 76,
    priority: 'medium',
    savings: '$1,500',
  },
];

// ── Helper Functions ─────────────────────────────────────────────────────────

/** Convert LiveCampaign from optimize store to Campaign type for CampaignCard */
function mapLiveCampaignToCampaign(liveCampaign: LiveCampaign): Campaign {
  const budgetSpent = liveCampaign.budget > 0
    ? Math.round((liveCampaign.spent / liveCampaign.budget) * 100)
    : 0;

  const pacingMap: Record<string, Campaign['pacing']> = {
    on_track: 'On Track',
    underspent: 'Behind',
    overspent: 'Ahead',
  };

  const statusMap: Record<string, Campaign['status']> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    scheduled: 'Scheduled',
  };

  // Determine campaign type based on ROAS/CPA performance
  const type: Campaign['type'] = liveCampaign.metrics.roas > 2.0
    ? 'Conversion'
    : liveCampaign.metrics.impressions > 100000
    ? 'Awareness'
    : 'Engagement';

  const channels = liveCampaign.channels || [liveCampaign.channel || 'Meta'];
  const formattedChannels = channels.map(ch =>
    ch.charAt(0).toUpperCase() + ch.slice(1)
  );

  return {
    id: liveCampaign.id,
    name: liveCampaign.name,
    description: `${liveCampaign.platform || 'Meta'} campaign • ${liveCampaign.daysRemaining} days remaining`,
    type,
    status: statusMap[liveCampaign.status] || 'Active',
    dateRange: `${new Date(liveCampaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(liveCampaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    startDate: liveCampaign.startDate,
    endDate: liveCampaign.endDate,
    conversions: liveCampaign.metrics.conversions.toLocaleString(),
    reach: liveCampaign.metrics.impressions > 1000000
      ? `${(liveCampaign.metrics.impressions / 1000000).toFixed(1)}M`
      : `${(liveCampaign.metrics.impressions / 1000).toFixed(0)}K`,
    budget: `$${(liveCampaign.budget / 1000).toFixed(0)}K`,
    spent: liveCampaign.spent,
    pacing: pacingMap[liveCampaign.pacingStatus] || 'On Track',
    budgetSpent,
    channels: formattedChannels,
    metrics: liveCampaign.metrics,
  };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CampaignManagerView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MainTab>('programs');
  const [campaignView, setCampaignView] = useState<CampaignView>('cards');
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fetch data from stores
  const { campaigns, isLoading: campaignsLoading, fetchCampaigns } = useOptimizeStore();
  const { programs, loadPrograms, deleteProgram } = useProgramStore();

  // Load data on mount
  useEffect(() => {
    loadPrograms();
    fetchCampaigns();
  }, [loadPrograms, fetchCampaigns]);

  // Merge live campaigns with demo campaigns for KPI cards and views
  const allCampaigns = useMemo(() => {
    const liveIds = new Set(campaigns.map((c) => c.id));
    return [...campaigns, ...demoLiveCampaigns.filter((c) => !liveIds.has(c.id))];
  }, [campaigns]);

  // Opportunity handlers
  const handleDismiss = (id: string) => {
    setOpportunities(prev => prev.filter(opp => opp.id !== id));
  };

  const handleReview = (id: string) => {
    console.log('[CampaignManagerView] Review opportunity:', id);
    // TODO: Navigate to detailed review page or show modal
  };

  // Program click handler - navigate to the latest step
  const handleProgramClick = (programId: string) => {
    if (!programId) {
      navigate('/campaign-chat');
      return;
    }
    const program = programs.find((p: any) => p.id === programId);
    const step = program?.furthestCompletedStep || 0;

    // Steps 3-4 (Configure & Launch) → go to launch page
    if (step >= 3) {
      navigate('/campaign-launch', { state: { programId } });
    } else {
      // Steps 0-2 (Brief / Blueprint) → go to chat page
      navigate('/campaign-chat', { state: { programId } });
    }
  };

  // Campaign click handler - show detail panel/modal
  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Slide-in Chat Panel */}
        <CampaignChatPanel isOpen={!isChatCollapsed} onClose={() => setIsChatCollapsed(true)} />

        {/* Main column */}
        <div className={`flex-1 flex flex-col overflow-y-auto bg-white border border-gray-100 relative ${!isChatCollapsed ? 'rounded-r-2xl' : 'rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}>
          {/* Chat toggle (shown when collapsed) */}
          {isChatCollapsed && (
            <button
              onClick={() => setIsChatCollapsed(false)}
              className="absolute top-6 left-6 w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer z-10"
              title="Open chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-700" />
            </button>
          )}
          {/* Header */}
          <div className={`flex-shrink-0 px-8 py-6 ${isChatCollapsed ? 'ml-10' : ''}`}>
            <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Monitor performance, optimize campaigns, and analyze AI-driven recommendations
            </p>

            {/* KPI Cards */}
            <CampaignKPICards campaigns={allCampaigns} programs={programs} />
          </div>

          {/* Content Row: Main Content + AI Sidebar */}
          <div className={`flex flex-1 overflow-hidden ${isChatCollapsed ? 'ml-10' : ''}`}>
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto px-4 pt-4 pb-8">
              {/* View Tabs */}
              <div className="mb-6">
                <ViewTabs
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setSelectedCampaign(null); // Close detail when switching tabs
                  }}
                  campaignView={campaignView}
                  onCampaignViewChange={setCampaignView}
                />
              </div>

              {activeTab === 'programs' ? (
                <ProgramsView programs={programs} onProgramClick={handleProgramClick} onDeleteProgram={deleteProgram} />
              ) : (
                <CampaignsView
                  campaigns={allCampaigns}
                  isLoading={campaignsLoading}
                  view={campaignView}
                  onCampaignClick={handleCampaignClick}
                />
              )}
            </div>

            {/* AI Opportunities Sidebar */}
            <div className="overflow-y-auto pt-4 pr-4">
              <AIOpportunitiesSidebar
                opportunities={opportunities}
                onDismiss={handleDismiss}
                onReview={handleReview}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Detail Panel/Modal */}
      {selectedCampaign && (
        <CampaignDetailPanel
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </>
  );
}

// ── Programs View ────────────────────────────────────────────────────────────

interface ProgramsViewProps {
  programs: any[];
  onProgramClick: (programId: string) => void;
  onDeleteProgram: (programId: string) => void;
}

function ProgramsView({ programs, onProgramClick, onDeleteProgram }: ProgramsViewProps) {
  const [programToDelete, setProgramToDelete] = useState<{ id: string; name: string } | null>(null);

  if (programs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">No programs yet</p>
          <button
            onClick={() => onProgramClick('')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 cursor-pointer border-none"
          >
            Create New Program
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {programs.map((program) => {
          const stepsCompleted = program.furthestCompletedStep || 0;
          const totalSteps = 4;
          const platforms = (program.channels || [])
            .filter((ch: any) => ch.enabled)
            .map((ch: any) => ch.platform.charAt(0).toUpperCase() + ch.platform.slice(1));
          const status = program.status === 'ready_to_launch' || program.status === 'launched'
            ? 'active'
            : stepsCompleted > 0 && stepsCompleted < totalSteps
            ? 'in-progress'
            : program.status;

          return (
            <ProgramCard
              key={program.id}
              program={{
                id: program.id,
                name: program.name,
                description: program.briefSnapshot ? 'Campaign program with brief' : 'No description',
                startDate: new Date(program.createdAt).toLocaleDateString(),
                status: status,
                stepsCompleted,
                totalSteps,
                platforms,
              }}
              onClick={() => onProgramClick(program.id)}
              onEdit={() => onProgramClick(program.id)}
              onDelete={() => setProgramToDelete({ id: program.id, name: program.name })}
            />
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Delete program?</h3>
            <p className="text-xs text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{programToDelete.name}</span> will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setProgramToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProgram(programToDelete.id);
                  setProgramToDelete(null);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Campaigns View ───────────────────────────────────────────────────────────

interface CampaignsViewProps {
  campaigns: LiveCampaign[];
  isLoading: boolean;
  view: CampaignView;
  onCampaignClick: (campaign: Campaign) => void;
}

function CampaignsView({ campaigns, isLoading, view, onCampaignClick }: CampaignsViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading campaigns...</div>
      </div>
    );
  }

  // Merge live campaigns with demo campaigns (demo IDs won't collide with real ones)
  const liveIds = new Set(campaigns.map((c) => c.id));
  const liveMapped = campaigns.map(mapLiveCampaignToCampaign);
  const demo = demoCampaigns.filter((c) => !liveIds.has(c.id));
  const mappedCampaigns = [...liveMapped, ...demo];
  const allLiveCampaigns = [...campaigns, ...demoLiveCampaigns.filter((c) => !liveIds.has(c.id))];

  // Tree view - hierarchical structure
  if (view === 'tree') {
    return (
      <CampaignTreeView
        campaigns={allLiveCampaigns}
        onCampaignClick={(id) => {
          const campaign = mappedCampaigns.find(c => c.id === id);
          if (campaign) onCampaignClick(campaign);
        }}
        onAdGroupClick={(campaignId, adGroupId) => {
          console.log('Ad group clicked:', campaignId, adGroupId);
        }}
        onAdClick={(campaignId, adGroupId, adId) => {
          console.log('Ad clicked:', campaignId, adGroupId, adId);
        }}
      />
    );
  }

  // Gantt view - timeline with horizontal bars
  if (view === 'gantt') {
    return (
      <CampaignGanttView
        campaigns={allLiveCampaigns}
        onCampaignClick={(id) => {
          const campaign = mappedCampaigns.find(c => c.id === id);
          if (campaign) onCampaignClick(campaign);
        }}
      />
    );
  }

  // Calendar view - monthly calendar grid
  if (view === 'calendar') {
    return (
      <CampaignCalendarView
        campaigns={allLiveCampaigns}
        onCampaignClick={(id) => {
          const campaign = mappedCampaigns.find(c => c.id === id);
          if (campaign) onCampaignClick(campaign);
        }}
      />
    );
  }

  // Cards view - grid of campaign cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {mappedCampaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onClick={() => onCampaignClick(campaign)}
          onEdit={() => onCampaignClick(campaign)}
        />
      ))}
    </div>
  );
}
