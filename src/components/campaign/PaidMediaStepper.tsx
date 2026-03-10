/**
 * PaidMediaStepper — Derives the current workflow step from existing stores
 * and renders a WizardStepper with paid-media-specific labels.
 *
 * Visual steps (3):
 *   1. Ideate              — Create / edit the brief
 *   2. Campaign Plan       — Generate & refine the blueprint
 *   3. Configure & Launch  — Ad config, review, push to Meta
 *
 * Internal tracking still uses 4 steps (program store keeps steps 3 & 4
 * separate for granular progress). The stepper maps both to visual step 3.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import WizardStepper from '../wizard/WizardStepper';
import { useBriefEditorStore } from '../../stores/briefEditorStore';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useCampaignLaunchStore } from '../../stores/campaignLaunchStore';
import { useProgramStore } from '../../stores/programStore';
import type { WizardStep } from '../../types/campaignConfig';
import type { ProgramStepStatus } from '../../types/program';

const PAID_MEDIA_STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Ideate' },
  { id: 2, label: 'Campaign Plan' },
  { id: 3, label: 'Configure & Launch' },
];

interface PaidMediaStepperProps {
  /** Override the derived step (used on the launch page where local state drives step 3 vs 4). */
  overrideStep?: WizardStep;
}

/**
 * Derive the current paid-media workflow step from distributed store flags.
 * Returns a visual step (1–3). Internal step 4 maps to visual step 3.
 *
 * Step 1 (Ideate):            No brief data yet, or editing before plan generation
 * Step 2 (Campaign Plan):     Plan generated but not yet approved
 * Step 3 (Configure & Launch): Blueprint approved, configuring / launching
 */
function useDerivedStep(): WizardStep {
  // All hooks must be called unconditionally (React rules of hooks)
  const activeProgram = useProgramStore((s) => s.activeProgram);
  const workflowState = useBriefEditorStore((s) => s.state.workflowState);
  const briefData = useBriefEditorStore((s) => s.state.briefData);
  const hasGeneratedPlan = useBlueprintStore((s) => s.hasGeneratedPlan);
  const approvedBlueprintId = useBlueprintStore((s) => s.approvedBlueprintId);
  const isLaunchInitialized = useCampaignLaunchStore((s) => s.isInitialized);
  const isGeneratingConfig = useCampaignLaunchStore((s) => s.isGeneratingConfig);

  // If a program is active, use its tracked step (clamp 4 → 3 for visual)
  if (activeProgram) return Math.min(activeProgram.currentStepId, 3) as WizardStep;

  // Fallback: existing distributed flag logic (for non-program flows)
  const hasBriefData = !!(
    briefData.campaignDetails ||
    briefData.businessObjective ||
    briefData.primaryGoals.length > 0 ||
    briefData.mandatoryChannels.length > 0
  );

  // During AI config generation → step 3 (Configure & Launch)
  if (isGeneratingConfig) return 3;

  // On launch page with approved blueprint → step 3
  if (isLaunchInitialized && approvedBlueprintId) return 3;

  // Blueprint approved but not yet on launch page → step 3
  if (approvedBlueprintId) return 3;

  // Plan generated (or generating) → step 2
  if (hasGeneratedPlan || workflowState === 'generating') return 2;

  // Brief data exists → still step 1 (editing brief)
  if (hasBriefData) return 1;

  // Default: step 1
  return 1;
}

