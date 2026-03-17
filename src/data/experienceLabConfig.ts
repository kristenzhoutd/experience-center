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
  { id: 'revenue', label: 'Increase revenue', description: 'Drive more revenue through smarter targeting, personalization, and customer lifecycle optimization.', icon: 'trending-up' },
  { id: 'campaign-performance', label: 'Improve campaign performance', description: 'Get better results from every campaign through AI-powered audience, channel, and message optimization.', icon: 'bar-chart' },
  { id: 'efficiency', label: 'Increase marketing efficiency', description: 'Do more with less by automating insights, reducing manual work, and accelerating time-to-action.', icon: 'zap' },
  { id: 'engagement', label: 'Improve customer engagement', description: 'Build deeper relationships through relevant, timely, and personalized customer experiences.', icon: 'heart' },
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
  { id: 'travel', label: 'Travel & Hospitality', description: 'Airlines, hotels, OTAs, and travel experience providers', icon: 'plane', enabled: true },
  { id: 'cpg', label: 'CPG', description: 'Consumer packaged goods, FMCG, and consumer brands', icon: 'package', enabled: true },
  { id: 'automotive', label: 'Automotive', description: 'Auto manufacturers, dealers, and mobility services', icon: 'car', enabled: false },
  { id: 'media', label: 'Media & Entertainment', description: 'Streaming, publishing, and content platforms', icon: 'film', enabled: false },
  { id: 'financial', label: 'Financial Services', description: 'Banking, insurance, fintech, and wealth management', icon: 'landmark', enabled: false },
];

// --- Scenarios (Screen 3) ---
export interface ScenarioOption {
  id: string;
  label: string;
  description: string;
  estimatedTime: string;
  badge?: string;
  previewLines: string[];
}

export const scenarios: ScenarioOption[] = [
  {
    id: 'campaign-brief',
    label: 'Generate a campaign brief',
    description: 'Create a strategic campaign plan with audience, channels, messaging direction, and KPI focus.',
    estimatedTime: '3 min',
    badge: 'Most popular',
    previewLines: ['Executive summary', 'Audience strategy', 'Channel plan', 'KPI framework'],
  },
  {
    id: 'customer-segments',
    label: 'Discover customer segments',
    description: 'Identify high-potential customer groups and suggested activation strategies.',
    estimatedTime: '3 min',
    previewLines: ['Segment profiles', 'Opportunity scoring', 'Activation tactics', 'Sizing estimates'],
  },
  {
    id: 'lifecycle-journey',
    label: 'Build a lifecycle journey',
    description: 'Generate a draft multi-step customer journey for acquisition, retention, or reactivation.',
    estimatedTime: '4 min',
    previewLines: ['Journey stages', 'Trigger logic', 'Channel orchestration', 'Success metrics'],
  },
  {
    id: 'performance-analysis',
    label: 'Analyze marketing performance',
    description: 'Review sample performance signals and generate AI recommendations for improvement.',
    estimatedTime: '3 min',
    previewLines: ['Performance diagnosis', 'Root cause analysis', 'Optimization actions', 'Impact forecast'],
  },
];

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
