/**
 * llm-api Chat API client — creates chat sessions with AI agents
 * that have PlazmaQueryTool enabled to run Trino queries.
 */

import { storage } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const AGENT_ID = '019d4bda-cc70-7487-ad61-2876eed21ed0';

function getApiKey(): string {
  return storage.getItem('ai-suites-api-key') || import.meta.env.VITE_SANDBOX_API_KEY || '';
}

/**
 * Create a chat session with the data-fetcher agent.
 * Routes through /api/chat/create proxy to avoid CORS.
 */
async function createChat(apiKey: string): Promise<string> {
  const response = await fetch(`${API_BASE}/chat/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'x-api-key': apiKey,
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
  const response = await fetch(`${API_BASE}/chat/${chatId}/continue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
    console.log('[llm-chat-api] Travel response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] Travel first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] Travel retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] Travel retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
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
    console.log('[llm-chat-api] CPG response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] CPG first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] CPG retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] CPG retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
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

export interface AutomotiveMetrics {
  totalOwners: number;
  vehicleSegmentDistribution: Record<string, number>;
  ownershipStatusDistribution: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  avgServiceVisitValue: number;
  serviceRetentionRate: number;
  testDriveConversionRate: number;
  emailOpenRate: number;
  emailClickRate: number;
  avgPartsOrderValue: number;
}

/**
 * Fetch live automotive metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchAutomotiveMetrics(): Promise<{ success: boolean; data?: AutomotiveMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for automotive metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the automotive_demo database. ' +
      'From master_customers: count total, count by vehicle_segment, count by ownership_status, count by churn_risk. ' +
      'From service_appointments: average amount, count distinct customers / total owners as service_retention_rate. ' +
      'From test_drives: count where outcome is Purchased / total test drives as test_drive_conversion_rate. ' +
      'From email_events: open rate (Opened/Sent), click rate (Clicked/Sent). ' +
      'From parts_orders: average amount. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_owners, vehicle_segment_distribution (object), ownership_status_distribution (object), ' +
      'churn_risk_distribution (object), avg_service_visit_value, service_retention_rate (decimal 0-1), ' +
      'test_drive_conversion_rate (decimal 0-1), email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'avg_parts_order_value. ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending automotive query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Automotive response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] Automotive first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] Automotive retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] Automotive retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: AutomotiveMetrics = {
      totalOwners: Number(parsed.total_owners) || 1000,
      vehicleSegmentDistribution: (parsed.vehicle_segment_distribution as Record<string, number>) || {},
      ownershipStatusDistribution: (parsed.ownership_status_distribution as Record<string, number>) || {},
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      avgServiceVisitValue: Number(parsed.avg_service_visit_value) || 0,
      serviceRetentionRate: Number(parsed.service_retention_rate) || 0,
      testDriveConversionRate: Number(parsed.test_drive_conversion_rate) || 0,
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      avgPartsOrderValue: Number(parsed.avg_parts_order_value) || 0,
    };

    console.log('[llm-chat-api] Automotive metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch automotive metrics:', message);
    return { success: false, error: message };
  }
}

export interface MediaMetrics {
  totalSubscribers: number;
  subscriptionPlanDistribution: Record<string, number>;
  subscriptionStatusDistribution: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  avgContentPlaysPerUser: number;
  avgSessionDuration: number;
  premiumUpgradeRate: number;
  emailOpenRate: number;
  emailClickRate: number;
  avgAdRevenue: number;
  avgRating: number;
}

/**
 * Fetch live media metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchMediaMetrics(): Promise<{ success: boolean; data?: MediaMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for media metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the media_demo database. ' +
      'From master_customers: count total subscribers, count by subscription_plan, count by subscription_status, count by churn_risk. ' +
      'From content_plays: average plays per user, average session_duration. ' +
      'From subscriptions: premium upgrade rate (upgraded count / total count as decimal 0-1). ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From ad_impressions: average revenue. ' +
      'From reviews: average rating. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_subscribers, subscription_plan_distribution (object), subscription_status_distribution (object), ' +
      'churn_risk_distribution (object), avg_content_plays_per_user, avg_session_duration, ' +
      'premium_upgrade_rate (decimal 0-1), email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'avg_ad_revenue, avg_rating. ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending media query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Media response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] Media first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] Media retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] Media retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: MediaMetrics = {
      totalSubscribers: Number(parsed.total_subscribers) || 1000,
      subscriptionPlanDistribution: (parsed.subscription_plan_distribution as Record<string, number>) || {},
      subscriptionStatusDistribution: (parsed.subscription_status_distribution as Record<string, number>) || {},
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      avgContentPlaysPerUser: Number(parsed.avg_content_plays_per_user) || 0,
      avgSessionDuration: Number(parsed.avg_session_duration) || 0,
      premiumUpgradeRate: Number(parsed.premium_upgrade_rate) || 0,
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      avgAdRevenue: Number(parsed.avg_ad_revenue) || 0,
      avgRating: Number(parsed.avg_rating) || 0,
    };

    console.log('[llm-chat-api] Media metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch media metrics:', message);
    return { success: false, error: message };
  }
}

export interface D2cMetrics {
  totalCustomers: number;
  customerSegmentDistribution: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  avgOrderValue: number;
  repeatPurchaseRate: number;
  avgLifetimeValue: number;
  signupChannelDistribution: Record<string, number>;
  emailOpenRate: number;
  emailClickRate: number;
  socialEngagementRate: number;
  returnRate: number;
}

/**
 * Fetch live D2C metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchD2cMetrics(): Promise<{ success: boolean; data?: D2cMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for D2C metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the d2c_demo database. ' +
      'From master_customers: count total customers, count by customer_segment, count by churn_risk, average lifetime_value, count by signup_channel. ' +
      'From orders: average amount, repeat purchase rate (customers with more than 1 order / total unique customers as decimal 0-1). ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From social_events: engagement rate (engaged count / total count as decimal 0-1). ' +
      'From returns: return rate (returned count / total orders as decimal 0-1). ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_customers, customer_segment_distribution (object), churn_risk_distribution (object), ' +
      'avg_order_value, repeat_purchase_rate (decimal 0-1), avg_lifetime_value, ' +
      'signup_channel_distribution (object), email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'social_engagement_rate (decimal 0-1), return_rate (decimal 0-1). ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending D2C query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] D2C response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] D2C first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] D2C retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] D2C retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: D2cMetrics = {
      totalCustomers: Number(parsed.total_customers) || 1000,
      customerSegmentDistribution: (parsed.customer_segment_distribution as Record<string, number>) || {},
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      avgOrderValue: Number(parsed.avg_order_value) || 0,
      repeatPurchaseRate: Number(parsed.repeat_purchase_rate) || 0,
      avgLifetimeValue: Number(parsed.avg_lifetime_value) || 0,
      signupChannelDistribution: (parsed.signup_channel_distribution as Record<string, number>) || {},
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      socialEngagementRate: Number(parsed.social_engagement_rate) || 0,
      returnRate: Number(parsed.return_rate) || 0,
    };

    console.log('[llm-chat-api] D2C metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch D2C metrics:', message);
    return { success: false, error: message };
  }
}

export interface B2btechMetrics {
  totalAccounts: number;
  accountStatusDistribution: Record<string, number>;
  companySizeDistribution: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  avgHealthScore: number;
  expansionPotentialDistribution: Record<string, number>;
  avgDealAmount: number;
  emailOpenRate: number;
  emailClickRate: number;
  avgProductUsageCount: number;
  eventAttendanceRate: number;
}

/**
 * Fetch live B2B tech metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchB2btechMetrics(): Promise<{ success: boolean; data?: B2btechMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for B2B tech metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the b2b_tech_demo database. ' +
      'From master_customers: count total accounts, count by account_status, count by company_size, count by churn_risk, average health_score, count by expansion_potential. ' +
      'From deals: average amount. ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From product_usage: average usage_count. ' +
      'From events: attendance rate (attended count / invited count as decimal 0-1). ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_accounts, account_status_distribution (object), company_size_distribution (object), ' +
      'churn_risk_distribution (object), avg_health_score, expansion_potential_distribution (object), ' +
      'avg_deal_amount, email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'avg_product_usage_count, event_attendance_rate (decimal 0-1). ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending B2B tech query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] B2B tech response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] B2B tech first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] B2B tech retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] B2B tech retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: B2btechMetrics = {
      totalAccounts: Number(parsed.total_accounts) || 1000,
      accountStatusDistribution: (parsed.account_status_distribution as Record<string, number>) || {},
      companySizeDistribution: (parsed.company_size_distribution as Record<string, number>) || {},
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      avgHealthScore: Number(parsed.avg_health_score) || 0,
      expansionPotentialDistribution: (parsed.expansion_potential_distribution as Record<string, number>) || {},
      avgDealAmount: Number(parsed.avg_deal_amount) || 0,
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      avgProductUsageCount: Number(parsed.avg_product_usage_count) || 0,
      eventAttendanceRate: Number(parsed.event_attendance_rate) || 0,
    };

    console.log('[llm-chat-api] B2B tech metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch B2B tech metrics:', message);
    return { success: false, error: message };
  }
}

export interface FinancialMetrics {
  totalClients: number;
  primaryProductDistribution: Record<string, number>;
  incomeBracketDistribution: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  avgAum: number;
  advisorAssignedRate: number;
  avgTransactionAmount: number;
  emailOpenRate: number;
  emailClickRate: number;
  digitalEngagementRate: number;
  avgSatisfactionScore: number;
}

/**
 * Fetch live financial metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchFinancialMetrics(): Promise<{ success: boolean; data?: FinancialMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for financial metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the financial_demo database. ' +
      'From master_customers: count total clients, count by primary_product, count by income_bracket, count by churn_risk, average aum, percentage where advisor_assigned is Yes. ' +
      'From transactions: average amount. ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From digital_events: engagement rate (engaged count / total count as decimal 0-1). ' +
      'From surveys: average satisfaction_score. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_clients, primary_product_distribution (object), income_bracket_distribution (object), ' +
      'churn_risk_distribution (object), avg_aum, advisor_assigned_rate (decimal 0-1), ' +
      'avg_transaction_amount, email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'digital_engagement_rate (decimal 0-1), avg_satisfaction_score. ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending financial query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Financial response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] Financial first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] Financial retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] Financial retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: FinancialMetrics = {
      totalClients: Number(parsed.total_clients) || 1000,
      primaryProductDistribution: (parsed.primary_product_distribution as Record<string, number>) || {},
      incomeBracketDistribution: (parsed.income_bracket_distribution as Record<string, number>) || {},
      churnRiskDistribution: (parsed.churn_risk_distribution as Record<string, number>) || {},
      avgAum: Number(parsed.avg_aum) || 0,
      advisorAssignedRate: Number(parsed.advisor_assigned_rate) || 0,
      avgTransactionAmount: Number(parsed.avg_transaction_amount) || 0,
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      digitalEngagementRate: Number(parsed.digital_engagement_rate) || 0,
      avgSatisfactionScore: Number(parsed.avg_satisfaction_score) || 0,
    };

    console.log('[llm-chat-api] Financial metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch financial metrics:', message);
    return { success: false, error: message };
  }
}

export interface HealthcareMetrics {
  totalPatients: number;
  engagementScoreDistribution: Record<string, number>;
  insuranceTypeDistribution: Record<string, number>;
  avgChronicConditionCount: number;
  appointmentCompletionRate: number;
  avgAppointmentsPerPatient: number;
  emailOpenRate: number;
  emailClickRate: number;
  portalAdoptionRate: number;
  avgRiskScore: number;
  adherenceRate: number;
}

/**
 * Fetch live healthcare metrics from the database via the Chat API + PlazmaQueryTool.
 */
export async function fetchHealthcareMetrics(): Promise<{ success: boolean; data?: HealthcareMetrics; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    console.log('[llm-chat-api] Creating chat session for healthcare metrics...');
    const chatId = await createChat(apiKey);

    const query = 'Query the healthcare_demo database. ' +
      'From master_customers: count total patients, count by engagement_score, count by insurance_type, average chronic_condition_count, average risk_score. ' +
      'From appointments: completion rate (completed count / total count as decimal 0-1), average appointments per patient. ' +
      'From email_events: open rate (Opened count / Sent count), click rate (Clicked count / Sent count). ' +
      'From portal_events: adoption rate (active users / total patients as decimal 0-1). ' +
      'From prescriptions: adherence rate (adherent count / total count as decimal 0-1). ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_patients, engagement_score_distribution (object), insurance_type_distribution (object), ' +
      'avg_chronic_condition_count, appointment_completion_rate (decimal 0-1), avg_appointments_per_patient, ' +
      'email_open_rate (decimal 0-1), email_click_rate (decimal 0-1), ' +
      'portal_adoption_rate (decimal 0-1), avg_risk_score, adherence_rate (decimal 0-1). ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending healthcare query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Healthcare response received, parsing...', response.substring(0, 300));

    let parsed = extractJson(response);
    if (!parsed) {
      console.warn('[llm-chat-api] Healthcare first response not JSON, sending follow-up...');
      const retry = await sendMessage(chatId, 'Please return the results as a single JSON object only. No explanation, no markdown, just the raw JSON.', apiKey);
      console.log('[llm-chat-api] Healthcare retry response:', retry.substring(0, 300));
      parsed = extractJson(retry);
      if (!parsed) {
        console.warn('[llm-chat-api] Healthcare retry also failed, raw:', retry.substring(0, 500));
        return { success: false, error: 'Could not parse JSON from agent response' };
      }
    }

    const metrics: HealthcareMetrics = {
      totalPatients: Number(parsed.total_patients) || 1000,
      engagementScoreDistribution: (parsed.engagement_score_distribution as Record<string, number>) || {},
      insuranceTypeDistribution: (parsed.insurance_type_distribution as Record<string, number>) || {},
      avgChronicConditionCount: Number(parsed.avg_chronic_condition_count) || 0,
      appointmentCompletionRate: Number(parsed.appointment_completion_rate) || 0,
      avgAppointmentsPerPatient: Number(parsed.avg_appointments_per_patient) || 0,
      emailOpenRate: Number(parsed.email_open_rate) || 0,
      emailClickRate: Number(parsed.email_click_rate) || 0,
      portalAdoptionRate: Number(parsed.portal_adoption_rate) || 0,
      avgRiskScore: Number(parsed.avg_risk_score) || 0,
      adherenceRate: Number(parsed.adherence_rate) || 0,
    };

    console.log('[llm-chat-api] Healthcare metrics parsed:', metrics);
    return { success: true, data: metrics };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[llm-chat-api] Failed to fetch healthcare metrics:', message);
    return { success: false, error: message };
  }
}
