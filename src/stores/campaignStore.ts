/**
 * Campaign Store — Zustand store for campaign list management.
 * Handles campaign listing, filtering, and sorting.
 */

import { create } from 'zustand';
import type {
  Campaign,
  CampaignStats,
  CampaignFilters,
  OptimizationOpportunity,
} from '../types/campaign';

interface CampaignState {
  campaigns: Campaign[];
  stats: CampaignStats;
  filters: CampaignFilters;
  opportunities: OptimizationOpportunity[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list' | 'calendar';

  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  setStats: (stats: CampaignStats) => void;
  setFilters: (filters: Partial<CampaignFilters>) => void;
  clearFilters: () => void;
  setOpportunities: (opportunities: OptimizationOpportunity[]) => void;
  dismissOpportunity: (id: string) => void;
  setViewMode: (mode: 'grid' | 'list' | 'calendar') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getFilteredCampaigns: () => Campaign[];
}

const defaultStats: CampaignStats = {
  activeCampaigns: 0,
  needsAttention: 0,
  overBudget: 0,
  launchingThisWeek: 0,
  activeCampaignsChange: 0,
  needsAttentionChange: 0,
  overBudgetChange: 0,
  launchingThisWeekChange: 0,
};

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  stats: defaultStats,
  filters: {},
  opportunities: [],
  isLoading: false,
  error: null,
  viewMode: 'grid',

  setCampaigns: (campaigns) => set({ campaigns }),
  setStats: (stats) => set({ stats }),

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearFilters: () => set({ filters: {} }),

  setOpportunities: (opportunities) => set({ opportunities }),

  dismissOpportunity: (id) =>
    set((state) => ({
      opportunities: state.opportunities.map((o) =>
        o.id === id ? { ...o, status: 'dismissed' as const } : o
      ),
    })),

  setViewMode: (mode) => set({ viewMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getFilteredCampaigns: () => {
    const { campaigns, filters } = get();
    let result = [...campaigns];

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter((c) => statuses.includes(c.status));
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      result = result.filter((c) => types.includes(c.type));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (filters.channel) {
      const channels = Array.isArray(filters.channel) ? filters.channel : [filters.channel];
      result = result.filter((c) =>
        c.channels.some((ch) => channels.includes(ch))
      );
    }

    // Sorting
    if (filters.sort) {
      result.sort((a, b) => {
        switch (filters.sort) {
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          case 'spend_asc': return a.spent - b.spent;
          case 'spend_desc': return b.spent - a.spent;
          case 'roas_asc': return a.metrics.roas - b.metrics.roas;
          case 'roas_desc': return b.metrics.roas - a.metrics.roas;
          case 'date_asc': return a.startDate.localeCompare(b.startDate);
          case 'date_desc': return b.startDate.localeCompare(a.startDate);
          default: return 0;
        }
      });
    }

    return result;
  },
}));
