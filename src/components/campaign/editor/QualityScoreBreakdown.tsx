import { Check, AlertCircle, X as XIcon } from 'lucide-react';
import { useBriefEditorStore } from '../../../stores/briefEditorStore';

export default function QualityScoreBreakdown() {
  const { state } = useBriefEditorStore();
  const { qualityScore } = state;

  return (
    <div className="px-6 py-5 border-b border-[#DCE1EA] bg-[#FAFBFC] animate-[slideDown_0.3s_ease-out] overflow-hidden">
      {/* Explanatory Text */}
      <p className="text-[13px] text-[#636A77] m-0 mb-4 leading-relaxed">
        This score reflects how complete your campaign brief is. A higher score leads to more accurate blueprint recommendation.
      </p>

      {/* Field Scores */}
      <div className="flex flex-col gap-1.5 mb-4">
        {qualityScore.fields.map((field) => {
          const bgColor =
            field.status === 'green' ? 'bg-green-50' :
            field.status === 'yellow' ? 'bg-orange-50' :
            'bg-red-50';
          const textColor =
            field.status === 'green' ? 'text-green-600' :
            field.status === 'yellow' ? 'text-amber-600' :
            'text-red-600';
          const iconColor =
            field.status === 'green' ? '#10B981' :
            field.status === 'yellow' ? '#F59E0B' :
            '#EF4444';

          return (
            <div
              key={field.key}
              className={`flex items-center gap-3 px-4 py-2.5 ${bgColor} rounded-lg`}
            >
              {/* Status Icon */}
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {field.status === 'green' ? (
                  <Check size={16} color={iconColor} strokeWidth={2.5} />
                ) : field.status === 'yellow' ? (
                  <AlertCircle size={16} color={iconColor} strokeWidth={2} />
                ) : (
                  <XIcon size={16} color={iconColor} strokeWidth={2.5} />
                )}
              </div>

              {/* Label */}
              <span className="text-sm font-semibold text-[#212327] flex-1">
                {field.label}
              </span>

              {/* Score */}
              <span className={`text-sm font-semibold ${textColor}`}>
                {field.score}/{field.maxScore}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-[#DCE1EA]">
        <span className="text-sm font-semibold text-[#212327]">
          Total Quality Score
        </span>
        <span className="text-sm font-bold text-[#212327]">
          {qualityScore.totalScore}/{qualityScore.maxScore}
        </span>
      </div>
    </div>
  );
}
