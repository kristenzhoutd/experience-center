/**
 * CampaignChatPage — Main AI chat interface for campaign planning.
 * Split-pane layout with chat on the left and brief editor / blueprint panel on the right.
 * Ported from paid-media-2026-v2 with Emotion CSS converted to Tailwind,
 * Next.js router replaced with react-router-dom, and fetch('/api/...')
 * replaced with IPC via window.aiSuites.
 */

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import { useTraceStore } from '../../stores/traceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useBriefStore } from '../../stores/briefStore';
import { useBlueprintStore } from '../../stores/blueprintStore';
import {
  Send,
  Plus,
  FileText,
  X,
  Square,
  FileType,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Download,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useChatPointerStore } from '../../stores/chatPointerStore';
import PointerButton from '../chat/PointerButton';
import ReferenceBanner from '../chat/ReferenceBanner';
import FormattedAssistantMessage from './FormattedAssistantMessage';
import SplitPaneLayout from './SplitPaneLayout';
import StreamingChatView from '../StreamingChatView';
import { ErrorBoundary } from './ErrorBoundary';
import { useBriefEditorStore } from '../../stores/briefEditorStore';
import { useAdSetConfigStore } from '../../stores/adSetConfigStore';
import { chatHistoryStorage } from '../../services/chatHistoryStorage';
import PaidMediaStepper from './PaidMediaStepper';
import { useProgramStore } from '../../stores/programStore';
import { resetAllProgramState } from '../../utils/resetProgramState';

// Lazy-load heavy right-panel components to isolate import failures
const CampaignBriefEditorPanel = React.lazy(() => import('./CampaignBriefEditorPanel'));
const CampaignBlueprintsPanel = React.lazy(() => import('./CampaignBlueprintsPanel'));
const BlueprintDetailView = React.lazy(() =>
  import('./BlueprintDetailView').then((m) => ({ default: m.BlueprintDetailView }))
);
const PlanGenerationLoading = React.lazy(() => import('./editor/PlanGenerationLoading'));
const AdSetConfigPanel = React.lazy(() => import('./AdSetConfigPanel'));
import type {
  ChatMessage,
  AttachedFile,
  CampaignBriefFields,
  ExtractedCampaignData,
  MissingFieldInfo,
} from '../../types/campaign';
import type { CampaignBriefData } from '../../types/campaignBriefEditor';
import { SECTION_CONFIGS } from '../../types/campaignBriefEditor';
import { FIELD_WEIGHTS, FIELD_KEYWORDS } from '../../types/campaign';

// ---- Types ----

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  tdllmChatId?: string;
}

// ---- Right Panel ----

