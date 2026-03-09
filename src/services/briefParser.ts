/**
 * Brief Parser — demo-mode AI parsing of user messages into structured brief sections.
 * Reuses keyword-matching patterns from generateCampaignDraft() in chatStore.ts.
 */

import type {
  BriefSections,
  BriefSectionBase,
  BriefOverviewSection,
  BriefAudienceSection,
  BriefExperienceSection,
  BriefMeasurementSection,
  CampaignMessage,
  SegmentMessages,
  RecommendedAudience,
  SpotCreative,
} from '../types/brief';
import { usePageStore } from '../stores/pageStore';

export interface ParsedBrief {
  sections: BriefSections;
  name: string;
  thinkingSteps: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Returns false if the section is locked or the field was user-edited,
 * meaning AI should NOT overwrite this field.
 */
function shouldFillField(
  existingSection: BriefSectionBase | undefined,
  fieldName: string
): boolean {
  if (!existingSection) return true;
  if (existingSection.locked) return false;
  if (existingSection.userEditedFields?.includes(fieldName)) return false;
  return true;
}

function keepOrFill<T>(
  existingSection: BriefSectionBase | undefined,
  fieldName: string,
  existingValue: T | undefined,
  newValue: T
): T {
  if (!shouldFillField(existingSection, fieldName)) return existingValue as T;
  return newValue;
}

// ── Campaign name extraction ────────────────────────────────────────

const campaignKeywords = [
  'black friday', 'cyber monday', 'summer sale', 'winter sale', 'spring sale',
  'back to school', 'holiday', 'flash sale', 'clearance', 'labor day',
  'memorial day', 'new year', 'valentine', 'easter', 'halloween',
  'prime day', 'boxing day',
];

function extractCampaignTheme(message: string): string {
  const lower = message.toLowerCase();
  for (const kw of campaignKeywords) {
    if (lower.includes(kw)) {
      return kw.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return message
    .replace(/^(build|create|make|set up|launch|design|prepare)\s+(a|an|the|my)?\s*/i, '')
    .split(/\s+/)
    .slice(0, 4)
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Audience extraction ─────────────────────────────────────────────

const audiencePatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /new\s*visitor/i, label: 'New Visitors' },
  { pattern: /first[- ]?time/i, label: 'First-Time Visitors' },
  { pattern: /returning\s*(visitor|customer|shopper)?/i, label: 'Returning Customers' },
  { pattern: /loyal\s*(customer|member|shopper)?/i, label: 'Loyal Members' },
  { pattern: /lapsed\s*(customer|buyer|shopper)?/i, label: 'Lapsed Customers' },
  { pattern: /vip/i, label: 'VIP Customers' },
  { pattern: /high[- ]?value/i, label: 'High-Value Customers' },
  { pattern: /cart\s*abandon/i, label: 'Cart Abandoners' },
  { pattern: /bargain|deal[- ]?seek/i, label: 'Bargain Seekers' },
  { pattern: /browse|window\s*shop/i, label: 'Browsers' },
];

function extractAudiences(message: string): string[] {
  const matched: string[] = [];
  for (const { pattern, label } of audiencePatterns) {
    if (pattern.test(message)) matched.push(label);
  }
  return matched.length > 0
    ? matched
    : ['New Visitors', 'Returning Customers', 'Loyal Members'];
}

// ── Duration extraction ─────────────────────────────────────────────

const durationMap: Array<{ pattern: RegExp; start: string; end: string }> = [
  { pattern: /black\s*friday/i, start: '2026-11-25', end: '2026-11-30' },
  { pattern: /cyber\s*monday/i, start: '2026-11-28', end: '2026-12-02' },
  { pattern: /summer/i, start: '2026-06-01', end: '2026-08-31' },
  { pattern: /spring/i, start: '2026-03-10', end: '2026-03-31' },
  { pattern: /winter/i, start: '2026-12-01', end: '2027-02-28' },
  { pattern: /holiday/i, start: '2026-12-01', end: '2026-12-31' },
  { pattern: /back\s*to\s*school/i, start: '2026-08-01', end: '2026-09-15' },
  { pattern: /valentine/i, start: '2026-02-01', end: '2026-02-14' },
  { pattern: /easter/i, start: '2026-03-15', end: '2026-04-05' },
  { pattern: /halloween/i, start: '2026-10-15', end: '2026-10-31' },
  { pattern: /new\s*year/i, start: '2026-12-26', end: '2027-01-05' },
  { pattern: /flash\s*sale/i, start: '2026-03-10', end: '2026-03-12' },
];

function extractTimeline(message: string): { start: string; end: string } {
  for (const { pattern, start, end } of durationMap) {
    if (pattern.test(message)) return { start, end };
  }
  return { start: '2026-03-10', end: '2026-03-31' };
}

// ── Goal / KPI extraction ───────────────────────────────────────────

function extractGoalAndKpi(message: string): { goal: string; kpi: string } {
  const lower = message.toLowerCase();
  if (/engag/i.test(lower)) return { goal: 'Boost Customer Engagement', kpi: 'Pages per Session' };
  if (/retain|retention|loyal/i.test(lower)) return { goal: 'Improve Customer Retention', kpi: 'Customer Lifetime Value (CLV)' };
  if (/revenue|aov|order\s*value/i.test(lower)) return { goal: 'Maximize Revenue', kpi: 'Revenue per Visitor (RPV)' };
  if (/awareness|brand/i.test(lower)) return { goal: 'Increase Brand Awareness', kpi: 'New Visitor Return Rate' };
  return { goal: 'Increase Conversion Rate', kpi: 'Conversion Rate (CR)' };
}

// ── Segment message templates ────────────────────────────────────────

const segmentMessageTemplates: Record<string, CampaignMessage[]> = {
  'New Visitors': [
    { headline: 'Welcome — Discover What\'s Trending', bodyMessage: 'Explore our most popular picks, handpicked for first-time shoppers like you.', ctaText: 'Start Exploring' },
    { headline: 'New Here? Here\'s 10% Off', bodyMessage: 'Sign up today and enjoy an exclusive welcome discount on your first order.', ctaText: 'Claim Offer' },
  ],
  'First-Time Visitors': [
    { headline: 'Your First Visit Deserves a Reward', bodyMessage: 'Browse our top sellers and get a special welcome offer just for you.', ctaText: 'Shop Now' },
    { headline: 'Discover Our Best Sellers', bodyMessage: 'Not sure where to start? These customer favorites are a great place to begin.', ctaText: 'See Favorites' },
  ],
  'Returning Customers': [
    { headline: 'Welcome Back — New Arrivals Await', bodyMessage: 'We\'ve added fresh picks since your last visit. See what\'s new today.', ctaText: 'See What\'s New' },
    { headline: 'We Saved Your Favorites', bodyMessage: 'Pick up where you left off with recommendations based on your browsing history.', ctaText: 'Continue Shopping' },
  ],
  'Loyal Members': [
    { headline: 'Exclusive Access for Our VIPs', bodyMessage: 'As a valued member, enjoy early access to our latest collections and deals.', ctaText: 'Shop Exclusives' },
    { headline: 'Your Loyalty Rewards Are Here', bodyMessage: 'Redeem your points and unlock members-only pricing on select items.', ctaText: 'View Rewards' },
  ],
  'Lapsed Customers': [
    { headline: 'We Miss You — Come Back & Save', bodyMessage: 'It\'s been a while! Here\'s a special offer to welcome you back.', ctaText: 'Return & Save' },
    { headline: 'A Lot Has Changed Since You Left', bodyMessage: 'Check out what\'s new and enjoy free shipping on your next order.', ctaText: 'See What\'s New' },
  ],
  'VIP Customers': [
    { headline: 'VIP Early Access Is Live', bodyMessage: 'Get first dibs on our newest collection before anyone else.', ctaText: 'Shop First' },
    { headline: 'Thank You for Being a Top Customer', bodyMessage: 'Enjoy complimentary express shipping and exclusive VIP pricing.', ctaText: 'Shop VIP Deals' },
  ],
  'High-Value Customers': [
    { headline: 'Curated Picks for Discerning Shoppers', bodyMessage: 'Premium selections chosen based on your sophisticated taste and purchase history.', ctaText: 'View Collection' },
    { headline: 'Unlock Premium Benefits', bodyMessage: 'Your spending qualifies you for our premium tier with exclusive perks.', ctaText: 'Learn More' },
  ],
  'Cart Abandoners': [
    { headline: 'You Left Something Behind', bodyMessage: 'Your cart is waiting. Complete your purchase before items sell out.', ctaText: 'Complete Purchase' },
    { headline: 'Still Thinking It Over?', bodyMessage: 'Here\'s free shipping to help you decide. Your items are reserved for a limited time.', ctaText: 'Return to Cart' },
  ],
  'Bargain Seekers': [
    { headline: 'Today\'s Best Deals — Up to 50% Off', bodyMessage: 'Score unbeatable savings on top-rated products. Limited quantities available.', ctaText: 'Shop Deals' },
    { headline: 'Flash Sale: Extra 20% Off Clearance', bodyMessage: 'Stack your savings with an extra discount on already-reduced items.', ctaText: 'Save Now' },
  ],
  'Browsers': [
    { headline: 'Find Exactly What You\'re Looking For', bodyMessage: 'Based on your browsing, we think you\'ll love these curated picks.', ctaText: 'View Picks' },
    { headline: 'Ready to Make It Yours?', bodyMessage: 'The items you\'ve been eyeing are still available. Don\'t miss out.', ctaText: 'Shop Now' },
  ],
};

function generateSegmentMessages(segments: string[], theme: string): SegmentMessages[] {
  return segments.map((segmentName) => {
    const templates = segmentMessageTemplates[segmentName];
    if (templates) {
      return { segmentName, messages: templates };
    }
    // Fallback: generate generic messages using the theme
    return {
      segmentName,
      messages: [
        { headline: `${theme || 'Exclusive'} Deals for ${segmentName}`, bodyMessage: `Personalized offers selected just for ${segmentName.toLowerCase()}.`, ctaText: 'Shop Now' },
        { headline: `${segmentName}: Your Picks Are Ready`, bodyMessage: `Discover curated recommendations tailored to your preferences.`, ctaText: 'Explore' },
      ],
    };
  });
}

// ── Audience description helpers ────────────────────────────────────

const audienceDescriptions: Record<string, string> = {
  'New Visitors': 'First-time site visitors with no purchase history',
  'First-Time Visitors': 'Users visiting the site for the very first time',
  'Returning Customers': 'Customers with 2+ purchases in the last 90 days',
  'Loyal Members': 'Loyalty program members with high repeat purchase rate',
  'Lapsed Customers': 'Previously active customers with no activity in 90+ days',
  'VIP Customers': 'Top 10% customers by lifetime revenue',
  'High-Value Customers': 'Customers with above-average order values',
  'Cart Abandoners': 'Users who added items to cart but did not complete purchase',
  'Bargain Seekers': 'Price-sensitive shoppers who primarily browse sale items',
  'Browsers': 'Users with multiple sessions but no purchase history',
};

const audienceEstimatedSizes: Record<string, string> = {
  'New Visitors': '~150K',
  'First-Time Visitors': '~150K',
  'Returning Customers': '~90K',
  'Loyal Members': '~40K',
  'Lapsed Customers': '~60K',
  'VIP Customers': '~18K',
  'High-Value Customers': '~50K',
  'Cart Abandoners': '~55K',
  'Bargain Seekers': '~45K',
  'Browsers': '~80K',
};

// ── Section builders ────────────────────────────────────────────────

function buildOverviewSection(
  message: string,
  theme: string,
  existing?: BriefOverviewSection
): BriefOverviewSection {
  const timeline = extractTimeline(message);
  const { goal } = extractGoalAndKpi(message);

  return {
    campaignName: keepOrFill(existing, 'campaignName', existing?.campaignName, `${theme} Web Personalization Campaign`),
    objective: keepOrFill(existing, 'objective', existing?.objective, `Drive personalized experiences for the ${theme || 'upcoming'} campaign period.`),
    businessGoal: keepOrFill(existing, 'businessGoal', existing?.businessGoal, goal),
    timelineStart: keepOrFill(existing, 'timelineStart', existing?.timelineStart, timeline.start),
    timelineEnd: keepOrFill(existing, 'timelineEnd', existing?.timelineEnd, timeline.end),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes,
  };
}

function buildAudienceSection(
  message: string,
  existing?: BriefAudienceSection
): BriefAudienceSection {
  const audiences = extractAudiences(message);

  const recommendedAudiences: RecommendedAudience[] = audiences.map((name) => ({
    name,
    description: audienceDescriptions[name] || `${name} segment`,
    status: 'new' as const,
    estimatedSize: audienceEstimatedSizes[name] || '~50K',
    isSelected: true,
  }));

  return {
    primaryAudience: keepOrFill(existing, 'primaryAudience', existing?.primaryAudience, audiences[0] || 'New Visitors'),
    audienceSize: keepOrFill(existing, 'audienceSize', existing?.audienceSize, ''),
    inclusionCriteria: keepOrFill(existing, 'inclusionCriteria', existing?.inclusionCriteria, audiences),
    exclusionCriteria: keepOrFill(existing, 'exclusionCriteria', existing?.exclusionCriteria, []),
    segments: keepOrFill(existing, 'segments', existing?.segments, audiences),
    recommendedAudiences: keepOrFill(existing, 'recommendedAudiences', existing?.recommendedAudiences, recommendedAudiences),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes ?? (!message.match(/audience size|reach/i) ? 'Audience size not specified' : undefined),
  };
}

// ── Spot-type-aware content defaults ─────────────────────────────────

/**
 * Normalize spot types from page-editor (uppercase: HEADING, TEXT, CTA)
 * and skill output (lowercase: headline, cta_button, hero_image) to a
 * canonical lowercase key.
 */
function normalizeSpotType(raw: string): string {
  const lower = raw.toLowerCase();
  const ALIAS: Record<string, string> = {
    heading: 'headline',
    text: 'container',
    cta: 'cta_button',
    image: 'hero_image',
    media: 'hero_image',
    list: 'container',
    form: 'custom',
    input: 'custom',
  };
  return ALIAS[lower] ?? lower;
}

/**
 * Returns a CampaignMessage with only the fields relevant to the given
 * spot type populated. Irrelevant fields are set to empty strings.
 */
export function contentForSpotTypeMessage(
  spotType: string,
  fallback?: Partial<CampaignMessage>
): CampaignMessage {
  const base: CampaignMessage = {
    headline: '',
    bodyMessage: '',
    ctaText: '',
  };

  const normalized = normalizeSpotType(spotType);

  switch (normalized) {
    case 'headline':
    case 'header_greeting':
      return { ...base, headline: fallback?.headline || '' };
    case 'cta_button':
      return { ...base, ctaText: fallback?.ctaText || '' };
    case 'hero_image':
      return {
        ...base,
        headline: fallback?.headline || '',
        bodyMessage: fallback?.bodyMessage || '',
      };
    case 'product_recommendation':
      return {
        ...base,
        headline: fallback?.headline || '',
        bodyMessage: fallback?.bodyMessage || '',
      };
    case 'testimonial':
      return {
        ...base,
        headline: fallback?.headline || '',
        bodyMessage: fallback?.bodyMessage || '',
      };
    case 'container':
      return {
        ...base,
        bodyMessage: fallback?.bodyMessage || '',
      };
    case 'navigation':
      return { ...base };
    case 'custom':
    default:
      return {
        ...base,
        headline: fallback?.headline || '',
        bodyMessage: fallback?.bodyMessage || '',
        ctaText: fallback?.ctaText || '',
      };
  }
}

/**
 * Per-spot-type default content templates. Each type gets a unique message
 * appropriate to the spot's role on the page.
 */
const SPOT_DEFAULT_CONTENT: Record<string, { headline: string; bodyMessage: string; ctaText: string }> = {
  headline:               { headline: '{theme} — Explore What\'s New',      bodyMessage: '',                                                           ctaText: '' },
  header_greeting:        { headline: 'Welcome to Your {theme} Experience', bodyMessage: '',                                                           ctaText: '' },
  cta_button:             { headline: '',                                   bodyMessage: '',                                                           ctaText: 'Shop Now' },
  hero_image:             { headline: '{theme} — Made for You',             bodyMessage: 'Discover curated picks and personalized recommendations.',   ctaText: '' },
  product_recommendation: { headline: 'Trending in {theme}',               bodyMessage: 'Hand-picked recommendations based on your preferences.',     ctaText: '' },
  testimonial:            { headline: 'What Customers Are Saying',          bodyMessage: 'See why shoppers love our {theme} collection.',              ctaText: '' },
  container:              { headline: '',                                   bodyMessage: 'Explore our latest {theme} offerings, curated just for you.', ctaText: '' },
  custom:                 { headline: '{theme} Highlights',                 bodyMessage: 'Content tailored to your interests.',                        ctaText: 'Learn More' },
};

/**
 * Generate per-spot creatives from saved pages. Returns undefined if no pages.
 */
function generateSpotCreatives(
  segments: string[],
  theme: string,
): SpotCreative[] | undefined {
  try {
    const pages = usePageStore.getState().pages;
    if (pages.length === 0) return undefined;

    const spotCreatives: SpotCreative[] = [];
    const label = theme || 'Exclusive';

    for (const page of pages) {
      const pageName = page.pageName || page.websiteUrl;
      for (const spot of page.spots || []) {
        const normalized = normalizeSpotType(spot.type);
        const template = SPOT_DEFAULT_CONTENT[normalized] || SPOT_DEFAULT_CONTENT.custom;

        // Build default content filtered by spot type, with unique messaging
        const defaultContent = contentForSpotTypeMessage(spot.type, {
          headline: template.headline.replace('{theme}', label),
          bodyMessage: template.bodyMessage.replace('{theme}', label),
          ctaText: template.ctaText,
        });

        // Build segment content with unique per-segment messaging
        const segmentContent = segments.map((segmentName) => {
          const templates = segmentMessageTemplates[segmentName];
          const msg = templates ? templates[0] : {
            headline: `${label} for ${segmentName}`,
            bodyMessage: `Personalized ${normalized === 'container' ? 'content' : 'offers'} selected for ${segmentName.toLowerCase()}.`,
            ctaText: 'Shop Now',
          };
          return {
            segmentName,
            content: contentForSpotTypeMessage(spot.type, msg),
          };
        });

        spotCreatives.push({
          spotId: spot.id,
          spotName: spot.name,
          spotType: spot.type,
          pageName,
          pageId: page.id,
          defaultContent,
          segmentContent,
        });
      }
    }

    return spotCreatives.length > 0 ? spotCreatives : undefined;
  } catch {
    return undefined;
  }
}

function buildExperienceSection(
  message: string,
  theme: string,
  segments: string[],
  existing?: BriefExperienceSection
): BriefExperienceSection {
  return {
    headline: keepOrFill(existing, 'headline', existing?.headline, `Discover ${theme || 'Exclusive'} Deals Made for You`),
    bodyMessage: keepOrFill(existing, 'bodyMessage', existing?.bodyMessage, `Personalized offers and recommendations tailored to your shopping preferences.`),
    ctaText: keepOrFill(existing, 'ctaText', existing?.ctaText, 'Shop Now'),
    placements: existing?.placements || [],
    segmentMessages: keepOrFill(existing, 'segmentMessages', existing?.segmentMessages, generateSegmentMessages(segments, theme)),
    spotCreatives: keepOrFill(existing, 'spotCreatives', existing?.spotCreatives, generateSpotCreatives(segments, theme)),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes,
  };
}

function buildMeasurementSection(
  message: string,
  existing?: BriefMeasurementSection
): BriefMeasurementSection {
  const { kpi } = extractGoalAndKpi(message);

  return {
    primaryKpi: keepOrFill(existing, 'primaryKpi', existing?.primaryKpi, kpi),
    secondaryKpis: keepOrFill(existing, 'secondaryKpis', existing?.secondaryKpis, ['Average Order Value', 'Revenue per Visitor']),
    secondaryMetrics: keepOrFill(existing, 'secondaryMetrics', existing?.secondaryMetrics, ['Bounce Rate', 'Time on Site', 'Pages per Session']),
    successCriteria: keepOrFill(existing, 'successCriteria', existing?.successCriteria, ['+15% conversion rate vs control', '+10% average order value']),
    risks: keepOrFill(existing, 'risks', existing?.risks, ['Low traffic during campaign period', 'Creative fatigue from repeated exposure']),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes,
  };
}

// ── Main parser ─────────────────────────────────────────────────────

export function parseCampaignBrief(
  userMessage: string,
  existingBrief?: { sections: BriefSections }
): ParsedBrief {
  const theme = extractCampaignTheme(userMessage);
  const existing = existingBrief?.sections;

  // Build audience first so we can pass segments to experience
  const audience = buildAudienceSection(userMessage, existing?.audience);
  const sections: BriefSections = {
    overview: buildOverviewSection(userMessage, theme, existing?.overview),
    audience,
    experience: buildExperienceSection(userMessage, theme, audience.segments, existing?.experience),
    measurement: buildMeasurementSection(userMessage, existing?.measurement),
  };

  const name = sections.overview.campaignName;
  const audiences = sections.audience.segments.join(', ');

  const thinkingSteps = [
    `Analyzing brief... identifying key themes: ${theme || 'general promotion'}`,
    `Identifying target audiences: ${audiences}`,
    `Determining campaign timeline: ${sections.overview.timelineStart} to ${sections.overview.timelineEnd}`,
    `Setting campaign goal and KPI: ${sections.overview.businessGoal} / ${sections.measurement.primaryKpi}`,
    `Building experience section`,
    `Defining measurement framework`,
    `Brief complete — review and edit as needed`,
  ];

  return { sections, name, thinkingSteps };
}
