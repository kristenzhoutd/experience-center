/**
 * Campaign Analysis Page — split-pane layout with chat (left) and analysis dashboard (right).
 * Loads campaign config from route param :id and renders analysis results.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronLeft, BarChart3 } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useCampaignAnalysisStore } from '../stores/campaignAnalysisStore';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import SplitPaneLayout from '../components/campaign/SplitPaneLayout';
import StreamingChatView from '../components/StreamingChatView';
import CampaignAnalysisDashboard from '../components/analysis/CampaignAnalysisDashboard';
import { generateCampaignDashboardMocks } from '../services/campaignDashboardMocks';

export default function CampaignAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages, streamingSegments, isStreaming, isWaitingForResponse, sendMessage, startSession, stopStreaming,
  } = useChatStore();

  const { currentAnalysis, clearAnalysis } = useCampaignAnalysisStore();
  const { config, loadExistingConfig } = useCampaignConfigStore();

  // Load campaign config when page mounts
  useEffect(() => {
    if (id) {
      loadExistingConfig(id);
    }
  }, [id, loadExistingConfig]);

  // Auto-generate mock dashboard data when campaign config loads
  const [hasMockDataLoaded, setHasMockDataLoaded] = useState(false);
  useEffect(() => {
    if (config && !currentAnalysis && !hasMockDataLoaded) {
      setHasMockDataLoaded(true);
      const mockAnalysis = generateCampaignDashboardMocks(config);
      useCampaignAnalysisStore.getState().setAnalysis(mockAnalysis);
    }
  }, [config, currentAnalysis, hasMockDataLoaded]);

  const handleBack = useCallback(() => {
    clearAnalysis();
    navigate(id ? `/campaigns/${id}` : '/campaigns');
  }, [clearAnalysis, navigate, id]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Set suite context for personalization
  useEffect(() => {
    useChatStore.getState().setActiveSuite('personalization');
    return () => useChatStore.getState().setActiveSuite(null);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isWaitingForResponse) return;

    const userMessage = input.trim();
    setInput('');

    // Inject campaign context into the message
    const contextMessage = `<campaign-context>
Campaign: ${currentAnalysis?.campaign.name || 'Unknown'}
Status: ${currentAnalysis?.campaign.status || 'N/A'}
Date Range: ${currentAnalysis?.campaign.startDate || 'N/A'} to ${currentAnalysis?.campaign.endDate || 'N/A'}
Audiences: ${currentAnalysis?.campaign.audiences.join(', ') || 'None'}
</campaign-context>

${userMessage}`;

    // Start session if needed
    if (messages.length === 0) {
      await startSession();
    }

    await sendMessage(contextMessage);
  };

  const handleStop = async () => {
    await stopStreaming();
  };

  const isWorking = isStreaming || isWaitingForResponse;

  return (
    <div className="h-full overflow-hidden bg-[#F7F8FB] flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-gray-300 transition-colors cursor-pointer bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="h-5 w-px bg-gray-200" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {currentAnalysis?.campaign?.name || config?.setup?.name || 'Campaign Analysis'}
                </h2>
                <p className="text-[10px] text-gray-400">
                  {currentAnalysis
                    ? `${currentAnalysis.kpis.length} KPIs · ${currentAnalysis.aiInsights.suggestions.length} insights`
                    : 'Loading campaign data...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Pane: Chat (left) + Dashboard (right) */}
      <div className="flex-1 overflow-hidden px-6 pb-4">
        <SplitPaneLayout
          initialLeftWidth={33}
          collapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed((prev) => !prev)}
        >
          {/* Left Panel — Chat */}
          <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-gray-100">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Analysis Chat</span>
              <button
                onClick={() => setIsChatCollapsed(true)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                title="Collapse chat"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 && !isStreaming && !isWaitingForResponse ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-3" />
                    <p className="text-xs text-gray-400 leading-relaxed">Ask questions about your campaign performance, metrics, or insights</p>
                  </div>
                </div>
              ) : (
                <StreamingChatView
                  messages={messages}
                  streamingSegments={streamingSegments}
                  isStreaming={isStreaming}
                  isWaitingForResponse={isWaitingForResponse}
                />
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              <div className="bg-white rounded-xl border border-gray-200">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isWorking) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isWorking ? "Analyzing..." : "Ask about campaign metrics, trends, or insights..."}
                  className="w-full px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none rounded-t-xl"
                  rows={1}
                  disabled={isWorking}
                />
                <div className="px-3 py-2 flex items-center justify-end border-t border-gray-100">
                  {isWorking ? (
                    <button
                      onClick={handleStop}
                      className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                      title="Stop generating"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Send message"
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

          {/* Right Panel — Analysis Dashboard */}
          <div className="h-full overflow-y-auto bg-[#F7F8FB] rounded-2xl">
            {currentAnalysis ? (
              <CampaignAnalysisDashboard analysis={currentAnalysis} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-400">Loading campaign dashboard...</p>
                </div>
              </div>
            )}
          </div>
        </SplitPaneLayout>
      </div>
    </div>
  );
}
