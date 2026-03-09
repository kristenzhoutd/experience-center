/**
 * Global type declarations for AI Suites Web.
 *
 * In web mode, window.aiSuites is provided by the web backend adapter.
 * We use 'any' here to stay compatible with both Electron and web types.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aiSuites: any;
  }
}

export {};
