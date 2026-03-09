/**
 * Brief-to-Config Mapper — pure function that creates a CampaignConfig
 * from a CampaignBrief, optionally matching audience segments against
 * TDX child segments.
 *
 * Step 3 content is sourced from the Pages step (SavedPage/Spot).
 */

import type { CampaignBrief } from '../types/brief';
import type {
  CampaignConfig,
  CampaignSetupData,
  WizardSegment,
  ContentPage,
  ContentSpot,
  VariantContent,
} from '../types/campaignConfig';
import type { SavedPage } from '../types/page';
import { CURRENT_SCHEMA_VERSION, campaignConfigStorage } from './campaignConfigStorage';
import { localPageStorage } from './pageStorage';

// ── Spot-type normalization ──────────────────────────────────────────

function normalizeSpotType(raw: string): string {
  const lower = raw.toLowerCase();
  const ALIAS: Record<string, string> = {
    heading: 'headline',
    text: 'container',
    cta: 'cta_button',
    image: 'hero_image',
    media: 'hero_image',
    list: 'container',
    form: 'custom',
    input: 'custom',
  };
  return ALIAS[lower] ?? lower;
}

// ── Spot-type field mapping ─────────────────────────────────────────

const SPOT_TYPE_FIELD_MAP: Record<string, (keyof VariantContent)[]> = {
  headline:               ['headline'],
  cta_button:             ['ctaText', 'deepLinkUrl'],
  hero_image:             ['headline', 'imageUrl', 'deepLinkUrl'],
  header_greeting:        ['headline'],
  navigation:             [],
  product_recommendation: ['headline', 'body', 'ctaText', 'imageUrl', 'deepLinkUrl'],
  testimonial:            ['headline', 'body'],
  container:              ['body', 'headline', 'ctaText'],
  custom:                 ['headline', 'body', 'ctaText', 'imageUrl', 'deepLinkUrl'],
};

const ALL_VARIANT_FIELDS: (keyof VariantContent)[] = ['headline', 'body', 'ctaText', 'imageUrl', 'deepLinkUrl'];

/**
 * Filter a source VariantContent to only include fields relevant to the given spot type.
 * Unknown spot types fall back to 'custom' (all fields).
 */
export function contentForSpotType(
  spotType: string,
  source: Partial<VariantContent>,
): VariantContent {
  const allowedFields = SPOT_TYPE_FIELD_MAP[normalizeSpotType(spotType)] ?? SPOT_TYPE_FIELD_MAP.custom;
  const result: VariantContent = { headline: '', body: '', ctaText: '', imageUrl: '', deepLinkUrl: '' };
  for (const field of ALL_VARIANT_FIELDS) {
    if (allowedFields.includes(field) && source[field]) {
      (result as unknown as Record<string, string>)[field] = source[field] as string;
    }
  }
  return result;
}

/**
 * Look up segment-specific content from the brief's segmentMessages and filter by spot type.
 * Falls back to the default experience section content if no segment match is found.
 */
export function contentForSegment(
  spotType: string,
  segmentName: string,
  brief: CampaignBrief,
): VariantContent {
  const { experience } = brief.sections;
  const segMatch = experience.segmentMessages?.find(
    (sm) => sm.segmentName.toLowerCase() === segmentName.toLowerCase(),
  );

  if (segMatch && segMatch.messages.length > 0) {
    const msg = segMatch.messages[0];
    return contentForSpotType(spotType, {
      headline: msg.headline || '',
      body: msg.bodyMessage || '',
      ctaText: msg.ctaText || '',
    });
  }

  // Fall back to default experience content
  return contentForSpotType(spotType, {
    headline: experience.headline || '',
    body: experience.bodyMessage || '',
    ctaText: experience.ctaText || '',
  });
}

/**
 * Look up per-spot default content from the brief's spotCreatives.
 * Falls back to flat experience content via contentForSpotType() if no match.
 */
export function contentForSpotFromBrief(
  spotId: string,
  spotType: string,
  brief: CampaignBrief,
): VariantContent {
  const { experience } = brief.sections;
  const spotCreative = experience.spotCreatives?.find(
    (sc) => sc.spotId === spotId,
  );

  if (spotCreative) {
    const { defaultContent } = spotCreative;
    return contentForSpotType(spotType, {
      headline: defaultContent.headline || '',
      body: defaultContent.bodyMessage || '',
      ctaText: defaultContent.ctaText || '',
    });
  }

  // Fall back to flat experience content
  return contentForSpotType(spotType, {
    headline: experience.headline || '',
    body: experience.bodyMessage || '',
    ctaText: experience.ctaText || '',
  });
}

