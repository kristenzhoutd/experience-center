/**
 * Company Context Store — Zustand store for reactive Company Context state.
 * Supports multiple saved contexts with one "active" context being edited.
 * Wraps companyContextStorage.ts with editor state and autosave.
 */

import { create } from 'zustand';
import type { CompanyContext } from '../utils/companyContextStorage';
import {
  loadCompanyContext,
  loadCompanyContexts,
  saveCompanyContext,
  clearCompanyContext,
  deleteCompanyContext,
} from '../utils/companyContextStorage';

interface CompanyContextState {
  /** The currently-active context being edited (null when creating new) */
  context: CompanyContext | null;
  /** All saved company contexts */
  contexts: CompanyContext[];
  isDirty: boolean;
  lastSavedAt: string | null;
  isGenerating: boolean;

  loadContext: () => void;
  loadContexts: () => void;
  replaceContext: (ctx: CompanyContext) => void;
  updateField: (sectionKey: string, fieldName: string, value: unknown) => void;
  addArrayItem: (sectionKey: string, item: unknown) => void;
  removeArrayItem: (sectionKey: string, index: number) => void;
  saveContext: () => void;
  /** Clear active context selection (does NOT delete saved contexts) */
  clearContext: () => void;
  /** Permanently delete a saved context by ID */
  deleteContext: (id: string) => void;
  setGenerating: (v: boolean) => void;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(get: () => CompanyContextState) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    get().saveContext();
  }, 1500);
}

function flushAutosave(get: () => CompanyContextState) {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    get().saveContext();
  }
}

export const useCompanyContextStore = create<CompanyContextState>((set, get) => ({
  context: null,
  contexts: [],
  isDirty: false,
  lastSavedAt: null,
  isGenerating: false,

  loadContext: () => {
    const ctx = loadCompanyContext();
    set({
      context: ctx,
      contexts: loadCompanyContexts(),
      isDirty: false,
      lastSavedAt: ctx ? ctx.lastUpdated : null,
    });
  },

  loadContexts: () => {
    set({ contexts: loadCompanyContexts() });
  },

  replaceContext: (ctx: CompanyContext) => {
    const saved = saveCompanyContext(ctx);
    set({
      context: saved,
      contexts: loadCompanyContexts(),
      isDirty: false,
      lastSavedAt: saved.lastUpdated || new Date().toISOString(),
      isGenerating: false,
    });
  },

  updateField: (sectionKey: string, fieldName: string, value: unknown) => {
    const { context } = get();
    if (!context) return;

    const updated = { ...context } as any;
    if (typeof updated[sectionKey] === 'object' && !Array.isArray(updated[sectionKey])) {
      updated[sectionKey] = { ...updated[sectionKey], [fieldName]: value };
    }
    updated.lastUpdated = new Date().toISOString();

    set({ context: updated, isDirty: true });
    scheduleAutosave(get);
  },

  addArrayItem: (sectionKey: string, item: unknown) => {
    const { context } = get();
    if (!context) return;

    const updated = { ...context } as any;
    if (Array.isArray(updated[sectionKey])) {
      updated[sectionKey] = [...updated[sectionKey], item];
    }
    updated.lastUpdated = new Date().toISOString();

    set({ context: updated, isDirty: true });
    scheduleAutosave(get);
  },

  removeArrayItem: (sectionKey: string, index: number) => {
    const { context } = get();
    if (!context) return;

    const updated = { ...context } as any;
    if (Array.isArray(updated[sectionKey])) {
      updated[sectionKey] = updated[sectionKey].filter((_: any, i: number) => i !== index);
    }
    updated.lastUpdated = new Date().toISOString();

    set({ context: updated, isDirty: true });
    scheduleAutosave(get);
  },

  saveContext: () => {
    const { context } = get();
    if (!context) return;

    const now = new Date().toISOString();
    const toSave = { ...context, lastUpdated: now };
    const saved = saveCompanyContext(toSave);
    set({
      context: saved,
      contexts: loadCompanyContexts(),
      isDirty: false,
      lastSavedAt: now,
    });
  },

  clearContext: () => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    // Only clear active selection — saved contexts remain in storage
    clearCompanyContext();
    set({ context: null, isDirty: false, lastSavedAt: null });
  },

  deleteContext: (id: string) => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    deleteCompanyContext(id);
    const { context } = get();
    // If we deleted the active context, clear it in state too
    if (context?.id === id) {
      set({ context: null, isDirty: false, lastSavedAt: null });
    }
    set({ contexts: loadCompanyContexts() });
  },

  setGenerating: (v: boolean) => {
    set({ isGenerating: v });
  },
}));

// Flush pending autosave before window closes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushAutosave(useCompanyContextStore.getState);
  });
}
