/**
 * WorkflowProgressIndicator — shows step progress dots in the workflow.
 */

import { Check } from 'lucide-react';
import type { StepResult, WorkflowStepDef } from '../../orchestration/types';

interface WorkflowProgressIndicatorProps {
  stepHistory: StepResult[];
  currentStep: WorkflowStepDef | null;
  isExecuting: boolean;
}

export default function WorkflowProgressIndicator({ stepHistory, currentStep, isExecuting }: WorkflowProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      {stepHistory.map((step, i) => (
        <div key={step.stepId} className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-emerald-600" />
          </div>
          <span className="text-[10px] text-gray-400 hidden md:inline truncate max-w-[80px]">{step.stepDef.label.split(' ').slice(0, 3).join(' ')}</span>
          {(i < stepHistory.length - 1 || currentStep) && (
            <div className="w-4 h-px bg-gray-200 flex-shrink-0" />
          )}
        </div>
      ))}
      {currentStep && (
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            isExecuting ? 'bg-blue-100 animate-pulse' : 'bg-blue-50'
          }`}>
            <span className="text-[10px] font-bold text-blue-600">{stepHistory.length + 1}</span>
          </div>
          <span className="text-[10px] text-gray-600 font-medium hidden md:inline truncate max-w-[120px]">
            {currentStep.label}
          </span>
        </div>
      )}
    </div>
  );
}
