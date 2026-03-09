/**
 * ChatWindow component — Standalone chat panel for campaign planning conversations.
 * Ported from paid-media-2026-v2 with Emotion CSS converted to Tailwind.
 * Uses IPC via window.aiSuites instead of fetch('/api/...').
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { Send, Square, ChevronUp, ChevronDown, PanelRightClose, Download, BarChart3, MoreHorizontal, Sparkles, User, Plus } from 'lucide-react';
import FormattedAssistantMessage from './FormattedAssistantMessage';

// Helper function to count tokens (rough estimate: ~4 characters per token)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  activities?: string[];
  isThinking?: boolean;
  attachments?: { id: string; file: File; preview?: string }[];
}

// Format message content with proper styling
const FormatMessageContent = ({ content }: { content: string }) => {
  return <FormattedAssistantMessage content={content} />;
};

interface ChatWindowProps {
  message: string;
  setMessage: (message: string) => void;
  chatHistory?: ChatMessage[];
  onChatHistoryChange?: (messages: ChatMessage[]) => void;
  isLeftNavExpanded?: boolean;
  onBack?: () => void;
  chatId?: string | null;
  onCollapse?: () => void;
  onShowVersions?: () => void;
  briefCompleteness?: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  message,
  setMessage,
  chatHistory = [],
  onChatHistoryChange,
  isLeftNavExpanded = false,
  onBack,
  chatId,
  onCollapse,
  onShowVersions,
  briefCompleteness = 95,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(chatHistory);
  const [showMenu, setShowMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Use the chat store for IPC-based communication
  const {
    sendMessage: sendChatMessage,
    isStreaming,
    stopStreaming,
    startSession,
    sessionActive,
  } = useChatStore();

  // Update messages when chatHistory prop changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      setMessages(chatHistory);
    } else if (chatHistory.length === 0 && messages.length > 0) {
      setMessages([]);
    }
  }, [chatHistory, messages.length]);

  // Initialize session on mount
  useEffect(() => {
    if (!sessionActive) {
      startSession();
    }
  }, [sessionActive, startSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleStop = () => {
    stopStreaming();
    setIsLoading(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      type: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    onChatHistoryChange?.(updatedMessages);

    setIsLoading(true);
    const currentMessage = message;
    setMessage('');

    // Add thinking message
    const thinkingMessage: ChatMessage = {
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: true,
      activities: ['Analyzing your request and identifying key requirements...'],
    };
    const messagesWithThinking = [...updatedMessages, thinkingMessage];
    setMessages(messagesWithThinking);

    try {
      // Send via IPC through chatStore
      await sendChatMessage(currentMessage);

      // Get the latest messages from the store after streaming completes
      const storeMessages = useChatStore.getState().messages;
      const lastStoreMsg = storeMessages[storeMessages.length - 1];

      // Replace thinking message with assistant response
      const assistantMessage: ChatMessage = {
        type: 'assistant',
        content: lastStoreMsg?.content || 'I processed your request.',
        timestamp: new Date(),
      };

      const thinkingMessageIndex = messagesWithThinking.length - 1;
      setMessages((currentMessages) => {
        const finalMessages = [...currentMessages];
        if (finalMessages[thinkingMessageIndex]?.isThinking) {
          finalMessages[thinkingMessageIndex] = assistantMessage;
        }
        return finalMessages;
      });

      onChatHistoryChange?.([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        type: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      const thinkingMessageIndex = messagesWithThinking.length - 1;
      setMessages((currentMessages) => {
        const finalMessages = [...currentMessages];
        if (finalMessages[thinkingMessageIndex]?.isThinking) {
          finalMessages[thinkingMessageIndex] = errorMessage;
        }
        return finalMessages;
      });

      onChatHistoryChange?.([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [message, messages, onChatHistoryChange, setMessage, sendChatMessage]);

  // Scroll to top of messages
  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Export chat as Markdown
  const handleExportChat = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let markdown = `# Campaign Builder Chat Export\n\n**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

    messages.forEach((msg) => {
      const role = msg.type === 'user' ? 'You' : 'Campaign Strategist';
      const time = msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      markdown += `## ${role} (${time})\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-chat-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowMenu(false);
  };

  // Calculate chat statistics
  const calculateStats = () => {
    const userMessages = messages.filter((m) => m.type === 'user').length;
    const assistantMessages = messages.filter((m) => m.type === 'assistant').length;

    let inputTokens = 0;
    let outputTokens = 0;

    messages.forEach((msg) => {
      const tokens = estimateTokens(msg.content);
      if (msg.type === 'user') {
        inputTokens += tokens;
      } else if (msg.type === 'assistant') {
        outputTokens += tokens;
      }
    });

    const totalTokens = inputTokens + outputTokens;
    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;
    const totalCost = inputCost + outputCost;

    const firstMessage = messages[0]?.timestamp;
    const lastMessage = messages[messages.length - 1]?.timestamp;
    const duration = firstMessage && lastMessage
      ? Math.floor((lastMessage.getTime() - firstMessage.getTime()) / 1000 / 60)
      : 0;

    return {
      userMessages,
      assistantMessages,
      totalMessages: userMessages + assistantMessages,
      estimatedTokens: totalTokens,
      inputTokens,
      outputTokens,
      estimatedCost: totalCost,
      duration,
    };
  };

  // Full canvas chat view when conversation is active
  if (messages.length > 0) {
    return (
      <div
        className="flex flex-col h-full bg-white transition-all duration-300"
        style={{ left: isLeftNavExpanded ? '240px' : '64px' }}
      >
        {/* Header */}
        <header className="bg-white px-6 py-5 flex flex-col gap-4 shrink-0 rounded-tl-2xl">
          <div className="flex items-center justify-between w-full">
            <h1 className="font-semibold text-xl text-[#212327] truncate">
              Growth Studio
            </h1>
            {/* Panel Collapse Button */}
            <button
              onClick={() => onCollapse?.()}
              className="w-12 h-12 bg-white border border-[#DCE1EA] rounded-lg cursor-pointer flex items-center justify-center p-2 transition-all hover:bg-blue-50 hover:border-blue-500"
              title="Collapse panel"
            >
              <PanelRightClose className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 relative">
          {messages.map((msg, index) => {
            // Thinking indicator
            if (msg.isThinking && msg.type === 'assistant') {
              return (
                <div key={`msg-${msg.timestamp.getTime()}-${index}`} className="flex justify-center w-full py-10">
                  <div className="max-w-[500px] w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse [animation-delay:200ms]" />
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse [animation-delay:400ms]" />
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] bg-clip-text text-transparent">
                      Agent is thinking...
                    </span>
                  </div>
                </div>
              );
            }

            // Normal message rendering
            return (
              <div
                key={`msg-${msg.timestamp.getTime()}-${index}`}
                className={`message-container flex flex-col gap-1.5 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Message Label */}
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      msg.type === 'user' ? 'bg-blue-100' : 'bg-gradient-to-br from-[#6F2EFF] to-[#1957DB]'
                    }`}
                  >
                    {msg.type === 'user' ? (
                      <User className="w-3 h-3 text-[#1957DB]" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  <span className={`font-semibold text-[13px] ${msg.type === 'user' ? 'text-[#1957DB]' : 'text-[#6F2EFF]'}`}>
                    {msg.type === 'user' ? 'You' : 'Campaign Strategist & Planner'}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="max-w-[70%] flex flex-col gap-3">
                  <div className={`rounded-xl px-5 py-4 shadow-sm border border-gray-200 ${msg.type === 'user' ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="text-sm text-gray-700">
                      <FormatMessageContent content={msg.content} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />

          {/* Floating Navigation Controls */}
          {messages.length > 2 && (
            <div className="fixed right-8 bottom-[120px] flex flex-col gap-2 z-50">
              <button
                onClick={scrollToTop}
                aria-label="Scroll to top of conversation"
                title="Scroll to top"
                className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6F2EFF] to-[#1957DB] border-none flex items-center justify-center cursor-pointer shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={scrollToBottom}
                aria-label="Scroll to bottom of conversation"
                title="Scroll to bottom"
                className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6F2EFF] to-[#1957DB] border-none flex items-center justify-center cursor-pointer shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white px-6 py-4 shrink-0">
          <div className="bg-white border border-[#EAEAEA] rounded-[16px] p-4 shadow-[0px_2px_4px_rgba(0,0,0,0.1)] flex flex-col gap-6">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse [animation-delay:200ms]" />
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse [animation-delay:400ms]" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] bg-clip-text text-transparent">
                  Agent is thinking...
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything"
                className="w-full border-none outline-none bg-transparent text-base text-[#212327] placeholder-[#AEAEAE]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            )}
            <div className="flex items-center justify-between">
              {/* Plus button */}
              <button
                className="w-10 h-10 border border-[#EAEAEA] rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50"
                aria-label="Attach file"
              >
                <Plus className="w-5 h-5 text-[#878F9E]" />
              </button>
              <div className="flex gap-4 items-center">
                {/* Stop button - only shows when loading */}
                {isLoading && (
                  <button
                    onClick={handleStop}
                    aria-label="Stop generating response"
                    className="bg-red-600 border-none rounded h-8 px-3 flex items-center cursor-pointer transition-colors hover:bg-red-700"
                  >
                    <span className="text-[13px] text-white font-medium flex items-center gap-1">
                      <Square className="w-3 h-3" />
                      Stop
                    </span>
                  </button>
                )}

                {/* Menu Button */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="bg-transparent border-none cursor-pointer p-2 flex items-center justify-center rounded transition-colors hover:bg-gray-50"
                  >
                    <MoreHorizontal className="w-5 h-5 text-[#878F9E]" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute bottom-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] z-[1000] overflow-hidden">
                      <button
                        onClick={handleExportChat}
                        className="w-full px-4 py-3 border-none bg-transparent text-left text-sm text-gray-800 cursor-pointer transition-colors hover:bg-blue-50 flex items-center gap-3"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                        Export Chat
                      </button>
                      <button
                        onClick={() => {
                          setShowStatsModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 border-none bg-transparent text-left text-sm text-gray-800 cursor-pointer transition-colors hover:bg-blue-50 flex items-center gap-3"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                        View Chat Stats
                      </button>
                    </div>
                  )}
                </div>

                {/* Send button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !message.trim()}
                  aria-label="Send message"
                  className="bg-black border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Stats Modal */}
        {showStatsModal && (() => {
          const stats = calculateStats();
          return (
            <div
              onClick={() => setShowStatsModal(false)}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
            >
              <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-8 max-w-[500px] w-[90%] shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Chat Statistics
                  </h3>
                  <button
                    onClick={() => setShowStatsModal(false)}
                    className="bg-transparent border-none cursor-pointer p-1 text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Total Messages', value: stats.totalMessages },
                    { label: 'Your Messages', value: stats.userMessages },
                    { label: 'AI Responses', value: stats.assistantMessages },
                    { label: 'Estimated Tokens', value: stats.estimatedTokens.toLocaleString() },
                    { label: 'Duration', value: `${stats.duration} min` },
                    { label: 'Est. Cost', value: `$${stats.estimatedCost.toFixed(4)}` },
                  ].map((stat) => (
                    <div key={stat.label} className="flex justify-between px-4 py-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">{stat.label}</span>
                      <span className="text-base font-semibold text-gray-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // Empty state (no messages yet)
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="bg-white px-6 py-5 flex flex-col gap-4 shrink-0 rounded-tl-2xl">
        <div className="flex items-center justify-between w-full">
          <h1 className="font-semibold text-xl text-[#212327] truncate">
            Growth Studio
          </h1>
          {onCollapse && (
            <button
              onClick={() => onCollapse()}
              className="w-12 h-12 bg-white border border-[#DCE1EA] rounded-lg cursor-pointer flex items-center justify-center p-2 transition-all hover:bg-blue-50 hover:border-blue-500"
              title="Collapse panel"
            >
              <PanelRightClose className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Start Planning Your Campaign
          </h2>
          <p className="text-gray-500 mb-8">
            Describe your campaign goals, budget, target audience, and timeline.
            I'll generate a detailed campaign strategy and blueprint.
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white px-6 py-4">
        <div className="bg-white border border-[#EAEAEA] rounded-[16px] p-4 shadow-[0px_2px_4px_rgba(0,0,0,0.1)] flex flex-col gap-6">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything"
            className="w-full border-none outline-none bg-transparent text-base text-[#212327] placeholder-[#AEAEAE]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <button
              className="w-10 h-10 border border-[#EAEAEA] rounded-full bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50"
              aria-label="Attach file"
            >
              <Plus className="w-5 h-5 text-[#878F9E]" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              aria-label="Send message"
              className="bg-black border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
