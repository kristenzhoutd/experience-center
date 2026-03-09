/**
 * Chat Store - Zustand store for streaming-aware chat state.
 *
 * Manages the chat session lifecycle via IPC to the Claude Agent SDK:
 * startSession → sendMessage → handleStreamEvent → finalizeStream
 */

import { create } from 'zustand';
import type { ChatMessage, ChatMessageMetadata } from '../types/shared';
import type { ChatStreamEvent, StreamSegment, ToolCall } from '../types/chat';
import { useAppStore } from './appStore';
import type { CampaignDraft } from './appStore';
import { detectSkillOutput, parseCampaignBrief as extractBriefFromSkill, parseBriefUpdate, parseBlueprints } from '../services/skillParsers';
import { extractBriefFromContent } from '../services/briefOutputParser';
import { parseCampaignBrief } from '../services/briefParser';
import { useBriefStore } from './briefStore';
import { useBriefEditorStore } from './briefEditorStore';
import { useBlueprintStore } from './blueprintStore';
import { useAdSetConfigStore } from './adSetConfigStore';
import { useTraceStore } from './traceStore';
import { chatHistoryStorage } from '../services/chatHistoryStorage';
import { getAllGuidelineText } from '../utils/brandGuidelinesStorage';
import { mergeCompanyContext, getCompanyContextText } from '../utils/companyContextStorage';
import { usePageStore } from './pageStore';
import { useCampaignConfigStore } from './campaignConfigStore';
import { useSettingsStore } from './settingsStore';
import { useCompanyContextStore } from './companyContextStore';
import { localBriefStorage } from '../services/briefStorage';
import { campaignConfigStorage } from '../services/campaignConfigStorage';
import type { CampaignSetupData, WizardSegment } from '../types/campaignConfig';
import type { WebAnalysisOutput, SpotRecommendationOutput, ReportOutput, PageDescriptionEntry, ContentAgentOutput, MediaMixOutput, AudienceRecommendationOutput } from '../services/skillParsers';
import type { CampaignAnalysisOutput } from '../types/campaignAnalysis';
import type { CampaignBriefData } from '../types/campaignBriefEditor';
import { useReportStore } from './reportStore';
import { useCampaignLaunchStore } from './campaignLaunchStore';
import { useCampaignAnalysisStore } from './campaignAnalysisStore';
import { useProgramStore } from './programStore';

interface ChatState {
  // Session
  sessionId: string | null;
  sessionActive: boolean;

  // Messages (finalized)
  messages: ChatMessage[];

  // Streaming state
  isStreaming: boolean;
  isWaitingForResponse: boolean;
  streamingSegments: StreamSegment[];
  pendingThinkingStart: boolean;

  // Demo mode
  isDemoMode: boolean;

  // Trace
  activeRunId: string | null;

  // Page-level skill routing context (e.g. 'company-context')
  pageContext: string | null;

  // Suite-level context ('personalization' | 'paid-media')
  activeSuite: 'personalization' | 'paid-media' | null;

  // Actions
  startSession: () => Promise<boolean>;
  sendMessage: (content: string, runId?: string, imageBlocks?: Array<{ mediaType: string; data: string }>) => Promise<void>;
  stopStreaming: () => Promise<void>;
  resetChat: () => void;
  setPageContext: (ctx: string | null) => void;
  setActiveSuite: (suite: 'personalization' | 'paid-media' | null) => void;
  handleStreamEvent: (event: ChatStreamEvent) => void;
  addSystemMessage: (content: string) => void;
  loadMessages: (messages: ChatMessage[]) => void;

  // Internal streaming actions
  appendStreamContent: (content: string) => void;
  appendThinkingContent: (content: string) => void;
  startNewThinkingBlock: () => void;
  addToolCall: (toolCall: { name: string; arguments: Record<string, unknown>; toolUseId?: string }) => void;
  updateToolCallResult: (toolUseId: string, result: string, isError?: boolean) => void;
  finalizeStream: () => void;
  setWaitingForResponse: (waiting: boolean) => void;
  updateMessageMetadata: (messageId: string, updates: Partial<ChatMessageMetadata>) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  sessionActive: false,
  messages: [],
  isStreaming: false,
  isWaitingForResponse: false,
  streamingSegments: [],
  pendingThinkingStart: false,
  isDemoMode: false,
  activeRunId: null,
  pageContext: null,
  activeSuite: null,

  setPageContext: (ctx: string | null) => {
    set({ pageContext: ctx });
  },

  setActiveSuite: (suite: 'personalization' | 'paid-media' | null) => {
    set({ activeSuite: suite });
  },

  startSession: async () => {
    const api = window.aiSuites?.chat;
    if (!api?.startSession) {
      console.warn('[ChatStore] Chat API not available, using demo mode');
      set({ isDemoMode: true });
      return false;
    }

    try {
      const result = await api.startSession();
      if (result.success && result.sessionId) {
        set({ sessionId: result.sessionId, sessionActive: true, isDemoMode: false });

        // Unsubscribe any existing listener before creating a new one
        const existingUnsub = (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub;
        if (existingUnsub) {
          existingUnsub();
          (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub = undefined;
        }

        // Subscribe to stream events
        const unsubscribe = api.onStream((event: ChatStreamEvent) => {
          get().handleStreamEvent(event);
        });

        // Store unsubscribe for cleanup
        (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub = unsubscribe;

        return true;
      } else {
        console.error('[ChatStore] Failed to start session:', result.error);
        set({ isDemoMode: true });
        return false;
      }
    } catch (error) {
      console.error('[ChatStore] Error starting session:', error);
      set({ isDemoMode: true });
      return false;
    }
  },

  sendMessage: async (content: string, runId?: string, imageBlocks?: Array<{ mediaType: string; data: string }>) => {
    // Re-read state fresh to catch isDemoMode set by startSession
    const isDemoMode = get().isDemoMode;

    // Store the active run ID for trace events in finalizeStream
    if (runId) {
      set({ activeRunId: runId });
    }

    // Page-level skill routing: when pageContext is set, the page has declared
    // what skill family every message belongs to, so we route accordingly.
    const { pageContext } = get();
    const isCompanyContextPage = pageContext === 'company-context';

    // [brief-edit] and [blueprint-gen] messages already include the full brief
    // as <campaign-brief> context. Skip all context enrichment to avoid a
    // context avalanche that confuses the LLM on saved/loaded briefs.
    const isBriefEdit = content.startsWith('[brief-edit]') || content.startsWith('[blueprint-gen]');

    // Auto-inject brand guidelines for brand compliance and campaign brief requests
    let enrichedContent = content;
    if (!isBriefEdit && (isBrandComplianceRequest(content) || isCampaignBriefRequest(content) || isCopywriterRequest(content))) {
      const guidelineText = getAllGuidelineText();
      if (guidelineText) {
        enrichedContent = `<brand-guidelines>\n${guidelineText}\n</brand-guidelines>\n\n${content}`;
      }
    }

    // Auto-inject company context for campaign-brief, brand-compliance, copywriter, company-context, and spot-recommendation requests
    // When on the company-context page, always inject existing context
    if (!isBriefEdit && (isCompanyContextPage || isCampaignBriefRequest(content) || isBrandComplianceRequest(content) || isCopywriterRequest(content) || isCompanyContextRequest(content) || isSpotRecommendationRequest(content))) {
      const contextText = getCompanyContextText();
      if (contextText) {
        enrichedContent = `<company-context>\n${contextText}\n</company-context>\n\n${enrichedContent}`;
      }
    }

    // Auto-inject campaign config for campaign analysis requests
    if (isCampaignAnalysisRequest(content)) {
      const configStore = useCampaignConfigStore.getState();
      if (configStore.config) {
        const cfg = configStore.config;
        const configSummary = {
          name: cfg.setup.name,
          objective: cfg.setup.objective,
          goalType: cfg.setup.goalType,
          primaryKpi: cfg.setup.primaryKpi,
          dates: { start: cfg.setup.startDate, end: cfg.setup.endDate },
          audiences: cfg.audiences.segments.map((s) => s.name),
          pages: cfg.content.pages.map((p) => ({
            pageId: p.pageId,
            pageName: p.pageName,
            spots: p.spots.map((s) => ({
              spotId: s.spotId,
              spotName: s.spotName,
              spotType: s.spotType,
              variants: s.variants.map((v) => v.audienceName || 'Default'),
            })),
          })),
        };
        enrichedContent = `<campaign-config>\n${JSON.stringify(configSummary, null, 2)}\n</campaign-config>\n\n${enrichedContent}`;
      }
      useCampaignAnalysisStore.getState().setAnalyzing(true);
    }

    // Auto-inject web extraction data when a URL is detected with web analysis intent
    if (isWebAnalysisRequest(content)) {
      const urlMatch = content.match(/https?:\/\/[^\s]+/i) || content.match(/(?:www\.)[^\s]+/i);
      if (urlMatch && window.aiSuites?.web?.extract) {
        try {
          const extractUrl = urlMatch[0];
          const result = await window.aiSuites.web.extract(extractUrl);
          if (result.success && result.data) {
            enrichedContent = `<web-extraction>\n${JSON.stringify(result.data, null, 2)}\n</web-extraction>\n\n${enrichedContent}`;
          }
        } catch (err) {
          console.warn('[ChatStore] Web extraction failed, proceeding without extraction data:', err);
        }
      }
    }

    // Auto-inject website text for company context from URL requests.
    // When on the company-context page, any message with a URL triggers extraction.
    // Detect both full URLs (https://...) and bare domains (example.com, www.example.com)
    const extractedUrl = extractUrlFromContent(content);
    let websiteExtractionFailed = false;
    if (isCompanyContextFromUrlRequest(content) || (isCompanyContextPage && extractedUrl)) {
      if (extractedUrl && window.aiSuites?.web?.extractText) {
        try {
          const result = await window.aiSuites.web.extractText(extractedUrl);
          if (result.success && result.data) {
            enrichedContent = `<website-content>\n${JSON.stringify(result.data, null, 2)}\n</website-content>\n\n${enrichedContent}`;
          } else {
            websiteExtractionFailed = true;
            console.warn('[ChatStore] Website text extraction returned no data for:', extractedUrl);
          }
        } catch (err) {
          websiteExtractionFailed = true;
          console.warn('[ChatStore] Website text extraction failed:', err);
        }
      } else if (extractedUrl && !window.aiSuites?.web?.extractText) {
        websiteExtractionFailed = true;
        console.warn('[ChatStore] web.extractText API not available');
      }

      // If extraction failed on the company-context page, notify the user and abort
      if (websiteExtractionFailed && isCompanyContextPage) {
        useCompanyContextStore.getState().setGenerating(false);
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `I couldn't extract content from **${extractedUrl}**. The website may be blocking automated access, or the URL may be incorrect.\n\nPlease try:\n- Copying the website's content and pasting it directly into this chat\n- Using the full URL with https:// (e.g. https://treasuredata.com)\n- Describing your company manually instead`,
          timestamp: new Date(),
        };
        set((s) => ({
          messages: [...s.messages, errMsg],
          isStreaming: false,
          isWaitingForResponse: false,
        }));
        return;
      }
    }

    // When on the company-context page, prepend a routing instruction so the AI
    // always uses the company-context skill regardless of how the user phrases it.
    if (isCompanyContextPage) {
      enrichedContent = `[page-context:company-context] The user is on the Company Context builder page. Use the company-context skill for this request. If the user provides a URL, follow the URL-Based Context Building protocol and use WebSearch and WebFetch to research the company thoroughly. If they describe their company, build or update the company context accordingly. Always emit a company-context-json or company-context-update-json code fence. IMPORTANT: Only include facts you can verify from the website content or web research. Never fabricate company details.\n\n${enrichedContent}`;
    }

    // Element-reference routing: when the user has selected specific fields via
    // the chat pointer, scope the AI to update only those fields.
    const hasElementReferences = enrichedContent.includes('<element-references');
    if (hasElementReferences) {
      // Domain is on each <ref> element, not on the wrapper
      const domainMatch = enrichedContent.match(/domain="([^"]+)"/);
      const domain = domainMatch?.[1] || '';

      // Extract selected field labels for the scope instruction
      const fieldMatches = [...enrichedContent.matchAll(/label="([^"]+)"/g)];
      const fieldNames = fieldMatches.map((m) => m[1]);
      const scopeInstruction = fieldNames.length > 0
        ? `IMPORTANT: The user has selected specific field(s) via the pointer: ${fieldNames.join(', ')}. Only update these field(s). Do NOT modify any other fields.`
        : 'IMPORTANT: The user has selected specific field(s) via the pointer. Only update the referenced fields.';

      if (domain === 'brief-editor') {
        // Inject brief-update routing with current brief data and exact output format
        const currentBriefSections = useBriefStore.getState().activeBrief?.sections;
        const briefContext = currentBriefSections ? JSON.stringify(currentBriefSections, null, 2) : '{}';
        enrichedContent = `[page-context:brief-update] The user is editing an existing campaign brief via the pointer. Update ONLY the specified field(s) and emit the result as a brief-update-json code fence. ${scopeInstruction}

The brief uses this structure: { "overview": { "campaignName", "objective", "businessGoal", "timelineStart", "timelineEnd" }, "audience": { "primaryAudience", "segments", "recommendedAudiences" }, "experience": { "headline", "bodyMessage", "ctaText", "segmentMessages", "spotCreatives" }, "measurement": { "primaryKpi", "secondaryKpis", "secondaryMetrics", "successCriteria", "risks" } }

You MUST wrap your JSON output in a brief-update-json code fence like this:
\`\`\`brief-update-json
{ "measurement": { "primaryKpi": "new value" } }
\`\`\`

Include ONLY the section and field(s) being changed. Do NOT include unchanged fields.

<current-brief>
${briefContext}
</current-brief>

${enrichedContent}`;
      } else {
        // For campaign-setup, audiences, content — prepend scope instruction only;
        // the existing page-context routing below handles context injection.
        enrichedContent = `${scopeInstruction}\n\n${enrichedContent}`;
      }
    }

    // When on the campaign setup page (wizard Step 1), inject current field values
    // and route to the campaign-setup skill.
    const isCampaignSetupPage = pageContext === 'campaign-setup';
    if (isCampaignSetupPage) {
      const configStore = useCampaignConfigStore.getState();
      if (configStore.config) {
        const setup = configStore.config.setup;
        enrichedContent = `[page-context:campaign-setup] The user is on the Campaign Setup page (Step 1 of the wizard). Use the campaign-setup skill for this request. If the user's intent is unclear or could affect multiple fields ambiguously, ask for clarification before making changes. Always emit a campaign-setup-json code fence with only the fields that should change.\n\n<current-setup>\n${JSON.stringify(setup, null, 2)}\n</current-setup>\n\n${enrichedContent}`;
      }
    }

    // When on the content editor page (wizard Step 3), inject content state
    // and route to the content-agent skill.
    const isContentEditorPage = pageContext === 'content-editor';
    if (isContentEditorPage) {
      const configStore = useCampaignConfigStore.getState();
      if (configStore.config) {
        const cfg = configStore.config;
        const { activeEditorPageId, activeEditorSpotId, activeEditorVariantId } = configStore;

        // Build active-context: the currently selected page/spot/variant with content
        let activeContext: Record<string, unknown> = {};
        if (activeEditorPageId) {
          const activePage = cfg.content.pages.find((p) => p.pageId === activeEditorPageId);
          if (activePage) {
            const activeSpot = activeEditorSpotId
              ? activePage.spots.find((s) => s.spotId === activeEditorSpotId)
              : activePage.spots[0];
            if (activeSpot) {
              let variantContent;
              if (activeEditorVariantId === 'default') {
                variantContent = {
                  headline: activeSpot.defaultVariant.headline,
                  body: activeSpot.defaultVariant.body,
                  ctaText: activeSpot.defaultVariant.ctaText,
                  imageUrl: activeSpot.defaultVariant.imageUrl,
                  deepLinkUrl: activeSpot.defaultVariant.deepLinkUrl,
                };
              } else {
                const v = activeSpot.variants.find((va) => va.variantId === activeEditorVariantId);
                if (v) {
                  variantContent = {
                    headline: v.content.headline,
                    body: v.content.body,
                    ctaText: v.content.ctaText,
                    imageUrl: v.content.imageUrl,
                    deepLinkUrl: v.content.deepLinkUrl,
                  };
                }
              }
              activeContext = {
                pageId: activePage.pageId,
                pageName: activePage.pageName,
                spotId: activeSpot.spotId,
                spotName: activeSpot.spotName,
                spotType: activeSpot.spotType,
                variantId: activeEditorVariantId,
                content: variantContent || {},
              };
            }
          }
        }

        // Build all-content: all pages/spots/variants (text fields only, no GJS data)
        const allContent = cfg.content.pages.map((page) => ({
          pageId: page.pageId,
          pageName: page.pageName,
          spots: page.spots.map((spot) => ({
            spotId: spot.spotId,
            spotName: spot.spotName,
            spotType: spot.spotType,
            defaultVariant: {
              headline: spot.defaultVariant.headline,
              body: spot.defaultVariant.body,
              ctaText: spot.defaultVariant.ctaText,
              imageUrl: spot.defaultVariant.imageUrl,
              deepLinkUrl: spot.defaultVariant.deepLinkUrl,
            },
            variants: spot.variants.map((v) => ({
              variantId: v.variantId,
              audienceName: v.audienceName,
              audienceRefId: v.audienceRefId,
              content: {
                headline: v.content.headline,
                body: v.content.body,
                ctaText: v.content.ctaText,
                imageUrl: v.content.imageUrl,
                deepLinkUrl: v.content.deepLinkUrl,
              },
            })),
          })),
        }));

        // Campaign context for brand alignment
        const campaignContext = {
          name: cfg.setup.name,
          objective: cfg.setup.objective,
          businessGoal: cfg.setup.businessGoal,
        };

        // Available segments from Step 2
        const availableSegments = cfg.audiences.segments
          .filter((s) => s.isSelected)
          .map((s) => ({ id: s.id, name: s.name }));

        enrichedContent = `[page-context:content-editor] The user is on the Content Editor page (Step 3 of the wizard). Use the content-agent skill for this request. If the user asks something unrelated to content editing, politely decline and explain what you can help with. Always emit a content-agent-json code fence when making changes.\n\n<active-context>\n${JSON.stringify(activeContext, null, 2)}\n</active-context>\n\n<all-content>\n${JSON.stringify(allContent, null, 2)}\n</all-content>\n\n<campaign-context>\n${JSON.stringify(campaignContext, null, 2)}\n</campaign-context>\n\n<available-segments>\n${JSON.stringify(availableSegments, null, 2)}\n</available-segments>\n\n${enrichedContent}`;
      }

      // Inject brand guidelines for content-editor too
      const guidelineText = getAllGuidelineText();
      if (guidelineText) {
        enrichedContent = `<brand-guidelines>\n${guidelineText}\n</brand-guidelines>\n\n${enrichedContent}`;
      }

      // Inject company context for content-editor too
      const contextText = getCompanyContextText();
      if (contextText) {
        enrichedContent = `<company-context>\n${contextText}\n</company-context>\n\n${enrichedContent}`;
      }
    }

    // When on the audience selection page (wizard Step 2), inject current segments
    // and route to the audience-selection skill.
    const isAudienceSelectionPage = pageContext === 'audience-selection';
    if (isAudienceSelectionPage) {
      const configStore = useCampaignConfigStore.getState();
      if (configStore.config) {
        const audiences = configStore.config.audiences;
        const setup = configStore.config.setup;
        const selectedSegments = audiences.segments.filter((s) => s.isSelected);
        const availableChildSegments = configStore.childSegments;

        // Build campaign setup context for AI recommendations
        const campaignSetup = {
          name: setup.name,
          objective: setup.objective,
          businessGoal: setup.businessGoal,
          goalType: setup.goalType,
          primaryKpi: setup.primaryKpi,
          secondaryKpis: setup.secondaryKpis,
          startDate: setup.startDate,
          endDate: setup.endDate,
        };

        enrichedContent = `[page-context:audience-selection] The user is on the Audience Selection page (Step 2 of the wizard). Use the audience-selection skill for this request. Recommend existing TDX segments that match the campaign goals, and only suggest new segments when no existing match is found. Always emit an audience-selection-json code fence with the recommended segments.\n\n<campaign-setup>\n${JSON.stringify(campaignSetup, null, 2)}\n</campaign-setup>\n\n<current-selected-segments>\n${JSON.stringify(selectedSegments, null, 2)}\n</current-selected-segments>\n\n<available-tdx-segments>\n${JSON.stringify(availableChildSegments, null, 2)}\n</available-tdx-segments>\n\n<parent-segment-id>\n${audiences.parentSegmentId || 'None selected'}\n</parent-segment-id>\n\n${enrichedContent}`;
      }
    }

    // When on the campaign launch page, inject current config for refine-ad-config skill
    const isLaunchPage = pageContext === 'campaign-launch';
    if (isLaunchPage) {
      const launchStore = useCampaignLaunchStore.getState();
      if (launchStore.isInitialized) {
        const { campaign, adSets, creatives, ads } = launchStore.config;
        const configSnapshot = { campaign, adSets, creatives, ads };
        enrichedContent = `[page-context:campaign-launch] The user is on the Campaign Launch page. They have an existing launch configuration. Use the refine-ad-config skill to modify it. Always emit a launch-config-update-json code fence with only the changed fields.\n\n<current-launch-config>\n${JSON.stringify(configSnapshot, null, 2)}\n</current-launch-config>\n\n${enrichedContent}`;
      }
    }

    // Auto-inject existing audiences for campaign brief requests
    if (!isBriefEdit && isCampaignBriefRequest(content)) {
      const seen = new Set<string>();
      const existingAudiences: Array<{ name: string; source: string }> = [];

      // 1. TDX child segments (from campaign config store)
      const { childSegments } = useCampaignConfigStore.getState();
      for (const seg of childSegments) {
        const key = seg.name.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          existingAudiences.push({ name: seg.name, source: 'tdx' });
        }
      }

      // 2. Segments from saved briefs
      const briefs = localBriefStorage.listBriefs();
      for (const brief of briefs) {
        const recommended = brief.sections?.audience?.recommendedAudiences;
        if (!Array.isArray(recommended)) continue;
        for (const ra of recommended) {
          if (!ra.isSelected) continue;
          const key = ra.name.trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            existingAudiences.push({ name: ra.name, source: ra.status === 'new' ? 'brief' : 'tdx' });
          }
        }
      }

      // 3. Segments from saved campaign configs
      const configs = campaignConfigStorage.listConfigs();
      for (const config of configs) {
        const segments = config.audiences?.segments;
        if (!Array.isArray(segments)) continue;
        for (const seg of segments) {
          if (!seg.isSelected) continue;
          const key = seg.name.trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            existingAudiences.push({ name: seg.name, source: seg.source });
          }
        }
      }

