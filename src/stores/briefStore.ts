/**
 * Brief Store — Zustand store for Campaign Brief state management.
 * Handles active brief editing, autosave, and CRUD operations.
 */

import { create } from 'zustand';
import type { CampaignBrief, BriefSectionKey, BriefSectionBase, BriefSections, BriefSuite } from '../types/brief';
import { localBriefStorage } from '../services/briefStorage';
import { chatHistoryStorage } from '../services/chatHistoryStorage';

interface BriefState {
  // State
  activeBriefId: string | null;
  activeBrief: CampaignBrief | null;
  briefs: CampaignBrief[];
  isDirty: boolean;
  lastSavedAt: string | null;
  isGenerating: boolean;

  // Actions
  loadBriefs: () => void;
  setActiveBrief: (id: string) => void;
  createBriefFromChat: (
    sections: BriefSections,
    name: string,
    sourceMessage: string,
    suite?: BriefSuite
  ) => void;
  createEmptyBrief: (name: string, sourceMessage: string, suite?: BriefSuite) => void;
  updateSection: (
    sectionKey: BriefSectionKey,
    updates: Record<string, unknown>,
    fieldName?: string
  ) => void;
  toggleLock: (sectionKey: BriefSectionKey) => void;
  renameBrief: (id: string, name: string) => void;
  deleteBrief: (id: string) => void;
  duplicateBrief: (id: string) => void;
  updateBriefFromAI: (sections: BriefSections) => void;
  clearActiveBrief: () => void;
  saveBrief: () => void;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(get: () => BriefState) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    get().saveBrief();
  }, 1500);
}

function flushAutosave(get: () => BriefState) {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    get().saveBrief();
  }
}

function emptySections(): BriefSections {
  return {
    overview: {
      campaignName: '',
      objective: '',
      businessGoal: '',
      timelineStart: '',
      timelineEnd: '',
    },
    audience: {
      primaryAudience: '',
      audienceSize: '',
      inclusionCriteria: [],
      exclusionCriteria: [],
      segments: [],
      recommendedAudiences: [],
    },
    experience: {
      headline: '',
      bodyMessage: '',
      ctaText: '',
      placements: [],
      segmentMessages: [],
    },
    measurement: {
      primaryKpi: '',
      secondaryKpis: [],
      secondaryMetrics: [],
      successCriteria: [],
      risks: [],
    },
  };
}

