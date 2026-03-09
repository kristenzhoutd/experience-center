/**
 * Zustand store for the Campaign Launch flow.
 *
 * Manages the full hierarchy config (campaign → ad sets → creatives → ads),
 * drives the sequential launch execution, and tracks per-step progress.
 */

import { create } from 'zustand';
import type { Blueprint } from '../../electron/utils/ipc-types';
import type { LiveCampaign } from '../types/optimize';
import type { CampaignBriefData } from '../types/campaignBriefEditor';
import type { LaunchConfigOutput, LaunchConfigUpdateOutput } from '../services/skillParsers';
import type {
  CampaignLaunchConfig,
  LaunchCampaignConfig,
  LaunchAdSetConfig,
  LaunchAdCreativeConfig,
  LaunchAdConfig,
  LaunchProgress,
  LaunchStepResult,
  FacebookPage,
  CreativeFile,
  SavedLaunchConfig,
} from '../types/campaignLaunch';
import { launchConfigStorage } from '../services/launchConfigStorage';
import { useProgramStore } from './programStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

let nextLocalId = 1;
function localId(): string {
  return `local_${nextLocalId++}`;
}

function mapToMetaObjective(blueprint: Blueprint): string {
  const text = [
    blueprint.messaging,
    blueprint.cta,
    blueprint.creativeBrief?.primaryAngle,
    ...(blueprint.creativeBrief?.supportingMessages || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/awareness|reach|brand/.test(text)) return 'OUTCOME_AWARENESS';
  if (/leads?(\s|$|[^r])|lead\s*gen/.test(text)) return 'OUTCOME_LEADS';
  if (/engagement|video\s*views?|interact/.test(text)) return 'OUTCOME_ENGAGEMENT';
  // Sales, App Promotion, and unrecognised objectives fall back to Traffic
  // (Sales needs pixel, App Promotion needs app ID — not yet supported)
  if (/traffic|clicks?|visits?|website|sales|conversions?|purchase|revenue|roas|app|install/.test(text)) return 'OUTCOME_TRAFFIC';
  return 'OUTCOME_AWARENESS';
}

function parseBudgetToCents(amount: string): number {
  const num = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const multiplier = amount.toUpperCase().includes('M')
    ? 1_000_000
    : amount.toUpperCase().includes('K')
      ? 1_000
      : 1;
  return Math.round(num * multiplier * 100);
}

/** Strip Facebook page access tokens before persisting to localStorage. */
function stripTokens(config: CampaignLaunchConfig): CampaignLaunchConfig {
  return {
    ...config,
    facebookPages: config.facebookPages.map(({ access_token, ...rest }) => rest),
  };
}

/** Recover nextLocalId counter from existing local IDs in a config. */
function recoverNextLocalId(config: CampaignLaunchConfig): void {
  let max = 0;
  const extract = (id: string) => {
    const match = id.match(/^local_(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  };
  config.adSets.forEach((a) => extract(a.localId));
  config.creatives.forEach((c) => extract(c.localId));
  config.ads.forEach((a) => extract(a.localId));
  nextLocalId = max + 1;
}

function defaultProgress(): LaunchProgress {
  return {
    overallStatus: 'idle',
    currentStep: null,
    stepResults: [
      { step: 'createCampaign', label: 'Create Campaign', status: 'pending' },
      { step: 'createAdSets', label: 'Create Ad Sets', status: 'pending' },
      { step: 'uploadImages', label: 'Upload Images', status: 'pending' },
      { step: 'createAdCreatives', label: 'Create Ad Creatives', status: 'pending' },
      { step: 'createAds', label: 'Create Ads', status: 'pending' },
      { step: 'activateAudience', label: 'Activate Audience via LiveRamp', status: 'pending' },
    ],
    adSetIdMap: {},
    creativeIdMap: {},
    adIdMap: {},
  };
}

// ── Store interface ──────────────────────────────────────────────────────────

interface CampaignLaunchState {
  config: CampaignLaunchConfig;
  progress: LaunchProgress;
  isInitialized: boolean;
  isEditMode: boolean;
  platformCampaignId: string | null;
  savedConfigId: string | null;
  savedConfigs: SavedLaunchConfig[];
  isGeneratingConfig: boolean;
  sourceBlueprintId: string | null;
  /** Program this launch config belongs to (if created within a program workflow) */
  programId: string | null;
  /** Per-creative AI image generation status */
  imageGenStatus: Record<string, 'pending' | 'generating' | 'success' | 'error'>;
  /** Whether auto-generation of images is in progress */
  isAutoGeneratingImages: boolean;

  // Init
  initFromLiveCampaign: (campaign: LiveCampaign) => Promise<void>;
  initFromBlueprint: (blueprint: Blueprint, brief?: Partial<CampaignBriefData>) => Promise<void>;
  initFromSavedConfig: (id: string) => void;
  initFromSkillOutput: (output: LaunchConfigOutput, blueprintId?: string) => Promise<void>;

  // AI-driven updates
  applySkillUpdate: (update: LaunchConfigUpdateOutput) => void;
  setGeneratingConfig: (v: boolean) => void;

  // Saved config management
  loadSavedConfigs: () => void;
  saveCurrentConfig: (name?: string) => void;
  deleteSavedConfig: (id: string) => void;

  // Campaign edits
  updateCampaign: (updates: Partial<LaunchCampaignConfig>) => void;

  // Ad Set edits
  updateAdSet: (localId: string, updates: Partial<LaunchAdSetConfig>) => void;
  addAdSet: () => void;
  removeAdSet: (localId: string) => void;

  // Creative edits
  updateCreative: (localId: string, updates: Partial<LaunchAdCreativeConfig>) => void;
  addCreative: () => void;
  removeCreative: (localId: string) => void;
  attachFile: (creativeLocalId: string, file: CreativeFile) => void;
  removeFile: (creativeLocalId: string) => void;

  // Ad edits
  updateAd: (localId: string, updates: Partial<LaunchAdConfig>) => void;
  addAd: () => void;
  removeAd: (localId: string) => void;

  // Pages
  setFacebookPages: (pages: FacebookPage[]) => void;

  // Execution
  executeLaunch: () => Promise<void>;
  executeUpdate: () => Promise<void>;

  // AI Image Generation
  autoGenerateAllImages: () => Promise<void>;

  // Reset
  reset: () => void;
}

// ── Default config ───────────────────────────────────────────────────────────

function defaultConfig(): CampaignLaunchConfig {
  return {
    campaign: {
      name: '',
      objective: 'OUTCOME_AWARENESS',
      dailyBudget: 1000,
      status: 'PAUSED',
      specialAdCategories: [],
      buyingType: 'AUCTION',
    },
    adSets: [],
    creatives: [],
    ads: [],
    facebookPages: [],
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useCampaignLaunchStore = create<CampaignLaunchState>((set, get) => ({
  config: defaultConfig(),
  progress: defaultProgress(),
  isInitialized: false,
  isEditMode: false,
  platformCampaignId: null,
  savedConfigId: null,
  savedConfigs: [],
  isGeneratingConfig: false,
  sourceBlueprintId: null,
  programId: null,
  imageGenStatus: {},
  isAutoGeneratingImages: false,

  // ── Init from live campaign (edit mode) ──────────────────────────────────

  initFromLiveCampaign: async (campaign) => {
    nextLocalId = 1;

    // campaign.budget is the daily budget in dollars from Meta.
    // When 0 (ad-set level budgets), estimate from total spend / days elapsed.
    let dailyBudgetDollars = campaign.budget || 0;
    if (dailyBudgetDollars === 0 && campaign.spent > 0) {
      const start = campaign.startDate ? new Date(campaign.startDate) : null;
      const daysElapsed = start ? Math.max(1, Math.round((Date.now() - start.getTime()) / 86400000)) : 30;
      dailyBudgetDollars = Math.round(campaign.spent / daysElapsed);
    }
    const dailyBudget = Math.round(dailyBudgetDollars * 100);

    const launchCampaign: LaunchCampaignConfig = {
      name: campaign.name,
      objective: 'OUTCOME_AWARENESS',
      dailyBudget,
      status: campaign.status === 'active' ? 'ACTIVE' : 'PAUSED',
      specialAdCategories: [],
      buyingType: 'AUCTION',
    };

    const adGroups = campaign.adGroups || [];
    const adSets: LaunchAdSetConfig[] = adGroups.length > 0
      ? adGroups.map((ag) => ({
          localId: localId(),
          name: ag.name,
          dailyBudget: Math.round(dailyBudget / adGroups.length),
          optimizationGoal: 'REACH',
          billingEvent: 'IMPRESSIONS',
          targeting: {
            geoLocations: { countries: ['US'] },
            ageMin: 18,
            ageMax: 65,
          },
          status: ag.status === 'active' ? 'ACTIVE' as const : 'PAUSED' as const,
          audienceLabel: ag.targeting || ag.name,
        }))
      : [{
          localId: localId(),
          name: `${campaign.name} - Ad Set`,
          dailyBudget,
          optimizationGoal: 'REACH',
          billingEvent: 'IMPRESSIONS',
          targeting: {
            geoLocations: { countries: ['US'] },
            ageMin: 18,
            ageMax: 65,
          },
          status: 'PAUSED' as const,
          audienceLabel: 'Default Audience',
        }];

    const allAds = adGroups.flatMap((ag) => ag.ads || []);
    const firstThumbnail = allAds.find((ad) => ad.creative?.thumbnail)?.creative?.thumbnail;

    const creativeId = localId();
    const creatives: LaunchAdCreativeConfig[] = [{
      localId: creativeId,
      name: `${campaign.name} - Creative`,
      headline: 'Learn More',
      bodyText: '',
      ctaType: 'LEARN_MORE',
      linkUrl: '',
      pageId: '',
      ...(firstThumbnail ? {
        file: {
          fileName: 'existing-creative.jpg',
          filePath: '',
          fileSize: 0,
          mimeType: 'image/jpeg',
          previewUrl: firstThumbnail,
        },
      } : {}),
    }];

    const ads: LaunchAdConfig[] = adSets.map((as) => ({
      localId: localId(),
      name: `${as.name} - Ad`,
      adSetLocalId: as.localId,
      creativeLocalId: creativeId,
      status: 'PAUSED' as const,
    }));

    let facebookPages: FacebookPage[] = [];
    try {
      const api = (window as any).aiSuites?.launch;
      if (api?.getPages) {
        const result = await api.getPages();
        if (result?.success && result.data && result.data.length > 0) {
          facebookPages = result.data;
          creatives.forEach((c) => { c.pageId = facebookPages[0].id; });
        }
      }
    } catch (err) {
      console.error('[CampaignLaunch] Failed to fetch pages:', err);
    }

    const configPayload = { campaign: launchCampaign, adSets, creatives, ads, facebookPages };
    const configId = `launch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    set({
      config: configPayload,
      progress: defaultProgress(),
      isInitialized: true,
      isEditMode: true,
      platformCampaignId: campaign.platformCampaignId || campaign.id,
      savedConfigId: configId,
    });

    // Auto-save to localStorage
    const saved: SavedLaunchConfig = {
      id: configId,
      name: launchCampaign.name,
      createdAt: now,
      updatedAt: now,
      config: stripTokens(configPayload),
      platformCampaignId: campaign.platformCampaignId || campaign.id,
      isEditMode: true,
    };
    launchConfigStorage.saveConfig(saved);
    set({ savedConfigs: launchConfigStorage.listConfigs() });
  },

  // ── Init from blueprint ──────────────────────────────────────────────────

  initFromBlueprint: async (blueprint, _brief) => {
    nextLocalId = 1;

    const totalCents = parseBudgetToCents(blueprint.budget.amount);

    // Use only the Meta-allocated budget when channel allocations are available.
    // Meta platforms include Meta Ads, Facebook, Instagram, etc.
    const metaChannelNames = /meta|facebook|instagram/i;
    let metaCents = totalCents;
    if (blueprint.channelAllocations && blueprint.channelAllocations.length > 0) {
      const metaChannels = blueprint.channelAllocations.filter(
        (ch) => metaChannelNames.test(ch.name)
      );
      if (metaChannels.length > 0) {
        // Prefer explicit budgetAmount; fall back to budgetPercent of total
        metaCents = metaChannels.reduce((sum, ch) => {
          if (ch.budgetAmount) return sum + parseBudgetToCents(ch.budgetAmount);
          if (ch.budgetPercent) return sum + Math.round(totalCents * ch.budgetPercent / 100);
          return sum;
        }, 0);
      }
      // else: no Meta channels found — keep full budget as fallback
    }

    const dailyBudget = Math.max(100, Math.round(metaCents / 30));

    const campaign: LaunchCampaignConfig = {
      name: blueprint.name || 'Campaign from Blueprint',
      objective: mapToMetaObjective(blueprint),
      dailyBudget,
      status: 'PAUSED',
      specialAdCategories: [],
      buyingType: 'AUCTION',
    };

    // One ad set per audience
    const audiences = blueprint.audiences.length > 0 ? blueprint.audiences : ['Broad Audience'];
    const perAdSetBudget = Math.max(100, Math.round(dailyBudget / audiences.length));
    const objective = campaign.objective;
    const defaultGoal = objective === 'OUTCOME_AWARENESS' ? 'REACH'
      : objective === 'OUTCOME_ENGAGEMENT' ? 'POST_ENGAGEMENT'
      : 'LINK_CLICKS';

    const adSets: LaunchAdSetConfig[] = audiences.map((aud) => ({
      localId: localId(),
      name: `${blueprint.name} - ${aud}`,
      dailyBudget: perAdSetBudget,
      optimizationGoal: defaultGoal,
      billingEvent: 'IMPRESSIONS',
      targeting: {
        geoLocations: { countries: ['US'] },
        ageMin: 18,
        ageMax: 65,
      },
      status: 'PAUSED' as const,
      audienceLabel: aud,
      tdSegmentId: blueprint.audienceSegmentIds?.[aud],
    }));

    // One default creative from blueprint messaging
    const creativeId = localId();
    const creatives: LaunchAdCreativeConfig[] = [
      {
        localId: creativeId,
        name: `${blueprint.name} - Creative 1`,
        headline: blueprint.cta || 'Learn More',
        bodyText: blueprint.messaging || '',
        ctaType: 'LEARN_MORE',
        linkUrl: '',
        pageId: '',
      },
    ];

    // One ad per (adSet × creative)
    const ads: LaunchAdConfig[] = adSets.map((as) => ({
      localId: localId(),
      name: `${as.name} - Ad`,
      adSetLocalId: as.localId,
      creativeLocalId: creativeId,
      status: 'PAUSED' as const,
    }));

    // Fetch Facebook Pages
    let facebookPages: FacebookPage[] = [];
    try {
      const api = (window as any).aiSuites?.launch;
      if (api?.getPages) {
        console.log('[CampaignLaunch] Fetching Facebook Pages...');
        const result = await api.getPages();
        console.log('[CampaignLaunch] Pages result:', result);
        if (result?.success && result.data && result.data.length > 0) {
          facebookPages = result.data;
          // Auto-assign first page to creatives
          creatives.forEach((c) => { c.pageId = facebookPages[0].id; });
          console.log(`[CampaignLaunch] Auto-selected page: ${facebookPages[0].name} (${facebookPages[0].id})`);
        } else {
          console.warn('[CampaignLaunch] No Facebook Pages found:', result?.error || 'empty list');
        }
      } else {
        console.warn('[CampaignLaunch] launch.getPages API not available');
      }
    } catch (err) {
      console.error('[CampaignLaunch] Failed to fetch pages:', err);
    }

    const configPayload = { campaign, adSets, creatives, ads, facebookPages };
    const configId = `launch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    set({
      config: configPayload,
      progress: defaultProgress(),
      isInitialized: true,
      isEditMode: false,
      platformCampaignId: null,
      savedConfigId: configId,
    });

    // Auto-save to localStorage
    const saved: SavedLaunchConfig = {
      id: configId,
      name: campaign.name,
      createdAt: now,
      updatedAt: now,
      config: stripTokens(configPayload),
      sourceBlueprintId: blueprint.id,
      sourceBlueprintName: blueprint.name,
      isEditMode: false,
    };
    launchConfigStorage.saveConfig(saved);
    set({ savedConfigs: launchConfigStorage.listConfigs() });
  },

  // ── Init from AI skill output ──────────────────────────────────────────

  initFromSkillOutput: async (output, blueprintId) => {
    nextLocalId = 1;

    // Recover localId counter from the AI-generated IDs
    let max = 0;
    const extract = (id: string) => {
      const match = id.match(/^local_(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    };
    output.adSets.forEach((a) => extract(a.localId));
    output.creatives.forEach((c) => extract(c.localId));
    output.ads.forEach((a) => extract(a.localId));
    nextLocalId = max + 1;

    // Fetch Facebook Pages (reuse same IPC pattern as initFromBlueprint)
    let facebookPages: FacebookPage[] = [];
    try {
      const api = (window as any).aiSuites?.launch;
      if (api?.getPages) {
        console.log('[CampaignLaunch] Fetching Facebook Pages for skill output...');
        const result = await api.getPages();
        if (result?.success && result.data && result.data.length > 0) {
          facebookPages = result.data;
          // Auto-assign first page to creatives with empty pageId
          output.creatives.forEach((c) => {
            if (!c.pageId) c.pageId = facebookPages[0].id;
          });
          console.log(`[CampaignLaunch] Auto-selected page: ${facebookPages[0].name} (${facebookPages[0].id})`);
        }
      }
    } catch (err) {
      console.error('[CampaignLaunch] Failed to fetch pages:', err);
    }

    const configPayload: CampaignLaunchConfig = {
      campaign: output.campaign as LaunchCampaignConfig,
      adSets: output.adSets as LaunchAdSetConfig[],
      creatives: output.creatives as LaunchAdCreativeConfig[],
      ads: output.ads as LaunchAdConfig[],
      facebookPages,
    };

    const configId = `launch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    set({
      config: configPayload,
      progress: defaultProgress(),
      isInitialized: true,
      isEditMode: false,
      isGeneratingConfig: false,
      platformCampaignId: null,
      savedConfigId: configId,
      sourceBlueprintId: blueprintId || null,
    });

    // Auto-save to localStorage
    const activeProgramId = useProgramStore.getState().activeProgramId;
    const saved: SavedLaunchConfig = {
      id: configId,
      name: output.campaign.name,
      createdAt: now,
      updatedAt: now,
      config: stripTokens(configPayload),
      sourceBlueprintId: blueprintId,
      isEditMode: false,
      ...(activeProgramId ? { programId: activeProgramId, channelPlatform: 'meta' as const } : {}),
    };
    launchConfigStorage.saveConfig(saved);
    set({ savedConfigs: launchConfigStorage.listConfigs(), programId: activeProgramId });

    // Link to program if active
    if (activeProgramId) {
      useProgramStore.getState().addLaunchConfig('meta', configId);
    }
  },

  applySkillUpdate: (update) => {
    set((s) => {
      const newConfig = { ...s.config };

      // Apply campaign-level partial updates
      if (update.campaign) {
        newConfig.campaign = { ...newConfig.campaign, ...update.campaign } as LaunchCampaignConfig;
      }

      // Apply array updates (adSets, creatives, ads)
      const applyArrayOps = <T extends { localId: string }>(
        existing: T[],
        ops: Array<{ operation?: string; localId?: string; [key: string]: unknown }> | undefined,
      ): T[] => {
        if (!ops) return existing;
        let result = [...existing];
        for (const op of ops) {
          if (op.operation === 'remove' && op.localId) {
            result = result.filter((item) => item.localId !== op.localId);
          } else if (op.operation === 'update' && op.localId) {
            const { operation, ...fields } = op;
            result = result.map((item) =>
              item.localId === op.localId ? { ...item, ...fields } as T : item,
            );
          } else if (op.operation === 'add') {
            const { operation, ...fields } = op;
            const newItem = { ...fields, localId: localId() } as unknown as T;
            result.push(newItem);
          }
        }
        return result;
      };

      newConfig.adSets = applyArrayOps(newConfig.adSets, update.adSets);
      newConfig.creatives = applyArrayOps(newConfig.creatives, update.creatives);
      newConfig.ads = applyArrayOps(newConfig.ads, update.ads);

      // Also remove ads that reference removed ad sets
      if (update.adSets?.some((op) => op.operation === 'remove')) {
        const adSetIds = new Set(newConfig.adSets.map((a) => a.localId));
        newConfig.ads = newConfig.ads.filter((ad) => adSetIds.has(ad.adSetLocalId));
      }

      return { config: newConfig };
    });

    // Auto-save after applying update
    const { savedConfigId } = get();
    if (savedConfigId) {
      get().saveCurrentConfig();
    }
  },

  setGeneratingConfig: (v) => {
    set({ isGeneratingConfig: v });
  },

  // ── Campaign edits ──────────────────────────────────────────────────────

  updateCampaign: (updates) => {
    set((s) => ({
      config: { ...s.config, campaign: { ...s.config.campaign, ...updates } },
    }));
  },

  // ── Ad Set edits ────────────────────────────────────────────────────────

  updateAdSet: (lid, updates) => {
    set((s) => ({
      config: {
        ...s.config,
        adSets: s.config.adSets.map((a) => (a.localId === lid ? { ...a, ...updates } : a)),
      },
    }));
  },

  addAdSet: () => {
    const id = localId();
    set((s) => ({
      config: {
        ...s.config,
        adSets: [
          ...s.config.adSets,
          {
            localId: id,
            name: `Ad Set ${s.config.adSets.length + 1}`,
            dailyBudget: 1000,
            optimizationGoal: s.config.campaign.objective === 'OUTCOME_AWARENESS' ? 'REACH'
              : s.config.campaign.objective === 'OUTCOME_ENGAGEMENT' ? 'POST_ENGAGEMENT'
              : 'LINK_CLICKS',
            billingEvent: 'IMPRESSIONS',
            targeting: { geoLocations: { countries: ['US'] }, ageMin: 18, ageMax: 65 },
            status: 'PAUSED',
            audienceLabel: 'New Audience',
          },
        ],
      },
    }));
  },

  removeAdSet: (lid) => {
    set((s) => ({
      config: {
        ...s.config,
        adSets: s.config.adSets.filter((a) => a.localId !== lid),
        ads: s.config.ads.filter((a) => a.adSetLocalId !== lid),
      },
    }));
  },

  // ── Creative edits ──────────────────────────────────────────────────────

  updateCreative: (lid, updates) => {
    set((s) => ({
      config: {
        ...s.config,
        creatives: s.config.creatives.map((c) =>
          c.localId === lid ? { ...c, ...updates } : c,
        ),
      },
    }));
  },

  addCreative: () => {
    const id = localId();
    set((s) => ({
      config: {
        ...s.config,
        creatives: [
          ...s.config.creatives,
          {
            localId: id,
            name: `Creative ${s.config.creatives.length + 1}`,
            headline: '',
            bodyText: '',
            ctaType: 'LEARN_MORE',
            linkUrl: '',
            pageId: s.config.facebookPages[0]?.id || '',
          },
        ],
      },
    }));
  },

  removeCreative: (lid) => {
    set((s) => ({
      config: {
        ...s.config,
        creatives: s.config.creatives.filter((c) => c.localId !== lid),
        ads: s.config.ads.filter((a) => a.creativeLocalId !== lid),
      },
    }));
  },

  attachFile: (creativeLocalId, file) => {
    set((s) => ({
      config: {
        ...s.config,
        creatives: s.config.creatives.map((c) =>
          c.localId === creativeLocalId ? { ...c, file } : c,
        ),
      },
    }));
  },

  removeFile: (creativeLocalId) => {
    set((s) => ({
      config: {
        ...s.config,
        creatives: s.config.creatives.map((c) =>
          c.localId === creativeLocalId ? { ...c, file: undefined } : c,
        ),
      },
    }));
  },

  // ── Ad edits ────────────────────────────────────────────────────────────

  updateAd: (lid, updates) => {
    set((s) => ({
      config: {
        ...s.config,
        ads: s.config.ads.map((a) => (a.localId === lid ? { ...a, ...updates } : a)),
      },
    }));
  },

  addAd: () => {
    const { config } = get();
    const id = localId();
    set((s) => ({
      config: {
        ...s.config,
        ads: [
          ...s.config.ads,
          {
            localId: id,
            name: `Ad ${s.config.ads.length + 1}`,
            adSetLocalId: config.adSets[0]?.localId || '',
            creativeLocalId: config.creatives[0]?.localId || '',
            status: 'PAUSED',
          },
        ],
      },
    }));
  },

  removeAd: (lid) => {
    set((s) => ({
      config: { ...s.config, ads: s.config.ads.filter((a) => a.localId !== lid) },
    }));
  },

  // ── Pages ───────────────────────────────────────────────────────────────

  setFacebookPages: (pages) => {
    set((s) => ({
      config: { ...s.config, facebookPages: pages },
    }));
  },

  // ── Execute Launch ──────────────────────────────────────────────────────

  executeLaunch: async () => {
    const { config } = get();
    const api = (window as any).aiSuites;

    const updateStep = (stepIndex: number, update: Partial<LaunchStepResult>) => {
      set((s) => {
        const results = [...s.progress.stepResults];
        results[stepIndex] = { ...results[stepIndex], ...update };
        return { progress: { ...s.progress, stepResults: results } };
      });
    };

    set({ progress: { ...defaultProgress(), overallStatus: 'launching' } });

    // Step 0: Create Campaign (no campaign-level budget → ad-set-level budgets)
    updateStep(0, { status: 'in_progress' });
    set((s) => ({ progress: { ...s.progress, currentStep: 'createCampaign' } }));

    let campaignId: string | undefined;
    try {
      const result = await api.campaigns.create({
        name: config.campaign.name,
        objective: config.campaign.objective,
        status: config.campaign.status,
        // NO dailyBudget — budget managed per ad set (avoids CBO bid strategy conflicts)
      });
      if (result?.success && result.id) {
        campaignId = result.id;
        set((s) => ({ progress: { ...s.progress, campaignId } }));
        updateStep(0, { status: 'success', createdIds: [result.id] });
      } else {
        throw new Error(result?.error || 'Failed to create campaign');
      }
    } catch (err) {
      updateStep(0, { status: 'error', error: err instanceof Error ? err.message : String(err) });
      set((s) => ({ progress: { ...s.progress, overallStatus: 'error', currentStep: null } }));
      return;
    }

    // Step 1: Create Ad Sets
    updateStep(1, { status: 'in_progress' });
    set((s) => ({ progress: { ...s.progress, currentStep: 'createAdSets' } }));

    const adSetIdMap: Record<string, string> = {};
    const adSetCreatedIds: string[] = [];
    const adSetErrorMessages: string[] = [];

    // Use the first Facebook Page as the promoted object (required by Meta for most objectives)
    const promotedPageId = config.facebookPages[0]?.id;

    for (const adSet of config.adSets) {
      try {
        // Ad-set-level budget (no CBO) — each ad set manages its own daily budget
        const result = await api.adsets.create({
          campaignId: campaignId!,
          name: adSet.name,
          dailyBudget: adSet.dailyBudget,
          optimizationGoal: adSet.optimizationGoal,
          billingEvent: adSet.billingEvent,
          targeting: adSet.targeting,
          status: adSet.status,
          pageId: promotedPageId,
          campaignObjective: config.campaign.objective,
        });
        if (result?.success && result.id) {
          adSetIdMap[adSet.localId] = result.id;
          adSetCreatedIds.push(result.id);
        } else {
          const errMsg = result?.error || `Failed to create ad set: ${adSet.name}`;
          adSetErrorMessages.push(errMsg);
          console.error(`[Launch] Ad set "${adSet.name}" failed:`, errMsg);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        adSetErrorMessages.push(`${adSet.name}: ${errMsg}`);
        console.error(`[Launch] Ad set "${adSet.name}" failed:`, err);
      }
    }

    set((s) => ({ progress: { ...s.progress, adSetIdMap } }));
    updateStep(1, {
      status: adSetErrorMessages.length === config.adSets.length ? 'error' : adSetErrorMessages.length > 0 ? 'success' : 'success',
      error: adSetErrorMessages.length > 0 ? adSetErrorMessages.join('; ') : undefined,
      createdIds: adSetCreatedIds,
    });

    // Step 2: Upload Images
    updateStep(2, { status: 'in_progress' });
    set((s) => ({ progress: { ...s.progress, currentStep: 'uploadImages' } }));

    const creativesWithFiles = config.creatives.filter((c) => c.file?.filePath);
    if (creativesWithFiles.length === 0) {
      updateStep(2, { status: 'skipped' });
    } else {
      let uploadErrors = 0;
      for (const creative of creativesWithFiles) {
        try {
          const result = await api.launch.uploadImage(creative.file!.filePath);
          if (result?.success && result.imageHash) {
            // Update file in config with imageHash
            set((s) => ({
              config: {
                ...s.config,
                creatives: s.config.creatives.map((c) =>
                  c.localId === creative.localId && c.file
                    ? { ...c, file: { ...c.file, imageHash: result.imageHash } }
                    : c,
                ),
              },
            }));
          } else {
            throw new Error(result?.error || 'Upload returned no hash');
          }
        } catch (err) {
          console.error(`[Launch] Image upload for "${creative.name}" failed:`, err);
          uploadErrors++;
        }
      }
      updateStep(2, {
        status: uploadErrors === creativesWithFiles.length ? 'error' : 'success',
        error: uploadErrors > 0 ? `${uploadErrors} of ${creativesWithFiles.length} uploads failed` : undefined,
      });
    }

    // Step 3: Create Ad Creatives
    updateStep(3, { status: 'in_progress' });
    set((s) => ({ progress: { ...s.progress, currentStep: 'createAdCreatives' } }));

    const creativeIdMap: Record<string, string> = {};
    const creativeCreatedIds: string[] = [];
    const creativeErrorMessages: string[] = [];

    // Re-read config to get updated imageHashes
    const updatedCreatives = get().config.creatives;

    for (const creative of updatedCreatives) {
      const imageHash = creative.file?.imageHash;
      if (!imageHash) {
        creativeErrorMessages.push(`${creative.name}: no image uploaded`);
        continue;
      }
      if (!creative.pageId) {
        creativeErrorMessages.push(`${creative.name}: no Facebook Page selected`);
        continue;
      }

      try {
        const result = await api.launch.createAdCreative({
          name: creative.name,
          pageId: creative.pageId,
          imageHash,
          headline: creative.headline,
          bodyText: creative.bodyText,
          ctaType: creative.ctaType,
          linkUrl: creative.linkUrl || 'https://example.com',
        });
        if (result?.success && result.id) {
          creativeIdMap[creative.localId] = result.id;
          creativeCreatedIds.push(result.id);
        } else {
          creativeErrorMessages.push(result?.error || `Failed to create: ${creative.name}`);
        }
      } catch (err) {
        creativeErrorMessages.push(`${creative.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    set((s) => ({ progress: { ...s.progress, creativeIdMap } }));
    updateStep(3, {
      status: creativeErrorMessages.length === updatedCreatives.length ? 'error' : creativeErrorMessages.length > 0 ? 'success' : 'success',
      error: creativeErrorMessages.length > 0 ? creativeErrorMessages.join('; ') : undefined,
      createdIds: creativeCreatedIds,
    });

    // Step 4: Create Ads
    updateStep(4, { status: 'in_progress' });
    set((s) => ({ progress: { ...s.progress, currentStep: 'createAds' } }));

    const adIdMap: Record<string, string> = {};
    const adCreatedIds: string[] = [];
    const adErrorMessages: string[] = [];

    for (const ad of config.ads) {
      const platformAdSetId = adSetIdMap[ad.adSetLocalId];
      const platformCreativeId = creativeIdMap[ad.creativeLocalId];

      if (!platformAdSetId || !platformCreativeId) {
        const missing = [!platformAdSetId && 'ad set', !platformCreativeId && 'creative'].filter(Boolean).join(' and ');
        adErrorMessages.push(`${ad.name}: ${missing} not created`);
        continue;
      }

      try {
        const result = await api.launch.createAd({
          name: ad.name,
          adSetId: platformAdSetId,
          creativeId: platformCreativeId,
          status: ad.status,
        });
        if (result?.success && result.id) {
          adIdMap[ad.localId] = result.id;
          adCreatedIds.push(result.id);
        } else {
          adErrorMessages.push(result?.error || `Failed to create: ${ad.name}`);
        }
      } catch (err) {
        adErrorMessages.push(`${ad.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    set((s) => ({ progress: { ...s.progress, adIdMap } }));
    updateStep(4, {
      status: adErrorMessages.length === config.ads.length ? 'error' : adErrorMessages.length > 0 ? 'success' : 'success',
      error: adErrorMessages.length > 0 ? adErrorMessages.join('; ') : undefined,
      createdIds: adCreatedIds,
    });

    // Step 5: Activate Audience via LiveRamp (simulated)
    updateStep(5, { status: 'in_progress' });
    set((s) => ({ progress: { ...s.progress, currentStep: 'activateAudience' } }));

    const audienceDetails = config.adSets.map((a) =>
      a.tdSegmentId ? `${a.audienceLabel} (${a.tdSegmentId})` : a.audienceLabel
    ).filter(Boolean);
    const audienceSummary = audienceDetails.length > 0
      ? audienceDetails.join(', ')
      : `${config.adSets.length} audience segment${config.adSets.length !== 1 ? 's' : ''}`;

    // Simulate LiveRamp API call
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const lrSyncId = `lr-sync-${Date.now().toString(36)}`;

    updateStep(5, {
      status: 'success',
      createdIds: [
        `Sync: ${lrSyncId}`,
        `Campaign: ${campaignId}`,
        `Audience: ${audienceSummary}`,
      ],
    });

    // Determine overall status
    const finalResults = get().progress.stepResults;
    const hasError = finalResults.some((r) => r.status === 'error');
    const allSuccess = finalResults.every((r) => r.status === 'success' || r.status === 'skipped');

    set((s) => ({
      progress: {
        ...s.progress,
        overallStatus: allSuccess ? 'success' : hasError ? (campaignId ? 'partial_success' : 'error') : 'success',
        currentStep: null,
      },
    }));
  },

  // ── Execute update (edit mode — updates existing campaign on Meta) ─────

  executeUpdate: async () => {
    const { config, platformCampaignId } = get();
    if (!platformCampaignId) return;

    const api = (window as any).aiSuites?.campaigns;
    if (!api?.update) return;

    const updateParams: { status?: string; dailyBudget?: number; name?: string } = {
      name: config.campaign.name,
      status: config.campaign.status,
      dailyBudget: config.campaign.dailyBudget,
    };

    set((s) => ({
      progress: {
        ...s.progress,
        overallStatus: 'launching',
        currentStep: 'createCampaign',
        stepResults: s.progress.stepResults.map((r) =>
          r.step === 'createCampaign'
            ? { ...r, status: 'in_progress' as const, label: 'Updating Campaign' }
            : { ...r, status: 'skipped' as const }
        ),
      },
    }));

    try {
      const result = await api.update(platformCampaignId, updateParams);
      if (result.success) {
        set((s) => ({
          progress: {
            ...s.progress,
            overallStatus: 'success',
            currentStep: null,
            campaignId: platformCampaignId,
            stepResults: s.progress.stepResults.map((r) =>
              r.step === 'createCampaign'
                ? { ...r, status: 'success' as const, label: 'Campaign Updated' }
                : r
            ),
          },
        }));
      } else {
        set((s) => ({
          progress: {
            ...s.progress,
            overallStatus: 'error',
            currentStep: null,
            stepResults: s.progress.stepResults.map((r) =>
              r.step === 'createCampaign'
                ? { ...r, status: 'error' as const, error: result.error || 'Update failed', label: 'Update Campaign' }
                : r
            ),
          },
        }));
      }
    } catch (err: any) {
      set((s) => ({
        progress: {
          ...s.progress,
          overallStatus: 'error',
          currentStep: null,
          stepResults: s.progress.stepResults.map((r) =>
            r.step === 'createCampaign'
              ? { ...r, status: 'error' as const, error: err.message || 'Update failed', label: 'Update Campaign' }
              : r
          ),
        },
      }));
    }
  },

  // ── Saved config management ─────────────────────────────────────────────

  loadSavedConfigs: () => {
    set({ savedConfigs: launchConfigStorage.listConfigs() });
  },

  saveCurrentConfig: (name?: string) => {
    const { config, savedConfigId, isEditMode, platformCampaignId } = get();
    if (!savedConfigId) return;

    const existing = launchConfigStorage.getConfig(savedConfigId);
    const now = new Date().toISOString();

    const saved: SavedLaunchConfig = {
      id: savedConfigId,
      name: name || config.campaign.name || existing?.name || 'Untitled Config',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      config: stripTokens(config),
      sourceBlueprintId: existing?.sourceBlueprintId,
      sourceBlueprintName: existing?.sourceBlueprintName,
      platformCampaignId: platformCampaignId || undefined,
      isEditMode,
    };
    launchConfigStorage.saveConfig(saved);
    set({ savedConfigs: launchConfigStorage.listConfigs() });
  },

  initFromSavedConfig: (id: string) => {
    const saved = launchConfigStorage.getConfig(id);
    if (!saved) return;

    recoverNextLocalId(saved.config);

    // Auto-detect edit mode: if a campaign was previously launched (has a platform ID),
    // treat it as edit mode even if the flag wasn't set during the original launch.
    const hasLaunched = !!saved.platformCampaignId;

    set({
      config: saved.config,
      progress: defaultProgress(),
      isInitialized: true,
      isEditMode: saved.isEditMode || hasLaunched,
      platformCampaignId: saved.platformCampaignId || null,
      savedConfigId: id,
    });
  },

  deleteSavedConfig: (id: string) => {
    launchConfigStorage.deleteConfig(id);
    const { savedConfigId } = get();
    set({
      savedConfigs: launchConfigStorage.listConfigs(),
      ...(savedConfigId === id ? { savedConfigId: null } : {}),
    });
  },

  // ── AI Image Generation ─────────────────────────────────────────────────

  autoGenerateAllImages: async () => {
    // Check if agent is configured
    let agentConfigured = false;
    try {
      const settings = await (window as any).aiSuites?.settings.get();
      agentConfigured = !!settings?.imageGenAgentName;
    } catch {
      // Settings unavailable — skip silently
    }
    if (!agentConfigured) {
      console.log('[CampaignLaunch] No image gen agent configured, skipping auto-generation');
      return;
    }

    const { config, attachFile: storeAttachFile } = get();
    const creativesWithoutImages = config.creatives.filter((c) => !c.file);
    if (creativesWithoutImages.length === 0) return;

    console.log(`[CampaignLaunch] Auto-generating images for ${creativesWithoutImages.length} creatives`);
    set({ isAutoGeneratingImages: true });

    // Initialize status for each creative
    const initialStatus: Record<string, 'pending' | 'generating' | 'success' | 'error'> = {};
    creativesWithoutImages.forEach((c) => { initialStatus[c.localId] = 'pending'; });
    set({ imageGenStatus: initialStatus });

    // Worker queue with max 3 concurrent
    const queue = [...creativesWithoutImages];
    const MAX_CONCURRENT = 3;

    const processOne = async (creative: typeof creativesWithoutImages[0]) => {
      set((s) => ({
        imageGenStatus: { ...s.imageGenStatus, [creative.localId]: 'generating' },
      }));

      const promptParts = [
        'Generate a professional advertising image for:',
        creative.headline && `Headline: ${creative.headline}`,
        creative.bodyText && `Description: ${creative.bodyText}`,
        config.campaign.name && `Campaign: ${config.campaign.name}`,
      ].filter(Boolean);
      const prompt = promptParts.join(' ');

      try {
        const result = await (window as any).aiSuites.launch.generateImage(prompt);
        if (result?.success && result.file) {
          storeAttachFile(creative.localId, result.file);
          set((s) => ({
            imageGenStatus: { ...s.imageGenStatus, [creative.localId]: 'success' },
          }));
        } else {
          console.warn(`[CampaignLaunch] Image gen failed for "${creative.name}":`, result?.error);
          set((s) => ({
            imageGenStatus: { ...s.imageGenStatus, [creative.localId]: 'error' },
          }));
        }
      } catch (err) {
        console.error(`[CampaignLaunch] Image gen error for "${creative.name}":`, err);
        set((s) => ({
          imageGenStatus: { ...s.imageGenStatus, [creative.localId]: 'error' },
        }));
      }
    };

    // Process in batches of MAX_CONCURRENT
    for (let i = 0; i < queue.length; i += MAX_CONCURRENT) {
      const batch = queue.slice(i, i + MAX_CONCURRENT);
      await Promise.all(batch.map(processOne));
    }

    set({ isAutoGeneratingImages: false });
    console.log('[CampaignLaunch] Auto image generation complete');

    // Force immediate save so generated images persist without waiting for debounce
    if (get().savedConfigId) {
      get().saveCurrentConfig();
    }
  },

  // ── Reset ───────────────────────────────────────────────────────────────

  reset: () => {
    nextLocalId = 1;
    set({
      config: defaultConfig(),
      progress: defaultProgress(),
      isInitialized: false,
      isEditMode: false,
      platformCampaignId: null,
      savedConfigId: null,
      isGeneratingConfig: false,
      sourceBlueprintId: null,
      programId: null,
      imageGenStatus: {},
      isAutoGeneratingImages: false,
    });
  },
}));
