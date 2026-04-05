/**
 * Workflow Factory — generates a WorkflowDef from any ScenarioConfig
 * using outcome-based templates with dynamic label injection.
 *
 * 4 templates: revenue, campaign-performance, retention, insights
 * Each produces a 6-step branching workflow with scenario-specific language.
 */

import type { ScenarioConfig, WorkflowDef, WorkflowStepDef, SkillFamily } from '../../orchestration/types';

type OutcomeKey = 'revenue' | 'campaign-performance' | 'retention' | 'insights';

interface TemplateConfig {
  analyzeLabel: (s: ScenarioConfig) => string;
  analyzePrompt: (s: ScenarioConfig) => string;
  analyzeSkill: SkillFamily;
  inspectLabel: (s: ScenarioConfig) => string;
  inspectPrompt: (s: ScenarioConfig) => string;
  compareLabel: (s: ScenarioConfig) => string;
  comparePrompt: (s: ScenarioConfig) => string;
  createLabel: (s: ScenarioConfig) => string;
  createPrompt: (s: ScenarioConfig) => string;
  enhanceLabel: (s: ScenarioConfig) => string;
  enhancePrompt: (s: ScenarioConfig) => string;
  enhanceType: 'optimize' | 'create';
  enhanceSkill: SkillFamily;
  // Branch labels
  inspectBranch: (s: ScenarioConfig) => string;
  inspectBranchDesc: (s: ScenarioConfig) => string;
  compareBranch: (s: ScenarioConfig) => string;
  compareBranchDesc: (s: ScenarioConfig) => string;
  createBranch: (s: ScenarioConfig) => string;
  createBranchDesc: (s: ScenarioConfig) => string;
  enhanceBranch: (s: ScenarioConfig) => string;
  enhanceBranchDesc: (s: ScenarioConfig) => string;
}

const audience = (s: ScenarioConfig) => s.audienceFocus || 'target audience';