      if (existingAudiences.length > 0) {
        enrichedContent = `<existing-audiences>\n${JSON.stringify(existingAudiences, null, 2)}\n</existing-audiences>\n\n${enrichedContent}`;
      }

      // Inject TD child segments with IDs so the AI can reference real segments
      const settingsState = useSettingsStore.getState();
      const parentId = settingsState.selectedParentSegmentId;
      const tdChildSegments = useCampaignConfigStore.getState().childSegments;

      // Only use already-loaded segments — kick off a background fetch for next time
      if (parentId && tdChildSegments.length === 0) {
        useCampaignConfigStore.getState().fetchChildSegments(parentId).catch(() => {});
      }

      if (tdChildSegments.length > 0) {
        enrichedContent = `<available-td-segments parent-segment-id="${parentId || ''}">\n${JSON.stringify(tdChildSegments, null, 2)}\n</available-td-segments>\n\n${enrichedContent}`;
      }
    }

    // Auto-inject available pages for campaign brief, spot recommendation, and page description requests
    if (!isBriefEdit && (isCampaignBriefRequest(content) || isSpotRecommendationRequest(content) || isPageDescriptionRequest(content))) {
      const pages = usePageStore.getState().pages;
      if (pages.length > 0) {
        const pagesContext = pages.map((p) => ({
          id: p.id,
          websiteUrl: p.websiteUrl,
          pageName: p.pageName,
          description: p.description,
          spots: p.spots,
        }));
        enrichedContent = `<available-pages>\n${JSON.stringify(pagesContext, null, 2)}\n</available-pages>\n\n${enrichedContent}`;
      }
    }

    // Auto-inject campaign brief and selected segments for spot recommendation requests
    if (isSpotRecommendationRequest(content)) {

      const briefData = useBriefStore.getState();
      if (briefData.activeBriefId) {
        enrichedContent = `<campaign-brief>\n${JSON.stringify(briefData, null, 2)}\n</campaign-brief>\n\n${enrichedContent}`;
      }

      const configState = useCampaignConfigStore.getState();
      if (configState.config?.audiences?.segments) {
        const selectedSegments = configState.config.audiences.segments
          .filter((s) => s.isSelected)
          .map((s) => ({ id: s.id, name: s.name }));
        if (selectedSegments.length > 0) {
          enrichedContent = `<selected-segments>\n${JSON.stringify(selectedSegments, null, 2)}\n</selected-segments>\n\n${enrichedContent}`;
        }
      }
    }

    // Suite-level skill routing: restrict skills to the active suite
    const { activeSuite } = get();
    if (activeSuite === 'personalization') {
      enrichedContent = `[suite:personalization] You are in the Personalization Suite. Only use Personalization Skills. Do NOT use any Paid Media Skills (generate-campaign-brief, refine-campaign-brief, extract-brief-from-pdf, generate-blueprints, refine-blueprint, fetch-td-segments, recommend-audience-segments, recommend-budget-allocation, recommend-media-mix, generate-report). If the user asks about paid media topics, let them know they should switch to the Paid Media suite.\n\n${enrichedContent}`;
    } else if (activeSuite === 'paid-media') {
      enrichedContent = `[suite:paid-media] You are in the Paid Media Suite. Only use Paid Media Skills. Do NOT use any Personalization Skills (campaign-brief, campaign-setup, audience-selection, content-creation, content-agent, campaign-review, brand-compliance, company-context, web-analysis, spot-recommendation, page-description). If the user asks about web personalization topics, let them know they should switch to the Personalization suite.\n\n${enrichedContent}`;
    }

    // Add user message to display (strip element-references XML so chat shows clean text)
    const displayContent = content.replace(/<element-references[\s\S]*?<\/element-references>\s*/g, '').trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: displayContent || content,
      timestamp: new Date(),
      metadata: runId ? { runId } : undefined,
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // Always generate a structured campaign draft from the user's message
    // so the wizard Step 1 is pre-populated regardless of demo/SDK mode
    const { draft } = generateCampaignDraft(content);
    useAppStore.getState().setCampaignDraft(draft);

    // Ad set config generation is always programmatic (works in both demo and SDK mode)
    const isAdSetConfigRequest = /generate\s+ad\s*(set|group)\s+config|adset-config-json|ad\s*group\s+configuration/i.test(content);

    if (isAdSetConfigRequest) {
      console.log('[ChatStore] Generating ad set configs (programmatic)');
      set({ isStreaming: true, isWaitingForResponse: true });

      const campaignNameMatch = content.match(/Campaign\s+Name:\s*(.+)/i);
      const campaignName = campaignNameMatch?.[1]?.trim() || 'Campaign';
      const budgetMatch = content.match(/Budget:\s*\$?([\d,]+)/i);
      const budget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : 50;

      const adSetThinkingSteps = [
        'Analyzing campaign objective & structure...',
        'Evaluating audience targeting options...',
        'Modeling budget allocation strategies...',
        'Computing reach and performance projections...',
        'Generating conservative variant...',
        'Generating balanced variant...',
        'Generating aggressive variant...',
      ];

      let stepIdx = 0;
      const runStep = () => {
        if (stepIdx >= adSetThinkingSteps.length) {
          const now = new Date().toISOString();
          const generatedConfigs = [
            {
              id: `adset-conservative-${Date.now()}`,
              name: `${campaignName} — Conservative`,
              variant: 'conservative' as const,
              confidence: 'High' as const,
              dailyBudget: Math.max(10, Math.round(budget * 0.4)),
              optimizationGoal: 'OFFSITE_CONVERSIONS',
              billingEvent: 'IMPRESSIONS',
              targeting: { countries: ['US'], ageMin: 25, ageMax: 54 },
              status: 'PAUSED',
              rationale: 'Narrow targeting focused on the highest-converting age demographic in the US. Lower budget minimizes risk while gathering performance data.',
              estimatedMetrics: {
                dailyReach: `${Math.round(budget * 80).toLocaleString()}`,
                estimatedCtr: '1.6%',
                estimatedCpa: `$${Math.round(budget * 0.8)}`,
                estimatedConversions: `${Math.max(5, Math.round(budget * 0.5))}`,
              },
              createdAt: now,
            },
            {
              id: `adset-balanced-${Date.now()}`,
              name: `${campaignName} — Balanced`,
              variant: 'balanced' as const,
              confidence: 'Medium' as const,
              dailyBudget: Math.max(15, Math.round(budget * 0.6)),
              optimizationGoal: 'OFFSITE_CONVERSIONS',
              billingEvent: 'IMPRESSIONS',
              targeting: { countries: ['US', 'CA'], ageMin: 18, ageMax: 65 },
              status: 'PAUSED',
              rationale: 'Broad targeting across US and Canada with standard age range. Moderate budget balances reach with cost efficiency.',
              estimatedMetrics: {
                dailyReach: `${Math.round(budget * 200).toLocaleString()}`,
                estimatedCtr: '2.1%',
                estimatedCpa: `$${Math.round(budget * 0.6)}`,
                estimatedConversions: `${Math.max(10, Math.round(budget * 1.0))}`,
              },
              createdAt: now,
            },
            {
              id: `adset-aggressive-${Date.now()}`,
              name: `${campaignName} — Aggressive`,
              variant: 'aggressive' as const,
              confidence: 'Low' as const,
              dailyBudget: Math.max(20, Math.round(budget * 0.9)),
              optimizationGoal: 'REACH',
              billingEvent: 'IMPRESSIONS',
              targeting: { countries: ['US', 'CA', 'GB', 'AU'], ageMin: 18, ageMax: 65 },
              status: 'PAUSED',
              rationale: 'Multi-country targeting for maximum reach. Higher budget with reach optimization to build top-of-funnel awareness aggressively.',
              estimatedMetrics: {
                dailyReach: `${Math.round(budget * 500).toLocaleString()}`,
                estimatedCtr: '2.8%',
                estimatedCpa: `$${Math.round(budget * 0.45)}`,
                estimatedConversions: `${Math.max(20, Math.round(budget * 2.0))}`,
              },
              createdAt: now,
            },
          ];

          useAdSetConfigStore.getState().addConfigs(generatedConfigs);
          useBriefEditorStore.getState().setWorkflowState('editing');

          const state = get();
          const finalSegments = state.streamingSegments.filter(
            (s) => s.type === 'thinking' || s.type === 'tool_call'
          );
          const metadata: Record<string, unknown> = {};
          if (finalSegments.length > 0) metadata.segments = finalSegments;
          if (state.activeRunId) metadata.runId = state.activeRunId;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I've generated 3 ad group configuration variants for "${campaignName}":\n\n1. **Conservative** — Narrow targeting, lower budget (High confidence)\n2. **Balanced** — Broad targeting, moderate budget (Medium confidence)\n3. **Aggressive** — Multi-country, max reach (Low confidence)\n\nReview the configurations on the right panel. Select a variant, adjust settings, then click "Approve & Create" to create the ad set via Meta API.`,
            timestamp: new Date(),
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          };
          set((s) => ({
            messages: [...s.messages, aiMsg],
            isStreaming: false,
            isWaitingForResponse: false,
            streamingSegments: [],
            pendingThinkingStart: false,
            activeRunId: null,
          }));
          return;
        }

        const step = adSetThinkingSteps[stepIdx];
        set((state) => {
          const segments = [...state.streamingSegments];
          const last = segments[segments.length - 1];
          if (last && last.type === 'thinking') {
            segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
          } else {
            segments.push({ type: 'thinking', content: step });
          }
          return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
        });

        stepIdx++;
        setTimeout(runStep, 400);
      };

      setTimeout(runStep, 400);
      return;
    }

    if (isDemoMode) {
      // Company context requests require the AI SDK to produce real output.
      // In demo mode we cannot generate meaningful company context, so show an error.
      if (isCompanyContextPage || isCompanyContextRequest(content) || isCompanyContextFromUrlRequest(content)) {
        console.log('[ChatStore] Demo mode: company context requires SDK — showing error');
        useCompanyContextStore.getState().setGenerating(false);
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'I couldn\'t build the company context because the AI service is not connected. Please configure a valid API key in **Settings** and try again.',
          timestamp: new Date(),
        };
        set((s) => ({
          messages: [...s.messages, errMsg],
          isStreaming: false,
          isWaitingForResponse: false,
        }));
        return;
      }

      // Detect if this is a blueprint generation request
      const isBlueprintRequest = /generate\s+blueprint|generate\s+plan|blueprint\s+variant/i.test(content);

      if (isBlueprintRequest) {
        // Demo mode: generate demo blueprints
        console.log('[ChatStore] Demo mode: generating demo blueprints');
        set({ isStreaming: true, isWaitingForResponse: true });

        // Extract brief details from the message for realistic blueprints
        const campaignMatch = content.match(/Campaign:\s*(.+)/i);
        const budgetMatch = content.match(/Budget:\s*\$?([\d,]+)/i);
        const channelsMatch = content.match(/(?:Mandatory\s+)?Channels?:\s*(.+)/i);
        const audienceMatch = content.match(/(?:Primary\s+)?Audience:\s*(.+)/i);

        const campaignName = campaignMatch?.[1]?.trim() || 'Campaign';
        const budgetStr = budgetMatch?.[1]?.replace(/,/g, '') || '100000';
        const budget = parseInt(budgetStr, 10);
        const channels = channelsMatch?.[1]?.split(/,\s*/).map(c => c.trim()).filter(Boolean) || ['Meta Ads', 'Google Ads', 'Email'];
        const audiences = audienceMatch?.[1]?.split(/,\s*/).map(a => a.trim()).filter(Boolean) || ['New Visitors', 'Returning Customers'];

        const blueprintThinkingSteps = [
          'Analyzing campaign brief and objectives...',
          `Evaluating channel mix: ${channels.join(', ')}`,
          `Modeling budget allocation across $${budget.toLocaleString()} budget...`,
          'Computing reach and performance projections...',
          'Generating conservative variant...',
          'Generating balanced variant...',
          'Generating aggressive variant...',
          'Blueprints ready — review the three variants on the right.',
        ];

        let stepIdx = 0;
        const runStep = () => {
          if (stepIdx >= blueprintThinkingSteps.length) {
            // Generate 3 demo blueprint variants
            const demoBlueprints = [
              {
                id: `bp-conservative-${Date.now()}`,
                name: `${campaignName} — Conservative`,
                variant: 'conservative' as const,
                confidence: 'High' as const,
                channels,
                audiences,
                budget: { amount: `$${Math.round(budget * 0.8).toLocaleString()}`, pacing: 'Even' },
                metrics: {
                  reach: `${Math.round(budget / 5).toLocaleString()}`,
                  ctr: '1.8%',
                  roas: '3.2x',
                  conversions: `${Math.round(budget / 50).toLocaleString()}`,
                },
                messaging: 'Focus on proven messaging with minimal risk. Emphasize brand trust and value proposition.',
                cta: 'Learn More',
                createdAt: new Date().toISOString(),
              },
              {
                id: `bp-balanced-${Date.now()}`,
                name: `${campaignName} — Balanced`,
                variant: 'balanced' as const,
                confidence: 'Medium' as const,
                channels,
                audiences,
                budget: { amount: `$${budget.toLocaleString()}`, pacing: 'Front-loaded' },
                metrics: {
                  reach: `${Math.round(budget / 3).toLocaleString()}`,
                  ctr: '2.4%',
                  roas: '4.1x',
                  conversions: `${Math.round(budget / 35).toLocaleString()}`,
                },
                messaging: 'Balanced approach mixing proven tactics with new creative angles. Test and optimize.',
                cta: 'Shop Now',
                createdAt: new Date().toISOString(),
              },
              {
                id: `bp-aggressive-${Date.now()}`,
                name: `${campaignName} — Aggressive`,
                variant: 'aggressive' as const,
                confidence: 'Low' as const,
                channels,
                audiences,
                budget: { amount: `$${Math.round(budget * 1.2).toLocaleString()}`, pacing: 'Front-loaded' },
                metrics: {
                  reach: `${Math.round(budget / 2).toLocaleString()}`,
                  ctr: '3.1%',
                  roas: '5.5x',
                  conversions: `${Math.round(budget / 20).toLocaleString()}`,
                },
                messaging: 'Aggressive growth strategy with bold creative and expanded audience targeting.',
                cta: 'Buy Now',
                createdAt: new Date().toISOString(),
              },
            ];

            // Add blueprints to store
            useBlueprintStore.getState().addBlueprints(demoBlueprints as any);
            // Reset workflow state so RightPanel transitions to show blueprints
            useBriefEditorStore.getState().setWorkflowState('editing');

            const state = get();
            const finalSegments = state.streamingSegments.filter(
              (s) => s.type === 'thinking' || s.type === 'tool_call'
            );
            const demoMetadata: Record<string, unknown> = {};
            if (finalSegments.length > 0) demoMetadata.segments = finalSegments;
            if (state.activeRunId) demoMetadata.runId = state.activeRunId;
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: `I've generated 3 campaign blueprint variants for "${campaignName}":\n\n1. **Conservative** — Lower risk, proven approach (High confidence)\n2. **Balanced** — Mix of proven and new tactics (Medium confidence)\n3. **Aggressive** — Growth-focused, bold creative (Low confidence)\n\nReview the blueprints on the right panel. Click any variant to see the full details, then save your preferred blueprint.`,
              timestamp: new Date(),
              metadata: Object.keys(demoMetadata).length > 0 ? demoMetadata : undefined,
            };
            set((s) => ({
              messages: [...s.messages, aiMsg],
              isStreaming: false,
              isWaitingForResponse: false,
              streamingSegments: [],
              pendingThinkingStart: false,
              activeRunId: null,
            }));
            return;
          }

          const step = blueprintThinkingSteps[stepIdx];
          set((state) => {
            const segments = [...state.streamingSegments];
            const last = segments[segments.length - 1];
            if (last && last.type === 'thinking') {
              segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
            } else {
              segments.push({ type: 'thinking', content: step });
            }
            return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
          });

          stepIdx++;
          setTimeout(runStep, 400);
        };

        setTimeout(runStep, 400);
        return;
      }

      // Demo mode: handle element-reference (pointer) edits directly
      const hasRefXml = content.includes('<element-references');
      if (hasRefXml) {
        console.log('[ChatStore] Demo mode: handling element-reference edit');
        set({ isStreaming: true, isWaitingForResponse: true });

        // Parse all ref elements
        const refRegex = /<ref\s([^>]*?)\/>/g;
        const attrRegex = /(\w+)="([^"]*)"/g;
        const refs: Array<Record<string, string>> = [];
        let refExec: RegExpExecArray | null;
        while ((refExec = refRegex.exec(content)) !== null) {
          const attrs: Record<string, string> = {};
          let attrExec: RegExpExecArray | null;
          while ((attrExec = attrRegex.exec(refExec[1])) !== null) {
            attrs[attrExec[1]] = attrExec[2];
          }
          refs.push(attrs);
        }

        // Extract user's instruction (text after closing element-references tag)
        const userInstruction = content.replace(/<element-references[\s\S]*?<\/element-references>\s*/g, '').trim();

        // Process each ref based on domain
        const updatedFields: string[] = [];
        for (const ref of refs) {
          const refId = ref.id || '';
          const fieldKey = refId.split('.').pop() || '';
          if (!fieldKey) continue;

          // Use the user's instruction as the new value (capitalize first letter)
          const newValue = userInstruction.charAt(0).toUpperCase() + userInstruction.slice(1);

          if (ref.domain === 'brief-editor') {
            const sectionKey = ref.sectionKey;
            if (!sectionKey) continue;
            useBriefStore.getState().updateSection(sectionKey as any, { [fieldKey]: newValue }, fieldKey);
          } else if (ref.domain === 'campaign-setup') {
            const configStore = useCampaignConfigStore.getState();
            if (configStore.config) {
              configStore.updateSetup({ [fieldKey]: newValue } as any);
            }
          } else {
            // audiences, content, review — no simple field update in demo mode
            continue;
          }
          updatedFields.push(ref.label || fieldKey);
        }

        // Show thinking animation then result
        const fieldList = updatedFields.join(', ') || 'the selected field';
        const thinkingSteps = [
          `Reviewing ${fieldList}...`,
          `Applying your changes...`,
        ];

        let stepIdx = 0;
        const runStep = () => {
          if (stepIdx >= thinkingSteps.length) {
            useBriefEditorStore.getState().setWorkflowState('editing');
            const state = get();
            const finalSegments = state.streamingSegments.filter(
              (s) => s.type === 'thinking' || s.type === 'tool_call'
            );
            const metadata: Record<string, unknown> = {};
            if (finalSegments.length > 0) metadata.segments = finalSegments;
            if (state.activeRunId) metadata.runId = state.activeRunId;
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: `Done — I've updated **${fieldList}**. You can continue editing or select another field to change.`,
              timestamp: new Date(),
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            };
            set((s) => ({
              messages: [...s.messages, aiMsg],
              isStreaming: false,
              isWaitingForResponse: false,
              streamingSegments: [],
              pendingThinkingStart: false,
              activeRunId: null,
            }));
            return;
          }

          const step = thinkingSteps[stepIdx];
          set((state) => {
            const segments = [...state.streamingSegments];
            const last = segments[segments.length - 1];
            if (last && last.type === 'thinking') {
              segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
            } else {
              segments.push({ type: 'thinking', content: step });
            }
            return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
          });

          stepIdx++;
          setTimeout(runStep, 400);
        };

        setTimeout(runStep, 300);
        return;
      }

      // Demo mode: simulate progressive thinking steps for campaign brief
      console.log('[ChatStore] Demo mode: generating thinking steps');
      const { thinkingSteps } = generateCampaignDraft(content);
      set({ isStreaming: true, isWaitingForResponse: true });

      let stepIdx = 0;
      const runStep = () => {
        if (stepIdx >= thinkingSteps.length) {
          // All steps done — populate brief editor with keyword-parsed sections
          const parsed = parseCampaignBrief(content);
          useBriefStore.getState().updateBriefFromAI(parsed.sections);

          // Map briefParser output (overview/audience/experience/measurement)
          // to briefEditorStore format (campaignDetails/primaryGoals/etc.)
          const { overview, audience, experience, measurement } = parsed.sections;
          useBriefEditorStore.getState().setBriefData({
            campaignDetails: overview?.campaignName || parsed.name || '',
            brandProduct: '',
            businessObjective: overview?.businessGoal || overview?.objective || '',
            businessObjectiveTags: [],
            primaryGoals: overview?.businessGoal ? [overview.businessGoal] : [],
            secondaryGoals: [],
            primaryKpis: measurement?.primaryKpi ? [measurement.primaryKpi] : [],
            secondaryKpis: measurement?.secondaryKpis || [],
            inScope: [],
            outOfScope: [],
            primaryAudience: audience?.segments || (audience?.primaryAudience ? [audience.primaryAudience] : []),
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

          const state = get();
          const finalSegments = state.streamingSegments.filter(
            (s) => s.type === 'thinking' || s.type === 'tool_call'
          );
          const demoMetadata: Record<string, unknown> = {};
          if (finalSegments.length > 0) demoMetadata.segments = finalSegments;
          if (state.activeRunId) demoMetadata.runId = state.activeRunId;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: 'Your campaign brief is ready — feel free to edit any section on the right. If you tell me what you want to change, I can update the brief.',
            timestamp: new Date(),
            metadata: Object.keys(demoMetadata).length > 0 ? demoMetadata : undefined,
          };
          set((s) => ({
            messages: [...s.messages, aiMsg],
            isStreaming: false,
            isWaitingForResponse: false,
            streamingSegments: [],
            pendingThinkingStart: false,
            activeRunId: null,
          }));
          return;
        }

        const step = thinkingSteps[stepIdx];
        set((state) => {
          const segments = [...state.streamingSegments];
          const last = segments[segments.length - 1];
          if (last && last.type === 'thinking') {
            segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
          } else {
            segments.push({ type: 'thinking', content: step });
          }
          return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
        });

        stepIdx++;
        setTimeout(runStep, 400);
      };

      setTimeout(runStep, 400);
      return;
    }

    // Real SDK mode
    const api = window.aiSuites?.chat;
    if (!api?.sendToSession) {
      console.warn('[ChatStore] sendToSession not available');
      set({ isWaitingForResponse: false });
      return;
    }

    // Auto-start session if not active (e.g. after loading a saved brief or HMR)
    if (!get().sessionActive) {
      console.log('[ChatStore] No active session — auto-starting before send');
      await get().startSession();
    }

    set({ isStreaming: true, isWaitingForResponse: true });

    try {
      // Build multimodal content blocks when images are attached
      let sendContent: string | Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }>;
      if (imageBlocks && imageBlocks.length > 0) {
        sendContent = [
          { type: 'text' as const, text: enrichedContent },
          ...imageBlocks.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
          })),
        ];
      } else {
        sendContent = enrichedContent;
      }

      let result = await api.sendToSession(sendContent);

      // If send failed, the session may be stale — restart and retry once
      if (!result.success) {
        console.warn('[ChatStore] Send failed, attempting session restart:', result.error);
        const restarted = await get().startSession();
        if (restarted) {
          result = await api.sendToSession(sendContent);
        }
      }

      if (!result.success) {
        console.error('[ChatStore] Failed to send message:', result.error);
        const traceS = runId ? useTraceStore.getState() : null;
        if (runId && traceS) {
          traceS.addEvent(runId, 'error', `SDK send failed: ${result.error}`, { level: 'error' });
          traceS.completeRun(runId, 'failed');
        }
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Failed to reach AI: ${result.error}. Try configuring your API key in Settings.`,
          timestamp: new Date(),
          metadata: runId ? { runId } : undefined,
        };
        set((s) => ({
          messages: [...s.messages, errMsg],
          isStreaming: false,
          isWaitingForResponse: false,
          activeRunId: null,
        }));
        // Reset brief editor workflow state so skeleton loading clears
        useBriefEditorStore.getState().setWorkflowState('editing');
      } else {
        // Message queued — play progressive thinking steps as immediate
        // visual feedback while the SDK processes in the background.
        // Use context-appropriate steps based on which page we're on.
        const thinkingSteps = isCompanyContextPage
          ? [
              'Analyzing request for company context...',
              'Extracting company information...',
              'Researching industry and competitors...',
              'Building target personas...',
              'Identifying regulatory frameworks...',
              'Compiling benchmarks and seasonal trends...',
            ]
          : generateCampaignDraft(content).thinkingSteps;
        let sdkStepIdx = 0;
        let sdkCancelled = false;

        const playStep = () => {
          if (sdkCancelled) return;
          const s = get();
          // Stop if SDK already delivered real events (thinking or content)
          // beyond our injected steps
          if (!s.isStreaming && !s.isWaitingForResponse) return;

          if (sdkStepIdx < thinkingSteps.length) {
            const step = thinkingSteps[sdkStepIdx];
            set((state) => {
              const segments = [...state.streamingSegments];
              const last = segments[segments.length - 1];
              if (last && last.type === 'thinking') {
                segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
              } else {
                segments.push({ type: 'thinking', content: step });
              }
              return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
            });
            sdkStepIdx++;
            setTimeout(playStep, 400);
          }
          // After all thinking steps played, just wait for SDK (or timeout)
        };

        setTimeout(playStep, 300);

        // Set a timeout — if SDK doesn't deliver real events within 20s,
        // finalize with demo thinking and show the fallback message
        const capturedRunId = runId;
        const sdkTimeoutId = setTimeout(() => {
          sdkCancelled = true;
          const s = get();
          if (s.isStreaming || s.isWaitingForResponse) {
            const traceS2 = capturedRunId ? useTraceStore.getState() : null;
            if (capturedRunId && traceS2) {
              traceS2.addEvent(capturedRunId, 'error', 'SDK timeout — no response received.', { level: 'warn' });
              traceS2.completeRun(capturedRunId, 'failed');
            }

            // Clear generating state on company context page
            if (isCompanyContextPage) {
              useCompanyContextStore.getState().setGenerating(false);
            }

            // Reset brief editor workflow state so skeleton loading clears
            useBriefEditorStore.getState().setWorkflowState('editing');

            // Finalize the thinking segments into a proper AI message
            const finalSegments = s.streamingSegments.filter(
              (seg) => seg.type === 'thinking' || seg.type === 'tool_call'
            );
            const metadata: Record<string, unknown> = {};
            if (finalSegments.length > 0) metadata.segments = finalSegments;
            if (capturedRunId) metadata.runId = capturedRunId;
            const timeoutMessage = isCompanyContextPage
              ? 'The AI service did not respond in time. Please try again, or check your API key in Settings.'
              : 'The AI service did not respond. Your brief was generated using the built-in keyword parser. To get AI-enhanced briefs, configure a valid API key in Settings.';
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: timeoutMessage,
              timestamp: new Date(),
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            };
            set((prev) => ({
              messages: [...prev.messages, aiMsg],
              isStreaming: false,
              isWaitingForResponse: false,
              streamingSegments: [],
              pendingThinkingStart: false,
              activeRunId: null,
            }));
          }
        }, 60_000);

        (window as { __sdkTimeoutId?: ReturnType<typeof setTimeout> }).__sdkTimeoutId = sdkTimeoutId;
        // Also store the cancel function so handleStreamEvent can stop the animation
        (window as { __sdkStepCancel?: () => void }).__sdkStepCancel = () => { sdkCancelled = true; };
      }
    } catch (error) {
      console.error('[ChatStore] Error sending message:', error);
      const traceS = runId ? useTraceStore.getState() : null;
      if (runId && traceS) {
        traceS.addEvent(runId, 'error', `SDK error: ${error instanceof Error ? error.message : String(error)}`, { level: 'error' });
        traceS.completeRun(runId, 'failed');
      }
      set({ isWaitingForResponse: false, activeRunId: null });
    }
  },

  stopStreaming: async () => {
    const api = window.aiSuites?.chat;

    // Immediately reset streaming state so UI unblocks, even if backend is slow
    set({ isStreaming: false, isWaitingForResponse: false });

    // Also clear AI edit loading state in case an AI edit triggered this
    useBriefEditorStore.getState().setAIEditLoading(false);

    if (!api?.stopSession) {
      // No API — force finalize
      get().finalizeStream();
      return;
    }

    try {
      await api.stopSession();
    } catch (error) {
      console.error('[ChatStore] Error stopping stream:', error);
    }

    // Force finalize in case the done event was missed
    setTimeout(() => {
      if (!get().isStreaming) {
        get().finalizeStream();
      }
    }, 500);
  },

  resetChat: () => {
    // Unsubscribe from stream events
    const unsub = (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub;
    if (unsub) {
      unsub();
      (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub = undefined;
    }

    // Clear stale blueprints so old data doesn't bleed into the next session
    useBlueprintStore.getState().clearAll();

    set({
      sessionId: null,
      sessionActive: false,
      messages: [],
      isStreaming: false,
      isWaitingForResponse: false,
      streamingSegments: [],
      pendingThinkingStart: false,
      isDemoMode: false,
      activeRunId: null,
      pageContext: null,
      activeSuite: null,
    });
  },

  addSystemMessage: (content: string) => {
    const msg: ChatMessage = {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    set({ messages: [...get().messages, msg] });
  },

  loadMessages: (messages: ChatMessage[]) => {
    set({ messages });
  },

  handleStreamEvent: (event: ChatStreamEvent) => {
    const state = get();

    // Ignore stream events that arrive after finalization — the SDK may emit
    // late content/thinking events after the done event, which would re-set
    // isStreaming to true and leave the UI stuck with a stop button.
    if (!state.isStreaming && event.type === 'event') {
      return;
    }

    // Clear SDK timeout and stop thinking animation on any meaningful event
    if (event.type === 'event' || event.type === 'done' || event.type === 'error') {
      const tid = (window as { __sdkTimeoutId?: ReturnType<typeof setTimeout> }).__sdkTimeoutId;
      if (tid) {
        clearTimeout(tid);
        (window as { __sdkTimeoutId?: ReturnType<typeof setTimeout> }).__sdkTimeoutId = undefined;
      }
      const cancelFn = (window as { __sdkStepCancel?: () => void }).__sdkStepCancel;
      if (cancelFn) {
        cancelFn();
        (window as { __sdkStepCancel?: () => void }).__sdkStepCancel = undefined;
      }
    }

    switch (event.type) {
      case 'metadata':
        // Session initialized
        break;

      case 'event':
        if (event.data && 'type' in event.data) {
          switch (event.data.type) {
            case 'content':
              state.setWaitingForResponse(false);
              state.appendStreamContent(event.data.content);
              break;

            case 'tool_call': {
              state.setWaitingForResponse(false);
              const tcData = event.data as { type: 'tool_call'; tool: string; toolUseId?: string; input: Record<string, unknown> };
              state.addToolCall({
                name: tcData.tool,
                arguments: tcData.input,
                toolUseId: tcData.toolUseId,
              });
              break;
            }

            case 'tool_result': {
              const trData = event.data as { type: 'tool_result'; toolUseId: string; result: string; isError?: boolean };
              state.updateToolCallResult(trData.toolUseId, trData.result, trData.isError);
              break;
            }

            case 'thinking_start':
              state.startNewThinkingBlock();
              break;

            case 'thinking': {
              state.setWaitingForResponse(false);
              const thData = event.data as { type: 'thinking'; content: string };
              state.appendThinkingContent(thData.content);
              break;
            }
          }
        }
        break;

      case 'done':
        state.finalizeStream();
        break;

      case 'error': {
        const errorMsg = typeof event.data === 'object' && event.data !== null && 'message' in event.data
          ? event.data.message
          : String(event.data);
        console.error('[ChatStore] Stream error:', errorMsg);

        // Emit trace events for the error
        const currentRunId = get().activeRunId;
        if (currentRunId) {
          const traceStore = useTraceStore.getState();
          traceStore.addEvent(currentRunId, 'error', errorMsg, { level: 'error' });
          traceStore.completeRun(currentRunId, 'failed');
        }

        // Finalize stream and add error as assistant message
        state.finalizeStream();
        const errSegments = get().messages[get().messages.length - 1]?.metadata?.segments;
        const errMetadata: Record<string, unknown> = {};
        if (currentRunId) errMetadata.runId = currentRunId;
        if (errSegments) errMetadata.segments = errSegments;

        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
          metadata: Object.keys(errMetadata).length > 0 ? errMetadata : undefined,
        };
        set((s) => ({ messages: [...s.messages, errMsg] }));
        break;
      }
    }
  },

  appendStreamContent: (content: string) => {
    set((state) => {
      const segments = [...state.streamingSegments];
      const last = segments[segments.length - 1];

      if (last && last.type === 'content') {
        segments[segments.length - 1] = { type: 'content', content: last.content + content };
      } else {
        segments.push({ type: 'content', content });
      }

      return { isStreaming: true, streamingSegments: segments };
    });
  },

  appendThinkingContent: (content: string) => {
    set((state) => {
      const segments = [...state.streamingSegments];
      const last = segments[segments.length - 1];

      if (state.pendingThinkingStart || !last || last.type !== 'thinking') {
        segments.push({ type: 'thinking', content });
      } else {
        segments[segments.length - 1] = { type: 'thinking', content: last.content + content };
      }

      return { isStreaming: true, streamingSegments: segments, pendingThinkingStart: false };
    });
  },

  startNewThinkingBlock: () => {
    set({ pendingThinkingStart: true });
  },

  addToolCall: (toolCall) => {
    const id = toolCall.toolUseId || `tool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const fullToolCall: ToolCall = {
      id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      status: 'running',
    };

    set((state) => ({
      isStreaming: true,
      streamingSegments: [
        ...state.streamingSegments,
        { type: 'tool_call' as const, toolCall: fullToolCall },
      ],
    }));
  },

  updateToolCallResult: (toolUseId: string, result: string, isError?: boolean) => {
    set((state) => {
      const segments = state.streamingSegments.map((seg): StreamSegment => {
        if (seg.type === 'tool_call' && seg.toolCall.id === toolUseId && seg.toolCall.status === 'running') {
          return {
            type: 'tool_call',
            toolCall: {
              ...seg.toolCall,
              result,
              status: isError ? 'error' : 'completed',
            },
          };
        }
        return seg;
      });

      // Fallback: if no exact match, try single running tool call
      const hasMatch = segments.some(
        (seg) => seg.type === 'tool_call' && seg.toolCall.id === toolUseId
      );
      if (!hasMatch) {
        const running = segments.filter(
          (seg) => seg.type === 'tool_call' && seg.toolCall.status === 'running'
        );
        if (running.length === 1) {
          const idx = segments.indexOf(running[0]);
          const tc = running[0] as { type: 'tool_call'; toolCall: ToolCall };
          segments[idx] = {
            type: 'tool_call',
            toolCall: { ...tc.toolCall, result, status: isError ? 'error' : 'completed' },
          };
        }
      }

      return { streamingSegments: segments };
    });
  },

  finalizeStream: () => {
    const state = get();
    const segments = state.streamingSegments;

    if (segments.length === 0) {
      set({
        isStreaming: false,
        isWaitingForResponse: false,
        streamingSegments: [],
        pendingThinkingStart: false,
      });
      return;
    }

    // Mark running tool calls as interrupted, filter empty thinking blocks
    const finalizedSegments: StreamSegment[] = segments
      .filter((seg) => !(seg.type === 'thinking' && !seg.content.trim()))
      .map((seg): StreamSegment => {
        if (seg.type === 'tool_call' && seg.toolCall.status === 'running') {
          return { type: 'tool_call', toolCall: { ...seg.toolCall, status: 'interrupted' } };
        }
        return seg;
      });

    // Multi-parser dispatch: detect any skill output in content segments
    const fullText = finalizedSegments
      .filter((s) => s.type === 'content')
      .map((s) => s.content)
      .join('');
    const runId = state.activeRunId;
    const trace = useTraceStore.getState();

    let skillDetected = false;
    let briefPopulated = false;
    let contentOptions: ChatMessageMetadata['contentOptions'] | undefined;

    if (fullText) {
      if (runId) {
        trace.addEvent(runId, 'skill_call', 'Scanning response for skill code fences', {
          data: { contentLength: fullText.length },
        });
      }

      // Try multi-parser dispatch first
      const skillResult = detectSkillOutput(fullText);
      if (skillResult) {
        skillDetected = true;

        if (runId) {
          trace.addEvent(runId, 'skill_result', `Skill "${skillResult.skillName}" output detected and parsed`, {
            data: { skillName: skillResult.skillName },
          });
        }

        // Normalize AI skill output (object shapes) to editor store types (flat strings/string[])
        const normalizeForEditor = (data: Record<string, unknown>): Record<string, unknown> => {
          const normalized = { ...data };

          // campaignDetails: {campaignName, campaignType, description} → string
          if (normalized.campaignDetails && typeof normalized.campaignDetails === 'object' && !Array.isArray(normalized.campaignDetails)) {
            const cd = normalized.campaignDetails as Record<string, string>;
            normalized.campaignDetails = [cd.campaignName, cd.campaignType, cd.description].filter(Boolean).join(' — ');
          }

          // primaryAudience / secondaryAudience: [{name, description, estimatedSize}] → string[]
          for (const key of ['primaryAudience', 'secondaryAudience'] as const) {
            if (Array.isArray(normalized[key])) {
              normalized[key] = (normalized[key] as unknown[]).map((item) =>
                typeof item === 'object' && item !== null && 'name' in item
                  ? (item as Record<string, string>).name
                  : String(item)
              );
            }
          }

          // prospecting/retargeting/suppressionSegments: ensure string[] (AI may output objects)
          for (const key of ['prospectingSegments', 'retargetingSegments', 'suppressionSegments'] as const) {
            if (Array.isArray(normalized[key])) {
              normalized[key] = (normalized[key] as unknown[]).map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                  const obj = item as Record<string, unknown>;
                  return String(obj.segmentName || obj.name || obj.label || JSON.stringify(item));
                }
                return String(item);
              });
            }
          }

          // phases: [{name, ...}] → string (editor expects a simple string like "3 phases")
          if (Array.isArray(normalized.phases)) {
            const phaseArr = normalized.phases as Record<string, unknown>[];
            normalized.phases = phaseArr.length > 0
              ? `${phaseArr.length} phase${phaseArr.length > 1 ? 's' : ''}: ${phaseArr.map((p) => (p.name as string) || '').filter(Boolean).join(', ')}`
              : '';
          }

          // budget: handle nested object or alternate field names
          // AI may output { budget: { amount, pacing } } or { budget: "$200,000" }
          if (!normalized.budgetAmount && normalized.budget) {
            if (typeof normalized.budget === 'object' && !Array.isArray(normalized.budget)) {
              const b = normalized.budget as Record<string, string>;
              normalized.budgetAmount = b.amount || b.total || b.budgetAmount || '';
              if (!normalized.pacing && b.pacing) normalized.pacing = b.pacing;
            } else if (typeof normalized.budget === 'string') {
              normalized.budgetAmount = normalized.budget;
            }
          }
          // Also check totalBudget as a fallback
          if (!normalized.budgetAmount && normalized.totalBudget) {
            normalized.budgetAmount = String(normalized.totalBudget);
          }

          return normalized;
        };

        // Dispatch to appropriate store based on skill name
        switch (skillResult.skillName) {
          case 'campaign-brief': {
            useBriefStore.getState().updateBriefFromAI(skillResult.data as any);
            useBriefEditorStore.getState().updateBriefData(normalizeForEditor(skillResult.data as Record<string, unknown>) as any);
            briefPopulated = true;
            if (runId) trace.addEvent(runId, 'ui_update', 'Campaign Brief editor updated with AI-generated content');
            // Link to program if active
            if (useProgramStore.getState().activeProgram) {
              useProgramStore.getState().saveBriefSnapshot(skillResult.data);
              useProgramStore.getState().markStepEdited(1);
              // Derive a meaningful program name from the brief
              const briefRaw = skillResult.data as Record<string, unknown>;
              const cd = briefRaw.campaignDetails;
              let derivedName: string | undefined;
              if (typeof cd === 'object' && cd !== null && 'campaignName' in cd) {
                derivedName = (cd as Record<string, string>).campaignName;
              } else if (typeof cd === 'string' && cd.trim()) {
                derivedName = cd.trim().split(/\s*[—–-]\s*/)[0];
              }
              if (!derivedName) {
                derivedName = (briefRaw.brandProduct as string) || (briefRaw.businessObjective as string) || undefined;
              }
              if (derivedName) {
                useProgramStore.getState().renameProgram(derivedName.slice(0, 80));
              }
            }

            // Auto-populate segment dropdowns from AI audiences
            {
              const rawBrief = skillResult.data as Record<string, unknown>;
              const recSegs = rawBrief.recommendedSegments as Array<{
                segmentId: string; segmentName: string;
                suggestedRole: 'prospecting' | 'retargeting' | 'suppression'; reason: string;
              }> | undefined;

              if (recSegs && recSegs.length > 0) {
                // AI provided explicit segment recommendations
                const prospecting: string[] = [];
                const retargeting: string[] = [];
                const suppression: string[] = [];
                for (const rec of recSegs) {
                  if (rec.suggestedRole === 'retargeting') retargeting.push(rec.segmentName);
                  else if (rec.suggestedRole === 'suppression') suppression.push(rec.segmentName);
                  else prospecting.push(rec.segmentName);
                }
                const segUpdates: Partial<CampaignBriefData> = {};
                if (prospecting.length > 0) segUpdates.prospectingSegments = prospecting;
                if (retargeting.length > 0) segUpdates.retargetingSegments = retargeting;
                if (suppression.length > 0) segUpdates.suppressionSegments = suppression;
                useBriefEditorStore.getState().updateBriefData(segUpdates);
              } else {
                // Fallback: derive segments from audience names
                const normalizedData = normalizeForEditor(rawBrief) as Record<string, unknown>;
                const allAudNames = [
                  ...((normalizedData.primaryAudience || []) as string[]),
                  ...((normalizedData.secondaryAudience || []) as string[]),
                ];

                if (allAudNames.length > 0) {
                  const childSegs = useCampaignConfigStore.getState().childSegments;
                  if (childSegs.length > 0) {
                    // Fuzzy-match audience names to TD segment names
                    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const matched: string[] = [];
                    for (const audName of allAudNames) {
                      const n = normalize(audName);
                      const match = childSegs.find((cs) => {
                        const csn = normalize(cs.name);
                        return csn === n || csn.includes(n) || n.includes(csn);
                      });
                      if (match) matched.push(match.name);
                    }
                    if (matched.length > 0) {
                      useBriefEditorStore.getState().updateBriefData({ prospectingSegments: matched });
                    }
                  } else {
                    // No TD segments loaded — use audience names directly as prospecting segments
                    useBriefEditorStore.getState().updateBriefData({ prospectingSegments: allAudNames });
                  }
                }
              }
            }
            break;
          }
          case 'brief-update': {
            const editorState = useBriefEditorStore.getState();

            // The AI may emit section-based data (e.g. { measurement: { primaryKpi: "..." } })
            // which is valid for briefStore but needs flattening for briefEditorStore.
            // Detect and apply section-based updates directly to briefStore.
            const rawUpdateData = skillResult.data as Record<string, unknown>;
            const sectionKeys = ['overview', 'audience', 'experience', 'measurement'];
            const hasSectionKeys = sectionKeys.some((k) => k in rawUpdateData && typeof rawUpdateData[k] === 'object');
            if (hasSectionKeys) {
              // Apply each section's updates to the briefStore directly
              for (const sk of sectionKeys) {
                if (rawUpdateData[sk] && typeof rawUpdateData[sk] === 'object') {
                  useBriefStore.getState().updateSection(sk as any, rawUpdateData[sk] as Record<string, unknown>);
                }
              }
              briefPopulated = true;
              if (runId) trace.addEvent(runId, 'ui_update', 'Brief fields updated via pointer edit');
              useBriefEditorStore.getState().setWorkflowState('editing');
              break;
            }

            if (editorState.state.pendingSuggestionRequest) {
              // Route to inline suggestions instead of auto-applying
              const normalizedData = normalizeForEditor(skillResult.data as Record<string, unknown>) as Record<string, unknown>;
              const suggestions: Record<string, any> = {};
              const sectionDataMap: Record<string, string[]> = {
                campaignDetails: ['campaignDetails'],
                brandProduct: ['brandProduct'],
                businessObjective: ['businessObjective', 'businessObjectiveTags'],
                goals: ['primaryGoals', 'secondaryGoals'],
                successMetrics: ['primaryKpis', 'secondaryKpis'],
                campaignScope: ['inScope', 'outOfScope'],
                targetAudience: ['primaryAudience', 'secondaryAudience'],
                audienceSegments: ['prospectingSegments', 'retargetingSegments', 'suppressionSegments'],
                channels: ['mandatoryChannels', 'optionalChannels'],
                budget: ['budgetAmount', 'pacing', 'phases'],
                timeline: ['timelineStart', 'timelineEnd'],
              };
              for (const [sectionKey, dataKeys] of Object.entries(sectionDataMap)) {
                const changedKeys = dataKeys.filter((dk) => dk in normalizedData);
                if (changedKeys.length > 0) {
                  const updates: Record<string, unknown> = {};
                  changedKeys.forEach((dk) => { updates[dk] = normalizedData[dk]; });
                  // Determine if this is a minor tweak or a major suggestion
                  const currentBrief = editorState.state.briefData as unknown as Record<string, unknown>;
                  const sectionHasContent = dataKeys.some((dk) => {
                    const val = currentBrief[dk];
                    if (Array.isArray(val)) return val.length > 0;
                    return !!val;
                  });
                  const isMinor = sectionHasContent && changedKeys.length <= 2;

                  // Build a human-readable description of the suggested changes
                  const friendlyNames: Record<string, string> = {
                    campaignDetails: 'campaign details', brandProduct: 'brand/product',
                    businessObjective: 'objective', businessObjectiveTags: 'objective tags',
                    primaryGoals: 'primary goals', secondaryGoals: 'secondary goals',
                    primaryKpis: 'primary KPIs', secondaryKpis: 'secondary KPIs',
                    inScope: 'in-scope items', outOfScope: 'out-of-scope items',
                    primaryAudience: 'primary audience', secondaryAudience: 'secondary audience',
                    mandatoryChannels: 'mandatory channels', optionalChannels: 'optional channels',
                    budgetAmount: 'budget', pacing: 'pacing', phases: 'phases',
                    timelineStart: 'start date', timelineEnd: 'end date',
                  };
                  const previewParts = changedKeys.map((dk) => {
                    const val = normalizedData[dk];
                    const preview = Array.isArray(val)
                      ? val.slice(0, 3).join(', ') + (val.length > 3 ? ` +${val.length - 3} more` : '')
                      : String(val).slice(0, 80) + (String(val).length > 80 ? '...' : '');
                    return `${friendlyNames[dk] || dk}: ${preview}`;
                  });
                  const description = isMinor
                    ? `Update ${previewParts.join(' and ')}`
                    : `Add ${previewParts.join('; ')}`;

                  suggestions[sectionKey] = {
                    sectionKey,
                    title: isMinor ? 'Try a small change' : 'Suggested',
                    description,
                    isMinor,
                    suggestedUpdates: updates,
                  };
                }
              }
              editorState.setInlineSuggestions(suggestions);
              briefPopulated = true;
              if (runId) trace.addEvent(runId, 'ui_update', 'AI suggestions populated for review');
            } else {
              useBriefStore.getState().updateBriefFromAI(skillResult.data as any);
              editorState.updateBriefData(normalizeForEditor(skillResult.data as Record<string, unknown>) as any);
              briefPopulated = true;
              if (runId) trace.addEvent(runId, 'ui_update', 'Campaign Brief editor updated with refinements');
            }
            useBriefEditorStore.getState().setWorkflowState('editing');
            break;
          }
          case 'blueprints': {
            // Add blueprints to the blueprint store
            // Handle both { blueprints: [...] } and raw array [...] shapes
            const rawData = skillResult.data as any;
            const blueprintArr = Array.isArray(rawData)
              ? rawData
              : rawData?.blueprints
                ? rawData.blueprints
                : null;
            if (blueprintArr && blueprintArr.length > 0) {
              // Normalize blueprint fields: skill outputs objects but UI expects flat strings
              const normalized = blueprintArr.map((bp: any) => {
                const out = { ...bp };
                // channels: [{name, budgetPercent, ...}] → string[] (flat) + channelAllocations (rich)
                if (Array.isArray(out.channels)) {
                  // Preserve rich channel data before flattening
                  const hasObjects = out.channels.some((ch: any) => typeof ch === 'object' && ch !== null && 'name' in ch);
                  if (hasObjects) {
                    out.channelAllocations = out.channels
                      .filter((ch: any) => typeof ch === 'object' && ch !== null && 'name' in ch)
                      .map((ch: any) => ({
                        name: ch.name,
                        budgetPercent: ch.budgetPercent ?? ch.budget_percent,
                        budgetAmount: ch.budgetAmount ?? ch.budget_amount,
                        role: ch.role,
                        formats: ch.formats,
                        expectedMetrics: ch.expectedMetrics ?? ch.expected_metrics,
                      }));
                  }
                  out.channels = out.channels.map((ch: any) =>
                    typeof ch === 'object' && ch !== null && 'name' in ch ? ch.name : String(ch)
                  );
                }
                // audiences: [{name, type, ...}] → string[]
                if (Array.isArray(out.audiences)) {
                  out.audiences = out.audiences.map((a: any) =>
                    typeof a === 'object' && a !== null && 'name' in a ? a.name : String(a)
                  );
                }
                // messaging: {primaryMessage, supportingMessages, toneAndVoice} → string
                if (out.messaging && typeof out.messaging === 'object' && !Array.isArray(out.messaging)) {
                  const m = out.messaging as Record<string, unknown>;
                  out.messaging = m.primaryMessage || [m.toneAndVoice, ...(Array.isArray(m.supportingMessages) ? m.supportingMessages : [])].filter(Boolean).join('. ') || '';
                }
                // budget: {total, pacing, phases} → {amount, pacing} (flatten)
                if (out.budget && typeof out.budget === 'object' && 'total' in out.budget) {
                  out.budget = { amount: out.budget.total || '', pacing: out.budget.pacing || '' };
                }
                // metrics: {estimatedReach, ...} → {reach, ctr, roas, conversions} (flatten)
                if (out.metrics && typeof out.metrics === 'object') {
                  const mt = out.metrics as Record<string, string>;
                  out.metrics = {
                    reach: mt.estimatedReach || mt.reach || '',
                    ctr: mt.estimatedCtr || mt.ctr || '',
                    roas: mt.estimatedRoas || mt.roas || '',
                    conversions: mt.estimatedConversions || mt.conversions || '',
                  };
                }
                // confidence: number → string
                if (typeof out.confidence === 'number') {
                  out.confidence = out.confidence >= 80 ? 'High' : out.confidence >= 50 ? 'Medium' : 'Low';
                }
                // cta: ensure string
                if (out.cta && typeof out.cta === 'object') {
                  out.cta = String(out.cta.text || out.cta.label || '');
                }
                return out;
              });
              useBlueprintStore.getState().addBlueprints(normalized);
              // Link blueprints to program if active
              if (useProgramStore.getState().activeProgram) {
                const ids = normalized.map((bp: any) => bp.id).filter(Boolean);
                if (ids.length > 0) {
                  useProgramStore.getState().linkBlueprints(ids);
                }
                useProgramStore.getState().completeStep(1);
                useProgramStore.getState().markStepEdited(2);
              }
            }
            // Reset editor workflow from 'generating' back to 'editing'
            useBriefEditorStore.getState().setWorkflowState('editing');
            if (runId) trace.addEvent(runId, 'ui_update', 'Optimized blueprint generated');
            break;
          }
          case 'adset-config': {
            const rawData = skillResult.data as any;
            // Handle multiple data shapes from AI output
            let configArr = null;
            if (Array.isArray(rawData)) {
              configArr = rawData;
            } else if (rawData) {
              configArr = rawData.configs || rawData.adSets || rawData.adsets
                || rawData.ad_sets || rawData.variants || rawData.adGroups
                || rawData.ad_groups || null;
              // Fallback: find any array property
              if (!configArr) {
                const keys = Object.keys(rawData);
                for (const k of keys) {
                  if (Array.isArray(rawData[k]) && rawData[k].length > 0) {
                    configArr = rawData[k];
                    break;
                  }
                }
              }
            }
            if (configArr?.length > 0) {
              const normalized = configArr.map((cfg: any) => {
                const out = { ...cfg };
                if (typeof out.dailyBudget === 'string')
                  out.dailyBudget = parseFloat(out.dailyBudget.replace(/[^0-9.]/g, '')) || 20;
                if (typeof out.confidence === 'number')
                  out.confidence = out.confidence >= 80 ? 'High' : out.confidence >= 50 ? 'Medium' : 'Low';
                if (out.targeting && typeof out.targeting.countries === 'string')
                  out.targeting.countries = out.targeting.countries.split(',').map((c: string) => c.trim());
                return out;
              });
              useAdSetConfigStore.getState().addConfigs(normalized);
            }
            useBriefEditorStore.getState().setWorkflowState('editing');
            if (runId) trace.addEvent(runId, 'ui_update', 'Ad set config variants generated');
            break;
          }
          case 'launch-config': {
            const lcRawData = skillResult.data as any;
            if (lcRawData?.campaign && lcRawData?.adSets) {
              // Fire-and-forget: initFromSkillOutput is async (fetches FB Pages)
              // but finalizeStream is synchronous
              useCampaignLaunchStore.getState().initFromSkillOutput(
                lcRawData,
                useCampaignLaunchStore.getState().sourceBlueprintId || undefined,
              ).then(() => useCampaignLaunchStore.getState().autoGenerateAllImages())
               .catch((err: unknown) => console.error('[ChatStore] initFromSkillOutput failed:', err));
            }
            // Link to program if active
            if (useProgramStore.getState().activeProgram) {
              useProgramStore.getState().completeStep(2);
              useProgramStore.getState().markStepEdited(3);
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Launch config generated from AI');
            break;
          }
          case 'launch-config-update': {
            const updateData = skillResult.data as any;
            if (updateData) {
              useCampaignLaunchStore.getState().applySkillUpdate(updateData);
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Launch config updated from AI');
            break;
          }
          case 'company-context': {
            useCompanyContextStore.getState().replaceContext(skillResult.data as any);
            if (runId) trace.addEvent(runId, 'ui_update', 'Company context saved to localStorage');
            break;
          }
          case 'company-context-update': {
            const merged = mergeCompanyContext(skillResult.data as any);
            useCompanyContextStore.getState().replaceContext(merged);
            if (runId) trace.addEvent(runId, 'ui_update', 'Company context updated (partial merge)');
            break;
          }
          case 'campaign-setup': {
            const configStore = useCampaignConfigStore.getState();
            if (configStore.config) {
              configStore.updateSetup(skillResult.data as Partial<CampaignSetupData>);
              if (runId) trace.addEvent(runId, 'ui_update', 'Campaign setup fields updated from AI');
            }
            break;
          }
          case 'content-agent': {
            const caConfigStore = useCampaignConfigStore.getState();
            if (caConfigStore.config) {
              const caOutput = skillResult.data as ContentAgentOutput;
              if (caOutput.action === 'suggest_copy_options' && caOutput.suggestCopyOptions) {
                // Store options in message metadata for interactive selection in chat UI
                const { activeEditorPageId, activeEditorSpotId, activeEditorVariantId } = caConfigStore;
                contentOptions = {
                  field: caOutput.suggestCopyOptions.field,
                  options: caOutput.suggestCopyOptions.options,
                  target: {
                    pageId: caOutput.target?.pageId || activeEditorPageId || undefined,
                    spotId: caOutput.target?.spotId || activeEditorSpotId || undefined,
                    variantId: caOutput.target?.variantId || activeEditorVariantId || undefined,
                  },
                };
                if (runId) trace.addEvent(runId, 'ui_update', `Content agent: suggested ${caOutput.suggestCopyOptions.options.length} options for ${caOutput.suggestCopyOptions.field}`);
              } else {
                caConfigStore.applyContentAgentOutput(caOutput);
                if (runId) trace.addEvent(runId, 'ui_update', `Content agent action: ${caOutput.action}`);
              }
            }
            break;
          }
          case 'audience-selection': {
            const segments = skillResult.data as WizardSegment[];
            const configStore = useCampaignConfigStore.getState();
            if (configStore.config && Array.isArray(segments)) {
              configStore.applyAudienceSelection(segments);
              if (runId) trace.addEvent(runId, 'ui_update', `${segments.length} audience segment(s) updated from AI`);
            }
            break;
          }
          case 'web-analysis': {
            const waData = skillResult.data as WebAnalysisOutput;
            if (waData.spots && waData.spots.length > 0) {
              const savedPage = {
                id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                websiteUrl: waData.websiteUrl || '',
                websiteName: waData.websiteName || '',
                pageName: waData.pageName || 'Analyzed Page',
                description: waData.pageSummary || '',
                spots: waData.spots.map((s, idx) => ({
                  id: `spot-${Date.now()}-${idx}`,
                  name: s.name,
                  type: s.type,
                  selector: s.selector,
                })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              usePageStore.getState().savePage(savedPage);
              if (runId) trace.addEvent(runId, 'ui_update', `Web analysis saved: ${savedPage.spots.length} spots on "${savedPage.pageName}"`);
            }
            break;
          }
          case 'page-description': {
            const entries = skillResult.data as PageDescriptionEntry[];
            if (Array.isArray(entries)) {
              for (const entry of entries) {
                if (entry.pageId && entry.description) {
                  usePageStore.getState().updatePageDescription(entry.pageId, entry.description);
                }
              }
              if (runId) trace.addEvent(runId, 'ui_update', `Page descriptions updated for ${entries.length} pages`);
            }
            break;
          }
          case 'spot-recommendation': {
            const srData = skillResult.data as SpotRecommendationOutput;
            if (srData.recommendations && srData.recommendations.length > 0) {
              // Pre-populate wizard Step 3 content pages from recommendations
              const configStore = useCampaignConfigStore.getState();
              if (configStore.config) {
                for (const rec of srData.recommendations) {
                  // Add spots to existing pages or create new pages
                  const existingPage = configStore.config.content.pages.find(
                    (p) => p.pageId === rec.pageId || p.pageName === rec.pageName
                  );
                  if (!existingPage) {
                    // Find matching page from pageStore for URL
                    const savedPages = usePageStore.getState().pages;
                    const matchedPage = savedPages.find((p) => p.id === rec.pageId);
                    const pageUrl = matchedPage?.websiteUrl || '';
                    configStore.addContentPage(rec.pageName, pageUrl);
                  }
                  // Add recommended spots
                  const updatedConfig = useCampaignConfigStore.getState().config;
                  const targetPage = updatedConfig?.content.pages.find(
                    (p) => p.pageName === rec.pageName || p.pageId === rec.pageId
                  );
                  if (targetPage) {
                    for (const spot of rec.recommendedSpots) {
                      const spotExists = targetPage.spots.some(
                        (s) => s.spotId === spot.spotId || s.spotName === spot.spotName
                      );
                      if (!spotExists) {
                        configStore.addContentSpot(
                          targetPage.pageId,
                          spot.spotName,
                          spot.selector,
                          spot.spotType,
                          spot.spotId !== spot.spotName ? spot.spotId : undefined
                        );
                      }
                    }
                  }
                }
              }
              if (runId) trace.addEvent(runId, 'ui_update', `Spot recommendations applied: ${srData.summary?.totalSpots || 0} spots across ${srData.summary?.totalPages || 0} pages`);
            }
            break;
          }
          case 'campaign-analysis': {
            const analysisData = skillResult.data as CampaignAnalysisOutput;
            useCampaignAnalysisStore.getState().setAnalysis(analysisData);
            useCampaignAnalysisStore.getState().setAnalyzing(false);
            if (analysisData.campaign?.id && analysisData.campaign?.name) {
              useCampaignAnalysisStore.getState().saveAnalysis(
                analysisData.campaign.id,
                analysisData.campaign.name,
                analysisData
              );
            }
            if (runId) trace.addEvent(runId, 'ui_update', `Campaign analysis generated for "${analysisData.campaign?.name || 'campaign'}"`);
            break;
          }
          case 'platform-action': {
            const platformAction = skillResult.data as { action: string; platform: string };
            const platformApi = window.aiSuites?.platforms;
            if (platformApi) {
              // Fire async platform action and append result as a follow-up message
              const addResultMessage = (content: string) => {
                set((s) => ({
                  messages: [...s.messages, {
                    id: `platform-${Date.now()}`,
                    role: 'assistant' as const,
                    content,
                    timestamp: new Date(),
                  }],
                }));
              };
              if (platformAction.action === 'status') {
                platformApi.status().then((result: any) => {
                  if (result.success && result.data) {
                    const conns = result.data as Record<string, { platform: string; connected: boolean; accountName?: string; accountId?: string; lastSyncedAt?: string }>;
                    const lines = Object.values(conns).map((c: any) => {
                      const name = c.platform.charAt(0).toUpperCase() + c.platform.slice(1);
                      if (c.connected) {
                        return `**${name}**: Connected${c.accountName ? ` — ${c.accountName}` : ''}${c.accountId ? ` (${c.accountId})` : ''}${c.lastSyncedAt ? ` · Last synced: ${new Date(c.lastSyncedAt).toLocaleString()}` : ''}`;
                      }
                      return `**${name}**: Not connected`;
                    });
                    addResultMessage(`Here's your current platform connection status:\n\n${lines.join('\n')}`);
                  } else {
                    addResultMessage('Could not retrieve platform status. Please check Settings.');
                  }
                }).catch(() => {
                  addResultMessage('Failed to check platform status.');
                });
              } else if (platformAction.action === 'connect') {
                platformApi.oauthLogin(platformAction.platform).then(() => {
                  addResultMessage(`Meta OAuth login initiated. Please complete the authorization in the popup window.`);
                }).catch((err: any) => {
                  addResultMessage(`Failed to initiate connection: ${err.message || 'Unknown error'}`);
                });
              } else if (platformAction.action === 'disconnect') {
                platformApi.disconnect(platformAction.platform).then(() => {
                  const name = platformAction.platform.charAt(0).toUpperCase() + platformAction.platform.slice(1);
                  addResultMessage(`Disconnected from ${name}.`);
                }).catch((err: any) => {
                  addResultMessage(`Failed to disconnect: ${err.message || 'Unknown error'}`);
                });
              }
            }
            if (runId) trace.addEvent(runId, 'ui_update', `Platform action: ${platformAction.action} ${platformAction.platform}`);
            break;
          }
          case 'campaign-fetch': {
            const campaignApi = window.aiSuites?.campaigns;
            if (campaignApi) {
              const addCampaignMessage = (content: string) => {
                set((s) => ({
                  messages: [...s.messages, {
                    id: `campaigns-${Date.now()}`,
                    role: 'assistant' as const,
                    content,
                    timestamp: new Date(),
                  }],
                }));
              };
              campaignApi.list().then((result: any) => {
                if (result.success && result.data && result.data.length > 0) {
                  const camps = result.data as Array<{ name: string; status: string; spent: number; budget: number; metrics: { roas: number; cpa: number; conversions: number; impressions: number; clicks: number; ctr: number } }>;
                  const active = camps.filter((c) => c.status === 'active');
                  const paused = camps.filter((c) => c.status === 'paused');
                  const totalSpend = camps.reduce((s, c) => s + (c.spent || 0), 0);
                  const totalConv = camps.reduce((s, c) => s + (c.metrics?.conversions || 0), 0);
                  const avgRoas = totalSpend > 0 ? camps.reduce((s, c) => s + (c.metrics?.roas || 0) * (c.spent || 0), 0) / totalSpend : 0;

                  let text = `Fetched **${camps.length} campaigns** from Meta`;
                  const parts = [];
                  if (active.length > 0) parts.push(`${active.length} active`);
                  if (paused.length > 0) parts.push(`${paused.length} paused`);
                  if (parts.length > 0) text += ` (${parts.join(', ')})`;
                  text += `.\n\n**Total Spend:** $${totalSpend.toLocaleString()} · **ROAS:** ${avgRoas.toFixed(1)}x · **Conversions:** ${totalConv.toLocaleString()}\n\n`;
                  camps.forEach((c) => {
                    const icon = c.status === 'active' ? '🟢' : '⏸️';
                    text += `${icon} **${c.name}** — ${c.status}, ROAS: ${(c.metrics?.roas || 0).toFixed(1)}x, Spend: $${(c.spent || 0).toLocaleString()}\n`;
                  });
                  addCampaignMessage(text);
                } else if (result.success && (!result.data || result.data.length === 0)) {
                  addCampaignMessage('No campaigns found on your Meta ad account.');
                } else {
                  addCampaignMessage(`Could not fetch campaigns: ${result.error || 'Unknown error'}. Check your Meta connection in Settings.`);
                }
              }).catch((err: any) => {
                addCampaignMessage(`Failed to fetch campaigns: ${err.message || 'Unknown error'}`);
              });
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Campaign data fetched from Meta');
            break;
          }
          case 'report': {
            const reportData = skillResult.data as ReportOutput;
            useReportStore.getState().setReport(reportData);
            useReportStore.getState().setGenerating(false);
            if (runId) trace.addEvent(runId, 'ui_update', 'Report generated and dispatched to report store');
            break;
          }
          case 'blueprint-update': {
            // Apply updates to the currently selected blueprint
            const updateData = skillResult.data as any;
            const bpStore = useBlueprintStore.getState();
            const selectedId = bpStore.selectedBlueprintId;
            if (selectedId && updateData) {
              const updates: any = { ...updateData };
              // Normalize channels if present
              if (Array.isArray(updates.channels)) {
                const hasObjects = updates.channels.some((ch: any) => typeof ch === 'object' && ch !== null && 'name' in ch);
                if (hasObjects) {
                  updates.channelAllocations = updates.channels
                    .filter((ch: any) => typeof ch === 'object' && ch !== null && 'name' in ch)
                    .map((ch: any) => ({
                      name: ch.name,
                      budgetPercent: ch.budgetPercent ?? ch.budget_percent,
                      budgetAmount: ch.budgetAmount ?? ch.budget_amount,
                      role: ch.role,
                      formats: ch.formats,
                      expectedMetrics: ch.expectedMetrics ?? ch.expected_metrics,
                    }));
                  updates.channels = updates.channels.map((ch: any) =>
                    typeof ch === 'object' && ch !== null && 'name' in ch ? ch.name : String(ch)
                  );
                }
              }
              if (Array.isArray(updates.audiences)) {
                updates.audiences = updates.audiences.map((a: any) =>
                  typeof a === 'object' && a !== null && 'name' in a ? a.name : String(a)
                );
              }
              if (updates.budget && typeof updates.budget === 'object' && 'total' in updates.budget) {
                updates.budget = { amount: updates.budget.total || '', pacing: updates.budget.pacing || '' };
              }
              if (updates.metrics && typeof updates.metrics === 'object') {
                const mt = updates.metrics as Record<string, string>;
                updates.metrics = {
                  reach: mt.estimatedReach || mt.reach || '',
                  ctr: mt.estimatedCtr || mt.ctr || '',
                  roas: mt.estimatedRoas || mt.roas || '',
                  conversions: mt.estimatedConversions || mt.conversions || '',
                };
              }
              bpStore.updateBlueprint(selectedId, updates);
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Blueprint updated with refinements');
            break;
          }
          case 'budget-allocation': {
            // Store budget allocation in message metadata for display in chat
            if (runId) trace.addEvent(runId, 'ui_update', 'Budget allocation recommendation generated');
            break;
          }
          case 'media-mix': {
            // Apply media mix recommendation to the selected blueprint's channels
            const mixData = skillResult.data as any;
            const mmBpStore = useBlueprintStore.getState();
            const mmSelectedId = mmBpStore.selectedBlueprintId;
            if (mmSelectedId && mixData?.channels) {
              const channelNames = mixData.channels.map((ch: any) => ch.name);
              const channelAllocations = mixData.channels.map((ch: any) => ({
                name: ch.name,
                budgetPercent: ch.percentage,
                role: ch.role,
              }));
              mmBpStore.updateBlueprint(mmSelectedId, {
                channels: channelNames,
                channelAllocations,
              });
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Media mix recommendation applied');
            break;
          }
          case 'audience-recommendation': {
            const recData = skillResult.data as AudienceRecommendationOutput;
            if (recData?.recommendations?.length > 0) {
              const prospecting: string[] = [];
              const retargeting: string[] = [];
              const suppression: string[] = [];

              for (const rec of recData.recommendations) {
                const name = rec.segmentName;
                if (rec.suggestedRole === 'retargeting') retargeting.push(name);
                else if (rec.suggestedRole === 'suppression') suppression.push(name);
                else prospecting.push(name);
              }

              const editorStore = useBriefEditorStore.getState();
              const updates: Partial<CampaignBriefData> = {};
              if (prospecting.length > 0) updates.prospectingSegments = prospecting;
              if (retargeting.length > 0) updates.retargetingSegments = retargeting;
              if (suppression.length > 0) updates.suppressionSegments = suppression;
              editorStore.updateBriefData(updates);
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Audience segment recommendations applied');
            break;
          }
          default: {
            // Other skills: store result in message metadata for consuming components
            if (runId) trace.addEvent(runId, 'ui_update', `Skill "${skillResult.skillName}" result available`);
            break;
          }
        }

        if (runId) trace.completeRun(runId, 'succeeded');
      }

      // Fallback: try legacy brief parser if no skill detected
      if (!skillDetected) {
        const briefSections = extractBriefFromContent(fullText);
        if (briefSections) {
          useBriefStore.getState().updateBriefFromAI(briefSections);
          briefPopulated = true;
          skillDetected = true;

          if (runId) {
            trace.addEvent(runId, 'skill_result', 'Campaign brief extracted via legacy parser', {
              data: { skillName: 'campaign-brief', sections: Object.keys(briefSections) },
            });
            trace.addEvent(runId, 'ui_update', 'Campaign Brief editor updated with AI-generated content');
            trace.completeRun(runId, 'succeeded');
          }
        } else if (runId) {
          trace.addEvent(runId, 'skill_result', 'No skill code fences found in response', { level: 'warn' });
          trace.completeRun(runId, 'succeeded');
        }
      }
    } else if (runId) {
      trace.completeRun(runId, 'succeeded');
    }

    // Keep only thinking + tool_call segments for display; content is suppressed
    // (the campaign draft was already set and populates the right panel)
    const displaySegments = finalizedSegments.filter((s) => s.type === 'thinking' || s.type === 'tool_call');

    const aiMsgMetadata: Record<string, unknown> = {};
    if (displaySegments.length > 0) aiMsgMetadata.segments = displaySegments;
    if (runId) aiMsgMetadata.runId = runId;
    if (contentOptions) aiMsgMetadata.contentOptions = contentOptions;

    if (displaySegments.length > 0 || runId || skillDetected || fullText) {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: briefPopulated
          ? 'Your campaign brief is ready — feel free to edit any section on the right. If you tell me what you want to change, I can update the brief.'
          : skillDetected
            ? 'Done — results are displayed in the corresponding panel.'
            : fullText || '',
        timestamp: new Date(),
        metadata: Object.keys(aiMsgMetadata).length > 0 ? aiMsgMetadata : undefined,
      };

      set((s) => ({
        messages: [...s.messages, aiMsg],
        isStreaming: false,
        isWaitingForResponse: false,
        streamingSegments: [],
        pendingThinkingStart: false,
        activeRunId: null,
      }));
    } else {
      set({
        isStreaming: false,
        isWaitingForResponse: false,
        streamingSegments: [],
        pendingThinkingStart: false,
        activeRunId: null,
      });
    }

    // Always reset workflow state so the editor never stays stuck in loading
    useBriefEditorStore.getState().setWorkflowState('editing');
  },

  updateMessageMetadata: (messageId: string, updates: Partial<ChatMessageMetadata>) => {
    set((s) => ({
      messages: s.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, metadata: { ...msg.metadata, ...updates } }
          : msg
      ),
    }));
  },

  setWaitingForResponse: (waiting: boolean) => {
    set({ isWaitingForResponse: waiting });
  },
}));

