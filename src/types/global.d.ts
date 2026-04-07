declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aiSuites: any;
    dataLayer: Record<string, unknown>[];
    gtag: (...args: [string, ...unknown[]]) => void;
  }
}

export {};
