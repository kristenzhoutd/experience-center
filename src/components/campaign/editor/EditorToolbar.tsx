import { Undo2, Redo2 } from 'lucide-react';
import { useBriefEditorStore } from '../../../stores/briefEditorStore';
import type { CampaignBriefData } from '../../../types/campaignBriefEditor';

interface EditorToolbarProps {
  onGeneratePlan?: (briefData: CampaignBriefData) => void;
}

export default function EditorToolbar({ onGeneratePlan }: EditorToolbarProps) {
  const { state, undo, redo, canUndo, canRedo } =
    useBriefEditorStore();

  const programName = state.briefData.campaignDetails || 'Untitled Campaign';

  const handleGeneratePlan = () => {
    onGeneratePlan?.(state.briefData);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8ECF3] flex-shrink-0">
      {/* Left - Program Name */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-[#636A77] flex-shrink-0">Program:</span>
        <span className="text-sm font-semibold text-[#212327] truncate">{programName}</span>
      </div>

      {/* Right - Undo/Redo + Primary Action */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <IconButton title="Undo" disabled={!canUndo} onClick={undo}>
          <Undo2 className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton title="Redo" disabled={!canRedo} onClick={redo}>
          <Redo2 className="w-3.5 h-3.5" />
        </IconButton>
        <button
          onClick={handleGeneratePlan}
          className="flex items-center gap-1.5 h-8 px-5 py-2 rounded-lg border-none bg-[#212327] text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:bg-[#3a3d42]"
        >
          Generate Plan
        </button>
      </div>
    </div>
  );
}

function IconButton({
  children,
  title,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-7 h-7 bg-transparent border-none rounded transition-all duration-200 ${
        disabled
          ? 'cursor-default text-[#C5CAD3]'
          : 'cursor-pointer text-[#636A77] hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
