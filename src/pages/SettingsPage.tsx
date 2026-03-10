import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, TextField, Select } from '@/design-system';

const DEFAULT_LLM_PROXY_URL = 'https://llm-proxy.us01.treasuredata.com';

const TDX_REGIONS = [
  { value: 'https://api.treasuredata.com', label: 'US (api.treasuredata.com)' },
  { value: 'https://api.eu01.treasuredata.com', label: 'EU (api.eu01.treasuredata.com)' },
  { value: 'https://api.ap01.treasuredata.com', label: 'AP01 (api.ap01.treasuredata.com)' },
  { value: 'https://api.ap02.treasuredata.com', label: 'AP02 (api.ap02.treasuredata.com)' },
  { value: 'https://api.ap03.treasuredata.com', label: 'AP03 (api.ap03.treasuredata.com)' },
];

const MODEL_OPTIONS = [
  { value: '', label: 'Default (Sonnet)' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-haiku-3-5-20241022', label: 'Claude 3.5 Haiku' },
];

/** Inline status shown below an API key field after test/save */
function ConnectionStatus({ status, error }: { status: 'idle' | 'testing' | 'success' | 'error'; error?: string }) {
  if (status === 'idle') return null;
  if (status === 'testing') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-xs text-gray-500">Testing connection...</span>
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-xs text-gray-500">API key configured</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs text-gray-500">{error || 'Connection failed'}</span>
    </div>
  );
}

