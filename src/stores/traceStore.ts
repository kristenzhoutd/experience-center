/**
 * Trace Store — Zustand store for execution trace events.
 *
 * Provides a structured event bus for orchestration visibility.
 * Each user message starts a TraceRun, and events are appended as
 * the orchestrator processes intent → routing → skill invocation → UI update.
 */

import { create } from 'zustand';
import type { TraceEvent, TraceRun, TraceLevel, TraceStage } from '../types/trace';

interface TraceState {
  runs: Record<string, TraceRun>;

  startRun: (runId: string, messageId: string) => void;
  addEvent: (
    runId: string,
    stage: TraceStage,
    message: string,
    opts?: { level?: TraceLevel; data?: Record<string, unknown>; durationMs?: number }
  ) => void;
  completeRun: (runId: string, status: 'succeeded' | 'failed') => void;
  getRunEvents: (runId: string) => TraceEvent[];
  getRunByMessageId: (messageId: string) => TraceRun | undefined;
}

function makeEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  runs: {},

  startRun: (runId, messageId) => {
    const run: TraceRun = {
      runId,
      messageId,
      startedAt: new Date().toISOString(),
      status: 'running',
      events: [],
    };
    set((state) => ({ runs: { ...state.runs, [runId]: run } }));
  },

  addEvent: (runId, stage, message, opts) => {
    const event: TraceEvent = {
      id: makeEventId(),
      runId,
      timestamp: new Date().toISOString(),
      level: opts?.level ?? 'info',
      stage,
      message,
      durationMs: opts?.durationMs,
      data: opts?.data,
    };

    set((state) => {
      const run = state.runs[runId];
      if (!run) return state;
      return {
        runs: {
          ...state.runs,
          [runId]: { ...run, events: [...run.events, event] },
        },
      };
    });
  },

  completeRun: (runId, status) => {
    set((state) => {
      const run = state.runs[runId];
      if (!run) return state;
      return {
        runs: {
          ...state.runs,
          [runId]: { ...run, status, completedAt: new Date().toISOString() },
        },
      };
    });
  },

  getRunEvents: (runId) => {
    return get().runs[runId]?.events ?? [];
  },

  getRunByMessageId: (messageId) => {
    return Object.values(get().runs).find((r) => r.messageId === messageId);
  },
}));
