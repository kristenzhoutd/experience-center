/**
 * Variation 5: AI Command — Chat-dominant "Command Center" with inline
 * form sections wrapped in CopilotCards and a persistent Readiness Dashboard.
 *
 * The left pane interleaves chat messages with form sections in a single
 * scrollable stream. A slash-command bar at the top provides power-user
 * shortcuts. The right pane shows live campaign readiness.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Lightbulb, Terminal, Send, Square } from 'lucide-react';
import { useCampaignLaunchPageState } from '../../hooks/useCampaignLaunchPageState';
import PaidMediaStepper from '../../components/campaign/PaidMediaStepper';
import LaunchFormContent from '../../components/campaign/launch/LaunchFormContent';
import LaunchModals from '../../components/campaign/launch/LaunchModals';
import VariationSwitcher from '../../components/campaign/launch/VariationSwitcher';
import ReadinessDashboard from '../../components/campaign/launch/ReadinessDashboard';
import StreamingChatView from '../../components/StreamingChatView';
import TypewriterText from '../../components/TypewriterText';
import AgentThinking from '../../components/AgentThinking';
import { LAUNCH_SECTIONS, LAUNCH_SKELETON_SECTIONS } from './constants';
import type { LaunchSectionId } from './constants';
import type { CampaignLaunchPageState } from '../../hooks/useCampaignLaunchPageState';

// ── Inline helpers ──────────────────────────────────────────────────────────

/** Derive a contextual AI insight for each section. */
function getSectionInsight(sectionId: LaunchSectionId, state: CampaignLaunchPageState): string | null {
  const { config } = state;
  switch (sectionId) {
    case 'campaign': {
      const budget = config.campaign.dailyBudget / 100;
      const adSetCount = config.adSets.length;
      if (adSetCount > 0 && budget > 0) {
        const perSet = (budget / adSetCount).toFixed(2);
        return `Budget of $${budget.toFixed(2)}/day supports ${adSetCount} ad set${adSetCount !== 1 ? 's' : ''} at ~$${perSet} each`;
      }
      if (budget > 0) return `Daily budget: $${budget.toFixed(2)}`;
      return null;
    }
    case 'adSets': {
      const count = config.adSets.length;
      if (count === 0) return 'Add at least one ad set to target your audience';
      if (count === 1) return 'Single ad set \u2014 consider A/B testing with 2+ sets';
      return `${count} ad sets configured for audience testing`;
    }
    case 'creatives': {
      const count = config.creatives.length;
      if (count === 0) return 'Add creatives with images and copy for your ads';
      const missingImage = config.creatives.filter((c) => !c.file).length;
      if (missingImage > 0) return `${missingImage} creative${missingImage !== 1 ? 's' : ''} missing images \u2014 upload or generate with AI`;
      return `${count} creative${count !== 1 ? 's' : ''} ready with images`;
    }
    case 'ads': {
      const adCount = config.ads.length;
      const creativeCount = config.creatives.length;
      const usedCreatives = new Set(config.ads.map((a) => a.creativeLocalId).filter(Boolean));
      const unused = creativeCount - usedCreatives.size;
      if (adCount === 0) return 'Create ads to link your ad sets with creatives';
      if (unused > 0) return `${unused} creative${unused !== 1 ? 's' : ''} unused \u2014 consider adding more ads`;
      return `${adCount} ad${adCount !== 1 ? 's' : ''} linked to creatives`;
    }
    default:
      return null;
  }
}

/** Section status color for the left border. */
function getSectionBorderColor(sectionId: LaunchSectionId, state: CampaignLaunchPageState): string {
  if (state.isSectionComplete(sectionId)) return 'border-l-green-500';
  return 'border-l-blue-400';
}

// ── CopilotCard ─────────────────────────────────────────────────────────────

