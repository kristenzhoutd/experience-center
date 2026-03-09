/**
 * Blueprint Store — Zustand store for campaign blueprint management.
 * Handles CRUD, versioning, and persistent file-based storage via Electron IPC.
 */

import { create } from 'zustand';
import type { Blueprint } from '../../electron/utils/ipc-types';

interface BlueprintState {
  blueprints: Blueprint[];
  selectedBlueprintId: string | null;
  isLoading: boolean;
  hasGeneratedPlan: boolean;
  approvedBlueprintId: string | null;

  // Actions
  loadBlueprints: () => Promise<void>;
  addBlueprints: (blueprints: Omit<Blueprint, 'createdAt' | 'updatedAt' | 'version'>[]) => void;
  updateBlueprint: (id: string, updates: Partial<Blueprint>) => void;
  deleteBlueprint: (id: string) => void;
  selectBlueprint: (id: string | null) => void;
  getBlueprint: (id: string) => Blueprint | undefined;
  setHasGeneratedPlan: (flag: boolean) => void;
  setApprovedBlueprintId: (id: string | null) => void;
  clearAll: () => void;
}

/** Save a single blueprint to disk via IPC */
async function persistBlueprint(blueprint: Blueprint): Promise<void> {
  try {
    if (window.aiSuites?.blueprints) {
      await window.aiSuites.blueprints.save(blueprint);
    }
  } catch (e) {
    console.error('[BlueprintStore] Failed to persist blueprint:', e);
  }
}

/** Delete a single blueprint from disk via IPC */
async function removePersistedBlueprint(id: string): Promise<void> {
  try {
    if (window.aiSuites?.blueprints) {
      await window.aiSuites.blueprints.delete(id);
    }
  } catch (e) {
    console.error('[BlueprintStore] Failed to delete persisted blueprint:', e);
  }
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprints: [],
  selectedBlueprintId: null,
  isLoading: false,
  hasGeneratedPlan: false,
  approvedBlueprintId: null,

  loadBlueprints: async () => {
    set({ isLoading: true });
    try {
      if (window.aiSuites?.blueprints) {
        const result = await window.aiSuites.blueprints.list();
        if (result.success && result.data) {
          set({ blueprints: result.data, isLoading: false });
          return;
        }
      }
    } catch (e) {
      console.error('[BlueprintStore] Failed to load blueprints via IPC:', e);
    }
    set({ isLoading: false });
  },

  addBlueprints: (newBlueprints) => {
    if (newBlueprints.length === 0) return;

    const now = new Date().toISOString();
    const ts = Date.now();
    const withMeta: Blueprint[] = newBlueprints.map((bp, i) => ({
      ...bp,
      // Ensure unique IDs across sessions — AI often reuses generic IDs like "bp-optimized-001"
      id: `${bp.id}-${ts}-${i}`,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }));

    set((state) => {
      // Merge: replace existing blueprints by ID, append new ones
      const existingMap = new Map(state.blueprints.map((bp) => [bp.id, bp]));
      for (const bp of withMeta) {
        existingMap.set(bp.id, bp);
      }
      const updated = Array.from(existingMap.values());

      // Persist each new/updated blueprint to disk
      for (const bp of withMeta) {
        persistBlueprint(bp);
      }

      return {
        blueprints: updated,
        selectedBlueprintId: withMeta[0]?.id || null,
        hasGeneratedPlan: true,
      };
    });
  },

  updateBlueprint: (id, updates) => {
    set((state) => {
      const updated = state.blueprints.map((bp) =>
        bp.id === id
          ? {
              ...bp,
              ...updates,
              updatedAt: new Date().toISOString(),
              version: bp.version + 1,
            }
          : bp
      );

      // Persist the updated blueprint to disk
      const updatedBp = updated.find((bp) => bp.id === id);
      if (updatedBp) {
        persistBlueprint(updatedBp);
      }

      return { blueprints: updated };
    });
  },

  deleteBlueprint: (id) => {
    set((state) => {
      const updated = state.blueprints.filter((bp) => bp.id !== id);

      // Remove from disk
      removePersistedBlueprint(id);

      return {
        blueprints: updated,
        selectedBlueprintId: state.selectedBlueprintId === id ? null : state.selectedBlueprintId,
      };
    });
  },

  selectBlueprint: (id) => {
    set({ selectedBlueprintId: id });
  },

  getBlueprint: (id) => {
    return get().blueprints.find((bp) => bp.id === id);
  },

  setHasGeneratedPlan: (flag) => {
    set({ hasGeneratedPlan: flag });
  },

  setApprovedBlueprintId: (id) => {
    set({ approvedBlueprintId: id });
  },

  clearAll: () => {
    // Only clear in-memory state; persisted blueprints on disk are preserved
    // so they remain available on the campaigns page across sessions
    set({ blueprints: [], selectedBlueprintId: null, hasGeneratedPlan: false, approvedBlueprintId: null });
  },
}));
