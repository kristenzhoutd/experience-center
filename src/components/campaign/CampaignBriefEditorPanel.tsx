import { useBriefEditorStore } from '../../stores/briefEditorStore';
import { useBriefStore } from '../../stores/briefStore';
import EditorToolbar from './editor/EditorToolbar';
import BriefSection from './editor/BriefSection';
import QualityScoreBar from './editor/QualityScoreBar';
import { SECTION_CONFIGS } from '../../types/campaignBriefEditor';
import type { CampaignBriefData } from '../../types/campaignBriefEditor';

interface CampaignBriefEditorPanelProps {
  onGeneratePlan?: (briefData: CampaignBriefData) => void;
}

export default function CampaignBriefEditorPanel({ onGeneratePlan }: CampaignBriefEditorPanelProps) {
  const workflowState = useBriefEditorStore((s) => s.state.workflowState);
  const briefData = useBriefEditorStore((s) => s.state.briefData);
  const activeBrief = useBriefStore((s) => s.activeBrief);

  if (workflowState === 'generating') {
    const name = activeBrief?.name || briefData?.campaignDetails || 'Campaign Brief';
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-blue-100 text-blue-600 rounded-full animate-pulse">
            generating
          </span>
        </div>

        {/* Skeleton sections */}
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-[676px] bg-white rounded-2xl px-6 pt-6 pb-8 flex flex-col gap-4 mt-4 mx-4 mb-4 min-h-min">
            {SECTION_CONFIGS.map(({ key, title, subtitle }) => (
              <div key={key} className="rounded-xl border border-gray-200 p-5">
                <div className="text-sm font-medium text-gray-900 mb-1">{title}</div>
                <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 text-center flex-shrink-0">
          <p className="text-xs text-gray-400 animate-pulse">AI is generating your campaign brief...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F8FB] overflow-hidden relative isolate">
      {/* Toolbar */}
      <EditorToolbar onGeneratePlan={onGeneratePlan} />

      {/* White content card with scrollable sections */}
      <div className="flex-1 overflow-y-auto flex justify-center p-4">
        <div className="w-full max-w-[676px] bg-white rounded-2xl px-6 pt-6 pb-[100px] flex flex-col gap-4 min-h-min">
          {SECTION_CONFIGS.map((config) => (
            <BriefSection key={config.key} config={config} />
          ))}
        </div>
      </div>

      {/* Quality Score Bar */}
      <QualityScoreBar />
    </div>
  );
}
