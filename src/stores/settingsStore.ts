import { create } from 'zustand';

export interface ParentSegment {
  id: string;
  name: string;
  count: string | null;
  description: string;
  masterTable?: string;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadSettings: () => Promise<void>;

  // Dashboard view toggle (Command Center)
  dashboardView: 'manager' | 'cmo';
  setDashboardView: (view: 'manager' | 'cmo') => void;

  // Parent segments (shared across Layout and wizard)
  parentSegments: ParentSegment[];
  selectedParentSegmentId: string | null;
  isLoadingParentSegments: boolean;
  parentSegmentError: string | null;
  fetchParentSegments: () => Promise<void>;
  refetchParentSegments: () => Promise<void>;
  selectParentSegment: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',

  setTheme: (theme) => {
    set({ theme });
  },

  loadSettings: async () => {
    // Settings will be loaded from electron main process via IPC
    // For now, use defaults
    set({ theme: 'system' });
  },

  // Dashboard view
  dashboardView: 'manager',
  setDashboardView: (view) => {
    set({ dashboardView: view });
  },

  // Parent segments
  parentSegments: [],
  selectedParentSegmentId: null,
  isLoadingParentSegments: false,
  parentSegmentError: null,

  fetchParentSegments: async () => {
    // Skip if already loaded or currently loading
    if (get().parentSegments.length > 0 || get().isLoadingParentSegments) return;

    const api = (window as any).aiSuites?.settings;
    if (!api?.parentSegments) {
      set({ parentSegmentError: 'Parent segments API is not available', isLoadingParentSegments: false });
      return;
    }

    set({ isLoadingParentSegments: true, parentSegmentError: null });
    try {
      // Load saved settings to restore previous selection
      const savedSettings = await api.get();
      const savedSelectionId = (savedSettings as Record<string, unknown>)?.selectedParentSegmentId as string | undefined;

      const result = await api.parentSegments();
      if (result.success && result.data) {
        // Restore saved selection if it exists in the fetched segments, otherwise default to first
        const hasMatch = savedSelectionId && result.data.some((s: ParentSegment) => String(s.id) === String(savedSelectionId));
        set({
          parentSegments: result.data,
          selectedParentSegmentId: hasMatch ? savedSelectionId! : (result.data.length > 0 ? result.data[0].id : null),
          isLoadingParentSegments: false,
        });
      } else {
        set({
          parentSegmentError: result.error || 'Failed to load parent segments',
          isLoadingParentSegments: false,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load parent segments';
      console.error('Failed to fetch parent segments:', error);
      set({ parentSegmentError: msg, isLoadingParentSegments: false });
    }
  },

  refetchParentSegments: async () => {
    set({ parentSegments: [], selectedParentSegmentId: null, isLoadingParentSegments: false, parentSegmentError: null });
    await get().fetchParentSegments();
  },

  selectParentSegment: (id: string) => {
    set({ selectedParentSegmentId: id });
    // Persist selection to disk so it survives restarts
    window.aiSuites?.settings?.set({ selectedParentSegmentId: id });
  },
}));
