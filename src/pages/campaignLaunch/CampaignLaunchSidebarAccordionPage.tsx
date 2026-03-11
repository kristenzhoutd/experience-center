/**
 * Configure & Launch — Hierarchical left-nav + focused right-panel layout.
 * Left sidebar shows campaigns with nested section links (Campaign, Ad Sets,
 * Creatives, Ads). Right panel displays the selected section's form.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';
import { useCampaignLaunchPageState } from '../../hooks/useCampaignLaunchPageState';
import { launchConfigStorage } from '../../services/launchConfigStorage';
import PaidMediaStepper from '../../components/campaign/PaidMediaStepper';
import SplitPaneLayout from '../../components/campaign/SplitPaneLayout';
import LaunchChatPanel from '../../components/campaign/launch/LaunchChatPanel';
import LaunchToolbar from '../../components/campaign/launch/LaunchToolbar';
import LaunchModals from '../../components/campaign/launch/LaunchModals';
import CampaignSettingsSection from '../../components/campaign/launch/sections/CampaignSettingsSection';
import AdSetsSection from '../../components/campaign/launch/sections/AdSetsSection';
import CreativesSection from '../../components/campaign/launch/sections/CreativesSection';
import AdsSection from '../../components/campaign/launch/sections/AdsSection';
import { LAUNCH_SECTIONS, LAUNCH_SKELETON_SECTIONS } from './constants';
import type { LaunchSectionId } from './constants';
import type { SavedLaunchConfig } from '../../types/campaignLaunch';

function LaunchSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto flex justify-center">
      <div className="w-full max-w-[676px] bg-white rounded-xl px-6 pt-6 pb-8 flex flex-col gap-4 mt-4 mx-4 mb-4 min-h-min">
        {LAUNCH_SKELETON_SECTIONS.map(({ key, title, subtitle, fields }) => (
          <div key={key} className="rounded-xl border border-[#E8ECF3] p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">{title}</span>
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">generating</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className={`h-3 bg-gray-100 rounded ${i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : i === 2 ? 'w-2/3' : 'w-3/5'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Resolve campaign configs from program channel or single store config. */
function useCampaignConfigs(state: ReturnType<typeof useCampaignLaunchPageState>) {
  const { activeProgram, activeChannel, config, savedConfigId, isInitialized } = state;

  if (activeProgram) {
    const ch = activeProgram.channels.find((c) => c.platform === activeChannel);
    const ids = ch?.launchConfigIds ?? [];
    const configs = ids
      .map((id) => launchConfigStorage.getConfig(id))
      .filter(Boolean) as SavedLaunchConfig[];

    if (configs.length === 0 && isInitialized && config) {
      return [{
        id: savedConfigId || '__current__',
        name: config.campaign.name || 'Current Campaign',
        config,
        createdAt: '',
        updatedAt: '',
        isEditMode: false,
      }] as SavedLaunchConfig[];
    }

    return configs;
  }

  if (!config) return [];
  return [{
    id: savedConfigId || '__current__',
    name: config.campaign.name || 'Current Campaign',
    config,
    createdAt: '',
    updatedAt: '',
    isEditMode: false,
  }] as SavedLaunchConfig[];
}

/** Check completion for a section using data from a SavedLaunchConfig. */
function isSavedConfigSectionComplete(saved: SavedLaunchConfig, sectionId: LaunchSectionId): boolean {
  const c = saved.config;
  switch (sectionId) {
    case 'campaign':
      return !!c.campaign.name.trim() && !!c.campaign.objective;
    case 'adSets':
      return c.adSets.length > 0 && c.adSets.every(
        (as) => !!as.name.trim() && as.dailyBudget >= 100 && (as.targeting.geoLocations?.countries?.length ?? 0) > 0
      );
    case 'creatives':
      return c.creatives.length > 0 && c.creatives.every(
        (cr) => !!cr.file && !!cr.headline.trim() && !!cr.pageId
      );
    case 'ads':
      return c.ads.length > 0 && c.ads.every(
        (a) => !!a.adSetLocalId && !!a.creativeLocalId
      );
    default:
      return false;
  }
}

interface NavSelection {
  campaignId: string;
  sectionId: LaunchSectionId;
}

