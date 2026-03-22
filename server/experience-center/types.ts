/**
 * Server-side types for Experience Center.
 * Mirrors the client-side types for use in server code.
 */

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
