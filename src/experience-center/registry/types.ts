/**
 * Shared types for the Experience Center scenario-to-skill architecture.
 */

// ── Skill Families ──

export type SkillFamily =
  | 'campaign-brief'
  | 'journey'
  | 'segment-opportunity'
  | 'performance-analysis'
  | 'insight-summary';

// ── Output Format Modules ──

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

// ── Scenario Configuration ──

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

// ── Skill Family Definition ──

export interface SkillFamilyDef {
  id: SkillFamily;
  label: string;
  description: string;
  defaultOutputModules: OutputModule[];
}

// ── Resolved Skill Request (assembled at runtime) ──

export interface SkillRequest {
  scenario: ScenarioConfig;
  industryContext: IndustryContext;
  skillFamily: SkillFamilyDef;
}

// ── Industry Context / Sandbox ──

export interface IndustryContext {
  id: string;
  label: string;
  sampleSegments: SampleSegment[];
  sampleMetrics: Record<string, string>;
  channelPreferences: string[];
  verticalTerminology: Record<string, string>;
  sampleDataContext: string;
}

export interface SampleSegment {
  name: string;
  description: string;
  size: string;
  valueLevel: 'High' | 'Medium' | 'Low';
}
