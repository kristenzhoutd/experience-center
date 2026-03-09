/**
 * Campaign Configuration types — structured, editable config documents
 * derived from a CampaignBrief via the wizard workflow.
 */

// ── Step 1: Campaign Setup ──────────────────────────────────────────

export interface CampaignSetupData {
  name: string;
  objective: string;
  businessGoal: string;
  goalType: 'conversion' | 'engagement' | 'retention' | 'revenue' | 'awareness';
  startDate: string;
  endDate: string;
  primaryKpi: string;
  secondaryKpis: string[];
}

// ── Step 2: Audiences ───────────────────────────────────────────────

export interface WizardSegment {
  id: string;
  name: string;
  parentSegmentId: string;
  count?: string;
  description?: string;
  rules?: Array<{ rule: string; value: string }>;
  isNew: boolean;
  isSelected: boolean;
  source: 'tdx' | 'brief';
}

export interface AudiencesStepData {
  parentSegmentId: string;
  segments: WizardSegment[];
  /** Original recommendedAudiences from the brief, preserved for remapping. */
  recommendedAudiences?: import('./brief').RecommendedAudience[];
}

// ── Step 3: Content ─────────────────────────────────────────────────

export interface ContentThumbnail {
  type: 'screenshot' | 'placeholder';
  url: string;
  alt: string;
}

export interface VariantContent {
  headline: string;
  body: string;
  ctaText: string;
  imageUrl: string;
  deepLinkUrl: string;
  // GrapesJS rich editor data (optional, added when editor is used)
  gjsProjectData?: Record<string, unknown>;  // Full GrapesJS project JSON for save/restore
  gjsHtml?: string;                           // Rendered HTML output
  gjsCss?: string;                            // Rendered CSS output
}

export interface ContentVariant {
  variantId: string;
  audienceType: 'segment' | 'audience';
  audienceName: string;
  audienceRefId: string;
  priority: number;
  content: VariantContent;
}

export type SpotTargetingMode = 'default_only' | 'segment_variants';

export interface ContentSpot {
  spotId: string;
  spotName: string;
  spotType: string;
  selector: string;
  thumbnail: ContentThumbnail;
  targetingMode: SpotTargetingMode;
  defaultVariant: VariantContent;
  variants: ContentVariant[];
}

export interface ContentPage {
  pageId: string;
  pageName: string;
  pageUrlPattern: string;
  thumbnail: ContentThumbnail;
  spots: ContentSpot[];
}

export interface ContentStepData {
  pages: ContentPage[];
}

// Legacy types kept for migration
/** @deprecated Use ContentPage/ContentSpot/ContentVariant */
export interface ContentPlacement {
  id: string;
  name: string;
  page: string;
}

/** @deprecated Use ContentVariant */
export interface ContentVariantData {
  id: string;
  segmentId: string;
  placementId: string;
  headline: string;
  body: string;
  ctaText: string;
  offerType: string;
  offerValue: string;
  tone: string;
}

// ── Step 4: Review ──────────────────────────────────────────────────

export interface ReviewStepData {
  trafficAllocation: number;
  priority: number;
  notes: string;
}

// ── Campaign Config (persisted) ─────────────────────────────────────

export type ConfigStatus = 'draft' | 'ready' | 'launched';
export type WizardStep = 1 | 2 | 3 | 4;

export interface CampaignConfig {
  id: string;
  briefId: string;
  schemaVersion: number;
  status: ConfigStatus;
  currentStep: WizardStep;
  rank: number;
  createdAt: string;
  updatedAt: string;
  setup: CampaignSetupData;
  audiences: AudiencesStepData;
  content: ContentStepData;
  review: ReviewStepData;
}
