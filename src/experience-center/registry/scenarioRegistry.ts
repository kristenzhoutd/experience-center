/**
 * Scenario Registry — source of truth for all Experience Center scenarios.
 *
 * Each entry maps a scenarioId to its full configuration including
 * skill family, output format, KPI, and prompt overlay.
 *
 * To add a new scenario:
 * 1. Add the entry here with the correct outcome + industry + skillFamily
 * 2. Add the scenario card to scenarioMatrix in experienceLabConfig.ts
 * 3. The orchestration layer auto-resolves everything else
 */

import type { ScenarioConfig } from './types';

export const scenarioRegistry: Record<string, ScenarioConfig> = {
  // ════════════════════════════════════════════════════════════
  // INCREASE REVENUE
  // ════════════════════════════════════════════════════════════

  // Revenue → Retail
  'rev-retail-1': {
    scenarioId: 'rev-retail-1', outcome: 'revenue', industry: 'retail',
    title: 'Re-engage lapsed high-value shoppers',
    description: 'Create a targeted growth strategy for valuable shoppers who have stopped purchasing recently.',
    kpi: 'Repeat purchase rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Lapsed high-value customers',
    strategicIntent: 'Win back valuable customers through personalized re-engagement',
  },
  'rev-retail-2': {
    scenarioId: 'rev-retail-2', outcome: 'revenue', industry: 'retail',
    title: 'Identify high-intent browsers',
    description: 'Find the customer segments most likely to convert and prioritize them for activation.',
    kpi: 'Conversion rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-intent browsing segments',
    strategicIntent: 'Surface high-conversion-propensity audiences for prioritized activation',
  },
  'rev-retail-3': {
    scenarioId: 'rev-retail-3', outcome: 'revenue', industry: 'retail',
    title: 'Build a post-purchase journey',
    description: 'Design a follow-up journey that encourages first-time buyers to make a second purchase.',
    kpi: 'Time to second purchase',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'First-time buyers',
    strategicIntent: 'Accelerate first-to-second purchase conversion through lifecycle orchestration',
  },

  // Revenue → CPG
  'rev-cpg-1': {
    scenarioId: 'rev-cpg-1', outcome: 'revenue', industry: 'cpg',
    title: 'Build a replenishment campaign',
    description: 'Create a campaign to reach buyers when they are most likely ready to purchase again.',
    kpi: 'Repeat purchase rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Repeat buyers approaching replenishment window',
    strategicIntent: 'Drive replenishment purchases through predictive timing and personalized outreach',
  },
  'rev-cpg-2': {
    scenarioId: 'rev-cpg-2', outcome: 'revenue', industry: 'cpg',
    title: 'Identify households with cross-category potential',
    description: 'Find buyer groups most likely to expand into adjacent product categories.',
    kpi: 'Basket size',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Cross-category expansion households',
    strategicIntent: 'Identify households with highest potential for category expansion',
  },
  'rev-cpg-3': {
    scenarioId: 'rev-cpg-3', outcome: 'revenue', industry: 'cpg',
    title: 'Create a premium upsell brief',
    description: 'Develop a strategy to increase household value through premium product adoption.',
    kpi: 'Revenue per household',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Premium-ready households',
    strategicIntent: 'Drive premiumization and increase household revenue',
  },

  // Revenue → Travel
  'rev-travel-1': {
    scenarioId: 'rev-travel-1', outcome: 'revenue', industry: 'travel',
    title: 'Re-engage inactive loyalty members',
    description: 'Create a growth strategy to bring valuable loyalty members back into active booking behavior.',
    kpi: 'Rebooking rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Inactive loyalty program members',
    strategicIntent: 'Reactivate dormant loyalty members through targeted engagement',
  },
  'rev-travel-2': {
    scenarioId: 'rev-travel-2', outcome: 'revenue', industry: 'travel',
    title: 'Identify premium guests',
    description: 'Find the guests most likely to respond to upgrades and premium offers.',
    kpi: 'Upgrade conversion rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Premium-propensity guest segments',
    strategicIntent: 'Surface guests with highest upgrade and premium offer responsiveness',
  },
  'rev-travel-3': {
    scenarioId: 'rev-travel-3', outcome: 'revenue', industry: 'travel',
    title: 'Create a targeted offer strategy for seasonal travelers',
    description: 'Build a campaign strategy for travelers whose demand is driven by seasonality and timing.',
    kpi: 'Booking rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Seasonal and timing-driven travelers',
    strategicIntent: 'Maximize seasonal booking revenue through targeted offer strategies',
  },

  // ════════════════════════════════════════════════════════════
  // IMPROVE CAMPAIGN PERFORMANCE
  // ════════════════════════════════════════════════════════════

  // Performance → Retail
  'perf-retail-1': {
    scenarioId: 'perf-retail-1', outcome: 'campaign-performance', industry: 'retail',
    title: 'Diagnose underperforming promotions',
    description: 'Analyze why recent promotions are underperforming and identify the biggest optimization opportunities.',
    kpi: 'ROAS',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Diagnose and fix underperforming retail promotions',
  },
  'perf-retail-2': {
    scenarioId: 'perf-retail-2', outcome: 'campaign-performance', industry: 'retail',
    title: 'Refine audience targeting for seasonal campaigns',
    description: 'Improve who gets targeted in key seasonal campaigns to increase downstream performance.',
    kpi: 'Conversion rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Seasonal campaign audiences',
    strategicIntent: 'Refine audience targeting to improve seasonal campaign performance',
  },
  'perf-retail-3': {
    scenarioId: 'perf-retail-3', outcome: 'campaign-performance', industry: 'retail',
    title: 'Optimize campaign timing for engaged shoppers',
    description: 'Find the best timing windows to improve progression from engagement to purchase.',
    kpi: 'Click-to-purchase rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Optimize send timing to increase engagement-to-purchase progression',
  },

  // Performance → CPG
  'perf-cpg-1': {
    scenarioId: 'perf-cpg-1', outcome: 'campaign-performance', industry: 'cpg',
    title: 'Build a segment-based activation plan',
    description: 'Create a campaign plan that prioritizes the highest-opportunity buyer segments.',
    kpi: 'Conversion rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'segment_cards', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Build a segment-prioritized activation campaign',
  },
  'perf-cpg-2': {
    scenarioId: 'perf-cpg-2', outcome: 'campaign-performance', industry: 'cpg',
    title: 'Identify the best channel mix for replenishment campaigns',
    description: 'Determine which channels are best suited to drive repeat purchase efficiently.',
    kpi: 'ROAS',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Optimize channel mix for replenishment campaign efficiency',
  },
  'perf-cpg-3': {
    scenarioId: 'perf-cpg-3', outcome: 'campaign-performance', industry: 'cpg',
    title: 'Diagnose performance drop by audience group',
    description: 'Analyze which audience groups are driving weaker campaign results and why.',
    kpi: 'Response rate',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Identify root causes of audience-level performance degradation',
  },

  // Performance → Travel
  'perf-travel-1': {
    scenarioId: 'perf-travel-1', outcome: 'campaign-performance', industry: 'travel',
    title: 'Optimize channel mix by traveler type',
    description: 'Match traveler segments to the channels most likely to drive efficient bookings and engagement.',
    kpi: 'ROAS',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'channel_strategy', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Optimize channel allocation by traveler segment',
  },
  'perf-travel-2': {
    scenarioId: 'perf-travel-2', outcome: 'campaign-performance', industry: 'travel',
    title: 'Personalize post-booking communications',
    description: 'Improve post-booking communications to drive stronger upsell and add-on conversion.',
    kpi: 'Upsell rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Optimize post-booking journey for upsell conversion',
  },
  'perf-travel-3': {
    scenarioId: 'perf-travel-3', outcome: 'campaign-performance', industry: 'travel',
    title: 'Create a destination-based content strategy',
    description: 'Develop a campaign strategy aligned to traveler interests and destination relevance.',
    kpi: 'Click-through rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Create destination-personalized content strategy',
  },

  // ════════════════════════════════════════════════════════════
  // IMPROVE CUSTOMER RETENTION
  // ════════════════════════════════════════════════════════════

  // Retention → Retail
  'ret-retail-1': {
    scenarioId: 'ret-retail-1', outcome: 'retention', industry: 'retail',
    title: 'Build a loyalty journey for repeat buyers',
    description: 'Create a retention journey for customers showing strong repeat behavior but emerging drop-off risk.',
    kpi: 'Retention rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Repeat buyers with emerging drop-off risk',
    strategicIntent: 'Build loyalty journey to prevent high-value customer churn',
  },
  'ret-retail-2': {
    scenarioId: 'ret-retail-2', outcome: 'retention', industry: 'retail',
    title: 'Find at-risk customers after their second purchase',
    description: 'Identify the customers most likely to disengage early in their lifecycle.',
    kpi: 'Retention rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Early-lifecycle at-risk customers',
    strategicIntent: 'Identify and intervene with customers showing early disengagement signals',
  },
  'ret-retail-3': {
    scenarioId: 'ret-retail-3', outcome: 'retention', industry: 'retail',
    title: 'Create a win-back campaign for inactive members',
    description: 'Develop a reactivation strategy for members who have stopped engaging or purchasing.',
    kpi: 'Reactivation rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Inactive loyalty members',
    strategicIntent: 'Reactivate dormant members through targeted win-back campaign',
  },

  // Retention → Travel
  'ret-travel-1': {
    scenarioId: 'ret-travel-1', outcome: 'retention', industry: 'travel',
    title: 'Build a loyalty journey for high-value guests',
    description: 'Create a retention journey for guests with strong value but signs of declining engagement.',
    kpi: 'Retention rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-value guests with declining engagement',
    strategicIntent: 'Retain high-value guests through personalized loyalty journey',
  },
  'ret-travel-2': {
    scenarioId: 'ret-travel-2', outcome: 'retention', industry: 'travel',
    title: 'Identify travelers at risk of disengagement',
    description: 'Find travelers most likely to churn and prioritize them for intervention.',
    kpi: 'Churn rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Churn-risk traveler segments',
    strategicIntent: 'Surface travelers at highest churn risk for proactive intervention',
  },
  'ret-travel-3': {
    scenarioId: 'ret-travel-3', outcome: 'retention', industry: 'travel',
    title: 'Tailor follow-up messaging by trip history',
    description: 'Personalize retention messaging based on prior trip behavior and engagement signals.',
    kpi: 'Engagement rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Personalize retention messaging using trip-history signals',
  },

  // Retention → CPG
  'ret-cpg-1': {
    scenarioId: 'ret-cpg-1', outcome: 'retention', industry: 'cpg',
    title: 'Identify high-frequency buyers at risk of slowing down',
    description: 'Find valuable buyers whose purchase behavior suggests early retention risk.',
    kpi: 'Retention rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-frequency buyers with deceleration signals',
    strategicIntent: 'Identify frequency deceleration before churn materializes',
  },
  'ret-cpg-2': {
    scenarioId: 'ret-cpg-2', outcome: 'retention', industry: 'cpg',
    title: 'Build a loyalty journey for valuable households',
    description: 'Design a retention journey to deepen loyalty among high-value household segments.',
    kpi: 'Retention rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-value household segments',
    strategicIntent: 'Deepen loyalty among most valuable CPG households',
  },
  'ret-cpg-3': {
    scenarioId: 'ret-cpg-3', outcome: 'retention', industry: 'cpg',
    title: 'Create a reactivation campaign for promo-driven buyers',
    description: 'Develop a campaign to bring back buyers who primarily engage through offers and discounts.',
    kpi: 'Repeat purchase rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Promotion-dependent buyers',
    strategicIntent: 'Reactivate promo-driven buyers with balanced value messaging',
  },

  // ════════════════════════════════════════════════════════════
  // GENERATE FASTER BUSINESS INSIGHTS
  // ════════════════════════════════════════════════════════════

  // Insights → CPG
  'ins-cpg-1': {
    scenarioId: 'ins-cpg-1', outcome: 'insights', industry: 'cpg',
    title: 'Surface segments driving the highest repeat purchase rate',
    description: 'Identify the buyer groups most responsible for repeat purchase performance.',
    kpi: 'Repeat purchase rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Surface the audience segments most responsible for repeat purchase performance',
  },
  'ins-cpg-2': {
    scenarioId: 'ins-cpg-2', outcome: 'insights', industry: 'cpg',
    title: 'Analyze promotion sensitivity by segment',
    description: 'Understand which customer groups respond best to promotions and where to optimize spend.',
    kpi: 'ROAS',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Analyze promotion elasticity across customer segments',
  },
  'ins-cpg-3': {
    scenarioId: 'ins-cpg-3', outcome: 'insights', industry: 'cpg',
    title: 'Find households with highest growth potential',
    description: 'Identify the audience groups with the greatest upside for future targeting and investment.',
    kpi: 'Targeting efficiency',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-growth-potential households',
    strategicIntent: 'Identify highest-upside audience groups for investment prioritization',
  },

  // Insights → Retail
  'ins-retail-1': {
    scenarioId: 'ins-retail-1', outcome: 'insights', industry: 'retail',
    title: 'Identify product affinity segments',
    description: 'Find customer groups with strong product relationships that can unlock cross-sell opportunities.',
    kpi: 'Cross-sell rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Surface product affinity patterns for cross-sell activation',
  },
  'ins-retail-2': {
    scenarioId: 'ins-retail-2', outcome: 'insights', industry: 'retail',
    title: 'Surface the customer groups driving the highest revenue per campaign',
    description: 'Identify which audiences are contributing the most value across campaign activity.',
    kpi: 'Revenue per campaign',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Identify highest-value audience segments across campaign activity',
  },
  'ins-retail-3': {
    scenarioId: 'ins-retail-3', outcome: 'insights', industry: 'retail',
    title: 'Analyze engagement timing patterns',
    description: 'Understand when customers are most responsive so campaigns can be timed more effectively.',
    kpi: 'Click-to-purchase rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Map engagement timing patterns for campaign optimization',
  },

  // Insights → Travel
  'ins-travel-1': {
    scenarioId: 'ins-travel-1', outcome: 'insights', industry: 'travel',
    title: 'Identify premium guest segments with highest upgrade potential',
    description: 'Find the guest groups most likely to respond to premium offers and upgrades.',
    kpi: 'Upgrade conversion rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Premium upgrade-propensity guest segments',
    strategicIntent: 'Surface guest segments with highest upgrade responsiveness',
  },
  'ins-travel-2': {
    scenarioId: 'ins-travel-2', outcome: 'insights', industry: 'travel',
    title: 'Surface booking patterns by traveler type',
    description: 'Analyze how different traveler groups behave to improve strategic planning and targeting.',
    kpi: 'Marketing efficiency',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Map booking behavior patterns across traveler segments',
  },
  'ins-travel-3': {
    scenarioId: 'ins-travel-3', outcome: 'insights', industry: 'travel',
    title: 'Analyze loyalty engagement patterns',
    description: 'Understand which loyalty engagement signals are most associated with long-term retention.',
    kpi: 'Retention rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'kpi_framework', 'next_actions', 'insight_panel'],
    strategicIntent: 'Identify loyalty engagement signals that predict long-term retention',
  },
};

/** Look up a scenario config by ID */
export function getScenarioConfig(scenarioId: string): ScenarioConfig | undefined {
  return scenarioRegistry[scenarioId];
}
