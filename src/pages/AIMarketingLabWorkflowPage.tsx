import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Sparkles, ArrowRight,
  ShoppingBag, Plane, Package, Car, Film, Landmark,
  Clock, Star, Send, RotateCcw,
  Target, Lightbulb, TrendingUp, Shield,
  Loader2,
} from 'lucide-react';
import SplitPaneLayout from '../components/campaign/SplitPaneLayout';
import { useExperienceLabStore, type FlowStep, type OutputData } from '../stores/experienceLabStore';
import { goals, industries, scenarios, getScenarioSteps, generationSteps, type InputStep } from '../data/experienceLabConfig';
import { generateExperienceLabOutput } from '../services/experienceLabOutputs';

// ============================================================
// Icon maps
// ============================================================
const industryIcons: Record<string, React.ElementType> = {
  'shopping-bag': ShoppingBag, plane: Plane, package: Package,
  car: Car, film: Film, landmark: Landmark,
};

// ============================================================
// Stepper config
// ============================================================
const EXPERIENCE_STEPS: { id: number; key: FlowStep | 'goal'; label: string }[] = [
  { id: 1, key: 'goal', label: 'Goal' },
  { id: 2, key: 'industry', label: 'Industry' },
  { id: 3, key: 'scenario', label: 'Scenario' },
  { id: 4, key: 'inputs', label: 'Inputs' },
  { id: 5, key: 'output', label: 'Outcome' },
];

const stepOrder: (FlowStep | 'goal')[] = ['goal', 'industry', 'scenario', 'inputs', 'generating', 'output'];

function stepIndex(step: FlowStep | 'goal'): number {
  return stepOrder.indexOf(step);
}

// ============================================================
// Chat message model
// ============================================================
interface ConversationMessage {
  id: string;
  role: 'ai' | 'user' | 'thinking';
  content: string;
  type?: 'text' | 'industry-cards' | 'scenario-cards' | 'input-options' | 'generation' | 'output-ready' | 'cta';
  stepKey?: string;
  multiSelect?: boolean;
}