// ============ Brand compliance helpers ============

const BRAND_COMPLIANCE_PATTERNS = [
  /brand\s*compliance/i,
  /brand\s*violation/i,
  /check.*brand/i,
  /audit.*guideline/i,
  /brand\s*voice/i,
  /validate.*brand/i,
  /against.*(our|the)\s*brand/i,
  /review.*compliance/i,
];

function isBrandComplianceRequest(message: string): boolean {
  return BRAND_COMPLIANCE_PATTERNS.some((p) => p.test(message));
}

const CAMPAIGN_BRIEF_PATTERNS = [
  /create\s+(a\s+)?campaign/i,
  /build\s+(a\s+)?personalization/i,
  /launch\s+(a\s+)?.*campaign/i,
  /set\s+up\s+(a\s+)?.*campaign/i,
  /design\s+(a\s+)?.*campaign/i,
  /prepare\s+(a\s+)?.*campaign/i,
  /make\s+(a\s+)?.*campaign/i,
  /campaign\s+brief/i,
  /personalization\s+(strategy|campaign|experience)/i,
];

function isCampaignBriefRequest(message: string): boolean {
  return CAMPAIGN_BRIEF_PATTERNS.some((p) => p.test(message));
}

const COPYWRITER_PATTERNS = [
  /write\s+(a\s+)?headline/i,
  /write\s+(a\s+)?tagline/i,
  /write\s+copy/i,
  /rewrite\s+(this\s+)?cta/i,
  /rewrite\s+(this\s+)?headline/i,
  /write\s+.*\s+variations?\s+of/i,
  /give\s+me\s+tagline/i,
  /help\s+(me\s+)?with\s+copy/i,
  /generate\s+offer\s+text/i,
  /punch\s+up/i,
  /make\s+(this|the)\s+(copy|text|headline)/i,
];

