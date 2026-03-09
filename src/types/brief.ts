/**
 * Campaign Brief types — structured, editable brief documents
 * populated by AI from chat input and editable by the user.
 */

// ── Base section interface ──────────────────────────────────────────

export interface BriefSectionBase {
  locked?: boolean;
  userEditedFields?: string[];
  notes?: string;
}

// ── Per-segment message types ───────────────────────────────────────

export interface CampaignMessage {
  headline: string;
  bodyMessage: string;
  ctaText: string;
  productName?: string;
  productDescription?: string;
  productPrice?: string;
}

export interface SegmentMessages {
  segmentName: string;
  messages: CampaignMessage[];
}

// ── Per-spot creative types ─────────────────────────────────────────

export interface SpotSegmentCreative {
  segmentName: string;
  content: CampaignMessage;
}

export interface SpotCreative {
  spotId: string;
  spotName: string;
  spotType: string;
  pageName: string;
  pageId: string;
  defaultContent: CampaignMessage;
  segmentContent: SpotSegmentCreative[];
}

// ── Recommended audience type ───────────────────────────────────────

export interface RecommendedAudience {
  name: string;
  description: string;
  status: 'existing' | 'new';
  tdxSegmentId?: string;
  estimatedSize?: string;
  isSelected: boolean;
}

// ── Section interfaces ──────────────────────────────────────────────

export interface BriefOverviewSection extends BriefSectionBase {
  campaignName: string;
  objective: string;
  businessGoal: string;
  timelineStart: string;
  timelineEnd: string;
}

export interface BriefAudienceSection extends BriefSectionBase {
  primaryAudience: string;
  audienceSize: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  segments: string[];
  recommendedAudiences: RecommendedAudience[];
}

export interface BriefExperienceSection extends BriefSectionBase {
  headline: string;
  bodyMessage: string;
  ctaText: string;
  placements: string[];
  segmentMessages: SegmentMessages[];
  spotCreatives?: SpotCreative[];
}

export interface BriefMeasurementSection extends BriefSectionBase {
  primaryKpi: string;
  secondaryKpis: string[];
  secondaryMetrics: string[];
  successCriteria: string[];
  risks: string[];
}

// ── Section key union ───────────────────────────────────────────────

export type BriefSectionKey =
  | 'overview'
  | 'audience'
  | 'experience'
  | 'measurement';

// ── Sections map ────────────────────────────────────────────────────

export interface BriefSections {
  overview: BriefOverviewSection;
  audience: BriefAudienceSection;
  experience: BriefExperienceSection;
  measurement: BriefMeasurementSection;
}

// ── Campaign Brief ──────────────────────────────────────────────────

export type BriefStatus = 'draft' | 'in_review' | 'approved' | 'active';

export type BriefSuite = 'personalization' | 'paid-media';

export interface CampaignBrief {
  id: string;
  name: string;
  status: BriefStatus;
  createdAt: string;
  updatedAt: string;
  sourceMessage: string;
  sections: BriefSections;
  /** Which suite created this brief. Undefined treated as 'paid-media' for backwards compat. */
  suite?: BriefSuite;
}
