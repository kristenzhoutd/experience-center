/**
 * Campaign Config Store — Zustand store for the 4-step wizard.
 *
 * Manages wizard state, TDX segment fetching, step navigation,
 * and persistence via campaignConfigStorage.
 */

import { create } from 'zustand';
import type { CampaignBrief } from '../types/brief';
import type {
  CampaignConfig,
  CampaignSetupData,
  WizardStep,
  WizardSegment,
  ContentPage,
  ContentSpot,
  ContentVariant,
  VariantContent,
  SpotTargetingMode,
  ReviewStepData,
} from '../types/campaignConfig';
import { mapBriefToConfig, contentForSpotType, contentForSegment, contentForSpotFromBrief, contentForSpotSegment } from '../services/briefToConfigMapper';
import type { ContentAgentOutput } from '../services/skillParsers';
import { campaignConfigStorage, CURRENT_SCHEMA_VERSION } from '../services/campaignConfigStorage';
import { localBriefStorage } from '../services/briefStorage';
import { useSettingsStore } from './settingsStore';

/** Extract flat content fields from GrapesJS HTML using ps-* class selectors. */
function extractFlatFieldsFromGjsHtml(html: string): Partial<VariantContent> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const fields: Partial<VariantContent> = {};

  const headline = doc.querySelector('.ps-headline');
  if (headline) fields.headline = headline.textContent || '';

  const body = doc.querySelector('.ps-body');
  if (body) fields.body = body.textContent || '';

  const cta = doc.querySelector('.ps-cta');
  if (cta) {
    fields.ctaText = cta.textContent || '';
    const href = cta.getAttribute('href');
    if (href && href !== '#') fields.deepLinkUrl = href;
  }

  const img = doc.querySelector('.ps-image');
  if (img) {
    const src = img.getAttribute('src');
    if (src) fields.imageUrl = src;
  }

  return fields;
}

/**
 * Patch ps-* element text in existing GrapesJS HTML with updated flat field values.
 * Updates ALL matching elements for each class to handle duplicates.
 */
function patchGjsHtml(html: string, updates: Partial<VariantContent>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (updates.headline !== undefined) {
    doc.querySelectorAll('.ps-headline').forEach((el) => {
      el.textContent = updates.headline!;
    });
  }
  if (updates.body !== undefined) {
    doc.querySelectorAll('.ps-body').forEach((el) => {
      el.textContent = updates.body!;
    });
  }
  if (updates.ctaText !== undefined) {
    doc.querySelectorAll('.ps-cta').forEach((el) => {
      el.textContent = updates.ctaText!;
      if (updates.deepLinkUrl) {
        el.setAttribute('href', updates.deepLinkUrl);
      }
    });
  }
  if (updates.imageUrl !== undefined) {
    doc.querySelectorAll('.ps-image').forEach((el) => {
      el.setAttribute('src', updates.imageUrl!);
    });
  }

  return doc.body.innerHTML;
}

interface ParentSegment {
  id: string;
  name: string;
  count: string | null;
  description: string;
}

interface CampaignConfigState {
  // Wizard state
  currentStep: WizardStep;
  config: CampaignConfig | null;
  isDirty: boolean;

  // Content revision counter — incremented when AI applies content changes,
  // used to force GrapesJS editor remount
  contentRevision: number;

  // Active editor selection (for content-agent skill routing)
  activeEditorPageId: string | null;
  activeEditorSpotId: string | null;
  activeEditorVariantId: string;

  // TDX segment data
  parentSegments: ParentSegment[];
  childSegments: Array<{ id: string; name: string; count?: string; description?: string }>;
  isLoadingSegments: boolean;
  segmentError: string | null;

  // Actions — initialization
  initNewConfig: () => string;
  initFromBrief: (brief: CampaignBrief) => Promise<void>;
  loadExistingConfig: (configId: string) => Promise<void>;
  reset: () => void;

  // Actions — TDX segments
  fetchChildSegments: (parentId: string) => Promise<void>;
  selectParentSegment: (id: string) => Promise<void>;

  // Actions — step navigation
  goToStep: (step: WizardStep) => void;
  goNext: () => void;
  goPrev: () => void;

