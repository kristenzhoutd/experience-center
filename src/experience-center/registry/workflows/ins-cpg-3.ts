/**
 * Workflow: CPG / Insights — "Find households with highest growth potential"
 * Scenario: ins-cpg-3
 */

import type { WorkflowDef } from '../../orchestration/types';

export const insCpg3Workflow: WorkflowDef = {
  workflowId: 'wf-ins-cpg-3',
  scenarioId: 'ins-cpg-3',
  title: 'Find Households with Highest Growth Potential',
  entryStepId: 'analyze-growth',
  steps: {
    'analyze-growth': {
      stepId: 'analyze-growth',
      label: 'Identify high-growth household segments',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'segment-opportunity',
      outputModules: ['segment_cards', 'kpi_framework'],
      promptOverlay: 'Analyze household segments to identify those with the highest growth potential. Evaluate by: basket expansion opportunity, category penetration gaps, purchase frequency trajectory, and brand switching signals. Focus on households that show upward behavioral trends but are not yet at full potential.',
      branches: [
        {
          branchId: 'inspect-growth',
          label: 'Inspect the top growth segment',
          description: 'Deep-dive into the highest-potential household segment to understand what drives their growth trajectory',
          icon: 'Search',
          nextStepId: 'inspect-segment',
          recommendation: true,
          contextUpdate: { focusSegment: 'top-growth', action: 'inspect' },
        },
        {
          branchId: 'compare-potential',
          label: 'Compare growth vs retention potential',
          description: 'See how growth-focused segments stack up against retention-focused segments for investment prioritization',
          icon: 'BarChart3',
          nextStepId: 'compare-segments',
          contextUpdate: { focusSegment: 'all-segments', action: 'compare' },
        },
        {
          branchId: 'create-plan',
          label: 'Build targeting plan immediately',
          description: 'Skip deeper analysis and create an activation plan for the top growth segments',
          icon: 'Zap',
          nextStepId: 'create-plan',
          contextUpdate: { focusSegment: 'top-segment', action: 'create' },
        },
      ],
      summaryTemplate: 'I identified household segments with the highest growth potential based on basket expansion, category penetration, and behavioral trajectory signals.',
    },

    'inspect-segment': {
      stepId: 'inspect-segment',
      label: 'Deep-dive into the highest-growth household segment',
      stepType: 'inspect',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'segment_cards'],
      promptOverlay: 'Deep-dive into the highest-growth household segment. Analyze their purchase patterns, category preferences, brand affinity, price sensitivity, promotion responsiveness, and channel engagement. Identify what specific behaviors signal growth potential and what levers can accelerate their trajectory.',
      branches: [
        {
          branchId: 'create-from-inspect',
          label: 'Create targeting plan',
          description: 'Build an activation plan tailored to this segment\'s growth drivers',
          icon: 'FileText',
          nextStepId: 'create-plan',
          recommendation: true,
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'create' },
        },
        {
          branchId: 'compare-from-inspect',
          label: 'Compare with other segments',
          description: 'See how this segment compares to alternatives before committing',
          icon: 'BarChart3',
          nextStepId: 'compare-segments',
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'compare' },
        },
      ],
      summaryTemplate: 'I investigated the highest-growth segment and identified the key behavioral drivers and acceleration levers.',
    },

    'compare-segments': {
      stepId: 'compare-segments',
      label: 'Compare household segments by growth potential',
      stepType: 'compare',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'kpi_framework'],
      promptOverlay: 'Compare household segments side-by-side on growth potential metrics. Evaluate each segment by: projected basket expansion, category penetration headroom, purchase frequency acceleration, brand loyalty trajectory, and cost-to-acquire. Rank segments by ROI-adjusted growth priority and recommend the optimal investment allocation.',
      branches: [
        {
          branchId: 'create-from-compare',
          label: 'Create targeting plan for top segment',
          description: 'Build an activation plan for the highest-ROI growth segment',
          icon: 'FileText',
          nextStepId: 'create-plan',
          recommendation: true,
          contextUpdate: { analysisDepth: 'comparison', action: 'create' },
        },
        {
          branchId: 'inspect-from-compare',
          label: 'Inspect the winner deeper',
          description: 'Dive deeper into the top-ranked segment before building the plan',
          icon: 'Search',
          nextStepId: 'inspect-segment',
          contextUpdate: { analysisDepth: 'comparison', action: 'inspect' },
        },
      ],
      summaryTemplate: 'I compared household segments by growth potential and ranked them by expected ROI for targeting investment.',
    },

    'create-plan': {
      stepId: 'create-plan',
      label: 'Build activation plan for high-growth households',
      stepType: 'create',
      executionMode: 'llm',
      skillFamily: 'campaign-brief',
      outputModules: ['campaign_brief', 'channel_strategy', 'next_actions'],
      promptOverlay: 'Create a detailed activation plan targeting the high-growth household segment. Include category-specific messaging, retail media channel strategy, promotion cadence, cross-category expansion tactics, and a phased rollout timeline. Ground recommendations in the growth drivers identified in prior analysis.',
      branches: [
        {
          branchId: 'optimize-media',
          label: 'Optimize media allocation',
          description: 'Estimate the optimal media budget split across channels for this segment',
          icon: 'Target',
          nextStepId: 'optimize-media',
          recommendation: true,
          contextUpdate: { hasActivationPlan: 'true', action: 'optimize' },
        },
        {
          branchId: 'view-summary',
          label: 'View workflow summary',
          description: 'See everything we built in this session',
          icon: 'CheckCircle',
          nextStepId: 'summary',
          contextUpdate: { hasActivationPlan: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: 'I created an activation plan for the high-growth segment with category-specific messaging and channel strategy.',
    },

    'optimize-media': {
      stepId: 'optimize-media',
      label: 'Estimate optimal media budget allocation',
      stepType: 'optimize',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'kpi_framework', 'next_actions'],
      promptOverlay: 'Estimate the optimal media budget allocation for reaching the high-growth household segment. Recommend budget splits across retail media, digital, social, and direct channels. Include expected reach, frequency, cost-per-acquisition, and projected ROAS for each channel. Provide a phased investment recommendation.',
      branches: [
        {
          branchId: 'finish-media',
          label: 'View workflow summary',
          description: 'See the complete analysis, activation plan, and media recommendation',
          icon: 'CheckCircle',
          nextStepId: 'summary',
          recommendation: true,
          contextUpdate: { hasMediaPlan: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: 'I estimated the optimal media budget allocation with channel-by-channel ROAS projections.',
    },

    'summary': {
      stepId: 'summary',
      label: 'Workflow complete',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'kpi_framework', 'next_actions'],
      promptOverlay: 'Summarize the entire workflow session for high-growth household targeting. Recap what was analyzed, which segments were identified, what activation plan was created, and the expected business impact. Provide clear next steps for implementation in Treasure Data.',
      branches: [],
      summaryTemplate: 'Here is everything we built in this session.',
    },
  },
};
