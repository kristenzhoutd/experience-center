/**
 * Page Storage Service — localStorage-backed CRUD for SavedPage.
 * Mirrors briefStorage.ts pattern.
 */

import type { SavedPage } from '../types/page';

const STORAGE_KEY = 'paid-media-suite:pages';

function readAll(): SavedPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(pages: SavedPage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export const localPageStorage = {
  listPages(): SavedPage[] {
    return readAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getPage(id: string): SavedPage | null {
    return readAll().find((p) => p.id === id) ?? null;
  },

  savePage(page: SavedPage): void {
    const all = readAll();
    const idx = all.findIndex((p) => p.id === page.id);
    if (idx >= 0) {
      all[idx] = page;
    } else {
      all.push(page);
    }
    writeAll(all);
  },

  deletePage(id: string): void {
    writeAll(readAll().filter((p) => p.id !== id));
  },
};
