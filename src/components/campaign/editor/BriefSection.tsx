import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, X, Loader2, Sparkles } from 'lucide-react';
import { useBriefEditorStore } from '../../../stores/briefEditorStore';
import { useChatStore } from '../../../stores/chatStore';
import { useTraceStore } from '../../../stores/traceStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import type { SectionKey, SectionConfig, CampaignBriefData } from '../../../types/campaignBriefEditor';
import SelectableElement from '../../chat/SelectableElement';

// AI Edit icon (sparkle + pencil from Figma)
const AIEditIcon = ({ size = 16, color = '#636A77' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.9253 0.891835C12.0494 -0.232325 13.8634 -0.0752137 14.9702 1.03148C15.4614 1.52285 15.7594 2.13959 15.8501 2.77269L15.8764 3.04516V3.32055C15.8446 3.95822 15.5957 4.58755 15.1088 5.07445L13.7055 6.4768C13.7039 6.47844 13.7033 6.48102 13.7016 6.48266C13.7 6.48427 13.6974 6.48496 13.6958 6.48656L6.22213 13.9612C6.14939 14.0339 6.0622 14.0906 5.96725 14.1282L5.86959 14.1594L1.73971 15.1682C1.48539 15.2302 1.21688 15.155 1.0317 14.97C0.869858 14.8081 0.791559 14.5827 0.815878 14.3586L0.83248 14.262L1.84127 10.1311C1.87384 9.99768 1.9424 9.87469 2.03951 9.77758L10.9253 0.891835ZM3.24752 10.6907L2.58346 13.4172L5.311 12.7512L12.1098 5.95141L10.0483 3.88988L3.24752 10.6907ZM13.9096 2.09203C13.2923 1.47477 12.4332 1.50608 11.9868 1.95238L11.1088 2.82933L13.1704 4.89086L14.0483 4.01391C14.2778 3.78432 14.3943 3.46555 14.3784 3.11742L14.3774 3.1184C14.3601 2.76521 14.2086 2.3911 13.9096 2.09203Z" fill={color}/>
    <path d="M2.78553 0.149323C2.8592 -0.0497742 3.1408 -0.0497746 3.21447 0.149323L3.70753 1.4818C3.84651 1.85737 4.14263 2.15349 4.5182 2.29247L5.85068 2.78553C6.04977 2.8592 6.04977 3.1408 5.85068 3.21447L4.5182 3.70753C4.14263 3.84651 3.84651 4.14263 3.70753 4.5182L3.21447 5.85068C3.1408 6.04977 2.8592 6.04977 2.78553 5.85068L2.29247 4.5182C2.15349 4.14263 1.85737 3.84651 1.4818 3.70753L0.149323 3.21447C-0.0497742 3.1408 -0.0497746 2.8592 0.149323 2.78553L1.4818 2.29247C1.85737 2.15349 2.15349 1.85737 2.29247 1.4818L2.78553 0.149323Z" fill={color}/>
    <path d="M13.857 9.09955C13.9061 8.96682 14.0939 8.96682 14.143 9.09955L14.4717 9.98787C14.5643 10.2382 14.7618 10.4357 15.0121 10.5283L15.9005 10.857C16.0332 10.9061 16.0332 11.0939 15.9005 11.143L15.0121 11.4717C14.7618 11.5643 14.5643 11.7618 14.4717 12.0121L14.143 12.9005C14.0939 13.0332 13.9061 13.0332 13.857 12.9005L13.5283 12.0121C13.4357 11.7618 13.2382 11.5643 12.9879 11.4717L12.0995 11.143C11.9668 11.0939 11.9668 10.9061 12.0995 10.857L12.9879 10.5283C13.2382 10.4357 13.4357 10.2382 13.5283 9.98787L13.857 9.09955Z" fill={color}/>
  </svg>
);

// Channel platform logo mapping
const CHANNEL_LOGOS: Record<string, string> = {
  'Instagram': '/assets/instagram-ads.svg',
  'Instagram Ads': '/assets/instagram-ads.svg',
  'Facebook': '/assets/meta-ads.png',
  'Facebook Ads': '/assets/meta-ads.png',
  'Meta': '/assets/meta-ads.png',
  'Meta Ads': '/assets/meta-ads.png',
  'Google Ads': '/assets/google-ads.png',
  'Google Search': '/assets/google-ads.png',
  'Google Display': '/assets/google-display.svg',
  'Google Shopping': '/assets/google-shopping.svg',
  'YouTube': '/assets/youtube-ads.svg',
  'YouTube Ads': '/assets/youtube-ads.svg',
  'YouTube Shorts': '/assets/youtube-ads.svg',
  'TikTok': '/assets/tiktok-ads.png',
  'TikTok Ads': '/assets/tiktok-ads.png',
  'LinkedIn': '/assets/linkedin-ads.svg',
  'LinkedIn Ads': '/assets/linkedin-ads.svg',
  'Pinterest': '/assets/pinterest-ads.svg',
  'Pinterest Ads': '/assets/pinterest-ads.svg',
  'Snapchat': '/assets/snapchat-ads.svg',
  'Snapchat Ads': '/assets/snapchat-ads.svg',
  'X': '/assets/x-ads.svg',
  'X Ads': '/assets/x-ads.svg',
  'Twitter': '/assets/x-ads.svg',
  'Programmatic': '/assets/programmatic-ads.svg',
  'Connected TV': '/assets/connected-tv.svg',
  'CTV': '/assets/connected-tv.svg',
  'Spotify Ads': '/assets/spotify-ads.svg',
  'Amazon Ads': '/assets/amazon-ads.svg',
  'Apple Search Ads': '/assets/apple-search-ads.svg',
  'Reddit Ads': '/assets/reddit-ads.svg',
  'Google Display Network': '/assets/google-display.svg',
  'Google Display Network (GDN)': '/assets/google-display.svg',
};

// Channel brand colors
const CHANNEL_BRANDS: Record<string, { bg: string }> = {
  'Instagram': { bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  'Instagram Ads': { bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  'Facebook': { bg: '#1877F2' },
  'Facebook Ads': { bg: '#1877F2' },
  'Meta': { bg: '#0081FB' },
  'Meta Ads': { bg: '#0081FB' },
  'Google Ads': { bg: '#4285F4' },
  'TikTok Ads': { bg: '#000000' },
  'LinkedIn Ads': { bg: '#0A66C2' },
  'Pinterest Ads': { bg: '#E60023' },
  'X Ads': { bg: '#000000' },
  'Reddit Ads': { bg: '#FF4500' },
  'Google Display Network': { bg: '#34A853' },
  'Google Display Network (GDN)': { bg: '#34A853' },
};

// Available digital ad platforms for quick selection
const AD_PLATFORMS = [
  'Meta Ads', 'Instagram Ads', 'Google Ads', 'Google Display',
  'Google Shopping', 'YouTube', 'YouTube Shorts', 'TikTok Ads',
  'LinkedIn Ads', 'Snapchat Ads', 'Pinterest Ads', 'X Ads',
  'Programmatic', 'Connected TV', 'Spotify Ads', 'Amazon Ads',
  'Apple Search Ads', 'Reddit Ads', 'Google Display Network (GDN)',
];

// Input class shared by all editable fields
const inputClassName =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#212327] outline-none focus:border-[#6F2EFF] placeholder:text-[#9BA2AF]';
// Inline input: borderless until hover/focus (looks like static text by default)
const inlineInputClassName =
  'w-full px-3 py-2 border border-transparent bg-transparent rounded-lg text-sm text-[#212327] outline-none hover:border-gray-200 hover:bg-white focus:border-[#6F2EFF] focus:bg-white focus:shadow-sm placeholder:text-[#9BA2AF] transition-colors duration-150';
const inlineTextareaClassName =
  'w-full px-3 py-2 border border-transparent bg-transparent rounded-lg text-sm text-[#212327] outline-none resize-none hover:border-gray-200 hover:bg-white focus:border-[#6F2EFF] focus:bg-white focus:shadow-sm placeholder:text-[#9BA2AF] transition-colors duration-150 min-h-[60px]';
const labelClassName =
  'text-xs font-medium text-[#636A77] uppercase tracking-wide';

interface BriefSectionProps {
  config: SectionConfig;
}

export default function BriefSection({ config }: BriefSectionProps) {
  const {
    state,
    openAIEditPopover,
    closeAIEditPopover,
    updateBriefData,
    acceptAISuggestion,
    dismissAISuggestion,
  } = useBriefEditorStore();

  const sectionState = state.sectionStates[config.key];
  const suggestion = state.inlineSuggestions[config.key];
  const isAIEditOpen = state.aiEditPopover.isOpen && state.aiEditPopover.sectionKey === config.key;

  return (
    <SelectableElement
      refId={`brief.${config.key}`}
      refType="section"
      path={['Campaign Brief', config.title]}
      label={config.title}
      context={{ domain: 'brief-editor', sectionKey: config.key }}
    >
      <div className="flex flex-col gap-4 relative">
        {/* Section Header */}
        <SectionHeader
          title={config.title}
          subtitle={config.subtitle}
          sectionState={sectionState}
          onAIEdit={() => openAIEditPopover(config.key)}
        />

        {/* AI Suggestion Card */}
        {suggestion && sectionState === 'aiSuggestion' && (
          <div className="bg-[#E3F5F4] rounded-lg px-4 py-3 flex gap-2 items-start">
            {/* Wand icon */}
            <div className="flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
              <Sparkles size={16} className="text-[#225F5E]" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {/* Title + description */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#225F5E]">{suggestion.title}</span>
                <span className="text-sm text-[#464B55] leading-snug">{suggestion.description}</span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => dismissAISuggestion(config.key)}
                  className="px-3 py-1.5 bg-transparent border-none text-xs font-medium text-[#636A77] cursor-pointer rounded-lg hover:bg-[#d0eeec] transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => acceptAISuggestion(config.key)}
                  className="px-3 py-1.5 border border-[#878F9E] bg-transparent text-xs font-medium text-[#636A77] cursor-pointer rounded-lg hover:bg-[#d0eeec] hover:border-[#636A77] transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Content */}
        <SectionContent
          config={config}
          briefData={state.briefData as unknown as Record<string, unknown>}
          onUpdateData={updateBriefData}
        />

        {/* Edit with AI Popover */}
        {isAIEditOpen && (
          <EditWithAIPopover
            sectionKey={config.key}
            sectionTitle={config.title}
            briefData={state.briefData}
            isLoading={state.aiEditPopover.isLoading}
            onClose={closeAIEditPopover}
          />
        )}

        {/* Divider */}
        <div className="w-full h-px bg-[#DCE1EA] mt-1" />
      </div>
    </SelectableElement>
  );
}

// --- Edit with AI Popover ---

const SECTION_QUICK_PROMPTS: Partial<Record<SectionKey, string[]>> = {
  campaignDetails: ['Make it more concise', 'Add more detail', 'Make it more compelling'],
  brandProduct: ['Add competitive positioning', 'Clarify the value proposition'],
  businessObjective: ['Make objectives more measurable', 'Add revenue targets'],
  goals: ['Make goals more specific and measurable', 'Add SMART criteria'],
  successMetrics: ['Suggest industry benchmark KPIs', 'Add secondary metrics'],
  targetAudience: ['Narrow the audience further', 'Add lookalike audiences'],
  channels: ['Suggest additional channels', 'Optimize channel mix for budget'],
  budget: ['Suggest optimal budget allocation', 'Adjust pacing strategy'],
  timeline: ['Extend the timeline', 'Add more phases'],
};

function getSectionDataSummary(key: SectionKey, data: CampaignBriefData): string {
  switch (key) {
    case 'campaignDetails': return data.campaignDetails || '(empty)';
    case 'brandProduct': return data.brandProduct || '(empty)';
    case 'businessObjective': return [data.businessObjective, ...data.businessObjectiveTags].filter(Boolean).join(', ') || '(empty)';
    case 'goals': return [...data.primaryGoals, ...data.secondaryGoals].join(', ') || '(empty)';
    case 'successMetrics': return [...data.primaryKpis, ...data.secondaryKpis].join(', ') || '(empty)';
    case 'campaignScope': return [...data.inScope, ...data.outOfScope].join(', ') || '(empty)';
    case 'targetAudience': return [...data.primaryAudience, ...data.secondaryAudience].join(', ') || '(empty)';
    case 'audienceSegments': return normalizeSegmentItems([...data.prospectingSegments, ...data.retargetingSegments, ...data.suppressionSegments]).join(', ') || '(empty)';
    case 'channels': return [...data.mandatoryChannels, ...data.optionalChannels].join(', ') || '(empty)';
    case 'budget': return [data.budgetAmount, data.pacing, data.phases].filter(Boolean).join(', ') || '(empty)';
    case 'timeline': return [data.timelineStart, data.timelineEnd].filter(Boolean).join(' – ') || '(empty)';
    default: return '(empty)';
  }
}

function EditWithAIPopover({
  sectionKey,
  sectionTitle,
  briefData,
  isLoading,
  onClose,
}: {
  sectionKey: SectionKey;
  sectionTitle: string;
  briefData: CampaignBriefData;
  isLoading: boolean;
  onClose: () => void;
}) {
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const quickPrompts = SECTION_QUICK_PROMPTS[sectionKey] || [];

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Auto-close when loading finishes (brief data updated)
  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      onClose();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, onClose]);

  const handleSubmit = () => {
    if (!instruction.trim() || isLoading) return;
    const currentValue = getSectionDataSummary(sectionKey, briefData);

    // Map section keys to the exact JSON field names the refine-campaign-brief skill expects
    const sectionFieldMap: Record<string, string> = {
      campaignDetails: 'campaignDetails (campaignName, campaignType, description)',
      brandProduct: 'brandProduct',
      businessObjective: 'businessObjective and businessObjectiveTags',
      goals: 'primaryGoals and secondaryGoals',
      successMetrics: 'primaryKpis and secondaryKpis',
      campaignScope: 'inScope and outOfScope',
      targetAudience: 'primaryAudience and secondaryAudience',
      audienceSegments: 'prospectingSegments, retargetingSegments, and suppressionSegments',
      channels: 'mandatoryChannels and optionalChannels',
      budget: 'budgetAmount, pacing, and phases',
      timeline: 'timelineStart and timelineEnd',
    };
    const fieldHint = sectionFieldMap[sectionKey] || sectionKey;

    // Include the full brief as context so the LLM has all fields available,
    // especially important for saved/loaded briefs where session history is empty.
    const briefContext = JSON.stringify(briefData, null, 2);

    // Prefix with [brief-edit] so chatStore skips context enrichment (brand
    // guidelines, company context, audiences, pages). The full brief is already
    // included inline — extra injection creates a context avalanche that causes
    // the LLM to respond conversationally instead of emitting a code fence.
    const message = [
      `[brief-edit] Change the ${fieldHint} field in the brief below.`,
      `Instruction: ${instruction.trim()}`,
      `Current value: ${currentValue}`,
      ``,
      `<campaign-brief>`,
      briefContext,
      `</campaign-brief>`,
      ``,
      `Respond with a brief-update-json code fence containing only the changed fields. Do not ask clarifying questions — apply the edit directly.`,
    ].join('\n');

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = useTraceStore.getState();
    trace.startRun(runId, `user-${Date.now()}`);
    trace.addEvent(runId, 'intent', `AI edit: "${sectionTitle}" section`, {
      data: { sectionKey, instruction: instruction.trim() },
    });
    trace.addEvent(runId, 'route', 'Routing to brief-update skill');
    trace.addEvent(runId, 'skill_call', 'Sending to Claude Agent SDK');

    useBriefEditorStore.getState().setAIEditLoading(true);

    // Safety timeout: if the AI edit takes longer than 60s, force-reset loading state
    const safetyTimer = setTimeout(() => {
      const editorStore = useBriefEditorStore.getState();
      if (editorStore.state.aiEditPopover.isLoading) {
        editorStore.setAIEditLoading(false);
        editorStore.closeAIEditPopover();
        trace.addEvent(runId, 'error', 'AI edit timed out after 60s', { level: 'error' });
        trace.completeRun(runId, 'failed');
      }
    }, 60_000);

    useChatStore.getState().sendMessage(message, runId).finally(() => {
      clearTimeout(safetyTimer);
      useBriefEditorStore.getState().setAIEditLoading(false);
      const traceRun = useTraceStore.getState().runs[runId];
      if (traceRun && traceRun.status === 'running') {
        trace.completeRun(runId, 'succeeded');
      }
    });
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 z-10 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <AIEditIcon size={16} color="#6F2EFF" />
          <span className="text-sm font-semibold text-[#212327]">Edit with AI</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1">
          <X size={16} />
        </button>
      </div>

      {/* Instruction input */}
      <div className="px-4 pb-3">
        <textarea
          ref={textareaRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={`How should I change the ${sectionTitle.toLowerCase()}?`}
          rows={2}
          disabled={isLoading}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[#212327] outline-none resize-none focus:border-[#6F2EFF] placeholder:text-[#9BA2AF] disabled:opacity-50"
        />
      </div>

      {/* Quick prompts */}
      {quickPrompts.length > 0 && !isLoading && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInstruction(prompt)}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-[#636A77] cursor-pointer hover:border-[#6F2EFF] hover:text-[#6F2EFF] hover:bg-[#F3EEFF] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#6F2EFF]">
            <Loader2 size={14} className="animate-spin" />
            Applying changes...
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!instruction.trim()}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#6F2EFF] border-none rounded-lg cursor-pointer hover:bg-[#5B25D4] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Section Header ---

function SectionHeader({
  title,
  subtitle,
  sectionState,
  onAIEdit,
}: {
  title: string;
  subtitle: string;
  sectionState: string;
  onAIEdit: () => void;
}) {
  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex flex-col gap-0.5 w-[228px] flex-shrink-0">
        <span className="text-base font-semibold text-[#212327] flex items-center gap-2">
          {title}
          {(sectionState === 'completed' || sectionState === 'default') && (
            <CheckCircle2 className="w-4 h-4" color="#5CDB73" fill="#5CDB73" stroke="white" strokeWidth={2} />
          )}
          {sectionState === 'empty' && (
            <XCircle className="w-4 h-4" color="#EF4444" fill="#EF4444" stroke="white" strokeWidth={2} />
          )}
        </span>
        <span className="text-sm text-[#636A77]">{subtitle}</span>
      </div>

      {/* AI Edit Button */}
      {(sectionState === 'default' || sectionState === 'completed' || sectionState === 'empty') && (
        <button
          onClick={onAIEdit}
          className="flex items-center justify-center w-7 h-7 bg-white border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100"
          title="AI Edit"
        >
          <AIEditIcon size={16} color="#6B7280" />
        </button>
      )}
    </div>
  );
}

// --- Editable Tag ---

function EditableTag({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-1.5 p-2 bg-[#EFF2F8] rounded">
      <span className="text-sm text-[#636A77]">{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-4 h-4 border-none bg-transparent cursor-pointer flex items-center justify-center p-0 rounded-full hover:bg-black/[.08]"
        >
          <X size={12} color="#636A77" />
        </button>
      )}
    </div>
  );
}

// --- Channel Tag (with platform logo) ---

function ChannelTag({ name, onRemove }: { name: string; onRemove?: () => void }) {
  const logo = CHANNEL_LOGOS[name];

  return (
    <div className="flex items-center gap-2 p-2 bg-[#EFF2F8] rounded">
      {logo ? (
        <img src={logo} alt={name} className="w-4 h-4 object-cover flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
      )}
      <span className="text-sm text-[#636A77]">{name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-4 h-4 border-none bg-transparent cursor-pointer flex items-center justify-center p-0 rounded-full hover:bg-black/[.08]"
        >
          <X size={12} color="#636A77" />
        </button>
      )}
    </div>
  );
}

// --- Section Content ---

function SectionContent({
  config,
  briefData,
  onUpdateData,
}: {
  config: SectionConfig;
  briefData: Record<string, unknown>;
  onUpdateData: (data: Record<string, unknown>) => void;
}) {
  // Text sections — always editable inline
  if (config.type === 'text') {
    const dataKey = config.key === 'campaignDetails' ? 'campaignDetails' : 'brandProduct';
    const value = (briefData[dataKey] as string) || '';

    return (
      <textarea
        value={value}
        onChange={(e) => onUpdateData({ [dataKey]: e.target.value })}
        placeholder={`Add ${config.title.toLowerCase()}...`}
        className={inlineTextareaClassName}
      />
    );
  }

  // Tags sections (Business Objective) — always editable
  if (config.type === 'tags') {
    const tags = (briefData.businessObjectiveTags as string[]) || [];
    return <TagEditList tags={tags} onUpdateData={onUpdateData} />;
  }

  // --- Editable tag list helper ---
  const EditableTagList = ({ items, placeholder, dataKey }: { items: string[]; placeholder: string; dataKey: string }) => {
    const [newItem, setNewItem] = useState('');
    const handleAdd = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && newItem.trim()) {
        onUpdateData({ [dataKey]: [...items, newItem.trim()] });
        setNewItem('');
      }
    };
    const handleRemove = (idx: number) => {
      onUpdateData({ [dataKey]: items.filter((_: string, i: number) => i !== idx) });
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {items.map((item: string, idx: number) => (
            <EditableTag key={idx} onRemove={() => handleRemove(idx)}>
              {item}
            </EditableTag>
          ))}
        </div>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleAdd}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>
    );
  };

  // --- Dual tag list helper (primary/secondary) ---
  const DualTagList = ({ label1, items1, key1, label2, items2, key2, placeholder1, placeholder2 }: {
    label1: string; items1: string[]; key1: string;
    label2: string; items2: string[]; key2: string;
    placeholder1: string; placeholder2: string;
  }) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#212327] m-0">{label1}</p>
        <EditableTagList items={items1} placeholder={placeholder1} dataKey={key1} />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#212327] m-0">{label2}</p>
        <EditableTagList items={items2} placeholder={placeholder2} dataKey={key2} />
      </div>
    </div>
  );

  // Goals section
  if (config.type === 'goals') {
    return (
      <DualTagList
        label1="Primary Goal" items1={(briefData.primaryGoals as string[]) || []} key1="primaryGoals" placeholder1="Add a primary goal..."
        label2="Secondary Goal" items2={(briefData.secondaryGoals as string[]) || []} key2="secondaryGoals" placeholder2="Add a secondary goal..."
      />
    );
  }

  // Success Metrics section
  if (config.type === 'metrics') {
    return (
      <DualTagList
        label1="Primary KPIs" items1={(briefData.primaryKpis as string[]) || []} key1="primaryKpis" placeholder1="Add a primary KPI..."
        label2="Secondary KPIs" items2={(briefData.secondaryKpis as string[]) || []} key2="secondaryKpis" placeholder2="Add a secondary KPI..."
      />
    );
  }

  // Scope section
  if (config.type === 'scope') {
    return (
      <DualTagList
        label1="In Scope" items1={(briefData.inScope as string[]) || []} key1="inScope" placeholder1="Add in-scope item..."
        label2="Out of Scope" items2={(briefData.outOfScope as string[]) || []} key2="outOfScope" placeholder2="Add out-of-scope item..."
      />
    );
  }

  // Audience section — always editable inline
  if (config.type === 'audience') {
    const primary = (briefData.primaryAudience as string[]) || [];
    const secondary = (briefData.secondaryAudience as string[]) || [];

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-[#212327] m-0">Primary Persona</p>
          <textarea
            value={primary.join('\n')}
            onChange={(e) => onUpdateData({ primaryAudience: e.target.value.split('\n').filter(Boolean) })}
            placeholder="Describe primary target audience..."
            className={inlineTextareaClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-[#212327] m-0">Secondary</p>
          <textarea
            value={secondary.join('\n')}
            onChange={(e) => onUpdateData({ secondaryAudience: e.target.value.split('\n').filter(Boolean) })}
            placeholder="Describe secondary target audience..."
            className={inlineTextareaClassName}
          />
        </div>
      </div>
    );
  }

  // Audience Segments section
  if (config.type === 'audienceSegments') {
    return (
      <AudienceSegmentsContent
        briefData={briefData}
        onUpdateData={onUpdateData}
      />
    );
  }

  // Channels section — with platform logos and multi-select dropdown
  if (config.type === 'channels') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-[#212327] m-0">Mandatory</p>
          <ChannelMultiSelect
            items={(briefData.mandatoryChannels as string[]) || []}
            dataKey="mandatoryChannels"
            placeholder="Select channels..."
            onUpdateData={onUpdateData}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-[#212327] m-0">Test / Optional</p>
          <ChannelMultiSelect
            items={(briefData.optionalChannels as string[]) || []}
            dataKey="optionalChannels"
            placeholder="Select optional channels..."
            onUpdateData={onUpdateData}
          />
        </div>
      </div>
    );
  }

  // Budget section — always editable inline
  if (config.type === 'budget') {
    return (
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className={labelClassName}>Budget Amount</label>
          <input
            type="text"
            value={(briefData.budgetAmount as string) || ''}
            onChange={(e) => onUpdateData({ budgetAmount: e.target.value })}
            placeholder="e.g. $25,000"
            className={inlineInputClassName}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className={labelClassName}>Pacing</label>
          <input
            type="text"
            value={(briefData.pacing as string) || ''}
            onChange={(e) => onUpdateData({ pacing: e.target.value })}
            placeholder="e.g. Even, Front-loaded"
            className={inlineInputClassName}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className={labelClassName}>Phases</label>
          <input
            type="text"
            value={(briefData.phases as string) || ''}
            onChange={(e) => onUpdateData({ phases: e.target.value })}
            placeholder="e.g. 3 phases"
            className={inlineInputClassName}
          />
        </div>
      </div>
    );
  }

  // Timeline section — always editable inline with visualization
  if (config.type === 'timeline') {
    const start = (briefData.timelineStart as string) || '';
    const end = (briefData.timelineEnd as string) || '';

    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className={labelClassName}>Start Date</label>
            <input
              type="text"
              value={start}
              onChange={(e) => onUpdateData({ timelineStart: e.target.value })}
              placeholder="e.g. March 1, 2026"
              className={inlineInputClassName}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className={labelClassName}>End Date</label>
            <input
              type="text"
              value={end}
              onChange={(e) => onUpdateData({ timelineEnd: e.target.value })}
              placeholder="e.g. May 31, 2026"
              className={inlineInputClassName}
            />
          </div>
        </div>
        {start && end && <TimelineBar start={start} end={end} />}
      </div>
    );
  }

  return null;
}

// --- Tag Edit List ---

function TagEditList({
  tags,
  onUpdateData,
}: {
  tags: string[];
  onUpdateData: (data: Record<string, unknown>) => void;
}) {
  const [newTag, setNewTag] = useState('');
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      onUpdateData({ businessObjectiveTags: [...tags, newTag.trim()] });
      setNewTag('');
    }
  };
  const handleRemoveTag = (idx: number) => {
    onUpdateData({ businessObjectiveTags: tags.filter((_: string, i: number) => i !== idx) });
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string, idx: number) => (
          <EditableTag key={idx} onRemove={() => handleRemoveTag(idx)}>{tag}</EditableTag>
        ))}
      </div>
      <input
        type="text"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={handleAddTag}
        placeholder="Add a business objective..."
        className={inputClassName}
      />
    </div>
  );
}

