// Campaign Brief Editor type definitions

// Workflow states that drive which major screen/mode is shown
export type EditorWorkflowState = 'editing' | 'generating';

// Section-level visual state
export type BriefSectionState =
  | 'empty'          // Red X, missing data
  | 'default'        // Has data, neutral
  | 'completed'      // Green check
  | 'editing'        // Manual edit mode (Cancel/Save)
  | 'aiEditing'      // Edit with AI popover open
  | 'aiSuggestion';  // Inline AI suggestion card shown

// Section identifiers (matches existing CampaignBlueprintEditor)
export type SectionKey =
  | 'campaignDetails'
  | 'brandProduct'
  | 'businessObjective'
  | 'goals'
  | 'successMetrics'
  | 'campaignScope'
  | 'targetAudience'
  | 'audienceSegments'
  | 'channels'
  | 'budget'
  | 'timeline';

// Quality score for an individual field
export interface QualityFieldScore {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  status: 'green' | 'yellow' | 'red';
}

// Aggregate quality score with field breakdown
export interface QualityScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  label: 'Needs Attention' | 'On Track' | 'Complete';
  itemsNeedingAttention: number;
  fields: QualityFieldScore[];
}

// Inline AI suggestion card data
export interface InlineAISuggestion {
  sectionKey: SectionKey;
  title: string;        // e.g. "Try a small change" or "Suggested"
  description: string;
  isMinor: boolean;     // true = "small change", false = full suggestion
  suggestedUpdates?: Partial<CampaignBriefData>; // Data to apply when accepted
}

// Edit with AI popover state
export interface AIEditPopoverState {
  sectionKey: SectionKey | null;
  instruction: string;
  suggestions: string[];
  isOpen: boolean;
  isLoading: boolean;
}

// Generation step for loading screen
export interface GenerationStep {
  id: number;
  title: string;
  description: string;
  progress: number; // 0-100
  status: 'pending' | 'active' | 'complete';
  visualType: 'progress-bars' | 'data-viz' | 'chart';
}

// Brief data model — all section content
export interface CampaignBriefData {
  campaignDetails: string;
  brandProduct: string;
  businessObjective: string;
  businessObjectiveTags: string[];
  primaryGoals: string[];
  secondaryGoals: string[];
  primaryKpis: string[];
  secondaryKpis: string[];
  inScope: string[];
  outOfScope: string[];
  primaryAudience: string[];
  secondaryAudience: string[];
  mandatoryChannels: string[];
  optionalChannels: string[];
  budgetAmount: string;
  pacing: string;
  phases: string;
  prospectingSegments: string[];
  retargetingSegments: string[];
  suppressionSegments: string[];
  recommendedSegments?: Array<{
    segmentId: string;
    segmentName: string;
    suggestedRole: 'prospecting' | 'retargeting' | 'suppression';
    reason: string;
  }>;
  timelineStart: string;
  timelineEnd: string;
}

// Quality field weights matching the Figma designs (total = 90)
export const BRIEF_QUALITY_WEIGHTS: Record<string, { label: string; maxScore: number }> = {
  campaignName: { label: 'Campaign Name', maxScore: 10 },
  objective: { label: 'Objective', maxScore: 15 },
  budget: { label: 'Budget', maxScore: 15 },
  channels: { label: 'Channels', maxScore: 15 },
  targetAudience: { label: 'Target Audience', maxScore: 15 },
  campaignScope: { label: 'Campaign Scope', maxScore: 5 },
  timeline: { label: 'Timeline', maxScore: 10 },
  kpis: { label: 'KPIs', maxScore: 10 },
};

// Section metadata for rendering
export interface SectionConfig {
  key: SectionKey;
  title: string;
  subtitle: string;
  type: 'text' | 'tags' | 'goals' | 'metrics' | 'scope' | 'audience' | 'audienceSegments' | 'channels' | 'budget' | 'timeline';
}

export const SECTION_CONFIGS: SectionConfig[] = [
  { key: 'campaignDetails', title: 'Campaign Details', subtitle: 'What campaign is this?', type: 'text' },
  { key: 'brandProduct', title: 'Brand / Product', subtitle: 'What campaign is this?', type: 'text' },
  { key: 'businessObjective', title: 'Business Objective', subtitle: 'Why are we doing this?', type: 'tags' },
  { key: 'goals', title: 'Goals', subtitle: 'What success looks like', type: 'goals' },
  { key: 'successMetrics', title: 'Success Metrics', subtitle: 'How success is evaluated', type: 'metrics' },
  { key: 'campaignScope', title: 'Campaign Scope', subtitle: "What's included vs excluded", type: 'scope' },
  { key: 'targetAudience', title: 'Target Audience', subtitle: 'Who this is for', type: 'audience' },
  { key: 'audienceSegments', title: 'Audience Segments', subtitle: 'Activation-ready segments powered by Audience Studio', type: 'audienceSegments' },
  { key: 'channels', title: 'Channels', subtitle: 'Where ads run', type: 'channels' },
  { key: 'budget', title: 'Budget', subtitle: 'How much & how fast', type: 'budget' },
  { key: 'timeline', title: 'Timeline', subtitle: 'When this happens', type: 'timeline' },
];

// Editor reducer action types
export type EditorAction =
  | { type: 'SET_WORKFLOW_STATE'; payload: EditorWorkflowState }
  | { type: 'SET_SECTION_STATE'; payload: { key: SectionKey; state: BriefSectionState } }
  | { type: 'UPDATE_BRIEF_DATA'; payload: Partial<CampaignBriefData> }
  | { type: 'OPEN_AI_EDIT_POPOVER'; payload: { sectionKey: SectionKey } }
  | { type: 'CLOSE_AI_EDIT_POPOVER' }
  | { type: 'UPDATE_AI_EDIT_INSTRUCTION'; payload: string }
  | { type: 'SET_INLINE_SUGGESTION'; payload: { sectionKey: SectionKey; suggestion: InlineAISuggestion | null } }
  | { type: 'ACCEPT_AI_SUGGESTION'; payload: SectionKey }
  | { type: 'DISMISS_AI_SUGGESTION'; payload: SectionKey }
  | { type: 'START_EDITING'; payload: SectionKey }
  | { type: 'CANCEL_EDITING'; payload: SectionKey }
  | { type: 'SAVE_EDITING'; payload: SectionKey }
  | { type: 'TOGGLE_QUALITY_BREAKDOWN' }
  | { type: 'UPDATE_GENERATION_STEP'; payload: { stepId: number; progress: number; status: GenerationStep['status'] } }
  | { type: 'SET_GENERATION_STEPS'; payload: GenerationStep[] }
  | { type: 'TOGGLE_AI_SUGGESTIONS' }
  | { type: 'SET_BRIEF_DATA'; payload: CampaignBriefData };

// Editor state shape
export interface EditorState {
  workflowState: EditorWorkflowState;
  sectionStates: Record<SectionKey, BriefSectionState>;
  briefData: CampaignBriefData;
  qualityScore: QualityScore;
  aiEditPopover: AIEditPopoverState;
  inlineSuggestions: Record<SectionKey, InlineAISuggestion | null>;
  generationSteps: GenerationStep[];
  isQualityBreakdownExpanded: boolean;
  showAISuggestions: boolean;
  aiSuggestionsLoading: boolean;
  pendingSuggestionRequest: boolean;
}
