/**
 * Browser-side Chat Client — direct Messages API calls (Option A from architecture doc).
 *
 * No Agent SDK, no streaming, no tools. Just multi-turn conversation via /api/llm.
 * Conversation history is maintained in browser memory and persisted to sessionStorage.
 */

import { storage } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_HISTORY_KEY = 'ai-suites:chat-history';

function getApiKey(): string {
  return import.meta.env.VITE_SANDBOX_API_KEY || storage.getItem('ai-suites-api-key') || '';
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (APP_PASSWORD) headers['x-app-password'] = APP_PASSWORD;
  const apiKey = getApiKey();
  if (apiKey) headers['x-api-key'] = apiKey;
  return headers;
}

let conversationHistory: ChatMessage[] = [];

// Restore from sessionStorage on load
try {
  const raw = storage.getItem(CHAT_HISTORY_KEY);
  if (raw) conversationHistory = JSON.parse(raw);
} catch { /* ignore */ }

function persist(): void {
  try { storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(conversationHistory)); } catch { /* ignore */ }
}

export async function sendChatMessage(userMessage: string): Promise<string> {
  conversationHistory.push({ role: 'user', content: userMessage });

  const response = await fetch(`${API_BASE}/llm`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are a marketing assistant for Treasure Data. Help users with campaign planning, audience targeting, and data-driven marketing strategies.',
      messages: conversationHistory,
    }),
  });

  if (!response.ok) {
    // Remove the failed user message from history
    conversationHistory.pop();
    const body = await response.text().catch(() => '');
    throw new Error(`LLM proxy returned HTTP ${response.status}: ${body.substring(0, 200)}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text?: string }> };
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  const assistantMessage = textBlock?.text || '';

  conversationHistory.push({ role: 'assistant', content: assistantMessage });
  persist();

  return assistantMessage;
}

export function clearChatHistory(): void {
  conversationHistory = [];
  try { storage.removeItem(CHAT_HISTORY_KEY); } catch { /* ignore */ }
}

export function getChatHistory(): ChatMessage[] {
  return [...conversationHistory];
}
