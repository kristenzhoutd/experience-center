/**
 * Chat panel for the campaign launch page — messages, suggestions, and input.
 */

import { Send, Square, MessageSquare } from 'lucide-react';
import StreamingChatView from '../../StreamingChatView';
import { useTraceStore } from '../../../stores/traceStore';
import type { CampaignLaunchPageState } from '../../../hooks/useCampaignLaunchPageState';

interface Props {
  state: CampaignLaunchPageState;
}

export default function LaunchChatPanel({ state }: Props) {
  const {
    config,
    storeMessages,
    streamingSegments,
    isStreaming,
    isWaitingForResponse,
    showSkeleton,
    isChatCollapsed,
    setIsChatCollapsed,
    inputValue,
    setInputValue,
    textareaRef,
    handleChatSubmit,
    stopStreaming,
    sendMessage,
  } = state;

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E8ECF3]">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-[#E8ECF3] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Campaign Chat</span>
        </div>
        <button
          onClick={() => setIsChatCollapsed(true)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
          title="Close chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {storeMessages.length === 0 && !isStreaming ? (
          <div className="flex-1 flex items-start justify-center h-full px-4 pt-8">
            <div className="text-center max-w-xs">
              <p className="text-sm text-gray-500 leading-relaxed">
                {showSkeleton
                  ? 'AI is creating your Meta ad hierarchy from the blueprint.'
                  : "Hi! I'm your Ad Config assistant. Ask me anything about your campaign structure, budget allocation, or creative strategy."}
              </p>
            </div>
          </div>
        ) : (
          <StreamingChatView
            messages={storeMessages}
            streamingSegments={streamingSegments}
            isStreaming={isStreaming}
            isWaitingForResponse={isWaitingForResponse}
          />
        )}
      </div>

      {/* Suggestion pills */}
      {storeMessages.length === 0 && !isStreaming && !showSkeleton && (
        <div className="px-3 pb-1 flex flex-col gap-1.5">
          {(config.campaign.name
            ? [
                `Split the budget evenly across ${config.adSets.length || 2} ad sets`,
                'Add a retargeting ad set for website visitors',
                `Write 3 headline variations for "${config.creatives[0]?.headline || 'the ad'}"`,
                'Recommend budget changes for this config',
              ]
            : [
                'Generate a Meta ad config from my blueprint',
                'Create a campaign with 3 ad sets targeting different audiences',
                'Set up a traffic campaign with $50/day budget',
                'Recommend an ad structure for conversions',
              ]
          ).map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const trace = useTraceStore.getState();
                trace.startRun(runId, `user-${Date.now()}`);
                trace.addEvent(runId, 'intent', 'Launch page suggestion click');
                sendMessage(prompt, runId);
              }}
              className="text-left px-3 py-2 text-[13px] text-[#1957DB] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-full transition-colors cursor-pointer border-none w-fit"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input */}
      <div className="p-3 shrink-0 border-t border-[#E8ECF3]">
        <div className="bg-white rounded-xl border border-[#E8ECF3] overflow-hidden">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Refine your ad config..."
            rows={1}
            className="w-full px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
            style={{ minHeight: '20px', maxHeight: '100px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
              }
            }}
          />
          <div className="px-2 py-1.5 flex items-center justify-end">
            {isStreaming ? (
              <button
                onClick={() => stopStreaming()}
                className="w-7 h-7 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 cursor-pointer transition-colors"
                title="Stop"
              >
                <Square className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleChatSubmit}
                disabled={!inputValue.trim()}
                className="w-7 h-7 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Send"
              >
                <Send className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
