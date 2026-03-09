/**
 * Chat routes — replaces electron/ipc/chat-handlers.ts
 *
 * Uses SSE (Server-Sent Events) for streaming chat responses.
 * - POST /api/chat/sessions     → start session, returns SSE stream
 * - POST /api/chat/sessions/:id/messages → push message to session
 * - POST /api/chat/sessions/:id/stop     → interrupt session
 */

import { Router } from 'express';
import { startSession, pushMessage, stopSession, isInitialized, hasSession, updateConfig } from '../services/claude-agent.js';
import { loadSettings } from '../services/storage.js';

export const chatRouter = Router();

/**
 * Ensure Claude Agent is initialized from request headers + storage.
 * On Vercel, each invocation may be a cold start.
 */
function ensureInit(req: any): void {
  const apiKey = req.headers['x-api-key'] as string
    || loadSettings().apiKey
    || process.env.API_KEY
    || '';
  if (apiKey) {
    const settings = loadSettings();
    updateConfig({
      apiKey,
      llmProxyUrl: settings.llmProxyUrl || process.env.LLM_PROXY_URL || 'https://llm-proxy.us01.treasuredata.com',
      model: settings.model || process.env.MODEL,
    });
  }
}

// POST /api/chat/sessions — start a new streaming session
// Returns an SSE stream
chatRouter.post('/sessions', (req, res) => {
  ensureInit(req);

  if (!isInitialized()) {
    res.status(503).json({ success: false, error: 'Claude Agent client not initialized. Configure API key in Settings.' });
    return;
  }

  const sessionId = `session-${Date.now()}`;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Session-Id': sessionId,
  });

  // Send session ID as first event
  res.write(`data: ${JSON.stringify({ type: 'session_started', sessionId })}\n\n`);

  // Start the chat session with this SSE connection
  startSession(sessionId, res);
});

// POST /api/chat/sessions/:id/messages — send a message to session
chatRouter.post('/sessions/:id/messages', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!hasSession(id)) {
    res.status(404).json({ success: false, error: 'No active session' });
    return;
  }

  const isEmpty = typeof content === 'string' ? !content.trim() : !Array.isArray(content) || content.length === 0;
  if (isEmpty) {
    res.status(400).json({ success: false, error: 'Cannot send empty message' });
    return;
  }

  const sent = pushMessage(id, typeof content === 'string' ? content.trim() : content);
  if (!sent) {
    res.status(404).json({ success: false, error: 'Session not found or ended' });
    return;
  }

  res.json({ success: true });
});

// POST /api/chat/sessions/:id/stop — interrupt session
chatRouter.post('/sessions/:id/stop', (req, res) => {
  const { id } = req.params;
  stopSession(id);
  res.json({ success: true });
});
