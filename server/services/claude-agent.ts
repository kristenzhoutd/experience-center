/**
 * Claude Agent SDK client for the web server.
 *
 * Mirrors electron/services/claude-agent/client.ts but without Electron dependencies.
 * Manages chat sessions and streams events via SSE.
 */

import type { Response } from 'express';
import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';
import type { ChatStreamEvent } from '../types.js';
import { loadSettings } from './storage.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Auth Proxy ──
// The Claude Agent SDK sends x-api-key (Anthropic format), but the TD LLM proxy
// expects Authorization: TD1 <key>. This local proxy bridges the gap.

let authProxyServer: http.Server | null = null;
let authProxyPort: number | null = null;
let authProxyTarget: string = '';

function startAuthProxy(tdProxyUrl: string): Promise<string> {
  authProxyTarget = tdProxyUrl.replace(/\/$/, '');

  return new Promise((resolve, reject) => {
    if (authProxyServer && authProxyPort) {
      resolve(`http://127.0.0.1:${authProxyPort}`);
      return;
    }

    authProxyServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = Buffer.concat(chunks);
        const apiKey = req.headers['x-api-key'] as string | undefined;
        const targetFullUrl = new URL(req.url || '/', authProxyTarget);

        const forwardHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (!value) continue;
          const lk = key.toLowerCase();
          if (lk === 'host' || lk === 'x-api-key' || lk === 'connection') continue;
          forwardHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
        }
        if (apiKey) forwardHeaders['Authorization'] = `TD1 ${apiKey}`;
        if (body.length > 0) forwardHeaders['content-length'] = body.length.toString();

        const proxyReq = https.request({
          hostname: targetFullUrl.hostname,
          port: targetFullUrl.port || 443,
          path: targetFullUrl.pathname + targetFullUrl.search,
          method: req.method || 'POST',
          headers: forwardHeaders,
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: `Auth proxy error: ${err.message}` } }));
        });
        if (body.length > 0) proxyReq.write(body);
        proxyReq.end();
      });
    });

    authProxyServer.listen(0, '127.0.0.1', () => {
      const addr = authProxyServer!.address();
      if (addr && typeof addr === 'object') {
        authProxyPort = addr.port;
        console.log(`[AuthProxy] Started on http://127.0.0.1:${authProxyPort} → ${authProxyTarget}`);
        resolve(`http://127.0.0.1:${authProxyPort}`);
      } else {
        reject(new Error('Failed to get proxy address'));
      }
    });
    authProxyServer.on('error', reject);
  });
}

function getAuthProxyUrl(): string | null {
  return authProxyPort ? `http://127.0.0.1:${authProxyPort}` : null;
}

// ── Types ──

type MessageContent = string | Array<{ type: string; [key: string]: unknown }>;

interface StreamingInputMessage {
  type: 'user';
  message: { role: 'user'; content: MessageContent };
}

interface ClaudeAgentConfig {
  apiKey: string;
  llmProxyUrl: string;
  model?: string;
}