function isCopywriterRequest(message: string): boolean {
  return COPYWRITER_PATTERNS.some((p) => p.test(message));
}

const COMPANY_CONTEXT_PATTERNS = [
  /company\s*context/i,
  /set\s+up\s+.*company/i,
  /our\s+company\s+is/i,
  /add\s+.*\s+as\s+a\s+competitor/i,
  /add\s+a?\s*competitor/i,
  /our\s+competitors?\s+(are|is|include)/i,
  /our\s+target\s+personas?/i,
  /our\s+industry\s+is/i,
  /we('re|\s+are)\s+in\s+the\s+\w+\s+industry/i,
  /update\s+.*\s*(competitor|persona|benchmark|regulation)/i,
  /add\s+.*\s*persona/i,
  /regulatory\s+(framework|compliance|requirement)/i,
  /seasonal\s+trend/i,
  /industry\s+benchmark/i,
];

function isCompanyContextRequest(message: string): boolean {
  return COMPANY_CONTEXT_PATTERNS.some((p) => p.test(message));
}

function isCompanyContextFromUrlRequest(message: string): boolean {
  if (!extractUrlFromContent(message)) return false;
  return isCompanyContextRequest(message)
    || /build\s+company\s+context/i.test(message)
    || /company\s+profile\s+from/i.test(message)
    || /research\s+this\s+company/i.test(message)
    || /create\s+company\s+(context|profile)/i.test(message);
}

/**
 * Extract a URL from user input, handling both full URLs (https://example.com)
 * and bare domains (example.com, www.example.com). Returns a normalized https:// URL
 * or null if no URL-like content is found.
 */
function extractUrlFromContent(content: string): string | null {
  // Full URL with protocol
  const fullUrlMatch = content.match(/https?:\/\/[^\s]+/i);
  if (fullUrlMatch) return fullUrlMatch[0];

  // Bare domain: word.tld or www.word.tld (must contain a dot and a valid TLD-like suffix)
  const bareDomainMatch = content.match(/(?:^|\s)((?:www\.)?[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\.[a-z]{2,})?(?:\/[^\s]*)?)/i);
  if (bareDomainMatch) return `https://${bareDomainMatch[1]}`;

  return null;
}

// ============ Web analysis helpers ============

const WEB_ANALYSIS_PATTERNS = [
  /analyze\s+(this\s+)?(website|page|url|site)/i,
  /find\s+personalization\s+spots/i,
  /scan\s+(this\s+)?(url|site|page)/i,
  /identify\s+content\s+slots/i,
  /what\s+can\s+we\s+personalize/i,
  /detect\s+slots/i,
  /personalization\s+slots/i,
  /content\s+spots?\s+on/i,
  /analyze.*for\s+personalization/i,
];

function isWebAnalysisRequest(message: string): boolean {
  return WEB_ANALYSIS_PATTERNS.some((p) => p.test(message));
}

// ============ Spot recommendation helpers ============

const SPOT_RECOMMENDATION_PATTERNS = [
  /which\s+spots?\s+should/i,
  /recommend\s+spots/i,
  /suggest\s+placements/i,
  /where\s+should\s+I\s+personalize/i,
  /what\s+spots?\s+for/i,
  /help\s+me\s+pick\s+(content\s+)?spots/i,
  /best\s+placements?\s+for/i,
  /recommend.*\s+content\s+spots/i,
  /which\s+placements/i,
];

function isSpotRecommendationRequest(message: string): boolean {
  return SPOT_RECOMMENDATION_PATTERNS.some((p) => p.test(message));
}

// ============ Page description helpers ============

const PAGE_DESCRIPTION_PATTERNS = [
  /describe\s+(my\s+)?pages?/i,
  /page\s+descriptions?/i,
  /analyze\s+(my\s+)?pages?\s+for\s+personalization/i,
  /what\s+are\s+my\s+pages\s+(good\s+)?for/i,
  /generate\s+(a\s+)?descriptions?\s+(for|of)\s+(my\s+)?page/i,
  /generate\s+page\s+descriptions?/i,
  /add\s+descriptions?\s+to\s+(my\s+)?pages/i,
  /what\s+personalization\s+.*each\s+page/i,
];

function isPageDescriptionRequest(message: string): boolean {
  return PAGE_DESCRIPTION_PATTERNS.some((p) => p.test(message));
}

// ============ Campaign analysis helpers ============

const CAMPAIGN_ANALYSIS_PATTERNS = [
  /analy[sz]e?\s+(this\s+)?campaign/i,
  /campaign\s+(analysis|results|performance|metrics)/i,
  /how\s+(is|did|are)\s+(my|the|this)\s+campaign/i,
  /show\s+me\s+(the\s+)?results/i,
  /performance\s+report/i,
  /campaign\s+report/i,
];

function isCampaignAnalysisRequest(message: string): boolean {
  return CAMPAIGN_ANALYSIS_PATTERNS.some((p) => p.test(message));
}

// ============ Demo mode helpers ============

/**
 * Parse the user's message and generate a structured CampaignDraft plus a chat response.
 */
function generateCampaignDraft(userMessage: string): { chatResponse: string; draft: CampaignDraft; thinkingSteps: string[] } {
  const lower = userMessage.toLowerCase();

  // --- Extract campaign name ---
  const campaignKeywords = [
    'black friday', 'cyber monday', 'summer sale', 'winter sale', 'spring sale',
    'back to school', 'holiday', 'flash sale', 'clearance', 'labor day',
    'memorial day', 'new year', 'valentine', 'easter', 'halloween',
    'prime day', 'boxing day',
  ];
  let campaignTheme = '';
  for (const kw of campaignKeywords) {
    if (lower.includes(kw)) {
      campaignTheme = kw.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }
  if (!campaignTheme) {
    // Fall back: use first few meaningful words
    campaignTheme = userMessage
      .replace(/^(build|create|make|set up|launch|design|prepare)\s+(a|an|the|my)?\s*/i, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const name = `${campaignTheme} Web Personalization Campaign`;

  // --- Extract audiences ---
  const audiencePatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /new\s*visitor/i, label: 'New Visitors' },
    { pattern: /first[- ]?time/i, label: 'First-Time Visitors' },
    { pattern: /returning\s*(visitor|customer|shopper)?/i, label: 'Returning Customers' },
    { pattern: /loyal\s*(customer|member|shopper)?/i, label: 'Loyal Members' },
    { pattern: /lapsed\s*(customer|buyer|shopper)?/i, label: 'Lapsed Customers' },
    { pattern: /vip/i, label: 'VIP Customers' },
    { pattern: /high[- ]?value/i, label: 'High-Value Customers' },
    { pattern: /cart\s*abandon/i, label: 'Cart Abandoners' },
    { pattern: /bargain|deal[- ]?seek/i, label: 'Bargain Seekers' },
    { pattern: /browse|window\s*shop/i, label: 'Browsers' },
  ];

  const audiences: Array<{ name: string }> = [];
  for (const { pattern, label } of audiencePatterns) {
    if (pattern.test(userMessage)) {
      audiences.push({ name: label });
    }
  }
  // Default audiences if none extracted
  if (audiences.length === 0) {
    audiences.push({ name: 'New Visitors' }, { name: 'Returning Customers' }, { name: 'Loyal Members' });
  }

  const audienceList = audiences.map((a) => a.name).join(', ');

  // --- Generate overview ---
  const overview =
    `This ${campaignTheme || 'web personalization'} campaign is designed to deliver tailored shopping experiences ` +
    `to each audience segment. By leveraging customer data and behavioral signals, we will dynamically personalize ` +
    `on-site content for ${audienceList} — driving higher engagement, conversion rates, and average order value.\n\n` +
    `The strategy moves beyond a one-size-fits-all approach. Each visitor segment will receive curated messaging, ` +
    `product recommendations, and creative assets aligned with their intent and relationship with the brand.`;

  // --- Goal ---
  const goalDescription = 'Increase Conversion Rate';
  const goalMetric = '+15% over non-personalized sessions';

  // --- Conclusion ---
  const conclusion =
    `By implementing this personalization strategy for ${campaignTheme || 'the campaign'}, we expect measurable ` +
    `improvements in conversion rate, average order value, and customer engagement across all targeted segments ` +
    `(${audienceList}).\n\n` +
    `The combination of audience-specific creative assets and dynamic content delivery will create a compelling ` +
    `shopping experience that reinforces brand loyalty and maximizes revenue during this key period.\n\n` +
    `Please review and let me know if you have any questions or require further details.`;

  // --- Audience Segments with targeting rules ---
  const audienceTargetingMap: Record<string, Array<{ rule: string; value: string }>> = {
    'New Visitors': [
      { rule: 'Customer Type', value: 'Prospect' },
      { rule: 'Visit Count', value: '1' },
      { rule: 'Behavior', value: 'Browsing without purchase history' },
      { rule: 'Value Tier', value: 'Unknown' },
    ],
    'First-Time Visitors': [
      { rule: 'Customer Type', value: 'Prospect' },
      { rule: 'Visit Count', value: '1' },
      { rule: 'Behavior', value: 'First session on site' },
      { rule: 'Value Tier', value: 'Unknown' },
    ],
    'Returning Customers': [
      { rule: 'Customer Type', value: 'Existing' },
      { rule: 'Purchase History', value: '2+ orders' },
      { rule: 'Behavior', value: 'Repeat purchaser within 90 days' },
      { rule: 'Value Tier', value: 'Medium' },
    ],
    'Loyal Members': [
      { rule: 'Customer Type', value: 'Loyalty Program Member' },
      { rule: 'Purchase History', value: '5+ orders' },
      { rule: 'Behavior', value: 'Frequent engagement, high repeat rate' },
      { rule: 'Value Tier', value: 'High' },
    ],
    'Lapsed Customers': [
      { rule: 'Customer Type', value: 'Existing — Inactive' },
      { rule: 'Purchase History', value: '1+ orders, none in 90+ days' },
      { rule: 'Behavior', value: 'Previously active, no recent engagement' },
      { rule: 'Value Tier', value: 'Medium-High (winback)' },
    ],
    'VIP Customers': [
      { rule: 'Customer Type', value: 'High-Spend Loyal' },
      { rule: 'Purchase History', value: 'Top 10% by revenue' },
      { rule: 'Behavior', value: 'Frequent purchases, high AOV' },
      { rule: 'Value Tier', value: 'Platinum' },
    ],
    'High-Value Customers': [
      { rule: 'Customer Type', value: 'High-Spend' },
      { rule: 'Purchase History', value: 'AOV in top 20%' },
      { rule: 'Behavior', value: 'Large basket sizes, premium categories' },
      { rule: 'Value Tier', value: 'High' },
    ],
    'Cart Abandoners': [
      { rule: 'Customer Type', value: 'Prospect or Existing' },
      { rule: 'Behavior', value: 'Added to cart but did not complete purchase' },
      { rule: 'Cart Status', value: 'Abandoned within 7 days' },
      { rule: 'Value Tier', value: 'Medium' },
    ],
    'Bargain Seekers': [
      { rule: 'Customer Type', value: 'Price-Sensitive' },
      { rule: 'Behavior', value: 'Browses sale/clearance pages, uses coupons' },
      { rule: 'Purchase History', value: 'Primarily discounted items' },
      { rule: 'Value Tier', value: 'Low-Medium' },
    ],
    'Browsers': [
      { rule: 'Customer Type', value: 'Prospect' },
      { rule: 'Visit Count', value: '2+' },
      { rule: 'Behavior', value: 'Multiple sessions, no purchase' },
      { rule: 'Value Tier', value: 'Low' },
    ],
  };

  const audienceSegmentsData = audiences.map((a, idx) => ({
    name: a.name,
    priority: idx === 0 ? 'Primary' : 'Secondary',
    targetingRules: audienceTargetingMap[a.name] || [
      { rule: 'Customer Type', value: 'General' },
      { rule: 'Behavior', value: 'Standard browsing patterns' },
      { rule: 'Value Tier', value: 'Medium' },
    ],
  }));

  // --- Content Variants ---
  const contentVariants = [
    {
      name: 'Variant A: Urgency-Focused',
      headline: `Don't Miss Our ${campaignTheme || 'Exclusive'} Deals`,
      body: `Time is running out! Shop the best ${campaignTheme || 'seasonal'} offers before they're gone. Exclusive savings on top categories, curated just for you.`,
      cta: 'Shop Now',
    },
    {
      name: 'Variant B: Value-Focused',
      headline: `Discover ${campaignTheme || 'Premium'} Savings Made for You`,
      body: `Unlock personalized picks and unbeatable value this ${campaignTheme || 'season'}. Hand-selected recommendations based on your style and preferences.`,
      cta: 'Explore Deals',
    },
  ];

  // --- Content Spots (use saved pages if available) ---
  let contentSpotsData: Array<{ page: string; spots: string[] }> = [];
  try {
    const savedPages = usePageStore.getState().pages;
    if (savedPages.length > 0) {
      contentSpotsData = savedPages.map((p) => ({
        page: p.pageName || p.websiteUrl,
        spots: (p.spots || []).map((s) => s.name).filter(Boolean),
      })).filter((p) => p.spots.length > 0);
    }
  } catch {
    // pageStore may not be initialised
  }
  if (contentSpotsData.length === 0) {
    contentSpotsData = [
      {
        page: 'Homepage',
        spots: ['Hero Banner (1920x600)', 'Category Carousel (1080x1080)', 'Promo Strip (1920x80)'],
      },
      {
        page: 'Product Page',
        spots: ['Product Recommendation Rail (350x350)'],
      },
      {
        page: 'Checkout',
        spots: ['Cross-Sell Banner (728x90)'],
      },
    ];
  }

  // --- Duration ---
  const durationMap: Array<{ pattern: RegExp; duration: string }> = [
    { pattern: /black\s*friday/i, duration: 'November 25 - November 30' },
    { pattern: /cyber\s*monday/i, duration: 'November 28 - December 2' },
    { pattern: /summer/i, duration: 'June 1 - August 31' },
    { pattern: /spring/i, duration: 'March 10 - March 31' },
    { pattern: /winter/i, duration: 'December 1 - February 28' },
    { pattern: /holiday/i, duration: 'December 1 - December 31' },
    { pattern: /back\s*to\s*school/i, duration: 'August 1 - September 15' },
    { pattern: /valentine/i, duration: 'February 1 - February 14' },
    { pattern: /easter/i, duration: 'March 15 - April 5' },
    { pattern: /halloween/i, duration: 'October 15 - October 31' },
    { pattern: /new\s*year/i, duration: 'December 26 - January 5' },
    { pattern: /flash\s*sale/i, duration: '48-Hour Flash Event' },
  ];

  let duration = 'March 10 - March 31';
  for (const { pattern, duration: d } of durationMap) {
    if (pattern.test(userMessage)) {
      duration = d;
      break;
    }
  }

  // --- Primary Goal & KPI ---
  let primaryGoal = 'Increase Conversion Rate';
  let kpi = 'Conversion Rate (CR)';
  if (/engag/i.test(lower)) {
    primaryGoal = 'Boost Customer Engagement';
    kpi = 'Pages per Session';
  } else if (/retain|retention|loyal/i.test(lower)) {
    primaryGoal = 'Improve Customer Retention';
    kpi = 'Customer Lifetime Value (CLV)';
  } else if (/revenue|aov|order\s*value/i.test(lower)) {
    primaryGoal = 'Maximize Revenue';
    kpi = 'Revenue per Visitor (RPV)';
  } else if (/awareness|brand/i.test(lower)) {
    primaryGoal = 'Increase Brand Awareness';
    kpi = 'New Visitor Return Rate';
  }

  const draft: CampaignDraft = {
    name,
    description: `AI-generated personalization strategy for ${campaignTheme || 'campaign'} targeting ${audienceList}.`,
    overview,
    audiences,
    goalDescription,
    goalMetric,
    conclusion,
    audienceSegments: audienceSegmentsData,
    contentVariants,
    contentSpots: contentSpotsData,
    duration,
    primaryGoal,
    kpi,
  };

  const chatResponse =
    `I've prepared your **${name}** strategy! Here's a quick summary:\n\n` +
    `- **Audiences:** ${audienceList}\n` +
    `- **Duration:** ${duration}\n` +
    `- **Primary Goal:** ${primaryGoal}\n` +
    `- **KPI:** ${kpi}\n` +
    `- **Content Variants:** ${contentVariants.length} variants (Urgency-Focused & Value-Focused)\n` +
    `- **Content Spots:** ${contentSpotsData.reduce((acc, p) => acc + p.spots.length, 0)} spots across ${contentSpotsData.length} pages\n\n` +
    `You can review the full details in the panel on the right. Click **Create Campaign** to proceed to the wizard, ` +
    `where Step 1 will be pre-populated with the strategy details. Let me know if you'd like any adjustments.`;

  const thinkingSteps = [
    `Analyzing campaign brief... identifying key themes: ${campaignTheme || 'general promotion'}`,
    `Identifying target audiences: ${audienceList}`,
    `Determining campaign duration: ${duration}`,
    `Setting campaign goal and KPI: ${primaryGoal} / ${kpi}`,
    `Generating content variants: Urgency-Focused and Value-Focused`,
    `Mapping content spots across pages`,
    `Building audience segmentation with targeting rules`,
    `Strategy complete — review results in the panel`,
  ];

  return { chatResponse, draft, thinkingSteps };
}

// ============ Auto-persist chat messages ============

let previousMessagesLength = 0;

useChatStore.subscribe((state) => {
  const { messages } = state;

  // Short-circuit: don't overwrite saved history when resetChat clears messages
  if (messages.length === 0) {
    previousMessagesLength = 0;
    return;
  }

  // Avoid unnecessary writes during streaming (length unchanged)
  if (messages.length === previousMessagesLength) return;
  previousMessagesLength = messages.length;

  const briefId = useBriefStore.getState().activeBriefId;
  if (briefId) {
    chatHistoryStorage.saveMessages(briefId, messages);
  }
});