const templates: Record<OutcomeKey, TemplateConfig> = {
  revenue: {
    analyzeLabel: (s) => `Analyze ${audience(s)} for revenue opportunities`,
    analyzePrompt: (s) => `Analyze audience segments to identify revenue growth opportunities. ${s.strategicIntent || s.description}. Focus on ${audience(s)}. Primary KPI: ${s.kpi}. Evaluate lifetime value, purchase frequency, basket size, and cross-sell potential.`,
    analyzeSkill: 'segment-opportunity',
    inspectLabel: (s) => `Deep-dive into ${audience(s)}`,
    inspectPrompt: (s) => `Deep-dive into the highest-revenue segment. Analyze purchase patterns, channel preferences, price sensitivity, and expansion signals. Identify specific growth levers for ${audience(s)}.`,
    compareLabel: (s) => `Compare segments by revenue potential`,
    comparePrompt: (s) => `Compare audience segments side-by-side on revenue potential. Rank by: projected revenue uplift, cost-to-activate, expected ROI, and time-to-impact. Focus on ${s.kpi}.`,
    createLabel: (s) => `Create ${s.title.toLowerCase().includes('journey') ? 'journey' : 'revenue growth plan'}`,
    createPrompt: (s) => `Create a detailed plan based on the analysis. ${s.strategicIntent || s.description}. Include phased approach, channel strategy, messaging, and projected ${s.kpi} improvement.`,
    enhanceLabel: (s) => `Optimize ${s.kpi} strategy`,
    enhancePrompt: (s) => `Optimize the plan for maximum ${s.kpi} impact. Recommend budget allocation, A/B test design, and measurement framework. Project expected improvements.`,
    enhanceType: 'optimize',
    enhanceSkill: 'performance-analysis',
    inspectBranch: (s) => `Inspect the top revenue segment`,
    inspectBranchDesc: (s) => `Deep-dive into the highest-potential segment to understand growth drivers for ${audience(s)}`,
    compareBranch: () => `Compare revenue potential across segments`,
    compareBranchDesc: () => `See which segments offer the best ROI for revenue investment`,
    createBranch: () => `Create growth plan immediately`,
    createBranchDesc: () => `Skip deeper analysis and build the revenue plan directly`,
    enhanceBranch: (s) => `Optimize for maximum ${s.kpi} impact`,
    enhanceBranchDesc: () => `Fine-tune the plan with budget optimization and testing strategy`,
  },

  'campaign-performance': {
    analyzeLabel: (s) => `Diagnose ${s.title.toLowerCase()} performance`,
    analyzePrompt: (s) => `Diagnose performance issues. ${s.strategicIntent || s.description}. Primary KPI: ${s.kpi}. Identify underperforming areas, audience-level gaps, channel inefficiencies, and root causes.`,
    analyzeSkill: 'performance-analysis',
    inspectLabel: () => `Deep-dive into performance gaps`,
    inspectPrompt: (s) => `Deep-dive into the most significant performance gap. Analyze conversion funnel, audience targeting effectiveness, message relevance, and timing patterns. Identify root causes for ${s.kpi} underperformance.`,
    compareLabel: () => `Compare performance across segments`,
    comparePrompt: (s) => `Compare campaign performance across audience segments. Rank by ${s.kpi}, cost efficiency, engagement quality, and optimization potential. Identify the biggest reallocation opportunities.`,
    createLabel: (s) => `Create optimized ${s.title.toLowerCase().includes('journey') ? 'journey' : 'campaign plan'}`,
    createPrompt: (s) => `Create an optimized plan addressing the performance gaps identified. ${s.strategicIntent || s.description}. Include specific changes, channel adjustments, and projected ${s.kpi} improvement.`,
    enhanceLabel: (s) => `Design testing strategy for ${s.kpi}`,
    enhancePrompt: (s) => `Design an A/B test plan to validate the proposed optimizations. Define test groups, success metrics, duration, and rollback criteria. Target ${s.kpi} improvement.`,
    enhanceType: 'optimize',
    enhanceSkill: 'performance-analysis',
    inspectBranch: () => `Inspect the underperforming area`,
    inspectBranchDesc: () => `Deep-dive into the biggest performance gap to understand root causes`,
    compareBranch: () => `Compare performance across segments`,
    compareBranchDesc: () => `See how different segments perform and where to reallocate`,
    createBranch: () => `Create optimized plan immediately`,
    createBranchDesc: () => `Skip deeper analysis and build the optimization plan directly`,
    enhanceBranch: () => `Build A/B test plan`,
    enhanceBranchDesc: () => `Design a controlled test to validate changes before full rollout`,
  },

  retention: {
    analyzeLabel: (s) => `Analyze ${audience(s)} retention patterns`,
    analyzePrompt: (s) => `Analyze retention patterns for ${audience(s)}. ${s.strategicIntent || s.description}. Primary KPI: ${s.kpi}. Evaluate churn risk, engagement decline signals, and loyalty tier health.`,
    analyzeSkill: 'segment-opportunity',
    inspectLabel: (s) => `Deep-dive into ${audience(s)} behavior`,
    inspectPrompt: (s) => `Deep-dive into the at-risk segment. Analyze disengagement triggers, last-activity timing, channel drop-off, and competitive switching signals. Identify recovery levers for ${audience(s)}.`,
    compareLabel: () => `Compare retention potential across segments`,
    comparePrompt: (s) => `Compare segments by retention potential. Rank by: predicted retention probability, expected lifetime value recovery, cost-to-retain, and intervention urgency. Focus on ${s.kpi}.`,
    createLabel: (s) => `Create ${s.title.toLowerCase().includes('journey') ? s.title.toLowerCase() : 'retention strategy'}`,
    createPrompt: (s) => `Create a retention strategy for ${audience(s)}. ${s.strategicIntent || s.description}. Include re-engagement messaging, phased outreach, channel strategy, and projected ${s.kpi} improvement.`,
    enhanceLabel: () => `Design retention journey`,
    enhancePrompt: (s) => `Design a multi-stage retention journey for ${audience(s)}. Include 4-5 stages with triggers, channels, messaging, wait times, and stage goals. Optimize for gradual re-engagement.`,
    enhanceType: 'create',
    enhanceSkill: 'journey',
    inspectBranch: () => `Inspect at-risk profiles`,
    inspectBranchDesc: (s) => `Deep-dive into the at-risk segment to understand disengagement drivers for ${audience(s)}`,
    compareBranch: () => `Compare retention segments`,
    compareBranchDesc: () => `See which segments have the best retention potential and intervention ROI`,
    createBranch: () => `Create retention plan immediately`,
    createBranchDesc: () => `Skip deeper analysis and build the retention strategy directly`,
    enhanceBranch: () => `Build retention journey`,
    enhanceBranchDesc: () => `Design a multi-stage journey to bring the retention strategy to life`,
  },

  insights: {
    analyzeLabel: (s) => `Discover ${s.title.toLowerCase()}`,
    analyzePrompt: (s) => `Discover patterns and insights. ${s.strategicIntent || s.description}. Primary KPI: ${s.kpi}. Surface the most actionable patterns from the data.`,
    analyzeSkill: 'insight-summary',
    inspectLabel: () => `Deep-dive into the top pattern`,
    inspectPrompt: (s) => `Deep-dive into the most significant insight pattern. Analyze underlying drivers, segment-level breakdowns, temporal trends, and actionability. Identify specific activation opportunities for ${s.kpi}.`,
    compareLabel: () => `Compare across segments`,
    comparePrompt: (s) => `Compare patterns across audience segments. Rank by: insight significance, activation readiness, projected impact on ${s.kpi}, and confidence level.`,
    createLabel: () => `Create action plan`,
    createPrompt: (s) => `Create an action plan based on the insights discovered. ${s.strategicIntent || s.description}. Include targeting recommendations, channel strategy, and projected ${s.kpi} improvement.`,
    enhanceLabel: (s) => `Optimize ${s.kpi} targeting`,
    enhancePrompt: (s) => `Optimize the targeting strategy based on the insights. Recommend audience prioritization, channel allocation, and measurement framework for ${s.kpi}.`,
    enhanceType: 'optimize',
    enhanceSkill: 'performance-analysis',
    inspectBranch: () => `Inspect the top pattern`,
    inspectBranchDesc: () => `Deep-dive into the most significant finding to understand what drives it`,
    compareBranch: () => `Compare across segments`,
    compareBranchDesc: () => `See how the pattern varies across different audience segments`,
    createBranch: () => `Create action plan immediately`,
    createBranchDesc: () => `Skip deeper analysis and build the activation plan directly`,
    enhanceBranch: (s) => `Optimize ${s.kpi} targeting`,
    enhanceBranchDesc: () => `Fine-tune targeting and measurement strategy for maximum impact`,
  },
};