/** Resizable left-nav + right-content panels with draggable divider. */
function NavAndContentPanels({
  campaigns, selection, expandedNavCampaigns, activeCampaignConfigId,
  activeProgram, isAutoGeneratingImages, isSectionComplete,
  handleNavCampaignClick, handleNavSectionClick,
  handleCampaignConfigAdd, handleCampaignConfigDelete,
  renderSelectedSection,
}: {
  campaigns: SavedLaunchConfig[];
  selection: NavSelection | null;
  expandedNavCampaigns: Set<string>;
  activeCampaignConfigId: string;
  activeProgram: any;
  isAutoGeneratingImages: boolean;
  isSectionComplete: (id: LaunchSectionId) => boolean;
  handleNavCampaignClick: (id: string) => void;
  handleNavSectionClick: (campaignId: string, sectionId: LaunchSectionId) => void;
  handleCampaignConfigAdd: () => void;
  handleCampaignConfigDelete: (id: string) => void;
  renderSelectedSection: () => React.ReactNode;
}) {
  const [navWidth, setNavWidth] = useState(280);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ev.clientX - containerRect.left;
      setNavWidth(Math.max(200, Math.min(newWidth, 400)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* Left nav — single card containing all campaigns */}
      <div className="flex-shrink-0 overflow-y-auto p-5" style={{ width: navWidth }}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Campaigns</span>
            {activeProgram && (
              <button
                onClick={handleCampaignConfigAdd}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#1957DB] bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors border-none cursor-pointer"
                title="Add campaign"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            )}
          </div>

          {/* Campaign list */}
          <div className="divide-y divide-gray-50">
            {campaigns.length === 0 && (
              <div className="px-3 py-6 text-xs text-gray-400 text-center">
                No campaigns yet.<br />Click + Add to create one.
              </div>
            )}

            {campaigns.map((campaign) => {
              const isActiveCampaign = campaign.id === activeCampaignConfigId || campaign.id === '__current__';
              const isNavExpanded = expandedNavCampaigns.has(campaign.id);
              const isLaunched = !!campaign.platformCampaignId;
              const isSelectedCampaign = selection?.campaignId === campaign.id;

              return (
                <div key={campaign.id}>
                  {/* Campaign row */}
                  <div className="group flex items-center">
                    <button
                      onClick={() => handleNavCampaignClick(campaign.id)}
                      className={`flex-1 flex items-center gap-2 px-3 py-2.5 text-left border-none cursor-pointer transition-colors ${
                        isSelectedCampaign ? 'bg-[#F8FAFF]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                        isNavExpanded ? 'rotate-90' : ''
                      } ${isActiveCampaign ? 'text-[#1957DB]' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold truncate ${
                            isSelectedCampaign ? 'text-[#1957DB]' : 'text-gray-800'
                          }`}>
                            {campaign.name || campaign.config.campaign.name || 'Untitled'}
                          </span>
                          {isLaunched && (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[7px] font-semibold bg-green-100 text-green-700">
                              <span className="w-1 h-1 rounded-full bg-green-500" />
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {campaign.config.adSets.length} ad set{campaign.config.adSets.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {campaign.config.creatives.length} creative{campaign.config.creatives.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </button>
                    {activeProgram && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCampaignConfigDelete(campaign.id);
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer mr-2"
                        title="Remove campaign"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Nested section links */}
                  {isNavExpanded && (
                    <div className="bg-[#FAFBFC] px-2 py-1.5">
                      <div className="ml-4 pl-2.5 border-l border-gray-200 flex flex-col gap-0.5">
                        {LAUNCH_SECTIONS.map((section) => {
                          const isSelected = selection?.campaignId === campaign.id && selection?.sectionId === section.id;
                          const isComplete = isActiveCampaign
                            ? isSectionComplete(section.id)
                            : isSavedConfigSectionComplete(campaign, section.id);
                          const isGenerating = isActiveCampaign && section.id === 'creatives' && isAutoGeneratingImages;

                          return (
                            <button
                              key={section.id}
                              onClick={() => handleNavSectionClick(campaign.id, section.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left border-none cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#EFF6FF] text-[#1957DB]'
                                  : 'bg-transparent text-gray-500 hover:bg-white hover:text-gray-700'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                isComplete ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className={`text-[11px] font-medium ${isSelected ? 'text-[#1957DB]' : ''}`}>
                                {section.label}
                              </span>
                              {isGenerating && (
                                <span className="px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse ml-auto">
                                  gen
                                </span>
                              )}
                              {isComplete && !isGenerating && (
                                <Check className="w-3 h-3 text-green-500 flex-shrink-0 ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Draggable divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-2 flex-shrink-0 flex items-center justify-center cursor-col-resize hover:bg-[#EFF6FF] transition-colors group"
      >
        <GripVertical className="w-3 h-3 text-gray-300 group-hover:text-[#1957DB] transition-colors" />
      </div>

      {/* Right panel — selected section form */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {selection ? (
          <div className="p-5">
            {renderSelectedSection()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center px-8">
            <p className="text-sm text-gray-400">Select a campaign section from the left to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignLaunchSidebarAccordionPage() {
  const state = useCampaignLaunchPageState();
  const campaigns = useCampaignConfigs(state);

  const {
    showSkeleton,
    isInitialized,
    isEditMode,
    config,
    isChatCollapsed,
    setIsChatCollapsed,
    activeTab,
    handleBack,
    isSectionComplete,
    activeCampaignConfigId,
    handleCampaignConfigSelect,
    handleCampaignConfigAdd,
    handleCampaignConfigDelete,
    activeProgram,
    isAutoGeneratingImages,
  } = state;

  // Which campaign + section is selected in the nav
  const [selection, setSelection] = useState<NavSelection | null>(null);
  // Which campaigns have their nav sections expanded
  const [expandedNavCampaigns, setExpandedNavCampaigns] = useState<Set<string>>(new Set());

  // Auto-select first campaign on init
  useEffect(() => {
    if (!isInitialized || campaigns.length === 0 || selection) return;

    const firstId = campaigns[0].id;
    setExpandedNavCampaigns(new Set([firstId]));
    setSelection({ campaignId: firstId, sectionId: 'campaign' });

    if (firstId !== activeCampaignConfigId && firstId !== '__current__') {
      handleCampaignConfigSelect(firstId);
    }
  }, [isInitialized, campaigns.length]);

  const handleNavCampaignClick = (campaignId: string) => {
    setExpandedNavCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });

    // Select the campaign's "Campaign" section and load the config
    if (campaignId !== activeCampaignConfigId && campaignId !== '__current__') {
      handleCampaignConfigSelect(campaignId);
    }
    setSelection({ campaignId, sectionId: 'campaign' });
  };

  const handleNavSectionClick = (campaignId: string, sectionId: LaunchSectionId) => {
    if (campaignId !== activeCampaignConfigId && campaignId !== '__current__') {
      handleCampaignConfigSelect(campaignId);
    }
    setSelection({ campaignId, sectionId });
  };

  // Render the selected section's form
  const renderSelectedSection = () => {
    if (!selection) return null;
    const isActiveCampaign = selection.campaignId === activeCampaignConfigId || selection.campaignId === '__current__';
    if (!isActiveCampaign) return null;

    switch (selection.sectionId) {
      case 'campaign':
        return <CampaignSettingsSection state={state} />;
      case 'adSets':
        return <AdSetsSection state={state} />;
      case 'creatives':
        return <CreativesSection state={state} />;
      case 'ads':
        return <AdsSection state={state} />;
      default:
        return null;
    }
  };

  // Get label for the currently selected section
  const selectedSectionLabel = selection
    ? LAUNCH_SECTIONS.find((s) => s.id === selection.sectionId)?.label ?? ''
    : '';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex bg-white border border-gray-200 rounded-2xl overflow-hidden h-full relative">
      <SplitPaneLayout
        collapsed={isChatCollapsed}
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
      >
        <LaunchChatPanel state={state} />

        <div className="flex flex-col h-full overflow-hidden px-4 pb-4 pt-2">
          <PaidMediaStepper overrideStep={3} />
            <div className="py-3 flex flex-col min-h-[40px]">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                {showSkeleton ? 'Generating...' : isEditMode ? 'Edit Campaign' : 'Review Campaign'}
              </span>
              <span className="text-base font-semibold text-[#212327]">
                {showSkeleton ? 'Campaign Configuration' : config.campaign.name}
              </span>
            </div>
            {isInitialized && !showSkeleton && (
              <div className="pb-3">
                <LaunchToolbar state={state} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F5F7FA] rounded-xl" data-launch-scroll>
          {showSkeleton ? (
            <div className="flex flex-col h-full bg-[#F7F8FB] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E8ECF3] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">Campaign Configuration</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">generating</span>
                </div>
                <button onClick={handleBack} className="px-3 py-1.5 bg-white border border-[#E8ECF3] rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back
                </button>
              </div>
              <LaunchSkeleton />
              <div className="px-5 py-3 border-t border-[#E8ECF3] text-center flex-shrink-0">
                <p className="text-xs text-gray-400 animate-pulse m-0">AI is generating your ad configuration...</p>
              </div>
            </div>
          ) : !isInitialized ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-white">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F7FA] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Configuration Yet</h3>
              <p className="text-sm text-[#464B55] max-w-sm">Use the chat to generate an ad configuration, or go back to approve a blueprint first.</p>
            </div>
          ) : (
            <div className="flex h-full w-full">
              {activeTab !== 'meta' ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5F7FA] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Coming Soon</h3>
                  <p className="text-sm text-[#464B55] max-w-sm">
                    {{ google: 'Google Ads', tiktok: 'TikTok Ads', snapchat: 'Snapchat Ads', pinterest: 'Pinterest Ads' }[activeTab]} campaign launch will be available in a future update.
                  </p>
                </div>
              ) : (
                <NavAndContentPanels
                  campaigns={campaigns}
                  selection={selection}
                  expandedNavCampaigns={expandedNavCampaigns}
                  activeCampaignConfigId={activeCampaignConfigId}
                  activeProgram={activeProgram}
                  isAutoGeneratingImages={isAutoGeneratingImages}
                  isSectionComplete={isSectionComplete}
                  handleNavCampaignClick={handleNavCampaignClick}
                  handleNavSectionClick={handleNavSectionClick}
                  handleCampaignConfigAdd={handleCampaignConfigAdd}
                  handleCampaignConfigDelete={handleCampaignConfigDelete}
                  renderSelectedSection={renderSelectedSection}
                />
              )}
            </div>
          )}
          </div>
        </div>
      </SplitPaneLayout>
      </div>

      <LaunchModals state={state} />
    </div>
  );
}
