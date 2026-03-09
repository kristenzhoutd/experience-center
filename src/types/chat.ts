/**
 * Renderer-side chat types for streaming.
 * These mirror the types in ipc-types.ts but are importable from the renderer.
 */

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'running' | 'completed' | 'error' | 'interrupted';
}

export type StreamSegment =
  | { type: 'content'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall };

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