function getOutcomeKey(outcome: string): OutcomeKey {
  if (outcome === 'revenue') return 'revenue';
  if (outcome === 'campaign-performance') return 'campaign-performance';
  if (outcome === 'retention') return 'retention';
  return 'insights';
}

/**
 * Generate a WorkflowDef from a ScenarioConfig using outcome-based templates.
 */
export function createWorkflowFromScenario(scenario: ScenarioConfig): WorkflowDef {
  const outcomeKey = getOutcomeKey(scenario.outcome);
  const t = templates[outcomeKey];

  const steps: Record<string, WorkflowStepDef> = {
    'step-analyze': {
      stepId: 'step-analyze',
      label: t.analyzeLabel(scenario),
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: t.analyzeSkill,
      outputModules: ['segment_cards', 'kpi_framework'],
      promptOverlay: t.analyzePrompt(scenario),
      branches: [
        {
          branchId: 'to-inspect',
          label: t.inspectBranch(scenario),
          description: t.inspectBranchDesc(scenario),
          icon: 'Search',
          nextStepId: 'step-inspect',
          recommendation: true,
          contextUpdate: { action: 'inspect' },
        },
        {
          branchId: 'to-compare',
          label: t.compareBranch(scenario),
          description: t.compareBranchDesc(scenario),
          icon: 'BarChart3',
          nextStepId: 'step-compare',
          contextUpdate: { action: 'compare' },
        },
        {
          branchId: 'to-create-direct',
          label: t.createBranch(scenario),
          description: t.createBranchDesc(scenario),
          icon: 'Zap',
          nextStepId: 'step-create',
          contextUpdate: { action: 'create' },
        },
      ],
      summaryTemplate: `I analyzed the data and identified key patterns and opportunities related to ${scenario.title.toLowerCase()}.`,
    },

    'step-inspect': {
      stepId: 'step-inspect',
      label: t.inspectLabel(scenario),
      stepType: 'inspect',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'segment_cards'],
      promptOverlay: t.inspectPrompt(scenario),
      branches: [
        {
          branchId: 'inspect-to-create',
          label: t.createLabel(scenario).replace(/^Create /, 'Create '),
          description: `Build the plan based on the deep-dive findings`,
          icon: 'FileText',
          nextStepId: 'step-create',
          recommendation: true,
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'create' },
        },
        {
          branchId: 'inspect-to-compare',
          label: 'Compare with other segments',
          description: 'See how this compares to alternatives before committing',
          icon: 'BarChart3',
          nextStepId: 'step-compare',
          contextUpdate: { analysisDepth: 'deep-inspect', action: 'compare' },
        },
      ],
      summaryTemplate: `I completed a deep-dive and identified the key drivers and opportunity levers.`,
    },

    'step-compare': {
      stepId: 'step-compare',
      label: t.compareLabel(scenario),
      stepType: 'compare',
      executionMode: 'llm',
      skillFamily: 'performance-analysis',
      outputModules: ['performance_diagnosis', 'kpi_framework'],
      promptOverlay: t.comparePrompt(scenario),
      branches: [
        {
          branchId: 'compare-to-create',
          label: `Create plan for the top segment`,
          description: `Build the plan for the highest-potential option`,
          icon: 'FileText',
          nextStepId: 'step-create',
          recommendation: true,
          contextUpdate: { analysisDepth: 'comparison', action: 'create' },
        },
        {
          branchId: 'compare-to-inspect',
          label: 'Inspect the top segment deeper',
          description: 'Dive deeper into the winning option before building the plan',
          icon: 'Search',
          nextStepId: 'step-inspect',
          contextUpdate: { analysisDepth: 'comparison', action: 'inspect' },
        },
      ],
      summaryTemplate: `I compared the options and ranked them by expected impact and ROI.`,
    },

    'step-create': {
      stepId: 'step-create',
      label: t.createLabel(scenario),
      stepType: 'create',
      executionMode: 'llm',
      skillFamily: scenario.skillFamily,
      outputModules: ['campaign_brief', 'channel_strategy', 'next_actions'],
      promptOverlay: t.createPrompt(scenario),
      branches: [
        {
          branchId: 'create-to-enhance',
          label: t.enhanceBranch(scenario),
          description: t.enhanceBranchDesc(scenario),
          icon: 'Target',
          nextStepId: 'step-enhance',
          recommendation: true,
          contextUpdate: { hasPlan: 'true', action: 'enhance' },
        },
        {
          branchId: 'create-to-summary',
          label: 'View workflow summary',
          description: 'See everything we built in this session',
          icon: 'CheckCircle',
          nextStepId: 'step-summary',
          contextUpdate: { hasPlan: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: `I created a plan addressing ${scenario.title.toLowerCase()}.`,
    },

    'step-enhance': {
      stepId: 'step-enhance',
      label: t.enhanceLabel(scenario),
      stepType: t.enhanceType,
      executionMode: 'llm',
      skillFamily: t.enhanceSkill,
      outputModules: t.enhanceType === 'optimize'
        ? ['performance_diagnosis', 'kpi_framework', 'next_actions']
        : ['journey_map', 'channel_strategy', 'kpi_framework'],
      promptOverlay: t.enhancePrompt(scenario),
      branches: [
        {
          branchId: 'enhance-to-summary',
          label: 'View workflow summary',
          description: 'See the complete analysis, plan, and strategy',
          icon: 'CheckCircle',
          nextStepId: 'step-summary',
          recommendation: true,
          contextUpdate: { hasEnhancement: 'true', action: 'summary' },
        },
      ],
      summaryTemplate: `I refined the strategy for maximum ${scenario.kpi} impact.`,
    },

    'step-summary': {
      stepId: 'step-summary',
      label: 'Workflow complete',
      stepType: 'analyze',
      executionMode: 'llm',
      skillFamily: 'insight-summary',
      outputModules: ['insight_summary', 'kpi_framework', 'next_actions'],
      promptOverlay: `Summarize the entire workflow session. Recap what was analyzed, what was created, and the expected impact on ${scenario.kpi}. Provide clear next steps for implementation in Treasure Data.`,
      branches: [],
      summaryTemplate: 'Here is everything we built in this session.',
    },
  };

  return {
    workflowId: `wf-${scenario.scenarioId}`,
    scenarioId: scenario.scenarioId,
    title: scenario.title,
    entryStepId: 'step-analyze',
    steps,
  };
}
