/**
 * Notification Store — Zustand store for notification management.
 */

import { create } from 'zustand';
import type {
  NotificationPayload,
  NotificationHistoryItem,
  NotificationPreferences,
} from '../types/notification';

interface NotificationState {
  notifications: NotificationHistoryItem[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isOpen: boolean;

  // Actions
  addNotification: (payload: NotificationPayload) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setOpen: (open: boolean) => void;
  setPreferences: (prefs: Partial<NotificationPreferences>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  preferences: {
    enabled: true,
    browser: false,
    sound: false,
    toast: true,
  },
  isOpen: false,

  addNotification: (payload) =>
    set((state) => {
      const item: NotificationHistoryItem = {
        id: payload.id,
        queryId: payload.chatId || '',
        chatId: payload.chatId || '',
        queryPreview: payload.queryPreview || '',
        responsePreview: payload.body,
        timestamp: Date.now(),
        read: false,
      };
      return {
        notifications: [item, ...state.notifications].slice(0, 100),
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  setOpen: (open) => set({ isOpen: open }),

  setPreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
}));