export const useBriefStore = create<BriefState>((set, get) => ({
  activeBriefId: null,
  activeBrief: null,
  briefs: localBriefStorage.listBriefs(),
  isDirty: false,
  lastSavedAt: null,
  isGenerating: false,

  loadBriefs: () => {
    const briefs = localBriefStorage.listBriefs();
    set({ briefs });
  },

  setActiveBrief: (id: string) => {
    const brief = localBriefStorage.getBrief(id);
    if (brief) {
      set({
        activeBriefId: id,
        activeBrief: brief,
        isDirty: false,
        lastSavedAt: brief.updatedAt,
      });
    }
  },

  createBriefFromChat: (sections, name, sourceMessage, suite) => {
    const now = new Date().toISOString();
    const brief: CampaignBrief = {
      id: `brief-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      sourceMessage,
      sections,
      suite,
    };

    localBriefStorage.saveBrief(brief);
    const briefs = localBriefStorage.listBriefs();

    set({
      activeBriefId: brief.id,
      activeBrief: brief,
      briefs,
      isDirty: false,
      lastSavedAt: now,
    });
  },

  createEmptyBrief: (name, sourceMessage, suite) => {
    const now = new Date().toISOString();
    const brief: CampaignBrief = {
      id: `brief-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      sourceMessage,
      sections: emptySections(),
      suite,
    };

    localBriefStorage.saveBrief(brief);
    const briefs = localBriefStorage.listBriefs();

    set({
      activeBriefId: brief.id,
      activeBrief: brief,
      briefs,
      isDirty: false,
      lastSavedAt: now,
      isGenerating: true,
    });
  },

  updateSection: (sectionKey, updates, fieldName) => {
    const { activeBrief } = get();
    if (!activeBrief) return;

    const section = { ...activeBrief.sections[sectionKey] };

    // Merge updates
    for (const [key, value] of Object.entries(updates)) {
      (section as Record<string, unknown>)[key] = value;
    }

    // Track user-edited fields
    if (fieldName) {
      const edited = new Set(section.userEditedFields || []);
      edited.add(fieldName);
      section.userEditedFields = Array.from(edited);
    }

    const updatedBrief: CampaignBrief = {
      ...activeBrief,
      updatedAt: new Date().toISOString(),
      sections: {
        ...activeBrief.sections,
        [sectionKey]: section,
      },
    };

    set({ activeBrief: updatedBrief, isDirty: true });
    scheduleAutosave(get);
  },

  toggleLock: (sectionKey) => {
    const { activeBrief } = get();
    if (!activeBrief) return;

    const section = { ...activeBrief.sections[sectionKey] };
    section.locked = !section.locked;

    const updatedBrief: CampaignBrief = {
      ...activeBrief,
      updatedAt: new Date().toISOString(),
      sections: {
        ...activeBrief.sections,
        [sectionKey]: section,
      },
    };

    set({ activeBrief: updatedBrief, isDirty: true });
    scheduleAutosave(get);
  },

  renameBrief: (id, name) => {
    const brief = localBriefStorage.getBrief(id);
    if (!brief) return;

    brief.name = name;
    brief.updatedAt = new Date().toISOString();
    localBriefStorage.saveBrief(brief);

    const { activeBrief } = get();
    const briefs = localBriefStorage.listBriefs();

    set({
      briefs,
      activeBrief: activeBrief?.id === id ? brief : activeBrief,
    });
  },

  deleteBrief: (id) => {
    localBriefStorage.deleteBrief(id);
    chatHistoryStorage.deleteMessages(id);
    const { activeBriefId } = get();
    const briefs = localBriefStorage.listBriefs();

    set({
      briefs,
      ...(activeBriefId === id
        ? { activeBriefId: null, activeBrief: null, isDirty: false, lastSavedAt: null }
        : {}),
    });
  },

  duplicateBrief: (id) => {
    localBriefStorage.duplicateBrief(id);
    const briefs = localBriefStorage.listBriefs();
    set({ briefs });
  },

  updateBriefFromAI: (sections: BriefSections) => {
    const { activeBrief } = get();

    // If no active brief exists, create one first
    if (!activeBrief) {
      const campaignName = sections.overview?.campaignName || 'New Campaign';
      const now = new Date().toISOString();
      const newBrief: CampaignBrief = {
        id: `brief-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: campaignName,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        sourceMessage: 'AI-generated campaign brief',
        sections,
        suite: 'paid-media',
      };

      localBriefStorage.saveBrief(newBrief);
      const briefs = localBriefStorage.listBriefs();

      set({
        activeBriefId: newBrief.id,
        activeBrief: newBrief,
        briefs,
        isDirty: false,
        lastSavedAt: now,
        isGenerating: false,
      });
      return;
    }

    const sectionKeys: BriefSectionKey[] = [
      'overview', 'audience', 'experience', 'measurement',
    ];

    const mergedSections = { ...activeBrief.sections };

    for (const key of sectionKeys) {
      const existing = activeBrief.sections[key] as BriefSectionBase;
      const incoming = sections[key] as unknown as Record<string, unknown>;

      // Skip entirely locked sections
      if (existing?.locked) continue;

      const merged = { ...existing } as Record<string, unknown>;

      for (const [field, value] of Object.entries(incoming)) {
        // Preserve metadata fields from the existing section
        if (field === 'locked' || field === 'userEditedFields' || field === 'notes') continue;
        // Don't overwrite user-edited fields
        if (existing?.userEditedFields?.includes(field)) continue;
        merged[field] = value;
      }

      (mergedSections as Record<string, unknown>)[key] = merged;
    }

    const now = new Date().toISOString();
    // Use the AI-generated campaign name as the brief name
    const aiCampaignName = mergedSections.overview?.campaignName;
    const updatedBrief: CampaignBrief = {
      ...activeBrief,
      ...(aiCampaignName ? { name: aiCampaignName } : {}),
      updatedAt: now,
      sections: mergedSections,
    };

    // Save immediately (one-time AI update, no debounce)
    localBriefStorage.saveBrief(updatedBrief);
    const briefs = localBriefStorage.listBriefs();

    set({
      activeBrief: updatedBrief,
      briefs,
      isDirty: false,
      lastSavedAt: now,
      isGenerating: false,
    });
  },

  clearActiveBrief: () => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    set({
      activeBriefId: null,
      activeBrief: null,
      isDirty: false,
      lastSavedAt: null,
    });
  },

  saveBrief: () => {
    const { activeBrief } = get();
    if (!activeBrief) return;

    const now = new Date().toISOString();
    const saved = { ...activeBrief, updatedAt: now };
    localBriefStorage.saveBrief(saved);
    const briefs = localBriefStorage.listBriefs();

    set({
      activeBrief: saved,
      briefs,
      isDirty: false,
      lastSavedAt: now,
    });
  },
}));

// Flush any pending autosave before the window closes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushAutosave(useBriefStore.getState);
  });
}
