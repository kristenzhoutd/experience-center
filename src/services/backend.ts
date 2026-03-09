/**
 * Backend adapter — auto-detects Electron vs web and provides
 * the appropriate implementation for window.aiSuites.
 *
 * In web mode: uses HTTP/SSE via webBackend
 * In Electron mode: uses the native IPC bridge (window.aiSuites)
 */

import { webBackend } from './web-backend';

/**
 * Detect if running inside Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).aiSuites?.chat?.startSession;
}

/**
 * Get the backend adapter.
 * In Electron, returns the native window.aiSuites.
 * In web mode, returns the HTTP/SSE adapter.
 */
export function getBackend() {
  if (isElectron()) {
    return (window as any).aiSuites;
  }
  return webBackend;
}

/**
 * Initialize the backend on window.aiSuites for web mode.
 * This makes all existing code that uses window.aiSuites work
 * without any changes.
 */
export function initBackend(): void {
  if (!isElectron()) {
    (window as any).aiSuites = webBackend;
    console.log('[Backend] Initialized web backend adapter');
  } else {
    console.log('[Backend] Using Electron IPC backend');
  }
}