export default function PaidMediaStepper({ overrideStep }: PaidMediaStepperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const derivedStep = useDerivedStep();
  const currentStep = overrideStep ?? derivedStep;
  const activeProgram = useProgramStore((s) => s.activeProgram);

  // Build step statuses from program when available.
  // Merge internal steps 3+4: visual step 3 is "completed" only when both are completed.
  const stepStatuses: Partial<Record<number, ProgramStepStatus>> | undefined = activeProgram
    ? (() => {
        const raw = Object.fromEntries(activeProgram.steps.map((s) => [s.stepId, s.status]));
        const merged: Partial<Record<number, ProgramStepStatus>> = {
          1: raw[1],
          2: raw[2],
          3: raw[3] === 'completed' && raw[4] === 'completed' ? 'completed'
            : raw[3] === 'in_progress' || raw[4] === 'in_progress' ? 'in_progress'
            : raw[3] || 'pending',
        };
        return merged;
      })()
    : undefined;

  // Highest step the user can click to (program-aware), capped at 3
  const maxClickableStep = activeProgram
    ? Math.min(activeProgram.furthestCompletedStep + 1, 3)
    : undefined;

  const handleStepClick = (step: WizardStep) => {
    if (step === currentStep) return;

    const isOnLaunchPage = location.pathname === '/campaign-launch';
    const isOnChatPage = location.pathname === '/campaign-chat';

    // Program-aware navigation — adjust store flags directly, no full openProgram reset.
    // Let the target page handle full restoration via openProgram on mount.
    if (activeProgram) {
      const maxAllowed = (activeProgram.furthestCompletedStep + 1) as WizardStep;
      if (step > maxAllowed) return;

      // Auto-save on step transitions
      if (isOnLaunchPage) {
        useCampaignLaunchStore.getState().saveCurrentConfig();
      }

      // Update step tracking
      useProgramStore.getState().setCurrentStep(step);

      // Adjust right-panel view for the target step
      if (step === 1) {
        useBlueprintStore.getState().setHasGeneratedPlan(false);
        useBlueprintStore.getState().selectBlueprint(null);
      } else if (step === 2) {
        const bpStore = useBlueprintStore.getState();
        if (bpStore.blueprints.length === 0 && activeProgram.blueprintIds.length > 0) {
          // Blueprints were cleared — reload from IPC before displaying
          bpStore.loadBlueprints().then(() => {
            useBlueprintStore.getState().setHasGeneratedPlan(true);
            if (activeProgram.approvedBlueprintId) {
              useBlueprintStore.getState().setApprovedBlueprintId(activeProgram.approvedBlueprintId);
              useBlueprintStore.getState().selectBlueprint(activeProgram.approvedBlueprintId);
            }
          });
        } else {
          bpStore.setHasGeneratedPlan(true);
          if (activeProgram.approvedBlueprintId) {
            bpStore.selectBlueprint(activeProgram.approvedBlueprintId);
          }
        }
      }

      // Navigate to the right page if needed
      const targetRoute = step <= 2 ? '/campaign-chat' : '/campaign-launch';
      if (location.pathname !== targetRoute) {
        navigate(targetRoute, { state: { programId: activeProgram.id, editBrief: step === 1 } });
      }
      return;
    }

    // Non-program flow (existing behavior)
    // Auto-save on step transitions using existing infrastructure
    if (isOnLaunchPage) {
      // Save launch config before navigating away
      useCampaignLaunchStore.getState().saveCurrentConfig();
    }

    // Navigate based on target step
    if (step <= 2) {
      // Steps 1-2 live on the chat page
      if (isOnLaunchPage) {
        // Going back from launch → restore blueprint view on chat page
        const approvedId = useBlueprintStore.getState().approvedBlueprintId;
        if (step === 2 && approvedId) {
          useBlueprintStore.getState().selectBlueprint(approvedId);
          useBlueprintStore.getState().setHasGeneratedPlan(true);
        }
        if (step === 1) {
          // Reset to brief editing
          useBlueprintStore.getState().setHasGeneratedPlan(false);
          useBlueprintStore.getState().setApprovedBlueprintId(null);
        }
        navigate('/campaign-chat');
      } else if (isOnChatPage) {
        // Already on chat page — adjust store state
        if (step === 1) {
          useBlueprintStore.getState().setHasGeneratedPlan(false);
          useBlueprintStore.getState().selectBlueprint(null);
        }
        // Step 2 on chat page is the default when hasGeneratedPlan is true — no action needed
      }
    } else if (step >= 3) {
      // Steps 3-4 live on the launch page
      if (isOnChatPage) {
        const approvedId = useBlueprintStore.getState().approvedBlueprintId;
        if (approvedId) {
          navigate('/campaign-launch', { state: { blueprintId: approvedId } });
        }
      }
      // If already on launch page, step 3→4 is handled by the page's own approve button
    }
  };

  return (
    <WizardStepper
      currentStep={currentStep}
      onStepClick={handleStepClick}
      steps={PAID_MEDIA_STEPS}
      stepStatuses={stepStatuses}
      maxClickableStep={maxClickableStep}
    />
  );
}
