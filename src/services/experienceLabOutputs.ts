import type { OutputData } from '../stores/experienceLabStore';
import { goals, industries, scenarios } from '../data/experienceLabConfig';

interface GenerateInput {
  goal: string;
  industry: string;
  scenario: string;
  inputs: Record<string, string | string[]>;
}

function label(id: string, list: Array<{ id: string; label: string }>): string {
  return list.find(i => i.id === id)?.label || id;
}

function channelList(val: string | string[] | undefined): string {
  if (!val) return 'email';
  if (Array.isArray(val)) return val.map(v => v.replace(/-/g, ' ')).join(', ');
  return val.replace(/-/g, ' ');
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function generateExperienceLabOutput(input: GenerateInput): OutputData {
  const { goal, industry, scenario, inputs } = input;
  const goalLabel = label(goal, goals);
  const industryLabel = label(industry, industries);
  const scenarioLabel = label(scenario, scenarios);

  switch (scenario) {
    case 'campaign-brief': return generateCampaignBrief(goalLabel, industryLabel, inputs);
    case 'customer-segments': return generateCustomerSegments(goalLabel, industryLabel, inputs);
    case 'lifecycle-journey': return generateLifecycleJourney(goalLabel, industryLabel, inputs);
    case 'performance-analysis': return generatePerformanceAnalysis(goalLabel, industryLabel, inputs);
    default: return generateCampaignBrief(goalLabel, industryLabel, inputs);
  }
}

function generateCampaignBrief(goal: string, industry: string, inputs: Record<string, string | string[]>): OutputData {
  const objective = titleCase(inputs.objective as string || 'repeat-purchase');
  const audience = titleCase(inputs.audience as string || 'high-value-repeat');
  const channels = channelList(inputs.channels);
  const priority = titleCase(inputs.priority as string || 'roi');
  const kpi = titleCase(inputs.kpi as string || 'conversion-rate');

  return {
    summaryBanner: {
      goal,
      audience,
      topRecommendation: `Launch a coordinated ${channels.split(',')[0].trim()} + ${channels.includes(',') ? channels.split(',')[1].trim() : 'onsite'} campaign targeting ${audience} with a ${objective.toLowerCase()}-focused strategy.`,
      impactFraming: `Projected to improve ${kpi.toLowerCase()} by 15-25% within 8 weeks based on ${industry.toLowerCase()} benchmarks.`,
    },
    executiveSummary: `This campaign brief targets ${audience} in the ${industry} vertical with a primary objective to ${objective.toLowerCase()}. The strategy prioritizes ${priority.toLowerCase()} and leverages ${channels} to deliver measurable results against ${kpi.toLowerCase()}.\n\nThe approach uses a 3-phase rollout: a 2-week audience activation and creative testing phase, a 4-week scaled execution phase with real-time optimization, and a 2-week analysis and iteration phase. This structure balances speed with learning, ensuring early signals inform full-scale deployment.\n\nBased on similar campaigns in ${industry.toLowerCase()}, this approach is expected to outperform single-channel strategies by 2-3x on the primary KPI.`,
    audienceCards: [
      {
        name: audience,
        whyItMatters: `This segment represents the highest opportunity for ${objective.toLowerCase()} based on historical purchase patterns and engagement signals.`,
        opportunityLevel: 'High',
        suggestedAction: `Activate with personalized ${channels.split(',')[0].trim()} messaging emphasizing value and relevance.`,
      },
      {
        name: 'Adjacent High-Potential',
        whyItMatters: 'Lookalike profiles showing similar behavioral signals but not yet in the primary segment.',
        opportunityLevel: 'Medium',
        suggestedAction: 'Test with a subset of creative from the primary campaign to validate expansion potential.',
      },
      {
        name: 'Exclusion Segment',
        whyItMatters: 'Recently converted or already engaged customers who should be excluded to avoid over-messaging.',
        opportunityLevel: 'Low',
        suggestedAction: 'Suppress from campaign to protect experience and reduce waste.',
      },
    ],
    channelStrategy: generateChannelStrategy(channels),
    scenarioCore: {
      title: 'Campaign Brief',
      sections: [
        { label: 'Campaign Objective', content: `${objective} for ${audience} in the ${industry} vertical.` },
        { label: 'Target Audience', content: `Primary: ${audience}. This segment has been identified based on behavioral and transactional signals indicating high propensity for ${objective.toLowerCase()}.` },
        { label: 'Messaging Direction', content: `Lead with relevance and personalization. Emphasize value over discount. Use social proof and urgency where appropriate. Adapt tone for ${industry.toLowerCase()} context.` },
        { label: 'Offer / Content Strategy', content: `Phase 1: Awareness content showcasing brand value. Phase 2: Personalized product recommendations based on browsing history. Phase 3: Time-sensitive offer with clear call-to-action.` },
        { label: 'Timeline', content: `Week 1-2: Audience build + creative development. Week 3-4: Soft launch with A/B testing. Week 5-6: Full rollout with optimization. Week 7-8: Analysis and iteration.` },
        { label: 'Budget Guidance', content: `Allocate 60% to top-performing channel, 25% to secondary, 15% to testing. Recommended budget efficiency: ${priority.toLowerCase()} focus.` },
      ],
    },
    kpiFramework: [
      { type: 'Primary', name: kpi, note: `Target: Top-quartile ${industry.toLowerCase()} benchmark` },
      { type: 'Secondary', name: 'Customer lifetime value', note: 'Track 90-day post-campaign LTV lift' },
      { type: 'Leading Indicator', name: 'Email open rate / CTR', note: 'Early signal of message-market fit' },
      { type: 'Optimization', name: 'Cost per conversion', note: 'Monitor weekly and reallocate budget accordingly' },
    ],
    nextActions: [
      { action: `Build ${audience} segment in your CDP and validate audience size`, priority: 'Do now' },
      { action: `Brief creative team on messaging direction and channel-specific formats`, priority: 'Do now' },
      { action: `Set up A/B test framework for Phase 1 launch`, priority: 'Test next' },
      { action: `Configure cross-channel attribution model`, priority: 'Test next' },
      { action: `Plan Phase 2 expansion to adjacent segments based on Phase 1 learnings`, priority: 'Scale later' },
    ],
    insightPanel: {
      whyThisRecommendation: `This strategy was designed around ${objective.toLowerCase()} as the primary objective, which aligns with the ${goal.toLowerCase()} goal. The ${audience} audience was selected because they show the strongest signals for this objective in ${industry.toLowerCase()} datasets. The channel mix of ${channels} was chosen to maximize reach within this segment while supporting ${priority.toLowerCase()}.`,
      businessImpact: [
        `Projected ${kpi.toLowerCase()} improvement: 15-25% over baseline`,
        `Estimated revenue impact: $2.1M-$3.4M incremental (based on ${industry.toLowerCase()} benchmarks)`,
        `Reduced manual planning time by 80% vs. traditional brief creation`,
        `Faster time-to-market: 2 weeks vs. typical 4-6 week planning cycle`,
      ],
      whatChanged: [
        `Because you selected "${objective}", the strategy prioritizes re-engagement over acquisition tactics.`,
        `Because you chose "${audience}", the messaging emphasizes relevance and value recognition.`,
        `The ${channels} channel mix is optimized for this audience's engagement patterns.`,
        `"${priority}" as a constraint shaped the budget allocation and testing approach.`,
      ],
      howTreasureHelps: [
        'Unified customer profiles across all data sources for precise audience building',
        'AI-powered segment discovery to find your highest-opportunity audiences',
        'Governed workflow orchestration to execute campaigns across channels',
        'Real-time performance monitoring with automated optimization recommendations',
        'Traceable AI decisions with full audit trail for compliance and trust',
      ],
    },
  };
}

function generateCustomerSegments(goal: string, industry: string, inputs: Record<string, string | string[]>): OutputData {
  const objective = titleCase(inputs.objective as string || 'retention');
  const lens = titleCase(inputs['segment-lens'] as string || 'value');
  const audiencePriority = titleCase(inputs['audience-priority'] as string || 'revenue-upside');
  const channel = titleCase(inputs['activation-channel'] as string || 'email');

  return {
    summaryBanner: {
      goal,
      audience: `${lens}-based segments`,
      topRecommendation: `Focus on 3 high-potential ${lens.toLowerCase()}-based segments with ${objective.toLowerCase()} potential, activated through ${channel.toLowerCase()}.`,
      impactFraming: `Identified segments represent an estimated 35-45% of total addressable revenue opportunity.`,
    },
    executiveSummary: `Using a ${lens.toLowerCase()} segmentation lens, we identified 3 distinct customer segments with high potential for ${objective.toLowerCase()} in the ${industry} vertical. These segments were prioritized by ${audiencePriority.toLowerCase()} and are designed for activation through ${channel.toLowerCase()}.\n\nEach segment includes a clear profile, opportunity assessment, and recommended activation strategy. The segmentation is built on behavioral and transactional signals from sample ${industry.toLowerCase()} data, ensuring actionability and measurability.`,
    audienceCards: [
      {
        name: industry === 'Retail' ? 'Premium Loyalists' : industry === 'Travel & Hospitality' ? 'Elite Travelers' : 'Category Champions',
        whyItMatters: `Top 15% by value with 4.2x higher LTV than average. Showing early signals of reduced engagement.`,
        opportunityLevel: 'High',
        suggestedAction: `Launch a personalized ${channel.toLowerCase()} campaign with exclusive early access and premium positioning.`,
      },
      {
        name: industry === 'Retail' ? 'Rising Potentials' : industry === 'Travel & Hospitality' ? 'Experience Explorers' : 'Growth Shoppers',
        whyItMatters: `Mid-tier customers with accelerating purchase frequency. 60% predicted to reach top-tier within 6 months.`,
        opportunityLevel: 'High',
        suggestedAction: `Nurture with targeted recommendations and progressive loyalty incentives.`,
      },
      {
        name: industry === 'Retail' ? 'At-Risk Regulars' : industry === 'Travel & Hospitality' ? 'Dormant Bookers' : 'Lapsed Buyers',
        whyItMatters: `Previously active segment showing 30% decline in engagement over the last quarter.`,
        opportunityLevel: 'Medium',
        suggestedAction: `Deploy a win-back sequence with personalized re-engagement offers and social proof.`,
      },
    ],
    channelStrategy: [
      { channel: channel, role: 'Primary activation', messageAngle: 'Personalized segment-specific messaging', reason: `Selected as primary channel based on ${lens.toLowerCase()} segment engagement patterns.` },
      { channel: 'Onsite', role: 'Supporting', messageAngle: 'Personalized content and recommendations', reason: 'Reinforces messaging when segments visit owned properties.' },
    ],
    scenarioCore: {
      title: 'Segment Discovery',
      sections: [
        { label: 'Segmentation Approach', content: `${lens}-based analysis using behavioral, transactional, and engagement signals from ${industry.toLowerCase()} sample data.` },
        { label: 'Segment Sizing', content: `Segment 1: ~120K profiles (15% of base). Segment 2: ~280K profiles (35% of base). Segment 3: ~95K profiles (12% of base). Total addressable: 62% of customer base.` },
        { label: 'Prioritization Logic', content: `Segments ranked by ${audiencePriority.toLowerCase()} using predictive scoring models. Confidence level: High (based on 12 months of behavioral data).` },
        { label: 'Activation Readiness', content: `All segments are activation-ready for ${channel.toLowerCase()}. Match rates: 85-92% across segments. Recommended refresh cadence: weekly.` },
      ],
    },
    kpiFramework: [
      { type: 'Primary', name: `${objective} rate`, note: `Measure per-segment ${objective.toLowerCase()} improvement` },
      { type: 'Secondary', name: 'Segment migration rate', note: 'Track movement between segments over time' },
      { type: 'Leading Indicator', name: 'Engagement score change', note: 'Weekly monitoring of segment health' },
      { type: 'Optimization', name: 'Cost per reactivation', note: 'Efficiency metric for win-back segments' },
    ],
    nextActions: [
      { action: `Validate segment definitions against your actual customer data`, priority: 'Do now' },
      { action: `Build activation audiences in your CDP for Segment 1 (highest opportunity)`, priority: 'Do now' },
      { action: `Design segment-specific creative and messaging`, priority: 'Test next' },
      { action: `Set up segment tracking dashboard with weekly refresh`, priority: 'Test next' },
      { action: `Expand segmentation to secondary dimensions for deeper personalization`, priority: 'Scale later' },
    ],
    insightPanel: {
      whyThisRecommendation: `The ${lens.toLowerCase()} segmentation lens was chosen because it provides the most actionable view for ${objective.toLowerCase()}. Segments were prioritized by ${audiencePriority.toLowerCase()}, which surfaces the groups with the highest potential for measurable impact. The ${channel.toLowerCase()} activation channel aligns with these segments' engagement preferences.`,
      businessImpact: [
        `Identified segments represent 35-45% of total addressable revenue`,
        `Segment 1 alone has an estimated $1.8M incremental revenue opportunity`,
        `Precision targeting expected to improve campaign efficiency by 30-40%`,
        `Reduced audience building time from days to minutes`,
      ],
      whatChanged: [
        `"${lens}" lens shaped how segments were defined and grouped.`,
        `"${audiencePriority}" prioritization surfaced the highest-impact groups first.`,
        `"${channel}" as activation channel influenced segment sizing and match rate calculations.`,
      ],
      howTreasureHelps: [
        'Unified customer data platform aggregates signals across all touchpoints',
        'AI-powered segment discovery surfaces non-obvious high-value groups',
        'Real-time segment membership updates as customer behavior changes',
        'Direct segment activation to any connected marketing channel',
        'Governed data access ensures compliance with privacy regulations',
      ],
    },
  };
}

function generateLifecycleJourney(goal: string, industry: string, inputs: Record<string, string | string[]>): OutputData {
  const journeyGoal = titleCase(inputs['journey-goal'] as string || 'retention');
  const audience = titleCase(inputs.audience as string || 'high-value-repeat');
  const channelSet = titleCase(inputs['channel-set'] as string || 'email-sms');
  const posture = titleCase(inputs['brand-posture'] as string || 'personalized');
  const kpi = titleCase(inputs.kpi as string || 'retention');

  const journeyStages = getJourneyStages(inputs['journey-goal'] as string || 'retention', channelSet, posture);

  return {
    summaryBanner: {
      goal,
      audience,
      topRecommendation: `Deploy a ${journeyStages.length}-step ${journeyGoal.toLowerCase()} journey for ${audience} using ${channelSet.toLowerCase()} with a ${posture.toLowerCase()} tone.`,
      impactFraming: `Expected to improve ${kpi.toLowerCase()} by 20-30% within the first 60 days.`,
    },
    executiveSummary: `This lifecycle journey is designed for ${audience} in the ${industry} vertical, focused on ${journeyGoal.toLowerCase()}. The journey uses a ${posture.toLowerCase()} brand posture across ${channelSet.toLowerCase()} channels, optimized for ${kpi.toLowerCase()} as the primary success metric.\n\nThe ${journeyStages.length}-step flow guides customers through a carefully sequenced set of touchpoints, each triggered by specific behavioral or time-based signals. The design balances engagement frequency with customer experience quality, ensuring each message adds value.`,
    audienceCards: [
      {
        name: audience,
        whyItMatters: `Primary journey audience selected for ${journeyGoal.toLowerCase()} potential.`,
        opportunityLevel: 'High',
        suggestedAction: `Enroll in the ${journeyGoal.toLowerCase()} journey immediately upon qualifying signal.`,
      },
    ],
    channelStrategy: channelSet.toLowerCase().includes('omni')
      ? [
          { channel: 'Email', role: 'Primary nurture', messageAngle: `${posture} content delivery`, reason: 'Highest reach and content flexibility' },
          { channel: 'SMS', role: 'Urgency triggers', messageAngle: 'Time-sensitive actions', reason: 'High open rates for critical moments' },
          { channel: 'Onsite', role: 'Contextual reinforcement', messageAngle: 'Personalized recommendations', reason: 'Captures intent when customer is active' },
          { channel: 'Push', role: 'Re-engagement', messageAngle: 'Gentle reminders', reason: 'Reaches mobile-first segments' },
        ]
      : [
          { channel: channelSet.split('+')[0]?.trim() || 'Email', role: 'Primary', messageAngle: `${posture} messaging`, reason: 'Selected as primary journey channel' },
          { channel: channelSet.split('+')[1]?.trim() || 'SMS', role: 'Supporting', messageAngle: 'Complementary touchpoints', reason: 'Reinforces primary channel at key moments' },
        ],
    scenarioCore: {
      title: 'Lifecycle Journey',
      sections: journeyStages.map((stage, i) => ({
        label: `Stage ${i + 1}: ${stage.name}`,
        content: `Trigger: ${stage.trigger}\nChannel: ${stage.channel}\nMessage: ${stage.message}\nWait: ${stage.wait}\nGoal: ${stage.stageGoal}`,
      })),
    },
    kpiFramework: [
      { type: 'Primary', name: kpi, note: `Target: 20-30% improvement over baseline` },
      { type: 'Secondary', name: 'Journey completion rate', note: 'Percentage of enrolled customers completing all stages' },
      { type: 'Leading Indicator', name: 'Stage-to-stage progression', note: 'Monitors drop-off between journey stages' },
      { type: 'Optimization', name: 'Time to next action', note: 'Speed at which customers progress through the journey' },
    ],
    nextActions: [
      { action: `Define entry criteria and qualifying signals for ${audience}`, priority: 'Do now' },
      { action: `Create content and creative for Stage 1 and Stage 2`, priority: 'Do now' },
      { action: `Set up journey triggers and wait conditions in your orchestration platform`, priority: 'Test next' },
      { action: `A/B test Stage 1 messaging variants`, priority: 'Test next' },
      { action: `Extend journey with personalized branching logic based on engagement signals`, priority: 'Scale later' },
    ],
    insightPanel: {
      whyThisRecommendation: `The ${journeyGoal.toLowerCase()} journey was designed around ${audience}'s behavioral patterns and ${posture.toLowerCase()} brand positioning. The ${channelSet.toLowerCase()} channel combination provides optimal reach and engagement frequency for this audience in ${industry.toLowerCase()}.`,
      businessImpact: [
        `Expected ${kpi.toLowerCase()} improvement: 20-30% within 60 days`,
        `Projected incremental revenue: $850K-$1.2M per quarter`,
        `Automation reduces manual campaign management by 60%`,
        `Consistent customer experience across all journey touchpoints`,
      ],
      whatChanged: [
        `"${journeyGoal}" goal shaped the journey's structure, triggers, and messaging arc.`,
        `"${audience}" as the target influenced entry criteria and personalization level.`,
        `"${posture}" brand posture determined the tone and messaging approach at each stage.`,
        `"${channelSet}" channel set defined the orchestration pattern and timing.`,
      ],
      howTreasureHelps: [
        'Real-time behavioral triggers powered by unified customer profiles',
        'Cross-channel journey orchestration with AI-optimized timing',
        'Automated content personalization based on customer context',
        'Continuous journey optimization with AI-recommended improvements',
        'Full journey analytics with stage-by-stage performance tracking',
      ],
    },
  };
}

function generatePerformanceAnalysis(goal: string, industry: string, inputs: Record<string, string | string[]>): OutputData {
  const perfGoal = titleCase(inputs['performance-goal'] as string || 'roas');
  const problemArea = titleCase(inputs['problem-area'] as string || 'audience-targeting');
  const constraint = titleCase(inputs.constraint as string || 'scale-efficiently');
  const outputFocus = titleCase(inputs['output-focus'] as string || 'actions');

  return {
    summaryBanner: {
      goal,
      audience: `${industry} marketing portfolio`,
      topRecommendation: `Address ${problemArea.toLowerCase()} issues to ${perfGoal.toLowerCase()} while maintaining ${constraint.toLowerCase()} constraints.`,
      impactFraming: `Analysis identifies 3 high-impact optimization opportunities with projected 18-28% improvement.`,
    },
    executiveSummary: `This performance analysis examines sample ${industry.toLowerCase()} marketing data through the lens of ${perfGoal.toLowerCase()}, with a focus on ${problemArea.toLowerCase()} as the suspected issue area. The analysis operates within a "${constraint.toLowerCase()}" budget constraint and delivers a ${outputFocus.toLowerCase()} as the primary output.\n\nKey findings indicate that ${problemArea.toLowerCase()} is contributing to suboptimal performance, with specific recommendations for improvement that can be executed within existing budget parameters. The analysis leverages cross-channel performance signals to identify root causes and prioritize high-impact optimizations.`,
    audienceCards: [
      {
        name: 'Underperforming Segments',
        whyItMatters: `Currently receiving 35% of budget but delivering only 12% of conversions. ${problemArea} is the primary driver.`,
        opportunityLevel: 'High',
        suggestedAction: `Reallocate budget from underperforming segments to high-potential audiences identified by AI.`,
      },
      {
        name: 'Hidden Opportunity Segments',
        whyItMatters: 'AI-identified customer groups with high conversion propensity but minimal current investment.',
        opportunityLevel: 'High',
        suggestedAction: 'Test with 10-15% of reallocated budget to validate AI-predicted performance.',
      },
      {
        name: 'Efficiency Leaders',
        whyItMatters: 'Top-performing segments that could benefit from incremental scale.',
        opportunityLevel: 'Medium',
        suggestedAction: 'Increase investment by 20% with close monitoring of marginal efficiency.',
      },
    ],
    channelStrategy: [
      { channel: 'Paid Social', role: 'Optimization focus', messageAngle: 'Audience refinement + creative refresh', reason: `Largest ${problemArea.toLowerCase()} impact opportunity.` },
      { channel: 'Email', role: 'Efficiency gains', messageAngle: 'Segmentation + personalization', reason: 'Highest ROI channel with room for improvement.' },
      { channel: 'Display', role: 'Reduction candidate', messageAngle: 'Frequency capping + retargeting only', reason: 'Currently over-indexed relative to performance.' },
    ],
    scenarioCore: {
      title: 'Performance Analysis',
      sections: [
        { label: 'Performance Diagnosis', content: `Current ${perfGoal.toLowerCase()} is 22% below ${industry.toLowerCase()} benchmarks. Primary driver: ${problemArea.toLowerCase()}. Contributing factors include suboptimal audience targeting, creative fatigue on key channels, and budget misallocation across funnel stages.` },
        { label: 'Root Cause Analysis', content: `1. ${problemArea}: Audience segments are too broad, leading to wasted impressions on low-intent users (estimated 30% waste).\n2. Channel mix: Over-investment in awareness channels relative to mid-funnel conversion support.\n3. Frequency: Average frequency of 8.2x exceeds optimal range of 4-6x for ${industry.toLowerCase()}.` },
        { label: 'Recommended Optimizations', content: `1. Refine audience targeting using behavioral signals (projected +15% ${perfGoal.toLowerCase()}).\n2. Shift 20% of awareness budget to mid-funnel retargeting.\n3. Implement frequency caps at 5x per user per week.\n4. Refresh creative assets (top 3 ads showing 40% CTR decline).` },
        { label: 'Impact Forecast', content: `Conservative: +18% ${perfGoal.toLowerCase()} improvement within 4 weeks.\nModerate: +25% improvement with full optimization implementation.\nAggressive: +35% improvement with AI-powered real-time bidding adjustments.` },
      ],
    },
    kpiFramework: [
      { type: 'Primary', name: perfGoal, note: 'Target: Top-quartile industry benchmark' },
      { type: 'Secondary', name: 'Cost per acquisition', note: 'Monitor alongside primary to ensure balance' },
      { type: 'Leading Indicator', name: 'Click-through rate', note: 'Early signal of creative and targeting effectiveness' },
      { type: 'Optimization', name: 'Incremental lift', note: 'Measure true causal impact of changes' },
    ],
    nextActions: [
      { action: `Implement audience refinement for top 3 campaigns immediately`, priority: 'Do now' },
      { action: `Set frequency caps across all active channels`, priority: 'Do now' },
      { action: `A/B test new creative against current top performers`, priority: 'Test next' },
      { action: `Reallocate 20% of awareness budget to mid-funnel conversion`, priority: 'Test next' },
      { action: `Deploy AI-powered bid optimization once baseline is established`, priority: 'Scale later' },
    ],
    insightPanel: {
      whyThisRecommendation: `The analysis focused on ${problemArea.toLowerCase()} because it was identified as the primary driver of suboptimal ${perfGoal.toLowerCase()} in the sample ${industry.toLowerCase()} dataset. Recommendations are constrained by "${constraint.toLowerCase()}" and prioritized by expected impact on ${perfGoal.toLowerCase()}.`,
      businessImpact: [
        `Projected ${perfGoal.toLowerCase()} improvement: 18-28% within 4-6 weeks`,
        `Estimated budget savings from waste reduction: $340K-$520K annually`,
        `Faster optimization cycle: real-time vs. weekly manual reviews`,
        `Improved measurement confidence through causal attribution`,
      ],
      whatChanged: [
        `"${problemArea}" as the suspected issue focused the analysis on specific diagnostic signals.`,
        `"${constraint}" constraint shaped recommendations to avoid budget increases.`,
        `"${outputFocus}" as the preferred output format determined the depth and structure of deliverables.`,
      ],
      howTreasureHelps: [
        'Cross-channel performance data unified in a single view',
        'AI-powered anomaly detection surfaces issues before they compound',
        'Automated optimization recommendations based on real-time signals',
        'Governed decision-making with traceable AI reasoning',
        'Incremental lift measurement for true causal impact analysis',
      ],
    },
  };
}

function generateChannelStrategy(channels: string): OutputData['channelStrategy'] {
  const channelArr = channels.split(',').map(c => c.trim());
  const roles = ['Primary acquisition driver', 'Engagement and retargeting', 'Conversion support', 'Supplementary reach', 'Testing channel'];
  const angles = [
    'Broad reach with personalized creative',
    'Personalized re-engagement messaging',
    'Direct response with urgency-driven CTAs',
    'Incremental awareness and frequency',
    'Experimental creative and audience testing',
  ];
  const reasons = [
    'Highest audience overlap and engagement potential',
    'Strong retargeting performance in this vertical',
    'High conversion rates for warm audiences',
    'Cost-efficient incremental reach',
    'Low-risk environment for testing new approaches',
  ];

  return channelArr.map((ch, i) => ({
    channel: ch.charAt(0).toUpperCase() + ch.slice(1),
    role: roles[i] || 'Supporting channel',
    messageAngle: angles[i] || 'Complementary messaging',
    reason: reasons[i] || 'Additional reach and engagement',
  }));
}

function getJourneyStages(journeyGoal: string, channelSet: string, posture: string) {
  const ch1 = channelSet.split('+')[0]?.trim() || 'Email';
  const ch2 = channelSet.split('+')[1]?.trim() || 'SMS';

  const stagesByGoal: Record<string, Array<{ name: string; trigger: string; channel: string; message: string; wait: string; stageGoal: string }>> = {
    'welcome': [
      { name: 'Welcome', trigger: 'Account creation or first purchase', channel: ch1, message: `${posture} welcome message with brand introduction and value proposition`, wait: 'Immediate', stageGoal: 'Build brand affinity and set expectations' },
      { name: 'Onboarding', trigger: '24 hours after welcome', channel: ch1, message: 'Product/feature highlights and quick-start guide', wait: '24 hours', stageGoal: 'Drive first key action or exploration' },
      { name: 'Engagement Nudge', trigger: '3 days post-onboarding, if no action', channel: ch2, message: 'Gentle reminder with social proof', wait: '3 days', stageGoal: 'Convert passive subscribers to active users' },
      { name: 'First Value Moment', trigger: '7 days after signup', channel: ch1, message: 'Personalized recommendation based on browsing/purchase signals', wait: '4 days', stageGoal: 'Deliver first personalized experience' },
      { name: 'Relationship Building', trigger: '14 days after signup', channel: ch1, message: 'Community invitation or loyalty program introduction', wait: '7 days', stageGoal: 'Transition from new customer to engaged member' },
    ],
    'retention': [
      { name: 'Engagement Check', trigger: 'Purchase + 7 days with no return visit', channel: ch1, message: 'Personalized recommendations based on recent purchase', wait: '7 days post-purchase', stageGoal: 'Drive return visit and browse behavior' },
      { name: 'Value Reminder', trigger: '14 days post-purchase', channel: ch1, message: 'Product tips, complementary items, or usage content', wait: '7 days', stageGoal: 'Reinforce purchase decision and build anticipation' },
      { name: 'Replenishment / Next Best', trigger: '21-30 days post-purchase', channel: ch2, message: 'Timely reorder reminder or next-best-product suggestion', wait: '7-9 days', stageGoal: 'Drive repeat purchase at optimal timing' },
      { name: 'Loyalty Nudge', trigger: '30 days, if no repeat purchase', channel: ch1, message: 'Loyalty points reminder or exclusive member benefit', wait: '7 days', stageGoal: 'Prevent transition to at-risk status' },
      { name: 'Escalation', trigger: '45 days with declining engagement', channel: ch2, message: 'Special offer with urgency element', wait: '15 days', stageGoal: 'Last-touch retention before win-back' },
    ],
    'winback': [
      { name: 'Soft Re-engagement', trigger: '60+ days since last purchase', channel: ch1, message: '"We miss you" message with new arrivals or updates', wait: 'Day 0', stageGoal: 'Reopen the conversation without pressure' },
      { name: 'Incentive Offer', trigger: '7 days after soft re-engagement, if no action', channel: ch1, message: 'Exclusive return offer or discount', wait: '7 days', stageGoal: 'Create financial incentive to return' },
      { name: 'Urgency Push', trigger: '5 days after incentive, if no action', channel: ch2, message: 'Time-limited offer reminder', wait: '5 days', stageGoal: 'Drive immediate action with scarcity' },
      { name: 'Final Attempt', trigger: '7 days after urgency push', channel: ch1, message: 'Last chance message or feedback request', wait: '7 days', stageGoal: 'Final re-engagement attempt or data collection' },
    ],
    'loyalty': [
      { name: 'Tier Welcome', trigger: 'Loyalty tier upgrade or enrollment', channel: ch1, message: 'Celebration message with tier benefits overview', wait: 'Immediate', stageGoal: 'Reinforce value of loyalty participation' },
      { name: 'Point Momentum', trigger: 'Points balance reaches 50% of next reward', channel: ch2, message: 'Progress update with suggested earning actions', wait: 'Triggered', stageGoal: 'Accelerate point earning and engagement' },
      { name: 'Exclusive Access', trigger: 'Weekly cadence for active members', channel: ch1, message: 'Members-only content, early access, or events', wait: 'Weekly', stageGoal: 'Deliver ongoing exclusive value' },
      { name: 'Referral Prompt', trigger: 'After 3rd purchase or high NPS signal', channel: ch1, message: 'Referral program invitation with bonus points', wait: 'Triggered', stageGoal: 'Convert loyal customers to brand advocates' },
      { name: 'Anniversary / Milestone', trigger: 'Membership anniversary or purchase milestone', channel: ch1, message: 'Personalized celebration with special reward', wait: 'Annual', stageGoal: 'Deepen emotional connection to the brand' },
    ],
    'cart-recovery': [
      { name: 'Gentle Reminder', trigger: 'Cart abandoned for 1 hour', channel: ch1, message: 'Items still in cart with product images', wait: '1 hour', stageGoal: 'Capture quick recoveries from distracted shoppers' },
      { name: 'Urgency Nudge', trigger: '24 hours after abandonment, if no recovery', channel: ch2, message: 'Low stock or popular item alert', wait: '23 hours', stageGoal: 'Create urgency without discounting' },
      { name: 'Incentive Offer', trigger: '48 hours after abandonment', channel: ch1, message: 'Small incentive (free shipping, 10% off)', wait: '24 hours', stageGoal: 'Remove price friction for price-sensitive shoppers' },
      { name: 'Alternative Suggestion', trigger: '72 hours, if no recovery', channel: ch1, message: 'Similar or complementary product recommendations', wait: '24 hours', stageGoal: 'Capture intent even if original items aren\'t right' },
    ],
  };

  return stagesByGoal[journeyGoal] || stagesByGoal['retention'];
}
