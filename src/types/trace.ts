/**
 * Execution Trace types — structured trace events for orchestration visibility.
 *
 * Each user message produces a TraceRun containing ordered TraceEvents
 * that show intent detection, routing, skill invocation, and UI updates.
 */

export type TraceLevel = 'info' | 'warn' | 'error';

export type TraceStage =
  | 'intent'
  | 'route'
  | 'skill_call'
  | 'skill_result'
  | 'ui_update'
  | 'error';

export interface TraceEvent {
  id: string;
  runId: string;
  timestamp: string;
  level: TraceLevel;
  stage: TraceStage;
  message: string;
  durationMs?: number;
  data?: Record<string, unknown>;
}

export interface TraceRun {
  runId: string;
  messageId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'succeeded' | 'failed';
  events: TraceEvent[];
}
