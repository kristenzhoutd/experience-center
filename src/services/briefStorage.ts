/**
 * Brief Storage Service — localStorage-backed CRUD for CampaignBrief.
 * Interface is swappable to IndexedDB or API later.
 */

import type { CampaignBrief } from '../types/brief';

const STORAGE_KEY = 'paid-media-suite:briefs';

export interface BriefStorageService {
  listBriefs(): CampaignBrief[];
  getBrief(id: string): CampaignBrief | null;
  saveBrief(brief: CampaignBrief): void;
  deleteBrief(id: string): void;
  duplicateBrief(id: string): CampaignBrief | null;
}

function readAll(): CampaignBrief[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(briefs: CampaignBrief[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(briefs));
}

export const localBriefStorage: BriefStorageService = {
  listBriefs(): CampaignBrief[] {
    return readAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getBrief(id: string): CampaignBrief | null {
    return readAll().find((b) => b.id === id) ?? null;
  },

  saveBrief(brief: CampaignBrief): void {
    const all = readAll();
    const idx = all.findIndex((b) => b.id === brief.id);
    if (idx >= 0) {
      all[idx] = brief;
    } else {
      all.push(brief);
    }
    writeAll(all);
  },

  deleteBrief(id: string): void {
    writeAll(readAll().filter((b) => b.id !== id));
  },

  duplicateBrief(id: string): CampaignBrief | null {
    const original = this.getBrief(id);
    if (!original) return null;

    const clone = structuredClone(original);
    clone.id = `brief-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    clone.name = `${original.name} (Copy)`;
    clone.createdAt = new Date().toISOString();
    clone.updatedAt = new Date().toISOString();
    clone.status = 'draft';

    this.saveBrief(clone);
    return clone;
  },
};
