/**
 * Launch Config Storage Service — localStorage-backed CRUD for SavedLaunchConfig.
 * Follows the same pattern as briefStorage.ts.
 */

import type { SavedLaunchConfig } from '../types/campaignLaunch';

const STORAGE_KEY = 'paid-media-launch-configs';

function readAll(): SavedLaunchConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(configs: SavedLaunchConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (err) {
    // localStorage quota exceeded — strip previewUrl data URIs and retry
    console.warn('[LaunchConfigStorage] Save failed, stripping preview data URIs and retrying:', err);
    const stripped = configs.map((c) => ({
      ...c,
      config: {
        ...c.config,
        creatives: c.config.creatives.map((cr) =>
          cr.file ? { ...cr, file: { ...cr.file, previewUrl: '' } } : cr,
        ),
      },
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch (retryErr) {
      console.error('[LaunchConfigStorage] Save failed even after stripping previews:', retryErr);
    }
  }
}

export const launchConfigStorage = {
  listConfigs(): SavedLaunchConfig[] {
    return readAll().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getConfig(id: string): SavedLaunchConfig | null {
    return readAll().find((c) => c.id === id) ?? null;
  },

  saveConfig(config: SavedLaunchConfig): void {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      all[idx] = config;
    } else {
      all.push(config);
    }
    writeAll(all);
  },

  deleteConfig(id: string): void {
    writeAll(readAll().filter((c) => c.id !== id));
  },
};
