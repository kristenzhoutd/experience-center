// ============================================================
// Treasure AI Experience Lab - Configuration Data
// ============================================================

// --- Goals (Landing Page) ---
export interface GoalOption {
  id: string;
  label: string;
  description: string;
  icon: string; // emoji for simplicity in MVP
}

export const goals: GoalOption[] = [
  { id: 'revenue', label: 'Increase revenue', description: 'Drive measurable growth through AI-powered targeting, journey orchestration, and opportunity discovery.', icon: 'trending-up' },
  { id: 'campaign-performance', label: 'Improve campaign performance', description: 'Get better results from every campaign through AI-powered audience, channel, and message optimization.', icon: 'bar-chart' },
  { id: 'retention', label: 'Improve customer retention', description: 'Reduce churn and strengthen loyalty with more timely, relevant, and personalized customer experiences.', icon: 'shield' },
  { id: 'insights', label: 'Generate faster business insights', description: 'Turn customer and campaign signals into actionable insights that help teams decide and act faster.', icon: 'lightbulb' },
];

// --- Industries (Screen 2) ---
export interface IndustryOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export const industries: IndustryOption[] = [
  { id: 'retail', label: 'Retail', description: 'E-commerce, brick-and-mortar, and omnichannel retail brands', icon: 'shopping-bag', enabled: true },
  { id: 'travel', label: 'Travel & Hospitality', description: 'Airlines, hotels, OTAs, cruise lines, and travel experience providers', icon: 'plane', enabled: true },
  { id: 'cpg', label: 'CPG', description: 'Consumer packaged goods, FMCG, and consumer brands', icon: 'package', enabled: true },
  { id: 'automotive', label: 'Automotive', description: 'Auto manufacturers, dealers, and mobility services', icon: 'car', enabled: false },
  { id: 'media', label: 'Media & Entertainment', description: 'Streaming, publishing, and content platforms', icon: 'film', enabled: false },
  { id: 'financial', label: 'Financial Services', description: 'Banking, insurance, fintech, and wealth management', icon: 'landmark', enabled: false },
];

// --- Outcome → Industry availability ---
export const outcomeIndustries: Record<string, string[]> = {
  'revenue': ['retail', 'cpg', 'travel'],
  'campaign-performance': ['retail', 'cpg', 'travel'],
  'retention': ['retail', 'travel', 'cpg'],
  'insights': ['cpg', 'retail', 'travel'],
};

// --- Scenarios (Screen 3) ---
export interface ScenarioOption {
  id: string;
  label: string;
  description: string;
  estimatedTime: string;
  badge?: string;
  kpi?: string;
  previewLines: string[];
}

// Legacy flat list (kept for backward compat with label lookups)
export const scenarios: ScenarioOption[] = [
  { id: 'campaign-brief', label: 'Generate a campaign brief', description: '', estimatedTime: '3 min', previewLines: [] },
  { id: 'customer-segments', label: 'Discover customer segments', description: '', estimatedTime: '3 min', previewLines: [] },
  { id: 'lifecycle-journey', label: 'Build a lifecycle journey', description: '', estimatedTime: '3 min', previewLines: [] },
  { id: 'performance-analysis', label: 'Analyze marketing performance', description: '', estimatedTime: '3 min', previewLines: [] },
];

