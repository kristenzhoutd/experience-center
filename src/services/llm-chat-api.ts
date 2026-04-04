/**
 * llm-api Chat API client — creates chat sessions with AI agents
 * that have PlazmaQueryTool enabled to run Trino queries.
 */

import { storage } from '../utils/storage';

const LLM_API_BASE = 'https://llm-api.us01.treasuredata.com';
const AGENT_ID = '019d4bda-cc70-7487-ad61-2876eed21ed0';

function getApiKey(): string {
  return storage.getItem('ai-suites-api-key') || import.meta.env.VITE_SANDBOX_API_KEY || '';
}

/**
 * Create a chat session with the data-fetcher agent.
 */
async function createChat(apiKey: string): Promise<string> {
  const response = await fetch(`${LLM_API_BASE}/api/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `TD1 ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'chats',
        attributes: {
          agentId: AGENT_ID,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Chat creation failed (HTTP ${response.status}): ${body.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.data.id;
}

/**
 * Send a message to a chat and collect the full streamed response.
 */
async function sendMessage(chatId: string, input: string, apiKey: string): Promise<string> {
  const response = await fetch(`${LLM_API_BASE}/api/chats/${chatId}/continue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `TD1 ${apiKey}`,
    },
    body: JSON.stringify({ input }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Chat continue failed (HTTP ${response.status}): ${body.substring(0, 200)}`);
  }

  // Read SSE stream and concatenate content
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.substring(6));
        if (event.content) {
          fullContent += event.content;
        }
      } catch { /* skip non-JSON lines */ }
    }
  }

  return fullContent;
}

/**
 * Extract JSON from a response that may contain markdown fences and surrounding text.
 */
function extractJson(text: string): Record<string, unknown> | null {
  // Try markdown fence (```json or ``` without language)
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fall through */ }
  }

  // Try to find the outermost JSON object in the text
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.substring(braceStart, braceEnd + 1)); } catch { /* fall through */ }
  }

  return null;
}

export interface RetailMetrics {
  totalCustomers: number;
  avgClv: number;
  loyaltyTierCounts: Record<string, number>;
  avgOrderValue: { online: number; instore: number; combined: number };
  churnRiskDistribution: Record<string, number>;
  repeatPurchaseRate: number;
}

