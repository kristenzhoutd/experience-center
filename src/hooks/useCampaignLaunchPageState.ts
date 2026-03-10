/**
 * Shared hook that extracts ALL stateful logic from CampaignLaunchPage.
 * Consumed by the original page and all navigation variation wrappers.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignLaunchStore } from '../stores/campaignLaunchStore';
import { useBlueprintStore } from '../stores/blueprintStore';
import { useBriefEditorStore } from '../stores/briefEditorStore';
import { useChatStore } from '../stores/chatStore';
import { useTraceStore } from '../stores/traceStore';
import { useProgramStore } from '../stores/programStore';
import { launchConfigStorage } from '../services/launchConfigStorage';
import { chatHistoryStorage } from '../services/chatHistoryStorage';
import { OBJECTIVE_OPTIMIZATION_GOALS } from '../pages/campaignLaunch/constants';
import type { ChannelPlatform } from '../types/program';
import type { CampaignLaunchConfig } from '../types/campaignLaunch';
import type { PlatformTab, LaunchSectionId } from '../pages/campaignLaunch/constants';

export function useCampaignLaunchPageState() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { blueprintId?: string; campaignId?: string; savedConfigId?: string; programId?: string } | null;
  const blueprintId = locationState?.blueprintId;
  const campaignId = locationState?.campaignId;
  const savedConfigIdFromNav = locationState?.savedConfigId;
  const programIdFromNav = locationState?.programId;

  // ── Launch store selectors ────────────────────────────────────────────────
  const config = useCampaignLaunchStore((s) => s.config);
  const progress = useCampaignLaunchStore((s) => s.progress);
  const isInitialized = useCampaignLaunchStore((s) => s.isInitialized);
  const isEditMode = useCampaignLaunchStore((s) => s.isEditMode);
  const isGeneratingConfig = useCampaignLaunchStore((s) => s.isGeneratingConfig);
  const updateCampaign = useCampaignLaunchStore((s) => s.updateCampaign);
  const updateAdSet = useCampaignLaunchStore((s) => s.updateAdSet);
  const addAdSet = useCampaignLaunchStore((s) => s.addAdSet);
  const removeAdSet = useCampaignLaunchStore((s) => s.removeAdSet);
  const updateCreative = useCampaignLaunchStore((s) => s.updateCreative);
  const addCreative = useCampaignLaunchStore((s) => s.addCreative);
  const removeCreative = useCampaignLaunchStore((s) => s.removeCreative);
  const attachFile = useCampaignLaunchStore((s) => s.attachFile);
  const removeFile = useCampaignLaunchStore((s) => s.removeFile);
  const updateAd = useCampaignLaunchStore((s) => s.updateAd);
  const addAd = useCampaignLaunchStore((s) => s.addAd);
  const removeAd = useCampaignLaunchStore((s) => s.removeAd);
  const executeLaunch = useCampaignLaunchStore((s) => s.executeLaunch);
  const executeUpdate = useCampaignLaunchStore((s) => s.executeUpdate);
  const reset = useCampaignLaunchStore((s) => s.reset);
  const saveCurrentConfig = useCampaignLaunchStore((s) => s.saveCurrentConfig);
  const initFromSavedConfig = useCampaignLaunchStore((s) => s.initFromSavedConfig);
  const deleteSavedConfig = useCampaignLaunchStore((s) => s.deleteSavedConfig);
  const savedConfigId = useCampaignLaunchStore((s) => s.savedConfigId);
  const imageGenStatus = useCampaignLaunchStore((s) => s.imageGenStatus);
  const isAutoGeneratingImages = useCampaignLaunchStore((s) => s.isAutoGeneratingImages);

  // ── Chat store selectors ──────────────────────────────────────────────────
  const startSession = useChatStore((s) => s.startSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const storeMessages = useChatStore((s) => s.messages);
  const streamingSegments = useChatStore((s) => s.streamingSegments);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const isWaitingForResponse = useChatStore((s) => s.isWaitingForResponse);

  // ── Local state ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PlatformTab>('meta');
  const [showProgress, setShowProgress] = useState(false);
  const [isApproved, setIsApproved] = useState(isEditMode);
  const isNavigatingAwayRef = useRef(false);

  // Sync isApproved when isEditMode changes
  useEffect(() => {
    if (isEditMode) setIsApproved(true);
  }, [isEditMode]);

  // Program state
  const activeProgram = useProgramStore((s) => s.activeProgram);
  const [activeChannel, setActiveChannel] = useState<ChannelPlatform>('meta');
  const [activeCampaignConfigId, setActiveCampaignConfigId] = useState<string | null>(null);

  // Save state
  const [showSaveToast, setShowSaveToast] = useState(false);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat state — persist collapsed state across stepper navigation
  const [isChatCollapsed, _setIsChatCollapsed] = useState(() => {
    const saved = sessionStorage.getItem('pm-chat-collapsed');
    return saved !== null ? saved === 'true' : !blueprintId;
  });
  const setIsChatCollapsed = (v: boolean | ((prev: boolean) => boolean)) => {
    _setIsChatCollapsed((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      sessionStorage.setItem('pm-chat-collapsed', String(next));
      return next;
    });
  };
  const [chatSessionReady, setChatSessionReady] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoGenTriggeredRef = useRef(false);

  // Init from saved config when navigating with savedConfigId
  const initHandledRef = useRef(false);
  useEffect(() => {
    if (savedConfigIdFromNav && !initHandledRef.current) {
      initHandledRef.current = true;
      initFromSavedConfig(savedConfigIdFromNav);
    }
  }, [savedConfigIdFromNav, initFromSavedConfig]);

  // Init from program when navigating with programId.
  // Always call openProgram to ensure launch config is hydrated — navigating
  // away (e.g. to Ideate) resets the launch store via resetProgramStores().
  const programInitRef = useRef<string | null>(null);
  useEffect(() => {
    if (!programIdFromNav) return;
    if (programInitRef.current === programIdFromNav) return;
    programInitRef.current = programIdFromNav;

    useProgramStore.getState().openProgram(programIdFromNav, { targetStep: 3 }).then((result) => {
      if (!result) return;
      const program = result.program;
      const enabledWithConfigs = program.channels.find((ch) => ch.enabled && ch.launchConfigIds.length > 0);
      if (enabledWithConfigs) {
        setActiveChannel(enabledWithConfigs.platform);
        setActiveCampaignConfigId(enabledWithConfigs.launchConfigIds[0]);
      } else {
        setActiveChannel('meta');
      }
    });
  }, [programIdFromNav]);

  // ---- Initialize chat session ----
  useEffect(() => {
    if (chatSessionReady) return;

    // Preserve messages already loaded by openProgram; only load from
    // storage if the store is empty (e.g. direct navigation without program).
    const currentMessages = useChatStore.getState().messages;
    if (currentMessages.length === 0) {
      const program = useProgramStore.getState().activeProgram;
      const historyKey = program?.chatHistoryKey || (program ? `program-launch:${program.id}` : null);
      const savedMessages = historyKey ? chatHistoryStorage.getMessages(historyKey) : [];
      if (savedMessages.length > 0) {
        useChatStore.getState().loadMessages(savedMessages);
      }
    }

    useChatStore.setState({
      streamingSegments: [],
      isStreaming: false,
      isWaitingForResponse: false,
      pageContext: 'campaign-launch',
    });

    startSession().then(() => {
      setChatSessionReady(true);
    });
    return () => {
      useChatStore.setState({ pageContext: null });
    };
  }, []);

  // ---- Auto-trigger AI generation from blueprint ----
  useEffect(() => {
    if (!chatSessionReady || !blueprintId || autoGenTriggeredRef.current) return;
    if (isInitialized) return;

    autoGenTriggeredRef.current = true;

    const blueprint = useBlueprintStore.getState().blueprints.find((b) => b.id === blueprintId);
    const briefData = useBriefEditorStore.getState().state.briefData;

    if (!blueprint) {
      console.warn('[CampaignLaunch] Blueprint not found:', blueprintId);
      return;
    }

    useCampaignLaunchStore.getState().setGeneratingConfig(true);
    useCampaignLaunchStore.setState({ sourceBlueprintId: blueprintId });

    const blueprintJson = JSON.stringify(blueprint, null, 2);
    const briefJson = JSON.stringify(briefData, null, 2);
    const prompt = `[launch-config-gen] Generate a complete Meta ad configuration from this approved blueprint.\n\n<approved-blueprint>\n${blueprintJson}\n</approved-blueprint>\n\n<campaign-brief>\n${briefJson}\n</campaign-brief>`;

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = useTraceStore.getState();
    trace.startRun(runId, `user-${Date.now()}`);
    trace.addEvent(runId, 'intent', 'Auto-trigger: generate launch config from blueprint');
    trace.addEvent(runId, 'skill_call', 'Sending to Claude Agent SDK');

    sendMessage(prompt, runId).catch((err) => {
      console.error('[CampaignLaunch] Auto-generation failed:', err);
      useCampaignLaunchStore.getState().setGeneratingConfig(false);
    });
  }, [chatSessionReady, blueprintId, isInitialized, sendMessage]);

  // ---- Auto-save chat messages for program ----
  const latestMessagesRef = useRef(storeMessages);
  useEffect(() => { latestMessagesRef.current = storeMessages; }, [storeMessages]);

  useEffect(() => {
    if (storeMessages.length === 0 || isStreaming) return;
    const program = useProgramStore.getState().activeProgram;
    if (!program) return;
    const historyKey = program.chatHistoryKey || `program-launch:${program.id}`;
    const timer = setTimeout(() => {
      chatHistoryStorage.saveMessages(historyKey, storeMessages);
      if (!program.chatHistoryKey) {
        useProgramStore.getState().linkChatSession(program.chatSessionId || '', historyKey);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [storeMessages, isStreaming]);

  // Flush chat messages on unmount
  useEffect(() => {
    return () => {
      const msgs = latestMessagesRef.current;
      if (msgs.length === 0) return;
      const program = useProgramStore.getState().activeProgram;
      if (!program) return;
      const historyKey = program.chatHistoryKey || `program-launch:${program.id}`;
      chatHistoryStorage.saveMessages(historyKey, msgs);
      if (!program.chatHistoryKey) {
        useProgramStore.getState().linkChatSession(program.chatSessionId || '', historyKey);
      }
    };
  }, []);

  // ---- Auto-collapse chat when config is generated ----
  const prevInit = useRef(isInitialized);
  useEffect(() => {
    if (isInitialized && !prevInit.current) {
      // Only auto-collapse if user hasn't explicitly set a preference
      if (sessionStorage.getItem('pm-chat-collapsed') === null) {
        setIsChatCollapsed(true);
      }
    }
    prevInit.current = isInitialized;
  }, [isInitialized]);

  // Debounced auto-save on config changes (2s)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentConfig();
    }, 2000);
  }, [saveCurrentConfig]);

  useEffect(() => {
    if (isInitialized && savedConfigId) {
      debouncedSave();
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [config, isInitialized, savedConfigId, debouncedSave]);

  // Clear validation errors when config changes
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  useEffect(() => {
    setValidationErrors([]);
  }, [config]);

  // Auto-correct ad set optimization goals when the campaign objective changes
  useEffect(() => {
    if (!isInitialized) return;
    const validGoals = OBJECTIVE_OPTIMIZATION_GOALS[config.campaign.objective];
    if (!validGoals) return;
    const validValues = validGoals.map((g) => g.value);
    for (const adSet of config.adSets) {
      if (!validValues.includes(adSet.optimizationGoal)) {
        updateAdSet(adSet.localId, { optimizationGoal: validValues[0] });
      }
    }
  }, [config.campaign.objective, isInitialized]);

  // ---- Chat submit handler ----
  const handleChatSubmit = async () => {
    if (!inputValue.trim()) return;
    if (!chatSessionReady) return;

    const message = inputValue.trim();
    setInputValue('');

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = useTraceStore.getState();
    trace.startRun(runId, `user-${Date.now()}`);
    trace.addEvent(runId, 'intent', 'Launch page chat message');
    trace.addEvent(runId, 'skill_call', 'Sending to Claude Agent SDK');

    try {
      await sendMessage(message, runId);
      const traceRun = useTraceStore.getState().runs[runId];
      if (traceRun && traceRun.status === 'running') {
        trace.completeRun(runId, 'succeeded');
      }
    } catch (err) {
      console.error('[CampaignLaunch] Chat error:', err);
      trace.addEvent(runId, 'error', err instanceof Error ? err.message : 'Send failed', { level: 'error' });
      trace.completeRun(runId, 'failed');
    }
  };

  // ---- Pre-launch validation ----
  const validateConfig = useCallback((): string[] => {
    const errors: string[] = [];

    if (!config.campaign.name.trim()) {
      errors.push('Campaign name is required.');
    }

    if (config.adSets.length === 0) {
      errors.push('At least one ad set is required.');
    }
    for (const adSet of config.adSets) {
      if (!adSet.name.trim()) {
        errors.push(`Ad set "${adSet.audienceLabel}" is missing a name.`);
      }
      if (adSet.dailyBudget < 100) {
        errors.push(`Ad set "${adSet.name || adSet.audienceLabel}" has a budget below $1.00.`);
      }
      const countries = adSet.targeting.geoLocations?.countries || [];
      if (countries.length === 0) {
        errors.push(`Ad set "${adSet.name || adSet.audienceLabel}" has no target countries.`);
      }
    }

    if (config.creatives.length === 0) {
      errors.push('At least one creative is required.');
    }
    for (const creative of config.creatives) {
      if (!creative.file) {
        errors.push(`Creative "${creative.name}" is missing an image. Upload an image before launching.`);
      }
      if (!creative.headline.trim()) {
        errors.push(`Creative "${creative.name}" is missing a headline.`);
      }
      if (!creative.pageId) {
        errors.push(`Creative "${creative.name}" has no Facebook Page selected.`);
      }
    }

    if (config.ads.length === 0) {
      errors.push('At least one ad is required.');
    }
    for (const ad of config.ads) {
      if (!ad.adSetLocalId) {
        errors.push(`Ad "${ad.name}" is not linked to an ad set.`);
      }
      if (!ad.creativeLocalId) {
        errors.push(`Ad "${ad.name}" is not linked to a creative.`);
      }
    }

    return errors;
  }, [config]);

  // ---- Handlers ----
  const handleSave = useCallback(() => {
    saveCurrentConfig();
    setShowSaveToast(true);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setShowSaveToast(false), 3000);
  }, [saveCurrentConfig]);

  const handleApprove = () => {
    setIsApproved(true);
  };

  const handleBack = () => {
    if (isEditMode || campaignId) {
      navigate('/pm-campaigns');
      return;
    }
    if (blueprintId) {
      useBlueprintStore.getState().selectBlueprint(blueprintId);
      useBlueprintStore.getState().setHasGeneratedPlan(true);
      navigate(`/campaign-chat?blueprintId=${blueprintId}`);
    } else {
      navigate(-1);
    }
  };

  const handleLaunch = async () => {
    const errors = validateConfig();
    if (errors.length > 0) {
      setValidationErrors(errors);
      const scrollContainer = document.querySelector('[data-launch-scroll]');
      if (scrollContainer) scrollContainer.scrollTop = 0;
      return;
    }
    setValidationErrors([]);
    setShowProgress(true);
    if (isEditMode) { await executeUpdate(); } else { await executeLaunch(); }
  };

  const handleProgressClose = () => {
    setShowProgress(false);

    if (progress.overallStatus !== 'success') return;

    const createdId = progress.campaignId;
    const program = useProgramStore.getState().activeProgram;

    if (program) {
      if (createdId) {
        useCampaignLaunchStore.setState({ platformCampaignId: createdId, isEditMode: true });
      }
      if (savedConfigId) {
        saveCurrentConfig();
        useProgramStore.getState().addLaunchConfig('meta', savedConfigId);
      }
      useProgramStore.getState().completeStep(3);
      useProgramStore.getState().completeStep(4);
      useProgramStore.getState().updateStatus('launched');
    } else {
      if (savedConfigId) {
        deleteSavedConfig(savedConfigId);
      }
    }

    isNavigatingAwayRef.current = true;
    navigate('/pm-campaigns', { state: { openCampaignId: createdId } });
    reset();
  };

  const handleSelectFile = async (creativeLocalId: string) => {
    try {
      const api = (window as any).aiSuites?.launch;
      if (!api?.selectFile) return;
      const result = await api.selectFile();
      if (result?.success && result.file) {
        attachFile(creativeLocalId, result.file);
      }
    } catch (err) {
      console.error('[CampaignLaunch] File select error:', err);
    }
  };

  // State for expanded image picker modes
  const [imagePickerMode, setImagePickerMode] = useState<{ creativeId: string; mode: 'url' | 'stock' } | null>(null);
  const [stockQuery, setStockQuery] = useState('');
  const [stockResults, setStockResults] = useState<Array<{ id: string; src: string; thumb: string; alt: string; photographer: string }>>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleImageUrl = async (creativeLocalId: string, url: string) => {
    if (!url.trim()) return;
    try {
      const api = (window as any).aiSuites?.launch;
      if (!api?.fetchImage) return;
      const result = await api.fetchImage(url);
      if (result?.success && result.file) {
        attachFile(creativeLocalId, result.file);
        setImagePickerMode(null);
      } else {
        console.error('[CampaignLaunch] Image fetch failed:', result?.error);
      }
    } catch (err) {
      console.error('[CampaignLaunch] Image URL fetch error:', err);
    }
  };

  const handleStockSearch = async (query: string) => {
    if (!query.trim()) return;
    setStockLoading(true);
    try {
      const api = (window as any).aiSuites?.launch;
      if (api?.searchStockPhotos) {
        const result = await api.searchStockPhotos(query);
        if (result?.success && result.photos?.length > 0) {
          setStockResults(result.photos);
        } else {
          setStockResults([]);
        }
      }
    } catch (err) {
      console.error('[CampaignLaunch] Stock search error:', err);
      setStockResults([]);
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockSelect = (creativeLocalId: string, photo: { src: string; alt: string; photographer: string }) => {
    handleImageUrl(creativeLocalId, photo.src);
  };

  // AI image generation state
  const [aiGenerating, setAiGenerating] = useState<Record<string, boolean>>({});
  const [aiGenError, setAiGenError] = useState<Record<string, string>>({});
  const [imageLightbox, setImageLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [aiPromptModal, setAiPromptModal] = useState<{
    creativeLocalId: string;
    content: string;
    style: string;
    aspectRatio: string;
    purpose: string;
    brandGuidelines: string;
    negativePrompt: string;
    imageSize: string;
    quality: string;
    advancedOpen: boolean;
    generatedPreview: { previewUrl: string; fileName: string; fileSize: number } | null;
  } | null>(null);

  const handleAIGenerate = async (creativeLocalId: string, customPrompt?: string) => {
    const creative = config.creatives.find((c) => c.localId === creativeLocalId);
    if (!creative) return;

    const prompt = customPrompt || [
      'Generate a professional advertising image for:',
      creative.headline && `Headline: ${creative.headline}`,
      creative.bodyText && `Description: ${creative.bodyText}`,
      config.campaign.name && `Campaign: ${config.campaign.name}`,
    ].filter(Boolean).join(' ');

    setAiGenerating((prev) => ({ ...prev, [creativeLocalId]: true }));
    setAiGenError((prev) => { const next = { ...prev }; delete next[creativeLocalId]; return next; });

    try {
      const api = (window as any).aiSuites?.launch;
      if (!api?.generateImage) {
        setAiGenError((prev) => ({ ...prev, [creativeLocalId]: 'Image generation API not available.' }));
        return;
      }
      const result = await api.generateImage(prompt);
      if (result?.success && result.file) {
        attachFile(creativeLocalId, result.file);
        setAiPromptModal((prev) => prev ? {
          ...prev,
          generatedPreview: {
            previewUrl: result.file.previewUrl,
            fileName: result.file.fileName,
            fileSize: result.file.fileSize,
          },
        } : null);
      } else {
        setAiGenError((prev) => ({ ...prev, [creativeLocalId]: result?.error || 'Image generation failed.' }));
      }
    } catch (err) {
      console.error('[CampaignLaunch] AI image generation error:', err);
      setAiGenError((prev) => ({ ...prev, [creativeLocalId]: err instanceof Error ? err.message : 'Image generation failed.' }));
    } finally {
      setAiGenerating((prev) => ({ ...prev, [creativeLocalId]: false }));
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const showSkeleton = isGeneratingConfig && !isInitialized;
  const dailyBudgetDollars = (config.campaign.dailyBudget / 100).toFixed(2);
  const specialAdCategory = config.campaign.specialAdCategories.length > 0
    ? config.campaign.specialAdCategories[0]
    : 'NONE';

  // ── Section completion checks ─────────────────────────────────────────────
  const isSectionComplete = useCallback((sectionId: LaunchSectionId): boolean => {
    switch (sectionId) {
      case 'campaign':
        return !!config.campaign.name.trim() && !!config.campaign.objective;
      case 'adSets':
        return config.adSets.length > 0 && config.adSets.every(
          (as) => !!as.name.trim() && as.dailyBudget >= 100 && (as.targeting.geoLocations?.countries?.length ?? 0) > 0
        );
      case 'creatives':
        return config.creatives.length > 0 && config.creatives.every(
          (c) => !!c.file && !!c.headline.trim() && !!c.pageId
        );
      case 'ads':
        return config.ads.length > 0 && config.ads.every(
          (a) => !!a.adSetLocalId && !!a.creativeLocalId
        );
      default:
        return false;
    }
  }, [config]);

  // ── Channel/campaign list helpers ─────────────────────────────────────────
  const handleChannelSelect = (platform: ChannelPlatform) => {
    if (savedConfigId) saveCurrentConfig();
    setActiveChannel(platform);
    setActiveTab(platform);
    const ch = activeProgram?.channels.find((c) => c.platform === platform);
    if (ch && ch.launchConfigIds.length > 0) {
      const firstId = ch.launchConfigIds[0];
      setActiveCampaignConfigId(firstId);
      initFromSavedConfig(firstId);
    } else {
      setActiveCampaignConfigId(null);
    }
  };

  const handleCampaignConfigSelect = (configId: string) => {
    if (savedConfigId) saveCurrentConfig();
    setActiveCampaignConfigId(configId);
    initFromSavedConfig(configId);
  };

  const handleCampaignConfigAdd = () => {
    if (!activeProgram) return;
    const newId = `launch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    launchConfigStorage.saveConfig({
      id: newId,
      name: `New ${activeChannel.charAt(0).toUpperCase() + activeChannel.slice(1)} Campaign`,
      createdAt: now,
      updatedAt: now,
      config: { campaign: { name: '', objective: 'OUTCOME_AWARENESS', dailyBudget: 1000, status: 'PAUSED', specialAdCategories: [], buyingType: 'AUCTION' }, adSets: [], creatives: [], ads: [], facebookPages: [] },
      isEditMode: false,
      programId: activeProgram.id,
      channelPlatform: activeChannel,
    });
    useProgramStore.getState().addLaunchConfig(activeChannel, newId);
    setActiveCampaignConfigId(newId);
    initFromSavedConfig(newId);
  };

  const handleCampaignConfigDelete = (configId: string) => {
    useProgramStore.getState().removeLaunchConfig(activeChannel, configId);
    deleteSavedConfig(configId);
    const ch = useProgramStore.getState().activeProgram?.channels.find((c) => c.platform === activeChannel);
    if (ch && ch.launchConfigIds.length > 0) {
      const nextId = ch.launchConfigIds[0];
      setActiveCampaignConfigId(nextId);
      initFromSavedConfig(nextId);
    } else {
      setActiveCampaignConfigId(null);
      reset();
    }
  };

  return {
    // Navigation
    navigate,
    location,
    locationState,
    blueprintId,
    campaignId,

    // Launch store
    config,
    progress,
    isInitialized,
    isEditMode,
    isGeneratingConfig,
    updateCampaign,
    updateAdSet,
    addAdSet,
    removeAdSet,
    updateCreative,
    addCreative,
    removeCreative,
    attachFile,
    removeFile,
    updateAd,
    addAd,
    removeAd,
    savedConfigId,
    imageGenStatus,
    isAutoGeneratingImages,

    // Chat store
    sendMessage,
    stopStreaming,
    storeMessages,
    streamingSegments,
    isStreaming,
    isWaitingForResponse,

    // UI state
    activeTab,
    setActiveTab,
    showProgress,
    setShowProgress,
    isApproved,
    setIsApproved,
    activeProgram,
    activeChannel,
    setActiveChannel,
    activeCampaignConfigId,
    setActiveCampaignConfigId,
    showSaveToast,
    isChatCollapsed,
    setIsChatCollapsed,
    chatSessionReady,
    inputValue,
    setInputValue,
    textareaRef,
    validationErrors,
    setValidationErrors,

    // Image picker state
    imagePickerMode,
    setImagePickerMode,
    stockQuery,
    setStockQuery,
    stockResults,
    stockLoading,
    urlInput,
    setUrlInput,

    // AI generation state
    aiGenerating,
    aiGenError,
    setAiGenError,
    imageLightbox,
    setImageLightbox,
    aiPromptModal,
    setAiPromptModal,

    // Derived values
    showSkeleton,
    dailyBudgetDollars,
    specialAdCategory,

    // Section completion
    isSectionComplete,

    // Handlers
    handleChatSubmit,
    handleSave,
    handleApprove,
    handleBack,
    handleLaunch,
    handleProgressClose,
    handleSelectFile,
    handleImageUrl,
    handleStockSearch,
    handleStockSelect,
    handleAIGenerate,
    handleChannelSelect,
    handleCampaignConfigSelect,
    handleCampaignConfigAdd,
    handleCampaignConfigDelete,
  };
}

export type CampaignLaunchPageState = ReturnType<typeof useCampaignLaunchPageState>;
