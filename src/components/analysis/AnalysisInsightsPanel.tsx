import { CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react';
import type { AnalysisSuggestion } from '../../types/campaignAnalysis';

interface AnalysisInsightsPanelProps {
  summary: string;
  suggestions: AnalysisSuggestion[];
}

const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  opportunity: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  warning: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
};

const impactBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

export default function AnalysisInsightsPanel({ summary, suggestions }: AnalysisInsightsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-2">
        AI Generated Insights
      </p>
      <p className="text-xs text-gray-600 leading-relaxed mb-4">{summary}</p>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => {
          const cfg = typeConfig[suggestion.type] || typeConfig.success;
          const Icon = cfg.icon;
          return (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl border p-3 ${cfg.bg}`}>
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-900">{suggestion.title}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${impactBadge[suggestion.impact] || impactBadge.low}`}>
                    {suggestion.impact}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{suggestion.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
