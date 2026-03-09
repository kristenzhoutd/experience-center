import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { useChatStore } from '../stores/chatStore';
import { useBriefStore } from '../stores/briefStore';
import { useTraceStore } from '../stores/traceStore';
import { parseCampaignBrief } from '../services/briefParser';
import { detectIntent } from '../services/intentDetector';
import { campaignApi } from '../api/client';
import StrategyPreview from '../components/StrategyPreview';
import AgentThinking from '../components/AgentThinking';
import AgentResponsePanel from '../components/AgentResponsePanel';
import CampaignConfigurationWizard from '../components/CampaignConfigurationWizard';
import CampaignBriefEditor from '../components/CampaignBriefEditor';
import StreamingChatView from '../components/StreamingChatView';
import { chatHistoryStorage } from '../services/chatHistoryStorage';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import { FileText, Image as ImageIcon, FolderOpen, X } from 'lucide-react';
import type { AttachedFile } from '../types/campaign';
import { useChatPointerStore } from '../stores/chatPointerStore';
import PointerButton from '../components/chat/PointerButton';
import ReferenceBanner from '../components/chat/ReferenceBanner';
import AttachmentMenu from '../components/chat/AttachmentMenu';
import CampaignSelector from '../components/chat/CampaignSelector';
import { loadUploadedAssets, saveUploadedAssets } from '../utils/uploadedAssetsStorage';
import { loadDocuments, saveDocuments } from '../utils/documentsStorage';

const tools = [
  { id: 'brainstorm', label: 'Brainstorm', description: 'Generate campaign ideas' },
  { id: 'create', label: 'Create Campaign', description: 'Build a new campaign' },
  { id: 'analysis', label: 'Campaign Analysis', description: 'Analyze existing campaigns' },
  { id: 'optimize', label: 'Campaign Optimization', description: 'Improve performance' },
];

