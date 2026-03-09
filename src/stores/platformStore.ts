/**
 * Platform Store — Zustand store for ad platform connection management.
 * Tracks Meta, Google, and TikTok platform connection states.
 */

import { create } from 'zustand';
import type { PlatformConnection, PlatformType } from '../../electron/utils/ipc-types';
import type { LiveCampaign } from '../types/optimize';

interface PlatformState {
  connections: PlatformConnection[];
  isLoading: boolean;
  error: string | null;

  // Campaign data
  campaigns: LiveCampaign[];
  isFetchingCampaigns: boolean;
  lastFetchedAt: number | null;
  campaignsError: string | null;

  // Actions
  setConnections: (connections: PlatformConnection[]) => void;
  updateConnection: (platform: PlatformType, updates: Partial<PlatformConnection>) => void;
  fetchStatus: () => Promise<void>;
  connect: (platform: PlatformType, credentials: Record<string, string>) => Promise<boolean>;
  disconnect: (platform: PlatformType) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCampaigns: (campaigns: LiveCampaign[]) => void;
  fetchCampaigns: (platform: PlatformType) => Promise<void>;
}

const defaultConnections: PlatformConnection[] = [
  { platform: 'meta', connected: false },
  { platform: 'google', connected: false },
  { platform: 'tiktok', connected: false },
];

export const usePlatformStore = create<PlatformState>((set, get) => ({
  connections: defaultConnections,
  isLoading: false,
  error: null,
  campaigns: [],
  isFetchingCampaigns: false,
  lastFetchedAt: null,
  campaignsError: null,

  setConnections: (connections) => set({ connections }),

  updateConnection: (platform, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.platform === platform ? { ...c, ...updates } : c
      ),
    })),

  fetchStatus: async () => {
    const api = window.aiSuites?.platforms;
    if (!api) return;

    set({ isLoading: true, error: null });
    try {
      const result = await api.status();
      if (result.success && result.data) {
        set({ connections: result.data as PlatformConnection[], isLoading: false });
      } else {
        set({ error: result.error || 'Failed to fetch platform status', isLoading: false });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
    }
  },

  connect: async (platform, credentials) => {
    const api = window.aiSuites?.platforms;
    if (!api) return false;

    set({ isLoading: true, error: null });
    try {
      const result = await api.connect(platform, credentials);
      if (result.success) {
        get().updateConnection(platform, { connected: true });
        set({ isLoading: false });
        return true;
      } else {
        set({ error: result.error || 'Connection failed', isLoading: false });
        return false;
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
      return false;
    }
  },

  disconnect: async (platform) => {
    const api = window.aiSuites?.platforms;
    if (!api) return false;

    set({ isLoading: true, error: null });
    try {
      const result = await api.disconnect(platform);
      if (result.success) {
        get().updateConnection(platform, { connected: false, accountName: undefined, accountId: undefined });
        set({ isLoading: false });
        return true;
      } else {
        set({ error: result.error || 'Disconnect failed', isLoading: false });
        return false;
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
      return false;
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setCampaigns: (campaigns) => set({ campaigns }),

  fetchCampaigns: async (_platform) => {
    const api = window.aiSuites?.campaigns;
    if (!api) return;

    set({ isFetchingCampaigns: true, campaignsError: null });
    try {
      const result = await api.list();
      if (result.success && result.data) {
        set({
          campaigns: result.data as LiveCampaign[],
          isFetchingCampaigns: false,
          lastFetchedAt: Date.now(),
        });
      } else {
        set({
          campaignsError: result.error || 'Failed to fetch campaigns',
          isFetchingCampaigns: false,
        });
      }
    } catch (e) {
      set({
        campaignsError: e instanceof Error ? e.message : 'Unknown error',
        isFetchingCampaigns: false,
      });
    }
  },
}));
