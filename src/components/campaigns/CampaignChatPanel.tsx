/**
 * CampaignChatPanel — Slide-in chat interface for the campaigns page
 * Matches the Command Center chat panel layout and behavior
 */

import { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CampaignChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const campaignSuggestions = [
  'Which campaigns are top performers?',
  'Show me campaigns that need attention',
  'What should I launch next?',
  'Compare channel performance this week',
];

const campaignResponses: Record<string, string> = {
  'Which campaigns are top performers?':
    "Your **top 3 campaigns** by ROAS:\n\n1. **Summer Sale - Lookalikes** — 6.8x ROAS, $48K revenue (Meta)\n2. **Healthcare Awareness Q1** — 5.2x ROAS, $37K revenue (TikTok)\n3. **Spring Collection Retarget** — 4.5x ROAS, $28K revenue (Google)\n\nThe Summer Sale campaign is scaling well — consider increasing its budget by 20%.",
  'Show me campaigns that need attention':
    "**2 campaigns** need attention:\n\n⚠️ **Brand Video Awareness** — ROAS dropped to 2.1x, down 8% this week. Creative fatigue detected on the main video asset.\n\n⚠️ **Product Launch Display** — ROAS at 1.4x, below your 2.0x threshold. CPA has increased 15% over the past 2 weeks.\n\nI'd recommend pausing the display campaign and refreshing the video creative.",
  'What should I launch next?':
    "Based on your current performance data, I'd suggest:\n\n1. **Lookalike expansion on TikTok** — Your TikTok campaigns have the highest ROAS (5.2x). A lookalike audience campaign could scale this efficiently.\n\n2. **Retargeting for cart abandoners** — Your cart abandonment rate is 34%. A cross-channel retargeting campaign could recover $12-15K in monthly revenue.\n\n3. **Google Shopping expansion** — ROAS is strong at 3.9x with room to scale spend.",
  'Compare channel performance this week':
    "**Channel performance this week:**\n\n| Channel | ROAS | CPA | Trend |\n|---------|------|-----|-------|\n| TikTok | 5.2x | $28 | ↑ +8% |\n| Meta | 4.1x | $38 | ↑ +3% |\n| Google Shop | 3.9x | $32 | ↑ +5% |\n| Google Search | 3.0x | $42 | → flat |\n| YouTube | 2.2x | $56 | ↓ -4% |\n\n**TikTok** continues to lead. Consider shifting $3K from YouTube to TikTok.",
};

function generateFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('budget')) return 'Your total ad spend is **$6,800** this period with 73% budget utilization. You\'re on track for monthly targets. Meta has the largest allocation at $35K.';
  if (lower.includes('roas') || lower.includes('roi')) return 'Your blended ROAS is **3.8x** across all channels. TikTok leads at 5.2x while LinkedIn trails at 1.7x. Overall ROAS is up 15% vs last period.';
  if (lower.includes('creative')) return 'You have **24 active creatives** across campaigns. 2 are showing fatigue signals (CTR down >15% over 14 days). Your top creative is "Summer Vibes Carousel" driving 68% of conversions.';
  return "I can help you analyze campaign performance, compare channels, identify optimization opportunities, or plan your next campaign. What would you like to explore?";
}

export default function CampaignChatPanel({ isOpen, onClose }: CampaignChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Campaign Assistant. I can help you find campaigns, analyze performance, and identify opportunities. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = campaignResponses[message] || generateFallbackResponse(message);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <div
      className={`shrink-0 flex flex-col bg-white rounded-l-2xl border-y border-l border-gray-100 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[380px] opacity-100' : 'w-0 opacity-0 border-0 p-0'
      }`}
    >
      {isOpen && (
        <>
          {/* Header */}
          <div className="shrink-0 px-4 pt-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-900 shadow-sm">
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px]'
                        : 'text-gray-700'
                    }`}
                  >
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className="m-0 mb-1 last:mb-0" dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="shrink-0 px-5 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {campaignSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border-none font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your campaigns..."
                className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent"
                disabled={isTyping}
              />
              <div className="px-3 py-2 flex items-center justify-end">
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
