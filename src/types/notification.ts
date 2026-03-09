// Notification types for AI Agent Alerting

export type NotificationType = 'browser' | 'toast' | 'sound' | 'all';

export interface NotificationPreferences {
  enabled: boolean;
  browser: boolean;
  sound: boolean;
  toast: boolean;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'info' | 'warning' | 'error';
  chatId?: string;
  timestamp: Date;
  queryPreview?: string;
}

export interface QueryNotificationState {
  queryId: string;
  chatId: string;
  queryPreview: string;
  notifyWhenComplete: boolean;
  startTime: number;
  pagePath?: string; // Track which page the query was started from
  blueprintId?: string; // Track blueprint ID when available
}

export interface NotificationHistoryItem {
  id: string;
  queryId: string;
  chatId: string;
  queryPreview: string;
  responsePreview: string;
  timestamp: number;
  read: boolean;
  pagePath?: string;
  blueprintId?: string; // Blueprint ID to restore on navigation
}

export type PermissionStatus = 'default' | 'granted' | 'denied';
