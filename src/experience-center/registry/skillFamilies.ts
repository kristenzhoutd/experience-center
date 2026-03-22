import type { SkillFamily, SkillFamilyDef } from './types';

export const skillFamilies: Record<SkillFamily, SkillFamilyDef> = {
  'campaign-brief': {
    id: 'campaign-brief',
    label: 'Campaign Brief Creation',
    description: 'Generate a strategic campaign brief with audience, channels, messaging, and KPI framework.',
    defaultOutputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
  },
  'journey': {
    id: 'journey',
    label: 'Journey Creation',
    description: 'Design a multi-step customer journey with triggers, channels, and success metrics.',
    defaultOutputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
  },
  'segment-opportunity': {
    id: 'segment-opportunity',
    label: 'Segment Opportunity Discovery',
    description: 'Identify high-potential customer segments with activation strategies and sizing.',
    defaultOutputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
  },
  'performance-analysis': {
    id: 'performance-analysis',
    label: 'Performance Analysis',
    description: 'Diagnose campaign performance issues and generate optimization recommendations.',
    defaultOutputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
  },
  'insight-summary': {
    id: 'insight-summary',
    label: 'Insight Summary',
    description: 'Surface actionable business insights from customer and campaign signals.',
    defaultOutputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
  },
};