interface EventProcessingContext {
  config: ClaudeAgentConfig;
  metadataEmitted: boolean;
  currentSessionId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFunction = (opts: any) => AsyncGenerator<any, void, unknown>;

let queryFn: QueryFunction | null = null;
let config: ClaudeAgentConfig | null = null;

// ── SDK Loading ──

async function loadSDK(): Promise<QueryFunction> {
  if (queryFn) return queryFn;
  try {
    const sdk = await import('@anthropic-ai/claude-agent-sdk');
    queryFn = sdk.query as QueryFunction;
    return queryFn;
  } catch (error) {
    throw new Error(`Failed to load Claude Agent SDK: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ── System Prompt ──

function loadSystemPrompt(): string {
  // Try to load skill files from the ai-suites project
  const skillsDir = path.resolve(__dirname, '../../skills');
  let skillContent = '';
  if (fs.existsSync(skillsDir)) {
    const walkSkills = (dir: string): string[] => {
      const results: string[] = [];
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) results.push(...walkSkills(path.join(dir, entry.name)));
          else if (entry.name === 'SKILL.md') results.push(path.join(dir, entry.name));
        }
      } catch { /* skip */ }
      return results;
    };
    const skillFiles = walkSkills(skillsDir);
    skillContent = skillFiles.map(f => {
      try { return fs.readFileSync(f, 'utf-8'); } catch { return ''; }
    }).filter(Boolean).join('\n\n---\n\n');
  }

  return `You are AI Suites, a unified AI-native platform for web personalization and paid media campaign management by Treasure Data.

You help users with:
- Creating and managing web personalization campaigns
- Creating and managing paid media campaigns across Meta, Google, and TikTok
- Audience selection and targeting
- Content creation and A/B testing
- Campaign optimization and reporting

${skillContent}`;
}

// ── Initialization ──

export function initClaudeAgent(): void {
  const settings = loadSettings();
  const apiKey = process.env.API_KEY || settings.apiKey;
  const llmProxyUrl = process.env.LLM_PROXY_URL || settings.llmProxyUrl || 'https://llm-proxy.us01.treasuredata.com';
  const model = process.env.MODEL || settings.model;

  if (apiKey) {
    config = { apiKey, llmProxyUrl, model };
    console.log('[ClaudeAgent] Initialized with API key');
  } else {
    console.warn('[ClaudeAgent] No API key found. Chat will not work until configured.');
  }

  // Start the auth proxy for TD LLM Proxy authentication
  startAuthProxy(llmProxyUrl).catch((err) => {
    console.error('[ClaudeAgent] Failed to start auth proxy:', err);
  });
}

export function isInitialized(): boolean {
  return config !== null && !!config.apiKey;
}

export function updateConfig(updates: Partial<ClaudeAgentConfig>): void {
  // Sanitize API key on input — copy-paste from docs can introduce smart quotes/em dashes
  if (updates.apiKey) {
    updates.apiKey = updates.apiKey
      .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
  }

  if (config) {
    config = { ...config, ...updates };
  } else if (updates.apiKey) {
    config = {
      apiKey: updates.apiKey,
      llmProxyUrl: updates.llmProxyUrl || 'https://llm-proxy.us01.treasuredata.com',
      model: updates.model,
    };
  }

  // Restart auth proxy if LLM proxy URL changed
  if (updates.llmProxyUrl && config) {
    if (authProxyServer) {
      authProxyTarget = config.llmProxyUrl;
      console.log(`[AuthProxy] Target updated to ${authProxyTarget}`);
    } else {
      startAuthProxy(config.llmProxyUrl).catch((err) => {
        console.error('[ClaudeAgent] Failed to start auth proxy:', err);
      });
    }
  }
}

// ── Auth Error Detection ──

function detectAuthError(message: string): string | null {
  const isAuthFailure =
    (message.includes('401') || message.includes('403')) &&
    (message.includes('Authentication failed') ||
     message.includes('Unauthorized') ||
     message.includes('Failed to Login') ||
     message.includes('Access denied'));
  if (isAuthFailure) {
    return 'Authentication failed. Your API key was rejected by the LLM proxy. Please check your API key in Settings.';
  }
  return null;
}

// ── SDK Message Processing ──

const MAX_TOOL_RESULT_LENGTH = 50_000;

function* processSDKMessage(
  sdkMessage: Record<string, unknown>,
  ctx: EventProcessingContext,
  fullContent: { value: string }
): Generator<ChatStreamEvent, EventProcessingContext, unknown> {
  if (sdkMessage.type === 'system' && (sdkMessage as any).subtype === 'init') {
    ctx.currentSessionId = (sdkMessage as any).session_id as string;
    if (!ctx.metadataEmitted) {
      yield { type: 'metadata', data: { sessionId: ctx.currentSessionId, agentId: ctx.config.model || 'sonnet' } };
      ctx.metadataEmitted = true;
    }
  } else if (sdkMessage.type === 'assistant') {
    const assistantMsg = (sdkMessage as any).message as any;
    if (assistantMsg?.content) {
      for (const block of assistantMsg.content) {
        if (block.type === 'tool_use') {
          yield { type: 'event', data: { type: 'tool_call', tool: block.name || 'unknown', toolUseId: block.id, input: block.input || {} } };
        }
      }
    }
  } else if (sdkMessage.type === 'user') {
    const userMsg = (sdkMessage as any).message as any;
    if (userMsg?.content) {
      for (const block of userMsg.content) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          let resultContent: string;
          if (typeof block.content === 'string') resultContent = block.content;
          else if (Array.isArray(block.content)) resultContent = block.content.map((item: any) => item.text || JSON.stringify(item)).join('\n');
          else if (block.content) resultContent = JSON.stringify(block.content);
          else resultContent = '';
          yield { type: 'event', data: { type: 'tool_result', toolUseId: block.tool_use_id, result: resultContent?.slice(0, MAX_TOOL_RESULT_LENGTH) || 'Completed', ...(block.is_error && { isError: true }) } };
        }
      }
    }
  } else if (sdkMessage.type === 'stream_event') {
    const event = (sdkMessage as any).event as any;
    if (event?.type === 'content_block_start' && event.content_block?.type === 'thinking') {
      yield { type: 'event', data: { type: 'thinking_start' } };
    }
    if (event?.type === 'content_block_delta' && event.delta) {
      if (event.delta.type === 'text_delta' && event.delta.text) {
        fullContent.value += event.delta.text;
        yield { type: 'event', data: { type: 'content', content: event.delta.text } };
      } else if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
        yield { type: 'event', data: { type: 'thinking', content: event.delta.thinking } };
      }
    }
  } else if (sdkMessage.type === 'result') {
    const result = (sdkMessage as any).result;
    if (result && !fullContent.value) {
      fullContent.value = result;
      yield { type: 'event', data: { type: 'content', content: result } };
    }
  }
  return ctx;
}

// ── Session Management ──

interface ChatSession {
  sessionId: string;
  messageQueue: StreamingInputMessage[];
  resolveNext: ((msg: StreamingInputMessage | null) => void) | null;
  isEnded: boolean;
  sseResponse: Response | null;
  abortController: AbortController;
}

const sessions = new Map<string, ChatSession>();

function sendSSE(res: Response, event: ChatStreamEvent): void {
  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch { /* client disconnected */ }
}

async function* createMessageGenerator(session: ChatSession): AsyncGenerator<StreamingInputMessage, void, unknown> {
  while (!session.isEnded) {
    if (session.messageQueue.length > 0) {
      yield session.messageQueue.shift()!;
      continue;
    }
    const message = await new Promise<StreamingInputMessage | null>((resolve) => {
      if (session.isEnded) { resolve(null); return; }
      session.resolveNext = resolve;
    });
    if (!message) break;
    yield message;
  }
}

async function pumpResponses(session: ChatSession): Promise<void> {
  if (!config) return;

  try {
    const queryFn = await loadSDK();
    const systemPrompt = loadSystemPrompt();
    const messageGenerator = createMessageGenerator(session);

    const queryOptions = {
      prompt: messageGenerator,
      options: {
        ...(config.model ? { model: config.model } : {}),
        env: {
          ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]),
          ANTHROPIC_API_KEY: config.apiKey,
          ANTHROPIC_BASE_URL: getAuthProxyUrl() || config.llmProxyUrl,
          PATH: process.env.PATH || '',
          CLAUDE_CODE_USE_BEDROCK: 'false',
          CLAUDE_CODE_USE_VERTEX: 'false',
        },
        cwd: process.cwd(),
        allowedTools: ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch'],
        permissionMode: 'bypassPermissions',
        includePartialMessages: true,
        maxThinkingTokens: 1024,
        maxTurns: 100,
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: systemPrompt,
        },
        stderr: (message: string) => {
          const authErr = detectAuthError(message);
          if (authErr && session.sseResponse) {
            sendSSE(session.sseResponse, { type: 'error', data: { message: authErr } });
            session.abortController.abort();
          }
        },
        abortController: session.abortController,
      },
    };

    const queryInstance = queryFn(queryOptions);
    const ctx: EventProcessingContext = { config, metadataEmitted: false };
    const fullContent = { value: '' };

    for await (const sdkMessage of queryInstance as AsyncGenerator<Record<string, unknown>, void, unknown>) {
      if (session.isEnded || !session.sseResponse) break;

      for (const event of processSDKMessage(sdkMessage, ctx, fullContent)) {
        sendSSE(session.sseResponse, event);
      }

      if (sdkMessage.type === 'result') {
        fullContent.value = '';
        sendSSE(session.sseResponse, { type: 'done' });
      }
    }

    if (session.sseResponse) {
      sendSSE(session.sseResponse, { type: 'done' });
    }
  } catch (error) {
    if (session.sseResponse && !session.isEnded) {
      sendSSE(session.sseResponse, {
        type: 'error',
        data: { message: error instanceof Error ? error.message : String(error) },
      });
    }
  }
}

export function startSession(sessionId: string, res: Response): void {
  // Clean up existing session with same ID
  const existing = sessions.get(sessionId);
  if (existing) {
    existing.isEnded = true;
    existing.abortController.abort();
    if (existing.resolveNext) existing.resolveNext(null);
    sessions.delete(sessionId);
  }

  const session: ChatSession = {
    sessionId,
    messageQueue: [],
    resolveNext: null,
    isEnded: false,
    sseResponse: res,
    abortController: new AbortController(),
  };

  sessions.set(sessionId, session);

  // Clean up on client disconnect
  res.on('close', () => {
    session.isEnded = true;
    session.sseResponse = null;
    if (session.resolveNext) session.resolveNext(null);
    sessions.delete(sessionId);
  });

  // Start pumping responses in background
  pumpResponses(session).catch((err) => {
    console.error('[ChatSession] Pump error:', err);
  });
}

export function pushMessage(sessionId: string, content: MessageContent): boolean {
  const session = sessions.get(sessionId);
  if (!session || session.isEnded) return false;

  const message: StreamingInputMessage = {
    type: 'user',
    message: { role: 'user', content },
  };

  if (session.resolveNext) {
    const resolver = session.resolveNext;
    session.resolveNext = null;
    resolver(message);
  } else {
    session.messageQueue.push(message);
  }
  return true;
}

export function stopSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.abortController.abort();
  if (session.sseResponse) {
    sendSSE(session.sseResponse, { type: 'done' });
  }
  session.isEnded = true;
  if (session.resolveNext) session.resolveNext(null);
  sessions.delete(sessionId);
}

export function hasSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  return session !== undefined && !session.isEnded;
}

// ── Connection Test ──

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  // On serverless (Vercel), config may not be initialized yet — read from storage
  if (!config?.apiKey) {
    const settings = loadSettings();
    const apiKey = process.env.API_KEY || settings.apiKey;
    if (apiKey) {
      updateConfig({
        apiKey,
        llmProxyUrl: process.env.LLM_PROXY_URL || settings.llmProxyUrl || 'https://llm-proxy.us01.treasuredata.com',
        model: process.env.MODEL || settings.model,
      });
    }
  }
  if (!config?.apiKey) {
    return { success: false, error: 'No API key configured.' };
  }
  const baseUrl = (config.llmProxyUrl || 'https://llm-proxy.us01.treasuredata.com').trim();
  // Sanitize API key: replace smart quotes/dashes from copy-paste with ASCII equivalents
  const sanitizedKey = config.apiKey
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")  // smart quotes → straight
    .replace(/[\u2013\u2014]/g, '-')                // en/em dash → hyphen
    .replace(/[^\x20-\x7E]/g, '')                   // strip any remaining non-ASCII
    .trim();
  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `TD1 ${sanitizedKey}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok || response.status === 200) return { success: true };
    const body = await response.text().catch(() => '');
    if (response.status === 401) return { success: false, error: `Authentication failed (401). ${body.substring(0, 200)}` };
    if (response.status === 403) return { success: false, error: 'Access denied (403).' };
    if (response.status === 400 && !body.includes('Authentication')) return { success: true };
    return { success: false, error: `HTTP ${response.status}: ${body.substring(0, 200)}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Connection failed: ${msg}` };
  }
}
