/**
 * Variation 2: Wizard Stepper — progress bar with one section at a time,
 * "Step X of 4" label, Back/Next buttons, per-step validation.
 */

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function CampaignLaunchWizardPage() {
  const state = useCampaignLaunchPageState();
  const [stepIndex, setStepIndex] = useState(0);

  const {
    showSkeleton,
    isInitialized,
    isEditMode,
    config,
    isChatCollapsed,
    setIsChatCollapsed,
    activeTab,
    handleBack,
    handleLaunch,
    isSectionComplete,
  } = state;

  const currentSection = LAUNCH_SECTIONS[stepIndex];
  const isLastStep = stepIndex === LAUNCH_SECTIONS.length - 1;
  const isFirstStep = stepIndex === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleLaunch();
    } else {
      setStepIndex((i) => Math.min(i + 1, LAUNCH_SECTIONS.length - 1));
    }
  };

  const handlePrev = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PaidMediaStepper overrideStep={3} />

      {/* Header */}
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

        <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FA]" data-launch-scroll>
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
            <>
              <div className="px-8 pt-3">
                <LaunchToolbar state={state} />

                {activeTab === 'meta' && (
                  <>
                    {/* Wizard progress bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Step {stepIndex + 1} of {LAUNCH_SECTIONS.length}
                        </span>
                        <span className="text-xs text-gray-400">
                          {currentSection.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {LAUNCH_SECTIONS.map((section, i) => {
                          const isComplete = isSectionComplete(section.id);
                          const isCurrent = i === stepIndex;
                          const isPast = i < stepIndex;
                          return (
                            <div key={section.id} className="flex items-center flex-1 gap-2">
                              <button
                                onClick={() => setStepIndex(i)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all border-none cursor-pointer ${
                                  isCurrent
                                    ? 'bg-[#1957DB] text-white shadow-md'
                                    : isComplete
                                      ? 'bg-green-100 text-green-600'
                                      : isPast
                                        ? 'bg-[#EFF6FF] text-[#1957DB]'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                              </button>
                              {i < LAUNCH_SECTIONS.length - 1 && (
                                <div className={`flex-1 h-0.5 rounded-full ${
                                  i < stepIndex ? 'bg-[#1957DB]' : 'bg-gray-200'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Scrollable form area */}
              <div className="flex-1 overflow-y-auto px-8 pb-6">
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
                  <LaunchFormContent state={state} visibleSections={[currentSection.id]} />
                )}
              </div>

              {/* Wizard bottom bar */}
              {activeTab === 'meta' && (
                <div className="px-8 py-4 border-t border-[#E8ECF3] bg-white flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={isFirstStep ? handleBack : handlePrev}
                    className="px-4 py-2 bg-white border border-[#E8ECF3] rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {isFirstStep ? 'Back' : 'Previous'}
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 bg-[#1957DB] border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-[#1449B8] transition-colors flex items-center gap-1.5"
                  >
                    {isLastStep ? (
                      <>
                        <img src="/assets/meta-ads.png" alt="" className="w-4 h-4" />
                        {isEditMode ? 'Update Campaign' : 'Review & Launch'}
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </SplitPaneLayout>

      <LaunchModals state={state} />
    </div>
  );
}
