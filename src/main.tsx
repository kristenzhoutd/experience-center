/**
 * Web entry point for AI Suites.
 *
 * Initializes the web backend adapter (which sets window.aiSuites
 * to use HTTP/SSE instead of Electron IPC), then bootstraps React.
 */

// Initialize backend BEFORE any React code runs
import { initBackend } from './services/backend';
import { initializeGA } from './utils/analytics';
import { loadMarketoScript } from './utils/marketo';

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/manrope/300.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

console.log('AI Suites Web - Starting...');

async function bootstrap() {
  await initBackend();
  initializeGA();
  loadMarketoScript();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();
