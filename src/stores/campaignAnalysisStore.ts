/**
 * Campaign Analysis Store — Zustand store for AI-generated campaign analyses.
 * Holds the latest analysis, generation state,
 * and a history of saved analyses persisted to storage.
 */

import { create } from 'zustand';
import { storage } from '../utils/storage';
import type { CampaignAnalysisOutput } from '../types/campaignAnalysis';

const STORAGE_KEY = 'ai-suites:saved-analyses';

export interface SavedAnalysis {
  id: string;
  campaignId: string;
  campaignName: string;
  analysis: CampaignAnalysisOutput;
  createdAt: string;
}

function readSavedAnalyses(): SavedAnalysis[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSavedAnalyses(analyses: SavedAnalysis[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(analyses));
}

interface CampaignAnalysisState {
  currentAnalysis: CampaignAnalysisOutput | null;
  isAnalyzing: boolean;
  savedAnalyses: SavedAnalysis[];

  setAnalysis: (analysis: CampaignAnalysisOutput) => void;
  clearAnalysis: () => void;
  setAnalyzing: (analyzing: boolean) => void;

  loadAnalyses: () => void;
  saveAnalysis: (campaignId: string, campaignName: string, analysis: CampaignAnalysisOutput) => string;
  getAnalysis: (id: string) => SavedAnalysis | undefined;
  deleteAnalysis: (id: string) => void;
}

export const useCampaignAnalysisStore = create<CampaignAnalysisState>((set, get) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  savedAnalyses: readSavedAnalyses(),

  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  clearAnalysis: () => set({ currentAnalysis: null }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  loadAnalyses: () => {
    set({ savedAnalyses: readSavedAnalyses() });
  },

  saveAnalysis: (campaignId, campaignName, analysis) => {
    const id = `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const saved: SavedAnalysis = {
      id,
      campaignId,
      campaignName,
      analysis,
      createdAt: new Date().toISOString(),
    };
    const all = [saved, ...readSavedAnalyses()];
    writeSavedAnalyses(all);
    set({ savedAnalyses: all });
    return id;
  },

  getAnalysis: (id) => {
    return get().savedAnalyses.find((a) => a.id === id);
  },

  deleteAnalysis: (id) => {
    const filtered = readSavedAnalyses().filter((a) => a.id !== id);
    writeSavedAnalyses(filtered);
    set({ savedAnalyses: filtered });
  },
}));
