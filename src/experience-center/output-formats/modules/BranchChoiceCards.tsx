/**
 * BranchChoiceCards — renders 2-4 clickable next-step options in the chat panel.
 */

import { Search, BarChart3, Zap, FileText, GitBranch, CheckCircle, Target, ArrowRight } from 'lucide-react';
import type { BranchDef } from '../../orchestration/types';

const iconMap: Record<string, React.ElementType> = {
  Search, BarChart3, Zap, FileText, GitBranch, CheckCircle, Target, ArrowRight,
};

interface BranchChoiceCardsProps {
  branches: BranchDef[];
  onChoose: (branchId: string) => void;
  disabled?: boolean;
}

export default function BranchChoiceCards({ branches, onChoose, disabled }: BranchChoiceCardsProps) {
  if (branches.length === 0) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="text-[11px] text-gray-400 font-medium mb-1">Choose your next step</div>
      {branches.map((branch) => {
        const Icon = iconMap[branch.icon || 'ArrowRight'] || ArrowRight;
        return (
          <button
            key={branch.branchId}
            onClick={() => !disabled && onChoose(branch.branchId)}
            disabled={disabled}
            className={`w-full text-left p-3 rounded-xl border transition-all ${
              disabled
                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                branch.recommendation ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <Icon className={`w-4 h-4 ${branch.recommendation ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {branch.label}
                  </span>
                  {branch.recommendation && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase tracking-wider flex-shrink-0">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{branch.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
