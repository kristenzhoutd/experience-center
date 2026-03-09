/**
 * CombinedCampaignsPage — Unified view for Programs and live Campaigns
 * Programs tab: All campaign programs (draft → ready_to_launch → launched)
 * Campaigns tab: Live campaigns synced from platform (Meta/Google/TikTok)
 * Layout: Collapsible chat on left + campaign content + AI opportunities sidebar on right
 */

import { useState, useEffect } from 'react';
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
import SplitPaneLayout from '../campaign/SplitPaneLayout';
import AIOpportunitiesSidebar, {
  type OptimizationOpportunity,
} from '../optimize/AIOpportunitiesSidebar';
import CampaignChatPanel from './CampaignChatPanel';
import type { Campaign } from '../../types/campaign';
import type { LiveCampaign } from '../../types/optimize';

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

export default function CombinedCampaignsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MainTab>('programs');
  const [campaignView, setCampaignView] = useState<CampaignView>('cards');
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fetch data from stores
  const { campaigns, isLoading: campaignsLoading, fetchCampaigns } = useOptimizeStore();
  const { programs, loadPrograms } = useProgramStore();

  // Load data on mount
  useEffect(() => {
    loadPrograms();
    fetchCampaigns();
  }, [loadPrograms, fetchCampaigns]);

  // Opportunity handlers
  const handleDismiss = (id: string) => {
    setOpportunities(prev => prev.filter(opp => opp.id !== id));
  };

  const handleReview = (id: string) => {
    console.log('[CombinedCampaignsPage] Review opportunity:', id);
    // TODO: Navigate to detailed review page or show modal
  };

  // Program click handler - navigate to chat with programId
  const handleProgramClick = (programId: string) => {
    navigate('/campaign-chat', { state: { programId } });
  };

  // Campaign click handler - show detail panel/modal
  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  return (
    <>
      <SplitPaneLayout
        collapsed={isChatCollapsed}
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
      >
        {/* Left Panel - Chat */}
        <CampaignChatPanel />

        {/* Right Panel - Campaign Management + AI Sidebar */}
        <div className={`flex flex-col h-full bg-white rounded-2xl overflow-hidden ${isChatCollapsed ? 'pl-12' : ''}`}>
          {/* Header */}
          <div className="flex-shrink-0 px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
            <p className="text-sm text-gray-600 mb-4">
              Monitor performance, optimize campaigns, and analyze AI-driven recommendations
            </p>

            {/* KPI Cards */}
            <CampaignKPICards campaigns={campaigns} programs={programs} />
          </div>

          {/* Content Row: Main Content + AI Sidebar */}
          <div className="flex flex-1 overflow-hidden">
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
                <ProgramsView programs={programs} onProgramClick={handleProgramClick} />
              ) : (
                <CampaignsView
                  campaigns={campaigns}
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
      </SplitPaneLayout>

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
}

function ProgramsView({ programs, onProgramClick }: ProgramsViewProps) {
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
          />
        );
      })}
    </div>
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

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No live campaigns found</p>
          <p className="text-gray-400 text-xs mt-2">Launch a program to see campaigns here</p>
        </div>
      </div>
    );
  }

  // Map campaigns once
  const mappedCampaigns = campaigns.map(mapLiveCampaignToCampaign);

  // Tree view - hierarchical structure
  if (view === 'tree') {
    return (
      <CampaignTreeView
        campaigns={campaigns}
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
        campaigns={campaigns}
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
        campaigns={campaigns}
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
