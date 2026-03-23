/**
 * AI Suites Web Server
 *
 * Express server that replaces Electron's IPC handlers,
 * exposing the same functionality over HTTP/SSE endpoints.
 */

import 'dotenv/config';

// Prevent EPIPE crashes when SDK subprocess pipe closes
process.on('uncaughtException', (error) => {
  if (error.message?.includes('EPIPE') || error.message?.includes('write EPIPE')) {
    console.warn('[Server] EPIPE error suppressed (subprocess pipe closed)');
    return;
  }
  console.error('[Server] Uncaught exception:', error);
});

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settingsRouter } from './routes/settings.js';
import { chatRouter } from './routes/chat.js';
import { blueprintRouter } from './routes/blueprints.js';
import { pdfRouter } from './routes/pdf.js';
import { webRouter } from './routes/web.js';
import { platformRouter } from './routes/platforms.js';
import { launchRouter } from './routes/launch.js';
import { chatStorageRouter } from './routes/chat-storage.js';
import { segmentsRouter } from './routes/segments.js';
import { experienceCenterRouter } from './experience-center/route.js';
import { calendarRouter } from './routes/calendar.js';
import { feedbackRouter } from './routes/feedback.js';
import { initClaudeAgent } from './services/claude-agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Optional password gate
const APP_PASSWORD = process.env.APP_PASSWORD;
if (APP_PASSWORD) {
  app.use('/api', (req, res, next) => {
    // Calendar routes are public (booking flow)
    if (req.path.startsWith('/calendar')) return next();
    const provided = req.headers['x-app-password'] as string;
    if (provided !== APP_PASSWORD) {
      res.status(401).json({ success: false, error: 'Invalid password' });
      return;
    }
    next();
  });
}

// API routes
app.use('/api/settings', settingsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chats', chatStorageRouter);
app.use('/api/blueprints', blueprintRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/web', webRouter);
app.use('/api/platforms', platformRouter);
app.use('/api/launch', launchRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/experience-center', experienceCenterRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/feedback', feedbackRouter);

// Initialize Claude Agent SDK
initClaudeAgent();

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
