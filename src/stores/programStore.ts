/**
 * Program Store — Zustand store managing PaidMediaProgram lifecycle.
 *
 * A program is a lightweight envelope holding references to existing artifacts
 * (briefs, blueprints, launch configs) and tracking step completion.
 */

import { create } from 'zustand';
import type {
  PaidMediaProgram,
  ProgramStepId,
  ProgramStatus,
  ProgramStep,
  ProgramChannelConfig,
  ChannelPlatform,
} from '../types/program';
import { programStorage } from '../services/programStorage';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `prog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultSteps(): ProgramStep[] {
  return [
    { stepId: 1, label: 'Campaign Brief', status: 'pending' },
    { stepId: 2, label: 'Blueprint', status: 'pending' },
    { stepId: 3, label: 'Campaign Configuration', status: 'pending' },
    { stepId: 4, label: 'Review & Launch', status: 'pending' },
  ];
}

function defaultChannels(): ProgramChannelConfig[] {
  return [
    { platform: 'meta', enabled: true, launchConfigIds: [], isConfigured: false },
    { platform: 'google', enabled: false, launchConfigIds: [], isConfigured: false },
    { platform: 'tiktok', enabled: false, launchConfigIds: [], isConfigured: false },
    { platform: 'snapchat', enabled: false, launchConfigIds: [], isConfigured: false },
    { platform: 'pinterest', enabled: false, launchConfigIds: [], isConfigured: false },
  ];
}

/** Try to derive a meaningful program name from a serialized brief snapshot. */
function deriveProgramName(snapshotJson: string): string | undefined {
  try {
    const data = JSON.parse(snapshotJson) as Record<string, unknown>;
    const cd = data.campaignDetails;
    if (typeof cd === 'object' && cd !== null && 'campaignName' in cd) {
      const name = (cd as Record<string, string>).campaignName;
      if (name?.trim()) return name.trim().slice(0, 80);
    }
    if (typeof cd === 'string' && cd.trim()) {
      return cd.trim().split(/\s*[—–-]\s*/)[0].slice(0, 80);
    }
    const fallback = (data.brandProduct as string) || (data.businessObjective as string);
    if (fallback?.trim()) return fallback.trim().slice(0, 80);
  } catch {
    // Corrupt snapshot
  }
  return undefined;
}

// ── Store interface ──────────────────────────────────────────────────────────

interface ProgramState {
  programs: PaidMediaProgram[];
  activeProgramId: string | null;
  activeProgram: PaidMediaProgram | null;

  // Load
  loadPrograms: () => void;

  // CRUD
  createProgram: (name: string) => PaidMediaProgram;
  renameProgram: (name: string) => void;
  renameProgramById: (id: string, name: string) => void;
  deleteProgram: (id: string) => void;
  setActiveProgram: (id: string | null) => void;

  // Step tracking
  completeStep: (stepId: ProgramStepId) => void;
  setCurrentStep: (stepId: ProgramStepId) => void;
  markStepEdited: (stepId: ProgramStepId) => void;

  // Artifact linking
  linkBrief: (briefId: string) => void;
  saveBriefSnapshot: (data: unknown) => void;
  linkBlueprints: (ids: string[]) => void;
  approveBlueprint: (id: string) => void;

  // Channel / launch config management
  addLaunchConfig: (platform: ChannelPlatform, configId: string) => void;
  removeLaunchConfig: (platform: ChannelPlatform, configId: string) => void;
  setChannelEnabled: (platform: ChannelPlatform, enabled: boolean) => void;
  setChannelConfigured: (platform: ChannelPlatform, configured: boolean) => void;

  // Status
  updateStatus: (status: ProgramStatus) => void;

  // Chat
  linkChatSession: (sessionId: string, historyKey?: string) => void;

  // Internal
  _persist: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  activeProgramId: null,
  activeProgram: null,

  // ── Load ─────────────────────────────────────────────────────────────────

  loadPrograms: () => {
    const programs = programStorage.listPrograms();

    // Auto-fix programs whose names are still raw prompts by deriving from briefSnapshot
    for (const program of programs) {
      if (!program.briefSnapshot) continue;
      // Skip programs already named meaningfully (created after the fix)
      if (program.name === 'New Campaign' || program.name.length > 40 || /^(extract|create|plan|build|design|make|generate|help|write|draft)\b/i.test(program.name)) {
        const betterName = deriveProgramName(program.briefSnapshot);
        if (betterName && betterName !== program.name) {
          program.name = betterName;
          programStorage.saveProgram(program);
        }
      }
    }

    set({ programs: programStorage.listPrograms() });
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────

  createProgram: (name) => {
    const now = new Date().toISOString();
    const program: PaidMediaProgram = {
      id: generateId(),
      name,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      currentStepId: 1,
      furthestCompletedStep: 0,
      steps: defaultSteps(),
      blueprintIds: [],
      channels: defaultChannels(),
    };

    programStorage.saveProgram(program);
    set({
      programs: programStorage.listPrograms(),
      activeProgramId: program.id,
      activeProgram: program,
    });
    return program;
  },

  renameProgram: (name) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, name, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  renameProgramById: (id, name) => {
    const program = programStorage.getProgram(id);
    if (!program) return;
    const trimmed = name.trim() || program.name;
    const now = new Date().toISOString();
    program.name = trimmed;
    program.updatedAt = now;
    programStorage.saveProgram(program);

    const { activeProgramId, activeProgram } = get();
    set({
      programs: programStorage.listPrograms(),
      ...(activeProgramId === id && activeProgram
        ? { activeProgram: { ...activeProgram, name: trimmed, updatedAt: now } }
        : {}),
    });
  },

  deleteProgram: (id) => {
    programStorage.deleteProgram(id);
    const { activeProgramId } = get();
    set({
      programs: programStorage.listPrograms(),
      ...(activeProgramId === id ? { activeProgramId: null, activeProgram: null } : {}),
    });
  },

  setActiveProgram: (id) => {
    if (!id) {
      set({ activeProgramId: null, activeProgram: null });
      return;
    }
    const program = programStorage.getProgram(id);
    if (program) {
      set({ activeProgramId: id, activeProgram: program });
    }
  },

  // ── Step tracking ────────────────────────────────────────────────────────

  completeStep: (stepId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const now = new Date().toISOString();
    const steps = activeProgram.steps.map((s) =>
      s.stepId === stepId ? { ...s, status: 'completed' as const, completedAt: now } : s
    );
    const furthest = Math.max(activeProgram.furthestCompletedStep, stepId) as ProgramStepId;

    // Auto-advance current step if completing the current one
    const nextStep = stepId < 4 ? ((stepId + 1) as ProgramStepId) : stepId;
    const currentStepId = activeProgram.currentStepId === stepId ? nextStep : activeProgram.currentStepId;

    // Mark next step as in_progress if pending
    const updatedSteps = steps.map((s) =>
      s.stepId === currentStepId && s.status === 'pending'
        ? { ...s, status: 'in_progress' as const }
        : s
    );

    const status: ProgramStatus = furthest >= 3 ? 'ready_to_launch' : furthest >= 1 ? 'in_progress' : 'draft';

    set({
      activeProgram: {
        ...activeProgram,
        steps: updatedSteps,
        furthestCompletedStep: furthest,
        currentStepId,
        status,
        updatedAt: now,
      },
    });
    get()._persist();
  },

  setCurrentStep: (stepId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const now = new Date().toISOString();

    // Mark the target step as in_progress if it's pending
    const steps = activeProgram.steps.map((s) =>
      s.stepId === stepId && s.status === 'pending'
        ? { ...s, status: 'in_progress' as const }
        : s
    );

    set({
      activeProgram: {
        ...activeProgram,
        currentStepId: stepId,
        steps,
        updatedAt: now,
      },
    });
    get()._persist();
  },

  markStepEdited: (stepId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const now = new Date().toISOString();
    const steps = activeProgram.steps.map((s) =>
      s.stepId === stepId ? { ...s, lastEditedAt: now, status: s.status === 'pending' ? ('in_progress' as const) : s.status } : s
    );

    set({
      activeProgram: { ...activeProgram, steps, updatedAt: now },
    });
    get()._persist();
  },

  // ── Artifact linking ─────────────────────────────────────────────────────

  linkBrief: (briefId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, briefId, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  saveBriefSnapshot: (data) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: {
        ...activeProgram,
        briefSnapshot: JSON.stringify(data),
        updatedAt: new Date().toISOString(),
      },
    });
    get()._persist();
  },

  linkBlueprints: (ids) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    // Merge with existing, deduplicate
    const merged = Array.from(new Set([...activeProgram.blueprintIds, ...ids]));
    set({
      activeProgram: { ...activeProgram, blueprintIds: merged, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  approveBlueprint: (id) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, approvedBlueprintId: id, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  // ── Channel / launch config ──────────────────────────────────────────────

  addLaunchConfig: (platform, configId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) => {
      if (ch.platform !== platform) return ch;
      if (ch.launchConfigIds.includes(configId)) return ch;
      return {
        ...ch,
        launchConfigIds: [...ch.launchConfigIds, configId],
        isConfigured: true,
      };
    });

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  removeLaunchConfig: (platform, configId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) => {
      if (ch.platform !== platform) return ch;
      const filtered = ch.launchConfigIds.filter((id) => id !== configId);
      return { ...ch, launchConfigIds: filtered, isConfigured: filtered.length > 0 };
    });

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  setChannelEnabled: (platform, enabled) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) =>
      ch.platform === platform ? { ...ch, enabled } : ch
    );

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  setChannelConfigured: (platform, configured) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) =>
      ch.platform === platform ? { ...ch, isConfigured: configured } : ch
    );

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  // ── Status ───────────────────────────────────────────────────────────────

  updateStatus: (status) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, status, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  // ── Chat ─────────────────────────────────────────────────────────────────

  linkChatSession: (sessionId, historyKey) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: {
        ...activeProgram,
        chatSessionId: sessionId,
        ...(historyKey ? { chatHistoryKey: historyKey } : {}),
        updatedAt: new Date().toISOString(),
      },
    });
    get()._persist();
  },

  // ── Internal ─────────────────────────────────────────────────────────────

  _persist: () => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    programStorage.saveProgram(activeProgram);
    set({ programs: programStorage.listPrograms() });
  },
}));
