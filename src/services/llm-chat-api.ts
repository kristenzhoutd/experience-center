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
  // Try markdown fence first
  const fenceMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* fall through */ }
  }

  // Try to find a JSON object in the text
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* fall through */ }
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

    const query = 'Join master_customers with rfm_scores, loyalty_members, online_orders, and instore_transactions. ' +
      'Return as a single JSON object with these exact keys: ' +
      'total_customers (count), avg_clv (avg predicted CLV), ' +
      'loyalty_tier_counts (object with tier name keys and count values), ' +
      'avg_order_value (object with online, instore, combined keys), ' +
      'churn_risk_distribution (object with Low/Medium/High keys and count values), ' +
      'repeat_purchase_rate (decimal between 0-1). ' +
      'Return ONLY the JSON object, no explanation.';

    console.log('[llm-chat-api] Sending query...');
    const response = await sendMessage(chatId, query, apiKey);
    console.log('[llm-chat-api] Response received, parsing...');

    const parsed = extractJson(response);
    if (!parsed) {
      return { success: false, error: 'Could not parse JSON from agent response' };
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