export default function SettingsPage() {
  // TDX account state
  const [tdxApiKey, setTdxApiKey] = useState('');
  const [tdxEndpoint, setTdxEndpoint] = useState(TDX_REGIONS[0].value);
  const [tdxDatabase, setTdxDatabase] = useState('');

  // AI configuration state
  const [apiKey, setApiKey] = useState('');
  const [llmProxyUrl, setLlmProxyUrl] = useState(DEFAULT_LLM_PROXY_URL);
  const [model, setModel] = useState('');
  // Image Gen Agent state
  const [projects, setProjects] = useState<{ name: string }[]>([]);
  const [agents, setAgents] = useState<{ name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [savedAgentName, setSavedAgentName] = useState('');
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  // Track whether credentials are already saved in keychain
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  const [hasStoredTdxApiKey, setHasStoredTdxApiKey] = useState(false);

  // Inline connection test status per key
  const [aiKeyStatus, setAiKeyStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [aiKeyError, setAiKeyError] = useState<string | undefined>();
  const [tdxKeyStatus, setTdxKeyStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [tdxKeyError, setTdxKeyError] = useState<string | undefined>();

  // Section save state
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [aiSaveMessage, setAiSaveMessage] = useState<string | null>(null);
  const [isSavingTdx, setIsSavingTdx] = useState(false);
  const [tdxSaveMessage, setTdxSaveMessage] = useState<string | null>(null);

  // Auto-save debounce ref for TDX API key
  const tdxAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.aiSuites?.settings.get();
        if (settings) {
          if (settings.tdxEndpoint) setTdxEndpoint(settings.tdxEndpoint as string);
          if (settings.tdxDatabase) setTdxDatabase(settings.tdxDatabase as string);
          if (settings.llmProxyUrl) setLlmProxyUrl(settings.llmProxyUrl as string);
          if (settings.model) setModel(settings.model as string);
          if (settings.imageGenAgentName) {
            const val = settings.imageGenAgentName as string;
            setSavedAgentName(val);
            const lastSlash = val.lastIndexOf('/');
            if (lastSlash > 0) {
              setSelectedProject(val.slice(0, lastSlash));
              setSelectedAgent(val.slice(lastSlash + 1));
            }
          }
          if (settings.hasStoredApiKey) {
            setHasStoredApiKey(true);
            setAiKeyStatus('success');
          }
          if (settings.hasStoredTdxApiKey) {
            setHasStoredTdxApiKey(true);
            setTdxKeyStatus('success');
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (tdxAutoSaveTimer.current) clearTimeout(tdxAutoSaveTimer.current);
    };
  }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    setAgentError(null);
    try {
      const result = await window.aiSuites?.settings.listProjects();
      if (result?.success && result.data) {
        setProjects(result.data);
      } else {
        setAgentError(result?.error || 'Failed to fetch projects');
      }
    } catch {
      setAgentError('Failed to fetch projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchAgents = async (projectName: string) => {
    setLoadingAgents(true);
    setAgentError(null);
    setAgents([]);
    setSelectedAgent('');
    try {
      const result = await window.aiSuites?.settings.listAgents(projectName);
      if (result?.success && result.data) {
        setAgents(result.data);
      } else {
        setAgentError(result?.error || 'Failed to fetch agents');
      }
    } catch {
      setAgentError('Failed to fetch agents');
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleProjectChange = (projectName: string) => {
    setSelectedProject(projectName);
    if (projectName) {
      fetchAgents(projectName);
    } else {
      setAgents([]);
      setSelectedAgent('');
    }
  };

  // --- AI Key: Test Connection (saves all AI settings + tests) ---
  const handleTestAiKey = async () => {
    setAiKeyStatus('testing');
    setAiKeyError(undefined);
    try {
      await window.aiSuites?.settings.set({
        ...(apiKey ? { apiKey } : {}),
        llmProxyUrl: llmProxyUrl || DEFAULT_LLM_PROXY_URL,
        model: model || undefined,
        imageGenAgentName: savedAgentName || (selectedProject && selectedAgent ? `${selectedProject}/${selectedAgent}` : undefined),
      });
      if (apiKey) {
        setHasStoredApiKey(true);
        setApiKey('');
      }
      const result = await window.aiSuites?.settings.testConnection();
      if (result?.success) {
        setAiKeyStatus('success');
      } else {
        setAiKeyStatus('error');
        setAiKeyError(result?.error || 'Connection failed');
      }
    } catch {
      setAiKeyStatus('error');
      setAiKeyError('Failed to test connection');
    }
  };

  // --- TDX Key: Test Connection (saves all TDX settings + tests) ---
  const handleTestTdxKey = async () => {
    setTdxKeyStatus('testing');
    setTdxKeyError(undefined);
    try {
      await window.aiSuites?.settings.set({
        ...(tdxApiKey ? { tdxApiKey } : {}),
        tdxEndpoint: tdxEndpoint || TDX_REGIONS[0].value,
        tdxDatabase: tdxDatabase || undefined,
      });
      if (tdxApiKey) {
        setHasStoredTdxApiKey(true);
        setTdxApiKey('');
      }
      const result = await window.aiSuites?.settings.testConnection();
      if (result?.success) {
        setTdxKeyStatus('success');
      } else {
        setTdxKeyStatus('error');
        setTdxKeyError(result?.error || 'Connection failed');
      }
    } catch {
      setTdxKeyStatus('error');
      setTdxKeyError('Failed to test connection');
    }
  };

  // --- TDX Section Save ---
  const handleSaveTdx = useCallback(async (autoSave = false) => {
    setIsSavingTdx(true);
    setTdxSaveMessage(null);
    try {
      await window.aiSuites?.settings.set({
        ...(tdxApiKey ? { tdxApiKey } : {}),
        tdxEndpoint: tdxEndpoint || TDX_REGIONS[0].value,
        tdxDatabase: tdxDatabase || undefined,
      });
      if (tdxApiKey) {
        setHasStoredTdxApiKey(true);
        setTdxKeyStatus('success');
        setTdxApiKey('');
      }
      if (!autoSave) setTdxSaveMessage('TDX configuration saved.');
    } catch (error) {
      console.error('Failed to save TDX config:', error);
      setTdxSaveMessage('Failed to save TDX configuration.');
    } finally {
      setIsSavingTdx(false);
      if (!autoSave) setTimeout(() => setTdxSaveMessage(null), 3000);
    }
  }, [tdxApiKey, tdxEndpoint, tdxDatabase]);

  // Auto-save when TDX API key is entered
  const handleTdxApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTdxApiKey(value);
    setTdxKeyStatus('idle');

    if (tdxAutoSaveTimer.current) clearTimeout(tdxAutoSaveTimer.current);

    if (value.trim()) {
      tdxAutoSaveTimer.current = setTimeout(() => {
        handleSaveTdx(true);
      }, 800);
    }
  };

  // --- AI Section Save ---
  const handleSaveAi = async () => {
    setIsSavingAi(true);
    setAiSaveMessage(null);
    try {
      await window.aiSuites?.settings.set({
        ...(apiKey ? { apiKey } : {}),
        llmProxyUrl: llmProxyUrl || DEFAULT_LLM_PROXY_URL,
        model: model || undefined,
        imageGenAgentName: savedAgentName || (selectedProject && selectedAgent ? `${selectedProject}/${selectedAgent}` : undefined),
      });
      if (apiKey) {
        setHasStoredApiKey(true);
        setAiKeyStatus('success');
        setApiKey('');
      }
      setAiSaveMessage('AI configuration saved.');
    } catch (error) {
      console.error('Failed to save AI config:', error);
      setAiSaveMessage('Failed to save AI configuration.');
    } finally {
      setIsSavingAi(false);
      setTimeout(() => setAiSaveMessage(null), 3000);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-3xl">

        {/* AI Configuration — first */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">AI Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure the LLM proxy connection for AI-powered campaign creation.
          </p>

          <div className="space-y-4">
            {/* LLM Proxy URL */}
            <TextField
              label="LLM Proxy URL"
              helpText="The Treasure Data LLM proxy endpoint."
              value={llmProxyUrl}
              onChange={(e) => setLlmProxyUrl(e.target.value)}
              placeholder={DEFAULT_LLM_PROXY_URL}
            />

            {/* LLM API Key with inline Test Connection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">LLM Proxy API Key</label>
                <button
                  onClick={handleTestAiKey}
                  disabled={aiKeyStatus === 'testing' || (!apiKey && !hasStoredApiKey)}
                  className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {aiKeyStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <TextField
                helpText="API key for authenticating with the LLM proxy. May differ from the TDX API key."
                type={apiKey ? 'password' : 'text'}
                value={apiKey || (hasStoredApiKey ? '****************************************' : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  // If user starts typing over the mask, clear it first
                  if (!apiKey && hasStoredApiKey) {
                    setApiKey(val.replace(/\*/g, ''));
                  } else {
                    setApiKey(val);
                  }
                  setAiKeyStatus('idle');
                }}
                onFocus={() => { if (!apiKey && hasStoredApiKey) setApiKey(''); }}
                placeholder="1/xxxxxxxxxxxxxxxx"
              />
              <ConnectionStatus status={aiKeyStatus} error={aiKeyError} />
            </div>

            {/* Model Selection */}
            <Select
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            {/* Image Generation Agent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Generation Agent
              </label>

              {/* Saved agent card */}
              {savedAgentName && !showAgentPicker && (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 01-2.133 1.59h-6.794a2.25 2.25 0 01-2.133-1.59L5 14.5m14 0H5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{savedAgentName.split('/').pop()}</p>
                      <p className="text-xs text-gray-500">{savedAgentName.split('/').slice(0, -1).join('/')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAgentPicker(true)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => {
                        setSavedAgentName('');
                        setSelectedProject('');
                        setSelectedAgent('');
                      }}
                      className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Agent picker */}
              {(!savedAgentName || showAgentPicker) && (
                <>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <select
                        value={selectedProject}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        disabled={loadingProjects || projects.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                        onFocus={() => { if (projects.length === 0) fetchProjects(); }}
                      >
                        <option value="">
                          {loadingProjects ? 'Loading...' : 'Select project...'}
                        </option>
                        {projects.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        disabled={!selectedProject || loadingAgents || agents.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                      >
                        <option value="">
                          {loadingAgents ? 'Loading...' : !selectedProject ? 'Select project first' : agents.length === 0 ? 'No agents found' : 'Select agent...'}
                        </option>
                        {agents.map((a) => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedProject && selectedAgent) {
                          setSavedAgentName(`${selectedProject}/${selectedAgent}`);
                          setShowAgentPicker(false);
                        } else {
                          fetchProjects();
                        }
                      }}
                      disabled={loadingProjects}
                      className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {loadingProjects ? 'Loading...' : selectedProject && selectedAgent ? 'Add' : 'Refresh'}
                    </button>
                  </div>
                  {agentError && (
                    <p className="text-xs text-red-500 mt-1">{agentError}</p>
                  )}
                  {!agentError && !selectedAgent && (
                    <p className="text-xs text-gray-400 mt-1">
                      Select the Agent Foundry project and agent for image generation.
                    </p>
                  )}
                  {showAgentPicker && savedAgentName && (
                    <button
                      onClick={() => setShowAgentPicker(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {/* TDX Account Configuration — second */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">TDX Account</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect to your Treasure Data account for segments, audiences, and data access.
          </p>

          <div className="space-y-4">
            {/* API Endpoint / Region */}
            <Select
              label="API Endpoint"
              helpText="Select the region where your Treasure Data account is hosted."
              value={tdxEndpoint}
              onChange={(e) => setTdxEndpoint(e.target.value)}
            >
              {TDX_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>

            {/* TDX API Key with inline Test Connection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">TDX API Key</label>
                <button
                  onClick={handleTestTdxKey}
                  disabled={tdxKeyStatus === 'testing' || (!tdxApiKey && !hasStoredTdxApiKey)}
                  className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {tdxKeyStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <TextField
                helpText="Your Treasure Data API master key from TD Console. Used for TDX CLI, segments, and data queries."
                type={tdxApiKey ? 'password' : 'text'}
                value={tdxApiKey || (hasStoredTdxApiKey ? '****************************************' : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!tdxApiKey && hasStoredTdxApiKey) {
                    handleTdxApiKeyChange({ target: { value: val.replace(/\*/g, '') } } as React.ChangeEvent<HTMLInputElement>);
                  } else {
                    handleTdxApiKeyChange(e);
                  }
                }}
                onFocus={() => { if (!tdxApiKey && hasStoredTdxApiKey) { handleTdxApiKeyChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>); } }}
                placeholder="1/xxxxxxxxxxxxxxxx"
              />
              <ConnectionStatus status={tdxKeyStatus} error={tdxKeyError} />
            </div>

            {/* Database */}
            <TextField
              label="Database"
              helpText="The Treasure Data database containing your audience tables (optional)."
              value={tdxDatabase}
              onChange={(e) => setTdxDatabase(e.target.value)}
              placeholder="e.g. cdp_audience"
            />

          </div>
        </div>

      </div>
    </div>
  );
}