// --- Outcome + Industry → Scenario matrix ---
export const scenarioMatrix: Record<string, Record<string, ScenarioOption[]>> = {
  // ── Increase revenue ──
  revenue: {
    retail: [
      { id: 'rev-retail-1', label: 'Re-engage lapsed high-value shoppers', description: 'Create a targeted growth strategy for valuable shoppers who have stopped purchasing recently.', kpi: 'Repeat purchase rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'rev-retail-2', label: 'Identify high-intent browsers', description: 'Find the customer segments most likely to convert and prioritize them for activation.', kpi: 'Conversion rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'rev-retail-3', label: 'Build a post-purchase journey', description: 'Design a follow-up journey that encourages first-time buyers to make a second purchase.', kpi: 'Time to second purchase', estimatedTime: '3 min', previewLines: [] },
    ],
    cpg: [
      { id: 'rev-cpg-1', label: 'Build a replenishment campaign', description: 'Create a campaign to reach buyers when they are most likely ready to purchase again.', kpi: 'Repeat purchase rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'rev-cpg-2', label: 'Identify households with cross-category potential', description: 'Find buyer groups most likely to expand into adjacent product categories.', kpi: 'Basket size', estimatedTime: '3 min', previewLines: [] },
      { id: 'rev-cpg-3', label: 'Create a premium upsell brief', description: 'Develop a strategy to increase household value through premium product adoption.', kpi: 'Revenue per household', estimatedTime: '3 min', previewLines: [] },
    ],
    travel: [
      { id: 'rev-travel-1', label: 'Re-engage inactive loyalty members', description: 'Create a growth strategy to bring valuable loyalty members back into active booking behavior.', kpi: 'Rebooking rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'rev-travel-2', label: 'Identify premium guests', description: 'Find the guests most likely to respond to upgrades and premium offers.', kpi: 'Upgrade conversion rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'rev-travel-3', label: 'Create a targeted offer strategy for seasonal travelers', description: 'Build a campaign strategy for travelers whose demand is driven by seasonality and timing.', kpi: 'Booking rate', estimatedTime: '3 min', previewLines: [] },
    ],
  },
  // ── Improve campaign performance ──
  'campaign-performance': {
    retail: [
      { id: 'perf-retail-1', label: 'Diagnose underperforming promotions', description: 'Analyze why recent promotions are underperforming and identify the biggest optimization opportunities.', kpi: 'ROAS', estimatedTime: '3 min', previewLines: [] },
      { id: 'perf-retail-2', label: 'Refine audience targeting for seasonal campaigns', description: 'Improve who gets targeted in key seasonal campaigns to increase downstream performance.', kpi: 'Conversion rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'perf-retail-3', label: 'Optimize campaign timing for engaged shoppers', description: 'Find the best timing windows to improve progression from engagement to purchase.', kpi: 'Click-to-purchase rate', estimatedTime: '3 min', previewLines: [] },
    ],
    cpg: [
      { id: 'perf-cpg-1', label: 'Build a segment-based activation plan', description: 'Create a campaign plan that prioritizes the highest-opportunity buyer segments.', kpi: 'Conversion rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'perf-cpg-2', label: 'Identify the best channel mix for replenishment campaigns', description: 'Determine which channels are best suited to drive repeat purchase efficiently.', kpi: 'ROAS', estimatedTime: '3 min', previewLines: [] },
      { id: 'perf-cpg-3', label: 'Diagnose performance drop by audience group', description: 'Analyze which audience groups are driving weaker campaign results and why.', kpi: 'Response rate', estimatedTime: '3 min', previewLines: [] },
    ],
    travel: [
      { id: 'perf-travel-1', label: 'Optimize channel mix by traveler type', description: 'Match traveler segments to the channels most likely to drive efficient bookings and engagement.', kpi: 'ROAS', estimatedTime: '3 min', previewLines: [] },
      { id: 'perf-travel-2', label: 'Personalize post-booking communications', description: 'Improve post-booking communications to drive stronger upsell and add-on conversion.', kpi: 'Upsell rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'perf-travel-3', label: 'Create a destination-based content strategy', description: 'Develop a campaign strategy aligned to traveler interests and destination relevance.', kpi: 'Click-through rate', estimatedTime: '3 min', previewLines: [] },
    ],
  },
  // ── Improve customer retention ──
  retention: {
    retail: [
      { id: 'ret-retail-1', label: 'Build a loyalty journey for repeat buyers', description: 'Create a retention journey for customers showing strong repeat behavior but emerging drop-off risk.', kpi: 'Retention rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ret-retail-2', label: 'Find at-risk customers after their second purchase', description: 'Identify the customers most likely to disengage early in their lifecycle.', kpi: 'Retention rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ret-retail-3', label: 'Create a win-back campaign for inactive members', description: 'Develop a reactivation strategy for members who have stopped engaging or purchasing.', kpi: 'Reactivation rate', estimatedTime: '3 min', previewLines: [] },
    ],
    travel: [
      { id: 'ret-travel-1', label: 'Build a loyalty journey for high-value guests', description: 'Create a retention journey for guests with strong value but signs of declining engagement.', kpi: 'Retention rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ret-travel-2', label: 'Identify travelers at risk of disengagement', description: 'Find travelers most likely to churn and prioritize them for intervention.', kpi: 'Churn rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ret-travel-3', label: 'Tailor follow-up messaging by trip history', description: 'Personalize retention messaging based on prior trip behavior and engagement signals.', kpi: 'Engagement rate', estimatedTime: '3 min', previewLines: [] },
    ],
    cpg: [
      { id: 'ret-cpg-1', label: 'Identify high-frequency buyers at risk of slowing down', description: 'Find valuable buyers whose purchase behavior suggests early retention risk.', kpi: 'Retention rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ret-cpg-2', label: 'Build a loyalty journey for valuable households', description: 'Design a retention journey to deepen loyalty among high-value household segments.', kpi: 'Retention rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ret-cpg-3', label: 'Create a reactivation campaign for promo-driven buyers', description: 'Develop a campaign to bring back buyers who primarily engage through offers and discounts.', kpi: 'Repeat purchase rate', estimatedTime: '3 min', previewLines: [] },
    ],
  },
  // ── Generate faster business insights ──
  insights: {
    cpg: [
      { id: 'ins-cpg-1', label: 'Surface segments driving the highest repeat purchase rate', description: 'Identify the buyer groups most responsible for repeat purchase performance.', kpi: 'Repeat purchase rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ins-cpg-2', label: 'Analyze promotion sensitivity by segment', description: 'Understand which customer groups respond best to promotions and where to optimize spend.', kpi: 'ROAS', estimatedTime: '3 min', previewLines: [] },
      { id: 'ins-cpg-3', label: 'Find households with highest growth potential', description: 'Identify the audience groups with the greatest upside for future targeting and investment.', kpi: 'Targeting efficiency', estimatedTime: '3 min', previewLines: [] },
    ],
    retail: [
      { id: 'ins-retail-1', label: 'Identify product affinity segments', description: 'Find customer groups with strong product relationships that can unlock cross-sell opportunities.', kpi: 'Cross-sell rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ins-retail-2', label: 'Surface the customer groups driving the highest revenue per campaign', description: 'Identify which audiences are contributing the most value across campaign activity.', kpi: 'Revenue per campaign', estimatedTime: '3 min', previewLines: [] },
      { id: 'ins-retail-3', label: 'Analyze engagement timing patterns', description: 'Understand when customers are most responsive so campaigns can be timed more effectively.', kpi: 'Click-to-purchase rate', estimatedTime: '3 min', previewLines: [] },
    ],
    travel: [
      { id: 'ins-travel-1', label: 'Identify premium guest segments with highest upgrade potential', description: 'Find the guest groups most likely to respond to premium offers and upgrades.', kpi: 'Upgrade conversion rate', estimatedTime: '3 min', previewLines: [] },
      { id: 'ins-travel-2', label: 'Surface booking patterns by traveler type', description: 'Analyze how different traveler groups behave to improve strategic planning and targeting.', kpi: 'Marketing efficiency', estimatedTime: '3 min', previewLines: [] },
      { id: 'ins-travel-3', label: 'Analyze loyalty engagement patterns', description: 'Understand which loyalty engagement signals are most associated with long-term retention.', kpi: 'Retention rate', estimatedTime: '3 min', previewLines: [] },
    ],
  },
};

// Helper to get scenarios for a specific outcome + industry
export function getScenariosForOutcome(goalId: string, industryId: string): ScenarioOption[] {
  return scenarioMatrix[goalId]?.[industryId] || [];
}

// Helper to get available industries for a given outcome
export function getIndustriesForOutcome(goalId: string): IndustryOption[] {
  const allowedIds = outcomeIndustries[goalId] || [];
  return allowedIds.map(id => industries.find(i => i.id === id)).filter((i): i is IndustryOption => !!i);
}

// --- Input Steps per Scenario ---
export interface InputStep {
  id: string;
  question: string;
  subtitle?: string;
  multiSelect?: boolean;
  options: InputOption[];
}

export interface InputOption {
  id: string;
  label: string;
  description?: string;
}

// Scenario A: Campaign Brief
export const campaignBriefSteps: InputStep[] = [
  {
    id: 'objective',
    question: 'What is your campaign objective?',
    subtitle: 'Choose the primary goal for this campaign.',
    options: [
      { id: 'repeat-purchase', label: 'Drive repeat purchase', description: 'Re-engage existing customers for additional purchases' },
      { id: 'conversion', label: 'Increase conversion', description: 'Turn more prospects into paying customers' },
      { id: 'reactivate', label: 'Reactivate dormant customers', description: 'Win back customers who haven\'t purchased recently' },
      { id: 'seasonal', label: 'Launch a seasonal promotion', description: 'Capitalize on seasonal demand with a targeted push' },
      { id: 'loyalty', label: 'Increase loyalty engagement', description: 'Deepen participation in loyalty programs' },
    ],
  },
  {
    id: 'audience',
    question: 'Who is your target audience?',
    subtitle: 'Select the customer segment to focus on.',
    options: [], // populated per industry
  },
  {
    id: 'channels',
    question: 'Which channels would you like to activate?',
    subtitle: 'Select all that apply.',
    multiSelect: true,
    options: [
      { id: 'email', label: 'Email' },
      { id: 'paid-social', label: 'Paid social' },
      { id: 'sms', label: 'SMS' },
      { id: 'web-personalization', label: 'Web personalization' },
      { id: 'mobile-push', label: 'Mobile push' },
    ],
  },
  {
    id: 'priority',
    question: 'What is your key business priority?',
    subtitle: 'This shapes the strategy and trade-offs.',
    options: [
      { id: 'speed', label: 'Maximize speed', description: 'Get to market as fast as possible' },
      { id: 'roi', label: 'Improve ROI', description: 'Optimize for return on investment' },
      { id: 'acquisition-cost', label: 'Lower acquisition cost', description: 'Reduce cost per acquired customer' },
      { id: 'retention', label: 'Focus on retention', description: 'Prioritize keeping existing customers' },
      { id: 'simplicity', label: 'Minimize complexity', description: 'Keep campaign execution simple and manageable' },
    ],
  },
  {
    id: 'kpi',
    question: 'What is your primary success KPI?',
    subtitle: 'How will you measure success?',
    options: [
      { id: 'conversion-rate', label: 'Conversion rate' },
      { id: 'revenue-per-customer', label: 'Revenue per customer' },
      { id: 'repeat-purchase-rate', label: 'Repeat purchase rate' },
      { id: 'roas', label: 'ROAS' },
      { id: 'engagement-rate', label: 'Engagement rate' },
    ],
  },
];

// Scenario B: Customer Segments
export const customerSegmentSteps: InputStep[] = [
  {
    id: 'objective',
    question: 'What is your business objective?',
    subtitle: 'Choose what you want segment insights to drive.',
    options: [
      { id: 'repeat-purchase', label: 'Grow repeat purchase' },
      { id: 'retention', label: 'Improve retention' },
      { id: 'churn', label: 'Reduce churn' },
      { id: 'cross-sell', label: 'Increase cross-sell' },
      { id: 'paid-efficiency', label: 'Improve paid media efficiency' },
    ],
  },
  {
    id: 'segment-lens',
    question: 'How should we analyze your customers?',
    subtitle: 'Choose the lens for segmentation.',
    options: [
      { id: 'value', label: 'Value-based', description: 'Segment by revenue contribution and lifetime value' },
      { id: 'lifecycle', label: 'Lifecycle-based', description: 'Segment by where customers are in their journey' },
      { id: 'behavioral', label: 'Behavioral', description: 'Segment by browsing, purchase, and engagement patterns' },
      { id: 'channel', label: 'Channel engagement', description: 'Segment by preferred communication channels' },
      { id: 'promotion', label: 'Promotion sensitivity', description: 'Segment by responsiveness to discounts and offers' },
    ],
  },
  {
    id: 'audience-priority',
    question: 'Which audiences should we prioritize?',
    subtitle: 'Focus the analysis on highest-impact groups.',
    options: [
      { id: 'revenue-upside', label: 'Highest revenue upside' },
      { id: 'at-risk', label: 'Most at risk' },
      { id: 'likely-engage', label: 'Most likely to engage' },
      { id: 'cross-sell-potential', label: 'Best cross-sell potential' },
    ],
  },
  {
    id: 'activation-channel',
    question: 'Where will you activate these segments?',
    subtitle: 'Choose the primary activation channel.',
    options: [
      { id: 'email', label: 'Email' },
      { id: 'paid-media', label: 'Paid media' },
      { id: 'onsite', label: 'Onsite' },
      { id: 'crm', label: 'CRM outreach' },
      { id: 'omnichannel', label: 'Omnichannel' },
    ],
  },
];

// Scenario C: Lifecycle Journey
export const lifecycleJourneySteps: InputStep[] = [
  {
    id: 'journey-goal',
    question: 'What is the journey goal?',
    subtitle: 'Choose the lifecycle stage to design for.',
    options: [
      { id: 'welcome', label: 'Welcome / onboarding', description: 'Guide new customers through their first experience' },
      { id: 'retention', label: 'Retention', description: 'Keep active customers engaged and purchasing' },
      { id: 'winback', label: 'Win-back', description: 'Re-engage customers who have gone dormant' },
      { id: 'loyalty', label: 'Loyalty growth', description: 'Deepen loyalty program participation and advocacy' },
      { id: 'cart-recovery', label: 'Cart recovery', description: 'Recover abandoned carts and incomplete purchases' },
    ],
  },
  {
    id: 'audience',
    question: 'Who is this journey for?',
    subtitle: 'Select the target audience.',
    options: [], // populated per industry
  },
  {
    id: 'channel-set',
    question: 'Which channel combination?',
    subtitle: 'Choose the channels for this journey.',
    options: [
      { id: 'email-sms', label: 'Email + SMS' },
      { id: 'email-onsite', label: 'Email + onsite' },
      { id: 'paid-email', label: 'Paid social + email' },
      { id: 'omnichannel', label: 'Omnichannel' },
    ],
  },
  {
    id: 'brand-posture',
    question: 'What is your brand posture?',
    subtitle: 'This shapes the tone and messaging style.',
    options: [
      { id: 'premium', label: 'Premium', description: 'Elevated, aspirational messaging' },
      { id: 'promotional', label: 'Promotional', description: 'Deal-driven, urgency-focused' },
      { id: 'advisory', label: 'Advisory', description: 'Helpful, educational, consultative' },
      { id: 'personalized', label: 'Personalized', description: 'Highly tailored, 1:1 messaging' },
    ],
  },
  {
    id: 'kpi',
    question: 'What is your primary success metric?',
    subtitle: 'How will you measure journey effectiveness?',
    options: [
      { id: 'engagement', label: 'Engagement' },
      { id: 'conversion', label: 'Conversion' },
      { id: 'repeat-purchase', label: 'Repeat purchase' },
      { id: 'retention', label: 'Retention' },
      { id: 'time-to-second', label: 'Time to second purchase' },
    ],
  },
];

// Scenario D: Performance Analysis
export const performanceAnalysisSteps: InputStep[] = [
  {
    id: 'performance-goal',
    question: 'What performance goal are you focused on?',
    subtitle: 'Choose the primary area to improve.',
    options: [
      { id: 'roas', label: 'Improve ROAS' },
      { id: 'conversion', label: 'Improve conversion' },
      { id: 'cac', label: 'Lower CAC' },
      { id: 'wasted-spend', label: 'Reduce wasted spend' },
      { id: 'retention-results', label: 'Improve retention results' },
    ],
  },
  {
    id: 'problem-area',
    question: 'Where do you suspect the issue?',
    subtitle: 'Identify the likely problem area.',
    options: [
      { id: 'audience-targeting', label: 'Audience targeting', description: 'Wrong audiences or poor segmentation' },
      { id: 'channel-mix', label: 'Channel mix', description: 'Budget misallocated across channels' },
      { id: 'messaging', label: 'Messaging', description: 'Creative or messaging not resonating' },
      { id: 'frequency-fatigue', label: 'Frequency fatigue', description: 'Over-messaging or ad fatigue' },
      { id: 'funnel-dropoff', label: 'Funnel dropoff', description: 'Losing customers at key conversion points' },
    ],
  },
  {
    id: 'constraint',
    question: 'What is your budget constraint?',
    subtitle: 'This shapes the optimization approach.',
    options: [
      { id: 'reduce-spend', label: 'Reduce spend' },
      { id: 'keep-flat', label: 'Keep spend flat' },
      { id: 'scale-efficiently', label: 'Scale efficiently' },
      { id: 'improve-measurement', label: 'Improve measurement confidence' },
    ],
  },
  {
    id: 'output-focus',
    question: 'What output would be most useful?',
    subtitle: 'Choose the primary deliverable.',
    options: [
      { id: 'diagnosis', label: 'Diagnosis summary', description: 'Understand what\'s happening and why' },
      { id: 'actions', label: 'Recommended actions', description: 'Get specific things to do next' },
      { id: 'segment-opportunities', label: 'Segment opportunities', description: 'Find untapped audience potential' },
      { id: 'channel-optimization', label: 'Channel optimization plan', description: 'Rebalance channel investment' },
    ],
  },
];

// --- Industry-specific audience options ---
export const industryAudiences: Record<string, InputOption[]> = {
  retail: [
    { id: 'high-value-repeat', label: 'High-value repeat customers', description: 'Top spenders with 3+ purchases' },
    { id: 'new-customers', label: 'New customers', description: 'First-time buyers in the last 30 days' },
    { id: 'cart-abandoners', label: 'Cart abandoners', description: 'Added items but didn\'t complete purchase' },
    { id: 'lapsed-customers', label: 'Lapsed customers', description: 'No purchase in 90+ days' },
    { id: 'discount-sensitive', label: 'Discount-sensitive shoppers', description: 'Primarily purchase during sales events' },
  ],
  travel: [
    { id: 'frequent-travelers', label: 'Frequent travelers', description: '4+ trips per year' },
    { id: 'business-travelers', label: 'Business travelers', description: 'Corporate and business travel bookers' },
    { id: 'leisure-seekers', label: 'Leisure seekers', description: 'Vacation and experience-focused travelers' },
    { id: 'loyalty-members', label: 'Loyalty members', description: 'Enrolled in rewards or loyalty programs' },
    { id: 'lapsed-bookers', label: 'Lapsed bookers', description: 'No booking in 6+ months' },
  ],
  cpg: [
    { id: 'brand-loyalists', label: 'Brand loyalists', description: 'Consistent purchasers of your brand' },
    { id: 'deal-seekers', label: 'Deal seekers', description: 'Price-sensitive, promotion-driven buyers' },
    { id: 'new-to-category', label: 'New-to-category', description: 'First-time buyers in the category' },
    { id: 'lapsed-buyers', label: 'Lapsed buyers', description: 'Stopped purchasing in the last quarter' },
    { id: 'cross-category', label: 'Cross-category shoppers', description: 'Buy across multiple product categories' },
  ],
};

// --- Scenario step registry ---
export function getScenarioSteps(scenarioId: string, industryId: string): InputStep[] {
  let steps: InputStep[];
  switch (scenarioId) {
    case 'campaign-brief': steps = campaignBriefSteps.map(s => ({ ...s, options: [...s.options] })); break;
    case 'customer-segments': steps = customerSegmentSteps.map(s => ({ ...s, options: [...s.options] })); break;
    case 'lifecycle-journey': steps = lifecycleJourneySteps.map(s => ({ ...s, options: [...s.options] })); break;
    case 'performance-analysis': steps = performanceAnalysisSteps.map(s => ({ ...s, options: [...s.options] })); break;
    default: return [];
  }

  // Inject industry-specific audiences where needed
  const audiences = industryAudiences[industryId] || industryAudiences['retail'];
  return steps.map(step => {
    if (step.id === 'audience' && step.options.length === 0) {
      return { ...step, options: audiences };
    }
    return step;
  });
}

// --- Generation steps ---
export const generationSteps = [
  'Analyzing selected business goal',
  'Matching audience patterns from sample data',
  'Recommending channels and priorities',
  'Building strategy summary',
  'Preparing action plan',
];

// --- Default inputs per scenario + industry (for fast first generation) ---
export function getDefaultInputs(scenarioId: string, industryId: string): Record<string, string | string[]> {
  const audienceDefaults: Record<string, string> = {
    retail: 'high-value-repeat',
    travel: 'frequent-travelers',
    cpg: 'brand-loyalists',
  };

  switch (scenarioId) {
    case 'campaign-brief':
      return {
        objective: 'repeat-purchase',
        audience: audienceDefaults[industryId] || 'high-value-repeat',
        channels: ['email', 'paid-social'],
        priority: 'roi',
        kpi: 'conversion-rate',
      };
    case 'customer-segments':
      return {
        objective: 'retention',
        'segment-lens': 'value',
        'audience-priority': 'revenue-upside',
        'activation-channel': 'email',
      };
    case 'lifecycle-journey':
      return {
        'journey-goal': 'retention',
        audience: audienceDefaults[industryId] || 'high-value-repeat',
        'channel-set': 'email-sms',
        'brand-posture': 'personalized',
        kpi: 'retention',
      };
    case 'performance-analysis':
      return {
        'performance-goal': 'roas',
        'problem-area': 'audience-targeting',
        constraint: 'scale-efficiently',
        'output-focus': 'actions',
      };
    default:
      return {};
  }
}

// --- Refinement chips (post-output) ---
export interface RefinementChip {
  id: string;
  label: string;
  inputKey: string;
  inputValue: string;
}

export function getRefinementChips(scenarioId: string, industryId: string): RefinementChip[] {
  const audiences = industryAudiences[industryId] || industryAudiences['retail'];

  const common: RefinementChip[] = [
    ...audiences.slice(0, 3).map(a => ({ id: `aud-${a.id}`, label: `Target ${a.label.toLowerCase()}`, inputKey: 'audience', inputValue: a.id })),
    { id: 'ch-email', label: 'Add email', inputKey: 'channels', inputValue: 'email' },
    { id: 'ch-sms', label: 'Add SMS', inputKey: 'channels', inputValue: 'sms' },
    { id: 'ch-paid', label: 'Add paid social', inputKey: 'channels', inputValue: 'paid-social' },
    { id: 'ch-push', label: 'Add mobile push', inputKey: 'channels', inputValue: 'mobile-push' },
  ];

  switch (scenarioId) {
    case 'campaign-brief':
      return [
        { id: 'obj-reactivate', label: 'Reactivate dormant customers', inputKey: 'objective', inputValue: 'reactivate' },
        { id: 'obj-loyalty', label: 'Focus on loyalty', inputKey: 'objective', inputValue: 'loyalty' },
        { id: 'obj-conversion', label: 'Increase conversion', inputKey: 'objective', inputValue: 'conversion' },
        ...common,
        { id: 'pri-speed', label: 'Maximize speed', inputKey: 'priority', inputValue: 'speed' },
        { id: 'pri-retention', label: 'Focus on retention', inputKey: 'priority', inputValue: 'retention' },
        { id: 'kpi-roas', label: 'Optimize for ROAS', inputKey: 'kpi', inputValue: 'roas' },
        { id: 'kpi-engagement', label: 'Optimize for engagement', inputKey: 'kpi', inputValue: 'engagement-rate' },
      ];
    case 'customer-segments':
      return [
        { id: 'lens-lifecycle', label: 'Lifecycle-based segments', inputKey: 'segment-lens', inputValue: 'lifecycle' },
        { id: 'lens-behavioral', label: 'Behavioral segments', inputKey: 'segment-lens', inputValue: 'behavioral' },
        { id: 'lens-promo', label: 'Promotion sensitivity', inputKey: 'segment-lens', inputValue: 'promotion' },
        { id: 'pri-atrisk', label: 'Prioritize at-risk', inputKey: 'audience-priority', inputValue: 'at-risk' },
        { id: 'pri-engage', label: 'Most likely to engage', inputKey: 'audience-priority', inputValue: 'likely-engage' },
        { id: 'act-paid', label: 'Activate via paid media', inputKey: 'activation-channel', inputValue: 'paid-media' },
        { id: 'act-omni', label: 'Go omnichannel', inputKey: 'activation-channel', inputValue: 'omnichannel' },
      ];
    case 'lifecycle-journey':
      return [
        { id: 'jg-welcome', label: 'Switch to welcome flow', inputKey: 'journey-goal', inputValue: 'welcome' },
        { id: 'jg-winback', label: 'Switch to win-back', inputKey: 'journey-goal', inputValue: 'winback' },
        { id: 'jg-cart', label: 'Cart recovery flow', inputKey: 'journey-goal', inputValue: 'cart-recovery' },
        { id: 'tone-premium', label: 'Premium tone', inputKey: 'brand-posture', inputValue: 'premium' },
        { id: 'tone-promo', label: 'Promotional tone', inputKey: 'brand-posture', inputValue: 'promotional' },
        { id: 'cs-omni', label: 'Omnichannel', inputKey: 'channel-set', inputValue: 'omnichannel' },
        { id: 'cs-paid', label: 'Paid social + email', inputKey: 'channel-set', inputValue: 'paid-email' },
      ];
    case 'performance-analysis':
      return [
        { id: 'pg-conversion', label: 'Improve conversion', inputKey: 'performance-goal', inputValue: 'conversion' },
        { id: 'pg-cac', label: 'Lower CAC', inputKey: 'performance-goal', inputValue: 'cac' },
        { id: 'pa-channel', label: 'Focus on channel mix', inputKey: 'problem-area', inputValue: 'channel-mix' },
        { id: 'pa-messaging', label: 'Focus on messaging', inputKey: 'problem-area', inputValue: 'messaging' },
        { id: 'pa-fatigue', label: 'Address frequency fatigue', inputKey: 'problem-area', inputValue: 'frequency-fatigue' },
        { id: 'con-reduce', label: 'Reduce spend', inputKey: 'constraint', inputValue: 'reduce-spend' },
        { id: 'of-diagnosis', label: 'Show diagnosis', inputKey: 'output-focus', inputValue: 'diagnosis' },
      ];
    default:
      return [];
  }
}

// --- Faster generation steps for refinement ---
export const refinementGenerationSteps = [
  'Adjusting recommendations',
  'Updating strategy',
  'Preparing revised output',
];

// --- Preview card data ---
export interface PreviewCard {
  id: string;
  label: string;
  lines: string[];
}

export const previewCards: PreviewCard[] = [
  { id: 'brief', label: 'Campaign Brief', lines: ['Executive summary', 'Target audience', 'Channel strategy', 'KPI framework'] },
  { id: 'segments', label: 'Segment Discovery', lines: ['3 high-value segments', 'Activation tactics', 'Revenue opportunity'] },
  { id: 'journey', label: 'Lifecycle Journey', lines: ['5-step journey flow', 'Trigger logic', 'Channel orchestration'] },
  { id: 'performance', label: 'Performance Insight', lines: ['Diagnosis summary', 'Root causes', 'Optimization actions'] },
];
