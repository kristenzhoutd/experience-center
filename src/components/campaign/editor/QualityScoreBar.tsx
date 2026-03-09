import { ChevronDown, ChevronUp } from 'lucide-react';
import { useBriefEditorStore } from '../../../stores/briefEditorStore';
import QualityScoreBreakdown from './QualityScoreBreakdown';

export default function QualityScoreBar() {
  const { state, toggleQualityBreakdown } = useBriefEditorStore();
  const { qualityScore, isQualityBreakdownExpanded } = state;

  const percentColor = qualityScore.percentage < 60 ? '#98501C' : '#1A7A3A';
  const barColor =
    qualityScore.percentage >= 80
      ? '#22C55E'
      : qualityScore.percentage >= 50
        ? '#F6904C'
        : '#EF4444';

  // Status badge styling
  const statusBg =
    qualityScore.percentage >= 80
      ? 'bg-green-100'
      : qualityScore.percentage >= 50
        ? 'bg-amber-100'
        : 'bg-red-100';
  const statusText =
    qualityScore.percentage >= 80
      ? 'text-green-800'
      : qualityScore.percentage >= 50
        ? 'text-amber-800'
        : 'text-red-800';

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[4] bg-white border border-[#F2F3F3] rounded-2xl flex flex-col overflow-hidden w-[calc(100%-48px)] max-w-[712px]"
      style={{ boxShadow: '0px 4px 8px 0px rgba(135, 143, 158, 0.25)' }}
    >
      {/* Expanded Breakdown */}
      {isQualityBreakdownExpanded && <QualityScoreBreakdown />}

      {/* Bar */}
      <div
        onClick={toggleQualityBreakdown}
        className="flex flex-col gap-2 p-3 cursor-pointer transition-colors duration-200 hover:bg-[#FAFBFC]"
      >
        {/* Top Row: Label + Status */}
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-normal text-[#464B55]">
            Campaign Brief Quality
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${statusText} ${statusBg} px-2 py-0.5 rounded-md whitespace-nowrap`}
            >
              {qualityScore.label}
              {qualityScore.itemsNeedingAttention > 0 &&
                ` ${qualityScore.itemsNeedingAttention} Items`}
            </span>
            <span
              className="text-base font-semibold"
              style={{ color: percentColor }}
            >
              {qualityScore.percentage}%
            </span>
            {isQualityBreakdownExpanded ? (
              <ChevronUp size={16} color="#636A77" />
            ) : (
              <ChevronDown size={16} color="#636A77" />
            )}
          </div>
        </div>

        {/* Bottom Row: Single continuous progress bar */}
        <div className="w-full h-2 bg-[#EFF2F8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-400 ease-in-out"
            style={{
              width: `${qualityScore.percentage}%`,
              background: barColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
