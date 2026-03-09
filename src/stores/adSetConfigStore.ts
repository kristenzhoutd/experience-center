/**
 * Ad Set Config Store — Zustand store for AI-generated ad set configuration variants.
 * Transient state (no localStorage persistence). Mirrors blueprintStore pattern.
 */

import { create } from 'zustand';

// ============ Types ============

export interface AdSetTargeting {
  countries: string[];
  ageMin: number;
  ageMax: number;
}

export interface AdSetConfig {
  id: string;
  name: string;
  variant: 'conservative' | 'balanced' | 'aggressive';
  confidence: 'High' | 'Medium' | 'Low';
  dailyBudget: number;
  optimizationGoal: string;
  billingEvent: string;
  targeting: AdSetTargeting;
  status: string;
  rationale: string;
  estimatedMetrics: {
    dailyReach: string;
    estimatedCtr: string;
    estimatedCpa: string;
    estimatedConversions: string;
  };
  createdAt: string;
}

interface CampaignContext {
  campaignId: string;
  campaignName: string;
}

interface AdSetConfigState {
  configs: AdSetConfig[];
  selectedConfigId: string | null;
  hasGeneratedConfigs: boolean;
  approvedConfigId: string | null;
  campaignContext: CampaignContext | null;
  isCreating: boolean;
  createError: string | null;
  createdAdSetId: string | null;

  // Actions
  addConfigs: (configs: AdSetConfig[]) => void;
  selectConfig: (id: string | null) => void;
  updateConfig: (id: string, updates: Partial<AdSetConfig>) => void;
  setApprovedConfigId: (id: string | null) => void;
  setCampaignContext: (ctx: CampaignContext) => void;
  setCreating: (creating: boolean) => void;
  setCreateError: (error: string | null) => void;
  setCreatedAdSetId: (id: string | null) => void;
  clearAll: () => void;
}

// ============ Store ============

export const useAdSetConfigStore = create<AdSetConfigState>((set) => ({
  configs: [],
  selectedConfigId: null,
  hasGeneratedConfigs: false,
  approvedConfigId: null,
  campaignContext: null,
  isCreating: false,
  createError: null,
  createdAdSetId: null,

  addConfigs: (configs) => {
    // Auto-select the balanced variant
    const balanced = configs.find((c) => c.variant === 'balanced');
    set({
      configs,
      selectedConfigId: balanced?.id || configs[0]?.id || null,
      hasGeneratedConfigs: true,
    });
  },

  selectConfig: (id) => {
    set({ selectedConfigId: id });
  },

  updateConfig: (id, updates) => {
    set((state) => ({
      configs: state.configs.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  setApprovedConfigId: (id) => {
    set({ approvedConfigId: id });
  },

  setCampaignContext: (ctx) => {
    set({ campaignContext: ctx });
  },

  setCreating: (creating) => {
    set({ isCreating: creating });
  },

  setCreateError: (error) => {
    set({ createError: error });
  },

  setCreatedAdSetId: (id) => {
    set({ createdAdSetId: id });
  },

  clearAll: () => {
    set({
      configs: [],
      selectedConfigId: null,
      hasGeneratedConfigs: false,
      approvedConfigId: null,
      campaignContext: null,
      isCreating: false,
      createError: null,
      createdAdSetId: null,
    });
  },
}));
