import { useState } from 'react';
import { Sparkles, Download, Undo2, Redo2, Loader2, Save, Check } from 'lucide-react';
import { useBriefEditorStore } from '../../../stores/briefEditorStore';
import { useBriefStore } from '../../../stores/briefStore';
import { useChatStore } from '../../../stores/chatStore';
import { useTraceStore } from '../../../stores/traceStore';
import { chatHistoryStorage } from '../../../services/chatHistoryStorage';
import type { CampaignBriefData } from '../../../types/campaignBriefEditor';

interface EditorToolbarProps {
  onGeneratePlan?: (briefData: CampaignBriefData) => void;
}

export default function EditorToolbar({ onGeneratePlan }: EditorToolbarProps) {
  const { state, toggleAISuggestions, startGeneration, undo, redo, canUndo, canRedo } =
    useBriefEditorStore();
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const handleGeneratePlan = () => {
    onGeneratePlan?.(state.briefData);
  };

  const handleSave = () => {
    const briefData = state.briefData;
    const briefStore = useBriefStore.getState();

    const sections = {
      overview: {
        campaignName: briefData.campaignDetails,
        objective: briefData.businessObjective,
        businessGoal: briefData.primaryGoals[0] || '',
        timelineStart: briefData.timelineStart,
        timelineEnd: briefData.timelineEnd,
      },
      audience: {
        primaryAudience: briefData.primaryAudience.join(', '),
        audienceSize: '',
        inclusionCriteria: [] as string[],
        exclusionCriteria: [] as string[],
        segments: [...briefData.prospectingSegments, ...briefData.retargetingSegments],
        recommendedAudiences: [] as any[],
      },
      experience: {
        headline: '',
        bodyMessage: '',
        ctaText: '',
        placements: briefData.mandatoryChannels,
        segmentMessages: [] as any[],
      },
      measurement: {
        primaryKpi: briefData.primaryKpis[0] || '',
        secondaryKpis: briefData.secondaryKpis,
        secondaryMetrics: [] as string[],
        successCriteria: briefData.primaryGoals,
        risks: [] as string[],
      },
    };

    let briefId: string;

    if (briefStore.activeBrief) {
      briefId = briefStore.activeBrief.id;
      const updated = {
        ...briefStore.activeBrief,
        sections,
        updatedAt: new Date().toISOString(),
      };
      useBriefStore.setState({ activeBrief: updated, isDirty: true });
      briefStore.saveBrief();
    } else {
      const name = briefData.campaignDetails || 'Untitled Brief';
      briefStore.createBriefFromChat(sections, name, '', 'paid-media');
      briefId = useBriefStore.getState().activeBriefId!;
    }

    try {
      localStorage.setItem(
        `paid-media-suite:editor:${briefId}`,
        JSON.stringify(briefData)
      );
    } catch {
      // localStorage quota exceeded
    }

    const messages = useChatStore.getState().messages;
    if (messages.length > 0) {
      chatHistoryStorage.saveMessages(briefId, messages);
    }

    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const handleAISuggestions = () => {
    const wasOn = state.showAISuggestions;
    toggleAISuggestions();

    // When toggling ON, send a review request that produces brief-update-json
    if (!wasOn) {
      const briefJson = JSON.stringify(state.briefData, null, 2);
      const message = [
        'Review my campaign brief below and suggest concrete improvements.',
        'For EVERY section that could be stronger, provide updated values.',
        'Include improvements for as many sections as possible — especially any that are empty or weak.',
        '',
        'IMPORTANT: You MUST output your suggestions inside a brief-update-json code fence.',
        'Include only the fields you want to improve. Example:',
        '',
        '```brief-update-json',
        '{',
        '  "primaryGoals": ["Achieve 4:1 ROAS within 30 days", "Drive 10K conversions"],',
        '  "primaryKpis": ["ROAS", "CPA", "Conversion Rate"],',
        '  "inScope": ["US market", "Google Search", "Meta Ads"],',
        '  "outOfScope": ["Organic social", "Email marketing"]',
        '}',
        '```',
        '',
        'Current brief:',
        '```json',
        briefJson,
        '```',
      ].join('\n');

      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const trace = useTraceStore.getState();
      trace.startRun(runId, `user-${Date.now()}`);
      trace.addEvent(runId, 'intent', 'AI Suggestions: review brief and suggest improvements');
      trace.addEvent(runId, 'route', 'Routing to brief-update skill (suggestion mode)');
      trace.addEvent(runId, 'skill_call', 'Sending to Claude Agent SDK');

      useBriefEditorStore.getState().setAISuggestionsLoading(true);
      useBriefEditorStore.getState().setPendingSuggestionRequest(true);

      useChatStore.getState().sendMessage(message, runId).finally(() => {
        useBriefEditorStore.getState().setAISuggestionsLoading(false);
        useBriefEditorStore.getState().setPendingSuggestionRequest(false);
        const traceRun = useTraceStore.getState().runs[runId];
        if (traceRun && traceRun.status === 'running') {
          trace.completeRun(runId, 'succeeded');
        }
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-[#F7F8FB] rounded flex-shrink-0">
      {/* Left - Title */}
      <div className="flex items-center gap-3 px-2">
        <h2 className="font-semibold text-base text-[#212327] m-0">
          Campaign Brief
        </h2>
      </div>

      {/* Right - Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex gap-2">
          <IconButton title="Undo" disabled={!canUndo} onClick={undo}>
            <Undo2 className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton title="Redo" disabled={!canRedo} onClick={redo}>
            <Redo2 className="w-3.5 h-3.5" />
          </IconButton>
        </div>

        {/* AI Suggestions Toggle */}
        <button
          onClick={handleAISuggestions}
          disabled={state.aiSuggestionsLoading}
          className={`flex items-center gap-1.5 h-8 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-200 ${
            state.showAISuggestions
              ? 'border-[#6F2EFF] bg-[#F3EEFF] text-[#6F2EFF]'
              : 'border-[#878F9E] bg-white text-[#636A77]'
          } hover:border-[#6F2EFF] hover:text-[#6F2EFF] disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {state.aiSuggestionsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {state.aiSuggestionsLoading ? 'Analyzing...' : 'AI Suggestions'}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 h-8 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-200 ${
            saveState === 'saved'
              ? 'border-green-400 bg-green-50 text-green-600'
              : 'border-[#878F9E] bg-white text-[#636A77] hover:border-[#6F2EFF] hover:text-[#6F2EFF]'
          }`}
          title="Save brief"
        >
          {saveState === 'saved' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saveState === 'saved' ? 'Saved' : 'Save'}
        </button>

        {/* Download */}
        <button
          className="flex items-center gap-1.5 h-8 px-4 py-2 rounded-lg border border-[#878F9E] bg-white text-sm font-medium text-[#636A77] cursor-pointer transition-all duration-200 hover:border-[#6F2EFF] hover:text-[#6F2EFF]"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-[27.5px] bg-[#DCE1EA] flex-shrink-0" />

        {/* Generate Plan */}
        <button
          onClick={handleGeneratePlan}
          className="flex items-center gap-1.5 h-8 px-4 py-2 rounded-lg border-none bg-black text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a]"
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
