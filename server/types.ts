/**
 * Shared types for the web server — mirrors electron/utils/ipc-types.ts
 */

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  workingDirectory?: string;
  apiKey?: string;
  tdxApiKey?: string;
  tdxEndpoint?: string;
  tdxDatabase?: string;
  llmProxyUrl?: string;
  model?: string;
  imageGenAgentName?: string;
  selectedParentSegmentId?: string;
  hasSavedCredentials?: boolean;
  platformConnections?: {
    meta?: { accessToken?: string; adAccountId?: string; businessId?: string; appId?: string; appSecret?: string; connected: boolean };
    google?: { refreshToken?: string; customerId?: string; connected: boolean };
    tiktok?: { accessToken?: string; advertiserId?: string; connected: boolean };
  };
  aemConnection?: {
    host: string;
    clientId: string;
    clientSecret?: string;
    imsOrgId?: string;
    deliveryBaseUrl?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: number;
    connected: boolean;
    authMethod?: 'oauth' | 's2s' | 'token';
    apiVersion?: 'legacy' | 'openapi';
    scopes?: string;
  };
}

export type ChatStreamEvent =
  | { type: 'metadata'; data: { sessionId?: string; agentId?: string } }
  | { type: 'event'; data: ChatEvent }
  | { type: 'done' }
  | { type: 'error'; data: { message: string } };

export type ChatEvent =
  | { type: 'content'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'thinking_start' }
  | { type: 'tool_call'; tool: string; toolUseId?: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolUseId: string; result: string; isError?: boolean };

export interface StoredToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'running' | 'completed' | 'error' | 'interrupted';
}

export type StoredStreamSegment =
  | { type: 'content'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; toolCall: StoredToolCall };

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: StoredToolCall[];
  segments?: StoredStreamSegment[];
  attachments?: { id: string; name: string; path: string; type: string }[];
}

export interface StoredChat {
  id: string;
  title: string;
  summary?: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
}

export interface BlueprintChannelAllocation {
  name: string;
  budgetPercent?: number;
  budgetAmount?: string;
  role?: string;
  formats?: string[];
  expectedMetrics?: Record<string, string>;
}

export interface Blueprint {
  id: string;
  name: string;
  variant: 'conservative' | 'balanced' | 'aggressive';
  confidence: 'High' | 'Medium' | 'Low';
  channels: string[];
  channelAllocations?: BlueprintChannelAllocation[];
  audiences: string[];
  budget: { amount: string; pacing: string };
  metrics: { reach: string; ctr: string; roas: string; conversions: string };
  messaging: string;
  cta: string;
  creativeBrief?: {
    primaryAngle: string;
    confidence: string;
    supportingMessages: string[];
    recommendedFormats: string[];
    fatigueRisk: string[];
    refreshPlan: string[];
  };
  createdAt: string;
  updatedAt: string;
  briefId?: string;
  version: number;
  audienceSegmentIds?: Record<string, string>;
}

export type PlatformType = 'meta' | 'google' | 'tiktok';

export interface PlatformConnection {
  platform: PlatformType;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  businessId?: string;
  lastSyncedAt?: string;
}
