/**
 * Web API adapter — provides the same interface as window.aiSuites
 * but uses HTTP/SSE instead of Electron IPC.
 *
 * This is the key bridge that lets the frontend work in both
 * Electron (IPC) and web (HTTP) modes.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

// ── Local API Key Storage ──
// On Vercel (serverless), server-side /tmp is ephemeral. We store the
// API key in localStorage and send it as x-api-key on every request.

const STORAGE_KEY = 'ai-suites-api-key';
const TDX_STORAGE_KEY = 'ai-suites-tdx-api-key';

function getSavedApiKey(): string {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

function saveApiKey(key: string): void {
  try { localStorage.setItem(STORAGE_KEY, key); } catch { /* ignore */ }
}

function clearApiKey(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function getSavedTdxApiKey(): string {
  try { return localStorage.getItem(TDX_STORAGE_KEY) || ''; } catch { return ''; }
}

function saveTdxApiKey(key: string): void {
  try { localStorage.setItem(TDX_STORAGE_KEY, key); } catch { /* ignore */ }
}

function clearTdxApiKey(): void {
  try { localStorage.removeItem(TDX_STORAGE_KEY); } catch { /* ignore */ }
}

// ── HTTP Helpers ──

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (APP_PASSWORD) headers['x-app-password'] = APP_PASSWORD;
  const apiKey = getSavedApiKey();
  if (apiKey) headers['x-api-key'] = apiKey;
  const tdxApiKey = getSavedTdxApiKey();
  if (tdxApiKey) headers['x-tdx-api-key'] = tdxApiKey;
  return headers;
}

async function request<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

// ── SSE Stream Management ──

type StreamCallback = (event: unknown) => void;
let activeSSE: EventSource | null = null;
let activeStreamCallbacks: StreamCallback[] = [];
let currentSessionId: string | null = null;

// ── Chat API (SSE-based streaming) ──

const chat = {
  startSession: async (): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    // Close any existing SSE connection
    if (activeSSE) {
      activeSSE.close();
      activeSSE = null;
    }

    return new Promise((resolve) => {
      // Use fetch for the SSE connection since EventSource only supports GET
      const controller = new AbortController();

      fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          resolve({ success: false, error: data.error || `HTTP ${response.status}` });
          return;
        }

        // Get session ID from header
        const headerSessionId = response.headers.get('X-Session-Id');

        const reader = response.body?.getReader();
        if (!reader) {
          resolve({ success: false, error: 'No response body' });
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let resolved = false;

        // Store abort controller for cleanup
        const sseConnection = {
          close: () => controller.abort(),
        };
        activeSSE = sseConnection as unknown as EventSource;

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const event = JSON.parse(line.slice(6));

                    // First event is session_started
                    if (!resolved && event.type === 'session_started') {
                      currentSessionId = event.sessionId || headerSessionId;
                      resolved = true;
                      resolve({ success: true, sessionId: currentSessionId! });
                      continue;
                    }

                    // Forward all other events to stream callbacks
                    for (const cb of activeStreamCallbacks) {
                      cb(event);
                    }
                  } catch {
                    // skip malformed JSON
                  }
                }
              }
            }
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error('[WebBackend] SSE stream error:', err);
            }
          }
        };

        pump();

        // If we haven't resolved after 5s with a session_started event,
        // use the header session ID
        setTimeout(() => {
          if (!resolved) {
            currentSessionId = headerSessionId || `session-${Date.now()}`;
            resolved = true;
            resolve({ success: true, sessionId: currentSessionId });
          }
        }, 5000);
      }).catch((err) => {
        resolve({ success: false, error: err instanceof Error ? err.message : String(err) });
      });
    });
  },

  sendToSession: async (content: string | unknown[]): Promise<{ success: boolean; error?: string }> => {
    if (!currentSessionId) {
      return { success: false, error: 'No active session' };
    }
    return request(`/chat/sessions/${currentSessionId}/messages`, {
      method: 'POST',
      body: { content },
    });
  },

  stopSession: async (): Promise<void> => {
    if (currentSessionId) {
      await request(`/chat/sessions/${currentSessionId}/stop`, { method: 'POST' });
    }
    if (activeSSE) {
      activeSSE.close();
      activeSSE = null;
    }
  },

  onStream: (callback: StreamCallback): (() => void) => {
    activeStreamCallbacks.push(callback);
    return () => {
      activeStreamCallbacks = activeStreamCallbacks.filter((cb) => cb !== callback);
    };
  },

  // Legacy one-shot (stub)
  send: async (_message: string): Promise<void> => {},
  stop: async (): Promise<void> => {
    await chat.stopSession();
  },

  // Chat storage
  save: async (chatData: unknown) => request('/chats', { method: 'POST', body: chatData }),
  load: async (chatId: string) => request(`/chats/${chatId}`),
  list: async () => request('/chats'),
  delete: async (chatId: string) => request(`/chats/${chatId}`, { method: 'DELETE' }),
};