const suggestions = [
  {
    text: 'Turn this brief into a campaign with channels, audiences, and assets',
    gradient: 'from-orange-100 to-orange-50',
  },
  {
    text: 'Design a web personalization campaign for a fall apparel launch',
    gradient: 'from-cyan-100 to-cyan-50',
  },
  {
    text: 'Create personalized experiences for first-time vs returning visitors',
    gradient: 'from-teal-100 to-teal-50',
  },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState('');
  const [selectedTool, setSelectedTool] = useState('brainstorm');
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [latestAgentResponse, setLatestAgentResponse] = useState<string | null>(null);
  const [showConfigWizard, setShowConfigWizard] = useState(false);
  const [isLoadingWizard, setIsLoadingWizard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const suggestionsScrollRef = useRef<HTMLDivElement>(null);
  const [isSuggestionsPaused, setIsSuggestionsPaused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);

  const {
    organizationId,
    campaignDraft,
    setCampaignDraft,
  } = useAppStore();

  const {
    messages,
    isStreaming,
    isWaitingForResponse,
    streamingSegments,
    startSession,
    sendMessage,
    stopStreaming,
    resetChat,
  } = useChatStore();

  const { activeBrief } = useBriefStore();
  const displayDraft = campaignDraft;

  // Set suite context so chatStore restricts to personalization skills
  useEffect(() => {
    useChatStore.getState().setActiveSuite('personalization');
    return () => useChatStore.getState().setActiveSuite(null);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // Auto-scroll suggestions carousel
  useEffect(() => {
    const el = suggestionsScrollRef.current;
    if (!el || isSuggestionsPaused) return;

    let animationFrame: number;
    const scrollSpeed = 0.5;

    const step = () => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += scrollSpeed;
      }
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isSuggestionsPaused]);

  // Watch for reset signal from Home navigation
  useEffect(() => {
    const resetId = (location.state as { resetId?: number })?.resetId;
    if (resetId) {
      resetChat();
      setCampaignDraft(null);
      useBriefStore.getState().clearActiveBrief();
      setHasStartedChat(false);
      setLatestAgentResponse(null);
      setInput('');
      setIsInitialLoading(false);
      setPendingMessage('');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Open brief when navigated from BriefsPage
  useEffect(() => {
    const briefId = (location.state as { briefId?: string })?.briefId;
    if (briefId) {
      useBriefStore.getState().setActiveBrief(briefId);

      // Restore persisted chat messages for this brief
      const savedMessages = chatHistoryStorage.getMessages(briefId);
      if (savedMessages.length > 0) {
        useChatStore.getState().loadMessages(savedMessages);
      }

      setHasStartedChat(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const attachedFile: AttachedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        source: 'file',
      };

      setAttachedFiles((prev) => [...prev, attachedFile]);

      const ext = file.name.split('.').pop()?.toLowerCase() || '';

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
            const extractedText = result.text;
            setAttachedFiles((prev) =>
              prev.map((f) => (f.id === attachedFile.id ? { ...f, contentText: extractedText, preview: `Extracted ${extractedText.length} characters from ${file.name}` } : f))
            );
            // Save to documents storage
            const docs = loadDocuments();
            docs.push({
              id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              content: extractedText,
              fileType: ext.toUpperCase(),
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
            });
            saveDocuments(docs);
          }
        } catch (err) {
          console.error('PDF extraction failed:', err);
        }
      } else if (ext === 'txt' || ext === 'csv') {
        try {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
          setAttachedFiles((prev) =>
            prev.map((f) => (f.id === attachedFile.id ? { ...f, contentText: text, preview: `${text.length} characters from ${file.name}` } : f))
          );
          // Save to documents storage
          const docs = loadDocuments();
          docs.push({
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            content: text,
            fileType: ext.toUpperCase(),
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          });
          saveDocuments(docs);
        } catch (err) {
          console.error('Text extraction failed:', err);
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      // Get dimensions for asset storage
      const dimensions = await new Promise<string>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`);
        img.onerror = () => resolve('unknown');
        img.src = dataUrl;
      });

      const attachedFile: AttachedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        base64Data: dataUrl,
        source: 'image',
        preview: `Image: ${file.name}`,
      };

      setAttachedFiles((prev) => [...prev, attachedFile]);

      // Save to uploaded assets storage
      const assets = loadUploadedAssets();
      assets.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        url: dataUrl,
        type: 'image',
        category: 'Uploaded',
        dimensions,
      });
      saveUploadedAssets(assets);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, []);

  const handleCampaignSelect = useCallback((file: AttachedFile) => {
    setAttachedFiles((prev) => [...prev, file]);
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isStreaming || isWaitingForResponse) return;

    // Prepend element reference XML if any references are selected
    const pointerStore = useChatPointerStore.getState();
    const referenceXml = pointerStore.getInjectionXml();

    let userMessage = input.trim();
    setInput('');

    // Append attached content to the message
    const attachmentTexts: string[] = [];
    for (const f of attachedFiles) {
      if (f.source === 'campaign' && f.contentText) {
        attachmentTexts.push(`\n\n<existing-campaign>\n${f.contentText}\n</existing-campaign>`);
      } else if (f.source === 'brief' && f.contentText) {
        attachmentTexts.push(`\n\n<existing-brief>\n${f.contentText}\n</existing-brief>`);
      } else if (f.contentText) {
        attachmentTexts.push(`\n\n--- Attached: ${f.name} ---\n${f.contentText.substring(0, 5000)}`);
      } else if (f.source === 'image') {
        attachmentTexts.push(`\n\n[Image attached: ${f.name}]`);
      }
    }

    if (attachmentTexts.length > 0) {
      userMessage = (userMessage || `Please analyze: ${attachedFiles.map((f) => f.name).join(', ')}`) + attachmentTexts.join('');
    } else if (!userMessage && attachedFiles.length > 0) {
      userMessage = `Please analyze: ${attachedFiles.map((f) => f.name).join(', ')}`;
    }

    // Extract image base64 data for multimodal content blocks
    const imageBlocks: Array<{ mediaType: string; data: string }> = [];
    for (const f of attachedFiles) {
      if (f.source === 'image' && f.base64Data) {
        const commaIdx = f.base64Data.indexOf(',');
        const raw = commaIdx >= 0 ? f.base64Data.substring(commaIdx + 1) : f.base64Data;
        const mediaType = f.type || 'image/jpeg';
        imageBlocks.push({ mediaType, data: raw });
      }
    }

    setAttachedFiles([]);

    // Prepend element references to the message
    const hasElementReferences = !!referenceXml;
    if (referenceXml) {
      userMessage = referenceXml + userMessage;
      pointerStore.clearReferences();
    }

    // ── Intent detection & trace ──────────────────────────────────
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const msgId = `user-${Date.now()}`;
    const trace = useTraceStore.getState();

    trace.startRun(runId, msgId);

    const intentResult = detectIntent(userMessage);
    trace.addEvent(runId, 'intent', `Detected intent: ${intentResult.intent} (${intentResult.confidence})`, {
      data: {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        reason: intentResult.reason,
        matchedPatterns: intentResult.matchedPatterns,
      },
    });

    const isCampaignBrief = intentResult.intent === 'campaign_brief';

    if (isCampaignBrief) {
      trace.addEvent(runId, 'route', 'Routing to Campaign Brief mode', {
        data: { view: 'CampaignBriefEditor' },
      });
    } else {
      trace.addEvent(runId, 'route', 'Routing to general chat mode');
    }

    // ── First message - start session ─────────────────────────────
    if (!hasStartedChat) {
      setPendingMessage(userMessage);
      setIsInitialLoading(true);
      setHasStartedChat(true);

      const sessionStarted = await startSession();

      if (isCampaignBrief && !hasElementReferences) {
        // Parse keywords for summary, but only populate editor skeleton (AI will fill it)
        const parsed = parseCampaignBrief(userMessage);
        useBriefStore.getState().createEmptyBrief(parsed.name, userMessage, 'personalization');

        trace.addEvent(runId, 'skill_call', 'Keyword parser extracted summary (editor shows skeleton)', {
          data: { skillName: 'parseCampaignBrief', campaignName: parsed.name },
        });
        trace.addEvent(runId, 'ui_update', 'Campaign Brief editor mounted with loading skeleton');
      }

      // Send message with runId so finalizeStream can emit trace events
      if (sessionStarted) {
        trace.addEvent(runId, 'skill_call', 'Sending to Claude Agent SDK with campaign-brief skill', {
          data: { skillName: 'campaign-brief', mode: 'sdk' },
        });
      } else {
        trace.addEvent(runId, 'skill_call', 'Demo mode — using keyword parser only', {
          data: { mode: 'demo' },
        });
      }

      // sendMessage adds the user message synchronously, so start it first
      // then add the acknowledgment — guarantees correct chat ordering
      const sendPromise = sendMessage(userMessage, runId, imageBlocks.length > 0 ? imageBlocks : undefined);

      if (isCampaignBrief && !hasElementReferences) {
        useChatStore.getState().addSystemMessage(
          "Got it! I'll generate a campaign brief from your input."
        );
      }

      await sendPromise;

      setIsInitialLoading(false);
      setPendingMessage('');

      if (!sessionStarted) {
        setLatestAgentResponse('demo');
        // In demo mode, complete the trace immediately
        if (isCampaignBrief) {
          trace.addEvent(runId, 'skill_result', 'Demo mode brief generation complete');
        }
        trace.completeRun(runId, 'succeeded');
      }
      // In SDK mode, trace will be completed by finalizeStream()
      return;
    }

    // ── Subsequent messages ───────────────────────────────────────
    if (isCampaignBrief && !hasElementReferences) {
      const parsed = parseCampaignBrief(userMessage);
      useBriefStore.getState().createEmptyBrief(parsed.name, userMessage, 'personalization');

      trace.addEvent(runId, 'skill_call', 'Keyword parser extracted summary from follow-up message', {
        data: { skillName: 'parseCampaignBrief', campaignName: parsed.name },
      });
      trace.addEvent(runId, 'ui_update', 'Campaign Brief editor showing loading skeleton');
    }

    // sendMessage adds the user message synchronously, so start it first
    const sendPromise = sendMessage(userMessage, runId, imageBlocks.length > 0 ? imageBlocks : undefined);

    if (isCampaignBrief && !hasElementReferences) {
      useChatStore.getState().addSystemMessage(
        "Got it! I'll generate a campaign brief from your input."
      );
    }

    await sendPromise;

    // If in demo mode, complete trace here
    if (useChatStore.getState().isDemoMode) {
      trace.completeRun(runId, 'succeeded');
    }
  };

  // Watch for new assistant messages to set the response indicator
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && messages.length > 1) {
      setLatestAgentResponse(lastMsg.content);
    }
  }, [messages]);

  const handleShowConfigWizard = async () => {
    setIsLoadingWizard(true);

    // If there's an active brief, initialize the config store from it
    const brief = useBriefStore.getState().activeBrief;
    if (brief) {
      await useCampaignConfigStore.getState().initFromBrief(brief);
    }

    setIsLoadingWizard(false);
    setShowConfigWizard(true);
  };

  const handleWizardComplete = () => {
    // Config is already saved by the store (saveAsDraft or launch)
    useCampaignConfigStore.getState().reset();
    setShowConfigWizard(false);
    navigate('/campaigns');
  };

  const handleWizardCancel = () => {
    // Auto-save as draft so work is not lost
    const store = useCampaignConfigStore.getState();
    if (store.config) {
      store.saveAsDraft();
    }
    store.reset();
    setShowConfigWizard(false);
    navigate('/campaigns');
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const handleStop = async () => {
    if (isInitialLoading) {
      setIsInitialLoading(false);
      setHasStartedChat(false);
      setPendingMessage('');
      return;
    }
    await stopStreaming();
  };

  const isWorking = isStreaming || isWaitingForResponse;

  return (
    <div className="flex h-full">
      {/* Hidden file inputs — always in DOM so refs work from any state */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Main chat area with gradient background */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!hasStartedChat || isInitialLoading ? (
            /* Initial state - centered prompt or loading */
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {isInitialLoading ? (
                /* Loading state with two-column layout */
                <div className="flex-1 flex overflow-hidden p-4 w-full">
                  <div className="flex-1 flex gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Left side - Chat with user message */}
                    <div className="w-[35%] flex flex-col">
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4">
                          {/* User's pending message */}
                          <div className="animate-fade-in">
                            <div className="flex justify-end mb-1">
                              <div className="bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px] p-4 max-w-[90%]">
                                <p className="text-sm leading-relaxed">{pendingMessage}</p>
                              </div>
                            </div>
                            <div className="flex justify-end mt-1">
                              <span className="text-xs text-gray-400">
                                {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          {/* Agent thinking indicator */}
                          <div className="animate-fade-in">
                            <AgentThinking />
                          </div>
                        </div>
                      </div>

                      {/* Chat input with stop button */}
                      <div className="p-4">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                          <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Agent is working..."
                            className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
                            rows={1}
                          />
                          <div className="px-3 py-2 flex items-center justify-between">
                            <div className="relative">
                              <button
                                onClick={() => setShowAttachmentMenu((v) => !v)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              {showAttachmentMenu && (
                                <AttachmentMenu
                                  onUploadFile={() => fileInputRef.current?.click()}
                                  onUploadImage={() => imageInputRef.current?.click()}
                                  onSelectCampaign={() => setShowCampaignSelector(true)}
                                  onClose={() => setShowAttachmentMenu(false)}
                                />
                              )}
                            </div>
                            <button
                              onClick={handleStop}
                              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800"
                              title="Stop generating"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="1" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Illustrated loading animation */}
                    <div className="flex-1 py-4 pr-4">
                      <div className="h-full bg-[#fafbfc] rounded-xl overflow-hidden flex flex-col items-center justify-center">
                        <div className="relative" style={{ animation: 'breathe 3s ease-in-out infinite' }}>
                          <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0.2s' }}>
                              <rect x="40" y="120" width="16" height="50" rx="4" fill="#E8EBF0"/>
                              <rect x="62" y="100" width="16" height="70" rx="4" fill="#E8EBF0"/>
                              <rect x="84" y="80" width="16" height="90" rx="4" fill="#E8EBF0"/>
                              <rect x="106" y="110" width="16" height="60" rx="4" fill="#E8EBF0"/>
                            </g>
                            <g style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0.4s' }}>
                              <rect x="130" y="55" width="60" height="16" rx="8" fill="#E2E6EC"/>
                              <rect x="130" y="78" width="50" height="8" rx="4" fill="#E8EBF0"/>
                              <rect x="130" y="92" width="55" height="8" rx="4" fill="#E8EBF0"/>
                              <rect x="130" y="106" width="40" height="8" rx="4" fill="#E8EBF0"/>
                              <rect x="130" y="130" width="50" height="20" rx="10" fill="#E8EBF0"/>
                            </g>
                            <g style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0s' }}>
                              <rect x="200" y="45" width="90" height="80" rx="6" fill="#E2E6EC"/>
                              <path d="M200 125 L200 145 Q200 150 205 150 L230 150" stroke="#D8DCE3" strokeWidth="2" fill="none"/>
                            </g>
                            <g style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0.6s' }}>
                              <path d="M250 170 L270 140 L290 170 Z" fill="#E2E6EC"/>
                              <path d="M265 170 L280 150 L295 170 Z" fill="#EBEEF2"/>
                            </g>
                            <rect x="30" y="70" width="12" height="12" rx="2" fill="#FDDCD4" transform="rotate(-15 30 70)" style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0.3s' }}/>
                            <g style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0.5s' }}>
                              <circle cx="150" cy="160" r="5" fill="#A5C4E8"/>
                              <rect x="148" y="160" width="4" height="12" rx="1" fill="#A5C4E8"/>
                            </g>
                            <rect x="295" y="130" width="10" height="10" rx="2" fill="#FDE8B8" transform="rotate(10 295 130)" style={{ animation: 'floatUp 3s ease-in-out infinite', animationDelay: '0.7s' }}/>
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400 mt-6" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                          Building your personalization strategy...
                        </p>
                        <style>
                          {`
                            @keyframes breathe {
                              0%, 100% { transform: scale(1); }
                              50% { transform: scale(1.02); }
                            }
                            @keyframes floatUp {
                              0%, 100% { transform: translateY(0); opacity: 0.9; }
                              50% { transform: translateY(-4px); opacity: 1; }
                            }
                            @keyframes pulse {
                              0%, 100% { opacity: 0.5; }
                              50% { opacity: 1; }
                            }
                          `}
                        </style>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
              <h1 className="text-4xl font-light text-gray-800 mb-12">Make every visit more personal</h1>

              {/* Input box */}
              <div className="w-full max-w-2xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Build a personalization campaign for Black Friday for three core audiences: first-time visitors, returning shoppers, and loyalty members"
                    className="w-full px-5 py-4 text-gray-700 placeholder-gray-400 resize-none focus:outline-none min-h-[80px] rounded-t-2xl"
                    rows={2}
                  />

                  {/* Attached Files */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 py-2">
                      {attachedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                          {file.source === 'image' && file.base64Data ? (
                            <img src={file.base64Data} alt={file.name} className="w-8 h-8 rounded object-cover" />
                          ) : file.source === 'campaign' || file.source === 'brief' ? (
                            <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
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

                  {/* Bottom toolbar */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowAttachmentMenu((v) => !v)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        {showAttachmentMenu && (
                          <AttachmentMenu
                            onUploadFile={() => fileInputRef.current?.click()}
                            onUploadImage={() => imageInputRef.current?.click()}
                            onSelectCampaign={() => setShowCampaignSelector(true)}
                            onClose={() => setShowAttachmentMenu(false)}
                          />
                        )}
                      </div>
                      {/* Tools dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowToolDropdown(!showToolDropdown)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200"
                        >
                          Tools
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showToolDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                            {tools.map((tool) => (
                              <button
                                key={tool.id}
                                onClick={() => {
                                  setSelectedTool(tool.id);
                                  setShowToolDropdown(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                              >
                                <div className={`w-2 h-2 rounded-full ${selectedTool === tool.id ? 'bg-black' : 'bg-transparent'}`} />
                                <span className="text-sm text-gray-700">{tool.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3l18 9-18 9 3-9-3-9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M6 12h9" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestion cards (auto-scroll carousel) */}
              <div
                className="w-full max-w-5xl mt-8"
                onMouseEnter={() => setIsSuggestionsPaused(true)}
                onMouseLeave={() => setIsSuggestionsPaused(false)}
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
                }}
              >
                <div
                  ref={suggestionsScrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollBehavior: 'auto' }}
                >
                  {[...suggestions, ...suggestions].map((suggestion, idx) => (
                    <button
                      key={`${suggestion.text}-${idx}`}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="flex-shrink-0 w-80 p-4 rounded-xl text-left text-sm text-gray-700 backdrop-blur-sm bg-white/10 border border-white/60 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:bg-white/40 hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.06)] transition-all"
                    >
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>
                </>
              )}
            </div>
          ) : (
            /* Chat conversation view */
            <div className="flex-1 flex overflow-hidden p-4">
              <div className="flex-1 flex gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Left side - Chat (30%) */}
              <div className="w-[30%] flex flex-col">
                {/* Chat messages with streaming support */}
                <StreamingChatView
                  messages={messages}
                  streamingSegments={streamingSegments}
                  isStreaming={isStreaming}
                  isWaitingForResponse={isWaitingForResponse}
                />

                {/* Input in chat mode */}
                <div className="p-4">
                  <div className="bg-white rounded-2xl border border-gray-200">
                    {/* Attached Files */}
                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 pt-3">
                        {attachedFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                            {file.source === 'image' && file.base64Data ? (
                              <img src={file.base64Data} alt={file.name} className="w-8 h-8 rounded object-cover" />
                            ) : file.source === 'campaign' || file.source === 'brief' ? (
                              <FolderOpen className="w-3.5 h-3.5 text-purple-500" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
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

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={() => useChatPointerStore.getState().exitSelectionMode()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isWorking) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={isWorking ? "Agent is working..." : "Ask anything"}
                      className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
                      rows={1}
                    />
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setShowAttachmentMenu((v) => !v)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 cursor-pointer transition-colors"
                            title="Attach file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          {showAttachmentMenu && (
                            <AttachmentMenu
                              onUploadFile={() => fileInputRef.current?.click()}
                              onUploadImage={() => imageInputRef.current?.click()}
                              onSelectCampaign={() => setShowCampaignSelector(true)}
                              onClose={() => setShowAttachmentMenu(false)}
                            />
                          )}
                        </div>
                        <PointerButton />
                      </div>
                      {isWorking ? (
                        <button
                          onClick={handleStop}
                          className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800"
                          title="Stop generating"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="1" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={handleSend}
                          disabled={!input.trim() && attachedFiles.length === 0}
                          className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3l18 9-18 9 3-9-3-9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M6 12h9" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Artifact preview (70%) */}
              <div className="flex-1 py-4 pr-4">
              <div className="h-full bg-[#fafbfc] rounded-xl overflow-hidden">
                {isLoadingWizard ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-4 border-gray-200 animate-pulse" />
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-black animate-spin" />
                    </div>
                    <p className="text-sm text-gray-500 animate-pulse">Preparing campaign configuration...</p>
                  </div>
                ) : showConfigWizard ? (
                  <CampaignConfigurationWizard
                    onComplete={handleWizardComplete}
                    onCancel={handleWizardCancel}
                  />
                ) : activeBrief ? (
                  <CampaignBriefEditor onCreateCampaign={handleShowConfigWizard} />
                ) : displayDraft ? (
                  <StrategyPreview campaignDraft={campaignDraft} onCreateCampaign={handleShowConfigWizard} />
                ) : latestAgentResponse ? (
                  <AgentResponsePanel
                    content={latestAgentResponse}
                    onCreateCampaign={handleShowConfigWizard}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div className="mb-6">
                      <svg className="w-48 h-32 mx-auto" viewBox="0 0 200 120" fill="none">
                        <rect x="60" y="20" width="80" height="60" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"/>
                        <rect x="70" y="30" width="60" height="4" rx="2" fill="#94a3b8"/>
                        <rect x="70" y="40" width="40" height="3" rx="1.5" fill="#cbd5e1"/>
                        <rect x="70" y="48" width="50" height="3" rx="1.5" fill="#cbd5e1"/>
                        <rect x="70" y="56" width="35" height="3" rx="1.5" fill="#cbd5e1"/>
                        <rect x="100" y="50" width="60" height="45" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1" transform="rotate(-6 100 50)"/>
                        <rect x="108" y="60" width="35" height="3" rx="1.5" fill="#3b82f6" transform="rotate(-6 108 60)"/>
                        <rect x="108" y="68" width="25" height="2" rx="1" fill="#cbd5e1" transform="rotate(-6 108 68)"/>
                        <circle cx="155" cy="35" r="8" fill="#fcd34d" opacity="0.6"/>
                        <rect x="45" y="70" width="12" height="12" rx="2" fill="#f87171" opacity="0.5" transform="rotate(15 45 70)"/>
                      </svg>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-500 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-sm font-medium">Tips</span>
                    </div>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Your campaign artifacts will appear here as they're created. Continue the conversation to build your personalization strategy.
                    </p>
                  </div>
                )}
              </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Selector Modal */}
      {showCampaignSelector && (
        <CampaignSelector
          onSelect={handleCampaignSelect}
          onClose={() => setShowCampaignSelector(false)}
        />
      )}
    </div>
  );
}