/**
 * Fetch live retail metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchRetailMetrics(): Promise<{ success: boolean; data?: RetailMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session...');
    const chatId = await createChat(apiKey);
    console.log('[llm-chat-api] Chat created:', chatId);

    const query = 'Join master_customers with rfm_scores, loyalty_members, online_orders, and instore_transactions in the retail_demo database. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_customers (count), avg_clv (avg predicted CLV), ' +
      'loyalty_tier_counts (object with tier name keys and count values), ' +
      'avg_order_value (object with online, instore, combined keys), ' +
      'churn_risk_distribution (object with Low/Medium/High keys and count values), ' +
      'repeat_purchase_rate (decimal between 0-1). ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      // Agent may need a follow-up to return clean JSON
      console.warn('[llm-chat-api] First response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] Retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] Retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: RetailMetrics = {
      totalCustomers: Number(parsed.total_customers) || 1000,
      avgClv: Number(parsed.avg_clv) || 0,
      loyaltyTierCounts: (parsed.loyalty_tier_counts as Record<string, number>) || {},
      avgOrderValue: {
        online: Number((parsed.avg_order_value as any)?.online) || 0,
        instore: Number((parsed.avg_order_value as any)?.instore || (parsed.avg_order_value as any)?.in_store) || 0,
        combined: Number((parsed.avg_order_value as any)?.combined) || 0,
      },
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      repeatPurchaseRate: Number(parsed.repeat_purchase_rate) || 0,
    };

    console.log('[llm-chat-api] Metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch metrics:', message);
    return { success: false, error: message };
  }
}

export interface TravelMetrics {
  totalGuests: number;
  avgBookingValue: number;
  rebookingRate: number;
  loyaltyTierCounts: Record<string, number>;
  cabinPreferences: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  emailOpenRate: number;
  emailClickRate: number;
  avgAncillarySpend: number;
  ancillaryAttachRate: number;
  avgReviewRating: number;
  bookingCompletionRate: number;
  cancellationRate: number;
}

/**
 * Fetch live travel metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchTravelMetrics(): Promise<{ success: boolean; data?: TravelMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for travel metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the travel_demo database. ' +
      'From master_customers: count total guests, count by loyalty_tier, count by preferred_cabin, count by churn_risk. ' +
      'From bookings: average amount, rebooking rate (customers with more than 1 booking / total unique bookers), count by booking_status as percentages. ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From ancillary_purchases: average amount, attach rate (unique purchasers / total guests). ' +
      'From reviews: average rating. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_guests, avg_booking_value, rebooking_rate (decimal 0-1), ' +
      'loyalty_tier_counts (object), cabin_preferences (object), churn_risk_distribution (object), ' +
      'email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'avg_ancillary_spend, ancillary_attach_rate (decimal 0-1), avg_review_rating, ' +
      'booking_completion_rate (decimal 0-1), cancellation_rate (decimal 0-1). ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending travel query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Travel response received, parsing...');

    const parsed = extractJson(response);
    if (!parsed) {
      return { success: false, error: 'Could not parse JSON from agent response' };
    }

    const metrics: TravelMetrics = {
      totalGuests: Number(parsed.total_guests) || 1000,
      avgBookingValue: Number(parsed.avg_booking_value) || 0,
      rebookingRate: Number(parsed.rebooking_rate) || 0,
      loyaltyTierCounts: (parsed.loyalty_tier_counts as Record<string, number>) || {},
      cabinPreferences: (parsed.cabin_preferences as Record<string, number>) || {},
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      avgAncillarySpend: Number(parsed.avg_ancillary_spend) || 0,
      ancillaryAttachRate: Number(parsed.ancillary_attach_rate) || 0,
      avgReviewRating: Number(parsed.avg_review_rating) || 0,
      bookingCompletionRate: Number(parsed.booking_completion_rate) || 0,
      cancellationRate: Number(parsed.cancellation_rate) || 0,
    };

    console.log('[llm-chat-api] Travel metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch travel metrics:', message);
    return { success: false, error: message };
  }
}

export interface CpgMetrics {
  totalHouseholds: number;
  avgBasketSize: number;
  avgPurchaseAmount: number;
  activeBuyers: number;
  buyerPenetration: number;
  brandLoyaltyDistribution: Record<string, number>;
  priceSensitivityDistribution: Record<string, number>;
  promoRate: number;
  couponRedemptionRate: number;
  avgDiscount: number;
  emailOpenRate: number;
  emailClickRate: number;
  lapsedRate: number;
  avgCSAT: number;
}

/**
 * Fetch live CPG metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchCpgMetrics(): Promise<{ success: boolean; data?: CpgMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for CPG metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the cpg_demo database. ' +
      'From master_customers: count total households, average avg_basket_size, count by brand_loyalty, count by price_sensitivity, percentage where lapsed is Yes. ' +
      'From purchases: average amount, count distinct buyers, percentage where on_promotion is Yes. ' +
      'From coupon_redemptions: redemption rate (redeemed Yes count / total count), average discount_amount. ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From support_tickets: average csat_score. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_households, avg_basket_size, avg_purchase_amount, active_buyers, ' +
      'buyer_penetration (active_buyers/total_households as decimal 0-1), ' +
      'brand_loyalty_distribution (object with High/Medium/Low/Switcher keys and counts), ' +
      'price_sensitivity_distribution (object with Low/Medium/High keys and counts), ' +
      'promo_rate (decimal 0-1), coupon_redemption_rate (decimal 0-1), avg_discount, ' +
      'email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'lapsed_rate (decimal 0-1), avg_csat. ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending CPG query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] CPG response received, parsing...');

    const parsed = extractJson(response);
    if (!parsed) {
      return { success: false, error: 'Could not parse JSON from agent response' };
    }

    const metrics: CpgMetrics = {
      totalHouseholds: Number(parsed.total_households) || 1000,
      avgBasketSize: Number(parsed.avg_basket_size) || 0,
      avgPurchaseAmount: Number(parsed.avg_purchase_amount) || 0,
      activeBuyers: Number(parsed.active_buyers) || 0,
      buyerPenetration: Number(parsed.buyer_penetration) || 0,
      brandLoyaltyDistribution: (parsed.brand_loyalty_distribution as Record<string, number>) || {},
      priceSensitivityDistribution: (parsed.price_sensitivity_distribution as Record<string, number>) || {},
      promoRate: Number(parsed.promo_rate) || 0,
      couponRedemptionRate: Number(parsed.coupon_redemption_rate) || 0,
      avgDiscount: Number(parsed.avg_discount) || 0,
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      lapsedRate: Number(parsed.lapsed_rate) || 0,
      avgCSAT: Number(parsed.avg_csat) || 0,
    };

    console.log('[llm-chat-api] CPG metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch CPG metrics:', message);
    return { success: false, error: message };
  }
}
