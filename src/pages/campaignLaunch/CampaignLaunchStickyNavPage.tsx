/**
 * Variation 4: Sticky Section Nav — all sections visible in scroll (like original)
 * with a fixed left sidebar showing section links + progress dots.
 * IntersectionObserver highlights active section on scroll.
 */

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
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

export default function CampaignLaunchStickyNavPage() {
  const state = useCampaignLaunchPageState();
  const [activeSectionId, setActiveSectionId] = useState<LaunchSectionId>('campaign');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // IntersectionObserver to highlight active section
  useEffect(() => {
    if (!isInitialized || activeTab !== 'meta') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let maxRatio = 0;
        let maxId: LaunchSectionId | null = null;
        for (const entry of entries) {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const id = entry.target.id.replace('section-', '') as LaunchSectionId;
            if (LAUNCH_SECTIONS.some((s) => s.id === id)) {
              maxId = id;
            }
          }
        }
        if (maxId) setActiveSectionId(maxId);
      },
      {
        root: container,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe section elements
    for (const section of LAUNCH_SECTIONS) {
      const el = container.querySelector(`#section-${section.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [isInitialized, activeTab]);

  const scrollToSection = (id: LaunchSectionId) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`#section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sectionCounts: Record<LaunchSectionId, number> = {
    campaign: 1,
    adSets: config.adSets.length,
    creatives: config.creatives.length,
    ads: config.ads.length,
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

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-[#F5F7FA]" data-launch-scroll>
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
                  {/* Sticky section nav sidebar */}
                  <div className="w-48 flex-shrink-0">
                    <div className="sticky top-6">
                      <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</div>
                        <div className="flex flex-col gap-1">
                          {LAUNCH_SECTIONS.map((section, idx) => {
                            const isActive = activeSectionId === section.id;
                            const isComplete = isSectionComplete(section.id);
                            const count = sectionCounts[section.id];

                            return (
                              <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all border-none cursor-pointer ${
                                  isActive
                                    ? 'bg-[#EFF6FF] text-[#1957DB]'
                                    : 'text-gray-600 hover:bg-gray-50 bg-transparent'
                                }`}
                              >
                                {/* Progress dot */}
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isComplete
                                    ? 'bg-green-500'
                                    : isActive
                                      ? 'bg-[#1957DB]'
                                      : 'bg-gray-300'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-medium truncate ${isActive ? 'text-[#1957DB]' : 'text-gray-700'}`}>
                                    {section.label}
                                  </div>
                                  {section.id !== 'campaign' && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {count} {count === 1 ? 'item' : 'items'}
                                    </div>
                                  )}
                                </div>
                                {isComplete && (
                                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Overall progress */}
                        <div className="mt-4 pt-3 border-t border-[#E8ECF3]">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                            <span>Progress</span>
                            <span>{LAUNCH_SECTIONS.filter((s) => isSectionComplete(s.id)).length}/{LAUNCH_SECTIONS.length}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1957DB] rounded-full transition-all duration-300"
                              style={{ width: `${(LAUNCH_SECTIONS.filter((s) => isSectionComplete(s.id)).length / LAUNCH_SECTIONS.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main form content — all sections visible */}
                  <div className="flex-1">
                    <LaunchFormContent state={state} />
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