/**
 * Look up per-spot segment content from the brief's spotCreatives.
 * Falls back to contentForSegment() if no spotCreative match.
 */
export function contentForSpotSegment(
  spotId: string,
  spotType: string,
  segmentName: string,
  brief: CampaignBrief,
): VariantContent {
  const { experience } = brief.sections;
  const spotCreative = experience.spotCreatives?.find(
    (sc) => sc.spotId === spotId,
  );

  if (spotCreative) {
    const segContent = spotCreative.segmentContent?.find(
      (seg) => seg.segmentName.toLowerCase() === segmentName.toLowerCase(),
    );
    if (segContent) {
      return contentForSpotType(spotType, {
        headline: segContent.content.headline || '',
        body: segContent.content.bodyMessage || '',
        ctaText: segContent.content.ctaText || '',
      });
    }
    // Spot found but no segment match — use spot's default
    const { defaultContent } = spotCreative;
    return contentForSpotType(spotType, {
      headline: defaultContent.headline || '',
      body: defaultContent.bodyMessage || '',
      ctaText: defaultContent.ctaText || '',
    });
  }

  // No spot match — fall back to segmentMessages-based lookup
  return contentForSegment(spotType, segmentName, brief);
}

// ── Goal type inference ─────────────────────────────────────────────

function inferGoalType(businessGoal: string): CampaignSetupData['goalType'] {
  const lower = businessGoal.toLowerCase();
  if (/engag/i.test(lower)) return 'engagement';
  if (/retain|retention|loyal|lifetime/i.test(lower)) return 'retention';
  if (/revenue|aov|order\s*value|maximize\s*revenue/i.test(lower)) return 'revenue';
  if (/awareness|brand/i.test(lower)) return 'awareness';
  return 'conversion';
}

// ── Fuzzy segment matching ──────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(briefSegment: string, tdxSegment: string): boolean {
  const a = normalize(briefSegment);
  const b = normalize(tdxSegment);
  return a === b || b.includes(a) || a.includes(b);
}

// ── ID generators ───────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Default variant content ─────────────────────────────────────────

function makeDefaultContent(brief: CampaignBrief): VariantContent {
  const { experience } = brief.sections;
  return {
    headline: experience.headline || '',
    body: experience.bodyMessage || '',
    ctaText: experience.ctaText || '',
    imageUrl: '',
    deepLinkUrl: '',
  };
}

// ── Spot-type-aware content mapping ─────────────────────────────────

/**
 * Returns VariantContent appropriate for the given spot type.
 * Product recommendation spots get Liquid template tag defaults
 * mapped into VariantContent fields (productName→headline,
 * productDescription→body, productPrice→ctaText).
 */
function contentForSpot(
  spotType: string,
  fallback: VariantContent,
): VariantContent {
  if (spotType === 'product_recommendation') {
    return {
      ...fallback,
      headline: '{{ product.name }}',
      body: '{{ product.description }}',
      ctaText: '{{ product.price }}',
    };
  }
  return { ...fallback };
}

// ── Convert SavedPages to ContentPages ──────────────────────────────

function savedPagesToContentPages(
  savedPages: SavedPage[],
  defaultContent: VariantContent,
  brief?: CampaignBrief,
): ContentPage[] {
  return savedPages.map((page): ContentPage => ({
    pageId: page.id,
    pageName: page.pageName,
    pageUrlPattern: page.websiteUrl,
    thumbnail: {
      type: page.thumbnailDataUrl ? 'screenshot' : 'placeholder',
      url: page.thumbnailDataUrl || '',
      alt: page.pageName,
    },
    spots: page.spots.map((spot): ContentSpot => {
      const spotContent = contentForSpot(spot.type, defaultContent);
      return {
        spotId: spot.id,
        spotName: spot.name,
        spotType: spot.type,
        selector: spot.selector,
        thumbnail: {
          type: 'placeholder',
          url: '',
          alt: `${spot.name} on ${page.pageName}`,
        },
        targetingMode: 'default_only',
        defaultVariant: spotContent,
        variants: [],
      };
    }),
  }));
}

