export type SkillFamily =
  | 'campaign-brief'
  | 'journey'
  | 'segment-opportunity'
  | 'performance-analysis'
  | 'insight-summary';

export type OutputModule =
  | 'executive_summary'
  | 'audience_rationale'
  | 'channel_strategy'
  | 'campaign_brief'
  | 'journey_map'
  | 'segment_cards'
  | 'performance_diagnosis'
  | 'insight_summary'
  | 'kpi_framework'
  | 'next_actions'
  | 'insight_panel';

export interface ScenarioConfig {
  scenarioId: string;
  outcome: string;
  industry: string;
  title: string;
  description: string;
  kpi: string;
  skillFamily: SkillFamily;
  outputFormatKey: string;
  outputModules: OutputModule[];
  audienceFocus?: string;
  strategicIntent?: string;
  promptOverlay?: string;
}

// ── Workflow Types ──

export type StepType = 'analyze' | 'inspect' | 'create' | 'compare' | 'activate' | 'optimize';
export type ExecutionMode = 'llm' | 'simulated';

export interface BranchDef {
  branchId: string;
  label: string;
  description: string;
  icon?: string;
  nextStepId: string;
  recommendation?: boolean;
  contextUpdate?: Record<string, string>;
}

export interface WorkflowStepDef {
  stepId: string;
  label: string;
  stepType: StepType;
  executionMode: ExecutionMode;
  skillFamily?: SkillFamily;
  outputModules: OutputModule[];
  simulatedArtifactKey?: string;
  promptOverlay?: string;
  branches: BranchDef[];
  summaryTemplate: string;
}

export interface WorkflowDef {
  workflowId: string;
  scenarioId: string;
  title: string;
  entryStepId: string;
  steps: Record<string, WorkflowStepDef>;
}

export interface StepResult {
  stepId: string;
  stepDef: WorkflowStepDef;
  chosenBranchId: string | null;
  output: Record<string, unknown> | null;
  summary: string;
  timestamp: number;
}

// ── Industry Types ──

export interface IndustryContext {
  id: string;
  label: string;
  sampleSegments: Array<{
    name: string;
    description: string;
    size: string;
    valueLevel: 'High' | 'Medium' | 'Low';
  }>;
  sampleMetrics: Record<string, string>;
  channelPreferences: string[];
  verticalTerminology: Record<string, string>;
  sampleDataContext: string;
}
