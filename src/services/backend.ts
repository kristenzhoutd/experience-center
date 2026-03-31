/**
 * Backend adapter — auto-detects Electron vs web and provides
 * the appropriate implementation for window.aiSuites.
 *
 * In web mode: uses HTTP/SSE via webBackend
 * In Electron mode: uses the native IPC bridge (window.aiSuites)
 */

import { storage } from '../utils/storage';
import { webBackend } from './web-backend';

/**
 * Detect if running inside Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI || !!(window as any).process?.versions?.electron;
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
 * Fetch runtime config from the server and seed sessionStorage
 * with the sandbox API key (for Docker deploys where VITE_ env vars
 * aren't available at build time).
 */
async function fetchRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const { sandboxApiKey } = await res.json();
    if (sandboxApiKey) {
      if (!storage.getItem('ai-suites-api-key')) storage.setItem('ai-suites-api-key', sandboxApiKey);
      if (!storage.getItem('ai-suites-tdx-api-key')) storage.setItem('ai-suites-tdx-api-key', sandboxApiKey);
    }
  } catch { /* ignore — VITE_SANDBOX_API_KEY may handle it at build time instead */ }
}

/**
 * Initialize the backend on window.aiSuites for web mode.
 * This makes all existing code that uses window.aiSuites work
 * without any changes.
 */
export async function initBackend(): Promise<void> {
  if (!isElectron()) {
    (window as any).aiSuites = webBackend;
    await fetchRuntimeConfig();
    console.log('[Backend] Initialized web backend adapter');
  } else {
    console.log('[Backend] Using Electron IPC backend');
  }
}