// ── Main mapper ─────────────────────────────────────────────────────

interface TdxChildSegment {
  id: string;
  name: string;
  count?: string;
  description?: string;
  rules?: Array<{ rule: string; value: string }>;
}

export function mapBriefToConfig(
  brief: CampaignBrief,
  parentSegmentId?: string,
  childSegments?: TdxChildSegment[]
): CampaignConfig {
  const { overview, audience, measurement } = brief.sections;

  // ── Step 1: Setup ───────────────────────────────────────────────
  const setup: CampaignSetupData = {
    name: overview.campaignName,
    objective: overview.objective,
    businessGoal: overview.businessGoal,
    goalType: inferGoalType(overview.businessGoal),
    startDate: overview.timelineStart,
    endDate: overview.timelineEnd,
    primaryKpi: measurement.primaryKpi,
    secondaryKpis: measurement.secondaryKpis,
  };

  // ── Step 2: Audiences ───────────────────────────────────────────
  const segments: WizardSegment[] = [];
  const resolvedParentId = parentSegmentId || '';

  // Use recommendedAudiences (rich data) when available, fall back to segments (name-only)
  const recAudiences = audience.recommendedAudiences || [];
  const briefSegmentNames = recAudiences.length > 0
    ? recAudiences.map((ra) => ra.name)
    : audience.segments;

  // Helper to find a recommendedAudience by name for carrying over description/size
  const findRecAudience = (name: string) =>
    recAudiences.find((ra) => fuzzyMatch(ra.name, name));

  if (childSegments && childSegments.length > 0) {
    const matchedBriefSegments = new Set<string>();

    for (const child of childSegments) {
      const matchedBrief = briefSegmentNames.find((bs) => fuzzyMatch(bs, child.name));
      const ra = matchedBrief ? findRecAudience(matchedBrief) : undefined;
      segments.push({
        id: child.id,
        name: child.name,
        parentSegmentId: resolvedParentId,
        count: child.count || ra?.estimatedSize,
        description: child.description || ra?.description,
        rules: child.rules,
        isNew: false,
        isSelected: !!matchedBrief,
        source: 'tdx',
      });
      if (matchedBrief) matchedBriefSegments.add(matchedBrief);
    }

    for (const bs of briefSegmentNames) {
      if (!matchedBriefSegments.has(bs)) {
        const ra = findRecAudience(bs);
        segments.push({
          id: ra?.tdxSegmentId || makeId('seg'),
          name: bs,
          parentSegmentId: resolvedParentId,
          count: ra?.estimatedSize,
          description: ra?.description,
          isNew: !ra || ra.status === 'new',
          isSelected: ra?.isSelected ?? false,
          source: 'brief',
        });
      }
    }
  } else {
    for (const bs of briefSegmentNames) {
      const ra = findRecAudience(bs);
      segments.push({
        id: ra?.tdxSegmentId || makeId('seg'),
        name: bs,
        parentSegmentId: resolvedParentId,
        count: ra?.estimatedSize,
        description: ra?.description,
        isNew: !ra || ra.status === 'new',
        isSelected: ra?.isSelected ?? true,
        source: 'brief',
      });
    }
  }

  // ── Step 3: Content — sourced from Pages step ─────────────────
  const savedPages = localPageStorage.listPages();
  const defaultContent = makeDefaultContent(brief);
  const contentPages = savedPagesToContentPages(savedPages, defaultContent, brief);

  // ── Step 4: Review ──────────────────────────────────────────────
  const now = new Date().toISOString();

  // Assign next available rank
  const existingConfigs = campaignConfigStorage.listConfigs();
  const nextRank = existingConfigs.length > 0
    ? Math.max(...existingConfigs.map((c) => c.rank ?? 0)) + 1
    : 1;

  return {
    id: makeId('config'),
    briefId: brief.id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    status: 'draft',
    currentStep: 1,
    rank: nextRank,
    createdAt: now,
    updatedAt: now,
    setup,
    audiences: {
      parentSegmentId: resolvedParentId,
      segments,
      recommendedAudiences: recAudiences.length > 0 ? recAudiences : undefined,
    },
    content: {
      pages: contentPages,
    },
    review: {
      trafficAllocation: 100,
      priority: 50,
      notes: '',
    },
  };
}
