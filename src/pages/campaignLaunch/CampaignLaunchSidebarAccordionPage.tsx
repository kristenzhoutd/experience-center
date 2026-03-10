/**
 * Variation 6: Sidebar Accordion — single-column nested accordion.
 * Clicking a campaign expands an accordion beneath it showing 4 sub-sections
 * (Campaign, Ad Sets, Creatives, Ads). Clicking a sub-section expands it
 * inline to reveal that section's form. Multiple campaigns can be expanded
 * simultaneously.
 */

import { useState, useEffect } from 'react';
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react';
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

    // If the program has no configs for this channel but the store has an
    // initialized config (e.g. freshly generated from blueprint, not yet linked),
    // include it so the UI doesn't show an empty state.
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

  // Non-program mode: synthesize a single entry from the store config
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
    activeChannel,
    isAutoGeneratingImages,
  } = state;

  // Local UI state
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  // Track which sub-section is expanded per campaign: campaignId -> sectionId
  const [expandedSections, setExpandedSections] = useState<Record<string, LaunchSectionId | null>>({});

  // Auto-expand first campaign on init
  useEffect(() => {
    if (!isInitialized || campaigns.length === 0) return;
    if (expandedCampaigns.size > 0) return; // already expanded something

    const firstId = campaigns[0].id;
    setExpandedCampaigns(new Set([firstId]));
    setExpandedSections({ [firstId]: 'campaign' });

    // Load first campaign if not already active
    if (firstId !== activeCampaignConfigId && firstId !== '__current__') {
      handleCampaignConfigSelect(firstId);
    }
  }, [isInitialized, campaigns.length]);

  const toggleCampaignAccordion = (campaignId: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
        // When expanding, select the campaign and default to "Campaign" section
        if (campaignId !== activeCampaignConfigId && campaignId !== '__current__') {
          handleCampaignConfigSelect(campaignId);
        }
        setExpandedSections((prev) => ({ ...prev, [campaignId]: prev[campaignId] ?? 'campaign' }));
      }
      return next;
    });
  };

  const toggleSubSection = (campaignId: string, sectionId: LaunchSectionId) => {
    // If clicking a section in a different campaign, load that campaign first
    if (campaignId !== activeCampaignConfigId && campaignId !== '__current__') {
      handleCampaignConfigSelect(campaignId);
    }
    setExpandedSections((prev) => ({
      ...prev,
      [campaignId]: prev[campaignId] === sectionId ? null : sectionId,
    }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PaidMediaStepper overrideStep={3} />

      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E8ECF3] flex-shrink-0 bg-white">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 m-0">
            {showSkeleton ? 'Generating Campaign Configuration...' : isEditMode ? 'Edit Campaign' : 'Review Campaign'}
          </h1>
          <p className="text-sm text-[#464B55] m-0 mt-0.5">
            {showSkeleton ? 'AI is building your Meta ad hierarchy' : config.campaign.name}
          </p>
        </div>
      </div>

      <SplitPaneLayout
        collapsed={isChatCollapsed}
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
      >
        <LaunchChatPanel state={state} />

        <div className="flex-1 overflow-y-auto bg-[#F5F7FA]" data-launch-scroll>
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
            <div className="px-8 pt-3 pb-6">
              <LaunchToolbar state={state} />

              {activeTab !== 'meta' ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
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
                <div className="flex gap-6">
                  {/* Left sidebar — campaign navigation */}
                  {activeProgram && (
                    <div className="w-52 flex-shrink-0">
                      <div className="sticky top-6">
                        <div className="bg-white rounded-xl shadow-sm p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Campaigns</div>
                            <button
                              onClick={handleCampaignConfigAdd}
                              className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors cursor-pointer"
                              title="Add campaign"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-col gap-1">
                            {campaigns.length === 0 && (
                              <div className="px-2 py-4 text-xs text-gray-400 text-center">
                                No campaigns yet.<br />Click + to create one.
                              </div>
                            )}
                            {campaigns.map((c) => {
                              const isActive = c.id === activeCampaignConfigId || c.id === '__current__';
                              const isLaunched = !!c.platformCampaignId;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    if (c.id !== activeCampaignConfigId && c.id !== '__current__') {
                                      handleCampaignConfigSelect(c.id);
                                    }
                                    // Also expand in accordion
                                    setExpandedCampaigns((prev) => new Set(prev).add(c.id));
                                    setExpandedSections((prev) => ({ ...prev, [c.id]: prev[c.id] ?? 'campaign' }));
                                  }}
                                  className={`group flex items-start justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                    isActive
                                      ? 'bg-[#EFF6FF] border border-[#DBEAFE]'
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className={`text-xs font-medium truncate m-0 ${isActive ? 'text-[#1957DB]' : 'text-gray-700'}`}>
                                        {c.name || c.config.campaign.name || 'Untitled'}
                                      </p>
                                      {isLaunched && (
                                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8px] font-semibold bg-green-100 text-green-700">
                                          <span className="w-1 h-1 rounded-full bg-green-500" />
                                          Live
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-gray-400">
                                        {c.config.adSets.length} ad set{c.config.adSets.length !== 1 ? 's' : ''}
                                      </span>
                                      {c.config.campaign.dailyBudget > 0 && (
                                        <span className="text-[10px] text-gray-400">
                                          ${(c.config.campaign.dailyBudget / 100).toFixed(0)}/day
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCampaignConfigDelete(c.id);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer mt-0.5"
                                    title="Remove campaign"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main content — campaign accordions */}
                  <div className="flex-1 flex flex-col gap-3 max-w-4xl">
                  {campaigns.map((campaign) => {
                    const isExpanded = expandedCampaigns.has(campaign.id);
                    const isActiveCampaign = campaign.id === activeCampaignConfigId || campaign.id === '__current__';
                    const adSetCount = campaign.config.adSets.length;
                    const dailyBudget = campaign.config.campaign.dailyBudget;
                    const openSection = expandedSections[campaign.id] ?? null;

                    return (
                      <div key={campaign.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {/* Campaign header row */}
                        <button
                          onClick={() => toggleCampaignAccordion(campaign.id)}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 border-none cursor-pointer transition-colors ${
                            isActiveCampaign && isExpanded
                              ? 'bg-[#EFF6FF]'
                              : 'bg-transparent hover:bg-gray-50/50'
                          }`}
                        >
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          } ${isActiveCampaign && isExpanded ? 'text-[#1957DB]' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold truncate ${
                                isActiveCampaign && isExpanded ? 'text-[#1957DB]' : 'text-gray-900'
                              }`}>
                                {campaign.name || campaign.config.campaign.name || 'Untitled'}
                              </span>
                              {campaign.platformCampaignId && (
                                <>
                                  <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-green-700">
                                    <span className="w-1 h-1 rounded-full bg-green-500" />
                                    Live
                                  </span>
                                  <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#00B140]/10 text-[#00B140]" title="Audience synced via LiveRamp">
                                    LR
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {adSetCount} ad set{adSetCount !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-400">
                                {campaign.config.creatives.length} creative{campaign.config.creatives.length !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-400">
                                {campaign.config.ads.length} ad{campaign.config.ads.length !== 1 ? 's' : ''}
                              </span>
                              {dailyBudget > 0 && (
                                <span className="text-xs text-gray-400">
                                  ${(dailyBudget / 100).toFixed(0)}/day
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Section completion summary */}
                          {!isExpanded && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {LAUNCH_SECTIONS.map((s) => {
                                const complete = isActiveCampaign
                                  ? isSectionComplete(s.id)
                                  : isSavedConfigSectionComplete(campaign, s.id);
                                return (
                                  <div key={s.id} className={`w-2 h-2 rounded-full ${complete ? 'bg-green-500' : 'bg-gray-300'}`} title={`${s.label}: ${complete ? 'Complete' : 'Pending'}`} />
                                );
                              })}
                            </div>
                          )}
                        </button>

                        {/* Expanded: sub-section accordion */}
                        {isExpanded && (
                          <div className="border-t border-[#E8ECF3]">
                            {LAUNCH_SECTIONS.map((section, idx) => {
                              const isSectionOpen = openSection === section.id;
                              const isComplete = isActiveCampaign
                                ? isSectionComplete(section.id)
                                : isSavedConfigSectionComplete(campaign, section.id);
                              const count = section.id === 'campaign' ? null
                                : section.id === 'adSets' ? campaign.config.adSets.length
                                : section.id === 'creatives' ? campaign.config.creatives.length
                                : campaign.config.ads.length;

                              // Build summary text for collapsed state
                              // Use live store config for the active campaign, saved data for others
                              const summary = (() => {
                                const cfg = isActiveCampaign ? config : campaign.config;
                                switch (section.id) {
                                  case 'campaign': {
                                    const parts: string[] = [];
                                    if (cfg.campaign.name) parts.push(cfg.campaign.name);
                                    if (cfg.campaign.objective) {
                                      const obj = cfg.campaign.objective.replace('OUTCOME_', '');
                                      parts.push(obj.charAt(0) + obj.slice(1).toLowerCase());
                                    }
                                    if (cfg.campaign.dailyBudget > 0) parts.push(`$${(cfg.campaign.dailyBudget / 100).toLocaleString()}/day`);
                                    return parts.join(' \u00B7 ');
                                  }
                                  case 'adSets': {
                                    if (cfg.adSets.length === 0) return 'No ad sets configured';
                                    const names = cfg.adSets.map((a) => a.name || a.audienceLabel).filter(Boolean);
                                    return names.length > 0 ? names.join(', ') : `${cfg.adSets.length} ad set${cfg.adSets.length !== 1 ? 's' : ''} configured`;
                                  }
                                  case 'creatives': {
                                    if (cfg.creatives.length === 0) return 'No creatives yet';
                                    const withImages = cfg.creatives.filter((c) => c.file).length;
                                    return `${cfg.creatives.length} creative${cfg.creatives.length !== 1 ? 's' : ''} \u00B7 ${withImages} with images`;
                                  }
                                  case 'ads': {
                                    if (cfg.ads.length === 0) return 'No ads configured';
                                    const linked = cfg.ads.filter((a) => a.adSetLocalId && a.creativeLocalId).length;
                                    return `${cfg.ads.length} ad${cfg.ads.length !== 1 ? 's' : ''} \u00B7 ${linked} fully linked`;
                                  }
                                  default:
                                    return '';
                                }
                              })();

                              return (
                                <div key={section.id}>
                                  {/* Sub-section header */}
                                  <button
                                    onClick={() => toggleSubSection(campaign.id, section.id)}
                                    className={`w-full flex items-center gap-3 px-5 py-3 border-none cursor-pointer transition-colors ${
                                      isSectionOpen
                                        ? 'bg-[#EFF6FF]'
                                        : 'bg-transparent hover:bg-gray-50/50'
                                    }`}
                                    style={idx > 0 ? { borderTop: '1px solid #E8ECF3' } : undefined}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
                                      isComplete ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                                    <div className="flex-1 min-w-0 text-left">
                                      <span className={`text-xs font-medium ${
                                        isSectionOpen ? 'text-[#1957DB]' : 'text-gray-700'
                                      }`}>
                                        {section.label}
                                      </span>
                                      {!isSectionOpen && summary && (
                                        <div className="text-[11px] text-gray-400 truncate mt-0.5">{summary}</div>
                                      )}
                                    </div>
                                    {count !== null && (
                                      <span className="text-[10px] text-gray-400 mr-1">
                                        {count} {count === 1 ? 'item' : 'items'}
                                      </span>
                                    )}
                                    {isActiveCampaign && section.id === 'creatives' && isAutoGeneratingImages && (
                                      <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse mr-1">
                                        generating
                                      </span>
                                    )}
                                    {isComplete && !(section.id === 'creatives' && isAutoGeneratingImages && isActiveCampaign) && (
                                      <Check className="w-3 h-3 text-green-500 flex-shrink-0 mr-1" />
                                    )}
                                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                                      isSectionOpen ? 'rotate-90' : ''
                                    }`} />
                                  </button>

                                  {/* Sub-section form content (inline) */}
                                  {isSectionOpen && isActiveCampaign && (
                                    <div className="border-t border-[#E8ECF3] p-2">
                                      {section.id === 'campaign' && <CampaignSettingsSection state={state} />}
                                      {section.id === 'adSets' && <AdSetsSection state={state} />}
                                      {section.id === 'creatives' && <CreativesSection state={state} />}
                                      {section.id === 'ads' && <AdsSection state={state} />}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Progress bar */}
                            <div className="px-5 py-3 border-t border-[#E8ECF3]">
                              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                                <span>Progress</span>
                                <span>
                                  {LAUNCH_SECTIONS.filter((s) =>
                                    isActiveCampaign
                                      ? isSectionComplete(s.id)
                                      : isSavedConfigSectionComplete(campaign, s.id)
                                  ).length}/{LAUNCH_SECTIONS.length}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#1957DB] rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(LAUNCH_SECTIONS.filter((s) =>
                                      isActiveCampaign
                                        ? isSectionComplete(s.id)
                                        : isSavedConfigSectionComplete(campaign, s.id)
                                    ).length / LAUNCH_SECTIONS.length) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="h-8" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SplitPaneLayout>

      <LaunchModals state={state} />
    </div>
  );
}
