/**
 * StreamingChatView - Renders both finalized messages and live streaming segments.
 *
 * Replaces the inline chat JSX in ChatPage, providing a unified view
 * for both demo mode and SDK-backed streaming conversations.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ChatMessage, ChatMessageMetadata } from '../types/shared';
import type { StreamSegment } from '../types/chat';
import StreamingMessage, { ThinkingBlock } from './StreamingMessage';
import AgentThinking from './AgentThinking';
import ExecutionTrace from './ExecutionTrace';
import { useTraceStore } from '../stores/traceStore';
import { useChatStore } from '../stores/chatStore';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingChatViewProps {
  messages: ChatMessage[];
  streamingSegments: StreamSegment[];
  isStreaming: boolean;
  isWaitingForResponse: boolean;
}

export default function StreamingChatView({
  messages,
  streamingSegments,
  isStreaming,
  isWaitingForResponse,
}: StreamingChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const traceRuns = useTraceStore((s) => s.runs);
  const activeRunId = useChatStore((s) => s.activeRunId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingSegments]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {msg.role === 'user' ? (
              <div className="flex justify-end mb-1">
                <div className="bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px] p-4 max-w-[90%]">
                  <CollapsibleUserMessage content={msg.content} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Render consolidated thinking block from metadata if present */}
                {msg.metadata?.segments && (() => {
                  const thinkingContent = (msg.metadata.segments as StreamSegment[])
                    .filter((seg) => seg.type === 'thinking')
                    .map((seg) => seg.content)
                    .join('\n');
                  return thinkingContent ? (
                    <div className="space-y-1">
                      <ThinkingBlock content={thinkingContent} />
                    </div>
                  ) : null;
                })()}
                {/* Render tool calls from metadata if present (hide internal SDK tools) */}
                {msg.metadata?.segments && (
                  <div className="space-y-1">
                    {(msg.metadata.segments as StreamSegment[])
                      .filter((seg) => seg.type === 'tool_call' && seg.toolCall.name !== 'Skill')
                      .map((seg, idx) => {
                        if (seg.type !== 'tool_call') return null;
                        const tc = seg.toolCall;
                        return (
                          <div
                            key={idx}
                            className={`border rounded-lg px-3 py-2 flex items-center gap-2 ${
                              tc.status === 'completed'
                                ? 'border-green-200 bg-green-50'
                                : tc.status === 'error'
                                  ? 'border-red-200 bg-red-50'
                                  : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {tc.status === 'completed' ? (
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : tc.status === 'error' ? (
                              <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                              </svg>
                            )}
                            <span className="text-xs font-mono text-gray-600">{tc.name}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
                {/* Execution trace for this message */}
                {msg.metadata?.runId && traceRuns[msg.metadata.runId as string] && (
                  <ExecutionTrace run={traceRuns[msg.metadata.runId as string]} />
                )}
                {/* Render message content — collapsible for long messages */}
                {msg.content && (
                  <CollapsibleMessage content={msg.content} />
                )}
                {/* Render content option cards for suggest_copy_options */}
                {msg.metadata?.contentOptions && (
                  <ContentOptionCards
                    options={msg.metadata.contentOptions}
                    messageId={msg.id}
                  />
                )}
              </div>
            )}
            {msg.role === 'user' && (
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Live streaming segments — show only thinking and tool_call, not content */}
        {isStreaming && streamingSegments.length > 0 && (
          <div className="animate-fade-in">
            <StreamingMessage segments={streamingSegments.filter((s) => s.type !== 'content')} />
          </div>
        )}

        {/* Waiting indicator */}
        {isWaitingForResponse && streamingSegments.length === 0 && (
          <div className="animate-fade-in">
            <AgentThinking />
          </div>
        )}

        {/* Live execution trace — shown during streaming before the AI message is finalized */}
        {(isStreaming || isWaitingForResponse) && activeRunId && traceRuns[activeRunId] && (
          <div className="animate-fade-in">
            <ExecutionTrace run={traceRuns[activeRunId]} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// ---- Collapsible message for long AI responses ----

const COLLAPSE_THRESHOLD = 400;

function summarizeContent(content: string): string {
  // Take the first sentence or first ~120 chars, whichever is shorter
  const firstSentence = content.match(/^[^.!?\n]+[.!?]/);
  if (firstSentence && firstSentence[0].length <= 150) {
    return firstSentence[0];
  }
  const truncated = content.slice(0, 120);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

function CollapsibleUserMessage({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > COLLAPSE_THRESHOLD;

  if (!isLong) {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }

  return (
    <div>
      <p className="text-sm leading-relaxed">
        {expanded ? content : summarizeContent(content)}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-white/80 cursor-pointer border-none bg-transparent hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d={expanded ? "M9 7.5L6 4.5L3 7.5" : "M3 4.5L6 7.5L9 4.5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

function CollapsibleMessage({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > COLLAPSE_THRESHOLD;

  if (!isLong) {
    return (
      <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {expanded ? (
        <>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-[#1447e6] cursor-pointer border-none bg-transparent hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 7.5L6 4.5L3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Show less
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-700 leading-relaxed">{summarizeContent(content)}</p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-[#1447e6] cursor-pointer border-none bg-transparent hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Show more
          </button>
        </>
      )}
    </div>
  );
}

// ---- Content option cards for suggest_copy_options ----

const FIELD_LABELS: Record<string, string> = {
  headline: 'Headline',
  body: 'Body Copy',
  ctaText: 'CTA Text',
};

function ContentOptionCards({
  options,
  messageId,
}: {
  options: NonNullable<ChatMessageMetadata['contentOptions']>;
  messageId: string;
}) {
  const updateMessageMetadata = useChatStore((s) => s.updateMessageMetadata);
  const updateDefaultVariant = useCampaignConfigStore((s) => s.updateDefaultVariant);
  const updateVariantContent = useCampaignConfigStore((s) => s.updateVariantContent);

  const handleSelect = useCallback((index: number) => {
    const option = options.options[index];
    if (!option) return;

    // Apply the selected value to the store
    const target = options.target;
    const pageId = target?.pageId;
    const spotId = target?.spotId;
    const variantId = target?.variantId || 'default';

    if (pageId && spotId) {
      const fieldUpdate = { [options.field]: option.value };
      if (variantId === 'default') {
        updateDefaultVariant(pageId, spotId, fieldUpdate);
      } else {
        updateVariantContent(pageId, spotId, variantId, fieldUpdate);
      }
    }

    // Mark the selected index in message metadata
    updateMessageMetadata(messageId, {
      contentOptions: { ...options, selectedIndex: index },
    });
  }, [options, messageId, updateMessageMetadata, updateDefaultVariant, updateVariantContent]);

  return (
    <div className="mt-3">
      <div className="text-[11px] font-medium text-gray-500 mb-2">
        Choose a {FIELD_LABELS[options.field] || options.field} option:
      </div>
      <div className="flex flex-col gap-2">
        {options.options.map((opt, idx) => {
          const isSelected = options.selectedIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={options.selectedIndex !== undefined}
              className={`text-left rounded-lg border px-3 py-2.5 transition-all ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                  : options.selectedIndex !== undefined
                    ? 'border-gray-100 bg-gray-50 opacity-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {isSelected ? (
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      options.selectedIndex !== undefined ? 'border-gray-200' : 'border-gray-300'
                    }`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                      {opt.label}
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {opt.value}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 leading-snug">
                    {opt.rationale}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {options.selectedIndex !== undefined && (
        <div className="mt-2 text-[11px] text-indigo-600 font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Applied to {FIELD_LABELS[options.field] || options.field}
        </div>
      )}
    </div>
  );
}
