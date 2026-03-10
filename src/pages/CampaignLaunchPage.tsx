/**
 * CampaignLaunchPage — full-page review of the campaign hierarchy
 * (campaign → ad sets → creatives → ads) before pushing to Meta.
 *
 * Features AI-generated config via chat (split-pane layout) with auto-collapse
 * once the config is generated. Chat stays available for refinement.
 *
 * Google, TikTok, Snapchat, and Pinterest tabs show "Coming Soon" placeholders.
 */

import { Undo2, Redo2 } from 'lucide-react';
import { useCampaignLaunchPageState } from '../hooks/useCampaignLaunchPageState';
import PaidMediaStepper from '../components/campaign/PaidMediaStepper';
import SplitPaneLayout from '../components/campaign/SplitPaneLayout';
import LaunchChatPanel from '../components/campaign/launch/LaunchChatPanel';
import LaunchToolbar from '../components/campaign/launch/LaunchToolbar';
import LaunchFormContent from '../components/campaign/launch/LaunchFormContent';
import LaunchModals from '../components/campaign/launch/LaunchModals';
import { LAUNCH_SKELETON_SECTIONS } from './campaignLaunch/constants';

// ── Skeleton Loading Component ──────────────────────────────────────────

function LaunchSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto flex justify-center">
      <div className="w-full max-w-[676px] bg-white rounded-xl px-6 pt-6 pb-8 flex flex-col gap-4 mt-4 mx-4 mb-4 min-h-min">
        {LAUNCH_SKELETON_SECTIONS.map(({ key, title, subtitle, fields }) => (
          <div key={key} className="rounded-xl border border-[#E8ECF3] p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">{title}</span>
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">
                generating
              </span>
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

// ── Main Component ──────────────────────────────────────────────────────

export default function CampaignLaunchPage() {
  const state = useCampaignLaunchPageState();
  const {
    showSkeleton,
    isInitialized,
    isEditMode,
    isApproved,
    config,
    isChatCollapsed,
    setIsChatCollapsed,
    activeTab,
    handleBack,
    handleApprove,
    handleLaunch,
  } = state;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Stepper */}
      <PaidMediaStepper overrideStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E8ECF3] flex-shrink-0 bg-white">
        {/* Left - Program Name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-[#636A77] flex-shrink-0">Program:</span>
          <span className="text-sm font-semibold text-[#212327] truncate">
            {showSkeleton ? 'Generating...' : config.campaign.name || 'Untitled Campaign'}
          </span>
        </div>

        {/* Right - Undo/Redo + Primary Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            disabled
            title="Undo"
            className="flex items-center justify-center w-7 h-7 bg-transparent border-none rounded transition-all duration-200 cursor-default text-[#C5CAD3]"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            disabled
            title="Redo"
            className="flex items-center justify-center w-7 h-7 bg-transparent border-none rounded transition-all duration-200 cursor-default text-[#C5CAD3]"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={isApproved ? handleLaunch : handleApprove}
            disabled={showSkeleton || !isInitialized}
            className="flex items-center gap-1.5 h-8 px-5 py-2 rounded-lg border-none bg-[#212327] text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:bg-[#3a3d42] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isApproved ? 'Launch Campaign' : 'Approve & Launch'}
          </button>
        </div>
      </div>

      {/* Main content area with chat split pane */}
      <SplitPaneLayout
        collapsed={isChatCollapsed}
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
      >
        {/* Left: Chat Panel */}
        <LaunchChatPanel state={state} />

        {/* Right: Forms or Skeleton */}
        <div className="flex-1 overflow-y-auto bg-[#F5F7FA]" data-launch-scroll>
          {showSkeleton ? (
            <div className="flex flex-col h-full bg-[#F7F8FB] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 border-b border-[#E8ECF3] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">Campaign Configuration</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">
                    generating
                  </span>
                </div>
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 bg-white border border-[#E8ECF3] rounded-lg text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back
                </button>
              </div>

              {/* Skeleton sections */}
              <LaunchSkeleton />

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#E8ECF3] text-center flex-shrink-0">
                <p className="text-xs text-gray-400 animate-pulse m-0">AI is generating your ad configuration...</p>
              </div>
            </div>
          ) : !isInitialized ? (
            /* Not generating and not initialized — show empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-white">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F7FA] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Configuration Yet</h3>
              <p className="text-sm text-[#464B55] max-w-sm">
                Use the chat to generate an ad configuration, or go back to approve a blueprint first.
              </p>
            </div>
          ) : (
            /* Full forms content */
            <div className="px-8 pt-3 pb-6">
              <LaunchToolbar state={state} />

              {activeTab !== 'meta' ? (
                /* Coming Soon placeholder */
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
                <LaunchFormContent state={state} />
              )}
            </div>
          )}
        </div>
      </SplitPaneLayout>

      <LaunchModals state={state} />
    </div>
  );
}
