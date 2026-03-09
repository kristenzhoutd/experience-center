/**
 * Chat History Storage — localStorage-backed CRUD for chat messages, keyed per brief ID.
 * Handles Date serialization for ChatMessage.timestamp.
 */

import type { ChatMessage } from '../types/shared';

const KEY_PREFIX = 'paid-media-suite:chat:';

interface SerializedChatMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: string; // ISO string
}

function storageKey(briefId: string): string {
  return `${KEY_PREFIX}${briefId}`;
}

function serialize(messages: ChatMessage[]): string {
  const serialized: SerializedChatMessage[] = messages.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : String(msg.timestamp),
  }));
  return JSON.stringify(serialized);
}

function deserialize(raw: string): ChatMessage[] {
  const parsed: SerializedChatMessage[] = JSON.parse(raw);
  return parsed.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));
}

export const chatHistoryStorage = {
  getMessages(briefId: string): ChatMessage[] {
    try {
      const raw = localStorage.getItem(storageKey(briefId));
      if (!raw) return [];
      return deserialize(raw);
    } catch {
      return [];
    }
  },

  saveMessages(briefId: string, messages: ChatMessage[]): void {
    try {
      localStorage.setItem(storageKey(briefId), serialize(messages));
    } catch (e) {
      console.warn('[chatHistoryStorage] Failed to save messages:', e);
    }
  },

  deleteMessages(briefId: string): void {
    localStorage.removeItem(storageKey(briefId));
  },
};
