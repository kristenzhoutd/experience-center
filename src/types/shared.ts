// Domain Types for Web Personalization Tool
// Ported from @wpt/shared

// ============ Campaign ============
export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  goal: CampaignGoal;
  status: CampaignStatus;
  segments: Segment[];
  contentAssignments: ContentAssignment[];
  createdAt: Date;
  updatedAt: Date;
  launchedAt?: Date;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface CampaignGoal {
  type: 'increase_conversions' | 'increase_engagement' | 'reduce_bounce' | 'custom';
  description: string;
  targetMetric?: string;
  targetValue?: number;
}

// ============ Segments ============
export interface Segment {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentRule {
  id: string;
  attribute: string;
  operator: RuleOperator;
  value: string | number | boolean | string[];
  conjunction: 'AND' | 'OR';
}

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists';

// ============ Content Spots ============
export interface ContentSpot {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: ContentSpotType;
  selector: string;
  pageUrl: string;
  defaultContent?: ContentVariant;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentSpotType = 'headline' | 'cta_button' | 'hero_image' | 'header_greeting' | 'navigation' | 'product_recommendation' | 'testimonial' | 'custom';

// ============ Content ============
export interface ContentVariant {
  id: string;
  type: 'image' | 'text' | 'html';
  content: ImageContent | TextContent | HTMLContent;
}

export interface ImageContent {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface TextContent {
  text: string;
  style?: Record<string, string>;
}

export interface HTMLContent {
  html: string;
}

export interface ContentAssignment {
  id: string;
  campaignId: string;
  segmentId: string;
  contentSpotId: string;
  variant: ContentVariant;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Chat / AI ============
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  campaignDraft?: Partial<Campaign>;
  suggestions?: AISuggestion[];
  clarifyingQuestions?: string[];
  segments?: unknown[]; // StreamSegment[] from streaming - stored as finalized segments
  runId?: string; // Execution trace run ID for this message
  contentOptions?: {
    field: 'headline' | 'body' | 'ctaText';
    options: Array<{ label: string; value: string; rationale: string }>;
    target?: { pageId?: string; spotId?: string; variantId?: string };
    selectedIndex?: number; // set when user picks an option
  };
}

export interface AISuggestion {
  type: 'segment' | 'content' | 'goal';
  suggestion: Segment | ContentVariant | CampaignGoal;
  reasoning: string;
  confidence: number;
}
