/**
 * Workflow: Retail / Retention — "Create a win-back campaign for inactive members"
 * Scenario: ret-retail-3
 */

import type { WorkflowDef } from '../../orchestration/types';

export const retRetail3Workflow: WorkflowDef = {
  workflowId: 'wf-ret-retail-3',
  scenarioId: 'ret-retail-3',
  title: 'Win-Back Campaign for Inactive Members',
  entryStepId: 'analyze-segments',
  steps: {
    'analyze-segments': {
      stepId: 'analyze-segments',
      label: 'Analyze inactive member segments',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'segment-opportunity',
      outputModules: ['segment_cards', 'kpi_framework', 'insight_panel'],
      promptOverlay: 'Focus on identifying inactive and lapsed customer segments. Analyze churn risk distribution, days since last purchase, and lifetime value by segment. Highlight which segments have the highest reactivation potential.',
      branches: [
        {
          branchId: 'inspect-lapsed',
          label: 'Inspect high-value lapsed profiles',
          description: 'Deep-dive into the segment with highest CLV to understand disengagement drivers',
          icon: 'Search',
          nextStepId: 'inspect-profiles',
          recommendation: true,
          contextUpdate: { focusSegment: 'high-value-lapsed', action: 'inspect' },
        },
        {
          branchId: 'compare-segments',
          label: 'Compare reactivation potential',
          description: 'See which segments have the best win-back probability based on behavioral signals',
          icon: 'BarChart3',
          nextStepId: 'compare-reactivation',
          contextUpdate: { focusSegment: 'all-segments', action: 'compare' },
        },
        {
          branchId: 'create-campaign',
          label: 'Create campaign immediately',
          description: 'Skip deeper analysis and go straight to building a win-back campaign brief',
          icon: 'Zap',
          nextStepId: 'create-brief',
          contextUpdate: { focusSegment: 'top-segment', action: 'create' },
        },
      ],
      summaryTemplate: 'I analyzed the inactive member segments and identified key patterns in churn risk and lifetime value. The data shows clear opportunities for targeted reactivation.',
    },

    'inspect-profiles': {
      stepId: 'inspect-profiles',
      label: 'Inspect high-value lapsed profiles',
      stepType: 'inspect',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'segment_cards', 'kpi_framework'],
      promptOverlay: 'Deep-dive into the high-value lapsed customer segment. Analyze individual-level behavioral patterns: last purchase timing, purchase frequency decline, channel engagement drop-off, and competitive switching signals. Identify the top disengagement drivers and recovery levers.',
      branches: [
        {
          branchId: 'create-from-inspect',
          label: 'Create a targeted win-back campaign',
          description: 'Build a campaign brief tailored to the disengagement patterns you just uncovered',
          icon: 'FileText',
          nextStepId: 'create-brief',
          recommendation: true,
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'create' },
        },
        {
          branchId: 'build-journey',
          label: 'Build a reactivation journey',
          description: 'Design a multi-stage journey to gradually re-engage lapsed customers',
          icon: 'GitBranch',
          nextStepId: 'create-journey',
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'journey' },
        },
      ],
      summaryTemplate: 'I inspected the high-value lapsed segment and identified the primary disengagement drivers. The behavioral signals suggest a targeted, multi-touch approach would be most effective.',
    },

    'compare-reactivation': {
      stepId: 'compare-reactivation',
      label: 'Compare reactivation potential across segments',
      stepType: 'compare',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'segment_cards', 'kpi_framework'],
      promptOverlay: 'Compare reactivation potential across all inactive customer segments. Evaluate each segment on: predicted reactivation probability, expected revenue recovery, cost-to-reactivate, and time-to-reactivate. Rank segments by ROI-adjusted reactivation priority.',
      branches: [
        {
          branchId: 'create-from-compare',
          label: 'Create campaign for top segment',
          description: 'Build a win-back campaign targeting the highest-ROI reactivation segment',
          icon: 'FileText',
          nextStepId: 'create-brief',
          recommendation: true,
          contextUpdate: { analysisDepth: 'comparison', action: 'create' },
        },
        {
          branchId: 'inspect-from-compare',
          label: 'Inspect the top segment deeper',
          description: 'Dive deeper into the highest-priority segment before building the campaign',
          icon: 'Search',
          nextStepId: 'inspect-profiles',
          contextUpdate: { analysisDepth: 'comparison', action: 'inspect' },
        },
      ],
      summaryTemplate: 'I compared reactivation potential across all inactive segments and ranked them by expected ROI. The analysis highlights clear priority targets for your win-back efforts.',
    },

    'create-brief': {
      stepId: 'create-brief',
      label: 'Create targeted win-back campaign',
      stepType: 'create',
      executionMode: 'llm',
      skillFamily: 'campaign-brief',
      outputModules: ['campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions'],
      promptOverlay: 'Create a detailed win-back campaign brief for the target segment identified in the prior analysis. Include specific re-engagement messaging, phased outreach timeline, channel strategy optimized for lapsed customers, and projected reactivation metrics.',
      branches: [
        {
          branchId: 'build-journey-from-brief',
          label: 'Build the reactivation journey',
          description: 'Design the multi-stage customer journey that brings this campaign to life',
          icon: 'GitBranch',
          nextStepId: 'create-journey',
          recommendation: true,
          contextUpdate: { hasCampaignBrief: 'true', action: 'journey' },
        },
        {
          branchId: 'view-summary',
          label: 'View workflow summary',
          description: 'See everything we built in this session',
          icon: 'CheckCircle',
          nextStepId: 'summary',
          contextUpdate: { hasCampaignBrief: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: 'I created a targeted win-back campaign brief with phased outreach, personalized messaging, and channel-optimized delivery strategy.',
    },

    'create-journey': {
      stepId: 'create-journey',
      label: 'Build multi-stage reactivation journey',
      stepType: 'create',
      executionMode: 'llm',
      skillFamily: 'journey',
      outputModules: ['journey_map', 'audience_rationale', 'channel_strategy', 'kpi_framework'],
      promptOverlay: 'Design a multi-stage reactivation journey for the win-back campaign. Include 4-5 stages with specific triggers, channels, messaging, wait times, and stage goals. Optimize for gradual re-engagement rather than aggressive outreach.',
      branches: [
        {
          branchId: 'finish-journey',
          label: 'View workflow summary',
          description: 'See the complete analysis, campaign, and journey we built together',
          icon: 'CheckCircle',
          nextStepId: 'summary',
          recommendation: true,
          contextUpdate: { hasJourney: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: 'I designed a multi-stage reactivation journey with personalized touchpoints across your preferred channels.',
    },

    'summary': {
      stepId: 'summary',
      label: 'Workflow complete',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'kpi_framework', 'next_actions', 'insight_panel'],
      promptOverlay: 'Summarize the entire workflow session. Recap what was analyzed, what was created, and the expected business impact. Provide clear next steps for moving from this AI-generated plan to real execution in Treasure Data.',
      branches: [],
      summaryTemplate: 'Here is everything we built in this session.',
    },
  },
};