// --- Timeline Bar ---

function TimelineBar({ start, end }: { start: string; end: string }) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const getMonthIdx = (s: string) => {
    const lower = s.toLowerCase();
    return months.findIndex(m => lower.includes(m.toLowerCase()));
  };

  let startIdx = getMonthIdx(start);
  let endIdx = getMonthIdx(end);
  if (startIdx < 0) startIdx = 0;
  if (endIdx < 0 || endIdx <= startIdx) endIdx = Math.min(startIdx + 3, 11);

  const displayMonths = months.slice(startIdx, endIdx + 1);

  const phases = [
    { label: 'Planning', color: '#FFF1BA', startPct: 13, widthPct: 12 },
    { label: 'Creative', color: '#E9F388', startPct: 25, widthPct: 13.5 },
    { label: 'Launch', color: '#D3D8FF', startPct: 33.5, widthPct: 10 },
    { label: 'Optimize & Scale', color: '#C1E8FF', startPct: 38, widthPct: 37 },
    { label: 'Review', color: '#FFC1F7', startPct: 75, widthPct: 11.5 },
  ];

  return (
    <div className="relative w-full h-[238px] bg-white overflow-hidden">
      {/* X-axis month labels */}
      <div className="absolute top-0 left-0 w-full flex">
        {displayMonths.map((m) => (
          <div
            key={m}
            className="flex-1 border-l border-[#B6BDC9] py-2 pl-2 text-xs font-semibold text-[#636A77] uppercase tracking-wide"
          >
            {m}
          </div>
        ))}
      </div>

      {/* Phase bars */}
      {phases.map((phase, i) => (
        <div
          key={phase.label}
          className="absolute flex items-center justify-center rounded-lg overflow-hidden p-2"
          style={{
            top: `${54 + i * 32}px`,
            left: `${phase.startPct}%`,
            width: `${phase.widthPct}%`,
            background: phase.color,
          }}
        >
          <span className="text-xs font-normal text-[#464B55] text-center whitespace-nowrap overflow-hidden text-ellipsis">
            {phase.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Channel Multi-Select Dropdown ---

function ChannelMultiSelect({
  items,
  dataKey,
  placeholder,
  onUpdateData,
}: {
  items: string[];
  dataKey: string;
  placeholder: string;
  onUpdateData: (data: Record<string, unknown>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleToggle = (platform: string) => {
    if (items.includes(platform)) {
      onUpdateData({ [dataKey]: items.filter(p => p !== platform) });
    } else {
      onUpdateData({ [dataKey]: [...items, platform] });
    }
  };
  const handleRemove = (idx: number) => {
    onUpdateData({ [dataKey]: items.filter((_: string, i: number) => i !== idx) });
  };

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {items.map((ch: string, idx: number) => (
          <ChannelTag key={idx} name={ch} onRemove={() => handleRemove(idx)} />
        ))}
      </div>
      <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm text-[#9BA2AF] bg-white cursor-pointer text-left flex items-center justify-between transition-colors duration-200 ${
              isOpen ? 'border-[#6F2EFF]' : 'border-gray-200 hover:border-[#878F9E]'
            }`}
          >
            {placeholder}
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <path d="M1 1.5L6 6.5L11 1.5" stroke="#636A77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {isOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto py-1">
              {AD_PLATFORMS.map((platform) => {
                const isSelected = items.includes(platform);
                const logo = CHANNEL_LOGOS[platform];
                return (
                  <button
                    key={platform}
                    onClick={() => handleToggle(platform)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 border-none cursor-pointer text-left text-sm transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#F3EEFF] text-[#6F2EFF] hover:bg-[#EDE5FF]'
                        : 'bg-transparent text-[#212327] hover:bg-[#F7F8FB]'
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        isSelected
                          ? 'border-[1.5px] border-[#6F2EFF] bg-[#6F2EFF]'
                          : 'border-[1.5px] border-[#C5CAD3] bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {logo ? (
                      <img src={logo} alt="" className="w-5 h-5 object-contain flex-shrink-0 rounded" />
                    ) : (
                      <div
                        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: CHANNEL_BRANDS[platform]?.bg || '#9CA3AF' }}
                      >
                        {platform.charAt(0)}
                      </div>
                    )}
                    {platform}
                  </button>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}

// --- Audience Segments Content (TD Audience Studio integration) ---

interface TDSegmentOption {
  id: string;
  name: string;
  audienceSize?: number;
  parentId?: string;
  parentName?: string;
}

// Normalize segment items: AI may return objects {name, ...} instead of strings
function normalizeSegmentItems(items: unknown[]): string[] {
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'name' in item) return String((item as { name: unknown }).name);
    return String(item);
  });
}

function AudienceSegmentsContent({
  briefData,
  onUpdateData,
}: {
  briefData: Record<string, unknown>;
  onUpdateData: (data: Record<string, unknown>) => void;
}) {
  const [segments, setSegments] = useState<TDSegmentOption[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);
  const [segmentsFetched, setSegmentsFetched] = useState(false);

  const fetchAllSegments = useCallback(async () => {
    setIsLoadingSegments(true);
    setSegmentError(null);

    try {
      // Use IPC via window.aiSuites.settings for segment APIs
      if (window.aiSuites?.settings) {
        const parentResult = await window.aiSuites.settings.parentSegments();
        if (!parentResult?.success || !parentResult?.data) {
          setSegmentError(parentResult?.error || 'Failed to load segments');
          setIsLoadingSegments(false);
          return;
        }

        // Prioritize the user-selected parent segment from settings
        const selectedParentId = useSettingsStore.getState().selectedParentSegmentId;
        let parents = parentResult.data
          .filter((ps: { name?: string }) => ps.name && !ps.name.startsWith('qh_') && !ps.name.startsWith('ak_'));

        // Put selected parent first, then take top 10
        if (selectedParentId) {
          const selectedIdx = parents.findIndex((ps: { id: string }) => String(ps.id) === String(selectedParentId));
          if (selectedIdx > 0) {
            const [selected] = parents.splice(selectedIdx, 1);
            parents.unshift(selected);
          }
        }
        parents = parents.slice(0, 10);

        const childPromises = parents.map(async (parent: { id: string; name: string }) => {
          try {
            const childResult = await window.aiSuites.settings.parentSegmentChildren(parent.id);
            if (childResult?.success && childResult?.data) {
              return childResult.data.map((seg: { id: string; name: string; audienceSize?: number }) => ({
                id: seg.id,
                name: seg.name,
                audienceSize: seg.audienceSize,
                parentId: parent.id,
                parentName: parent.name,
              }));
            }
            return [];
          } catch {
            return [];
          }
        });

        const childResults = await Promise.all(childPromises);
        setSegments(childResults.flat());
      } else {
        setSegmentError('TD Audience Studio API not available');
      }
    } catch (err) {
      console.error('Error fetching TD segments:', err);
      setSegmentError('Failed to connect to TD Audience Studio');
    } finally {
      setIsLoadingSegments(false);
    }
  }, []);

  useEffect(() => {
    if (!segmentsFetched) {
      setSegmentsFetched(true);
      fetchAllSegments();
    }
  }, [segmentsFetched, fetchAllSegments]);

  const formatAudienceSize = (size?: number): string => {
    if (!size) return '';
    if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
    if (size >= 1000) return `${(size / 1000).toFixed(0)}K`;
    return size.toString();
  };

  const SEGMENT_CATEGORIES = [
    { label: 'Prospecting Segments', dataKey: 'prospectingSegments', items: normalizeSegmentItems((briefData.prospectingSegments as unknown[]) || []) },
    { label: 'Retargeting Segments', dataKey: 'retargetingSegments', items: normalizeSegmentItems((briefData.retargetingSegments as unknown[]) || []) },
    { label: 'Suppression Segments', dataKey: 'suppressionSegments', items: normalizeSegmentItems((briefData.suppressionSegments as unknown[]) || []) },
  ];

  return (
    <div className="flex flex-col gap-4">
      {segmentError && (
        <div className="px-3 py-2 bg-red-50 rounded-md text-[13px] text-red-800">
          {segmentError}
        </div>
      )}
      {SEGMENT_CATEGORIES.map((cat) => (
        <SegmentCategoryDropdown
          key={cat.dataKey}
          label={cat.label}
          items={cat.items}
          dataKey={cat.dataKey}
          segments={segments}
          isLoading={isLoadingSegments}
          onUpdateData={onUpdateData}
          onRefresh={fetchAllSegments}
          formatAudienceSize={formatAudienceSize}
        />
      ))}
    </div>
  );
}

function SegmentCategoryDropdown({
  label,
  items,
  dataKey,
  segments,
  isLoading,
  onUpdateData,
  onRefresh,
  formatAudienceSize,
}: {
  label: string;
  items: string[];
  dataKey: string;
  segments: TDSegmentOption[];
  isLoading: boolean;
  onUpdateData: (data: Record<string, unknown>) => void;
  onRefresh: () => void;
  formatAudienceSize: (size?: number) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredSegments = segments.filter((seg) =>
    seg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (segmentName: string) => {
    if (items.includes(segmentName)) {
      onUpdateData({ [dataKey]: items.filter((s: string) => s !== segmentName) });
    } else {
      onUpdateData({ [dataKey]: [...items, segmentName] });
    }
  };

  const handleRemove = (idx: number) => {
    onUpdateData({ [dataKey]: items.filter((_: string, i: number) => i !== idx) });
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-[#212327] m-0">{label}</p>

      {/* Selected segment tags */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((seg: string, idx: number) => {
            const segData = segments.find((s) => s.name === seg);
            return (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EFF2F8] rounded">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#636A77" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="3" stroke="#636A77" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="1" fill="#636A77"/>
                </svg>
                <span className="text-sm text-[#636A77]">{seg}</span>
                {segData?.audienceSize && (
                  <span className="text-xs text-[#9BA2AF]">{formatAudienceSize(segData.audienceSize)}</span>
                )}
                {!segData && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const settings = useSettingsStore.getState();
                      // Ensure parent segments are loaded
                      if (settings.parentSegments.length === 0) {
                        await settings.fetchParentSegments();
                      }
                      const { parentSegments, selectedParentSegmentId } = useSettingsStore.getState();
                      const parent = parentSegments.find(
                        (ps) => String(ps.id) === String(selectedParentSegmentId)
                      );
                      if (!parent) {
                        console.warn('[BriefSection] No selected parent segment found for Create');
                        return;
                      }
                      await window.aiSuites?.td?.createSegment(parent.name, seg);
                      onRefresh();
                    }}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 bg-transparent border-none cursor-pointer px-1 py-0 underline"
                    title="Create this segment in TD Audience Studio"
                  >
                    Create
                  </button>
                )}
                <button
                  onClick={() => handleRemove(idx)}
                  className="w-4 h-4 border-none bg-transparent cursor-pointer flex items-center justify-center p-0 rounded-full hover:bg-black/[.08]"
                >
                  <X size={12} color="#636A77" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown + Refresh */}
      <div className="flex items-center gap-2">
          <div ref={dropdownRef} className="relative flex-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-[#9BA2AF] bg-white cursor-pointer text-left flex items-center justify-between transition-colors duration-200 ${
                isOpen ? 'border-[#6F2EFF]' : 'border-gray-200 hover:border-[#878F9E]'
              }`}
            >
              Select audience segment
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <path d="M1 1.5L6 6.5L11 1.5" stroke="#636A77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[280px] overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search segments..."
                    autoFocus
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[13px] text-[#212327] outline-none focus:border-[#6F2EFF] placeholder:text-[#9BA2AF]"
                  />
                </div>
                <div className="overflow-y-auto max-h-[220px] py-1">
                  {isLoading ? (
                    <div className="p-4 text-center text-[13px] text-[#9BA2AF]">Loading segments from Audience Studio...</div>
                  ) : filteredSegments.length === 0 ? (
                    <div className="p-4 text-center text-[13px] text-[#9BA2AF]">{searchQuery ? 'No matching segments' : 'No segments available'}</div>
                  ) : (
                    filteredSegments.map((segment) => {
                      const isSelected = items.includes(segment.name);
                      return (
                        <button
                          key={segment.id}
                          onClick={() => handleSelect(segment.name)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 border-none cursor-pointer text-left text-sm transition-colors duration-150 ${
                            isSelected ? 'bg-[#F3EEFF] text-[#6F2EFF] hover:bg-[#EDE5FF]' : 'bg-transparent text-[#212327] hover:bg-[#F7F8FB]'
                          }`}
                        >
                          <div className={`w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                            isSelected ? 'border-[1.5px] border-[#6F2EFF] bg-[#6F2EFF]' : 'border-[1.5px] border-[#C5CAD3] bg-white'
                          }`}>
                            {isSelected && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">{segment.name}</div>
                            {segment.parentName && (
                              <div className="text-[11px] text-[#9BA2AF] mt-px overflow-hidden text-ellipsis whitespace-nowrap">{segment.parentName}</div>
                            )}
                          </div>
                          {segment.audienceSize && (
                            <span className="text-xs text-[#9BA2AF] flex-shrink-0">{formatAudienceSize(segment.audienceSize)}</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onRefresh}
            className="w-9 h-9 flex items-center justify-center bg-transparent border border-gray-200 rounded-lg cursor-pointer flex-shrink-0 transition-all duration-200 hover:bg-[#F7F8FB] hover:border-[#878F9E]"
            title="Refresh segments from Audience Studio"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12.25 7C12.25 9.8995 9.8995 12.25 7 12.25C4.1005 12.25 1.75 9.8995 1.75 7C1.75 4.1005 4.1005 1.75 7 1.75C9.07602 1.75 10.8632 2.94147 11.6667 4.66667" stroke="#636A77" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.25 1.75V4.66667H9.33333" stroke="#636A77" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
    </div>
  );
}
