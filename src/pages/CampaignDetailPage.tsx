import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import { useChatStore } from '../stores/chatStore';
import CampaignConfigurationWizard from '../components/CampaignConfigurationWizard';
import StreamingChatView from '../components/StreamingChatView';
import PointerButton from '../components/chat/PointerButton';
import ReferenceBanner from '../components/chat/ReferenceBanner';
import { useChatPointerStore } from '../stores/chatPointerStore';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isStreaming,
    isWaitingForResponse,
    streamingSegments,
    startSession,
    sendMessage,
    stopStreaming,
  } = useChatStore();

  // Start a chat session on mount
  const sessionStartedRef = useRef(false);
  useEffect(() => {
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;
      startSession();
    }
  }, [startSession]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      await useCampaignConfigStore.getState().loadExistingConfig(id);
      if (cancelled) return;

      const loaded = useCampaignConfigStore.getState().config;
      if (!loaded) {
        setNotFound(true);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleComplete = () => {
    useCampaignConfigStore.getState().reset();
    navigate('/campaigns');
  };

  const handleCancel = () => {
    // Auto-save as draft so work is not lost
    const store = useCampaignConfigStore.getState();
    if (store.config) {
      store.saveAsDraft();
    }
    store.reset();
    navigate('/campaigns');
  };

  const isWorking = isStreaming || isWaitingForResponse;

  const handleSend = async () => {
    if (!input.trim() || isWorking) return;
    let userMessage = input.trim();
    setInput('');

    // Prepend element reference XML if any references are selected
    const pointerStore = useChatPointerStore.getState();
    const referenceXml = pointerStore.getInjectionXml();
    if (referenceXml) {
      userMessage = referenceXml + userMessage;
      pointerStore.clearReferences();
    }

    await sendMessage(userMessage);
  };

  const handleStop = async () => {
    await stopStreaming();
  };

  if (isLoading) {
    return (
      <div className="h-full p-6">
        <div className="h-full bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-4 mx-auto w-12 h-12">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-black animate-spin" />
            </div>
            <p className="text-sm text-gray-500">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-full p-6">
        <div className="h-full bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
          <div className="text-center px-6">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-900 mb-1">Campaign not found</h2>
            <p className="text-sm text-gray-500 mb-6">
              This campaign may have been deleted or the link is invalid.
            </p>
            <button
              onClick={() => navigate('/campaigns')}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden p-4">
      <div className="flex-1 flex gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Left side - Chat (30%) */}
        <div className="w-[30%] flex flex-col">
          <StreamingChatView
            messages={messages}
            streamingSegments={streamingSegments}
            isStreaming={isStreaming}
            isWaitingForResponse={isWaitingForResponse}
          />

          {/* Chat input */}
          <div className="p-4">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                placeholder={isWorking ? "Agent is working..." : "Ask anything about this campaign..."}
                className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
                rows={1}
              />
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
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

        {/* Right side - Wizard (70%) */}
        <div className="flex-1 py-4 pr-4">
          <div className="h-full bg-[#fafbfc] rounded-xl overflow-hidden">
            <CampaignConfigurationWizard
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
