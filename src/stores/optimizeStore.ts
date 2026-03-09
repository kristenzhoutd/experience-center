/**
 * Optimize Store — Zustand store for live campaign optimization data.
 * Manages in-flight campaign metrics, alerts, and optimization actions.
 */

import { create } from 'zustand';
import type {
  LiveCampaign,
  OptimizationAlert,
  OptimizationAction,
  OptimizationDashboardData,
  ChannelPerformance,
  AudienceSegment,
} from '../types/optimize';

// ── Store ────────────────────────────────────────────────────────────────────

interface OptimizeState {
  campaigns: LiveCampaign[];
  alerts: OptimizationAlert[];
  actions: OptimizationAction[];
  channelPerformance: ChannelPerformance[];
  audienceSegments: AudienceSegment[];
  summary: {
    totalBudget: number;
    totalSpent: number;
    overallRoas: number;
    totalConversions: number;
    activeCampaigns: number;
  };
  selectedCampaignId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // Actions
  setDashboardData: (data: OptimizationDashboardData) => void;
  setCampaigns: (campaigns: LiveCampaign[]) => void;
  setAlerts: (alerts: OptimizationAlert[]) => void;
  dismissAlert: (id: string) => void;
  addAction: (action: OptimizationAction) => void;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  selectCampaign: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchCampaigns: () => Promise<void>;
}

export const useOptimizeStore = create<OptimizeState>((set, get) => ({
  campaigns: [],
  alerts: [],
  actions: [],
  channelPerformance: [],
  audienceSegments: [],
  summary: {
    totalBudget: 0,
    totalSpent: 0,
    overallRoas: 0,
    totalConversions: 0,
    activeCampaigns: 0,
  },
  selectedCampaignId: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  setDashboardData: (data) =>
    set({
      campaigns: data.campaigns,
      alerts: data.alerts,
      channelPerformance: data.channelPerformance,
      audienceSegments: data.audienceSegments,
      summary: data.summary,
    }),

  setCampaigns: (campaigns) => set({ campaigns }),

  setAlerts: (alerts) => set({ alerts }),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, isDismissed: true } : a
      ),
    })),

  addAction: (action) =>
    set((state) => ({ actions: [...state.actions, action] })),

  approveAction: (id) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
    })),

  rejectAction: (id) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
    })),

  selectCampaign: (id) => set({ selectedCampaignId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchCampaigns: async () => {
    // Prevent concurrent fetches
    if (get().isLoading) return;
    // Skip if we fetched recently (within 5 minutes) to avoid Meta rate limits.
    // This applies even after errors so we don't hammer a rate-limited endpoint.
    const lastFetch = get().lastFetchedAt;
    if (lastFetch && Date.now() - lastFetch < 300_000) return;

    set({ isLoading: true, error: null });
    try {
      console.log('[OptimizeStore] Fetching campaigns...');
      const result = await window.aiSuites.campaigns.list();
      console.log('[OptimizeStore] API result:', result?.success, 'count:', result?.data?.length, 'error:', result?.error);

      if (result.success && result.data && result.data.length > 0) {
        const campaigns = result.data as LiveCampaign[];
        const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
        const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
        const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
        const overallRoas = totalSpent > 0
          ? campaigns.reduce((sum, c) => sum + (c.metrics?.roas || 0) * (c.spent || 0), 0) / totalSpent
          : 0;

        console.log('[OptimizeStore] Loaded', campaigns.length, 'real campaigns from Meta');
        set({
          campaigns,
          summary: { totalBudget, totalSpent, overallRoas, totalConversions, activeCampaigns },
          lastFetchedAt: Date.now(),
        });
        return;
      }

      // API returned no data — surface the error, do NOT inject demo data
      const errorMsg = result?.error || 'No campaigns returned from Meta';
      console.warn('[OptimizeStore] API returned no campaigns:', errorMsg);
      set({ error: errorMsg, lastFetchedAt: Date.now() });
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch campaigns';
      const isRateLimit = /rate.?limit|request.?limit|too.?many/i.test(msg);
      const userMsg = isRateLimit
        ? 'Meta API rate limit reached — try again in a few minutes.'
        : msg;
      console.warn('[OptimizeStore] Fetch failed:', msg);
      set({ error: userMsg, lastFetchedAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },
}));
