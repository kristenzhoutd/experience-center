/**
 * Variation 3: Accordion — 4 collapsible panels, one expanded at a time.
 * Collapsed panels show title, item count, and completion badge.
 */

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useCampaignLaunchPageState } from '../../hooks/useCampaignLaunchPageState';
import PaidMediaStepper from '../../components/campaign/PaidMediaStepper';
import SplitPaneLayout from '../../components/campaign/SplitPaneLayout';
import LaunchChatPanel from '../../components/campaign/launch/LaunchChatPanel';
import LaunchToolbar from '../../components/campaign/launch/LaunchToolbar';
import LaunchFormContent from '../../components/campaign/launch/LaunchFormContent';
import LaunchModals from '../../components/campaign/launch/LaunchModals';
import VariationSwitcher from '../../components/campaign/launch/VariationSwitcher';
import { LAUNCH_SECTIONS, LAUNCH_SKELETON_SECTIONS } from './constants';
import type { LaunchSectionId } from './constants';

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

export default function CampaignLaunchAccordionPage() {
  const state = useCampaignLaunchPageState();
  const [expandedSection, setExpandedSection] = useState<LaunchSectionId>('campaign');

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
  } = state;

  const sectionCounts: Record<LaunchSectionId, number> = {
    campaign: 1,
    adSets: config.adSets.length,
    creatives: config.creatives.length,
    ads: config.ads.length,
  };

  const toggleSection = (id: LaunchSectionId) => {
    setExpandedSection(expandedSection === id ? id : id); // always expand clicked
  };

  const advanceToNext = () => {
    const idx = LAUNCH_SECTIONS.findIndex((s) => s.id === expandedSection);
    if (idx < LAUNCH_SECTIONS.length - 1) {
      setExpandedSection(LAUNCH_SECTIONS[idx + 1].id);
    }
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
            {showSkeleton ? 'AI is building your Campaign hierarchy' : config.campaign.name}
          </p>
        </div>
        <VariationSwitcher />
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
                <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                  {LAUNCH_SECTIONS.map((section, idx) => {
                    const isExpanded = expandedSection === section.id;
                    const isComplete = isSectionComplete(section.id);
                    const count = sectionCounts[section.id];
                    const isLast = idx === LAUNCH_SECTIONS.length - 1;

                    return (
                      <div
                        key={section.id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200"
                      >
                        {/* Accordion header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-6 py-4 bg-transparent border-none cursor-pointer hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isComplete
                                ? 'bg-green-100 text-green-600'
                                : isExpanded
                                  ? 'bg-[#1957DB] text-white'
                                  : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isComplete ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <div className="text-left">
                              <span className="text-sm font-semibold text-gray-900">{section.label}</span>
                              {!isExpanded && section.id !== 'campaign' && (
                                <span className="ml-2 text-xs text-gray-400">
                                  {count} {count === 1 ? 'item' : 'items'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isExpanded && (
                              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                isComplete
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {isComplete ? 'Complete' : 'Pending'}
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Accordion body */}
                        {isExpanded && (
                          <div className="border-t border-[#E8ECF3]">
                            <div className="p-2">
                              <LaunchFormContent state={state} visibleSections={[section.id]} />
                            </div>
                            {!isLast && (
                              <div className="px-6 py-3 border-t border-[#E8ECF3] flex justify-end">
                                <button
                                  onClick={advanceToNext}
                                  className="px-4 py-2 text-sm font-medium text-[#1957DB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors border-none cursor-pointer"
                                >
                                  Continue to {LAUNCH_SECTIONS[idx + 1].label}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="h-8" />
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
