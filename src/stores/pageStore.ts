/**
 * Page Store — Zustand store for saved page state management.
 * Mirrors briefStore.ts pattern.
 */

import { create } from 'zustand';
import type { SavedPage } from '../types/page';
import { localPageStorage } from '../services/pageStorage';

interface PageState {
  pages: SavedPage[];
  loadPages: () => void;
  savePage: (page: SavedPage) => void;
  deletePage: (id: string) => void;
  updatePageDescription: (id: string, description: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  pages: localPageStorage.listPages(),

  loadPages: () => {
    const pages = localPageStorage.listPages();
    set({ pages });
  },

  savePage: (page: SavedPage) => {
    localPageStorage.savePage(page);
    const pages = localPageStorage.listPages();
    set({ pages });
  },

  deletePage: (id: string) => {
    localPageStorage.deletePage(id);
    const pages = localPageStorage.listPages();
    set({ pages });
  },

  updatePageDescription: (id: string, description: string) => {
    const page = localPageStorage.getPage(id);
    if (!page) return;
    page.description = description;
    page.updatedAt = new Date().toISOString();
    localPageStorage.savePage(page);
    const pages = localPageStorage.listPages();
    set({ pages });
  },
}));
