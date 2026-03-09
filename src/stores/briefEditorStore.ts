/**
 * Brief Editor Store — Zustand store for Campaign Brief Editor state.
 * Replaces the CampaignBriefEditorContext from the Next.js version.
 */

import { create } from 'zustand';
import type {
  EditorState,
  EditorWorkflowState,
  SectionKey,
  BriefSectionState,
  CampaignBriefData,
  QualityScore,
  GenerationStep,
  AIEditPopoverState,
  InlineAISuggestion,
} from '../types/campaignBriefEditor';
import { BRIEF_QUALITY_WEIGHTS } from '../types/campaignBriefEditor';
import { useBlueprintStore } from './blueprintStore';

// Default empty brief data
const defaultBriefData: CampaignBriefData = {
  campaignDetails: '',
  brandProduct: '',
  businessObjective: '',
  businessObjectiveTags: [],
  primaryGoals: [],
  secondaryGoals: [],
  primaryKpis: [],
  secondaryKpis: [],
  inScope: [],
  outOfScope: [],
  primaryAudience: [],
  secondaryAudience: [],
  mandatoryChannels: [],
  optionalChannels: [],
  budgetAmount: '',
  pacing: '',
  phases: '',
  prospectingSegments: [],
  retargetingSegments: [],
  suppressionSegments: [],
  timelineStart: '',
  timelineEnd: '',
};

const defaultSectionStates: Record<SectionKey, BriefSectionState> = {
  campaignDetails: 'empty',
  brandProduct: 'empty',
  businessObjective: 'empty',
  goals: 'empty',
  successMetrics: 'empty',
  campaignScope: 'empty',
  targetAudience: 'empty',
  audienceSegments: 'empty',
  channels: 'empty',
  budget: 'empty',
  timeline: 'empty',
};

/** Check whether a section has meaningful data filled in. */
function isSectionFilled(key: SectionKey, data: CampaignBriefData): boolean {
  switch (key) {
    case 'campaignDetails': return !!data.campaignDetails;
    case 'brandProduct': return !!data.brandProduct;
    case 'businessObjective': return data.businessObjectiveTags.length > 0 || !!data.businessObjective;
    case 'goals': return data.primaryGoals.length > 0 || data.secondaryGoals.length > 0;
    case 'successMetrics': return data.primaryKpis.length > 0 || data.secondaryKpis.length > 0;
    case 'campaignScope': return data.inScope.length > 0 || data.outOfScope.length > 0;
    case 'targetAudience': return data.primaryAudience.length > 0 || data.secondaryAudience.length > 0;
    case 'audienceSegments': return data.prospectingSegments.length > 0 || data.retargetingSegments.length > 0 || data.suppressionSegments.length > 0;
    case 'channels': return data.mandatoryChannels.length > 0 || data.optionalChannels.length > 0;
    case 'budget': return !!data.budgetAmount;
    case 'timeline': return !!data.timelineStart || !!data.timelineEnd;
    default: return false;
  }
}

/** Recompute section states based on current data, preserving non-idle states like editing/aiEditing. */
function recomputeSectionStates(
  current: Record<SectionKey, BriefSectionState>,
  data: CampaignBriefData,
): Record<SectionKey, BriefSectionState> {
  const updated = { ...current };
  const staticStates: BriefSectionState[] = ['editing', 'aiEditing', 'aiSuggestion'];
  for (const key of Object.keys(updated) as SectionKey[]) {
    if (staticStates.includes(updated[key])) continue;
    updated[key] = isSectionFilled(key, data) ? 'completed' : 'empty';
  }
  return updated;
}

