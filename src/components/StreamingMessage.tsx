/**
 * StreamingMessage - Renders in-progress streaming segments.
 *
 * Content segments as plain text, thinking segments in a collapsible block,
 * and tool call segments with status indicators.
 */

import { useState, useEffect, useRef } from 'react';
import type { StreamSegment, ToolCall } from '../types/chat';

interface StreamingMessageProps {
  segments: StreamSegment[];
}

// Tool names that are internal SDK artifacts and should not be shown to the user
const HIDDEN_TOOLS = new Set(['Skill']);

export default function StreamingMessage({ segments }: StreamingMessageProps) {
  const visible = segments.filter(
    (s) => !(s.type === 'tool_call' && HIDDEN_TOOLS.has(s.toolCall.name))
  );
  if (visible.length === 0) return null;

  // Consolidate all thinking segments into one block
  const thinkingContent = visible
    .filter((s) => s.type === 'thinking')
    .map((s) => s.content)
    .join('\n');
  const nonThinking = visible.filter((s) => s.type !== 'thinking');

  return (
    <div className="space-y-2">
      {thinkingContent && <ThinkingBlock content={thinkingContent} isStreaming />}
      {nonThinking.map((segment, idx) => (
        <SegmentRenderer key={idx} segment={segment} />
      ))}
    </div>
  );
}

function SegmentRenderer({ segment }: { segment: StreamSegment }) {
  switch (segment.type) {
    case 'content':
      return (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {segment.content}
          <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-text-bottom" />
        </p>
      );

    case 'thinking':
      return <ThinkingBlock content={segment.content} />;

    case 'tool_call':
      return <ToolCallBlock toolCall={segment.toolCall} />;
  }
}

export function ThinkingBlock({ content, isStreaming = false }: { content: string; isStreaming?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const steps = content.split('\n').filter((line) => line.trim());

  // Auto-expand when streaming starts
  useEffect(() => {
    if (isStreaming) setIsExpanded(true);
  }, [isStreaming]);

  // Auto-scroll to latest step
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isExpanded, steps.length]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium">Thinking</span>
        {isStreaming && (
          <span className="inline-block w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
        )}
      </button>
      {isExpanded && (
        <div ref={scrollRef} className="px-3 pb-2 max-h-48 overflow-y-auto">
          <div className="space-y-1">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isActive = isLast && isStreaming;
              return (
                <div key={idx} className="flex items-start gap-2 py-0.5">
                  <div className="mt-0.5 shrink-0">
                    {isActive ? (
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolCallBlock({ toolCall }: { toolCall: ToolCall }) {
  const statusIcon = {
    running: (
      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    ),
    completed: (
      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    interrupted: (
      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
      </svg>
    ),
  };

  const statusColor = {
    running: 'border-blue-200 bg-blue-50',
    completed: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    interrupted: 'border-gray-200 bg-gray-50',
  };

  return (
    <div className={`border rounded-lg px-3 py-2 flex items-center gap-2 ${statusColor[toolCall.status]}`}>
      {statusIcon[toolCall.status]}
      <span className="text-xs font-mono text-gray-600">{toolCall.name}</span>
      {toolCall.status === 'running' && (
        <span className="text-xs text-gray-400 ml-auto">Running...</span>
      )}
      {toolCall.status === 'completed' && toolCall.result && (
        <span className="text-xs text-gray-400 ml-auto truncate max-w-[200px]">
          {toolCall.result.slice(0, 100)}
        </span>
      )}
      {toolCall.status === 'error' && toolCall.result && (
        <span className="text-xs text-red-400 ml-auto truncate max-w-[200px]">
          {toolCall.result.slice(0, 100)}
        </span>
      )}
    </div>
  );
}
