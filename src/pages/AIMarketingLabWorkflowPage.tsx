import { useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import SplitPaneLayout from '../components/campaign/SplitPaneLayout';
import { useMarketingLabStore } from '../stores/marketingLabStore';
import { generateMarketingLabOutputs } from '../services/marketingLabOutputs';

const objectiveOptions = ['Increase Awareness', 'Drive Conversions', 'Boost Retention', 'Launch New Product'];
const audienceOptions = ['New Customers', 'Lapsed Users', 'High-Value Segments', 'Lookalike Audiences'];
const channelOptions = ['Email', 'Push Notifications', 'In-App', 'Paid Social', 'Display Ads'];

export default function AIMarketingLabWorkflowPage() {
  const {
    currentStep,
    chatMessages,
    channels,
    outputs,
    setObjective,
    setAudience,
    setChannels,
    advanceStep,
    addChatMessage,
    setOutputs,
  } = useMarketingLabStore();

  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, currentStep]);

  const handleObjectiveSelect = (option: string) => {
    setObjective(option);
    addChatMessage({ id: `user-${Date.now()}`, role: 'user', content: option });
    addChatMessage({
      id: `ai-${Date.now() + 1}`,
      role: 'ai',
      content: `Great choice — "${option}". Now, who is your target audience for this campaign?`,
      options: audienceOptions,
      stepKey: 'audience',
    });
    advanceStep();
  };

  const handleAudienceSelect = (option: string) => {
    setAudience(option);
    addChatMessage({ id: `user-${Date.now()}`, role: 'user', content: option });
    addChatMessage({
      id: `ai-${Date.now() + 1}`,
      role: 'ai',
      content: `Targeting "${option}" — excellent. Finally, which marketing channels would you like to activate? Select all that apply, then click **Generate Plan**.`,
      options: channelOptions,
      multiSelect: true,
      stepKey: 'channels',
    });
    advanceStep();
  };

  const handleChannelToggle = (channel: string) => {
    setMultiSelections((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleGenerate = () => {
    if (multiSelections.length === 0) return;

    setChannels(multiSelections);
    addChatMessage({ id: `user-${Date.now()}`, role: 'user', content: `Channels: ${multiSelections.join(', ')}` });
    addChatMessage({
      id: `ai-${Date.now() + 1}`,
      role: 'ai',
      content: 'Your marketing plan is ready! Review the outputs in the panel to the right.',
    });

    const state = useMarketingLabStore.getState();
    const results = generateMarketingLabOutputs({
      industry: state.industry,
      useCase: state.useCase,
      objective: state.objective,
      audience: state.audience,
      channels: multiSelections,
    });
    setOutputs(results);
    advanceStep();
  };

  // Find the last AI message that has options (the active question)
  const lastOptionsMsgId = [...chatMessages].reverse().find((m) => m.role === 'ai' && m.options)?.id || null;

  return (
    <div className="h-full p-4">
      <div className="h-full flex rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden bg-white">
        <SplitPaneLayout initialLeftWidth={40} collapsed={collapsed} onToggleCollapse={() => setCollapsed(false)}>
          {/* Left Panel — Guided Chat */}
          <div className="flex flex-col h-full bg-white">
            {/* Header with close button */}
            <div className="shrink-0 flex items-center justify-end px-4 pt-3">
              <button
                onClick={() => setCollapsed(true)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                title="Close chat"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[90%] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px]'
                          : 'text-gray-700'
                      }`}
                    >
                      {msg.content.split('\n').map((line, li) => (
                        <p key={li} className="m-0 mb-1 last:mb-0" dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Inline option chips — only on the active question */}
                  {msg.options && msg.id === lastOptionsMsgId && (
                    <div className="mt-2 ml-0">
                      <div className="flex flex-wrap gap-1.5">
                        {msg.options.map((option) => {
                          const isSelected = msg.multiSelect && multiSelections.includes(option);
                          return (
                            <button
                              key={option}
                              onClick={() => msg.multiSelect ? handleChannelToggle(option) : (
                                msg.stepKey === 'audience' ? handleAudienceSelect(option) : handleObjectiveSelect(option)
                              )}
                              className={`px-3 py-1.5 rounded-full text-[12px] transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {msg.multiSelect && (
                        <button
                          onClick={handleGenerate}
                          disabled={multiSelections.length === 0}
                          className={`mt-2 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer border-none ${
                            multiSelections.length > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          Generate Plan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom hint */}
            <div className="shrink-0 p-4">
              {currentStep <= 2 ? (
                <div className="text-center text-[12px] text-gray-400 py-2">
                  Select an option above to continue
                </div>
              ) : (
                <div className="text-center text-[12px] text-gray-400 py-2">
                  Plan generated — review the outputs on the right
                </div>
              )}
            </div>
          </div>

          {/* Right Panel — Output Display */}
          <div className="h-full overflow-y-auto bg-white border-l border-gray-100">
            {outputs.length === 0 ? (
              <div className="flex items-center justify-center h-full px-8">
                <p className="text-gray-400 text-sm text-center">Your marketing plan will appear here after you complete the guided flow.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {outputs.map((section, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.title}</h3>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {section.content.split('\n').map((line, li) => (
                        <p key={li} className="m-0 mb-1 last:mb-0" dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SplitPaneLayout>
      </div>
    </div>
  );
}
