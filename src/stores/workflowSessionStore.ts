/**
 * Workflow Session Store — manages multi-step branchable workflow state.
 * Parallel to experienceLabStore, activates when a scenario has a WorkflowDef.
 */

import { create } from 'zustand';
import type { WorkflowDef, WorkflowStepDef, StepResult } from '../experience-center/orchestration/types';

export interface WorkflowSessionState {
  // Definition
  workflowDef: WorkflowDef | null;
  active: boolean;

  // Progress
  currentStepId: string | null;
  stepHistory: StepResult[];
  cumulativeContext: Record<string, string>;

  // Execution
  isExecutingStep: boolean;

  // UI
  activeStepIndex: number; // which step's artifact is shown on right panel

  // Actions
  initWorkflow: (workflowDef: WorkflowDef) => void;
  setCurrentStep: (stepId: string) => void;
  addStepResult: (result: StepResult) => void;
  chooseBranch: (branchId: string) => void;
  setIsExecutingStep: (executing: boolean) => void;
  setActiveStepIndex: (index: number) => void;
  resetWorkflow: () => void;
}

export const useWorkflowSessionStore = create<WorkflowSessionState>((set, get) => ({
  workflowDef: null,
  active: false,
  currentStepId: null,
  stepHistory: [],
  cumulativeContext: {},
  isExecutingStep: false,
  activeStepIndex: 0,

  initWorkflow: (workflowDef) => set({
    workflowDef,
    active: true,
    currentStepId: workflowDef.entryStepId,
    stepHistory: [],
    cumulativeContext: {},
    isExecutingStep: false,
    activeStepIndex: 0,
  }),

  setCurrentStep: (stepId) => set({ currentStepId: stepId }),

  addStepResult: (result) => set((state) => {
    const newHistory = [...state.stepHistory, result];
    return {
      stepHistory: newHistory,
      activeStepIndex: newHistory.length - 1,
    };
  }),

  chooseBranch: (branchId) => {
    const state = get();
    if (!state.workflowDef || !state.currentStepId) return;

    const currentStep = state.workflowDef.steps[state.currentStepId];
    if (!currentStep) return;

    const branch = currentStep.branches.find(b => b.branchId === branchId);
    if (!branch) return;

    // Update the last step result with the chosen branch
    const updatedHistory = [...state.stepHistory];
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        chosenBranchId: branchId,
      };
    }

    // Merge branch context updates
    const updatedContext = { ...state.cumulativeContext, ...branch.contextUpdate };

    set({
      stepHistory: updatedHistory,
      cumulativeContext: updatedContext,
      currentStepId: branch.nextStepId,
    });
  },

  setIsExecutingStep: (executing) => set({ isExecutingStep: executing }),

  setActiveStepIndex: (index) => set({ activeStepIndex: index }),

  resetWorkflow: () => set({
    workflowDef: null,
    active: false,
    currentStepId: null,
    stepHistory: [],
    cumulativeContext: {},
    isExecutingStep: false,
    activeStepIndex: 0,
  }),
}));
