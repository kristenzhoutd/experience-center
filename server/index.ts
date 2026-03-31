/**
 * AI Suites Web Server — Minimal Stateless Proxy
 *
 * Only two routes:
 * - POST /api/llm          — forwards to TD LLM Proxy with TD1 auth header
 * - POST /api/test-connection — tests the LLM proxy connection
 */

import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Runtime config — serves API key to the client at runtime
// (VITE_ env vars only work at Vite build time; this endpoint provides them at runtime for Docker deploys)
app.get('/api/config', (_req, res) => {
  res.json({
    sandboxApiKey: process.env.VITE_SANDBOX_API_KEY || process.env.API_KEY || '',
  });
});


// Stateless LLM proxy — forwards to TD LLM Proxy with TD1 auth header
app.post('/api/llm', async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string || process.env.API_KEY || '';
  const llmProxyUrl = (process.env.LLM_PROXY_URL || 'https://llm-proxy.us01.treasuredata.com').replace(/\/$/, '');
  if (!apiKey) {
    res.status(401).json({ error: 'No API key provided' });
    return;
  }
  try {
    const response = await fetch(`${llmProxyUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `TD1 ${apiKey}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.text();
    res.status(response.status).set('Content-Type', response.headers.get('content-type') || 'application/json').send(data);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Proxy error' });
  }
});

// Test connection endpoint
app.post('/api/test-connection', async (req, res) => {
  const apiKey = req.headers['x-api-key'] as string || process.env.API_KEY || '';
  const llmProxyUrl = (process.env.LLM_PROXY_URL || 'https://llm-proxy.us01.treasuredata.com').replace(/\/$/, '');
  if (!apiKey) { res.json({ success: false, error: 'No API key configured.' }); return; }
  try {
    const response = await fetch(`${llmProxyUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `TD1 ${apiKey}`, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok || response.status === 200) { res.json({ success: true }); return; }
    const body = await response.text().catch(() => '');
    if (response.status === 400 && !body.includes('Authentication')) { res.json({ success: true }); return; }
    res.json({ success: false, error: `HTTP ${response.status}: ${body.substring(0, 200)}` });
  } catch (err) { res.json({ success: false, error: `Connection failed: ${err instanceof Error ? err.message : String(err)}` }); }
});

// Export for Vercel serverless
export { app };

// Only start listening when running directly (not on Vercel)
if (!process.env.VERCEL) {
  const clientDir = path.join(__dirname, '../dist/client');
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[Server] AI Suites Web running on http://localhost:${PORT}`);
  });
}
