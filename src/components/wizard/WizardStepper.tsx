import type { WizardStep } from '../../types/campaignConfig';
import type { ProgramStepStatus } from '../../types/program';

const DEFAULT_STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Campaign Setup' },
  { id: 2, label: 'Audiences' },
  { id: 3, label: 'Content' },
  { id: 4, label: 'Review & Launch' },
];

interface WizardStepperProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  steps?: { id: WizardStep; label: string }[];
  /** Optional step statuses from a program — overrides default derivation so
   *  completed steps show green even when navigating backward. */
  stepStatuses?: Partial<Record<number, ProgramStepStatus>>;
  /** Highest step the user can navigate to (inclusive). Steps above this are disabled. */
  maxClickableStep?: number;
}

export default function WizardStepper({ currentStep, onStepClick, steps = DEFAULT_STEPS, stepStatuses, maxClickableStep }: WizardStepperProps) {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;

          // Use explicit step statuses when provided (program-aware),
          // otherwise fall back to simple currentStep comparison.
          const isCompleted = stepStatuses
            ? stepStatuses[step.id] === 'completed'
            : currentStep > step.id;

          // A step is clickable if it's not the current step AND
          // either no maxClickableStep is set (non-program) or step ≤ maxClickableStep.
          const isClickable = !isActive && (maxClickableStep == null || step.id <= maxClickableStep);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable && !isActive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-black/5 cursor-default'
                    : isClickable
                      ? 'cursor-pointer hover:bg-black/[0.04]'
                      : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-transform ${
                    isActive
                      ? 'bg-black text-white'
                      : isCompleted
                        ? `bg-green-500 text-white ${isClickable ? 'group-hover:scale-110' : ''}`
                        : 'bg-black/5 text-black'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={`text-sm transition-colors ${
                    isActive
                      ? 'text-black font-medium'
                      : isClickable
                        ? 'text-black/60 hover:text-black'
                        : 'text-black/30'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <svg className={`w-4 h-4 mx-1 flex-shrink-0 ${isCompleted ? 'text-green-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