// ── Settings API ──

const settings = {
  get: async () => {
    const result = await request<{ success: boolean; data: Record<string, unknown> }>('/settings');
    const data = result.data || result;
    // Report stored keys so Settings page shows masked values
    if (getSavedApiKey()) {
      (data as any).hasStoredApiKey = true;
    }
    if (getSavedTdxApiKey()) {
      (data as any).hasStoredTdxApiKey = true;
    }
    return data;
  },
  set: async (newSettings: Record<string, unknown>) => {
    // Save API keys to localStorage for persistence across serverless invocations
    if (newSettings.apiKey && typeof newSettings.apiKey === 'string') {
      saveApiKey(newSettings.apiKey);
    }
    if (newSettings.tdxApiKey && typeof newSettings.tdxApiKey === 'string') {
      saveTdxApiKey(newSettings.tdxApiKey);
    }
    await request('/settings', { method: 'PUT', body: newSettings });
  },
  testConnection: async () => request('/settings/test-connection', { method: 'POST' }),
  hasCredentials: async () => !!getSavedApiKey(),
  saveCredentials: async (key: string, type: 'apiKey' | 'tdxApiKey') => {
    if (type === 'apiKey') saveApiKey(key);
    if (type === 'tdxApiKey') saveTdxApiKey(key);
    return request('/settings/credentials', { method: 'POST', body: { key, type } });
  },
  deleteCredentials: async (type: 'apiKey' | 'tdxApiKey') => {
    if (type === 'apiKey') clearApiKey();
    if (type === 'tdxApiKey') clearTdxApiKey();
    return request(`/settings/credentials/${type}`, { method: 'DELETE' });
  },
  parentSegments: async () => {
    // TD CLI not available in web mode — return empty
    return { success: true, data: [] };
  },
  parentSegmentChildren: async (_parentId: string) => {
    return { success: true, data: [] };
  },
  listProjects: async () => ({ success: true, data: [] }),
  listAgents: async (_projectName: string) => ({ success: true, data: [] }),
};

// ── Audiences API ──

const audiences = {
  list: async (_parentSegmentName: string) => {
    return { success: true, data: [] };
  },
};

// ── Window controls (no-op in web mode) ──

const windowApi = {
  minimize: () => {},
  maximize: () => {},
  close: () => {},
};

// ── Blueprints API ──

const blueprints = {
  save: async (blueprint: unknown) => request('/blueprints', { method: 'POST', body: blueprint }),
  list: async () => request('/blueprints'),
  get: async (id: string) => request(`/blueprints/${id}`),
  delete: async (id: string) => request(`/blueprints/${id}`, { method: 'DELETE' }),
  export: async (id: string) => request(`/blueprints/${id}/export`, { method: 'POST' }),
};

// ── Platforms API ──

const platforms = {
  connect: async (platform: string, credentials: Record<string, string>) => {
    return request('/platforms/connect', { method: 'POST', body: { platform, credentials } });
  },
  disconnect: async (platform: string) => {
    return request('/platforms/disconnect', { method: 'POST', body: { platform } });
  },
  status: async () => request('/platforms/status'),
  syncAudience: async (platform: string, segmentId: string, segmentName: string) => {
    return request('/platforms/sync-audience', { method: 'POST', body: { platform, segmentId, segmentName } });
  },
  metrics: async (platform: string) => {
    return request('/platforms/metrics', { method: 'POST', body: { platform } });
  },
  oauthLogin: async (_platform: string) => {
    return { success: false, error: 'OAuth login requires redirect flow in web mode. Use access token connection instead.' };
  },
};

