/**
 * Workflow: Travel / Campaign Performance — "Optimize channel mix by traveler type"
 * Scenario: perf-travel-1
 */

import type { WorkflowDef } from '../../orchestration/types';

export const perfTravel1Workflow: WorkflowDef = {
  workflowId: 'wf-perf-travel-1',
  scenarioId: 'perf-travel-1',
  title: 'Optimize Channel Mix by Traveler Type',
  entryStepId: 'analyze-channels',
  steps: {
    'analyze-channels': {
      stepId: 'analyze-channels',
      label: 'Diagnose channel performance by traveler segment',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'kpi_framework'],
      promptOverlay: 'Analyze channel performance across traveler segments (business, leisure, loyalty, premium). Evaluate ROAS, booking conversion rate, and cost per acquisition by channel. Identify which channels underperform for which traveler types and where budget reallocation would have the highest impact.',
      branches: [
        {
          branchId: 'inspect-channel',
          label: 'Inspect the underperforming channel',
          description: 'Deep-dive into the channel with the lowest ROAS to understand what is driving poor performance',
          icon: 'Search',
          nextStepId: 'inspect-channel',
          recommendation: true,
          contextUpdate: { focus: 'underperforming-channel', action: 'inspect' },
        },
        {
          branchId: 'compare-roi',
          label: 'Compare channel ROI across segments',
          description: 'See a side-by-side comparison of all channels ranked by ROI per traveler segment',
          icon: 'BarChart3',
          nextStepId: 'compare-channels',
          contextUpdate: { focus: 'all-channels', action: 'compare' },
        },
        {
          branchId: 'create-plan',
          label: 'Generate optimized allocation',
          description: 'Skip deeper analysis and create an optimized channel allocation plan directly',
          icon: 'Zap',
          nextStepId: 'create-plan',
          contextUpdate: { focus: 'top-opportunity', action: 'create' },
        },
      ],
      summaryTemplate: 'I diagnosed channel performance across traveler segments and identified significant ROAS variations. There are clear opportunities to reallocate budget for better returns.',
    },

    'inspect-channel': {
      stepId: 'inspect-channel',
      label: 'Deep-dive into the lowest-performing channel',
      stepType: 'inspect',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'kpi_framework'],
      promptOverlay: 'Deep-dive into the underperforming channel identified in the prior analysis. Examine booking funnel drop-off rates, audience targeting gaps, message relevance scores, and timing patterns. Identify the root causes of poor performance and specific recovery levers.',
      branches: [
        {
          branchId: 'create-from-inspect',
          label: 'Create optimized channel plan',
          description: 'Build a reallocation plan based on the root causes you uncovered',
          icon: 'FileText',
          nextStepId: 'create-plan',
          recommendation: true,
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'create' },
        },
        {
          branchId: 'compare-from-inspect',
          label: 'Compare all channels side-by-side',
          description: 'See how this channel stacks up against others before making changes',
          icon: 'BarChart3',
          nextStepId: 'compare-channels',
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'compare' },
        },
      ],
      summaryTemplate: 'I investigated the underperforming channel and identified the key drivers of poor ROAS. The root causes suggest targeted fixes rather than wholesale budget cuts.',
    },

    'compare-channels': {
      stepId: 'compare-channels',
      label: 'Compare channel ROI across traveler segments',
      stepType: 'compare',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'kpi_framework'],
      promptOverlay: 'Compare all marketing channels side-by-side across traveler segments. Rank each channel by: ROAS, cost per booking, conversion rate, and engagement quality. Identify the optimal channel for each traveler type and the biggest reallocation opportunities.',
      branches: [
        {
          branchId: 'create-from-compare',
          label: 'Create optimized channel plan',
          description: 'Build a channel reallocation plan based on the comparison results',
          icon: 'FileText',
          nextStepId: 'create-plan',
          recommendation: true,
          contextUpdate: { analysisDepth: 'comparison', action: 'create' },
        },
        {
          branchId: 'inspect-from-compare',
          label: 'Inspect the top opportunity',
          description: 'Dive deeper into the highest-potential channel reallocation',
          icon: 'Search',
          nextStepId: 'inspect-channel',
          contextUpdate: { analysisDepth: 'comparison', action: 'inspect' },
        },
      ],
      summaryTemplate: 'I compared channel ROI across all traveler segments and ranked reallocation opportunities by expected impact.',
    },

    'create-plan': {
      stepId: 'create-plan',
      label: 'Create optimized channel allocation plan',
      stepType: 'create',
      executionMode: 'llm',
      skillFamily: 'campaign-brief',
      outputModules: ['campaign_brief', 'channel_strategy', 'next_actions'],
      promptOverlay: 'Create a detailed channel reallocation plan that optimizes ROAS across traveler segments. Include specific budget shift recommendations, channel-by-segment assignments, messaging adjustments, and a phased rollout timeline. Ground recommendations in the performance data analyzed in prior steps.',
      branches: [
        {
          branchId: 'build-ab-test',
          label: 'Build an A/B test plan',
          description: 'Design a controlled test to validate the reallocation before full rollout',
          icon: 'Target',
          nextStepId: 'optimize-test',
          recommendation: true,
          contextUpdate: { hasChannelPlan: 'true', action: 'optimize' },
        },
        {
          branchId: 'view-summary',
          label: 'View workflow summary',
          description: 'See everything we built in this session',
          icon: 'CheckCircle',
          nextStepId: 'summary',
          contextUpdate: { hasChannelPlan: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: 'I created an optimized channel allocation plan with specific budget shifts and messaging adjustments per traveler segment.',
    },

    'optimize-test': {
      stepId: 'optimize-test',
      label: 'Design A/B test for channel reallocation',
      stepType: 'optimize',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'kpi_framework', 'next_actions'],
      promptOverlay: 'Design an A/B test plan to validate the proposed channel reallocation. Define test groups, control groups, success metrics, test duration, statistical significance thresholds, and rollback criteria. Include specific KPI targets for the test period.',
      branches: [
        {
          branchId: 'finish-test',
          label: 'View workflow summary',
          description: 'See the complete analysis, plan, and test design',
          icon: 'CheckCircle',
          nextStepId: 'summary',
          recommendation: true,
          contextUpdate: { hasTestPlan: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: 'I designed an A/B test plan to validate the channel reallocation before full rollout.',
    },

    'summary': {
      stepId: 'summary',
      label: 'Workflow complete',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'kpi_framework', 'next_actions'],
      promptOverlay: 'Summarize the entire workflow session for channel optimization. Recap what was analyzed, what was found, what was built, and the expected ROAS improvement. Provide clear next steps for implementing the plan in Treasure Data.',
      branches: [],
      summaryTemplate: 'Here is everything we built in this session.',
    },
  },
};
