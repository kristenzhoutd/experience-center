/**
 * Campaign Config Storage — storage-backed CRUD for CampaignConfig.
 * Follows the same pattern as briefStorage.ts.
 *
 * Includes schema migration so older drafts are upgraded automatically.
 */

import type {
  CampaignConfig,
  CampaignSetupData,
  AudiencesStepData,
  ContentStepData,
  ReviewStepData,
} from '../types/campaignConfig';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'personalization-studio:campaign-configs';

/** Bump this whenever the CampaignConfig shape changes. */
export const CURRENT_SCHEMA_VERSION = 3;

/** Default field values — used to backfill missing properties on load. */
const DEFAULT_SETUP: CampaignSetupData = {
  name: '',
  objective: '',
  businessGoal: '',
  goalType: 'conversion',
  startDate: '',
  endDate: '',
  primaryKpi: '',
  secondaryKpis: [],
};

const DEFAULT_AUDIENCES: AudiencesStepData = {
  parentSegmentId: '',
  segments: [],
};

const DEFAULT_CONTENT: ContentStepData = {
  pages: [],
};

const DEFAULT_REVIEW: ReviewStepData = {
  trafficAllocation: 100,
  priority: 50,
  notes: '',
};

/**
 * Migrate a raw config object (possibly from an older schema) to the
 * latest CampaignConfig shape.  Missing fields are filled with defaults.
 */
function migrateConfig(raw: Record<string, unknown>, index: number): CampaignConfig {
  const now = new Date().toISOString();

  // Migrate content from old schema (placements/variants) to new schema (pages)
  let contentData: ContentStepData = { ...DEFAULT_CONTENT };
  const rawContent = raw.content as Record<string, unknown> | undefined;

  if (rawContent) {
    // Check if it's the new format (has 'pages' array)
    if (Array.isArray(rawContent.pages)) {
      contentData = { pages: rawContent.pages as ContentStepData['pages'] };
    }
    // Old format: had 'placements' and 'variants' — migrate to empty pages
    // (old placement data can't be mapped to real Pages step data)
    // The content will be re-populated when the user enters Step 3
  }

  // Derive rank: use existing rank or fall back to index+1
  const existingRank = typeof raw.rank === 'number' ? raw.rank : undefined;
  const rank = existingRank ?? (index + 1);

  const config: CampaignConfig = {
    id: (raw.id as string) ?? '',
    briefId: (raw.briefId as string) ?? '',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    status: (raw.status as CampaignConfig['status']) ?? 'draft',
    currentStep: (raw.currentStep as CampaignConfig['currentStep']) ?? 1,
    rank,
    createdAt: (raw.createdAt as string) ?? now,
    updatedAt: (raw.updatedAt as string) ?? now,
    setup: { ...DEFAULT_SETUP, ...((raw.setup as Partial<CampaignSetupData>) ?? {}) },
    audiences: { ...DEFAULT_AUDIENCES, ...((raw.audiences as Partial<AudiencesStepData>) ?? {}) },
    content: contentData,
    review: { ...DEFAULT_REVIEW, ...((raw.review as Partial<ReviewStepData>) ?? {}) },
  };

  return config;
}

function readAll(): CampaignConfig[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(configs: CampaignConfig[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

/**
 * Read all configs and migrate any that are out-of-date.
 * Re-saves migrated entries so migration only runs once per draft.
 */
function readAllMigrated(): CampaignConfig[] {
  const raw = readAll() as unknown as Record<string, unknown>[];
  let didMigrate = false;

  const migrated = raw.map((entry, index) => {
    if ((entry as { schemaVersion?: number }).schemaVersion !== CURRENT_SCHEMA_VERSION) {
      didMigrate = true;
      return migrateConfig(entry, index);
    }
    return entry as unknown as CampaignConfig;
  });

  if (didMigrate) {
    writeAll(migrated);
  }

  return migrated;
}

export const campaignConfigStorage = {
  listConfigs(): CampaignConfig[] {
    return readAllMigrated().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getConfig(id: string): CampaignConfig | null {
    const all = readAllMigrated();
    return all.find((c) => c.id === id) ?? null;
  },

  saveConfig(config: CampaignConfig): void {
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

  saveAllConfigs(configs: CampaignConfig[]): void {
    writeAll(configs);
  },
};
