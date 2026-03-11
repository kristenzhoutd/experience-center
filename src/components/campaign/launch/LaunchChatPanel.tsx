/**
 * Chat panel for the campaign launch page — messages, suggestions, and input.
 */

import { Send, Square, MessageSquare, Clock, ChevronLeft } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-white">
      {/* Chat Utility Buttons */}
      <div className="flex items-center justify-end px-4 pt-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsChatCollapsed(true)}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            title="Collapse chat"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {storeMessages.length === 0 && !isStreaming ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {showSkeleton ? 'Generating Configuration...' : 'Campaign Chat'}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {showSkeleton
                  ? 'AI is creating your Campaign hierarchy from the blueprint.'
                  : 'Ask me anything about your campaign structure, budget allocation, or creative strategy.'}
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
      <div className="p-4 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your campaign..."
            rows={1}
            className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
            style={{ minHeight: '24px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
              }
            }}
          />
          <div className="px-3 py-2 flex items-center justify-end">
            {isStreaming ? (
              <button
                onClick={() => stopStreaming()}
                className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 cursor-pointer transition-colors"
                title="Stop"
              >
                <Square className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleChatSubmit}
                disabled={!inputValue.trim()}
                className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
