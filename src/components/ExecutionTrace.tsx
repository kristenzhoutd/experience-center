/**
 * ExecutionTrace — collapsible trace panel for a single orchestration run.
 *
 * Renders chronological trace events with status badges, timing,
 * and a "Copy JSON" button for the skill output.
 */

import { useState, useEffect, useRef } from 'react';
import type { TraceRun } from '../types/trace';

interface ExecutionTraceProps {
  run: TraceRun;
}

const STAGE_LABELS: Record<string, string> = {
  intent: 'Intent Detection',
  route: 'Routing Decision',
  skill_call: 'Skill Invocation',
  skill_result: 'Skill Result',
  ui_update: 'UI Update',
  error: 'Error',
};

const LEVEL_STYLES: Record<string, { badge: string; dot: string }> = {
  info: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  warn: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  error: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
};

const STATUS_STYLES: Record<string, string> = {
  running: 'text-blue-600',
  succeeded: 'text-green-600',
  failed: 'text-red-600',
};

export default function ExecutionTrace({ run }: ExecutionTraceProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Set<number>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-expand when run becomes active
  useEffect(() => {
    if (run.status === 'running') setIsOpen(true);
  }, [run.status]);

  // Auto-scroll to latest event
  useEffect(() => {
    if (isOpen && timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [isOpen, run.events.length]);

  const handleCopyJson = (data: Record<string, unknown>, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const durationMs = run.completedAt
    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
    : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white/80 text-xs">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="font-medium text-gray-600">Execution Trace</span>
        <span className={`ml-auto font-medium ${STATUS_STYLES[run.status] || 'text-gray-500'}`}>
          {run.status}
        </span>
        {durationMs !== null && (
          <span className="text-gray-400">{durationMs}ms</span>
        )}
      </button>

      {/* Events timeline */}
      {isOpen && (
        <div ref={timelineRef} className="border-t border-gray-100 px-3 py-2 space-y-1.5 max-h-52 overflow-y-auto">
          {run.events.map((event, idx) => {
            const styles = LEVEL_STYLES[event.level] || LEVEL_STYLES.info;
            const isLastEvent = idx === run.events.length - 1;
            const isInProgress = isLastEvent && run.status === 'running';
            // Completed steps get green dots; warn/error levels keep their own color
            const dotColor = isInProgress
              ? styles.dot
              : event.level === 'warn' || event.level === 'error'
                ? styles.dot
                : 'bg-green-400';
            return (
              <div key={event.id} className="flex items-start gap-2">
                {/* Timeline dot — pulse when this is the active step */}
                <div className="flex flex-col items-center pt-1.5">
                  {isInProgress ? (
                    <div className="relative w-1.5 h-1.5">
                      <div className={`absolute inset-0 rounded-full ${dotColor} animate-ping opacity-75`} />
                      <div className={`relative w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    </div>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  )}
                  {idx < run.events.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-0.5" />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0 pb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles.badge}`}>
                      {STAGE_LABELS[event.stage] || event.stage}
                    </span>
                    <span className="text-gray-600 truncate">{event.message}</span>
                    {event.durationMs != null && (
                      <span className="text-gray-400 ml-auto shrink-0">{event.durationMs}ms</span>
                    )}
                  </div>

                  {/* Data payload — collapsed by default */}
                  {event.data && Object.keys(event.data).length > 0 && (
                    <div className="mt-1">
                      <button
                        onClick={() => setExpandedData((prev) => {
                          const next = new Set(prev);
                          next.has(idx) ? next.delete(idx) : next.add(idx);
                          return next;
                        })}
                        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className={`w-2.5 h-2.5 transition-transform ${expandedData.has(idx) ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>Details</span>
                      </button>
                      {expandedData.has(idx) && (
                        <div className="mt-1 flex items-start gap-1">
                          <pre className="flex-1 text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1 overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                          <button
                            onClick={() => handleCopyJson(event.data!, idx)}
                            className="shrink-0 px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
                            title="Copy JSON"
                          >
                            {copiedIdx === idx ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {run.events.length === 0 && (
            <p className="text-gray-400 italic">No events recorded</p>
          )}
        </div>
      )}
    </div>
  );
}
