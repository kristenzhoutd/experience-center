/**
 * Report Store — Zustand store for AI-generated reports.
 * Holds the latest generated report, generation state,
 * and a history of saved reports persisted to localStorage.
 */

import { create } from 'zustand';
import type { ReportOutput } from '../services/skillParsers';

const STORAGE_KEY = 'ai-suites:saved-reports';

export interface SavedReport {
  id: string;
  templateId: string;
  templateName: string;
  report: ReportOutput;
  createdAt: string;
}

function readSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSavedReports(reports: SavedReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

interface ReportState {
  generatedReport: ReportOutput | null;
  isGenerating: boolean;
  savedReports: SavedReport[];

  setReport: (report: ReportOutput) => void;
  clearReport: () => void;
  setGenerating: (generating: boolean) => void;

  loadReports: () => void;
  saveReport: (templateId: string, templateName: string, report: ReportOutput) => string;
  getReport: (id: string) => SavedReport | undefined;
  deleteReport: (id: string) => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  generatedReport: null,
  isGenerating: false,
  savedReports: readSavedReports(),

  setReport: (report) => set({ generatedReport: report }),
  clearReport: () => set({ generatedReport: null }),
  setGenerating: (generating) => set({ isGenerating: generating }),

  loadReports: () => {
    set({ savedReports: readSavedReports() });
  },

  saveReport: (templateId, templateName, report) => {
    const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const saved: SavedReport = {
      id,
      templateId,
      templateName,
      report,
      createdAt: new Date().toISOString(),
    };
    const all = [saved, ...readSavedReports()];
    writeSavedReports(all);
    set({ savedReports: all });
    return id;
  },

  getReport: (id) => {
    return get().savedReports.find((r) => r.id === id);
  },

  deleteReport: (id) => {
    const filtered = readSavedReports().filter((r) => r.id !== id);
    writeSavedReports(filtered);
    set({ savedReports: filtered });
  },
}));
