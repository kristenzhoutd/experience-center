import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useCompanyContextStore } from '../stores/companyContextStore';
import { setActiveContextId } from '../utils/companyContextStorage';
import StreamingChatView from '../components/StreamingChatView';
import CompanyContextEditor from '../components/CompanyContextEditor';

const suggestions = [
  'Build company context from https://yoursite.com',
  'Set up company context for [company name]',
];

export default function CompanyContextPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState('');
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isStreaming,
    isWaitingForResponse,
    streamingSegments,
    startSession,
    sendMessage,
    stopStreaming,
    resetChat,
    setPageContext,
  } = useChatStore();

  const { context, isGenerating, loadContext, setGenerating, clearContext } = useCompanyContextStore();

  // Initialize on mount: set page context for skill routing, load saved context
  useEffect(() => {
    resetChat();

    const state = location.state as { createNew?: boolean; contextId?: string } | null;
    if (state?.createNew) {
      // Clear active selection to start fresh — saved contexts stay in storage
      clearContext();
      setHasStartedSession(false);
    } else if (state?.contextId) {
      // Set the requested context as active then load it
      setActiveContextId(state.contextId);
      loadContext();
    } else {
      loadContext();
    }

    // Clean up the navigation state so refreshes don't re-trigger
    if (state?.createNew || state?.contextId) {
      window.history.replaceState({}, document.title);
    }

    // Tell chatStore all messages from this page should route to company-context skill
    setPageContext('company-context');

    return () => {
      // Reset chat and clear page context when leaving
      resetChat();
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isWaitingForResponse) return;

    const userMessage = input.trim();
    setInput('');

    // All messages from this page route to company-context skill,
    // so show the generating skeleton while the AI works.
    if (!context) {
      setGenerating(true);
    }

    // Lazy session start — same pattern as ChatPage.
    // Start the session on the first message to avoid premature demo mode.
    if (!hasStartedSession) {
      setHasStartedSession(true);
      await startSession();
    }

    await sendMessage(userMessage);
  };

  const handleStop = async () => {
    await stopStreaming();
  };

  const handleCreateNew = () => {
    clearContext();
    resetChat();
    setHasStartedSession(false);
    setInput('');
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const isWorking = isStreaming || isWaitingForResponse;

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden p-4">
          <div className="flex-1 flex gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Left side — Chat (30%) */}
            <div className="w-[30%] flex flex-col">
              {/* Back link + New button */}
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <button
                  onClick={() => navigate('/assets')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Assets
                </button>
                {context && (
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </button>
                )}
              </div>

              {/* Chat messages */}
              <StreamingChatView
                messages={messages}
                streamingSegments={streamingSegments}
                isStreaming={isStreaming}
                isWaitingForResponse={isWaitingForResponse}
              />

              {/* Suggestion chips when no context and no messages */}
              {!context && messages.length === 0 && !isGenerating && (
                <div className="px-4 pb-2 space-y-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                    placeholder={isWorking ? 'Agent is working...' : 'Paste a URL or describe your company'}
                    className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
                    rows={1}
                  />
                  <div className="px-3 py-2 flex items-center justify-end">
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
                        disabled={!input.trim()}
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

            {/* Right side — Editor (70%) */}
            <div className="flex-1 py-4 pr-4">
              <div className="h-full bg-[#fafbfc] rounded-xl overflow-hidden">
                {context ? (
                  <CompanyContextEditor onDelete={() => navigate('/assets')} />
                ) : isGenerating ? (
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">Company Context</span>
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full">generating</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {['Company Overview', 'Competitors', 'Personas', 'Regulatory Frameworks', 'Category Benchmarks', 'Seasonal Trends'].map((title) => (
                        <div key={title} className="bg-white rounded-xl border border-gray-200 p-5">
                          <div className="text-sm font-medium text-gray-900 mb-3">{title}</div>
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 text-center">
                      <p className="text-xs text-gray-400 animate-pulse">AI is building your company context...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">Build Your Company Context</h3>
                    <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                      Paste a website URL to automatically build your company context, or describe your company in the chat.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
