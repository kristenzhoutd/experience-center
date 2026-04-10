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

  // ════════════════════════════════════════════════════════════
  // AUTOMOTIVE
  // ════════════════════════════════════════════════════════════

  // Revenue → Automotive
  'rev-automotive-1': {
    scenarioId: 'rev-automotive-1', outcome: 'revenue', industry: 'automotive',
    title: 'Re-engage owners nearing service lapse',
    description: 'Build a campaign to proactively reach vehicle owners approaching overdue service intervals before they defect to independent shops.',
    kpi: 'Service retention rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Owners approaching service interval lapse',
    strategicIntent: 'Retain service revenue by intervening before owners lapse from the dealer network',
  },
  'rev-automotive-2': {
    scenarioId: 'rev-automotive-2', outcome: 'revenue', industry: 'automotive',
    title: 'Increase upsell of service plans and warranties',
    description: 'Develop a targeted upsell strategy for owners who currently lack extended service plans or warranty coverage.',
    kpi: 'Service plan attach rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Current owners without extended coverage',
    strategicIntent: 'Grow aftermarket revenue by increasing service plan and warranty adoption',
  },

  // Performance → Automotive
  'perf-automotive-1': {
    scenarioId: 'perf-automotive-1', outcome: 'campaign-performance', industry: 'automotive',
    title: 'Improve dealer campaign efficiency',
    description: 'Diagnose regional dealer campaign performance to reduce cost per lead and improve conversion across markets.',
    kpi: 'Cost per lead',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Regional dealer campaign audiences',
    strategicIntent: 'Reduce acquisition costs by diagnosing and fixing dealer campaign inefficiencies',
  },
  'perf-automotive-2': {
    scenarioId: 'perf-automotive-2', outcome: 'campaign-performance', industry: 'automotive',
    title: 'Optimize model-specific acquisition campaigns',
    description: 'Identify the highest-converting in-market shopper segments by model to improve test drive and purchase conversion.',
    kpi: 'Test drive conversion rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'In-market vehicle shoppers by model',
    strategicIntent: 'Improve acquisition efficiency by targeting highest-converting shopper segments per model',
  },

  // Retention → Automotive
  'ret-automotive-1': {
    scenarioId: 'ret-automotive-1', outcome: 'retention', industry: 'automotive',
    title: 'Win back lease customers approaching renewal',
    description: 'Design a journey to retain lease customers nearing end of term through timely renewal and upgrade offers.',
    kpi: 'Lease renewal rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Lease customers nearing end of term',
    strategicIntent: 'Maximize lease renewal through proactive end-of-term engagement',
  },
  'ret-automotive-2': {
    scenarioId: 'ret-automotive-2', outcome: 'retention', industry: 'automotive',
    title: 'Re-engage lapsed service customers',
    description: 'Create a win-back campaign for vehicle owners who have not visited for service in over 12 months.',
    kpi: 'Service visit rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Owners with no service visit in 12+ months',
    strategicIntent: 'Recover lapsed service relationships through targeted re-engagement',
  },

  // Insights → Automotive
  'ins-automotive-1': {
    scenarioId: 'ins-automotive-1', outcome: 'insights', industry: 'automotive',
    title: 'Identify high-intent in-market vehicle shoppers',
    description: 'Surface the shopper segments showing the strongest purchase intent signals for prioritized outreach.',
    kpi: 'Purchase intent score',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Behavioral in-market signals',
    strategicIntent: 'Surface high-intent shoppers for prioritized sales and marketing activation',
  },
  'ins-automotive-2': {
    scenarioId: 'ins-automotive-2', outcome: 'insights', industry: 'automotive',
    title: 'Find likely EV buyers from behavior signals',
    description: 'Analyze behavioral data to identify audiences most likely to consider an electric vehicle purchase.',
    kpi: 'EV consideration rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'EV-interest behavioral profiles',
    strategicIntent: 'Identify EV-ready audiences from behavioral signals for targeted activation',
  },

  // ════════════════════════════════════════════════════════════
  // MEDIA
  // ════════════════════════════════════════════════════════════

  // Revenue → Media
  'rev-media-1': {
    scenarioId: 'rev-media-1', outcome: 'revenue', industry: 'media',
    title: 'Increase subscription upgrades to premium tiers',
    description: 'Create a campaign strategy to convert engaged standard-tier subscribers into premium-tier members.',
    kpi: 'Premium upgrade rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Engaged standard-tier subscribers',
    strategicIntent: 'Drive premium tier upgrades among highly engaged subscribers',
  },
  'rev-media-2': {
    scenarioId: 'rev-media-2', outcome: 'revenue', industry: 'media',
    title: 'Drive add-on revenue through bundle offers',
    description: 'Develop a bundling strategy to increase revenue from single-product subscribers through complementary add-ons.',
    kpi: 'Bundle attach rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Single-product subscribers',
    strategicIntent: 'Increase ARPU through targeted bundle and add-on offers',
  },

  // Performance → Media
  'perf-media-1': {
    scenarioId: 'perf-media-1', outcome: 'campaign-performance', industry: 'media',
    title: 'Improve subscriber acquisition campaign efficiency',
    description: 'Analyze acquisition campaign performance to reduce cost per subscriber and improve targeting efficiency.',
    kpi: 'Cost per acquisition',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Acquisition campaign audiences',
    strategicIntent: 'Reduce subscriber acquisition costs through campaign performance optimization',
  },
  'perf-media-2': {
    scenarioId: 'perf-media-2', outcome: 'campaign-performance', industry: 'media',
    title: 'Optimize content promotion by audience segment',
    description: 'Understand which audience segments engage most with different content types to improve promotion targeting.',
    kpi: 'Content engagement rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Segment-level content consumers',
    strategicIntent: 'Align content promotion with segment-level engagement patterns',
  },

  // Retention → Media
  'ret-media-1': {
    scenarioId: 'ret-media-1', outcome: 'retention', industry: 'media',
    title: 'Reduce churn among engaged-but-at-risk subscribers',
    description: 'Design a retention journey for subscribers whose engagement is declining despite prior activity.',
    kpi: 'Churn rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Subscribers with declining engagement',
    strategicIntent: 'Prevent churn by intervening with at-risk subscribers before cancellation',
  },
  'ret-media-2': {
    scenarioId: 'ret-media-2', outcome: 'retention', industry: 'media',
    title: 'Win back recently lapsed subscribers',
    description: 'Create a reactivation campaign targeting recently cancelled subscribers with personalized win-back offers.',
    kpi: 'Reactivation rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Recently cancelled subscribers',
    strategicIntent: 'Reactivate recently lapsed subscribers through targeted win-back messaging',
  },

  // Insights → Media
  'ins-media-1': {
    scenarioId: 'ins-media-1', outcome: 'insights', industry: 'media',
    title: 'Convert high-propensity anonymous visitors',
    description: 'Identify anonymous visitor segments with the highest likelihood of converting to paid subscribers.',
    kpi: 'Visitor-to-subscriber rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-engagement anonymous users',
    strategicIntent: 'Surface high-propensity anonymous visitors for subscriber conversion',
  },
  'ins-media-2': {
    scenarioId: 'ins-media-2', outcome: 'insights', industry: 'media',
    title: 'Acquire subscribers for premium content bundles',
    description: 'Analyze free-tier user behavior to identify the best audiences for premium content bundle offers.',
    kpi: 'Bundle conversion rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Content-engaged free-tier users',
    strategicIntent: 'Identify free-tier users most likely to convert on premium content bundles',
  },

  // ════════════════════════════════════════════════════════════
  // D2C
  // ════════════════════════════════════════════════════════════

  // Revenue → D2C
  'rev-d2c-1': {
    scenarioId: 'rev-d2c-1', outcome: 'revenue', industry: 'd2c',
    title: 'Increase repeat purchase from existing customers',
    description: 'Create a campaign to drive second and third purchases from customers who have only bought once or twice.',
    kpi: 'Repeat purchase rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'One-to-two-time buyers',
    strategicIntent: 'Accelerate repeat purchase behavior among early-lifecycle customers',
  },
  'rev-d2c-2': {
    scenarioId: 'rev-d2c-2', outcome: 'revenue', industry: 'd2c',
    title: 'Drive basket expansion through cross-sell',
    description: 'Identify customer segments with the highest cross-sell potential to increase average order value.',
    kpi: 'Average order value',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Cross-sell opportunity segments',
    strategicIntent: 'Increase AOV by surfacing highest-potential cross-sell audiences',
  },

  // Performance → D2C
  'perf-d2c-1': {
    scenarioId: 'perf-d2c-1', outcome: 'campaign-performance', industry: 'd2c',
    title: 'Improve paid social campaign ROAS',
    description: 'Diagnose paid social campaign performance to identify targeting and creative optimization opportunities.',
    kpi: 'ROAS',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Paid social campaign audiences',
    strategicIntent: 'Improve paid social ROAS through audience and creative optimization',
  },
  'perf-d2c-2': {
    scenarioId: 'perf-d2c-2', outcome: 'campaign-performance', industry: 'd2c',
    title: 'Optimize lifecycle marketing across email and SMS',
    description: 'Analyze email and SMS lifecycle campaign performance to maximize revenue per message sent.',
    kpi: 'Revenue per message',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Lifecycle campaign recipients',
    strategicIntent: 'Maximize lifecycle marketing efficiency across owned channels',
  },

  // Retention → D2C
  'ret-d2c-1': {
    scenarioId: 'ret-d2c-1', outcome: 'retention', industry: 'd2c',
    title: 'Re-activate high-value customers with declining frequency',
    description: 'Design a retention journey for high-value customers whose purchase frequency is declining.',
    kpi: 'Purchase frequency',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-value customers with declining activity',
    strategicIntent: 'Reverse frequency decline among high-value customers through lifecycle intervention',
  },
  'ret-d2c-2': {
    scenarioId: 'ret-d2c-2', outcome: 'retention', industry: 'd2c',
    title: 'Win back first-time buyers who never returned',
    description: 'Create a win-back campaign for one-time purchasers who have not returned after 60 days.',
    kpi: 'Second purchase rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'One-time purchasers past 60 days',
    strategicIntent: 'Convert one-time buyers into repeat customers through targeted win-back',
  },

  // Insights → D2C
  'ins-d2c-1': {
    scenarioId: 'ins-d2c-1', outcome: 'insights', industry: 'd2c',
    title: 'Find lookalike audiences for top-performing cohorts',
    description: 'Identify lookalike audience profiles based on the behavioral traits of top-performing customer cohorts.',
    kpi: 'Lookalike match rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Top-performing customer cohorts',
    strategicIntent: 'Scale acquisition by building lookalike audiences from best-performing cohorts',
  },
  'ins-d2c-2': {
    scenarioId: 'ins-d2c-2', outcome: 'insights', industry: 'd2c',
    title: 'Identify likely buyers for new product launch',
    description: 'Analyze existing customer behavior to find the audiences most likely to convert on a new product launch.',
    kpi: 'Launch conversion rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Category-adjacent buyer profiles',
    strategicIntent: 'Identify high-propensity audiences for new product launch activation',
  },

  // ════════════════════════════════════════════════════════════
  // B2B TECH
  // ════════════════════════════════════════════════════════════

  // Revenue → B2B Tech
  'rev-b2btech-1': {
    scenarioId: 'rev-b2btech-1', outcome: 'revenue', industry: 'b2btech',
    title: 'Drive expansion within existing accounts',
    description: 'Create a campaign strategy to grow revenue within existing accounts showing expansion readiness signals.',
    kpi: 'Net revenue retention',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Accounts with expansion signals',
    strategicIntent: 'Accelerate account expansion by targeting accounts with strongest growth signals',
  },
  'rev-b2btech-2': {
    scenarioId: 'rev-b2btech-2', outcome: 'revenue', industry: 'b2btech',
    title: 'Increase cross-sell of adjacent products',
    description: 'Identify single-product accounts with the highest propensity to adopt adjacent solutions.',
    kpi: 'Cross-sell adoption rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Single-product accounts',
    strategicIntent: 'Grow multi-product adoption by surfacing highest-propensity cross-sell accounts',
  },

  // Performance → B2B Tech
  'perf-b2btech-1': {
    scenarioId: 'perf-b2btech-1', outcome: 'campaign-performance', industry: 'b2btech',
    title: 'Improve pipeline-driving campaign efficiency',
    description: 'Analyze demand generation campaign performance to improve pipeline conversion and reduce wasted spend.',
    kpi: 'Pipeline conversion rate',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Demand generation audiences',
    strategicIntent: 'Improve demand gen efficiency by diagnosing pipeline conversion bottlenecks',
  },
  'perf-b2btech-2': {
    scenarioId: 'perf-b2btech-2', outcome: 'campaign-performance', industry: 'b2btech',
    title: 'Optimize ABM audience targeting and channel mix',
    description: 'Evaluate ABM program performance to improve account engagement scores and channel allocation.',
    kpi: 'Account engagement score',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'ABM target accounts',
    strategicIntent: 'Optimize ABM targeting and channel mix for higher account engagement',
  },

  // Retention → B2B Tech
  'ret-b2btech-1': {
    scenarioId: 'ret-b2btech-1', outcome: 'retention', industry: 'b2btech',
    title: 'Reduce engagement decline in existing accounts',
    description: 'Design a journey to re-engage accounts showing declining product usage before renewal risk materializes.',
    kpi: 'Product adoption score',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Accounts with declining product usage',
    strategicIntent: 'Reverse product adoption decline to protect renewal outcomes',
  },
  'ret-b2btech-2': {
    scenarioId: 'ret-b2btech-2', outcome: 'retention', industry: 'b2btech',
    title: 'Re-engage users in at-risk expansion accounts',
    description: 'Create a campaign to re-engage key users within accounts flagged as at-risk for renewal.',
    kpi: 'Renewal rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'At-risk renewal accounts',
    strategicIntent: 'Protect renewals by re-engaging users in at-risk accounts',
  },

  // Insights → B2B Tech
  'ins-b2btech-1': {
    scenarioId: 'ins-b2btech-1', outcome: 'insights', industry: 'b2btech',
    title: 'Identify high-fit target accounts and buying groups',
    description: 'Surface prospect accounts and buying groups that best match the ideal customer profile for prioritized outreach.',
    kpi: 'Account fit score',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'ICP-matched prospect accounts',
    strategicIntent: 'Prioritize highest-fit target accounts for sales and marketing activation',
  },
  'ins-b2btech-2': {
    scenarioId: 'ins-b2btech-2', outcome: 'insights', industry: 'b2btech',
    title: 'Find pipeline-generating audiences for core solutions',
    description: 'Analyze buyer personas and engagement data to identify the audiences driving the most pipeline for core solutions.',
    kpi: 'Pipeline velocity',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Solution-aligned buyer personas',
    strategicIntent: 'Identify highest-pipeline-generating audiences for core solution marketing',
  },

  // ════════════════════════════════════════════════════════════
  // FINANCIAL
  // ════════════════════════════════════════════════════════════

  // Revenue → Financial
  'rev-financial-1': {
    scenarioId: 'rev-financial-1', outcome: 'revenue', industry: 'financial',
    title: 'Increase cross-sell to next-best financial products',
    description: 'Build a campaign to drive cross-sell among single-product clients based on next-best-product propensity.',
    kpi: 'Cross-sell rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Single-product clients',
    strategicIntent: 'Deepen client relationships through next-best-product cross-sell',
  },
  'rev-financial-2': {
    scenarioId: 'rev-financial-2', outcome: 'revenue', industry: 'financial',
    title: 'Drive activation among under-engaged product holders',
    description: 'Design a journey to activate account holders who have products but are not actively using them.',
    kpi: 'Product activation rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Under-engaged account holders',
    strategicIntent: 'Increase product utilization and revenue from dormant account holders',
  },

  // Performance → Financial
  'perf-financial-1': {
    scenarioId: 'perf-financial-1', outcome: 'campaign-performance', industry: 'financial',
    title: 'Improve conversion across financial product campaigns',
    description: 'Diagnose campaign performance across financial product lines to improve application conversion rates.',
    kpi: 'Application conversion rate',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Product campaign audiences',
    strategicIntent: 'Improve financial product campaign conversion through performance diagnosis',
  },
  'perf-financial-2': {
    scenarioId: 'perf-financial-2', outcome: 'campaign-performance', industry: 'financial',
    title: 'Optimize acquisition funnel performance',
    description: 'Analyze the acquisition funnel to identify drop-off points and improve end-to-end completion rates.',
    kpi: 'Funnel completion rate',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Acquisition funnel prospects',
    strategicIntent: 'Reduce funnel friction to improve acquisition completion rates',
  },

  // Retention → Financial
  'ret-financial-1': {
    scenarioId: 'ret-financial-1', outcome: 'retention', industry: 'financial',
    title: 'Reduce attrition among high-value disengaging clients',
    description: 'Design a retention journey for high-value clients whose activity levels are declining.',
    kpi: 'Attrition rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-value clients with declining activity',
    strategicIntent: 'Prevent high-value client attrition through proactive engagement',
  },
  'ret-financial-2': {
    scenarioId: 'ret-financial-2', outcome: 'retention', industry: 'financial',
    title: 'Re-engage dormant cardholders',
    description: 'Create a reactivation campaign for cardholders who have been inactive for 90 or more days.',
    kpi: 'Card reactivation rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Inactive cardholders 90+ days',
    strategicIntent: 'Reactivate dormant card relationships through targeted outreach',
  },

  // Insights → Financial
  'ins-financial-1': {
    scenarioId: 'ins-financial-1', outcome: 'insights', industry: 'financial',
    title: 'Identify high-propensity applicants for target products',
    description: 'Surface pre-qualified prospect profiles with the highest likelihood of applying for target financial products.',
    kpi: 'Application rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Pre-qualified prospect profiles',
    strategicIntent: 'Prioritize highest-propensity prospects for financial product acquisition',
  },
  'ins-financial-2': {
    scenarioId: 'ins-financial-2', outcome: 'insights', industry: 'financial',
    title: 'Find converters for premium banking offerings',
    description: 'Analyze client data to identify mass affluent segments most likely to upgrade to premium banking products.',
    kpi: 'Premium conversion rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Mass affluent upgrade candidates',
    strategicIntent: 'Identify best-fit audiences for premium banking product upgrades',
  },

  // ════════════════════════════════════════════════════════════
  // HEALTHCARE
  // ════════════════════════════════════════════════════════════

  // Revenue → Healthcare
  'rev-healthcare-1': {
    scenarioId: 'rev-healthcare-1', outcome: 'revenue', industry: 'healthcare',
    title: 'Increase utilization of additional service lines',
    description: 'Build a campaign to drive awareness and utilization of additional service lines among single-service-line patients.',
    kpi: 'Service line utilization rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Single-service-line patients',
    strategicIntent: 'Grow service line utilization by activating patients across additional care areas',
  },
  'rev-healthcare-2': {
    scenarioId: 'rev-healthcare-2', outcome: 'revenue', industry: 'healthcare',
    title: 'Drive repeat visit and follow-up care conversion',
    description: 'Design a journey to ensure patients with pending follow-ups complete their recommended care visits.',
    kpi: 'Follow-up completion rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Patients with pending follow-ups',
    strategicIntent: 'Improve follow-up care completion through proactive patient engagement',
  },

  // Performance → Healthcare
  'perf-healthcare-1': {
    scenarioId: 'perf-healthcare-1', outcome: 'campaign-performance', industry: 'healthcare',
    title: 'Improve patient outreach campaign performance',
    description: 'Analyze patient communication campaign performance to improve outreach response rates and engagement.',
    kpi: 'Outreach response rate',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Patient communication audiences',
    strategicIntent: 'Improve patient outreach effectiveness through campaign performance analysis',
  },
  'perf-healthcare-2': {
    scenarioId: 'perf-healthcare-2', outcome: 'campaign-performance', industry: 'healthcare',
    title: 'Optimize appointment and enrollment conversion',
    description: 'Diagnose conversion performance across screening and enrollment campaigns to improve completion rates.',
    kpi: 'Appointment completion rate',
    skillFamily: 'performance-analysis',
    outputFormatKey: 'performance_diagnosis',
    outputModules: ['executive_summary', 'performance_diagnosis', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Screening and enrollment prospects',
    strategicIntent: 'Reduce appointment and enrollment drop-off through funnel optimization',
  },

  // Retention → Healthcare
  'ret-healthcare-1': {
    scenarioId: 'ret-healthcare-1', outcome: 'retention', industry: 'healthcare',
    title: 'Re-engage patients with declining activity',
    description: 'Design a retention journey for patients whose visit frequency is declining to prevent disengagement.',
    kpi: 'Patient retention rate',
    skillFamily: 'journey',
    outputFormatKey: 'journey_map',
    outputModules: ['executive_summary', 'journey_map', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Patients with declining visit frequency',
    strategicIntent: 'Prevent patient disengagement through proactive re-engagement journeys',
  },
  'ret-healthcare-2': {
    scenarioId: 'ret-healthcare-2', outcome: 'retention', industry: 'healthcare',
    title: 'Reduce churn in care and wellness programs',
    description: 'Create a campaign to retain at-risk members in wellness and care management programs.',
    kpi: 'Program retention rate',
    skillFamily: 'campaign-brief',
    outputFormatKey: 'campaign_brief',
    outputModules: ['executive_summary', 'campaign_brief', 'audience_rationale', 'channel_strategy', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'At-risk wellness program members',
    strategicIntent: 'Reduce wellness program churn through targeted retention campaigns',
  },

  // Insights → Healthcare
  'ins-healthcare-1': {
    scenarioId: 'ins-healthcare-1', outcome: 'insights', industry: 'healthcare',
    title: 'Identify likely patients for target service lines',
    description: 'Surface patient profiles with the highest propensity to utilize target service lines for prioritized outreach.',
    kpi: 'Service line match rate',
    skillFamily: 'segment-opportunity',
    outputFormatKey: 'segment_cards',
    outputModules: ['executive_summary', 'segment_cards', 'audience_rationale', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'High-propensity patient profiles',
    strategicIntent: 'Match patients to service lines based on propensity signals',
  },
  'ins-healthcare-2': {
    scenarioId: 'ins-healthcare-2', outcome: 'insights', industry: 'healthcare',
    title: 'Find audiences for preventative care campaigns',
    description: 'Analyze patient data to identify populations eligible for preventative care screenings and wellness programs.',
    kpi: 'Screening participation rate',
    skillFamily: 'insight-summary',
    outputFormatKey: 'insight_summary',
    outputModules: ['executive_summary', 'insight_summary', 'segment_cards', 'kpi_framework', 'next_actions', 'insight_panel'],
    audienceFocus: 'Preventative care eligible populations',
    strategicIntent: 'Identify and activate eligible populations for preventative care campaigns',
  },
};

/** Look up a scenario config by ID */
export function getScenarioConfig(scenarioId: string): ScenarioConfig | undefined {
  return scenarioRegistry[scenarioId];
}