// ── Campaigns API ──

const campaigns = {
  list: async () => request('/platforms/campaigns'),
  get: async (_campaignId: string) => ({ success: false, error: 'Not implemented in web mode' }),
  metrics: async (_campaignId: string) => ({ success: false, error: 'Not implemented in web mode' }),
  create: async (params: unknown) => request('/platforms/campaigns', { method: 'POST', body: params }),
  update: async (_campaignId: string, _params: unknown) => ({ success: false, error: 'Not implemented in web mode' }),
  delete: async (_campaignId: string) => ({ success: false, error: 'Not implemented in web mode' }),
};

// ── Ad Sets API ──

const adsets = {
  create: async (_params: unknown) => ({ success: false, error: 'Not implemented in web mode' }),
};

// ── TD CDP API ──

const td = {
  segmentDetails: async () => ({ success: true, data: {} }),
  journeys: async () => ({ success: true, data: [] }),
  activations: async () => ({ success: true, data: [] }),
  audienceAnalysis: async () => ({ success: true, data: {} }),
  createSegment: async () => ({ success: true, data: { id: `sim-${Date.now()}`, name: 'Simulated' } }),
};

// ── Launch API ──

const launch = {
  uploadImage: async (_filePath: string) => ({ success: false, error: 'Use file upload in web mode' }),
  createAdCreative: async (_params: unknown) => ({ success: false, error: 'Not implemented in web mode' }),
  createAd: async (_params: unknown) => ({ success: false, error: 'Not implemented in web mode' }),
  getPages: async () => ({ success: true, data: [] }),
  selectFile: async () => {
    // In web mode, we use <input type="file"> on the frontend
    return { success: false, error: 'Use file input in web mode' };
  },
  searchStockPhotos: async (query: string) => {
    return request('/launch/stock-search', { method: 'POST', body: { query } });
  },
  fetchImage: async (url: string) => {
    return request('/launch/fetch-image', { method: 'POST', body: { url } });
  },
  generateImage: async (_prompt: string) => {
    return { success: false, error: 'Image generation requires TDX CLI (not available in web mode)' };
  },
};

// ── PDF API ──

const pdf = {
  extract: async (pdfBase64: string, _fileName: string) => {
    return request('/pdf/extract', { method: 'POST', body: { base64Data: pdfBase64 } });
  },
};

// ── Web extraction API ──

const web = {
  extract: async (url: string) => request('/web/extract', { method: 'POST', body: { url } }),
  extractText: async (url: string) => request('/web/extract-text', { method: 'POST', body: { url } }),
};

// ── MCP API (stubs for web mode) ──

const mcp = {
  listServers: async () => ({ success: true, data: {} }),
  addServer: async () => ({ success: true }),
  removeServer: async () => ({ success: true }),
};

// ── Usage API ──

const usage = {
  getStats: async () => ({ success: true, data: { sessionCredits: 0, todayCredits: 0, monthCredits: 0 } }),
};

// ── AEM API ──

const aem = {
  connect: async (_config: unknown) => ({ success: false, error: 'AEM OAuth not available in web mode. Use token auth.' }),
  disconnect: async () => ({ success: true }),
  status: async () => ({ success: true, data: { connected: false } }),
  browse: async () => ({ success: true, data: { path: '', items: [], hasMore: false, total: 0 } }),
  search: async () => ({ success: true, data: { path: '', items: [], hasMore: false, total: 0 } }),
  assetDetails: async () => ({ success: true, data: {} }),
};

// ── Exported API object ──

export const webBackend = {
  settings,
  audiences,
  window: windowApi,
  chat,
  td,
  campaigns,
  adsets,
  platforms,
  blueprints,
  launch,
  pdf,
  web,
  mcp,
  usage,
  aem,
  platform: 'web' as const,
};
