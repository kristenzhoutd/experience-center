import { useState, useEffect } from 'react';
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

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.aiSuites?.settings.get();
        if (settings) {
          if (settings.tdxApiKey) setTdxApiKey(settings.tdxApiKey as string);
          if (settings.tdxEndpoint) setTdxEndpoint(settings.tdxEndpoint as string);
          if (settings.tdxDatabase) setTdxDatabase(settings.tdxDatabase as string);
          if (settings.apiKey) setApiKey(settings.apiKey as string);
          if (settings.llmProxyUrl) setLlmProxyUrl(settings.llmProxyUrl as string);
          if (settings.model) setModel(settings.model as string);
          if (settings.imageGenAgentName) {
            const val = settings.imageGenAgentName as string;
            const lastSlash = val.lastIndexOf('/');
            if (lastSlash > 0) {
              setSelectedProject(val.slice(0, lastSlash));
              setSelectedAgent(val.slice(lastSlash + 1));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
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

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await window.aiSuites?.settings.set({
        tdxApiKey: tdxApiKey || undefined,
        tdxEndpoint: tdxEndpoint || TDX_REGIONS[0].value,
        tdxDatabase: tdxDatabase || undefined,
        apiKey,
        llmProxyUrl: llmProxyUrl || DEFAULT_LLM_PROXY_URL,
        model: model || undefined,
        imageGenAgentName: selectedProject && selectedAgent ? `${selectedProject}/${selectedAgent}` : undefined,
      });
      setSaveMessage('Configuration saved successfully.');
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveMessage('Failed to save configuration.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleTestConnection = async () => {
    await handleSaveAll();
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await window.aiSuites?.settings.testConnection();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Failed to run connection test.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Configure your account and AI settings</p>
      </div>

      <div className="p-6 space-y-6 max-w-3xl">
        {/* TDX Account Configuration */}
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

            {/* TDX API Key */}
            <TextField
              label="TDX API Key"
              helpText="Your Treasure Data API master key from TD Console. Used for TDX CLI, segments, and data queries."
              type="password"
              value={tdxApiKey}
              onChange={(e) => setTdxApiKey(e.target.value)}
              placeholder="1/xxxxxxxxxxxxxxxx"
            />

            {/* Database */}
            <TextField
              label="Database"
              helpText="The Treasure Data database containing your audience tables (optional)."
              value={tdxDatabase}
              onChange={(e) => setTdxDatabase(e.target.value)}
              placeholder="e.g. cdp_audience"
            />

            {/* Connection status */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {tdxApiKey ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-500">TDX API key configured</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-500">No TDX API key configured</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Configuration */}
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

            {/* LLM API Key */}
            <TextField
              label="LLM Proxy API Key"
              helpText="API key for authenticating with the LLM proxy. May differ from the TDX API key."
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="1/xxxxxxxxxxxxxxxx"
            />

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Image Generation Agent
                </label>
                <button
                  onClick={fetchProjects}
                  disabled={loadingProjects}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {loadingProjects ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  disabled={loadingProjects || projects.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                >
                  <option value="">
                    {projects.length === 0 ? 'Click Refresh to load' : 'Select project...'}
                  </option>
                  {projects.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
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
              {agentError && (
                <p className="text-xs text-red-500 mt-1">{agentError}</p>
              )}
              {selectedProject && selectedAgent && (
                <p className="text-xs text-green-600 mt-1 font-mono">
                  {selectedProject}/{selectedAgent}
                </p>
              )}
              {!agentError && !selectedAgent && (
                <p className="text-xs text-gray-400 mt-1">
                  Select the Agent Foundry project and agent for image generation.
                </p>
              )}
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {apiKey ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-500">LLM API key configured</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-500">No LLM API key configured (demo mode active)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save & Test — shared for both sections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || (!apiKey && !tdxApiKey)}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>

          {/* Connection test result */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {testResult.success ? (
                'Connection successful! The proxy accepted your API key.'
              ) : (
                <div>
                  <span className="font-medium">Connection failed:</span>{' '}
                  {testResult.error}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
