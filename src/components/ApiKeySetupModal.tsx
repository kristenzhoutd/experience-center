/**
 * API Key Setup Modal — configure LLM proxy and TDX account credentials.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { storage } from '../utils/storage';

interface ApiKeySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_LLM_PROXY_URL = 'https://llm-proxy.us01.treasuredata.com';

const TDX_REGIONS = [
  { value: 'https://api.treasuredata.com', label: 'US' },
  { value: 'https://api.eu01.treasuredata.com', label: 'EU' },
  { value: 'https://api.ap01.treasuredata.com', label: 'AP01' },
  { value: 'https://api.ap02.treasuredata.com', label: 'AP02' },
  { value: 'https://api.ap03.treasuredata.com', label: 'AP03' },
];

export default function ApiKeySetupModal({ isOpen, onClose }: ApiKeySetupModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [llmProxyUrl, setLlmProxyUrl] = useState(DEFAULT_LLM_PROXY_URL);
  const [tdxApiKey, setTdxApiKey] = useState('');
  const [tdxEndpoint, setTdxEndpoint] = useState(TDX_REGIONS[0].value);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasStoredApiKey = (() => { try { return !!storage.getItem('ai-suites-api-key'); } catch { return false; } })();
  const hasStoredTdxKey = (() => { try { return !!storage.getItem('ai-suites-tdx-api-key'); } catch { return false; } })();

  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        try {
          const settings = await window.aiSuites?.settings?.get();
          if (settings?.llmProxyUrl) setLlmProxyUrl(settings.llmProxyUrl as string);
          if (settings?.tdxEndpoint) setTdxEndpoint(settings.tdxEndpoint as string);
        } catch { /* ignore */ }
      };
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim() && !hasStoredApiKey) return;
    setStatus('testing');
    setErrorMessage('');

    try {
      const settingsToSave: Record<string, string> = {
        llmProxyUrl: llmProxyUrl || DEFAULT_LLM_PROXY_URL,
        tdxEndpoint,
      };
      if (apiKey.trim()) settingsToSave.apiKey = apiKey.trim();
      if (tdxApiKey.trim()) settingsToSave.tdxApiKey = tdxApiKey.trim();

      await window.aiSuites?.settings?.set(settingsToSave);

      const result = await window.aiSuites?.settings?.testConnection();
      if (result?.success) {
        setStatus('success');
        // Refetch parent segments if TDX key was provided
        if (tdxApiKey.trim()) {
          useSettingsStore.getState().refetchParentSegments();
        }
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setApiKey('');
          setTdxApiKey('');
        }, 1200);
      } else {
        setStatus('error');
        setErrorMessage(result?.error || 'Connection failed. Please check your API key.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Failed to save settings.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Key className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Connect to Treasure AI
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure your API keys to enable AI-powered experiences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-2 space-y-5">
          {/* AI Configuration */}
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Configuration</div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">LLM Proxy URL</label>
                <input
                  type="text"
                  value={llmProxyUrl}
                  onChange={(e) => setLlmProxyUrl(e.target.value)}
                  placeholder={DEFAULT_LLM_PROXY_URL}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                  API Key
                  {hasStoredApiKey && <span className="text-emerald-500 ml-1.5">configured</span>}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); if (status !== 'testing') setStatus('idle'); }}
                  placeholder={hasStoredApiKey ? '••••••••••••••••' : 'Enter your LLM proxy API key'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* TDX Account */}
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">TDX Account <span className="text-gray-300 font-normal normal-case">(optional)</span></div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Region</label>
                <div className="flex gap-1.5">
                  {TDX_REGIONS.map((region) => (
                    <button
                      key={region.value}
                      onClick={() => setTdxEndpoint(region.value)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                        tdxEndpoint === region.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                  TDX API Key
                  {hasStoredTdxKey && <span className="text-emerald-500 ml-1.5">configured</span>}
                </label>
                <input
                  type="password"
                  value={tdxApiKey}
                  onChange={(e) => setTdxApiKey(e.target.value)}
                  placeholder={hasStoredTdxKey ? '••••••••••••••••' : 'Enter your Treasure Data API key'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Connected successfully
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end pt-1">
            {status === 'success' ? (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                Connected
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={(!apiKey.trim() && !hasStoredApiKey) || status === 'testing'}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  (apiKey.trim() || hasStoredApiKey) && status !== 'testing'
                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {status === 'testing' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            )}
          </div>

          {/* Help text */}
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Your keys are stored locally in your browser. You can update them anytime in Settings.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Check if both API keys are configured */
export function isApiKeyConfigured(): boolean {
  try {
    return !!storage.getItem('ai-suites-api-key') && !!storage.getItem('ai-suites-tdx-api-key');
  } catch {
    return false;
  }
}
