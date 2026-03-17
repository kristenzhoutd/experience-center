import { create } from 'zustand';

export type FlowStep = 'industry' | 'scenario' | 'inputs' | 'generating' | 'output';

export interface OutputData {
  summaryBanner: {
    goal: string;
    audience: string;
    topRecommendation: string;
    impactFraming: string;
  };
  executiveSummary: string;
  audienceCards: Array<{
    name: string;
    whyItMatters: string;
    opportunityLevel: 'High' | 'Medium' | 'Low';
    suggestedAction: string;
  }>;
  channelStrategy: Array<{
    channel: string;
    role: string;
    messageAngle: string;
    reason: string;
  }>;
  scenarioCore: {
    title: string;
    sections: Array<{ label: string; content: string }>;
  };
  kpiFramework: Array<{
    type: 'Primary' | 'Secondary' | 'Leading Indicator' | 'Optimization';
    name: string;
    note: string;
  }>;
  nextActions: Array<{
    action: string;
    priority: 'Do now' | 'Test next' | 'Scale later';
  }>;
  insightPanel: {
    whyThisRecommendation: string;
    businessImpact: string[];
    whatChanged: string[];
    howTreasureHelps: string[];
  };
}

interface ExperienceLabState {
  // Selections
  goal: string;
  industry: string;
  scenario: string;
  inputs: Record<string, string | string[]>;

  // Navigation
  currentStep: FlowStep;
  currentInputStep: number;

  // Generation
  generationPhase: number;
  isGenerating: boolean;

  // Output
  output: OutputData | null;

  // Side panel
  activePanelTab: string;

  // Actions
  setGoal: (goal: string) => void;
  setIndustry: (industry: string) => void;
  setScenario: (scenario: string) => void;
  setInput: (stepId: string, value: string | string[]) => void;
  setCurrentStep: (step: FlowStep) => void;
  setCurrentInputStep: (step: number) => void;
  nextInputStep: () => void;
  prevInputStep: () => void;
  startGeneration: () => void;
  setGenerationPhase: (phase: number) => void;
  finishGeneration: (output: OutputData) => void;
  setActivePanelTab: (tab: string) => void;
  resetSession: () => void;
}

export const useExperienceLabStore = create<ExperienceLabState>((set) => ({
  goal: '',
  industry: '',
  scenario: '',
  inputs: {},
  currentStep: 'industry',
  currentInputStep: 0,
  generationPhase: 0,
  isGenerating: false,
  output: null,
  activePanelTab: 'why',

  setGoal: (goal) => set({ goal }),
  setIndustry: (industry) => set({ industry }),
  setScenario: (scenario) => set({ scenario }),
  setInput: (stepId, value) => set((state) => ({
    inputs: { ...state.inputs, [stepId]: value },
  })),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCurrentInputStep: (step) => set({ currentInputStep: step }),
  nextInputStep: () => set((state) => ({ currentInputStep: state.currentInputStep + 1 })),
  prevInputStep: () => set((state) => ({ currentInputStep: Math.max(0, state.currentInputStep - 1) })),
  startGeneration: () => set({ isGenerating: true, generationPhase: 0, currentStep: 'generating' }),
  setGenerationPhase: (phase) => set({ generationPhase: phase }),
  finishGeneration: (output) => set({ isGenerating: false, output, currentStep: 'output' }),
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),
  resetSession: () => set({
    goal: '',
    industry: '',
    scenario: '',
    inputs: {},
    currentStep: 'industry',
    currentInputStep: 0,
    generationPhase: 0,
    isGenerating: false,
    output: null,
    activePanelTab: 'why',
  }),
}));