// ============================================================
// Main Component
// ============================================================
export default function AIMarketingLabWorkflowPage() {
  const navigate = useNavigate();
  const store = useExperienceLabStore();
  const {
    goal, industry, scenario, inputs, currentStep,
    currentInputStep, generationPhase, output,
    activePanelTab,
    setIndustry, setScenario, setInput, setCurrentStep,
    setCurrentInputStep, startGeneration, setGenerationPhase,
    finishGeneration, setActivePanelTab, resetSession,
  } = store;

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showCTA, setShowCTA] = useState(false);
  const [visibleOutputSections, setVisibleOutputSections] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasOutput = currentStep === 'output' && !!output;

  // Redirect if no goal selected
  useEffect(() => {
    if (!goal) navigate('/ai-marketing-lab', { replace: true });
  }, [goal, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStep, currentInputStep, generationPhase]);

  // Get input steps for current scenario + industry
  const inputSteps = scenario ? getScenarioSteps(scenario, industry) : [];

  // ============================================================
  // Initialize first message
  // ============================================================
  useEffect(() => {
    if (goal && messages.length === 0) {
      const goalLabel = goals.find(g => g.id === goal)?.label || goal;
      setMessages([{
        id: 'ai-welcome',
        role: 'ai',
        content: `Great choice \u2014 "${goalLabel}". Let's build a tailored outcome for you.\n\nFirst, which industry best describes your business?`,
        type: 'industry-cards',
      }]);
    }
  }, [goal]);

  // ============================================================
  // Chat helpers
  // ============================================================
  const addAIMessage = (content: string, type?: ConversationMessage['type'], stepKey?: string, multiSelect?: boolean) => {
    setMessages(prev => [...prev, {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content,
      type,
      stepKey,
      multiSelect,
    }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    }]);
  };

  // Show typing dots, then replace with AI message after delay
  const addAIMessageWithTyping = (content: string, type?: ConversationMessage['type'], stepKey?: string, multiSelect?: boolean) => {
    const thinkingId = `thinking-${Date.now()}`;
    setMessages(prev => [...prev, { id: thinkingId, role: 'thinking', content: '' }]);
    setTimeout(() => {
      setMessages(prev => [
        ...prev.filter(m => m.id !== thinkingId),
        { id: `ai-${Date.now()}`, role: 'ai', content, type, stepKey, multiSelect },
      ]);
    }, 800);
  };

  // ============================================================
  // Selection handlers
  // ============================================================
  const handleIndustrySelect = (id: string) => {
    const label = industries.find(i => i.id === id)?.label || id;
    setIndustry(id);
    addUserMessage(label);
    setCurrentStep('scenario');
    setTimeout(() => {
      addAIMessageWithTyping(
        `${label} \u2014 excellent. Now, which scenario would you like to explore?`,
        'scenario-cards',
      );
    }, 300);
  };

  const handleScenarioSelect = (id: string) => {
    const label = scenarios.find(s => s.id === id)?.label || id;
    setScenario(id);
    addUserMessage(label);
    setCurrentStep('inputs');
    setCurrentInputStep(0);
    const steps = getScenarioSteps(id, industry);
    setTimeout(() => {
      if (steps[0]) {
        addAIMessageWithTyping(
          steps[0].question + (steps[0].subtitle ? `\n${steps[0].subtitle}` : ''),
          'input-options',
          steps[0].id,
          steps[0].multiSelect,
        );
      }
    }, 300);
  };

  const handleInputSelect = (stepId: string, value: string | string[]) => {
    setInput(stepId, value);
  };

  const handleInputContinue = () => {
    const step = inputSteps[currentInputStep];
    if (!step) return;
    // Read from store directly to avoid stale closure on single-select auto-advance
    const currentInputs = useExperienceLabStore.getState().inputs;
    const val = currentInputs[step.id];
    const lookupLabel = (id: string) => step.options.find(o => o.id === id)?.label || id.replace(/-/g, ' ');
    const displayVal = Array.isArray(val)
      ? val.map(lookupLabel).join(', ')
      : (typeof val === 'string' ? lookupLabel(val) : '');
    addUserMessage(displayVal);

    const nextIdx = currentInputStep + 1;
    if (nextIdx < inputSteps.length) {
      setCurrentInputStep(nextIdx);
      const nextStep = inputSteps[nextIdx];
      setTimeout(() => {
        addAIMessageWithTyping(
          nextStep.question + (nextStep.subtitle ? `\n${nextStep.subtitle}` : ''),
          'input-options',
          nextStep.id,
          nextStep.multiSelect,
        );
      }, 300);
    } else {
      setTimeout(() => runGeneration(), 300);
    }
  };

  // ============================================================
  // Generation
  // ============================================================
  const runGeneration = useCallback(() => {
    startGeneration();
    addAIMessage('Generating your personalized outcome...', 'generation');

    let phase = 0;
    const interval = setInterval(() => {
      phase++;
      if (phase >= generationSteps.length) {
        clearInterval(interval);
        const result = generateExperienceLabOutput({ goal, industry, scenario, inputs });
        finishGeneration(result);
        setMessages(prev => {
          const filtered = prev.filter(m => m.type !== 'generation');
          return [
            ...filtered,
            { id: `ai-output-${Date.now()}`, role: 'ai' as const, content: 'Your AI-generated outcome is ready. Review the structured result on the right.', type: 'output-ready' as const },
            { id: `ai-cta-${Date.now() + 1}`, role: 'ai' as const, content: '', type: 'cta' as const },
          ];
        });
      } else {
        setGenerationPhase(phase);
      }
    }, 1100);
  }, [goal, industry, scenario, inputs, startGeneration, setGenerationPhase, finishGeneration]);

  // Progressive output reveal
  useEffect(() => {
    if (currentStep === 'output' && output) {
      setVisibleOutputSections(0);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleOutputSections(count);
        if (count >= 7) {
          clearInterval(interval);
          setTimeout(() => setShowCTA(true), 600);
        }
      }, 250);
      return () => clearInterval(interval);
    }
  }, [currentStep, output]);

  // ============================================================
  // Stepper
  // ============================================================
  const getCurrentVisualStep = (): number => {
    if (currentStep === 'industry') return 2;
    if (currentStep === 'scenario') return 3;
    if (currentStep === 'inputs') return 4;
    if (currentStep === 'generating' || currentStep === 'output') return 5;
    return 2;
  };

  const currentVisualStep = getCurrentVisualStep();

  const handleStepperClick = (stepNum: number) => {
    const step = EXPERIENCE_STEPS[stepNum - 1];
    if (!step) return;
    if (step.key === 'goal') {
      navigate('/ai-marketing-lab');
      return;
    }
    const targetIdx = stepIndex(step.key);
    const currentIdx = stepIndex(currentStep);
    if (targetIdx < currentIdx && step.key !== 'generating') {
      setCurrentStep(step.key as FlowStep);
      if (step.key === 'inputs') setCurrentInputStep(0);
      setShowCTA(false);
    }
  };

  const handleRestart = () => {
    resetSession();
    navigate('/ai-marketing-lab');
  };

  // ============================================================
  // Input validation
  // ============================================================
  const canContinueInput = (): boolean => {
    if (currentStep !== 'inputs') return false;
    const step = inputSteps[currentInputStep];
    if (!step) return false;
    const val = inputs[step.id];
    if (step.multiSelect) return Array.isArray(val) && val.length > 0;
    return !!val;
  };

  // ============================================================
  // Render
  // ============================================================
  if (!goal) return null;

  const lastAIMessage = [...messages].reverse().find(m => m.role === 'ai');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Horizontal Stepper (top) ── */}
      <HorizontalStepper
        currentStep={currentVisualStep}
        onStepClick={handleStepperClick}
      />

      {/* ── Main Layout ── */}
      <div className="flex-1 overflow-hidden p-4 pt-0">
        <div className="h-full flex rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden bg-white">
          {hasOutput ? (
            /* Post-output: SplitPaneLayout with chat (left) + output (right) */
            <SplitPaneLayout
              initialLeftWidth={35}
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed(false)}
            >
              {/* Left: Chat */}
              <ChatPanel
                messages={messages}
                currentStep={currentStep}
                lastAIMessage={lastAIMessage}
                industry={industry}
                scenario={scenario}
                inputs={inputs}
                inputSteps={inputSteps}
                currentInputStep={currentInputStep}
                generationPhase={generationPhase}
                showCTA={showCTA}
                onIndustrySelect={handleIndustrySelect}
                onScenarioSelect={handleScenarioSelect}
                onInputSelect={handleInputSelect}
                onInputContinue={handleInputContinue}
                canContinueInput={canContinueInput()}
                onRestart={handleRestart}
                onExploreAnother={() => {
                  setCurrentStep('scenario');
                  setShowCTA(false);
                  addAIMessage('Would you like to try a different scenario?', 'scenario-cards');
                }}
                messagesEndRef={messagesEndRef}
                showCollapse
                onCollapse={() => setCollapsed(true)}
              />
              {/* Right: Output */}
              <div className="h-full flex flex-col bg-white">
                <div className="flex-1 overflow-y-auto p-6">
                  <OutputDisplay output={output!} visibleSections={visibleOutputSections} />
                </div>
                {visibleOutputSections >= 7 && (
                  <div className="shrink-0 px-4 pb-4">
                    <FloatingContextCard
                      goal={goal}
                      industry={industry}
                      scenario={scenario}
                      inputs={inputs}
                      inputSteps={inputSteps}
                      output={output!}
                      activeTab={activePanelTab}
                      onTabChange={setActivePanelTab}
                    />
                  </div>
                )}
              </div>
            </SplitPaneLayout>
          ) : (
            /* Pre-output: Full-width chat */
            <ChatPanel
              messages={messages}
              currentStep={currentStep}
              lastAIMessage={lastAIMessage}
              industry={industry}
              scenario={scenario}
              inputs={inputs}
              inputSteps={inputSteps}
              currentInputStep={currentInputStep}
              generationPhase={generationPhase}
              showCTA={showCTA}
              onIndustrySelect={handleIndustrySelect}
              onScenarioSelect={handleScenarioSelect}
              onInputSelect={handleInputSelect}
              onInputContinue={handleInputContinue}
              canContinueInput={canContinueInput()}
              onRestart={handleRestart}
              onExploreAnother={() => {
                setCurrentStep('scenario');
                setShowCTA(false);
                addAIMessage('Would you like to try a different scenario?', 'scenario-cards');
              }}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Chat Panel (shared between full-width and split-view modes)
// ============================================================
function ChatPanel({
  messages, currentStep, lastAIMessage, industry, scenario, inputs,
  inputSteps, currentInputStep, generationPhase, showCTA,
  onIndustrySelect, onScenarioSelect, onInputSelect, onInputContinue,
  canContinueInput, onRestart, onExploreAnother, messagesEndRef,
  showCollapse, onCollapse,
}: {
  messages: ConversationMessage[];
  currentStep: FlowStep;
  lastAIMessage: ConversationMessage | undefined;
  industry: string;
  scenario: string;
  inputs: Record<string, string | string[]>;
  inputSteps: InputStep[];
  currentInputStep: number;
  generationPhase: number;
  showCTA: boolean;
  onIndustrySelect: (id: string) => void;
  onScenarioSelect: (id: string) => void;
  onInputSelect: (stepId: string, value: string | string[]) => void;
  onInputContinue: () => void;
  canContinueInput: boolean;
  onRestart: () => void;
  onExploreAnother: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showCollapse?: boolean;
  onCollapse?: () => void;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header — only shown with collapse button */}
      {showCollapse && (
        <div className="px-6 py-3 flex items-center shrink-0">
          <div className="flex-1" />
          <button
            onClick={onCollapse}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            title="Collapse chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === 'cta' && currentStep === 'output' && showCTA ? (
              <CTACards onRestart={onRestart} onExploreAnother={onExploreAnother} />
            ) : msg.role === 'thinking' ? (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-center gap-1.5 px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse [animation-delay:200ms]" />
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1957DB] to-[#6F2EFF] animate-pulse [animation-delay:400ms]" />
                </div>
              </div>
            ) : (
              <>
                {msg.content && (
                  <div className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="max-w-[80%] px-5 py-3 bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px] rounded-br-[4px]">
                        <div className="text-sm leading-relaxed">{msg.content}</div>
                      </div>
                    ) : (
                      <div className="max-w-[85%] px-1">
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{msg.content}</div>
                      </div>
                    )}
                  </div>
                )}
                {msg.role === 'ai' && msg.id === lastAIMessage?.id && (
                  <div className="mt-4 px-1 animate-fade-in-delay-1">
                    {msg.type === 'industry-cards' && currentStep === 'industry' && (
                      <IndustryCards industry={industry} onSelect={onIndustrySelect} />
                    )}
                    {msg.type === 'scenario-cards' && currentStep === 'scenario' && (
                      <ScenarioCards scenario={scenario} onSelect={onScenarioSelect} />
                    )}
                    {msg.type === 'input-options' && currentStep === 'inputs' && msg.stepKey === inputSteps[currentInputStep]?.id && (
                      <InputChips
                        step={inputSteps[currentInputStep]}
                        value={inputs[inputSteps[currentInputStep].id]}
                        onSelect={(val) => onInputSelect(inputSteps[currentInputStep].id, val)}
                        onContinue={onInputContinue}
                        canContinue={canContinueInput}
                        isLastStep={currentInputStep === inputSteps.length - 1}
                      />
                    )}
                    {msg.type === 'generation' && currentStep === 'generating' && (
                      <GenerationProgress phase={generationPhase} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom hint */}
      <div className="shrink-0 px-6 py-3">
        <div className="text-center text-[12px] text-gray-400">
          {currentStep === 'output'
            ? 'AI-generated recommendation designed for human review'
            : 'Select an option above to continue'}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Horizontal Stepper (modeled after WizardStepper)
// ============================================================
function HorizontalStepper({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-center gap-2">
        {EXPERIENCE_STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = !isActive && (isCompleted || step.key === 'goal');

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable && !isActive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-black/5 cursor-default'
                    : isClickable
                      ? 'cursor-pointer hover:bg-black/[0.04]'
                      : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-transform ${
                    isCompleted
                      ? 'bg-[#34D399] text-white'
                      : isActive
                        ? 'bg-black text-white'
                        : 'bg-black/5 text-black'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={`text-sm transition-colors ${
                    isActive
                      ? 'text-black font-medium'
                      : isClickable
                        ? 'text-black/60 hover:text-black'
                        : 'text-black/30'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {idx < EXPERIENCE_STEPS.length - 1 && (
                <svg className="w-4 h-4 mx-1 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Industry Cards
// ============================================================
function IndustryCards({ industry, onSelect }: { industry: string; onSelect: (id: string) => void }) {
  return (
    <div className="max-w-xl">
      <div className="grid grid-cols-3 gap-3">
        {industries.filter(i => i.enabled).map((item) => {
          const Icon = industryIcons[item.icon] || ShoppingBag;
          const isSelected = industry === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative border rounded-2xl p-4 cursor-pointer transition-all text-left ${
                isSelected
                  ? 'border-blue-400 bg-blue-50/60 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="font-medium text-sm text-gray-900">{item.label}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.description}</div>
            </button>
          );
        })}
        {industries.filter(i => !i.enabled).map((item) => {
          const Icon = industryIcons[item.icon] || ShoppingBag;
          return (
            <div key={item.id} className="border border-gray-100 rounded-2xl p-4 opacity-35">
              <Icon className="w-5 h-5 mb-2 text-gray-300" />
              <div className="font-medium text-sm text-gray-400">{item.label}</div>
              <div className="text-[10px] text-gray-300 mt-0.5">Coming soon</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Scenario Cards
// ============================================================
function ScenarioCards({ scenario, onSelect }: { scenario: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-xl">
      {scenarios.map((item) => {
        const isSelected = scenario === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`relative border rounded-2xl p-4 cursor-pointer transition-all text-left ${
              isSelected
                ? 'border-blue-400 bg-blue-50/60 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            {item.badge && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold mb-2">
                <Star className="w-3 h-3" />
                {item.badge}
              </div>
            )}
            <div className="font-medium text-sm text-gray-900 mb-1">{item.label}</div>
            <div className="text-[11px] text-gray-500 leading-relaxed mb-2">{item.description}</div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />
              {item.estimatedTime}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Input Chips
// ============================================================
function InputChips({
  step, value, onSelect, onContinue, canContinue, isLastStep,
}: {
  step: InputStep;
  value: string | string[] | undefined;
  onSelect: (val: string | string[]) => void;
  onContinue: () => void;
  canContinue: boolean;
  isLastStep: boolean;
}) {
  const selectedArr = Array.isArray(value) ? value : value ? [value] : [];

  const handleClick = (optionId: string) => {
    if (step.multiSelect) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(optionId)) {
        onSelect(current.filter(v => v !== optionId));
      } else {
        onSelect([...current, optionId]);
      }
    } else {
      onSelect(optionId);
      setTimeout(() => onContinue(), 200);
    }
  };

  const hasDescriptions = step.options.some(o => o.description);

  if (hasDescriptions) {
    return (
      <div className="max-w-xl">
        <div className="grid grid-cols-2 gap-2">
          {step.options.map((option) => {
            const isSelected = selectedArr.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleClick(option.id)}
                className={`relative border rounded-xl p-3 cursor-pointer transition-all text-left ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50/60'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className="font-medium text-sm text-gray-900">{option.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{option.description}</div>
              </button>
            );
          })}
        </div>
        {step.multiSelect && (
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`mt-3 px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border-none ${
              canContinue
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isLastStep ? 'Generate' : 'Continue'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap gap-2">
        {step.options.map((option) => {
          const isSelected = selectedArr.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleClick(option.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {step.multiSelect && (
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`mt-3 px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border-none ${
            canContinue
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isLastStep ? 'Generate' : 'Continue'}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Generation Progress
// ============================================================
function GenerationProgress({ phase }: { phase: number }) {
  return (
    <div className="max-w-md py-2">
      <div className="space-y-2">
        {generationSteps.map((stepText, i) => {
          const isComplete = i < phase;
          const isCurrent = i === phase;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 py-1 transition-all duration-500 ${
                isComplete ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                isComplete ? 'bg-green-100 text-green-600'
                : isCurrent ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-300'
              }`}>
                {isComplete ? <Check className="w-3 h-3" /> : isCurrent ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
              </div>
              <span className={`text-sm ${isComplete ? 'text-gray-600' : isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {stepText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CTA Cards (left chat side, after output)
// ============================================================
function CTACards({
  onRestart,
  onExploreAnother,
}: {
  onRestart: () => void;
  onExploreAnother: () => void;
}) {
  return (
    <div className="ml-7 space-y-3 max-w-md">
      {/* Primary CTA */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
          See this tailored to your business
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Bring your real goals, channels, and data context into a guided Treasure AI session.
        </p>
        <div className="flex items-center gap-2">
          <a
            href="#book"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
          >
            Book a tailored walkthrough
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <a
            href="#talk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Talk to our team
          </a>
        </div>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExploreAnother}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Explore another scenario
        </button>
      </div>

      {/* Lead capture */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-2">Want this sample output sent to your inbox?</p>
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Work email"
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Output Display (right panel)
// ============================================================
function OutputDisplay({ output, visibleSections }: { output: OutputData; visibleSections: number }) {
  const sectionClass = (index: number) =>
    `transition-all duration-500 ${visibleSections > index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <>
      {/* Summary Banner */}
      <div className={sectionClass(0)}>
        <div className="border border-gray-200 rounded-2xl p-5 mb-5 bg-white shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">
                AI-Generated Recommendation
              </div>
              <div className="text-sm font-semibold text-gray-900 leading-snug">
                {output.summaryBanner.topRecommendation}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
            <span>Goal: {output.summaryBanner.goal}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Audience: {output.summaryBanner.audience}</span>
          </div>
          <div className="mt-1.5 text-sm text-blue-600 font-medium">
            {output.summaryBanner.impactFraming}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className={sectionClass(1)}>
        <OutputSection title="Executive Summary" icon={<Lightbulb className="w-4 h-4" />}>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {output.executiveSummary}
          </div>
        </OutputSection>
      </div>

      {/* Audience Cards */}
      <div className={sectionClass(2)}>
        <OutputSection title="Audience Segments" icon={<Target className="w-4 h-4" />}>
          <div className="space-y-2">
            {output.audienceCards.map((card, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-gray-900">{card.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    card.opportunityLevel === 'High' ? 'bg-green-50 text-green-700' :
                    card.opportunityLevel === 'Medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {card.opportunityLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{card.whyItMatters}</p>
                <p className="text-xs text-blue-600 font-medium">{card.suggestedAction}</p>
              </div>
            ))}
          </div>
        </OutputSection>
      </div>

      {/* Channel Strategy */}
      <div className={sectionClass(3)}>
        <OutputSection title="Channel Strategy" icon={<Send className="w-4 h-4" />}>
          <div className="space-y-2">
            {output.channelStrategy.map((ch, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg">
                <div className="flex-shrink-0 w-20">
                  <span className="text-sm font-semibold text-gray-900">{ch.channel}</span>
                </div>
                <div className="flex-1 space-y-1 text-xs">
                  <div><span className="text-gray-400">Role:</span> <span className="text-gray-700">{ch.role}</span></div>
                  <div><span className="text-gray-400">Angle:</span> <span className="text-gray-700">{ch.messageAngle}</span></div>
                </div>
              </div>
            ))}
          </div>
        </OutputSection>
      </div>

      {/* Scenario Core */}
      <div className={sectionClass(4)}>
        <OutputSection title={output.scenarioCore.title} icon={<Sparkles className="w-4 h-4" />}>
          <div className="space-y-2.5">
            {output.scenarioCore.sections.map((section, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-lg p-3.5">
                <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{section.label}</h4>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</div>
              </div>
            ))}
          </div>
        </OutputSection>
      </div>

      {/* KPI Framework */}
      <div className={sectionClass(5)}>
        <OutputSection title="KPI Framework" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2.5">
            {output.kpiFramework.map((kpi, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-3.5">
                <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                  kpi.type === 'Primary' ? 'text-blue-600' :
                  kpi.type === 'Secondary' ? 'text-indigo-500' :
                  kpi.type === 'Leading Indicator' ? 'text-amber-600' :
                  'text-gray-500'
                }`}>
                  {kpi.type}
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-0.5">{kpi.name}</div>
                <div className="text-[11px] text-gray-500">{kpi.note}</div>
              </div>
            ))}
          </div>
        </OutputSection>
      </div>

      {/* Next Actions */}
      <div className={sectionClass(6)}>
        <OutputSection title="Recommended Next Actions" icon={<ArrowRight className="w-4 h-4" />}>
          <div className="space-y-1.5">
            {output.nextActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 bg-white border border-gray-100 rounded-lg">
                <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  action.priority === 'Do now' ? 'bg-green-50 text-green-700' :
                  action.priority === 'Test next' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {action.priority}
                </span>
                <span className="text-sm text-gray-700">{action.action}</span>
              </div>
            ))}
          </div>
        </OutputSection>
      </div>

      {/* Trust footer */}
      <div className="mt-4 text-center text-[11px] text-gray-400">
        AI-generated recommendation designed for human review. Built on trusted, traceable context.
      </div>
    </>
  );
}

// ============================================================
// Output Section Wrapper
// ============================================================
function OutputSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="text-gray-400">{icon}</div>
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="bg-gray-50/80 rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Floating Context Card (bottom of right output panel)
// ============================================================
function FloatingContextCard({
  goal, industry, scenario, inputs, inputSteps, output, activeTab, onTabChange,
}: {
  goal: string;
  industry: string;
  scenario: string;
  inputs: Record<string, string | string[]>;
  inputSteps: InputStep[];
  output: OutputData;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: 'why', label: 'Why this' },
    { id: 'impact', label: 'Impact' },
    { id: 'changed', label: 'What changed' },
    { id: 'treasure', label: 'Treasure AI' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Your Selections */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/40">
        <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Selections</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="text-[11px]">
            <span className="text-gray-400">Goal:</span>{' '}
            <span className="text-gray-700 font-medium">{goals.find(g => g.id === goal)?.label}</span>
          </div>
          <div className="text-[11px]">
            <span className="text-gray-400">Industry:</span>{' '}
            <span className="text-gray-700 font-medium">{industries.find(i => i.id === industry)?.label}</span>
          </div>
          <div className="text-[11px]">
            <span className="text-gray-400">Scenario:</span>{' '}
            <span className="text-gray-700 font-medium">{scenarios.find(s => s.id === scenario)?.label}</span>
          </div>
          {inputSteps.slice(0, 2).map(step => {
            const val = inputs[step.id];
            const display = Array.isArray(val) ? val.join(', ') : val;
            if (!display) return null;
            return (
              <div key={step.id} className="text-[11px]">
                <span className="text-gray-400 capitalize">{step.id.replace(/-/g, ' ')}:</span>{' '}
                <span className="text-gray-700 font-medium capitalize">{String(display).replace(/-/g, ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 text-center py-2 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content — all panels rendered in same grid cell so height = tallest */}
      <div className="px-5 py-4">
        <div className="grid">
          {/* Why */}
          <div className={`col-start-1 row-start-1 transition-opacity duration-200 ${activeTab === 'why' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className="text-xs text-gray-600 leading-relaxed">
              {output.insightPanel.whyThisRecommendation}
            </p>
          </div>
          {/* Impact */}
          <div className={`col-start-1 row-start-1 transition-opacity duration-200 ${activeTab === 'impact' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="space-y-2">
              {output.insightPanel.businessImpact.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          {/* What changed */}
          <div className={`col-start-1 row-start-1 transition-opacity duration-200 ${activeTab === 'changed' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="space-y-2">
              {output.insightPanel.whatChanged.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Treasure AI */}
          <div className={`col-start-1 row-start-1 transition-opacity duration-200 ${activeTab === 'treasure' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="space-y-2 mb-3">
              {output.insightPanel.howTreasureHelps.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Shield className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Treasure AI is the Agentic Experience Platform that unifies customer context, governs AI-driven decisions, and orchestrates action across your marketing stack.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
