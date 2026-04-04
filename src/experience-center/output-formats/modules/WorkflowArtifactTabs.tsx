/**
 * WorkflowArtifactTabs — tab bar for viewing artifacts from each completed workflow step.
 */

import { Search, BarChart3, FileText, GitBranch, Zap, Target } from 'lucide-react';
import type { StepResult, StepType } from '../../orchestration/types';

const stepTypeIcons: Record<StepType, React.ElementType> = {
  analyze: BarChart3,
  inspect: Search,
  create: FileText,
  compare: BarChart3,
  activate: Zap,
  optimize: Target,
};

interface WorkflowArtifactTabsProps {
  stepHistory: StepResult[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function WorkflowArtifactTabs({ stepHistory, activeIndex, onSelect }: WorkflowArtifactTabsProps) {
  if (stepHistory.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto scrollbar-hide">
      {stepHistory.map((step, i) => {
        const Icon = stepTypeIcons[step.stepDef.stepType] || FileText;
        const isActive = i === activeIndex;
        return (
          <button
            key={step.stepId}
            onClick={() => onSelect(i)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span className="truncate max-w-[100px]">
              {i + 1}. {step.stepDef.label.split(' ').slice(0, 3).join(' ')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
