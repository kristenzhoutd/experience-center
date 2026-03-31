import { storage } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

function getStoredKey(key: string): string {
  try { return storage.getItem(key) || ''; } catch { return ''; }
}

async function request<T>(endpoint: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const apiKey = getStoredKey('ai-suites-api-key') || import.meta.env.VITE_SANDBOX_API_KEY || '';
  const tdxApiKey = getStoredKey('ai-suites-tdx-api-key') || import.meta.env.VITE_SANDBOX_API_KEY || '';

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': APP_PASSWORD,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
      ...(tdxApiKey ? { 'x-tdx-api-key': tdxApiKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

// Experience Center API — runs in browser, calls /api/llm proxy
export const experienceCenterApi = {
  generate: async (scenarioConfig: any) => {
    const { executeScenarioSkill } = await import('../experience-center/orchestration/executeSkill');
    const result = await executeScenarioSkill(scenarioConfig);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
  generateSlides: async (input: { outputData: any; deckLength: number; deckStyle: string; customTitle?: string; scenarioContext: any }) => {
    const { executeSlideSkill } = await import('../experience-center/orchestration/executeSkill');
    const result = await executeSlideSkill(input);
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
};
