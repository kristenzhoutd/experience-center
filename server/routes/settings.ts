/**
 * Settings routes — replaces electron/ipc/settings-handlers.ts
 *
 * On Vercel (serverless), /tmp storage is ephemeral. The API key
 * is sent from the frontend via x-api-key header on every request.
 * Non-secret settings are still persisted to /tmp as best-effort.
 */

import { Router } from 'express';
import { loadSettings, saveSettings } from '../services/storage.js';
import { testConnection, updateConfig, initClaudeAgent } from '../services/claude-agent.js';

export const settingsRouter = Router();

/**
 * Extract API key from request — checks header first, then stored settings.
 */
function getApiKeyFromRequest(req: any): string {
  return req.headers['x-api-key'] as string
    || loadSettings().apiKey
    || process.env.API_KEY
    || '';
}

function getTdxApiKeyFromRequest(req: any): string {
  return req.headers['x-tdx-api-key'] as string
    || loadSettings().tdxApiKey
    || '';
}

/**
 * Ensure Claude Agent is initialized with the key from the current request.
 */
function ensureInitialized(req: any): void {
  const apiKey = getApiKeyFromRequest(req);
  const settings = loadSettings();
  if (apiKey) {
    updateConfig({
      apiKey,
      llmProxyUrl: settings.llmProxyUrl || process.env.LLM_PROXY_URL || 'https://llm-proxy.us01.treasuredata.com',
      model: settings.model || process.env.MODEL,
    });
  }
}

// GET /api/settings — return settings (API keys come from frontend localStorage)
settingsRouter.get('/', (req, res) => {
  const settings = loadSettings();
  const apiKey = getApiKeyFromRequest(req);
  const tdxApiKey = getTdxApiKeyFromRequest(req);
  res.json({
    success: true,
    data: {
      ...settings,
      // Don't return API keys — frontend manages them in localStorage
      apiKey: undefined,
      tdxApiKey: undefined,
      hasSavedCredentials: !!apiKey,
      hasStoredApiKey: !!apiKey,
      hasStoredTdxApiKey: !!tdxApiKey,
    },
  });
});

// PUT /api/settings — update settings
settingsRouter.put('/', (req, res) => {
  const newSettings = req.body;
  const current = loadSettings();

  // If API key is sent in body, save to /tmp (best-effort for same-container reuse)
  if (newSettings.apiKey) {
    current.apiKey = newSettings.apiKey;
    updateConfig({ apiKey: newSettings.apiKey });
  }
  delete newSettings.apiKey;

  if (newSettings.tdxApiKey) {
    current.tdxApiKey = newSettings.tdxApiKey;
  }
  delete newSettings.tdxApiKey;

  const merged = { ...current, ...newSettings };
  saveSettings(merged);

  if (newSettings.llmProxyUrl || newSettings.model) {
    updateConfig({
      llmProxyUrl: merged.llmProxyUrl,
      model: merged.model,
    });
  }

  res.json({ success: true });
});

// POST /api/settings/test-connection
settingsRouter.post('/test-connection', async (req, res) => {
  ensureInitialized(req);
  const result = await testConnection();
  res.json(result);
});

// POST /api/settings/credentials — save API key
settingsRouter.post('/credentials', (req, res) => {
  const { key, type } = req.body;
  if (!key || !type) {
    res.json({ success: false, error: 'key and type are required' });
    return;
  }
  const settings = loadSettings();
  if (type === 'apiKey') {
    settings.apiKey = key;
    updateConfig({ apiKey: key });
  } else if (type === 'tdxApiKey') {
    settings.tdxApiKey = key;
  }
  saveSettings(settings);
  res.json({ success: true });
});

// DELETE /api/settings/credentials/:type
settingsRouter.delete('/credentials/:type', (req, res) => {
  const { type } = req.params;
  const settings = loadSettings();
  if (type === 'apiKey') {
    delete settings.apiKey;
    updateConfig({ apiKey: '' });
  } else if (type === 'tdxApiKey') {
    delete settings.tdxApiKey;
  }
  saveSettings(settings);
  res.json({ success: true });
});

// GET /api/settings/credentials/has
settingsRouter.get('/credentials/has', (req, res) => {
  res.json(!!getApiKeyFromRequest(req));
});