function CopilotCard({
  sectionId,
  state,
}: {
  sectionId: LaunchSectionId;
  state: CampaignLaunchPageState;
}) {
  const section = LAUNCH_SECTIONS.find((s) => s.id === sectionId)!;
  const insight = getSectionInsight(sectionId, state);
  const borderColor = getSectionBorderColor(sectionId, state);
  const isComplete = state.isSectionComplete(sectionId);

  return (
    <div
      id={`copilot-${sectionId}`}
      className={`bg-white rounded-xl border border-[#E8ECF3] border-l-4 ${borderColor} overflow-hidden transition-colors`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8ECF3] bg-[#FAFBFC]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{section.label}</span>
          {isComplete && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              Complete
            </span>
          )}
        </div>
        {insight && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200/60">
            <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-[11px] text-amber-700 leading-tight">{insight}</span>
          </div>
        )}
      </div>

      {/* Form content */}
      <div className="px-2 py-3">
        <LaunchFormContent state={state} visibleSections={[sectionId]} />
      </div>
    </div>
  );
}

// ── CommandBar ───────────────────────────────────────────────────────────────

function CommandBar({
  state,
}: {
  state: CampaignLaunchPageState;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Slash command parsing
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(/\s+/);
      const cmd = parts[0]?.toLowerCase();
      const arg = parts.slice(1).join(' ');

      switch (cmd) {
        case 'budget': {
          const n = parseFloat(arg);
          if (!isNaN(n) && n > 0) {
            state.updateCampaign({ dailyBudget: Math.round(n * 100) });
          }
          setValue('');
          return;
        }
        case 'add-adset':
          state.addAdSet();
          setValue('');
          return;
        case 'add-creative':
          state.addCreative();
          setValue('');
          return;
        case 'add-ad':
          state.addAd();
          setValue('');
          return;
        case 'show': {
          const target = arg.toLowerCase().replace(/\s+/g, '');
          const sectionMap: Record<string, string> = {
            campaign: 'campaign',
            adsets: 'adSets',
            adset: 'adSets',
            creatives: 'creatives',
            creative: 'creatives',
            ads: 'ads',
            ad: 'ads',
          };
          const sectionId = sectionMap[target];
          if (sectionId) {
            const el = document.getElementById(`copilot-${sectionId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          setValue('');
          return;
        }
        case 'launch':
          state.handleLaunch();
          setValue('');
          return;
        case 'save':
          state.handleSave();
          setValue('');
          return;
        default:
          break; // Fall through to chat
      }
    }

    // Natural language — send as chat message
    state.setInputValue(trimmed);
    // Need to wait for state to propagate then submit
    setTimeout(() => state.handleChatSubmit(), 0);
    setValue('');
  }, [value, state]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border border-[#E8ECF3] rounded-xl shadow-sm focus-within:border-[#1957DB] focus-within:ring-2 focus-within:ring-[#1957DB]/10 transition-all">
        <Terminal className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask or command... (try /budget, /show, /add-adset)"
          className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none font-mono"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1957DB] text-white hover:bg-[#1447c0] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border-none flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Chat input (bottom) ─────────────────────────────────────────────────────

function ChatInput({ state }: { state: CampaignLaunchPageState }) {
  const { inputValue, setInputValue, handleChatSubmit, isStreaming, isWaitingForResponse, stopStreaming, textareaRef } = state;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-[#E8ECF3] bg-white">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI to modify your campaign..."
          rows={1}
          className="flex-1 px-3 py-2.5 border border-[#E8ECF3] rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none outline-none focus:border-[#1957DB] focus:ring-2 focus:ring-[#1957DB]/10 transition-all bg-white"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        {isStreaming || isWaitingForResponse ? (
          <button
            onClick={stopStreaming}
            className="flex items-center justify-center w-9 h-10 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer border-none flex-shrink-0"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleChatSubmit}
            disabled={!inputValue.trim()}
            className="flex items-center justify-center w-9 h-10 rounded-lg bg-[#1957DB] text-white hover:bg-[#1447c0] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border-none flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function LaunchSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        {LAUNCH_SKELETON_SECTIONS.map(({ key, title, subtitle, fields }) => (
          <div key={key} className="bg-white rounded-xl border border-[#E8ECF3] border-l-4 border-l-blue-300 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">{title}</span>
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">
                generating
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: fields }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 bg-gray-100 rounded ${
                    i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : i === 2 ? 'w-2/3' : 'w-3/5'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function CampaignLaunchCommandPage() {
  const state = useCampaignLaunchPageState();
  const [welcomeDone, setWelcomeDone] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  const {
    showSkeleton,
    isInitialized,
    isEditMode,
    config,
    storeMessages,
    streamingSegments,
    isStreaming,
    isWaitingForResponse,
    handleBack,
  } = state;

  // Auto-scroll the stream when new content arrives
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [storeMessages, streamingSegments]);

  const welcomeText = isEditMode
    ? `I've loaded your existing campaign "${config.campaign.name}". You can review and update any section below, or ask me to make changes.`
    : `I've configured your campaign from the blueprint. Let's review each section — you can edit inline or ask me to adjust anything.`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PaidMediaStepper overrideStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E8ECF3] flex-shrink-0 bg-white">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 m-0">
            {showSkeleton
              ? 'Generating Campaign Configuration...'
              : isEditMode
                ? 'Edit Campaign'
                : 'Review Campaign'}
          </h1>
          <p className="text-sm text-[#464B55] m-0 mt-0.5">
            {showSkeleton ? 'AI is building your Campaign hierarchy' : config.campaign.name}
          </p>
        </div>
        <VariationSwitcher />
      </div>

      {/* Main layout — no SplitPaneLayout, custom flex */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Command Center */}
        <div className="flex-[3] min-w-0 flex flex-col bg-[#F5F7FA]">
          {showSkeleton ? (
            <LaunchSkeleton />
          ) : !isInitialized ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-white">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F7FA] flex items-center justify-center mb-4">
                <Terminal className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Configuration Yet</h3>
              <p className="text-sm text-[#464B55] max-w-sm">
                Use the chat to generate an ad configuration, or go back to approve a blueprint first.
              </p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 text-sm font-medium text-[#1957DB] bg-[#EFF6FF] rounded-lg hover:bg-[#1957DB]/10 transition-colors cursor-pointer border-none"
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
              {/* Command bar */}
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                <CommandBar state={state} />
              </div>

              {/* Scrollable stream */}
              <div ref={streamRef} className="flex-1 overflow-y-auto px-4 pb-4" data-launch-scroll>
                <div className="max-w-3xl mx-auto flex flex-col gap-4">
                  {/* Welcome message */}
                  <div className="flex items-start gap-3 py-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1957DB] to-[#4F46E5] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed pt-1">
                      {!welcomeDone ? (
                        <TypewriterText
                          text={welcomeText}
                          speed={12}
                          onComplete={() => setWelcomeDone(true)}
                        />
                      ) : (
                        <span>{welcomeText}</span>
                      )}
                    </div>
                  </div>

                  {/* CopilotCards — each form section inline in the stream */}
                  {LAUNCH_SECTIONS.map((section) => (
                    <CopilotCard key={section.id} sectionId={section.id} state={state} />
                  ))}

                  {/* Chat messages rendered after the form sections */}
                  {storeMessages.length > 0 && (
                    <div className="border-t border-[#E8ECF3] pt-4 mt-2">
                      <StreamingChatView
                        messages={storeMessages}
                        streamingSegments={streamingSegments}
                        isStreaming={isStreaming}
                        isWaitingForResponse={isWaitingForResponse}
                      />
                    </div>
                  )}

                  {/* Waiting indicator when no messages yet */}
                  {storeMessages.length === 0 && isWaitingForResponse && (
                    <AgentThinking />
                  )}
                </div>
              </div>

              {/* Chat input at bottom */}
              <ChatInput state={state} />
            </>
          )}
        </div>

        {/* Right: Readiness Dashboard */}
        {isInitialized && (
          <div className="w-[320px] flex-shrink-0">
            <ReadinessDashboard state={state} />
          </div>
        )}
      </div>

      <LaunchModals state={state} />
    </div>
  );
}
