/**
 * Web entry point for AI Suites.
 *
 * Initializes the web backend adapter (which sets window.aiSuites
 * to use HTTP/SSE instead of Electron IPC), then bootstraps React.
 */

import { initBackend } from './services/backend';

// Initialize backend BEFORE any React code runs,
// so all stores/components that reference window.aiSuites
// get the web adapter.
initBackend();

// Now dynamically import the rest of the app
async function bootstrap() {
  const React = await import('react');
  const ReactDOM = await import('react-dom/client');

  // Import fonts
  await import('@fontsource/manrope/300.css');
  await import('@fontsource/manrope/400.css');
  await import('@fontsource/manrope/500.css');
  await import('@fontsource/manrope/600.css');
  await import('@fontsource/manrope/700.css');

  // Import the App component from the shared source
  const { default: App } = await import('./App');
  const { default: ErrorBoundary } = await import('./components/ErrorBoundary');
  const { default: PasswordGate } = await import('./components/PasswordGate');
  await import('./styles/globals.css');

  console.log('AI Suites Web - Starting...');

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(
        ErrorBoundary,
        null,
        React.createElement(PasswordGate, null, React.createElement(App))
      )
    )
  );
}

bootstrap().catch((error) => {
  console.error('Fatal startup error:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; margin: 20px; border: 2px solid #dc2626; border-radius: 8px; background: #fee; font-family: monospace;">
      <h1 style="color: #dc2626;">Startup Error</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <pre style="margin-top: 10px; padding: 10px; background: #fff; overflow: auto;">${error instanceof Error ? error.stack : ''}</pre>
    </div>
  `;
});
