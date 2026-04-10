import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Sparkles, ArrowRight,
  ShoppingBag, Plane, Package, Car, Film, Landmark,
  Clock, Star, Send, RotateCcw,
  Target, Lightbulb, TrendingUp, Shield,
  Loader2, Pencil, Presentation, ChevronDown, Share2, X, FileText,
} from 'lucide-react';
// Minimal inline SplitPaneLayout replacement (original was deleted with campaign components)
function SplitPaneLayout({ children, initialLeftWidth = 35, collapsed, onToggleCollapse }: {
  children: React.ReactNode[];
  initialLeftWidth?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const kids = React.Children.toArray(children);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp: left min 250px (~20%), right min 300px (~25%)
      const minLeft = (250 / rect.width) * 100;
      const maxLeft = ((rect.width - 300) / rect.width) * 100;
      setLeftWidth(Math.min(maxLeft, Math.max(minLeft, newWidth)));
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden h-full">
      {!collapsed ? (
        <div className="overflow-y-auto flex-shrink-0" style={{ width: `${leftWidth}%`, minWidth: 250 }}>
          {kids[0]}
        </div>
      ) : (
        <button
          onClick={onToggleCollapse}
          className="w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors flex-shrink-0"
          title="Expand chat"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      {/* Draggable resize handle */}
      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 flex-shrink-0 flex items-center justify-center cursor-col-resize group ${isDragging ? 'bg-gray-100' : ''}`}
        >
          <div className={`w-0.5 h-12 rounded-full transition-colors ${isDragging ? 'bg-gray-900' : 'bg-gray-200 group-hover:bg-gray-400'}`} />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {kids[1]}
      </div>
    </div>
  );
}
import { useExperienceLabStore, type FlowStep, type OutputData } from '../stores/experienceLabStore';
import { goals, industries, scenarios, generationSteps, refinementGenerationSteps, getDefaultInputs, getRefinementChips, getIndustriesForOutcome, getScenariosForOutcome, type ScenarioOption, type RefinementChip } from '../data/experienceLabConfig';
import { generateExperienceLabOutput } from '../services/experienceLabOutputs';
import { experienceCenterApi } from '../api/client';
import { getScenarioConfig } from '../experience-center/registry/scenarioRegistry';
import { skillFamilies } from '../experience-center/registry/skillFamilies';
import SkillProgressBlock, { type ProgressStep } from '../experience-center/output-formats/SkillProgressBlock';
import { ModularOutputRenderer, moduleRegistry } from '../experience-center/output-formats/modules';
import { HeroSummaryCard } from '../experience-center/output-formats/primitives';
import OutputLoader from '../experience-center/output-formats/OutputLoader';
import SlideModal from '../experience-center/output-formats/slides/SlideModal';
import SlidePreview from '../experience-center/output-formats/slides/SlidePreview';
import SlideOutput from '../experience-center/output-formats/slides/SlideOutput';
import type { DeckConfig, DeckData } from '../experience-center/output-formats/slides/types';
import ApiKeySetupModal from '../components/ApiKeySetupModal';
import BookWalkthroughModal from '../components/BookWalkthroughModal';
import { AnalyticsEvents } from '../utils/analytics';
import { trackAll } from '../utils/tracking';
import { getWorkflowDef } from '../experience-center/registry/workflows';
import { useWorkflowSessionStore } from '../stores/workflowSessionStore';
import { executeWorkflowStep, resolveWorkflowStepContext } from '../experience-center/orchestration/workflowEngine';
import type { StepType, IndustryContext } from '../experience-center/orchestration/types';
import BranchChoiceCards from '../experience-center/output-formats/modules/BranchChoiceCards';
import WorkflowStepCard from '../experience-center/output-formats/modules/workflow-cards';
import WorkflowProgressIndicator from '../experience-center/output-formats/modules/WorkflowProgressIndicator';
import WorkflowArtifactTabs from '../experience-center/output-formats/modules/WorkflowArtifactTabs';

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
  { id: 4, key: 'output', label: 'Outcome' },
];

const stepOrder: (FlowStep | 'goal')[] = ['goal', 'industry', 'scenario', 'generating', 'output'];

function stepIndex(step: FlowStep | 'goal'): number {
  return stepOrder.indexOf(step);
}

// ============================================================
// Workflow step progress — dynamic with sandbox data
// ============================================================
type ProgressEntry = { message: string; stage: 'intent' | 'route' | 'skill_call' | 'skill_result' | 'ui_update' };

function getWorkflowProgressSteps(
  stepType: StepType,
  industry: IndustryContext,
  stepLabel: string,
  priorStepCount: number,
): ProgressEntry[] {
  const m = industry.sampleMetrics;
  const label = industry.label;
  const segCount = industry.sampleSegments.length;
  const totalCust = m.totalCustomers || 'unknown';
  const channels = industry.channelPreferences.slice(0, 4).join(', ');
  const audienceLabel = label === 'Retail' ? 'customers' : label === 'Travel' ? 'guests' : 'households';
  const sandboxName = `${label} Demo`;

  const priorContext = priorStepCount > 0
    ? `Building on ${priorStepCount} prior analysis step${priorStepCount > 1 ? 's' : ''}`
    : `Reviewing scenario: ${stepLabel}`;

  // Build industry-specific metric lines for the sandbox load step
  const metricLines: string[] = [];
  if (label === 'Retail') {
    if (m.customerLifetimeValue) metricLines.push(`Avg CLV: ${m.customerLifetimeValue}`);
    if (m.repeatPurchaseRate) metricLines.push(`Repeat purchase rate: ${m.repeatPurchaseRate}`);
    if (m.avgOrderValueOnline || m.avgOrderValueInStore) metricLines.push(`Online AOV: ${m.avgOrderValueOnline || 'N/A'} | In-store AOV: ${m.avgOrderValueInStore || 'N/A'}`);
    if (m.loyaltyMembers) metricLines.push(`Loyalty members: ${m.loyaltyMembers} across tiers`);
    if (m.churnRiskHigh) metricLines.push(`Churn risk: ${m.churnRiskHigh} High | ${m.churnRiskMedium} Medium | ${m.churnRiskLow} Low`);
  } else if (label === 'Travel') {
    if (m.avgBookingValue || m.avgOrderValueOnline) metricLines.push(`Avg booking value: ${m.avgBookingValue || m.avgOrderValueOnline}`);
    if (m.rebookingRate || m.repeatPurchaseRate) metricLines.push(`Rebooking rate: ${m.rebookingRate || m.repeatPurchaseRate}`);
    if (m.emailOpenRate) metricLines.push(`Email open rate: ${m.emailOpenRate} | Click rate: ${m.emailClickRate || 'N/A'}`);
    if (m.loyaltyMembers) metricLines.push(`Loyalty members: ${m.loyaltyMembers} across tiers`);
    if (m.churnRiskHigh) metricLines.push(`Churn risk: ${m.churnRiskHigh} High | ${m.churnRiskMedium} Medium | ${m.churnRiskLow} Low`);
    if (m.ancillaryAttachRate) metricLines.push(`Ancillary attach rate: ${m.ancillaryAttachRate}`);
  } else {
    if (m.avgBasketSize) metricLines.push(`Avg basket size: ${m.avgBasketSize}`);
    if (m.avgPurchaseAmount) metricLines.push(`Avg purchase amount: ${m.avgPurchaseAmount}`);
    if (m.buyerPenetration) metricLines.push(`Buyer penetration: ${m.buyerPenetration}`);
    if (m.brandLoyaltyHigh) metricLines.push(`Brand loyalty: ${m.brandLoyaltyHigh} High | ${m.brandLoyaltyMedium} Medium | ${m.brandLoyaltyLow} Low`);
    if (m.promoRate) metricLines.push(`Promo purchase rate: ${m.promoRate}`);
    if (m.emailOpenRate) metricLines.push(`Email open rate: ${m.emailOpenRate} | Click rate: ${m.emailClickRate || 'N/A'}`);
  }

  // Combine sandbox load + metrics into one multi-line step
  const sandboxLoadMessage = [`Loaded ${sandboxName} sandbox — ${totalCust} ${audienceLabel}`, ...metricLines].join('\n');

  const stepTypeLabels: Record<StepType, { action: string; result: string; final: string }> = {
    analyze: { action: 'Analyzing behavioral patterns', result: 'Identified top opportunities', final: 'Assembling findings' },
    inspect: { action: 'Evaluating engagement signals', result: 'Scoring recovery potential', final: 'Preparing recommendations' },
    create: { action: 'Building campaign structure', result: 'Calculating projected impact', final: 'Finalizing deliverable' },
    compare: { action: 'Evaluating options side-by-side', result: 'Ranking alternatives', final: 'Assembling recommendation' },
    activate: { action: 'Configuring activation parameters', result: 'Validating audience readiness', final: 'Preparing activation summary' },
    optimize: { action: 'Modeling optimization scenarios', result: 'Calculating projected improvements', final: 'Assembling recommendations' },
  };

  const labels = stepTypeLabels[stepType] || stepTypeLabels.analyze;

  return [
    { message: priorContext, stage: 'intent' },
    { message: 'Connecting to Treasure Data CDP', stage: 'route' },
    { message: sandboxLoadMessage, stage: 'skill_call' },
    { message: `Scanning ${segCount} segments`, stage: 'skill_call' },
    { message: `Channels: ${channels}`, stage: 'skill_call' },
    { message: labels.action, stage: 'skill_call' },
    { message: labels.result, stage: 'skill_result' },
    { message: 'Generating strategic output', stage: 'skill_result' },
    { message: labels.final, stage: 'ui_update' },
  ];
}

// ============================================================
// Chat message model
// ============================================================
interface ConversationMessage {
  id: string;
  role: 'ai' | 'user' | 'thinking';
  content: string;
  type?: 'text' | 'industry-cards' | 'scenario-cards' | 'input-options' | 'generation' | 'output-ready' | 'cta' | 'refinements' | 'branch-choices' | 'workflow-step-result' | 'workflow-complete';
  stepKey?: string;
  multiSelect?: boolean;
  runId?: string;
}

function getRefinementAck(chip: RefinementChip): string {
  const acks: Record<string, string[]> = {
    objective: [
      `Got it — I'll refine this to focus on ${chip.inputValue.replace(/-/g, ' ')}.`,
      `Sure — updating the strategy to optimize for ${chip.inputValue.replace(/-/g, ' ')}.`,
    ],
    audience: [
      `Understood — I'll tailor this for ${chip.label.replace(/^Target /i, '')}.`,
      `Got it — reshaping the recommendation for ${chip.label.replace(/^Target /i, '')}.`,
    ],
    channels: [
      `Sure — I'll ${chip.label.toLowerCase()} to the channel mix.`,
      `On it — updating the output to include ${chip.inputValue.replace(/-/g, ' ')}.`,
    ],
    priority: [
      `Got it — I'll ${chip.label.toLowerCase()} in this version.`,
    ],
    kpi: [
      `Understood — I'll ${chip.label.toLowerCase()}.`,
    ],
  };
  const options = acks[chip.inputKey] || [`Got it — I'll update the recommendation based on "${chip.label}".`];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================
// Main Component
// ============================================================
export default function ExperienceCenterWorkflowPage() {
  const navigate = useNavigate();
  const store = useExperienceLabStore();
  const {
    goal, industry, scenario, inputs, currentStep,
    generationPhase, output, isGenerating,
    setIndustry, setScenario, setInput, setCurrentStep,
    setCurrentInputStep, startGeneration, setGenerationPhase,
    finishGeneration, resetSession,
  } = store;

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [showCTA, setShowCTA] = useState(false);
  const [visibleOutputSections, setVisibleOutputSections] = useState(0);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [progressHistory, setProgressHistory] = useState<Record<string, ProgressStep[]>>({});
  const [isThinkingActive, setIsThinkingActive] = useState(false);
  const progressSteps = activeRunId ? (progressHistory[activeRunId] || []) : [];
  const [showSlideModal, setShowSlideModal] = useState(false);

  // Artifact system — multiple outputs in same session
  type Artifact = { id: string; type: 'output' | 'slides'; label: string; data: any };
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string>('output');
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];
  const [showSlidePreview, setShowSlidePreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const hasAutoPromptedShareRef = useRef(false);
  const [generatingSlides, setGeneratingSlides] = useState(false);
  const [usedScenarios, setUsedScenarios] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'output'>('output');
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workflowOutputEndRef = useRef<HTMLDivElement>(null);
  const workflowCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const workflowScrollRef = useRef<HTMLDivElement>(null);
  const cachedIndustryRef = useRef<IndustryContext | null>(null);
  const [scrolledAboveSteps, setScrolledAboveSteps] = useState<Set<string>>(new Set());
  const hasOutput = currentStep === 'output' && !!output;
  const [hasEverOutput, setHasEverOutput] = useState(false);
  const wfActive = useWorkflowSessionStore(s => s.active);
  const wfStepHistory = useWorkflowSessionStore(s => s.stepHistory);
  const wfIsExecuting = useWorkflowSessionStore(s => s.isExecutingStep);
  const wfCurrentStepId = useWorkflowSessionStore(s => s.currentStepId);
  const wfDef = useWorkflowSessionStore(s => s.workflowDef);
  const wfComplete = wfActive && wfStepHistory.length > 0 && wfStepHistory[wfStepHistory.length - 1].stepDef.branches.length === 0 && !wfIsExecuting;
  useEffect(() => {
    if (output || (isThinkingActive && currentStep === 'generating') || wfActive) setHasEverOutput(true);
  }, [output, isThinkingActive, currentStep, wfActive]);

  // Auto-scroll workflow output panel when new steps complete
  useEffect(() => {
    if (wfActive && wfStepHistory.length > 0) {
      setTimeout(() => workflowOutputEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [wfStepHistory.length, wfActive]);

  // Auto-prompt share modal after any workflow step completes if user is idle for 5s
  // Only triggers once per session. Resets the timer each time a new step completes.
  useEffect(() => {
    if (!wfActive || wfStepHistory.length === 0 || wfIsExecuting || hasAutoPromptedShareRef.current) return;

    const timer = setTimeout(() => {
      // Only show if user hasn't already been prompted and modal isn't already open
      if (!hasAutoPromptedShareRef.current && !showShareModal) {
        hasAutoPromptedShareRef.current = true;
        setShowShareModal(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [wfActive, wfStepHistory.length, wfIsExecuting, showShareModal]);

  // Track which step cards have scrolled above the viewport
  useEffect(() => {
    if (!wfActive || wfStepHistory.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setScrolledAboveSteps(prev => {
          const next = new Set(prev);
          for (const entry of entries) {
            const stepId = entry.target.getAttribute('data-step-id');
            if (!stepId) continue;
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
              next.add(stepId);
            } else {
              next.delete(stepId);
            }
          }
          return next;
        });
      },
      { root: workflowScrollRef.current, threshold: 0 }
    );

    // Observe all card refs
    for (const [, el] of Object.entries(workflowCardRefs.current)) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [wfActive, wfStepHistory.length]);

  // Detect mobile/tablet
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Listen for API key modal event from nav bar
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  useEffect(() => {
    const handler = () => setShowApiKeyModal(true);
    window.addEventListener('open-api-key-modal', handler);
    return () => window.removeEventListener('open-api-key-modal', handler);
  }, []);

  // Listen for booking modal event from nav bar and floating card
  const [showBookingModal, setShowBookingModal] = useState(false);
  useEffect(() => {
    const handler = () => setShowBookingModal(true);
    window.addEventListener('open-booking-modal', handler);
    return () => window.removeEventListener('open-booking-modal', handler);
  }, []);

  // Redirect if no goal selected
  useEffect(() => {
    if (!goal) navigate('/experience-center', { replace: true });
  }, [goal, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStep, generationPhase]);


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
    trackAll(AnalyticsEvents.INDUSTRY_SELECT, { goal_id: goal, industry_id: id, industry_label: label });
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
    // Look up label from matrix first, then legacy flat list
    const matrixScenarios = getScenariosForOutcome(goal, industry);
    const label = matrixScenarios.find(s => s.id === id)?.label || scenarios.find(s => s.id === id)?.label || id;
    trackAll(AnalyticsEvents.SCENARIO_SELECT, { goal_id: goal, industry_id: industry, scenario_id: id, scenario_label: label });
    setScenario(id);
    addUserMessage(label);

    // Check if this scenario has a workflow definition
    const workflowDef = getWorkflowDef(id);
    if (workflowDef) {
      // Enter workflow mode
      useWorkflowSessionStore.getState().initWorkflow(workflowDef);
      setTimeout(() => runWorkflowStep(id), 300);
      return;
    }

    // Apply default inputs and generate immediately (one-shot mode)
    const defaults = getDefaultInputs(id, industry);
    Object.entries(defaults).forEach(([key, value]) => setInput(key, value));

    setTimeout(() => runGeneration(id, defaults), 300);
  };

  // ============================================================
  // Refinement handler
  // ============================================================
  const handleRefinement = useCallback((chip: RefinementChip) => {
    trackAll(AnalyticsEvents.REFINEMENT_CLICK, { chip_label: chip.label, scenario_id: scenario });
    // Generate a natural acknowledgment based on the refinement type
    const ack = getRefinementAck(chip);

    // Clean up old action UI (refinements, cta, output-ready) and replace with conversational history
    setMessages(prev => {
      const cleaned = prev
        .filter(m => m.type !== 'refinements' && m.type !== 'cta')
        .map(m => m.type === 'output-ready' ? { ...m, type: 'text' as const } : m);
      return [
        ...cleaned,
        { id: `user-${Date.now()}`, role: 'user' as const, content: chip.label },
        { id: `ai-ack-${Date.now()}`, role: 'ai' as const, content: ack, type: 'text' as const },
      ];
    });

    // Update the input
    const currentInputs = useExperienceLabStore.getState().inputs;
    const currentScenario = useExperienceLabStore.getState().scenario;

    // For channel chips, toggle in the channels array
    if (chip.inputKey === 'channels') {
      const current = Array.isArray(currentInputs.channels) ? currentInputs.channels : ['email', 'paid-social'];
      const updated = current.includes(chip.inputValue)
        ? current
        : [...current, chip.inputValue];
      setInput('channels', updated);
    } else {
      setInput(chip.inputKey, chip.inputValue);
    }

    // Regenerate with updated inputs
    setTimeout(() => {
      const updatedInputs = useExperienceLabStore.getState().inputs;
      runRefinement(currentScenario, updatedInputs);
    }, 300);
  }, []);

  // ============================================================
  // Workflow step execution
  // ============================================================
  const runWorkflowStep = useCallback(async (scenarioIdOverride?: string) => {
    const wfStore = useWorkflowSessionStore.getState();
    const { workflowDef, currentStepId, stepHistory, cumulativeContext, isExecutingStep } = wfStore;
    if (!workflowDef || !currentStepId || isExecutingStep) return;

    const stepDef = workflowDef.steps[currentStepId];
    if (!stepDef) return;

    const effectiveScenarioId = scenarioIdOverride || scenario;
    const scenarioConfig = getScenarioConfig(effectiveScenarioId);
    if (!scenarioConfig) return;

    // Show step announcement
    wfStore.setIsExecutingStep(true);
    setCurrentStep('generating');
    addAIMessage(`Working on: ${stepDef.label}...`, 'generation');
    setIsThinkingActive(true);
    setHasEverOutput(true);

    // Set up progress tracking
    const runId = `wf-step-${Date.now()}`;
    setActiveRunId(runId);
    setProgressHistory(prev => ({ ...prev, [runId]: [] }));

    const addProgressStep = (message: string, stage?: ProgressStep['stage']) => {
      setProgressHistory(prev => ({ ...prev, [runId]: [...(prev[runId] || []), { message, stage }] }));
    };

    // Resolve industry context first (to get sandbox data for progress messages)
    // Cache it so subsequent workflow steps don't re-fetch metrics
    let resolvedIndustry: IndustryContext | undefined;
    addProgressStep(`Reviewing scenario: ${stepDef.label}`, 'intent');
    if (cachedIndustryRef.current) {
      resolvedIndustry = cachedIndustryRef.current;
    } else {
      try {
        const { industry: ctx } = await resolveWorkflowStepContext(scenarioConfig);
        resolvedIndustry = ctx;
        cachedIndustryRef.current = ctx;
      } catch {
        // If context resolution fails, continue with generic progress
      }
    }

    // Build dynamic progress steps with real sandbox data
    const progressQueue = resolvedIndustry
      ? getWorkflowProgressSteps(stepDef.stepType, resolvedIndustry, stepDef.label, stepHistory.length)
      : getWorkflowProgressSteps(stepDef.stepType, { id: scenarioConfig.industry, label: scenarioConfig.industry, sampleSegments: [], sampleMetrics: {}, channelPreferences: [], verticalTerminology: {}, sampleDataContext: '' } as IndustryContext, stepDef.label, stepHistory.length);

    // Skip first step (already shown above) and start interval for the rest
    let phase = 1; // start from 1 since step 0 is already shown
    const progressInterval = setInterval(() => {
      if (phase < progressQueue.length) {
        addProgressStep(progressQueue[phase].message, progressQueue[phase].stage);
        phase++;
      }
    }, 1100);

    try {
      const result = await executeWorkflowStep(stepDef, scenarioConfig, stepHistory, cumulativeContext, resolvedIndustry);

      // Clear progress interval and add remaining steps
      clearInterval(progressInterval);
      for (let i = phase + 1; i < progressQueue.length; i++) {
        addProgressStep(progressQueue[i].message, progressQueue[i].stage);
      }

      // Store the step result
      const stepResult = {
        stepId: currentStepId,
        stepDef,
        chosenBranchId: null,
        output: result.output,
        summary: result.summary,
        timestamp: Date.now(),
      };
      wfStore.addStepResult(stepResult);
      wfStore.setIsExecutingStep(false);
      setIsThinkingActive(false);
      setCurrentStep('output');

      // Replace generation message with step result (tagged with runId for collapsed progress)
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'generation');
        return [
          ...filtered,
          { id: `wf-result-${Date.now()}`, role: 'ai' as const, content: result.summary, type: 'workflow-step-result' as const, runId },
          ...(stepDef.branches.length > 0
            ? [{ id: `wf-branches-${Date.now()}`, role: 'ai' as const, content: '', type: 'branch-choices' as const, stepKey: currentStepId }]
            : [{ id: `wf-complete-${Date.now()}`, role: 'ai' as const, content: 'Workflow complete. Here is everything we built together.', type: 'workflow-complete' as const }]),
        ];
      });
    } catch (err) {
      clearInterval(progressInterval);
      wfStore.setIsExecutingStep(false);
      setIsThinkingActive(false);
      setCurrentStep('output');
      const message = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'generation'),
        { id: `wf-error-${Date.now()}`, role: 'ai' as const, content: `Step failed: ${message}. Falling back to one-shot generation.`, type: 'text' as const },
      ]);
    }
  }, [scenario]);

  const handleBranchChoice = useCallback((branchId: string) => {
    const wfStore = useWorkflowSessionStore.getState();
    const { workflowDef, currentStepId } = wfStore;
    if (!workflowDef || !currentStepId) return;

    const stepDef = workflowDef.steps[currentStepId];
    const branch = stepDef?.branches.find(b => b.branchId === branchId);
    if (!branch) return;

    trackAll(AnalyticsEvents.BRANCH_CHOICE, { branch_id: branchId, step_id: currentStepId, scenario_id: scenario });

    // Add user's choice as a message
    addUserMessage(branch.label);

    // Disable branch choices in previous messages
    setMessages(prev => prev.map(m =>
      m.type === 'branch-choices' ? { ...m, type: 'text' as const, content: '' } : m
    ));

    // Choose branch (updates context and moves to next step)
    wfStore.chooseBranch(branchId);

    // Execute the next step
    setTimeout(() => runWorkflowStep(), 500);
  }, [runWorkflowStep]);

  // ============================================================
  // Generation (first draft)
  // ============================================================
  const runGeneration = useCallback((scenarioId?: string, defaultInputs?: Record<string, string | string[]>) => {
    const s = scenarioId || scenario;
    const i = defaultInputs || inputs;
    trackAll(AnalyticsEvents.GENERATION_START, { goal_id: goal, industry_id: industry, scenario_id: s });
    startGeneration();
    addAIMessage('Generating your personalized outcome...', 'generation');

    // Resolve scenario config from registry
    const scenarioConfig = getScenarioConfig(s);
    const familyDef = scenarioConfig ? skillFamilies[scenarioConfig.skillFamily] : null;
    const industryLabel = industries.find(ind => ind.id === (scenarioConfig?.industry || industry))?.label || industry;
    const skillLabel = familyDef?.label || scenarioConfig?.skillFamily || 'AI';

    const runId = `gen-${Date.now()}`;
    setActiveRunId(runId);
    setProgressHistory(prev => ({ ...prev, [runId]: [] }));
    setIsThinkingActive(true);

    const addStep = (message: string, stage?: ProgressStep['stage']) => {
      setProgressHistory(prev => ({ ...prev, [runId]: [...(prev[runId] || []), { message, stage }] }));
    };

    // Initial step
    addStep(`Scenario: ${scenarioConfig?.title || s}`, 'intent');

    // Progressive steps
    const stepQueue: Array<{ message: string; stage?: ProgressStep['stage'] }> = scenarioConfig ? [
      { message: `Routing to ${skillLabel}`, stage: 'route' },
      { message: `Loading ${industryLabel} sandbox context`, stage: 'skill_call' },
      { message: `Invoking ${skillLabel}`, stage: 'skill_call' },
      { message: `Generating ${scenarioConfig.outputFormatKey.replace(/_/g, ' ')} output`, stage: 'skill_call' },
    ] : generationSteps.map(msg => ({ message: msg }));

    let phase = 0;
    const interval = setInterval(() => {
      if (phase < stepQueue.length) {
        setGenerationPhase(phase + 1);
        addStep(stepQueue[phase].message, stepQueue[phase].stage);
        phase++;
      }
    }, 1100);

    const completeGeneration = (result: import('../stores/experienceLabStore').OutputData) => {
      clearInterval(interval);
      trackAll(AnalyticsEvents.GENERATION_COMPLETE, { goal_id: goal, industry_id: industry, scenario_id: s });
      addStep('Strategy complete — review results in the panel', 'ui_update');
      setIsThinkingActive(false);
      finishGeneration(result);
      // Register as artifact and track used scenario
      setArtifacts([{ id: 'output', type: 'output', label: scenarioConfig?.title || 'Recommendation', data: result }]);
      setActiveArtifactId('output');
      setUsedScenarios(prev => new Set(prev).add(s));
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'generation');
        return [
          ...filtered,
          { id: `ai-output-${Date.now()}`, role: 'ai' as const, content: 'Here\'s your recommendation. View it in the output panel.', type: 'output-ready' as const, runId },
          { id: `ai-refine-${Date.now() + 1}`, role: 'ai' as const, content: '', type: 'refinements' as const },
          { id: `ai-cta-${Date.now() + 2}`, role: 'ai' as const, content: '', type: 'cta' as const },
        ];
      });
    };

    if (scenarioConfig) {
      experienceCenterApi.generate(scenarioConfig)
        .then((result: any) => {
          addStep(`${skillLabel} output generated successfully`, 'skill_result');
          completeGeneration(result);
        })
        .catch((err: Error) => {
          console.warn('[ExperienceCenter] Skill failed, falling back to local:', err.message);
          addStep('Falling back to local template engine', 'skill_call');
          const result = generateExperienceLabOutput({ goal, industry, scenario: s, inputs: i });
          addStep('Output generated via local template', 'skill_result');
          completeGeneration(result);
        });
    } else {
      setTimeout(() => {
        const result = generateExperienceLabOutput({ goal, industry, scenario: s, inputs: i });
        addStep('Output generated', 'skill_result');
        completeGeneration(result);
      }, generationSteps.length * 1100);
    }
  }, [goal, industry, scenario, inputs, startGeneration, setGenerationPhase, finishGeneration]);

  // ============================================================
  // Refinement generation (faster)
  // ============================================================
  const runRefinement = useCallback((scenarioId: string, updatedInputs: Record<string, string | string[]>) => {
    useExperienceLabStore.setState({ isGenerating: true, generationPhase: 0 });
    const thinkingId = `thinking-${Date.now()}`;
    setMessages(prev => [...prev, { id: thinkingId, role: 'thinking' as const, content: '' }]);

    const scenarioConfig = getScenarioConfig(scenarioId);
    const familyDef = scenarioConfig ? skillFamilies[scenarioConfig.skillFamily] : null;
    const skillLabel = familyDef?.label || 'AI';

    const runId = `refine-${Date.now()}`;
    setActiveRunId(runId);
    setProgressHistory(prev => ({ ...prev, [runId]: [{ message: 'Adjusting recommendations', stage: 'intent' }] }));
    setIsThinkingActive(true);

    const addStep = (message: string, stage?: ProgressStep['stage']) => {
      setProgressHistory(prev => ({ ...prev, [runId]: [...(prev[runId] || []), { message, stage }] }));
    };

    const completeRefinement = (result: import('../stores/experienceLabStore').OutputData) => {
      addStep('Refinement complete — review updated results', 'ui_update');
      setIsThinkingActive(false);
      finishGeneration(result);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingId);
        return [
          ...filtered,
          { id: `ai-output-${Date.now()}`, role: 'ai' as const, content: 'Updated. View the revised output in the panel.', type: 'output-ready' as const },
          { id: `ai-refine-${Date.now() + 1}`, role: 'ai' as const, content: '', type: 'refinements' as const },
          { id: `ai-cta-${Date.now() + 2}`, role: 'ai' as const, content: '', type: 'cta' as const },
        ];
      });
    };

    if (scenarioConfig) {
      addStep(`Routing to ${skillLabel}`, 'route');

      experienceCenterApi.generate(scenarioConfig)
        .then((result: any) => {
          addStep('Refined output generated', 'skill_result');
          completeRefinement(result);
        })
        .catch((err: Error) => {
          console.warn('[ExperienceCenter] Refinement failed, falling back to local:', err.message);
          const result = generateExperienceLabOutput({ goal, industry, scenario: scenarioId, inputs: updatedInputs });
          completeRefinement(result);
        });
    } else {
      setTimeout(() => {
        const result = generateExperienceLabOutput({ goal, industry, scenario: scenarioId, inputs: updatedInputs });
        completeRefinement(result);
      }, refinementGenerationSteps.length * 800);
    }
  }, [goal, industry, setGenerationPhase, finishGeneration]);

  // Slide generation
  const handleGenerateSlides = useCallback(async (config: DeckConfig) => {
    if (!output) return;
    trackAll(AnalyticsEvents.SLIDE_DECK_REQUEST, { deck_length: config.length, deck_style: config.style, scenario_id: scenario });
    setShowSlideModal(false);

    // Add progress to chat
    const runId = `slides-${Date.now()}`;
    setActiveRunId(runId);
    setProgressHistory(prev => ({ ...prev, [runId]: [{ message: 'Preparing slide outline', stage: 'intent' }] }));
    setIsThinkingActive(true);

    const addStep = (message: string, stage?: ProgressStep['stage']) => {
      setProgressHistory(prev => ({ ...prev, [runId]: [...(prev[runId] || []), { message, stage }] }));
    };

    setMessages(prev => [
      ...prev,
      { id: `user-slides-${Date.now()}`, role: 'user' as const, content: `Create ${config.length}-slide ${config.style} deck` },
      { id: `ai-slides-${Date.now()}`, role: 'ai' as const, content: 'Creating your presentation...', type: 'generation' as const },
    ]);
    setGeneratingSlides(true);

    const slideSteps: Array<{ message: string; stage?: ProgressStep['stage'] }> = [
      { message: 'Mapping output into presentation structure', stage: 'route' },
      { message: 'Generating slide summaries', stage: 'skill_call' },
      { message: 'Building slide preview', stage: 'skill_call' },
    ];

    let phase = 0;
    const interval = setInterval(() => {
      if (phase < slideSteps.length) {
        addStep(slideSteps[phase].message, slideSteps[phase].stage);
        phase++;
      }
    }, 1200);

    try {
      const scenarioConfig = getScenarioConfig(scenario);
      const result = await experienceCenterApi.generateSlides({
        outputData: output,
        deckLength: config.length,
        deckStyle: config.style,
        customTitle: config.customTitle,
        scenarioContext: {
          outcome: goals.find(g => g.id === goal)?.label,
          industry: industries.find(ind => ind.id === industry)?.label,
          scenario: scenarioConfig?.title,
          kpi: scenarioConfig?.kpi,
          outputFormatKey: scenarioConfig?.outputFormatKey,
        },
      });
      clearInterval(interval);
      addStep('Deck ready — view in the panel', 'ui_update');
      setIsThinkingActive(false);
      setGeneratingSlides(false);

      // Add slides as artifact
      const deckData = result as DeckData;
      setArtifacts(prev => [
        ...prev.filter(a => a.id !== 'slides'),
        { id: 'slides', type: 'slides', label: deckData.title || 'Slide Deck', data: deckData },
      ]);
      setActiveArtifactId('slides');

      setMessages(prev => {
        const filtered = prev.filter(m => !(m.type === 'generation' && m.content === 'Creating your presentation...'));
        return [
          ...filtered,
          { id: `ai-slides-done-${Date.now()}`, role: 'ai' as const, content: 'Your presentation is ready. You can view it in the output panel.', type: 'output-ready' as const, runId },
        ];
      });
    } catch (err) {
      clearInterval(interval);
      addStep('Slide generation failed', 'skill_result');
      setIsThinkingActive(false);
      setGeneratingSlides(false);
      console.error('[ExperienceCenter] Slide generation failed:', err);
    }
  }, [output, scenario, goal, industry]);

  // Progressive output reveal
  useEffect(() => {
    if (currentStep === 'output' && output) {
      setVisibleOutputSections(0);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleOutputSections(count);
        if (count >= 11) {
          clearInterval(interval);
          setTimeout(() => setShowCTA(true), 600);
        }
      }, 250);
      return () => clearInterval(interval);
    }
  }, [currentStep, output]);

  // ============================================================
  // Workflow output panel (cumulative, used by both mobile and desktop)
  // ============================================================
  const renderWorkflowOutputPanel = () => {
    // Build progress tracker: completed steps + current + predicted next
    const buildProgressItems = () => {
      const items: Array<{ label: string; status: 'done' | 'current' | 'pending' }> = [];
      // Completed steps
      for (const step of wfStepHistory) {
        items.push({ label: step.stepDef.label, status: 'done' });
      }
      // Current step (only if not already completed)
      const alreadyCompleted = wfStepHistory.some(s => s.stepId === wfCurrentStepId);
      if (wfCurrentStepId && wfDef?.steps[wfCurrentStepId]) {
        const currentStep = wfDef.steps[wfCurrentStepId];
        if (!alreadyCompleted) {
          items.push({ label: currentStep.label, status: 'current' });
        }
        // Predict next steps by following recommended branches (even if current is done, user hasn't picked yet)
        let nextStepId = currentStep.branches.find(b => b.recommendation)?.nextStepId || currentStep.branches[0]?.nextStepId;
        let depth = 0;
        while (nextStepId && wfDef.steps[nextStepId] && depth < 3) {
          const nextStep = wfDef.steps[nextStepId];
          items.push({ label: nextStep.label, status: 'pending' });
          nextStepId = nextStep.branches.find(b => b.recommendation)?.nextStepId || nextStep.branches[0]?.nextStepId;
          depth++;
        }
      }
      return items;
    };

    const progressItems = buildProgressItems();

    return (
    <>
      {/* Workflow Progress Tracker */}
      {progressItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-4 mb-4">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Workflow Progress</div>
          <div className="space-y-1.5">
            {progressItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {item.status === 'done' ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : item.status === 'current' ? (
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                )}
                <span className={`text-xs flex-1 ${
                  item.status === 'done' ? 'text-gray-500' :
                  item.status === 'current' ? 'text-gray-900 font-medium' :
                  'text-gray-400'
                }`}>{item.label}</span>
                <span className={`text-[10px] font-medium flex-shrink-0 ${
                  item.status === 'done' ? 'text-emerald-500' :
                  item.status === 'current' ? 'text-blue-500' :
                  'text-gray-300'
                }`}>
                  {item.status === 'done' ? 'Done' : item.status === 'current' ? 'Current' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky mini-headers for scrolled-out cards */}
      {scrolledAboveSteps.size > 0 && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] py-1 px-2 mb-4">
          {wfStepHistory.map((step, i) => {
            if (!scrolledAboveSteps.has(step.stepId)) return null;
            return (
              <button
                key={step.stepId}
                onClick={() => workflowCardRefs.current[step.stepId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex items-center gap-2 w-full py-1 hover:bg-gray-50 rounded-lg px-1 cursor-pointer transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                <span className="text-[11px] text-gray-500 truncate flex-1 text-left">{i + 1}. {step.stepDef.label}</span>
                <span className="text-[9px] text-emerald-500 font-medium flex-shrink-0">Done</span>
              </button>
            );
          })}
        </div>
      )}

      {wfStepHistory.map((step, i) => {
        if (!step.output) return null;
        return (
          <div
            key={step.stepId}
            className="mb-4"
            data-step-id={step.stepId}
            ref={(el) => { workflowCardRefs.current[step.stepId] = el; }}
          >
            <WorkflowStepCard
              stepType={step.stepDef.stepType}
              output={step.output}
              stepLabel={step.stepDef.label}
              stepNumber={i + 1}
              skillFamily={step.stepDef.skillFamily}
            />
          </div>
        );
      })}
      {wfIsExecuting && (
        <div className="mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-5">
            {/* Step header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 animate-pulse">
                <span className="text-[9px] font-bold text-blue-600">{wfStepHistory.length + 1}</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {wfDef?.steps[wfCurrentStepId || '']?.label || 'Processing...'}
              </span>
            </div>
            {/* Type label shimmer */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" />
              <div className="w-20 h-2.5 rounded-full bg-gray-200/60 animate-pulse" />
            </div>
            {/* Headline shimmer */}
            <div className="space-y-2 mb-4">
              <div className="w-full h-4 rounded-full bg-gray-200/60 animate-pulse" />
              <div className="w-3/4 h-4 rounded-full bg-gray-200/60 animate-pulse" />
            </div>
            {/* Findings shimmer */}
            <div className="w-24 h-2 rounded-full bg-gray-100 animate-pulse mb-3" />
            <div className="space-y-3 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-32 h-3 rounded-full bg-gray-200/60 animate-pulse" />
                    <div className="w-full h-2.5 rounded-full bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            {/* Metrics shimmer */}
            <div className="flex gap-3 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 bg-gray-50 rounded-xl px-3 py-3 animate-pulse">
                  <div className="w-12 h-3.5 rounded-full bg-gray-200/60 mx-auto mb-1" />
                  <div className="w-16 h-2 rounded-full bg-gray-100 mx-auto" />
                </div>
              ))}
            </div>
            {/* Rationale shimmer */}
            <div className="space-y-1.5 mb-4">
              <div className="w-full h-2.5 rounded-full bg-gray-100 animate-pulse" />
              <div className="w-5/6 h-2.5 rounded-full bg-gray-100 animate-pulse" />
            </div>
            {/* Impact callout shimmer */}
            <div className="bg-blue-50/30 border border-blue-100/40 rounded-xl px-4 py-3 animate-pulse">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-blue-100/60" />
                  <div className="w-4/5 h-2.5 rounded-full bg-blue-100/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={workflowOutputEndRef} />
    </>
  );
  };

  const renderStandardOutputPanel = () => (
    <>
      {isThinkingActive && !output && (
        <OutputLoader variant="output" outputFormatKey={getScenarioConfig(scenario)?.outputFormatKey} />
      )}
      {generatingSlides && (
        <OutputLoader variant="slides" />
      )}
      {output && !generatingSlides && (
        <>
          {activeArtifact?.type === 'slides' ? (
            <SlideOutput
              deck={activeArtifact.data as DeckData}
              onExpand={() => setShowSlidePreview(true)}
            />
          ) : (
            <ModularOutputRenderer
              output={output}
              outputFormatKey={getScenarioConfig(scenario)?.outputFormatKey}
              visibleSections={visibleOutputSections}
              scenarioContext={{
                outcome: goals.find(g => g.id === goal)?.label,
                industry: industries.find(ind => ind.id === industry)?.label,
                scenario: getScenarioConfig(scenario)?.title,
                kpi: getScenarioConfig(scenario)?.kpi,
              }}
            />
          )}
        </>
      )}
    </>
  );

  // ============================================================
  // Stepper
  // ============================================================
  const getCurrentVisualStep = (): number => {
    if (currentStep === 'industry') return 2;
    if (currentStep === 'scenario') return 3;
    if (currentStep === 'generating' || currentStep === 'output') return 4;
    return 2;
  };

  const currentVisualStep = getCurrentVisualStep();

  const handleStepperClick = (stepNum: number) => {
    const step = EXPERIENCE_STEPS[stepNum - 1];
    if (!step) return;
    if (step.key === 'goal') {
      navigate('/experience-center');
      return;
    }
    const targetIdx = stepIndex(step.key);
    const currentIdx = stepIndex(currentStep);
    if (targetIdx < currentIdx && step.key !== 'generating') {
      setCurrentStep(step.key as FlowStep);
      setShowCTA(false);
    }
  };

  const handleEditMessage = (msgId: string) => {
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex < 0) return;

    // Find the AI message just before this user message to know which step to go back to
    const aiMsgBefore = [...messages.slice(0, msgIndex)].reverse().find(m => m.role === 'ai');

    // Truncate messages: keep everything before the user message (including the AI question)
    setMessages(prev => prev.slice(0, msgIndex));
    setShowCTA(false);
    setCollapsed(false);

    // Reset state based on what the AI was asking
    if (aiMsgBefore?.type === 'industry-cards') {
      setIndustry('');
      setScenario('');
      useExperienceLabStore.setState({ inputs: {}, currentInputStep: 0, output: null });
      setCurrentStep('industry');
    } else if (aiMsgBefore?.type === 'scenario-cards') {
      setScenario('');
      useExperienceLabStore.setState({ inputs: {}, currentInputStep: 0, output: null });
      setCurrentStep('scenario');
    } else if (aiMsgBefore?.type === 'input-options' && aiMsgBefore.stepKey) {
      // Find which input step this was and reset from there
      const stepIdx = inputSteps.findIndex(s => s.id === aiMsgBefore.stepKey);
      if (stepIdx >= 0) {
        // Clear this input and all subsequent inputs
        const clearedInputs = { ...useExperienceLabStore.getState().inputs };
        for (let i = stepIdx; i < inputSteps.length; i++) {
          delete clearedInputs[inputSteps[i].id];
        }
        useExperienceLabStore.setState({ inputs: clearedInputs, currentInputStep: stepIdx, output: null });
        setCurrentStep('inputs');
      }
    } else {
      // Fallback: reset to industry step to avoid inconsistent state
      setIndustry('');
      setScenario('');
      useExperienceLabStore.setState({ inputs: {}, currentInputStep: 0, output: null });
      setCurrentStep('industry');
    }
  };

  const handleExploreAnother = useCallback(() => {
    // Clear output and scenario, reset to scenario step
    useExperienceLabStore.setState({
      output: null, scenario: '', inputs: {},
      currentStep: 'scenario',
    });
    setShowCTA(false);
    setVisibleOutputSections(0);
    setCollapsed(false);
    cachedIndustryRef.current = null;
    // Remove old output/cta messages and add scenario prompt immediately
    setMessages(prev => [
      ...prev.filter(m => m.type !== 'output-ready' && m.type !== 'cta' && m.type !== 'refinements' && m.role !== 'thinking'),
      {
        id: `ai-${Date.now()}`,
        role: 'ai' as const,
        content: 'Would you like to try a different scenario?',
        type: 'scenario-cards' as const,
      },
    ]);
  }, []);

  // ============================================================
  // Render
  // ============================================================
  if (!goal) return null;

  const lastAIMessage = [...messages].reverse().find(m => m.role === 'ai');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Main Layout ── */}
      <div className="flex-1 overflow-hidden px-4 pb-4 pt-4">
        <div className="h-full flex flex-col rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden bg-white">
          {/* ── Inline Nav Bar (inside card) ── */}
          <div className="h-12 px-4 md:px-5 flex items-center flex-shrink-0 border-b border-gray-100">
            <button
              onClick={() => navigate('/experience-center')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
            >
              <img src="/td-icon.svg" alt="Treasure AI" className="w-6 h-6 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-900 truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Treasure AI Experience Center
              </span>
            </button>
            <div className="flex-1" />
            <button
              onClick={() => {
                trackAll(AnalyticsEvents.WALKTHROUGH_CTA_CLICK, { cta_source: 'workflow_nav', page: 'workflow', goal_id: goal, industry_id: industry, scenario_id: scenario });
                setShowBookingModal(true);
              }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
            >
              Book a walkthrough
            </button>
          </div>
          {/* Mobile Chat/Output tab bar — always mounted once output exists, never inside a ternary */}
          {hasEverOutput && isMobile && (
            <div className="flex shrink-0 border-b border-gray-100 md:hidden">
              <button
                onClick={() => setMobileView('chat')}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors cursor-pointer ${
                  mobileView === 'chat' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setMobileView('output')}
                className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors cursor-pointer ${
                  mobileView === 'output' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'
                }`}
              >
                Output
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden pt-3 pb-3">
          {hasEverOutput ? (
            isMobile ? (
              /* Mobile post-output: content area (tabs rendered above) */
              mobileView === 'chat' ? (
                <ChatPanel
                  messages={messages}
                  currentStep={currentStep}
                  lastAIMessage={lastAIMessage}
                  goal={goal}
                  industry={industry}
                  scenario={scenario}
                  generationPhase={generationPhase}
                  onIndustrySelect={handleIndustrySelect}
                  onScenarioSelect={handleScenarioSelect}
                  onRefinement={handleRefinement}
                  onBranchChoice={handleBranchChoice}
                  onExploreAnother={handleExploreAnother}
                  messagesEndRef={messagesEndRef}
                  output={output}
                  onEditMessage={handleEditMessage}
                  progressSteps={progressSteps}
                  progressHistory={progressHistory}
                  isThinkingActive={isThinkingActive}
                  usedScenarios={usedScenarios}
                />
              ) : (
                <div className="flex-1 relative overflow-hidden bg-[#F7F8FB] rounded-2xl flex flex-col">
                  {/* Sticky header — non-workflow */}
                  {!wfActive && output && visibleOutputSections >= 1 && (
                    <div className="flex items-center justify-between px-4 pt-2.5 border-b border-gray-200/60 bg-[#F7F8FB] z-10 flex-shrink-0">
                      {artifacts.length > 1 ? (
                        <div className="flex items-end gap-5 max-w-md -mb-[13px]">
                          {artifacts.map(a => {
                            const isActive = a.id === activeArtifactId;
                            const typeConfig = a.type === 'slides'
                              ? { icon: <Presentation className="w-3.5 h-3.5" />, color: 'text-indigo-600' }
                              : { icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-blue-600' };
                            return (
                              <button
                                key={a.id}
                                onClick={() => { trackAll(AnalyticsEvents.OUTPUT_TAB_VIEW, { tab_id: a.id, scenario_id: scenario }); setActiveArtifactId(a.id); }}
                                className={`relative inline-flex items-center gap-1.5 pb-2.5 text-xs cursor-pointer transition-all min-w-0 ${
                                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <span className={isActive ? typeConfig.color : 'text-gray-400'}>{typeConfig.icon}</span>
                                <span className="truncate max-w-[140px]">{a.label}</span>
                                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-2 flex-shrink-0 pb-2.5">
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                        <button
                          onClick={() => setShowSlideModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                          Create slides
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Sticky header — workflow mode */}
                  {wfActive && wfStepHistory.length > 0 && (
                    <div className="flex items-center justify-end px-4 pt-2.5 pb-1 bg-[#F7F8FB] z-10 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Scrollable content */}
                  <div className={`flex-1 overflow-y-auto pl-5 pr-5 pb-20 scrollbar-thin relative ${wfActive ? 'pt-2' : 'py-4'}`} ref={wfActive ? workflowScrollRef : undefined}>
                    {wfActive ? renderWorkflowOutputPanel() : renderStandardOutputPanel()}
                  </div>
                  {wfComplete && (
                    <div className="absolute bottom-1 right-3 z-10">
                      <FloatingContextCard output={wfStepHistory[wfStepHistory.length - 1].output as unknown as OutputData} onBook={() => setShowBookingModal(true)} goalId={goal} industryId={industry} scenarioId={scenario} />
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Desktop post-output: SplitPaneLayout */
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
                  goal={goal}
                  industry={industry}
                  scenario={scenario}
                  generationPhase={generationPhase}
                  onIndustrySelect={handleIndustrySelect}
                  onScenarioSelect={handleScenarioSelect}
                  onRefinement={handleRefinement}
                  onBranchChoice={handleBranchChoice}
                  onExploreAnother={handleExploreAnother}
                  messagesEndRef={messagesEndRef}
                  output={output}
                  showCollapse
                  onCollapse={() => setCollapsed(true)}
                  onEditMessage={handleEditMessage}
                  progressSteps={progressSteps}
                  progressHistory={progressHistory}
                  isThinkingActive={isThinkingActive}
                  usedScenarios={usedScenarios}
                />
                {/* Right: Output */}
                <div className="h-full relative bg-[#F7F8FB] rounded-2xl flex flex-col">
                  {/* Sticky header — non-workflow */}
                  {!wfActive && output && visibleOutputSections >= 1 && (
                    <div className="flex items-center justify-between px-5 pt-2.5 border-b border-gray-200/60 bg-[#F7F8FB] z-10 flex-shrink-0 rounded-t-2xl">
                      {artifacts.length > 1 ? (
                        <div className="flex items-end gap-5 max-w-md -mb-[13px]">
                          {artifacts.map(a => {
                            const isActive = a.id === activeArtifactId;
                            const typeConfig = a.type === 'slides'
                              ? { icon: <Presentation className="w-3.5 h-3.5" />, color: 'text-indigo-600' }
                              : { icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-blue-600' };
                            return (
                              <button
                                key={a.id}
                                onClick={() => { trackAll(AnalyticsEvents.OUTPUT_TAB_VIEW, { tab_id: a.id, scenario_id: scenario }); setActiveArtifactId(a.id); }}
                                className={`relative inline-flex items-center gap-1.5 pb-2.5 text-xs cursor-pointer transition-all min-w-0 ${
                                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <span className={isActive ? typeConfig.color : 'text-gray-400'}>{typeConfig.icon}</span>
                                <span className="truncate max-w-[140px]">{a.label}</span>
                                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-2 flex-shrink-0 pb-2.5">
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                        <button
                          onClick={() => setShowSlideModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                          Create slides
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Sticky header — workflow mode */}
                  {wfActive && wfStepHistory.length > 0 && (
                    <div className="flex items-center justify-end px-5 pt-2.5 pb-1 bg-[#F7F8FB] z-10 flex-shrink-0 rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Scrollable content */}
                  <div className={`flex-1 overflow-y-auto pl-5 pr-5 pb-20 scrollbar-thin relative ${wfActive ? 'pt-2' : 'py-4'}`} ref={wfActive ? workflowScrollRef : undefined}>
                    {wfActive ? renderWorkflowOutputPanel() : renderStandardOutputPanel()}
                  </div>
                  {((!wfActive && visibleOutputSections >= 8 && output) || wfComplete) && (
                    <div className="absolute bottom-1 right-4 z-10">
                      <FloatingContextCard output={wfComplete ? wfStepHistory[wfStepHistory.length - 1].output as unknown as OutputData : output} onBook={() => setShowBookingModal(true)} goalId={goal} industryId={industry} scenarioId={scenario} />
                    </div>
                  )}
                </div>
              </SplitPaneLayout>
            )
          ) : (
            /* Pre-output: Full-width chat */
            <ChatPanel
              messages={messages}
              currentStep={currentStep}
              lastAIMessage={lastAIMessage}
              goal={goal}
              industry={industry}
              scenario={scenario}
              generationPhase={generationPhase}
              onIndustrySelect={handleIndustrySelect}
              onScenarioSelect={handleScenarioSelect}
              onRefinement={handleRefinement}
                  onBranchChoice={handleBranchChoice}
              onExploreAnother={handleExploreAnother}
              messagesEndRef={messagesEndRef}
              output={output}
              onEditMessage={handleEditMessage}
              progressSteps={progressSteps}
              isThinkingActive={isThinkingActive}
            />
          )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div onClick={() => setShowShareModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[90vw] bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden">
            {/* Hero banner */}
            <div className="relative px-6 pt-6 pb-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%)' }}>
              <button onClick={() => setShowShareModal(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/50 text-gray-500 cursor-pointer z-10">
                <X className="w-4 h-4" />
              </button>
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-indigo-200/30" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-blue-200/30" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>Save this exploration</h3>
                  <p className="text-[12px] text-indigo-600/80 font-medium">Share what's possible with your team</p>
                </div>
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">Get a polished recap of this experience — including the scenarios, insights, and recommendations explored — sent straight to your inbox.</p>
            </div>
            {/* Content */}
            <div className="px-6 py-5">
              <EmailCaptureCard output={output} deckData={artifacts.find(a => a.type === 'slides')?.data as DeckData | undefined} wfStepHistory={wfStepHistory} onDone={() => setShowShareModal(false)} />
            </div>
          </div>
        </>
      )}

      {/* Slide Modal */}
      <SlideModal
        isOpen={showSlideModal}
        onClose={() => setShowSlideModal(false)}
        onGenerate={handleGenerateSlides}
        defaultTitle={getScenarioConfig(scenario)?.title}
        isGenerating={isThinkingActive}
      />

      {/* Full-screen Slide Preview */}
      {showSlidePreview && artifacts.find(a => a.type === 'slides') && (
        <SlidePreview
          deck={artifacts.find(a => a.type === 'slides')!.data as DeckData}
          onClose={() => setShowSlidePreview(false)}
        />
      )}

      {/* API Key Setup Modal */}
      <ApiKeySetupModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* Book a Walkthrough Modal */}
      <BookWalkthroughModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        goalId={goal}
        industryId={industry}
        scenarioId={scenario}
      />
    </div>
  );
}

// ============================================================
// Chat Panel (shared between full-width and split-view modes)
// ============================================================
function ChatPanel({
  messages, currentStep, lastAIMessage, goal, industry, scenario,
  generationPhase,
  onIndustrySelect, onScenarioSelect, onRefinement, onBranchChoice,
  onExploreAnother, messagesEndRef,
  showCollapse, onCollapse, output, onEditMessage,
  progressSteps = [], progressHistory = {}, isThinkingActive = false,
  usedScenarios,
}: {
  messages: ConversationMessage[];
  currentStep: FlowStep;
  lastAIMessage: ConversationMessage | undefined;
  goal: string;
  industry: string;
  scenario: string;
  generationPhase: number;
  onIndustrySelect: (id: string) => void;
  onScenarioSelect: (id: string) => void;
  onRefinement: (chip: RefinementChip) => void;
  onBranchChoice: (branchId: string) => void;
  onExploreAnother: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showCollapse?: boolean;
  onCollapse?: () => void;
  output?: OutputData | null;
  onEditMessage?: (msgId: string) => void;
  progressSteps?: ProgressStep[];
  progressHistory?: Record<string, ProgressStep[]>;
  isThinkingActive?: boolean;
  usedScenarios?: Set<string>;
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
      <div className={`flex-1 overflow-y-auto p-4 md:p-6 flex flex-col max-w-2xl mx-auto w-full ${currentStep === 'generating' ? 'gap-3' : 'gap-5 md:gap-6'}`}>
        {messages.filter(m => !(m.type === 'refinements' && !m.content)).map((msg, msgIdx) => (
          <div key={msg.id}>
            {/* Show collapsed progress before output-ready or workflow-step-result messages */}
            {(msg.type === 'output-ready' || msg.type === 'workflow-step-result') && msg.runId && progressHistory[msg.runId]?.length > 0 && (
              <div className="px-1 animate-fade-in max-w-2xl mx-auto w-full mb-3">
                <SkillProgressBlock steps={progressHistory[msg.runId]} isActive={false} />
              </div>
            )}
            {msg.type === 'cta' && currentStep === 'output' ? (
              <div className="animate-fade-in px-1 -mt-3">
                <button
                  onClick={onExploreAnother}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3" />
                  Explore another scenario
                </button>
              </div>
            ) : msg.role === 'thinking' ? (
              <div className="flex justify-start animate-fade-in">
                <div className="px-4 py-3">
                  <img src="/icons/td-avatar.png" alt="" className="w-10 h-10 animate-spin-slow" />
                </div>
              </div>
            ) : (
              <>
                {msg.content && (
                  <div className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'generation' && isThinkingActive ? 'mb-[-16px]' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className="flex items-center gap-2 group">
                        <button
                          onClick={() => onEditMessage?.(msg.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Edit response"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-fit max-w-xs px-5 py-3 bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px] rounded-br-[4px]">
                          <div className="text-sm leading-relaxed">{msg.content}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[85%] px-1 flex items-center gap-3">
                        {msg.type === 'generation' && (
                          <img src="/icons/td-avatar.png" alt="" className="w-10 h-10 animate-spin-slow flex-shrink-0" />
                        )}
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {msg.role === 'ai' && (msg.id === lastAIMessage?.id || msg.type === 'refinements' || msg.type === 'branch-choices') && (
                  <div className="mt-4 px-1 animate-fade-in-delay-1">
                    {msg.type === 'industry-cards' && currentStep === 'industry' && (
                      <IndustryCards industry={industry} goal={goal} onSelect={onIndustrySelect} />
                    )}
                    {msg.type === 'scenario-cards' && currentStep === 'scenario' && (
                      <ScenarioCards scenario={scenario} goal={goal} industry={industry} onSelect={onScenarioSelect} usedScenarios={usedScenarios} />
                    )}
                    {msg.type === 'refinements' && currentStep === 'output' && (
                      <RefinementChips scenario={scenario} industry={industry} onSelect={onRefinement} />
                    )}
                    {msg.type === 'branch-choices' && msg.stepKey && (() => {
                      const wfState = useWorkflowSessionStore.getState();
                      const stepDef = wfState.workflowDef?.steps[msg.stepKey!];
                      if (!stepDef || msg.id !== lastAIMessage?.id) return null;
                      return <BranchChoiceCards branches={stepDef.branches} onChoose={onBranchChoice} disabled={wfState.isExecutingStep} />;
                    })()}
                    {msg.type === 'workflow-complete' && (
                      <div className="mt-2">
                        <button
                          onClick={onExploreAnother}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Start a new exploration
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {/* Skill progress during active generation */}
        {isThinkingActive && progressSteps.length > 0 && (
          <div className="animate-fade-in max-w-2xl mx-auto w-full px-1">
            <SkillProgressBlock steps={progressSteps} isActive={true} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom hint + feedback */}
      <div className="shrink-0 px-6 py-2.5 flex items-center justify-between">
        <div className="text-[11px] text-gray-400">
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
    <div className="px-2 md:px-4 pt-3 pb-2">
      <div className="flex items-center justify-center gap-1 md:gap-2">
        {EXPERIENCE_STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = !isActive && (isCompleted || step.key === 'goal');

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable && !isActive}
                className={`flex items-center gap-1.5 md:gap-2 px-1.5 md:px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-black/5 cursor-default'
                    : isClickable
                      ? 'cursor-pointer hover:bg-black/[0.04]'
                      : 'cursor-not-allowed opacity-50'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-transform ${
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
                  className={`hidden md:inline text-sm transition-colors ${
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
                <svg className="w-3 h-3 md:w-4 md:h-4 mx-0.5 md:mx-1 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
function IndustryCards({ industry, goal, onSelect }: { industry: string; goal: string; onSelect: (id: string) => void }) {
  const availableIndustries = getIndustriesForOutcome(goal);
  return (
    <div className="max-w-xl">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableIndustries.map((item) => {
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
      </div>
    </div>
  );
}

// ============================================================
// Scenario Cards
// ============================================================
function ScenarioCards({ scenario, goal, industry, onSelect, usedScenarios }: { scenario: string; goal: string; industry: string; onSelect: (id: string) => void; usedScenarios?: Set<string> }) {
  const items = getScenariosForOutcome(goal, industry).filter(item => !usedScenarios?.has(item.id));
  if (items.length === 0) {
    return <div className="text-xs text-gray-400 px-1">All scenarios for this industry have been explored.</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 max-w-xl">
      {items.map((item) => {
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
            <div className="font-medium text-sm text-gray-900 mb-1">{item.label}</div>
            <div className="text-[11px] text-gray-500 leading-relaxed mb-2">{item.description}</div>
            {item.kpi && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium">
                <Target className="w-3 h-3" />
                {item.kpi}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Input Chips
// ============================================================
// ============================================================
// Refinement Chips (post-output, in chat)
// ============================================================
function RefinementChips({
  scenario, industry, onSelect,
}: {
  scenario: string;
  industry: string;
  onSelect: (chip: RefinementChip) => void;
}) {
  const chips = getRefinementChips(scenario, industry);
  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap gap-1.5">
        {chips.slice(0, 8).map((chip) => (
          <button
            key={chip.id}
            onClick={() => onSelect(chip)}
            className="px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50"
          >
            {chip.label}
          </button>
        ))}
      </div>
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
// Output Display (right panel)
// ============================================================
function OutputDisplay({ output, visibleSections }: { output: OutputData; visibleSections: number }) {
  const sectionClass = (index: number) =>
    `transition-all duration-500 ${visibleSections > index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <>
      {/* Summary Banner */}
      <div className={sectionClass(0)}>
        <div className="border border-gray-200/60 rounded-2xl p-5 mb-5 bg-white shadow-sm">
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
              <div key={i} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/60">
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
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50/60 border border-gray-100 rounded-lg">
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
              <div key={i} className="bg-gray-50/60 border border-gray-100 rounded-lg p-3.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {output.kpiFramework.map((kpi, i) => (
              <div key={i} className="bg-gray-50/60 border border-gray-100 rounded-xl p-3.5">
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
              <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50/60 border border-gray-100 rounded-lg">
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
      <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Email Capture Card (left chat, after output)
// ============================================================
function EmailCaptureCard({ output, deckData, wfStepHistory, onDone }: { output?: OutputData | null; deckData?: DeckData | null; wfStepHistory?: Array<{ stepDef: { label: string; stepType: string }; output: Record<string, unknown> | null; summary: string }>; onDone?: () => void }) {
  const hasContent = !!output || (wfStepHistory && wfStepHistory.length > 0);
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState<'slides' | 'pdf'>('slides');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const generateOutputText = (): string => {
    if (!output) return '';
    const lines: string[] = [];
    lines.push('TREASURE AI EXPERIENCE LAB — OUTPUT SUMMARY');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push('AI-GENERATED RECOMMENDATION');
    lines.push(output.summaryBanner.topRecommendation);
    lines.push(`Goal: ${output.summaryBanner.goal} | Audience: ${output.summaryBanner.audience}`);
    lines.push(output.summaryBanner.impactFraming);
    lines.push('');
    lines.push('EXECUTIVE SUMMARY');
    lines.push(output.executiveSummary);
    lines.push('');
    lines.push('AUDIENCE SEGMENTS');
    output.audienceCards.forEach(c => {
      lines.push(`- ${c.name} [${c.opportunityLevel}]: ${c.whyItMatters}`);
      lines.push(`  Action: ${c.suggestedAction}`);
    });
    lines.push('');
    lines.push('CHANNEL STRATEGY');
    output.channelStrategy.forEach(c => {
      lines.push(`- ${c.channel}: ${c.role} | ${c.messageAngle}`);
    });
    lines.push('');
    lines.push(output.scenarioCore.title.toUpperCase());
    output.scenarioCore.sections.forEach(s => {
      lines.push(`${s.label}: ${s.content}`);
    });
    lines.push('');
    lines.push('KPI FRAMEWORK');
    output.kpiFramework.forEach(k => {
      lines.push(`- [${k.type}] ${k.name}: ${k.note}`);
    });
    lines.push('');
    lines.push('RECOMMENDED NEXT ACTIONS');
    output.nextActions.forEach(a => {
      lines.push(`- [${a.priority}] ${a.action}`);
    });
    lines.push('');
    lines.push('---');
    lines.push('Generated by Treasure AI Experience Center');
    return lines.join('\n');
  };

  const handleSend = async () => {
    if (!email || !email.includes('@')) return;
    setStatus('sending');

    try {
      // Pre-import all modules
      const [{ sendEmail }, slidesMod, pdfMod] = await Promise.all([
        import('../services/engage-api'),
        format === 'slides' && hasContent ? import('../services/export-slides') : Promise.resolve(null),
        format === 'pdf' && hasContent ? import('../services/export-pdf') : Promise.resolve(null),
      ]);

      console.log('[Share] format:', format, 'hasOutput:', !!output, 'hasDeck:', !!deckData, 'wfSteps:', wfStepHistory?.length || 0, 'firstStepSummary:', wfStepHistory?.[0]?.summary?.substring(0, 50));

      // Generate file
      let blob: Blob | null = null;
      let filename = '';

      if (format === 'slides' && slidesMod) {
        if (deckData) {
          blob = await slidesMod.generatePptx(deckData);
        } else if (wfStepHistory && wfStepHistory.length > 0) {
          blob = await slidesMod.generatePptxFromWorkflow(wfStepHistory);
        } else if (output) {
          blob = await slidesMod.generatePptxFromOutput(output);
        }
        filename = 'treasure-ai-slides.pptx';
      } else if (format === 'pdf' && pdfMod) {
        blob = await pdfMod.generatePdf(output || null, wfStepHistory);
        filename = 'treasure-ai-report.pdf';
      }

      console.log('[Share] blob:', blob ? `${blob.size} bytes` : 'null');

      // Trigger download
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 3000);
      }

      // Send confirmation email with full output
      sendEmail(email, output || null, wfStepHistory).catch(err => console.error('Email send failed:', err));

      setStatus('sent');
    } catch (err) {
      console.error('Export/email error:', err);
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">On its way!</p>
        <p className="text-xs text-gray-500 mb-5">Your recap is being sent to <span className="font-medium text-gray-700">{email}</span></p>

        {/* Book walkthrough CTA */}
        <div className="rounded-xl p-4 text-left" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
          <div className="flex items-start gap-3">
            <img src="/icons/td-avatar.png" alt="" className="w-10 h-10 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white mb-1">Ready to see this with your real data?</p>
              <p className="text-[11px] text-indigo-200 leading-relaxed mb-3">Book a personalized walkthrough and we'll show you exactly how Treasure AI works with your goals, your audience, and your stack.</p>
              <button
                onClick={() => { if (onDone) onDone(); setTimeout(() => window.dispatchEvent(new Event('open-booking-modal')), 200); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition-colors cursor-pointer shadow-sm"
              >
                Book a walkthrough
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Format selector */}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose format</p>
      <div className="flex gap-2.5 mb-4">
        <button
          onClick={() => setFormat('slides')}
          className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
            format === 'slides'
              ? 'border-indigo-400 bg-indigo-50/50 shadow-[0_0_0_1px_rgba(99,102,241,0.1)]'
              : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Presentation className={`w-5 h-5 ${format === 'slides' ? 'text-indigo-600' : 'text-gray-400'}`} />
          <span className={`text-xs font-semibold ${format === 'slides' ? 'text-indigo-700' : 'text-gray-500'}`}>Slide Deck</span>
          <span className={`text-[10px] ${format === 'slides' ? 'text-indigo-500' : 'text-gray-400'}`}>Walk your team through it</span>
        </button>
        <button
          onClick={() => setFormat('pdf')}
          className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border-2 transition-all cursor-pointer ${
            format === 'pdf'
              ? 'border-indigo-400 bg-indigo-50/50 shadow-[0_0_0_1px_rgba(99,102,241,0.1)]'
              : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-indigo-600' : 'text-gray-400'}`} />
          <span className={`text-xs font-semibold ${format === 'pdf' ? 'text-indigo-700' : 'text-gray-500'}`}>PDF Report</span>
          <span className={`text-[10px] ${format === 'pdf' ? 'text-indigo-500' : 'text-gray-400'}`}>Save for reference</span>
        </button>
      </div>

      {/* Email input */}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Your email</p>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@company.com"
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-gray-300"
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!email || !email.includes('@') || status === 'sending'}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          email && email.includes('@') && status !== 'sending'
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {status === 'sending' ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing your recap...
          </span>
        ) : (
          `Send me the ${format === 'slides' ? 'slides' : 'PDF'}`
        )}
      </button>
      <p className="text-[10px] text-gray-400 text-center mt-2.5">We'll only use your email to deliver this recap.</p>
    </div>
  );
}

// ============================================================
// Floating Context Card (bottom of right output panel)
// ============================================================
function FloatingContextCard({
  output,
  onBook,
  goalId,
  industryId,
  scenarioId,
}: {
  output: OutputData;
  onBook: () => void;
  goalId?: string;
  industryId?: string;
  scenarioId?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleBook = (ctaSource: string) => {
    trackAll(AnalyticsEvents.WALKTHROUGH_CTA_CLICK, { cta_source: ctaSource, page: 'workflow', goal_id: goalId, industry_id: industryId, scenario_id: scenarioId });
    onBook();
  };

  return (
    <div className="border border-gray-200 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] overflow-hidden bg-white w-full max-w-sm">
      {/* Header bar — always visible */}
      <div className="flex items-center px-5 py-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700">Treasure AI Impact</span>
        </div>
        <div className="flex-1" />
        {!isExpanded && (
          <button
            onClick={() => handleBook('impact_card_collapsed')}
            className="inline-flex items-center px-3.5 py-1.5 bg-gray-900 text-white rounded-full text-[11px] font-semibold hover:bg-gray-800 transition-colors shadow-sm mr-2 flex-shrink-0 cursor-pointer"
          >
            Book a walkthrough
          </button>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-black/5 rounded transition-colors flex-shrink-0 ml-2"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Hero section */}
        <div className="mx-4 rounded-xl overflow-hidden" style={{ backgroundImage: 'url(/icons/cta-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="flex items-start p-5">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium text-gray-600 mb-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
                Tailored for your scenario
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                See this in action
              </h3>
              <p className="text-xs text-gray-500 mb-3">with your real data and goals</p>
              <button
                onClick={() => handleBook('impact_card_expanded')}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Book a walkthrough
              </button>
            </div>
            <img src="/icons/td-avatar.png" alt="" className="flex-shrink-0 w-14 h-14 ml-3" />
          </div>
        </div>

        {/* Impact list */}
        <div className="px-5 pt-4 pb-2">
          <div className="space-y-3">
            {(output.insightPanel?.businessImpact ?? []).slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(52,211,153,0.1)' }}>
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-xs text-gray-700 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-3" />
      </div>
    </div>
  );
}