  // Actions — Step 1
  updateSetup: (updates: Partial<CampaignSetupData>) => void;

  // Actions — Step 2
  toggleSegmentSelection: (segmentId: string) => void;
  confirmNewSegment: (segmentId: string) => void;
  removeSegment: (segmentId: string) => void;

  // Actions — Step 3 (Content)
  updateSpotTargetingMode: (pageId: string, spotId: string, mode: SpotTargetingMode) => void;
  updateDefaultVariant: (pageId: string, spotId: string, updates: Partial<VariantContent>) => void;
  updateDefaultVariantGjs: (pageId: string, spotId: string, gjsData: { gjsProjectData: Record<string, unknown>; gjsHtml: string; gjsCss: string }) => void;
  addVariant: (pageId: string, spotId: string, audienceName: string, audienceRefId: string) => void;
  removeVariant: (pageId: string, spotId: string, variantId: string) => void;
  updateVariantContent: (pageId: string, spotId: string, variantId: string, updates: Partial<VariantContent>) => void;
  updateVariantGjs: (pageId: string, spotId: string, variantId: string, gjsData: { gjsProjectData: Record<string, unknown>; gjsHtml: string; gjsCss: string }) => void;
  updateVariantPriority: (pageId: string, spotId: string, variantId: string, priority: number) => void;
  setContentPages: (pages: ContentPage[]) => void;
  addContentPage: (pageName: string, pageUrl: string) => void;
  removeContentPage: (pageId: string) => void;
  addContentSpot: (pageId: string, name: string, selector: string, type?: string, spotId?: string) => void;
  removeContentSpot: (pageId: string, spotId: string) => void;

  // Actions — Step 4
  updateRank: (rank: number) => void;
  updateReview: (updates: Partial<ReviewStepData>) => void;

  // Actions — persistence
  saveAsDraft: () => void;
  launch: () => void;

  // Actions — active editor selection
  setActiveEditorSelection: (pageId: string | null, spotId: string | null, variantId: string) => void;

