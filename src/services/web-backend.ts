/**
 * Web API adapter — provides the same interface as window.aiSuites
 * but uses HTTP/SSE instead of Electron IPC.
 *
 * This is the key bridge that lets the frontend work in both
 * Electron (IPC) and web (HTTP) modes.
 */

import { storage } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

// ── Local API Key Storage ──
// On Vercel (serverless), server-side /tmp is ephemeral. We store the
// API key in storage and send it as x-api-key on every request.

const STORAGE_KEY = 'ai-suites-api-key';
const TDX_STORAGE_KEY = 'ai-suites-tdx-api-key';

function getSavedApiKey(): string {
  try { return storage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

function saveApiKey(key: string): void {
  try { storage.setItem(STORAGE_KEY, key); } catch { /* ignore */ }
}

function clearApiKey(): void {
  try { storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

function getSavedTdxApiKey(): string {
  try { return storage.getItem(TDX_STORAGE_KEY) || ''; } catch { return ''; }
}

function saveTdxApiKey(key: string): void {
  try { storage.setItem(TDX_STORAGE_KEY, key); } catch { /* ignore */ }
}

function clearTdxApiKey(): void {
  try { storage.removeItem(TDX_STORAGE_KEY); } catch { /* ignore */ }
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

const CHATS_STORAGE_KEY = 'ai-suites:saved-chats';

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

  // Chat storage (sessionStorage-backed)
  save: async (chatData: any) => {
    try {
      const raw = storage.getItem(CHATS_STORAGE_KEY);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      const id = chatData.id || `chat-${Date.now()}`;
      const idx = arr.findIndex((c: any) => c.id === id);
      const entry = { ...chatData, id, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        arr[idx] = entry;
      } else {
        entry.createdAt = entry.createdAt || entry.updatedAt;
        arr.push(entry);
      }
      storage.setItem(CHATS_STORAGE_KEY, JSON.stringify(arr));
      return { success: true, data: entry };
    } catch { return { success: false, error: 'Failed to save chat' }; }
  },
  load: async (chatId: string) => {
    try {
      const raw = storage.getItem(CHATS_STORAGE_KEY);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      const found = arr.find((c: any) => c.id === chatId);
      return found
        ? { success: true, data: found }
        : { success: false, error: 'Chat not found' };
    } catch { return { success: false, error: 'Failed to load chat' }; }
  },
  list: async () => {
    try {
      const raw = storage.getItem(CHATS_STORAGE_KEY);
      return { success: true, data: raw ? JSON.parse(raw) : [] };
    } catch { return { success: true, data: [] }; }
  },
  delete: async (chatId: string) => {
    try {
      const raw = storage.getItem(CHATS_STORAGE_KEY);
      const arr: any[] = raw ? JSON.parse(raw) : [];
      storage.setItem(CHATS_STORAGE_KEY, JSON.stringify(arr.filter((c: any) => c.id !== chatId)));
      return { success: true };
    } catch { return { success: false, error: 'Failed to delete chat' }; }
  },
};

// ── Settings API (sessionStorage-backed) ──

const SETTINGS_STORAGE_KEY = 'ai-suites:settings';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
};

const settings = {
  get: async () => {
    try {
      const raw = storage.getItem(SETTINGS_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { ...DEFAULT_SETTINGS };
      // Report stored keys so Settings page shows masked values
      if (getSavedApiKey()) {
        (data as any).hasStoredApiKey = true;
      }
      if (getSavedTdxApiKey()) {
        (data as any).hasStoredTdxApiKey = true;
      }
      return data;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  set: async (newSettings: Record<string, unknown>) => {
    // Save API keys to storage for persistence
    if (newSettings.apiKey && typeof newSettings.apiKey === 'string') {
      saveApiKey(newSettings.apiKey);
    }
    if (newSettings.tdxApiKey && typeof newSettings.tdxApiKey === 'string') {
      saveTdxApiKey(newSettings.tdxApiKey);
    }
    // Merge with existing settings and persist
    try {
      const raw = storage.getItem(SETTINGS_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : { ...DEFAULT_SETTINGS };
      const merged = { ...existing, ...newSettings };
      // Don't persist raw keys in the settings blob
      delete merged.apiKey;
      delete merged.tdxApiKey;
      storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
  },
  testConnection: async () => request('/test-connection', { method: 'POST' }),
  hasCredentials: async () => !!getSavedApiKey(),
  saveCredentials: async (key: string, type: 'apiKey' | 'tdxApiKey') => {
    if (type === 'apiKey') saveApiKey(key);
    if (type === 'tdxApiKey') saveTdxApiKey(key);
    return { success: true };
  },
  deleteCredentials: async (type: 'apiKey' | 'tdxApiKey') => {
    if (type === 'apiKey') clearApiKey();
    if (type === 'tdxApiKey') clearTdxApiKey();
    return { success: true };
  },
  parentSegments: async () => {
    const { fetchParentSegments } = await import('./cdp-api');
    return fetchParentSegments();
  },
  parentSegmentChildren: async (parentId: string) => {
    const { fetchChildSegments } = await import('./cdp-api');
    return fetchChildSegments(parentId);
  },
  listProjects: async () => ({ success: true, data: [] }),
  listAgents: async (_projectName: string) => ({ success: true, data: [] }),
};

// ── Audiences API ──

const audiences = {
  list: async (parentSegmentId: string) => {
    const { fetchChildSegments } = await import('./cdp-api');
    return fetchChildSegments(parentSegmentId);
  },
};

// ── Window controls (no-op in web mode) ──

const windowApi = {
  minimize: () => {},
  maximize: () => {},
  close: () => {},
};

// ── Blueprints API (sessionStorage-backed) ──

const BLUEPRINTS_STORAGE_KEY = 'ai-suites:blueprints';

function readBlueprints(): any[] {
  try {
    const raw = storage.getItem(BLUEPRINTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeBlueprints(arr: any[]): void {
  storage.setItem(BLUEPRINTS_STORAGE_KEY, JSON.stringify(arr));
}

const blueprints = {
  save: async (blueprint: any) => {
    const arr = readBlueprints();
    const id = blueprint.id || `bp-${Date.now()}`;
    const idx = arr.findIndex((b: any) => b.id === id);
    const entry = { ...blueprint, id, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      arr[idx] = entry;
    } else {
      entry.createdAt = entry.createdAt || entry.updatedAt;
      arr.push(entry);
    }
    writeBlueprints(arr);
    return { success: true, data: entry };
  },
  list: async () => {
    return { success: true, data: readBlueprints() };
  },
  get: async (id: string) => {
    const found = readBlueprints().find((b: any) => b.id === id);
    return found
      ? { success: true, data: found }
      : { success: false, error: 'Blueprint not found' };
  },
  delete: async (id: string) => {
    const arr = readBlueprints().filter((b: any) => b.id !== id);
    writeBlueprints(arr);
    return { success: true };
  },
  export: async (id: string) => {
    const found = readBlueprints().find((b: any) => b.id === id);
    return found
      ? { success: true, data: JSON.stringify(found, null, 2) }
      : { success: false, error: 'Blueprint not found' };
  },
};

// ── Removed: platforms, campaigns, adsets (no longer needed) ──

const platforms = {} as any;
const campaigns = {} as any;
const adsets = {} as any;

// ── TD CDP API ──

const td = {
  segmentDetails: async () => ({ success: true, data: {} }),
  journeys: async () => ({ success: true, data: [] }),
  activations: async () => ({ success: true, data: [] }),
  audienceAnalysis: async () => ({ success: true, data: {} }),
  createSegment: async () => ({ success: true, data: { id: `sim-${Date.now()}`, name: 'Simulated' } }),
};

// ── Removed: launch, pdf, web (no longer needed) ──

const launch = {} as any;
const pdf = {} as any;
const web = {} as any;

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

// ── Removed: aem (no longer needed) ──

const aem = {} as any;

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
