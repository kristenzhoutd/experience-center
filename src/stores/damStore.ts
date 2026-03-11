/**
 * DAM Store — Zustand store for the Digital Asset Management browser.
 * Manages provider selection, search, filters, and asset selection state.
 */

import { create } from 'zustand';
import type { DAMAsset, DAMFilter, DAMProvider } from '../types/dam';
import { damService } from '../services/damService';

interface DAMState {
  // Modal state
  isOpen: boolean;
  targetCreativeLocalId: string | null;

  // Providers
  providers: DAMProvider[];
  activeProvider: 'aem' | 'bynder';

  // Assets & loading
  assets: DAMAsset[];
  loading: boolean;

  // Search & filters
  searchQuery: string;
  filters: DAMFilter;
  collections: string[];

  // Selection
  selectedAsset: DAMAsset | null;

  // Actions
  open: (creativeLocalId: string) => void;
  close: () => void;
  setActiveProvider: (provider: 'aem' | 'bynder') => void;
  setSearchQuery: (query: string) => void;
  setFilter: <K extends keyof DAMFilter>(key: K, value: DAMFilter[K]) => void;
  clearFilters: () => void;
  searchAssets: () => Promise<void>;
  selectAsset: (asset: DAMAsset | null) => void;
  loadProviders: () => Promise<void>;
  loadCollections: () => Promise<void>;
}

const emptyFilters: DAMFilter = {
  type: null,
  aspectRatio: null,
  usageRights: null,
  collection: null,
};

export const useDamStore = create<DAMState>((set, get) => ({
  isOpen: false,
  targetCreativeLocalId: null,

  providers: [],
  activeProvider: 'aem',

  assets: [],
  loading: false,

  searchQuery: '',
  filters: { ...emptyFilters },
  collections: [],

  selectedAsset: null,

  open: (creativeLocalId) => {
    set({
      isOpen: true,
      targetCreativeLocalId: creativeLocalId,
      searchQuery: '',
      filters: { ...emptyFilters },
      selectedAsset: null,
      activeProvider: 'aem',
    });
    // Load data on open
    get().loadProviders();
    get().loadCollections();
    get().searchAssets();
  },

  close: () => {
    set({
      isOpen: false,
      targetCreativeLocalId: null,
      selectedAsset: null,
      assets: [],
      searchQuery: '',
      filters: { ...emptyFilters },
    });
  },

  setActiveProvider: (provider) => {
    set({ activeProvider: provider, selectedAsset: null });
    get().loadCollections();
    get().searchAssets();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFilter: (key, value) => {
    set((s) => ({
      filters: { ...s.filters, [key]: value },
      selectedAsset: null,
    }));
    get().searchAssets();
  },

  clearFilters: () => {
    set({ filters: { ...emptyFilters }, selectedAsset: null });
    get().searchAssets();
  },

  searchAssets: async () => {
    const { searchQuery, activeProvider, filters } = get();
    set({ loading: true });
    try {
      const results = await damService.searchAssets(searchQuery, activeProvider, filters);
      set({ assets: results, loading: false });
    } catch {
      set({ assets: [], loading: false });
    }
  },

  selectAsset: (asset) => {
    set({ selectedAsset: asset });
  },

  loadProviders: async () => {
    try {
      const providers = await damService.getProviders();
      set({ providers });
    } catch {
      // Providers stay empty
    }
  },

  loadCollections: async () => {
    const { activeProvider } = get();
    try {
      const collections = await damService.getCollections(activeProvider);
      set({ collections });
    } catch {
      set({ collections: [] });
    }
  },
}));