function RightPanel({
  isStreaming,
  onSendToChat,
  onGeneratePlan,
}: {
  isStreaming: boolean;
  onSendToChat: (message: string) => void;
  onGeneratePlan?: (briefData: CampaignBriefData) => void;
}) {
  const { blueprints, selectedBlueprintId, selectBlueprint, hasGeneratedPlan, approvedBlueprintId } = useBlueprintStore();
  const isGeneratingBrief = useBriefStore((s) => s.isGenerating);
  const activeBrief = useBriefStore((s) => s.activeBrief);
  const briefData = useBriefEditorStore((s) => s.state.briefData);
  const workflowState = useBriefEditorStore((s) => s.state.workflowState);
  const hasBriefData = briefData && (
    briefData.campaignDetails ||
    briefData.businessObjective ||
    briefData.primaryGoals.length > 0 ||
    briefData.mandatoryChannels.length > 0
  );

  // When workflow transitions from 'generating' back to 'editing', blueprints are ready
  const prevWorkflow = React.useRef(workflowState);
  React.useEffect(() => {
    if (prevWorkflow.current === 'generating' && workflowState === 'editing' && blueprints.length > 0) {
      useBlueprintStore.getState().setHasGeneratedPlan(true);
    }
    prevWorkflow.current = workflowState;
  }, [workflowState, blueprints.length]);

  const suspenseFallback = (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F8FB] border-l border-gray-200">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400">Loading panel...</p>
      </div>
    </div>
  );

  // 0. Show Ad Set Config panel when configs have been generated
  const { configs: adSetConfigs, hasGeneratedConfigs } = useAdSetConfigStore();

  if (hasGeneratedConfigs && adSetConfigs.length > 0 && workflowState === 'editing') {
    return (
      <ErrorBoundary>
        <Suspense fallback={suspenseFallback}>
          <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl overflow-y-auto">
            <AdSetConfigPanel onClose={() => useAdSetConfigStore.getState().clearAll()} />
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 1. Show brief skeleton loading while AI is generating the brief
  if (isGeneratingBrief && activeBrief) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">{activeBrief.name}</span>
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-blue-100 text-blue-600 rounded-full animate-pulse">
              generating
            </span>
          </div>
        </div>

        {/* Skeleton sections */}
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-[676px] bg-white rounded-2xl px-6 pt-6 pb-8 flex flex-col gap-4 mt-4 mx-4 mb-4 min-h-min">
            {SECTION_CONFIGS.map(({ key, title, subtitle }) => (
              <div key={key} className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{title}</span>
                </div>
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

  // 2. Show brief skeleton loading while generating blueprint/brief
  if (workflowState === 'generating') {
    const skeletonName = activeBrief?.name || briefData?.campaignDetails || 'Campaign Brief';
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#E8ECF3] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">{skeletonName}</span>
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">
              generating
            </span>
          </div>
        </div>

        {/* Skeleton sections */}
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-[676px] bg-white rounded-2xl px-6 pt-6 pb-8 flex flex-col gap-4 mt-4 mx-4 mb-4 min-h-min">
            {SECTION_CONFIGS.map(({ key, title, subtitle }) => (
              <div key={key} className="rounded-xl border border-[#E8ECF3] p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{title}</span>
                </div>
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
        <div className="px-5 py-3 border-t border-[#E8ECF3] text-center flex-shrink-0">
          <p className="text-xs text-gray-400 animate-pulse">AI is generating your campaign brief...</p>
        </div>
      </div>
    );
  }

  // 3. Show brief editor before plan is generated
  if (hasBriefData && !hasGeneratedPlan && workflowState === 'editing') {
    return (
      <ErrorBoundary>
        <Suspense fallback={suspenseFallback}>
          <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl overflow-y-auto">
            <CampaignBriefEditorPanel onGeneratePlan={onGeneratePlan} />
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 4. Show blueprint detail/list view AFTER plan generation
  if (blueprints.length > 0 && (hasGeneratedPlan || workflowState !== 'editing')) {
    const blueprint = selectedBlueprintId
      ? blueprints.find((b) => b.id === selectedBlueprintId) || blueprints[0]
      : blueprints[0];
    return (
      <ErrorBoundary>
        <Suspense fallback={suspenseFallback}>
          <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl overflow-y-auto">
            <BlueprintDetailView
              blueprint={blueprint}
              onClose={() => { useBlueprintStore.getState().setHasGeneratedPlan(false); selectBlueprint(null); }}
              editable={true}
              briefData={briefData}
              onSendToChat={onSendToChat}
              onUpdate={(updated) => {
                useBlueprintStore.getState().updateBlueprint(updated.id, updated);
              }}
              showApprovalButtons={true}
              onApprove={() => useBlueprintStore.getState().setApprovedBlueprintId(blueprint.id)}
              isApproved={approvedBlueprintId === blueprint.id}
            />
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 5. Show loading state while streaming — section skeleton (matches case 2)
  if (isStreaming) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#E8ECF3] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">Campaign Brief</span>
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#EFF6FF] text-[#1957DB] rounded-full animate-pulse">
              generating
            </span>
          </div>
        </div>

        {/* Skeleton sections */}
        <div className="flex-1 overflow-y-auto flex justify-center">
          <div className="w-full max-w-[676px] bg-white rounded-2xl px-6 pt-6 pb-8 flex flex-col gap-4 mt-4 mx-4 mb-4 min-h-min">
            {SECTION_CONFIGS.map(({ key, title, subtitle }) => (
              <div key={key} className="rounded-xl border border-[#E8ECF3] p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{title}</span>
                </div>
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
        <div className="px-5 py-3 border-t border-[#E8ECF3] text-center flex-shrink-0">
          <p className="text-xs text-gray-400 animate-pulse m-0">AI is extracting your campaign brief...</p>
        </div>
      </div>
    );
  }

  // Placeholder
  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            Campaign Brief Editor
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your campaign brief will appear here as you describe your campaign in the chat.
            The AI will automatically extract and structure the details.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Component ----

const CampaignChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract query params
  const briefParam = searchParams.get('brief') || '';
  const fileNameParam = searchParams.get('fileName') || '';
  const blueprintIdParam = searchParams.get('blueprintId') || '';
  const querySessionId = searchParams.get('sessionId') || '';
  const adsetForCampaignParam = searchParams.get('adsetForCampaign') || '';

  // Notification store
  const { addNotification } = useNotificationStore();

  // Chat store (IPC-based)
  const {
    messages: storeMessages,
    isStreaming,
    isWaitingForResponse,
    streamingSegments,
    sendMessage: sendChatMessage,
    stopStreaming,
    startSession,
    sessionActive,
    resetChat,
  } = useChatStore();

  // Local state (storeMessages from chatStore is used for rendering via StreamingChatView)
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatSessionReady, setChatSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<MissingFieldInfo[]>([]);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Chat history state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);
  const [chatHistoryFilter, setChatHistoryFilter] = useState('');
  const [chatHistoryDateFilter, setChatHistoryDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Resizable panel state
  const [chatPanelWidth, setChatPanelWidth] = useState(33);
  const [isChatCollapsed, _setIsChatCollapsed] = useState(() => {
    const saved = sessionStorage.getItem('pm-chat-collapsed');
    return saved !== null ? saved === 'true' : useBlueprintStore.getState().hasGeneratedPlan;
  });
  const setIsChatCollapsed = (v: boolean | ((prev: boolean) => boolean)) => {
    _setIsChatCollapsed((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      sessionStorage.setItem('pm-chat-collapsed', String(next));
      return next;
    });
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Campaign brief field tracking
  const [briefFields, setBriefFields] = useState<CampaignBriefFields>({
    budget: false,
    objective: false,
    audiences: false,
    channels: false,
    timeline: false,
    messaging: false,
    kpis: false,
    pacing: false,
    creativeMix: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll position state
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const CHAT_SESSIONS_KEY = 'pm_chat_sessions';
  const CHAT_MESSAGES_KEY = 'pm_chat_messages';

  // ---- Auto-collapse chat panel when blueprint generation completes ----

  const hasGeneratedPlan = useBlueprintStore((s) => s.hasGeneratedPlan);
  const prevHasGeneratedPlan = useRef(hasGeneratedPlan);

  useEffect(() => {
    if (hasGeneratedPlan && !prevHasGeneratedPlan.current) {
      // Only auto-collapse if user hasn't explicitly set a preference
      if (sessionStorage.getItem('pm-chat-collapsed') === null) {
        setIsChatCollapsed(true);
      }
    }
    prevHasGeneratedPlan.current = hasGeneratedPlan;
  }, [hasGeneratedPlan]);

  // ---- Set suite context ----
  useEffect(() => {
    useChatStore.getState().setActiveSuite('paid-media');
    return () => useChatStore.getState().setActiveSuite(null);
  }, []);

  // ---- Initialize chat session ----

  useEffect(() => {
    if (chatSessionReady) return; // Already initialized
    // Reset streaming state and start a real SDK session.
    // Preserve messages — openProgram() may have already loaded them before navigation.
    useChatStore.setState({ streamingSegments: [], isStreaming: false, isWaitingForResponse: false });
    startSession().then(() => {
      setChatSessionReady(true);
    });
  }, []); // Run once on mount only

  // ---- Restore program state from location.state ----

  const programIdConsumedRef = useRef<string | null>(null);

  useEffect(() => {
    const locState = location.state as { programId?: string; editBrief?: boolean } | null;
    const programId = locState?.programId;
    if (!programId || programIdConsumedRef.current === programId) return;
    programIdConsumedRef.current = programId;

    // Always run openProgram — even if the program is already active,
    // session init may have cleared messages before this effect ran.
    useProgramStore.getState().openProgram(programId, {
      editBrief: locState?.editBrief,
    });
  }, [location.state]);

  // ---- Select blueprint from query param ----
  const blueprintIdConsumedRef = useRef(false);

  useEffect(() => {
    if (!blueprintIdParam || blueprintIdConsumedRef.current) return;
    blueprintIdConsumedRef.current = true;

    // Load blueprints from disk, then select the requested one
    useBlueprintStore.getState().loadBlueprints().then(() => {
      useBlueprintStore.getState().setHasGeneratedPlan(true);
      useBlueprintStore.getState().selectBlueprint(blueprintIdParam);
    });
  }, [blueprintIdParam]);

  // ---- Auto-send brief from query params ----

  const briefConsumedRef = useRef(false);

  useEffect(() => {
    if (!chatSessionReady || !briefParam) return;
    // Only auto-send once per mount — prevent re-fires
    if (briefConsumedRef.current) return;
    briefConsumedRef.current = true;

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = useTraceStore.getState();
    trace.startRun(runId, `user-${Date.now()}`);
    trace.addEvent(runId, 'intent', 'Auto-send: campaign brief from query param');
    trace.addEvent(runId, 'route', 'Routing to Campaign Brief editor');

    // Check for attached file from sessionStorage (set by landing page)
    const pendingFileRaw = sessionStorage.getItem('pendingFileData');

    if (pendingFileRaw) {
      try {
        const pendingFile = JSON.parse(pendingFileRaw);
        sessionStorage.removeItem('pendingFileData');

        // Check if text was already extracted (from landing page)
        if (pendingFile.extractedText) {
          const fullMessage = `I've uploaded a PDF campaign brief. The full text content has already been extracted below — do NOT attempt to read any file paths, the text is provided inline. Please extract and structure all the campaign information from this document using the extract-brief-from-pdf skill. Output the complete campaign brief as a campaign-brief-json code fence so it populates the editor.\n\n<pdf-content filename="${pendingFile.name}">\n${pendingFile.extractedText.substring(0, 10000)}\n</pdf-content>`;
          trace.addEvent(runId, 'skill_call', `Sending PDF brief (${pendingFile.name}) to Claude Agent SDK`);
          sendChatMessage(fullMessage, runId);
          return;
        }

        // Fallback: Extract text from PDF via IPC (for backward compatibility)
        if (pendingFile.base64 && window.aiSuites?.pdf) {
          trace.addEvent(runId, 'skill_call', `Extracting PDF text from ${pendingFile.name}`);
          window.aiSuites.pdf.extract(pendingFile.base64, pendingFile.name).then((result) => {
            if (result.success && result.text) {
              const fullMessage = `I've uploaded a PDF campaign brief. The full text content has already been extracted below — do NOT attempt to read any file paths, the text is provided inline. Please extract and structure all the campaign information from this document using the extract-brief-from-pdf skill. Output the complete campaign brief as a campaign-brief-json code fence so it populates the editor.\n\n<pdf-content filename="${pendingFile.name}">\n${result.text.substring(0, 10000)}\n</pdf-content>`;
              trace.addEvent(runId, 'skill_call', 'Sending extracted PDF to Claude Agent SDK');
              sendChatMessage(fullMessage, runId);
            }
          }).catch(console.error);
          return;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Send the brief directly
    trace.addEvent(runId, 'skill_call', 'Sending brief text to Claude Agent SDK');
    sendChatMessage(briefParam, runId);
  }, [chatSessionReady, briefParam]);

  // ---- Auto-send ad set config request from query params ----

  const adsetConsumedRef = useRef(false);

  useEffect(() => {
    if (!chatSessionReady || !adsetForCampaignParam) return;
    if (adsetConsumedRef.current) return;
    adsetConsumedRef.current = true;

    const rawContext = sessionStorage.getItem('adsetCampaignContext');
    if (!rawContext) return;
    sessionStorage.removeItem('adsetCampaignContext');

    try {
      const ctx = JSON.parse(rawContext);
      useAdSetConfigStore.getState().setCampaignContext({
        campaignId: ctx.campaignId,
        campaignName: ctx.campaignName,
      });
      useBriefEditorStore.getState().startGeneration();

      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const trace = useTraceStore.getState();
      trace.startRun(runId, `user-${Date.now()}`);
      trace.addEvent(runId, 'intent', 'Auto-send: ad set config generation', {
        data: { campaignName: ctx.campaignName, campaignId: ctx.campaignId },
      });
      trace.addEvent(runId, 'route', 'Routing to Ad Set Config generation');
      trace.addEvent(runId, 'skill_call', 'Sending ad set config prompt to Claude Agent SDK');

      const prompt = [
        'Generate ad group configurations for this Meta campaign. Create three ad set variants (conservative, balanced, aggressive) with targeting, budget, optimization goal, and estimated metrics. Output the result as a ```adset-config-json code fence.',
        '',
        'Campaign Context:',
        `Campaign Name: ${ctx.campaignName}`,
        `Campaign Type: ${ctx.campaignType || 'Unknown'}`,
        ctx.budget ? `Budget: $${ctx.budget}/day` : '',
        ctx.platform ? `Platform: ${ctx.platform}` : '',
        ctx.roas ? `Current ROAS: ${Number(ctx.roas).toFixed(1)}x` : '',
        ctx.cpa ? `Current CPA: $${Number(ctx.cpa).toFixed(0)}` : '',
      ].filter(Boolean).join('\n');

      sendChatMessage(prompt, runId);
    } catch {
      // Ignore parse errors
    }
  }, [chatSessionReady, adsetForCampaignParam]);

  // ---- Restore saved brief + chat history from location.state ----

  const briefIdConsumedRef = useRef(false);

  useEffect(() => {
    if (!chatSessionReady) return;
    const briefId = (location.state as { briefId?: string } | null)?.briefId;
    if (!briefId || briefIdConsumedRef.current) return;
    briefIdConsumedRef.current = true;

    useBriefStore.getState().setActiveBrief(briefId);

    // Reset blueprint/plan state so the right panel shows the brief editor
    useBlueprintStore.getState().setHasGeneratedPlan(false);
    useBlueprintStore.getState().selectBlueprint(null);

    const savedMessages = chatHistoryStorage.getMessages(briefId);
    if (savedMessages.length > 0) {
      useChatStore.getState().loadMessages(savedMessages);
    }

    const editorDataRaw = localStorage.getItem(`paid-media-suite:editor:${briefId}`);
    if (editorDataRaw) {
      try {
        const editorData = JSON.parse(editorDataRaw);
        useBriefEditorStore.getState().setBriefData(editorData);
      } catch {
        // Corrupt data
      }
    } else {
      const brief = useBriefStore.getState().activeBrief;
      if (brief?.sections) {
        const { overview, audience, measurement } = brief.sections;
        useBriefEditorStore.getState().setBriefData({
          campaignDetails: overview?.campaignName || brief.name || '',
          brandProduct: '',
          businessObjective: overview?.objective || '',
          businessObjectiveTags: [],
          primaryGoals: overview?.businessGoal ? [overview.businessGoal] : [],
          secondaryGoals: [],
          primaryKpis: measurement?.primaryKpi ? [measurement.primaryKpi] : [],
          secondaryKpis: measurement?.secondaryKpis || [],
          inScope: [],
          outOfScope: [],
          primaryAudience: audience?.segments?.length
            ? audience.segments
            : audience?.primaryAudience
              ? [audience.primaryAudience]
              : [],
          secondaryAudience: [],
          mandatoryChannels: [],
          optionalChannels: [],
          budgetAmount: '',
          pacing: '',
          phases: '',
          prospectingSegments: [],
          retargetingSegments: [],
          suppressionSegments: [],
          timelineStart: overview?.timelineStart || '',
          timelineEnd: overview?.timelineEnd || '',
        });
      }
    }

    window.history.replaceState({}, document.title);
  }, [chatSessionReady, location.state]);

  // ---- Load chat sessions from localStorage on mount ----

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (saved) {
        const sessions: ChatSession[] = JSON.parse(saved).map((s: ChatSession & { timestamp: string }) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        }));
        setChatSessions(sessions);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ---- Scroll to bottom on new messages ----

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storeMessages]);

  // storeMessages are rendered directly by StreamingChatView — no local sync needed

  // ---- Brief field analysis ----

  const calculateCompleteness = (fields: CampaignBriefFields): number => {
    let totalWeight = 0;
    let achievedWeight = 0;

    (Object.keys(fields) as Array<keyof CampaignBriefFields>).forEach((field) => {
      totalWeight += FIELD_WEIGHTS[field];
      if (fields[field]) {
        achievedWeight += FIELD_WEIGHTS[field];
      }
    });

    return Math.round((achievedWeight / totalWeight) * 100);
  };

  const analyzeContent = (content: string): Partial<CampaignBriefFields> => {
    const lowerContent = content.toLowerCase();
    const detectedFields: Partial<CampaignBriefFields> = {};

    (Object.keys(FIELD_KEYWORDS) as Array<keyof CampaignBriefFields>).forEach((field) => {
      const keywords = FIELD_KEYWORDS[field];
      const hasKeyword = keywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()));
      if (hasKeyword) {
        detectedFields[field] = true;
      }
    });

    return detectedFields;
  };

  const updateBriefFields = (content: string) => {
    const detected = analyzeContent(content);
    setBriefFields((prev) => {
      const updated = { ...prev };
      (Object.keys(detected) as Array<keyof CampaignBriefFields>).forEach((field) => {
        if (detected[field]) {
          updated[field] = true;
        }
      });
      return updated;
    });
  };

  const completeness = calculateCompleteness(briefFields);

  // ---- Session management ----

  const saveChatSessions = (sessions: ChatSession[]) => {
    try {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat sessions:', e);
    }
  };

  const saveMessagesForSession = (sessionId: string, msgs: ChatMessage[]) => {
    try {
      const allMessages = JSON.parse(localStorage.getItem(CHAT_MESSAGES_KEY) || '{}');
      allMessages[sessionId] = msgs;
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(allMessages));
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  };

  const loadMessagesForSession = (sessionId: string): ChatMessage[] => {
    try {
      const allMessages = JSON.parse(localStorage.getItem(CHAT_MESSAGES_KEY) || '{}');
      const sessionMessages = allMessages[sessionId] || [];
      return sessionMessages.map((m: ChatMessage & { timestamp: string }) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    } catch {
      return [];
    }
  };

  const generateSessionTitle = (content: string): string => {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 50) return cleaned;
    return cleaned.substring(0, 47) + '...';
  };

  const updateCurrentSession = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    const userMessages = msgs.filter((m) => m.role === 'user');
    if (userMessages.length === 0) return;

    const firstUserMessage = userMessages[0];
    const lastMessage = msgs[msgs.length - 1];
    const sessionId = currentSessionId || `session-${Date.now()}`;

    const session: ChatSession = {
      id: sessionId,
      title: generateSessionTitle(firstUserMessage.content || 'Untitled Chat'),
      preview: lastMessage.content?.substring(0, 100) || '',
      timestamp: new Date(),
      messageCount: msgs.length,
    };

    setChatSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === sessionId);
      let updated: ChatSession[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = session;
      } else {
        updated = [session, ...prev];
      }
      updated = updated.slice(0, 20);
      saveChatSessions(updated);
      return updated;
    });

    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    saveMessagesForSession(sessionId, msgs);
  }, [currentSessionId]);

  // ---- Save messages to session when they change ----

  useEffect(() => {
    if (storeMessages.length > 0 && !isStreaming) {
      const timer = setTimeout(() => {
        updateCurrentSession(storeMessages);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [storeMessages, isStreaming, updateCurrentSession]);

  // ---- Auto-save chat messages for active program ----

  const latestMessagesRef = useRef(storeMessages);
  useEffect(() => { latestMessagesRef.current = storeMessages; }, [storeMessages]);

  useEffect(() => {
    if (storeMessages.length === 0 || isStreaming) return;
    const program = useProgramStore.getState().activeProgram;
    if (!program) return;
    const historyKey = program.chatHistoryKey || `program-chat:${program.id}`;
    const timer = setTimeout(() => {
      chatHistoryStorage.saveMessages(historyKey, storeMessages);
      if (!program.chatHistoryKey) {
        useProgramStore.getState().linkChatSession(program.chatSessionId || '', historyKey);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [storeMessages, isStreaming]);

  // Flush program chat messages on unmount
  useEffect(() => {
    return () => {
      const msgs = latestMessagesRef.current;
      if (msgs.length === 0) return;
      const program = useProgramStore.getState().activeProgram;
      if (!program) return;
      const historyKey = program.chatHistoryKey || `program-chat:${program.id}`;
      chatHistoryStorage.saveMessages(historyKey, msgs);
      if (!program.chatHistoryKey) {
        useProgramStore.getState().linkChatSession(program.chatSessionId || '', historyKey);
      }
    };
  }, []);

  // ---- Handle selecting a chat session from history ----

  const handleSelectSession = async (session: ChatSession) => {
    setIsLoadingHistory(true);
    setError(null);
    setCurrentSessionId(session.id);
    setChatSessionReady(false);

    setBriefFields({
      budget: false,
      objective: false,
      audiences: false,
      channels: false,
      timeline: false,
      messaging: false,
      kpis: false,
      pacing: false,
      creativeMix: false,
    });

    // Load from localStorage
    const loadedMessages = loadMessagesForSession(session.id);
    useChatStore.setState({ messages: loadedMessages as any });

    // Analyze loaded messages for brief fields
    loadedMessages.forEach((msg) => {
      if (msg.content) {
        updateBriefFields(msg.content);
      }
    });

    setChatSessionReady(true);
    setIsLoadingHistory(false);
    setShowChatHistoryModal(false);
  };

  // ---- Handle starting a new chat ----

  const handleNewChat = async () => {
    resetChat();
    useAdSetConfigStore.getState().clearAll();
    useBriefEditorStore.getState().reset?.();

    // Reset local component state
    setCurrentSessionId(undefined);
    setInputValue('');
    setAttachedFiles([]);
    setError(null);
    setMissingFields([]);
    setShowDetailsForm(false);
    setBriefFields({
      budget: false,
      objective: false,
      audiences: false,
      channels: false,
      timeline: false,
      messaging: false,
      kpis: false,
      pacing: false,
      creativeMix: false,
    });

    // Re-initialize with a real SDK session
    setChatSessionReady(false);
    startSession().then(() => {
      setChatSessionReady(true);
    });

    // Clear any search params (e.g., ?session=...) without triggering a full navigation
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  };

  // ---- File handling ----

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const attachedFile: AttachedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      setAttachedFiles((prev) => [...prev, attachedFile]);

      // Auto-extract PDF text via IPC
      if (file.type === 'application/pdf' && window.aiSuites?.pdf) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
          });

          const result = await window.aiSuites.pdf.extract(base64, file.name);
          if (result.success && result.text) {
            // Store extracted text for sending with the message
            attachedFile.base64Data = result.text;
            attachedFile.preview = `Extracted ${result.text.length} characters from ${file.name}`;
            setAttachedFiles((prev) =>
              prev.map((f) => (f.id === attachedFile.id ? { ...f, base64Data: result.text, preview: attachedFile.preview } : f))
            );
            setToast({ message: `PDF text extracted from ${file.name}`, type: 'success' });
          } else {
            setToast({ message: result.error || 'Failed to extract PDF text', type: 'warning' });
          }
        } catch (err) {
          console.error('PDF extraction failed:', err);
          setToast({ message: 'PDF extraction failed', type: 'warning' });
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ---- Submit handler ----

  const handleSubmit = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    if (!chatSessionReady) {
      setError('Chat session not ready. Please wait...');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Build message with any extracted PDF text
    let messageToSend = inputValue.trim() || '';

    const pdfTexts = attachedFiles
      .filter((f) => f.base64Data)
      .map((f) => `\n\n<pdf-content filename="${f.name}">\n${f.base64Data!.substring(0, 5000)}\n</pdf-content>`);

    if (pdfTexts.length > 0) {
      messageToSend = (messageToSend || `Please analyze this campaign brief from ${attachedFiles.map((f) => f.name).join(', ')}. The text content has been extracted inline below — do NOT attempt to read any file paths.`) + pdfTexts.join('');
    } else if (!messageToSend && attachedFiles.length > 0) {
      messageToSend = `Please analyze this campaign brief: ${attachedFiles.map((f) => f.name).join(', ')}`;
    }

    // Analyze user message for campaign brief fields
    if (messageToSend.trim()) {
      updateBriefFields(messageToSend);
    }

    setInputValue('');
    setAttachedFiles([]);

    // Prepend element references to the message
    const pointerStore = useChatPointerStore.getState();
    const referenceXml = pointerStore.getInjectionXml();
    if (referenceXml) {
      messageToSend = referenceXml + messageToSend;
      pointerStore.clearReferences();
    }

    // ── Execution trace ──────────────────────────────────────────
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = useTraceStore.getState();
    trace.startRun(runId, `user-${Date.now()}`);

    const hasPdf = pdfTexts.length > 0;
    const hasBriefKeywords = /\b(brief|campaign|blueprint|plan|budget|audience|channel)\b/i.test(messageToSend);
    trace.addEvent(runId, 'intent', `Detected intent: ${hasBriefKeywords ? 'campaign_brief' : 'general_chat'}`, {
      data: { hasPdf, hasBriefKeywords },
    });
    trace.addEvent(runId, 'route', hasBriefKeywords ? 'Routing to Campaign Brief editor' : 'Routing to general paid media chat');
    trace.addEvent(runId, 'skill_call', 'Sending to Claude Agent SDK', {
      data: { mode: useChatStore.getState().isDemoMode ? 'demo' : 'sdk' },
    });

    try {
      // Send via IPC through chatStore (runId enables trace continuation in finalizeStream)
      await sendChatMessage(messageToSend, runId);

      // Analyze assistant response
      const latestMessages = useChatStore.getState().messages;
      const lastMsg = latestMessages[latestMessages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        updateBriefFields(lastMsg.content);
      }

      // Complete trace if finalizeStream didn't already (e.g. demo mode with no skills)
      const traceRun = useTraceStore.getState().runs[runId];
      if (traceRun && traceRun.status === 'running') {
        trace.completeRun(runId, 'succeeded');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      trace.addEvent(runId, 'error', err instanceof Error ? err.message : 'Send failed', { level: 'error' });
      trace.completeRun(runId, 'failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = () => {
    stopStreaming();
    setIsSubmitting(false);
  };

  // ---- Generate Plan handler ----

  const handleGeneratePlan = useCallback(async (briefData: CampaignBriefData) => {
    if (!chatSessionReady) {
      return;
    }

    // Start generation AFTER session check passes — clears blueprints and
    // sets workflowState to 'generating' to show skeleton loading.
    useBriefEditorStore.getState().startGeneration();

    const sections = [
      `Campaign: ${briefData.campaignDetails}`,
      `Brand/Product: ${briefData.brandProduct}`,
      `Business Objective: ${briefData.businessObjective}`,
      briefData.businessObjectiveTags.length > 0 ? `Objective Tags: ${briefData.businessObjectiveTags.join(', ')}` : '',
      briefData.primaryGoals.length > 0 ? `Primary Goals: ${briefData.primaryGoals.join(', ')}` : '',
      briefData.secondaryGoals.length > 0 ? `Secondary Goals: ${briefData.secondaryGoals.join(', ')}` : '',
      briefData.primaryKpis.length > 0 ? `Primary KPIs: ${briefData.primaryKpis.join(', ')}` : '',
      briefData.secondaryKpis.length > 0 ? `Secondary KPIs: ${briefData.secondaryKpis.join(', ')}` : '',
      briefData.primaryAudience.length > 0 ? `Primary Audience: ${briefData.primaryAudience.join(', ')}` : '',
      briefData.secondaryAudience.length > 0 ? `Secondary Audience: ${briefData.secondaryAudience.join(', ')}` : '',
      briefData.mandatoryChannels.length > 0 ? `Mandatory Channels: ${briefData.mandatoryChannels.join(', ')}` : '',
      briefData.optionalChannels.length > 0 ? `Optional Channels: ${briefData.optionalChannels.join(', ')}` : '',
      briefData.budgetAmount ? `Budget: ${briefData.budgetAmount}` : '',
      briefData.pacing ? `Pacing: ${briefData.pacing}` : '',
      briefData.timelineStart ? `Timeline: ${briefData.timelineStart} to ${briefData.timelineEnd}` : '',
    ].filter(Boolean).join('\n');

    // Include full brief as structured JSON in <campaign-brief> tags so the LLM
    // has complete context even when the SDK session has no conversation history
    // (e.g. after loading a saved brief). Explicitly instruct blueprints-json output
    // and prohibit brief-update-json to prevent wrong skill routing.
    const briefJson = JSON.stringify(briefData, null, 2);
    const prompt = `[blueprint-gen] Generate a campaign blueprint from the brief below.

You MUST use the generate-blueprints skill and output the result inside a \`\`\`blueprints-json code fence.
Do NOT emit a brief-update-json or any other code fence type — ONLY blueprints-json.
Create a single optimized blueprint with channel mix, audiences, budget allocation, messaging, and predicted metrics.
ALL mandatory channels from the brief MUST appear in the blueprint.

<campaign-brief>
${briefJson}
</campaign-brief>

Campaign Brief Summary:
${sections}`;

    // ── Execution trace ──────────────────────────────────────────
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = useTraceStore.getState();
    trace.startRun(runId, `user-${Date.now()}`);
    trace.addEvent(runId, 'intent', 'Generate Plan: blueprint generation from campaign brief', {
      data: { campaign: briefData.campaignDetails, objective: briefData.businessObjective },
    });
    trace.addEvent(runId, 'route', 'Routing to Blueprint generation skill');
    trace.addEvent(runId, 'skill_call', 'Sending blueprint prompt to Claude Agent SDK', {
      data: { skill: 'blueprints-json', channels: briefData.mandatoryChannels },
    });

    try {
      await sendChatMessage(prompt, runId);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate campaign plan');
      trace.addEvent(runId, 'error', err instanceof Error ? err.message : 'Plan generation failed', { level: 'error' });
      trace.completeRun(runId, 'failed');
      // Reset workflow state so user can retry
      useBriefEditorStore.getState().setWorkflowState('editing');
    }
  }, [chatSessionReady, sendChatMessage]);

  // ---- Scroll handling ----

  const handleMessagesScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollTop(scrollTop > 200);
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const handleScrollToTop = useCallback(() => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleScrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ---- Handle option button click ----

  const handleOptionClick = useCallback((optionText: string) => {
    setInputValue(optionText);
    setTimeout(() => {
      const submitBtn = document.querySelector('[data-submit-btn]') as HTMLButtonElement;
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      }
    }, 100);
  }, []);

  // ---- Export handlers ----

  const exportAsTxt = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    let text = `Campaign Chat Export - ${new Date().toLocaleDateString()}\n\n`;
    storeMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'AI';
      text += `[${role}] ${msg.content}\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-chat-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    setToast({ message: 'Chat exported as TXT', type: 'success' });
  }, [storeMessages]);

  // ---- Render ----

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-[slideDown_0.3s_ease-out]">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'warning' ? 'bg-amber-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col">
        <div
          ref={containerRef}
          className="flex-1 flex bg-white border border-gray-200 rounded-2xl overflow-hidden h-full relative"
        >
          {/* Chat History Modal Overlay */}
          {showChatHistoryModal && (
            <>
              <div
                onClick={() => {
                  setShowChatHistoryModal(false);
                  setChatHistoryFilter('');
                  setChatHistoryDateFilter('all');
                }}
                className="fixed inset-0 bg-black/30 z-[9998]"
              />
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[90vw] max-h-[70vh] bg-white rounded-xl shadow-2xl z-[9999] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                  <h3 className="font-semibold text-base text-gray-800">Chat History</h3>
                  <button
                    onClick={() => {
                      setShowChatHistoryModal(false);
                      setChatHistoryFilter('');
                      setChatHistoryDateFilter('all');
                    }}
                    className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center rounded hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* New Chat Button */}
                <div className="px-5 py-3 border-b border-gray-200 shrink-0">
                  <button
                    onClick={() => {
                      handleNewChat();
                      setShowChatHistoryModal(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 bg-[#3B6FD4] border-none rounded-lg cursor-pointer text-sm font-medium text-white transition-colors hover:bg-[#2a5fc4]"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                </div>

                {/* Search and Date Filter */}
                <div className="px-5 py-3 border-b border-gray-200 shrink-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg focus-within:border-[#3B6FD4] focus-within:bg-white">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={chatHistoryFilter}
                      onChange={(e) => setChatHistoryFilter(e.target.value)}
                      className="flex-1 border-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                    />
                    {chatHistoryFilter && (
                      <button
                        onClick={() => setChatHistoryFilter('')}
                        className="bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center rounded-full hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Date Filter */}
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { value: 'all' as const, label: 'All' },
                      { value: 'today' as const, label: 'Today' },
                      { value: 'yesterday' as const, label: 'Yesterday' },
                      { value: '7days' as const, label: '7 Days' },
                      { value: '30days' as const, label: '30 Days' },
                    ]).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setChatHistoryDateFilter(option.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                          chatHistoryDateFilter === option.value
                            ? 'border-[#3B6FD4] bg-blue-50 text-[#3B6FD4]'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-[#3B6FD4] hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto px-3 py-2 min-h-[200px]">
                  {chatSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Clock className="w-8 h-8 mb-3" />
                      <span className="text-sm">No chat history yet</span>
                    </div>
                  ) : (
                    chatSessions
                      .filter((session) => {
                        if (chatHistoryFilter) {
                          const filterLower = chatHistoryFilter.toLowerCase();
                          const titleMatch = (session.title || '').toLowerCase().includes(filterLower);
                          const previewMatch = (session.preview || '').toLowerCase().includes(filterLower);
                          if (!titleMatch && !previewMatch) return false;
                        }
                        return true;
                      })
                      .map((session) => (
                        <button
                          key={session.id}
                          onClick={() => handleSelectSession(session)}
                          className={`w-full text-left px-3 py-3 rounded-lg mb-1 cursor-pointer transition-colors border-none bg-transparent hover:bg-gray-100 ${
                            currentSessionId === session.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {session.title}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 truncate">
                                {session.preview}
                              </div>
                              <div className="text-[11px] text-gray-300 mt-1">
                                {new Date(session.timestamp).toLocaleDateString()} &middot; {session.messageCount} messages
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Main Content Area */}
          <SplitPaneLayout
            initialLeftWidth={chatPanelWidth}
            collapsed={isChatCollapsed}
            onToggleCollapse={() => setIsChatCollapsed(prev => !prev)}
          >
            {/* Left Panel - Chat */}
            <div className="flex flex-col h-full bg-white">
              {/* Chat Utility Buttons */}
              <div className="flex items-center justify-end px-4 pt-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowChatHistoryModal(true)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                    title="Chat History"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsChatCollapsed(true)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                    title="Collapse chat"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Completeness Bar */}
              {completeness > 0 && completeness < 100 && (
                <div className="px-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Brief completeness</span>
                    <span className="text-xs font-medium text-[#3B6FD4]">{completeness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3B6FD4] to-[#6F2EFF] rounded-full transition-all duration-500"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="mx-4 mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <span className="text-sm text-red-600">{error}</span>
                  <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto"
              >
                {isLoadingHistory ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-400">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#3B6FD4] rounded-full animate-spin" />
                      <span className="text-sm">Loading chat history...</span>
                    </div>
                  </div>
                ) : storeMessages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-7 h-7 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Start Planning Your Campaign
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Describe your campaign goals, target audience, budget, and timeline.
                        I'll generate a structured brief and blueprint variants.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Use the framework's StreamingChatView for proper store integration */}
                    <StreamingChatView
                      messages={storeMessages}
                      streamingSegments={streamingSegments}
                      isStreaming={isStreaming}
                      isWaitingForResponse={isWaitingForResponse}
                    />
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Scroll Buttons */}
              {showScrollTop && (
                <button
                  onClick={handleScrollToTop}
                  className="absolute top-20 right-4 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 z-10"
                >
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {showScrollBottom && (
                <button
                  onClick={handleScrollToBottom}
                  className="absolute bottom-24 right-4 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 z-10"
                >
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              )}

              {/* Input Area */}
              <div className="p-4 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Attached Files */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pt-3">
                      {attachedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <ReferenceBanner />

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => useChatPointerStore.getState().exitSelectionMode()}
                    placeholder="Describe your campaign..."
                    rows={1}
                    className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />

                  {/* Bottom Bar */}
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* File Attach Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 cursor-pointer transition-colors"
                        title="Attach file"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <PointerButton />
                      {/* Export Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 cursor-pointer transition-colors"
                          title="Export"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {showExportMenu && (
                          <div className="absolute bottom-[calc(100%+4px)] left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] z-50 overflow-hidden">
                            <button
                              onClick={exportAsTxt}
                              className="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-700 cursor-pointer transition-colors hover:bg-gray-50"
                            >
                              Export as TXT
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Send / Stop Button */}
                    {isStreaming || isSubmitting ? (
                      <button
                        onClick={handleCancelRequest}
                        className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 cursor-pointer transition-colors"
                        title="Cancel"
                      >
                        <Square className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        data-submit-btn
                        onClick={handleSubmit}
                        disabled={!inputValue.trim() && attachedFiles.length === 0}
                        className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Send"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Stepper + Brief Editor / Blueprint / Placeholder */}
            <div className="flex flex-col h-full overflow-hidden p-4">
              <PaidMediaStepper />
              <RightPanel
                isStreaming={isStreaming}
                onSendToChat={(message: string) => {
                  setInputValue(message);
                }}
                onGeneratePlan={handleGeneratePlan}
              />
            </div>
          </SplitPaneLayout>
        </div>
      </div>
    </>
  );
};

export default CampaignChatPage;