function computeQualityScore(data: CampaignBriefData): QualityScore {
  const fields = Object.entries(BRIEF_QUALITY_WEIGHTS).map(([key, { label, maxScore }]) => {
    let score = 0;
    switch (key) {
      case 'campaignName':
        if (data.campaignDetails) score = maxScore;
        break;
      case 'objective':
        if (data.businessObjectiveTags.length > 0 || data.businessObjective) score = maxScore;
        else if (data.primaryGoals.length > 0) score = maxScore * 0.5;
        break;
      case 'budget':
        if (data.budgetAmount) score = maxScore;
        break;
      case 'channels':
        if (data.mandatoryChannels.length > 0) score = maxScore;
        else if (data.optionalChannels.length > 0) score = maxScore * 0.5;
        break;
      case 'targetAudience':
        if (data.primaryAudience.length > 0) score = maxScore;
        else if (data.secondaryAudience.length > 0) score = maxScore * 0.5;
        break;
      case 'timeline':
        if (data.timelineStart && data.timelineEnd) score = maxScore;
        else if (data.timelineStart || data.timelineEnd) score = maxScore * 0.5;
        break;
      case 'campaignScope':
        if (data.inScope.length > 0 && data.outOfScope.length > 0) score = maxScore;
        else if (data.inScope.length > 0 || data.outOfScope.length > 0) score = maxScore * 0.5;
        break;
      case 'kpis':
        if (data.primaryKpis.length > 0) score = maxScore;
        break;
    }
    const status: 'green' | 'yellow' | 'red' =
      score >= maxScore * 0.8 ? 'green' : score > 0 ? 'yellow' : 'red';
    return { key, label, score, maxScore, status };
  });

  const totalScore = fields.reduce((s, f) => s + f.score, 0);
  const maxScore = fields.reduce((s, f) => s + f.maxScore, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const itemsNeedingAttention = fields.filter((f) => f.status === 'red').length;

  return {
    totalScore,
    maxScore,
    percentage,
    label: percentage >= 80 ? 'Complete' : percentage >= 50 ? 'On Track' : 'Needs Attention',
    itemsNeedingAttention,
    fields,
  };
}

interface BriefEditorStore {
  state: EditorState;
  canUndo: boolean;
  canRedo: boolean;
  // Workflow
  setWorkflowState: (ws: EditorWorkflowState) => void;
  startGeneration: () => void;
  // Section editing
  startEditing: (key: SectionKey) => void;
  cancelEditing: (key: SectionKey) => void;
  saveEditing: (key: SectionKey) => void;
  // Brief data
  updateBriefData: (updates: Partial<CampaignBriefData>) => void;
  setBriefData: (data: CampaignBriefData) => void;
  // AI edit popover
  openAIEditPopover: (key: SectionKey) => void;
  closeAIEditPopover: () => void;
  setAIEditLoading: (loading: boolean) => void;
  // AI suggestions
  toggleAISuggestions: () => void;
  setInlineSuggestions: (suggestions: Partial<Record<SectionKey, InlineAISuggestion | null>>) => void;
  setAISuggestionsLoading: (loading: boolean) => void;
  setPendingSuggestionRequest: (pending: boolean) => void;
  acceptAISuggestion: (key: SectionKey) => void;
  dismissAISuggestion: (key: SectionKey) => void;
  // Quality
  toggleQualityBreakdown: () => void;
  // Generation steps
  setGenerationSteps: (steps: GenerationStep[]) => void;
  updateGenerationStep: (stepId: number, progress: number, status: GenerationStep['status']) => void;
  // Undo/redo
  undo: () => void;
  redo: () => void;
  // Reset
  reset: () => void;
}

const defaultAIEditPopover: AIEditPopoverState = {
  sectionKey: null,
  instruction: '',
  suggestions: [],
  isOpen: false,
  isLoading: false,
};

const undoStack: Partial<CampaignBriefData>[] = [];
const redoStack: Partial<CampaignBriefData>[] = [];

export const useBriefEditorStore = create<BriefEditorStore>((set, get) => ({
  canUndo: false,
  canRedo: false,
  state: {
    workflowState: 'editing',
    sectionStates: { ...defaultSectionStates },
    briefData: { ...defaultBriefData },
    qualityScore: computeQualityScore(defaultBriefData),
    aiEditPopover: { ...defaultAIEditPopover },
    inlineSuggestions: {
      campaignDetails: null,
      brandProduct: null,
      businessObjective: null,
      goals: null,
      successMetrics: null,
      campaignScope: null,
      targetAudience: null,
      audienceSegments: null,
      channels: null,
      budget: null,
      timeline: null,
    },
    generationSteps: [],
    isQualityBreakdownExpanded: false,
    showAISuggestions: false,
    aiSuggestionsLoading: false,
    pendingSuggestionRequest: false,
  },

  setWorkflowState: (ws) =>
    set((prev) => ({ state: { ...prev.state, workflowState: ws } })),

  startGeneration: () => {
    // Clear stale blueprints so the loading screen shows instead of old data
    useBlueprintStore.getState().clearAll();
    set((prev) => ({ state: { ...prev.state, workflowState: 'generating' } }));
  },

  startEditing: (key) =>
    set((prev) => ({
      state: {
        ...prev.state,
        sectionStates: { ...prev.state.sectionStates, [key]: 'editing' as BriefSectionState },
      },
    })),

  cancelEditing: (key) =>
    set((prev) => {
      const filled = isSectionFilled(key, prev.state.briefData);
      return {
        state: {
          ...prev.state,
          sectionStates: { ...prev.state.sectionStates, [key]: filled ? 'completed' : 'empty' },
        },
      };
    }),

  saveEditing: (key) =>
    set((prev) => ({
      state: {
        ...prev.state,
        sectionStates: { ...prev.state.sectionStates, [key]: 'completed' as BriefSectionState },
      },
    })),

  updateBriefData: (updates) =>
    set((prev) => {
      undoStack.push({ ...prev.state.briefData });
      redoStack.length = 0;
      const newData = { ...prev.state.briefData, ...updates };
      return {
        state: {
          ...prev.state,
          briefData: newData,
          qualityScore: computeQualityScore(newData),
          sectionStates: recomputeSectionStates(prev.state.sectionStates, newData),
        },
        canUndo: undoStack.length > 0,
        canRedo: false,
      };
    }),

  setBriefData: (data) =>
    set((prev) => ({
      state: {
        ...prev.state,
        briefData: data,
        qualityScore: computeQualityScore(data),
        sectionStates: recomputeSectionStates(prev.state.sectionStates, data),
      },
    })),

  openAIEditPopover: (key) =>
    set((prev) => ({
      state: {
        ...prev.state,
        aiEditPopover: { ...prev.state.aiEditPopover, isOpen: true, sectionKey: key },
        sectionStates: { ...prev.state.sectionStates, [key]: 'aiEditing' as BriefSectionState },
      },
    })),

  closeAIEditPopover: () =>
    set((prev) => {
      const key = prev.state.aiEditPopover.sectionKey;
      const newState = key
        ? (isSectionFilled(key, prev.state.briefData) ? 'completed' : 'empty') as BriefSectionState
        : null;
      return {
        state: {
          ...prev.state,
          aiEditPopover: { ...defaultAIEditPopover },
          sectionStates: key && newState
            ? { ...prev.state.sectionStates, [key]: newState }
            : prev.state.sectionStates,
        },
      };
    }),

  setAIEditLoading: (loading) =>
    set((prev) => ({
      state: {
        ...prev.state,
        aiEditPopover: { ...prev.state.aiEditPopover, isLoading: loading },
      },
    })),

  toggleAISuggestions: () =>
    set((prev) => {
      const turningOff = prev.state.showAISuggestions;
      if (turningOff) {
        const clearedSuggestions = { ...prev.state.inlineSuggestions };
        const updatedSectionStates = { ...prev.state.sectionStates };
        for (const key of Object.keys(clearedSuggestions) as SectionKey[]) {
          if (clearedSuggestions[key]) {
            clearedSuggestions[key] = null;
            updatedSectionStates[key] = 'default';
          }
        }
        return {
          state: {
            ...prev.state,
            showAISuggestions: false,
            inlineSuggestions: clearedSuggestions,
            sectionStates: updatedSectionStates,
          },
        };
      }
      return { state: { ...prev.state, showAISuggestions: true } };
    }),

  setInlineSuggestions: (suggestions) =>
    set((prev) => {
      const updated = { ...prev.state.inlineSuggestions };
      const updatedSectionStates = { ...prev.state.sectionStates };
      for (const [key, value] of Object.entries(suggestions)) {
        const sKey = key as SectionKey;
        updated[sKey] = value ?? null;
        if (value) {
          updatedSectionStates[sKey] = 'aiSuggestion' as BriefSectionState;
        }
      }
      return {
        state: {
          ...prev.state,
          inlineSuggestions: updated,
          sectionStates: updatedSectionStates,
        },
      };
    }),

  setAISuggestionsLoading: (loading) =>
    set((prev) => ({
      state: { ...prev.state, aiSuggestionsLoading: loading },
    })),

  setPendingSuggestionRequest: (pending) =>
    set((prev) => ({
      state: { ...prev.state, pendingSuggestionRequest: pending },
    })),

  acceptAISuggestion: (key) =>
    set((prev) => {
      const suggestion = prev.state.inlineSuggestions[key];
      const newData = suggestion?.suggestedUpdates
        ? { ...prev.state.briefData, ...suggestion.suggestedUpdates }
        : prev.state.briefData;
      return {
        state: {
          ...prev.state,
          briefData: newData,
          qualityScore: computeQualityScore(newData),
          inlineSuggestions: { ...prev.state.inlineSuggestions, [key]: null },
          sectionStates: { ...prev.state.sectionStates, [key]: 'completed' as BriefSectionState },
        },
      };
    }),

  dismissAISuggestion: (key) =>
    set((prev) => ({
      state: {
        ...prev.state,
        inlineSuggestions: { ...prev.state.inlineSuggestions, [key]: null },
        sectionStates: { ...prev.state.sectionStates, [key]: 'default' as BriefSectionState },
      },
    })),

  toggleQualityBreakdown: () =>
    set((prev) => ({
      state: {
        ...prev.state,
        isQualityBreakdownExpanded: !prev.state.isQualityBreakdownExpanded,
      },
    })),

  setGenerationSteps: (steps) =>
    set((prev) => ({ state: { ...prev.state, generationSteps: steps } })),

  updateGenerationStep: (stepId, progress, status) =>
    set((prev) => ({
      state: {
        ...prev.state,
        generationSteps: prev.state.generationSteps.map((s) =>
          s.id === stepId ? { ...s, progress, status } : s
        ),
      },
    })),

  undo: () => {
    if (undoStack.length === 0) return;
    const prevData = undoStack.pop()!;
    set((prev) => {
      redoStack.push({ ...prev.state.briefData });
      const restored = { ...prev.state.briefData, ...prevData };
      return {
        state: {
          ...prev.state,
          briefData: restored,
          qualityScore: computeQualityScore(restored),
        },
        canUndo: undoStack.length > 0,
        canRedo: true,
      };
    });
  },

  redo: () => {
    if (redoStack.length === 0) return;
    const nextData = redoStack.pop()!;
    set((prev) => {
      undoStack.push({ ...prev.state.briefData });
      const restored = { ...prev.state.briefData, ...nextData };
      return {
        state: {
          ...prev.state,
          briefData: restored,
          qualityScore: computeQualityScore(restored),
        },
        canUndo: true,
        canRedo: redoStack.length > 0,
      };
    });
  },

  reset: () => {
    undoStack.length = 0;
    redoStack.length = 0;
    set({
      canUndo: false,
      canRedo: false,
      state: {
        workflowState: 'editing',
        sectionStates: { ...defaultSectionStates },
        briefData: { ...defaultBriefData },
        qualityScore: computeQualityScore(defaultBriefData),
        aiEditPopover: { ...defaultAIEditPopover },
        inlineSuggestions: {
          campaignDetails: null,
          brandProduct: null,
          businessObjective: null,
          goals: null,
          successMetrics: null,
          campaignScope: null,
          targetAudience: null,
          audienceSegments: null,
          channels: null,
          budget: null,
          timeline: null,
        },
        generationSteps: [],
        isQualityBreakdownExpanded: false,
        showAISuggestions: false,
        aiSuggestionsLoading: false,
        pendingSuggestionRequest: false,
      },
    });
  },
}));
