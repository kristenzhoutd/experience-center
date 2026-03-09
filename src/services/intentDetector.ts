/**
 * Intent Detector — classifies user messages into actionable intents.
 *
 * Uses keyword/pattern matching to determine whether a message is a
 * campaign brief request, a general question, or something else.
 * Returns a structured intent result used by the orchestrator to
 * route into the appropriate mode.
 */

export type IntentType = 'campaign_brief' | 'general_chat';

export interface IntentResult {
  intent: IntentType;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  matchedPatterns: string[];
}

// ── Campaign-brief trigger patterns ────────────────────────────────

const CAMPAIGN_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  // Direct campaign creation verbs
  { pattern: /\b(create|build|make|set\s*up|launch|design|prepare|draft|plan)\b.*\b(campaign|personalization|promotion|sale)\b/i, label: 'campaign-creation-verb', weight: 3 },
  { pattern: /\b(campaign|personalization|promotion)\b.*\b(for|targeting|with|using)\b/i, label: 'campaign-with-context', weight: 3 },

  // Seasonal / event campaigns
  { pattern: /\b(black\s*friday|cyber\s*monday|summer\s*sale|winter\s*sale|spring\s*sale|holiday|flash\s*sale|back\s*to\s*school|valentine|easter|halloween|new\s*year|clearance|labor\s*day|memorial\s*day|prime\s*day|boxing\s*day)\b/i, label: 'seasonal-event', weight: 2 },

  // Audience targeting
  { pattern: /\b(target|targeting|audience|segment|visitors|customers|shoppers|members)\b/i, label: 'audience-targeting', weight: 1 },

  // Offer/discount language
  { pattern: /\b(\d+\s*%\s*off|\$\d+\s*off|discount|coupon|promo|bogo|free\s*shipping|offer)\b/i, label: 'offer-language', weight: 1 },

  // KPI/goal language
  { pattern: /\b(conversion|engagement|retention|revenue|aov|kpi|goal|metric|improve|increase|boost|maximize)\b/i, label: 'goal-language', weight: 1 },

  // Brief-specific
  { pattern: /\b(brief|strategy|plan)\b/i, label: 'brief-keyword', weight: 2 },

  // Channel language
  { pattern: /\b(email|sms|push\s*notif|web\s*personali|banner|hero|landing\s*page)\b/i, label: 'channel-language', weight: 1 },

  // Experience / content language
  { pattern: /\b(personalize|personalized|experience|content\s*variant|a\/?b\s*test|headline|cta)\b/i, label: 'experience-language', weight: 1 },
];

// Minimum weighted score to classify as campaign_brief
const HIGH_THRESHOLD = 4;
const MEDIUM_THRESHOLD = 2;

/**
 * Classify the user message intent.
 */
export function detectIntent(message: string): IntentResult {
  const matched: string[] = [];
  let score = 0;

  for (const { pattern, label, weight } of CAMPAIGN_PATTERNS) {
    if (pattern.test(message)) {
      matched.push(label);
      score += weight;
    }
  }

  if (score >= HIGH_THRESHOLD) {
    return {
      intent: 'campaign_brief',
      confidence: 'high',
      reason: `Matched ${matched.length} campaign patterns (score ${score})`,
      matchedPatterns: matched,
    };
  }

  if (score >= MEDIUM_THRESHOLD) {
    return {
      intent: 'campaign_brief',
      confidence: 'medium',
      reason: `Matched ${matched.length} campaign patterns (score ${score}) — proceeding with draft brief`,
      matchedPatterns: matched,
    };
  }

  return {
    intent: 'general_chat',
    confidence: score > 0 ? 'low' : 'high',
    reason: score > 0
      ? `Weak campaign signals (score ${score}) — treating as general chat`
      : 'No campaign patterns detected',
    matchedPatterns: matched,
  };
}