  // Actions — AI skill output
  applySkillOutput: (step: WizardStep, data: unknown) => void;
  applyContentAgentOutput: (output: ContentAgentOutput) => void;
  applyAudienceSelection: (segments: WizardSegment[]) => void;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_VARIANT_CONTENT: VariantContent = {
  headline: '',
  body: '',
  ctaText: '',
  imageUrl: '',
  deepLinkUrl: '',
};

/** Deep-update a spot within the nested pages→spots structure */
function updateSpotInPages(
  pages: ContentPage[],
  pageId: string,
  spotId: string,
  updater: (spot: ContentSpot) => ContentSpot,
): ContentPage[] {
  return pages.map((page) => {
    if (page.pageId !== pageId) return page;
    return {
      ...page,
      spots: page.spots.map((spot) => {
        if (spot.spotId !== spotId) return spot;
        return updater(spot);
      }),
    };
  });
}

export const useCampaignConfigStore = create<CampaignConfigState>((set, get) => ({
  currentStep: 1,
  config: null,
  isDirty: false,
  contentRevision: 0,
  activeEditorPageId: null,
  activeEditorSpotId: null,
  activeEditorVariantId: 'default',
  parentSegments: [],
  childSegments: [],
  isLoadingSegments: false,
  segmentError: null,

  // ── Initialization ────────────────────────────────────────────────

  initNewConfig: () => {
    const settingsState = useSettingsStore.getState();
    const parentSegments = settingsState.parentSegments;
    const selectedParentId = settingsState.selectedParentSegmentId || '';

    const existingConfigs = campaignConfigStorage.listConfigs();
    const nextRank = existingConfigs.length > 0
      ? Math.max(...existingConfigs.map((c) => c.rank ?? 0)) + 1
      : 1;

    const now = new Date().toISOString();
    const config: CampaignConfig = {
      id: makeId('campaign'),
      briefId: '',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      status: 'draft',
      currentStep: 1,
      rank: nextRank,
      createdAt: now,
      updatedAt: now,
      setup: {
        name: '',
        objective: '',
        businessGoal: '',
        goalType: 'conversion',
        startDate: '',
        endDate: '',
        primaryKpi: '',
        secondaryKpis: [],
      },
      audiences: {
        parentSegmentId: selectedParentId,
        segments: [],
      },
      content: { pages: [] },
      review: { trafficAllocation: 100, priority: 1, notes: '' },
    };

    campaignConfigStorage.saveConfig(config);

    set({
      config,
      currentStep: 1,
      isDirty: false,
      parentSegments,
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });

    return config.id;
  },

  initFromBrief: async (brief: CampaignBrief) => {
    // Read parent segments from the shared settings store (populated by Layout)
    const settingsState = useSettingsStore.getState();
    const parentSegments = settingsState.parentSegments;
    const selectedParentId = settingsState.selectedParentSegmentId;

    // Map brief to config initially without child segments
    const config = mapBriefToConfig(brief, selectedParentId || undefined);

    set({
      config,
      currentStep: 1,
      isDirty: false,
      parentSegments,
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });

    // If a parent segment is already selected in the global nav, auto-fetch children
    if (selectedParentId) {
      await get().selectParentSegment(selectedParentId);
    }
  },

  loadExistingConfig: async (configId: string) => {
    const config = campaignConfigStorage.getConfig(configId);
    if (!config) return;

    // Read parent segments from the shared settings store (same as initFromBrief)
    const settingsState = useSettingsStore.getState();
    const parentSegments = settingsState.parentSegments;

    set({
      config,
      currentStep: config.currentStep,
      isDirty: false,
      parentSegments,
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });

    // Re-fetch child segments for the current parent segment.
    // Use the globally selected parent segment (not the saved one) so switching
    // parent segments in the Layout dropdown is reflected immediately.
    const currentParentId = settingsState.selectedParentSegmentId || config.audiences.parentSegmentId;
    if (currentParentId) {
      await get().selectParentSegment(currentParentId);
    }
  },

  reset: () => {
    set({
      currentStep: 1,
      config: null,
      isDirty: false,
      parentSegments: [],
      childSegments: [],
      isLoadingSegments: false,
      segmentError: null,
    });
  },

  // ── TDX Segments ──────────────────────────────────────────────────

  fetchChildSegments: async (parentId: string) => {
    set({ isLoadingSegments: true, segmentError: null });
    try {
      const api = window.aiSuites?.settings;
      let childSegments: Array<{ id: string; name: string; count?: string; description?: string }> = [];
      if (api?.parentSegmentChildren) {
        const result = await api.parentSegmentChildren(parentId);
        if (result.success && result.data) {
          childSegments = result.data;
        } else if (result.error) {
          set({ segmentError: result.error, isLoadingSegments: false });
          return;
        }
      }
      set({ childSegments, isLoadingSegments: false });
    } catch (err) {
      console.error('[CampaignConfigStore] Error fetching child segments:', err);
      set({
        isLoadingSegments: false,
        segmentError: 'Failed to fetch child segments. Check TDX CLI configuration.',
      });
    }
  },

  selectParentSegment: async (parentId: string) => {
    const { config } = get();
    if (!config) return;

    await get().fetchChildSegments(parentId);

    const { childSegments, segmentError } = get();
    if (segmentError) return;

      // Re-map brief segments against the new child segments
      // Preserve existing selection state and carry over description/count
      // Use saved recommendedAudiences from the brief as the richest data source
      const recAudiences = config.audiences.recommendedAudiences || [];
      const briefSegments = config.audiences.segments
        .filter((s) => s.source === 'brief');
      const briefSegmentNames = recAudiences.length > 0
        ? recAudiences.map((ra) => ra.name)
        : briefSegments.map((s) => s.name);

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

      const findRecAudience = (name: string) =>
        recAudiences.find((ra) => {
          const a = normalize(ra.name);
          const b = normalize(name);
          return a === b || b.includes(a) || a.includes(b);
        });

      const matchedBrief = new Set<string>();
      const newSegments: WizardSegment[] = [];

      for (const child of childSegments) {
        const matchedName = briefSegmentNames.find(
          (bs) => {
            const a = normalize(bs);
            const b = normalize(child.name);
            return a === b || b.includes(a) || a.includes(b);
          }
        );
        const ra = matchedName ? findRecAudience(matchedName) : undefined;
        const matchedSeg = matchedName
          ? briefSegments.find((s) => normalize(s.name) === normalize(matchedName))
          : undefined;
        newSegments.push({
          id: child.id,
          name: child.name,
          parentSegmentId: parentId,
          count: child.count || ra?.estimatedSize || matchedSeg?.count,
          description: child.description || ra?.description || matchedSeg?.description,
          isNew: false,
          isSelected: !!matchedName,
          source: 'tdx',
        });
        if (matchedName) matchedBrief.add(matchedName);
      }

      // Add unmatched brief/recommended segments as suggestions
      if (recAudiences.length > 0) {
        for (const ra of recAudiences) {
          if (!matchedBrief.has(ra.name)) {
            const existingSeg = briefSegments.find((s) => normalize(s.name) === normalize(ra.name));
            newSegments.push({
              id: existingSeg?.id || ra.tdxSegmentId || `seg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              name: ra.name,
              parentSegmentId: parentId,
              count: ra.estimatedSize,
              description: ra.description,
              isNew: ra.status === 'new',
              isSelected: ra.isSelected,
              source: 'brief',
            });
          }
        }
      } else {
        for (const seg of config.audiences.segments) {
          if (seg.source === 'brief' && !matchedBrief.has(seg.name)) {
            newSegments.push({
              ...seg,
              parentSegmentId: parentId,
            });
          }
        }
      }

      set({
        config: {
          ...config,
          audiences: {
            ...config.audiences,
            parentSegmentId: parentId,
            segments: newSegments,
          },
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      });
  },

  // ── Step Navigation ───────────────────────────────────────────────

  goToStep: (step: WizardStep) => {
    const { config } = get();
    if (config) {
      set({
        currentStep: step,
        config: { ...config, currentStep: step, updatedAt: new Date().toISOString() },
      });
    }
  },

  goNext: () => {
    const { currentStep } = get();
    if (currentStep < 4) {
      get().goToStep((currentStep + 1) as WizardStep);
    }
  },

  goPrev: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      get().goToStep((currentStep - 1) as WizardStep);
    }
  },

  // ── Step 1: Setup ─────────────────────────────────────────────────

  updateSetup: (updates: Partial<CampaignSetupData>) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        setup: { ...config.setup, ...updates },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── Step 2: Audiences ─────────────────────────────────────────────

  toggleSegmentSelection: (segmentId: string) => {
    const { config } = get();
    if (!config) return;

    const segments = config.audiences.segments.map((s) =>
      s.id === segmentId ? { ...s, isSelected: !s.isSelected } : s
    );

    set({
      config: {
        ...config,
        audiences: { ...config.audiences, segments },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  confirmNewSegment: (segmentId: string) => {
    const { config } = get();
    if (!config) return;

    const segments = config.audiences.segments.map((s) =>
      s.id === segmentId ? { ...s, isNew: false, isSelected: true } : s
    );

    set({
      config: {
        ...config,
        audiences: { ...config.audiences, segments },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  removeSegment: (segmentId: string) => {
    const { config } = get();
    if (!config) return;

    const segments = config.audiences.segments.filter((s) => s.id !== segmentId);
    set({
      config: {
        ...config,
        audiences: { ...config.audiences, segments },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── Step 3: Content ───────────────────────────────────────────────

  setContentPages: (pages: ContentPage[]) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        content: { pages },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  addContentPage: (pageName: string, pageUrl: string) => {
    const { config } = get();
    if (!config) return;

    const newPage: ContentPage = {
      pageId: makeId('page'),
      pageName,
      pageUrlPattern: pageUrl,
      thumbnail: { type: 'placeholder', url: '', alt: pageName },
      spots: [],
    };

    set({
      config: {
        ...config,
        content: { pages: [...config.content.pages, newPage] },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  removeContentPage: (pageId: string) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        content: { pages: config.content.pages.filter((p) => p.pageId !== pageId) },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  addContentSpot: (pageId: string, name: string, selector: string, type?: string, spotId?: string) => {
    const { config } = get();
    if (!config) return;

    const spotType = type || 'banner';

    // Pre-populate from brief experience section if available
    let defaultContent: VariantContent = { ...EMPTY_VARIANT_CONTENT };
    if (config.briefId) {
      const brief = localBriefStorage.getBrief(config.briefId);
      if (brief) {
        defaultContent = contentForSpotFromBrief(spotId || '', spotType, brief);
      }
    }

    const newSpot: ContentSpot = {
      spotId: spotId || makeId('spot'),
      spotName: name,
      spotType: spotType,
      selector,
      thumbnail: { type: 'placeholder', url: '', alt: name },
      targetingMode: 'default_only',
      defaultVariant: defaultContent,
      variants: [],
    };

    const pages = config.content.pages.map((page) => {
      if (page.pageId !== pageId) return page;
      return { ...page, spots: [...page.spots, newSpot] };
    });

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  removeContentSpot: (pageId: string, spotId: string) => {
    const { config } = get();
    if (!config) return;

    const pages = config.content.pages.map((page) => {
      if (page.pageId !== pageId) return page;
      return { ...page, spots: page.spots.filter((s) => s.spotId !== spotId) };
    });

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateSpotTargetingMode: (pageId: string, spotId: string, mode: SpotTargetingMode) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      targetingMode: mode,
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateDefaultVariant: (pageId: string, spotId: string, updates: Partial<VariantContent>) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      defaultVariant: { ...spot.defaultVariant, ...updates },
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateDefaultVariantGjs: (pageId, spotId, gjsData) => {
    const { config } = get();
    if (!config) return;

    // Sync flat fields from GrapesJS HTML so the AI context stays current
    const flatFields = extractFlatFieldsFromGjsHtml(gjsData.gjsHtml);

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      defaultVariant: { ...spot.defaultVariant, ...flatFields, ...gjsData },
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  addVariant: (pageId: string, spotId: string, audienceName: string, audienceRefId: string) => {
    const { config } = get();
    if (!config) return;

    // Resolve the spot type for content filtering
    let spotType = 'custom';
    for (const page of config.content.pages) {
      if (page.pageId === pageId) {
        const spot = page.spots.find((s) => s.spotId === spotId);
        if (spot) spotType = spot.spotType;
        break;
      }
    }

    // Pre-populate variant content from brief's spotCreatives or segmentMessages
    let variantContent: VariantContent = { ...EMPTY_VARIANT_CONTENT };
    if (config.briefId) {
      const brief = localBriefStorage.getBrief(config.briefId);
      if (brief) {
        variantContent = contentForSpotSegment(spotId, spotType, audienceName, brief);
      }
    }

    const newVariant: ContentVariant = {
      variantId: makeId('var'),
      audienceType: 'segment',
      audienceName,
      audienceRefId,
      priority: 1,
      content: variantContent,
    };

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      targetingMode: 'segment_variants' as const,
      variants: [...spot.variants, newVariant],
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  removeVariant: (pageId: string, spotId: string, variantId: string) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.filter((v) => v.variantId !== variantId),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateVariantContent: (pageId: string, spotId: string, variantId: string, updates: Partial<VariantContent>) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.map((v) =>
        v.variantId === variantId ? { ...v, content: { ...v.content, ...updates } } : v
      ),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateVariantGjs: (pageId, spotId, variantId, gjsData) => {
    const { config } = get();
    if (!config) return;

    // Sync flat fields from GrapesJS HTML so the AI context stays current
    const flatFields = extractFlatFieldsFromGjsHtml(gjsData.gjsHtml);

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.map((v) =>
        v.variantId === variantId ? { ...v, content: { ...v.content, ...flatFields, ...gjsData } } : v
      ),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateVariantPriority: (pageId: string, spotId: string, variantId: string, priority: number) => {
    const { config } = get();
    if (!config) return;

    const pages = updateSpotInPages(config.content.pages, pageId, spotId, (spot) => ({
      ...spot,
      variants: spot.variants.map((v) =>
        v.variantId === variantId ? { ...v, priority } : v
      ),
    }));

    set({
      config: { ...config, content: { pages }, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  // ── Step 4: Review ────────────────────────────────────────────────

  updateRank: (rank: number) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        rank,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  updateReview: (updates: Partial<ReviewStepData>) => {
    const { config } = get();
    if (!config) return;

    set({
      config: {
        ...config,
        review: { ...config.review, ...updates },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── Persistence ───────────────────────────────────────────────────

  saveAsDraft: () => {
    const { config } = get();
    if (!config) return;

    // Deep clone to avoid reference issues, ensure schema version is current
    const saved: CampaignConfig = JSON.parse(JSON.stringify({
      ...config,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }));
    campaignConfigStorage.saveConfig(saved);
    set({ config: saved, isDirty: false });
  },

  launch: () => {
    const { config } = get();
    if (!config) return;

    const launched: CampaignConfig = JSON.parse(JSON.stringify({
      ...config,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      status: 'launched',
      updatedAt: new Date().toISOString(),
    }));
    campaignConfigStorage.saveConfig(launched);
    set({ config: launched, isDirty: false });
  },

  // ── Active Editor Selection ─────────────────────────────────────

  setActiveEditorSelection: (pageId: string | null, spotId: string | null, variantId: string) => {
    set({ activeEditorPageId: pageId, activeEditorSpotId: spotId, activeEditorVariantId: variantId });
  },

  // ── Content Agent Output ───────────────────────────────────────

  applyContentAgentOutput: (output: ContentAgentOutput) => {
    const { config } = get();
    if (!config) return;

    // Resolve target with fallback to active editor selection
    const { activeEditorPageId, activeEditorSpotId, activeEditorVariantId } = get();
    const pageId = output.target?.pageId || activeEditorPageId;
    const spotId = output.target?.spotId || activeEditorSpotId;
    const variantId = output.target?.variantId || activeEditorVariantId || 'default';

    // Helper: get the current variant content for a given page/spot/variant
    const getVariantContent = (pId: string, sId: string, vId: string): VariantContent | undefined => {
      const cfg = get().config;
      if (!cfg) return undefined;
      const page = cfg.content.pages.find((p) => p.pageId === pId);
      if (!page) return undefined;
      const spot = page.spots.find((s) => s.spotId === sId);
      if (!spot) return undefined;
      if (vId === 'default') return spot.defaultVariant;
      const v = spot.variants.find((va) => va.variantId === vId);
      return v?.content;
    };

    // Helper: apply flat field updates and patch gjsHtml in-place.
    // Clears gjsProjectData so the editor reloads from the patched HTML.
    const applyFieldsWithGjsPatch = (pId: string, sId: string, vId: string, fields: Partial<VariantContent>) => {
      const current = getVariantContent(pId, sId, vId);
      let gjsUpdates: Partial<VariantContent> = {};
      if (current?.gjsHtml) {
        gjsUpdates = {
          gjsHtml: patchGjsHtml(current.gjsHtml, fields),
          gjsProjectData: undefined,
        };
      }
      const merged = { ...fields, ...gjsUpdates };
      if (vId === 'default') {
        get().updateDefaultVariant(pId, sId, merged);
      } else {
        get().updateVariantContent(pId, sId, vId, merged);
      }
    };

    switch (output.action) {
      case 'update_copy': {
        if (!pageId || !spotId || !output.updateCopy) break;
        applyFieldsWithGjsPatch(pageId, spotId, variantId, output.updateCopy.fields);
        break;
      }
      case 'generate_spot_content': {
        if (!pageId || !spotId || !output.generateSpotContent) break;
        applyFieldsWithGjsPatch(pageId, spotId, variantId, output.generateSpotContent.content);
        break;
      }
      case 'create_variant': {
        if (!pageId || !spotId || !output.createVariant) break;
        const { audienceName, audienceRefId, content } = output.createVariant;
        get().addVariant(pageId, spotId, audienceName, audienceRefId);
        // Find the newly created variant and update its content
        const updatedConfig = get().config;
        if (updatedConfig) {
          for (const page of updatedConfig.content.pages) {
            if (page.pageId === pageId) {
              const spot = page.spots.find((s) => s.spotId === spotId);
              if (spot) {
                const newVar = spot.variants.find(
                  (v) => v.audienceRefId === audienceRefId
                );
                if (newVar) {
                  get().updateVariantContent(pageId, spotId, newVar.variantId, content);
                }
              }
              break;
            }
          }
        }
        break;
      }
      case 'content_audit': {
        // Display-only — no store mutation needed
        break;
      }
      case 'tone_shift': {
        if (!output.toneShift?.updates) break;
        for (const update of output.toneShift.updates) {
          const uPageId = update.pageId || pageId;
          const uSpotId = update.spotId || spotId;
          if (!uPageId || !uSpotId) continue;
          const uVariantId = update.variantId || 'default';
          applyFieldsWithGjsPatch(uPageId, uSpotId, uVariantId, update.fields);
        }
        break;
      }
    }

    // Increment revision counter to trigger GrapesJS editor remount
    set((s) => ({ contentRevision: s.contentRevision + 1 }));
  },

  // ── Audience Selection Output ──────────────────────────────────────

  applyAudienceSelection: (segments: WizardSegment[]) => {
    const { config } = get();
    if (!config || !Array.isArray(segments)) return;

    // Merge AI-suggested segments with existing config
    const existingSegments = config.audiences.segments;
    const newSegments = [...existingSegments];

    for (const aiSegment of segments) {
      const existingIdx = newSegments.findIndex(
        (s) => s.id === aiSegment.id || s.name.toLowerCase() === aiSegment.name.toLowerCase()
      );
      if (existingIdx >= 0) {
        // Update existing segment
        newSegments[existingIdx] = { ...newSegments[existingIdx], ...aiSegment };
      } else {
        // Add new segment
        newSegments.push(aiSegment);
      }
    }

    // Update config with merged segments
    set({
      config: {
        ...config,
        audiences: {
          ...config.audiences,
          segments: newSegments,
        },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  // ── AI Skill Output ───────────────────────────────────────────────

  applySkillOutput: (step: WizardStep, data: unknown) => {
    const { config } = get();
    if (!config) return;

    switch (step) {
      case 1: {
        const setupUpdates = data as Partial<CampaignSetupData>;
        get().updateSetup(setupUpdates);
        break;
      }
      case 2: {
        const newSegments = data as WizardSegment[];
        const existingIds = new Set(config.audiences.segments.map((s) => s.id));
        const toAdd = newSegments.filter((s) => !existingIds.has(s.id));
        set({
          config: {
            ...config,
            audiences: {
              ...config.audiences,
              segments: [...config.audiences.segments, ...toAdd],
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
        break;
      }
      case 3: {
        // ContentPage[] — merge into existing content pages
        const incomingPages = data as ContentPage[];
        const existingPages = config.content.pages;

        // Merge by pageId: update existing pages, add new ones
        const mergedPages = [...existingPages];
        for (const incoming of incomingPages) {
          const existingIdx = mergedPages.findIndex((p) => p.pageId === incoming.pageId);
          if (existingIdx >= 0) {
            // Merge spots within the page
            const existingPage = mergedPages[existingIdx];
            const mergedSpots = [...existingPage.spots];
            for (const incomingSpot of incoming.spots) {
              const spotIdx = mergedSpots.findIndex((s) => s.spotId === incomingSpot.spotId);
              if (spotIdx >= 0) {
                // Update spot content but preserve user edits to default variant
                mergedSpots[spotIdx] = {
                  ...mergedSpots[spotIdx],
                  defaultVariant: incomingSpot.defaultVariant,
                  variants: incomingSpot.variants,
                  targetingMode: incomingSpot.targetingMode,
                };
              } else {
                mergedSpots.push(incomingSpot);
              }
            }
            mergedPages[existingIdx] = { ...existingPage, spots: mergedSpots };
          } else {
            mergedPages.push(incoming);
          }
        }

        set({
          config: {
            ...config,
            content: { pages: mergedPages },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        });
        break;
      }
      case 4:
        // Review suggestions are displayed, not auto-applied
        break;
    }
  },
}));
