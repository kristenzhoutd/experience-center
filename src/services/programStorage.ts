/**
 * Program Storage Service — storage-backed CRUD for PaidMediaProgram.
 * Follows the same pattern as launchConfigStorage.ts.
 */

import type { PaidMediaProgram } from '../types/program';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'paid-media-suite:programs';

function readAll(): PaidMediaProgram[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(programs: PaidMediaProgram[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

export const programStorage = {
  listPrograms(): PaidMediaProgram[] {
    return readAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getProgram(id: string): PaidMediaProgram | null {
    return readAll().find((p) => p.id === id) ?? null;
  },

  saveProgram(program: PaidMediaProgram): void {
    const all = readAll();
    const idx = all.findIndex((p) => p.id === program.id);
    if (idx >= 0) {
      all[idx] = program;
    } else {
      all.push(program);
    }
    writeAll(all);
  },

  deleteProgram(id: string): void {
    writeAll(readAll().filter((p) => p.id !== id));
  },
};
