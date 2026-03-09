import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

type AemState = 'disconnected' | 'configuring' | 'connecting' | 'connected' | 'error';

export default function PersonalizationSettingsPage() {
  const { organizationId } = useAppStore();

  // AEM connection state
  const [aemState, setAemState] = useState<AemState>('disconnected');
  const [aemHost, setAemHost] = useState('');
  const [aemError, setAemError] = useState('');

  // AEM config form
  const [aemConfig, setAemConfig] = useState({
    host: '',
    clientId: '',
    clientSecret: '',
    imsOrgId: '',
    deliveryBaseUrl: '',
    authMethod: 'token' as 'oauth' | 's2s' | 'token',
    apiVersion: 'legacy' as 'legacy' | 'openapi',
    scopes: '',
    accessToken: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [aemSaved, setAemSaved] = useState(false);

  // Check AEM status and load saved config on mount
  useEffect(() => {
    window.aiSuites.aem.status().then((res) => {
      if (res.success && res.data?.connected) {
        setAemState('connected');
        setAemHost(res.data.host || '');
      }
    });
    // Load saved AEM config to pre-populate form
    window.aiSuites.settings.get().then((settings: any) => {
      const saved = settings.aemConfig;
      if (saved) {
        setAemConfig((prev) => ({
          ...prev,
          host: saved.host || '',
          clientId: saved.clientId || '',
          clientSecret: saved.clientSecret || '',
          imsOrgId: saved.imsOrgId || '',
          deliveryBaseUrl: saved.deliveryBaseUrl || '',
          authMethod: saved.authMethod || 'token',
          apiVersion: saved.apiVersion || 'legacy',
          scopes: saved.scopes || '',
          accessToken: saved.accessToken || '',
        }));
      }
    });
  }, []);

  const handleAemSave = useCallback(async () => {
    await window.aiSuites.settings.set({ aemConfig });
    setAemSaved(true);
    setTimeout(() => setAemSaved(false), 2000);
  }, [aemConfig]);

  const handleAemConnect = useCallback(async () => {
    if (!aemConfig.host) {
      setAemError('AEM Host URL is required.');
      return;
    }
    if (!aemConfig.host.startsWith('https://')) {
      setAemError('AEM Host URL must use HTTPS.');
      return;
    }
    if (aemConfig.authMethod === 'token') {
      if (!aemConfig.accessToken) {
        setAemError('Access Token is required.');
        return;
      }
    } else {
      if (!aemConfig.clientId) {
        setAemError('Client ID is required.');
        return;
      }
      if (aemConfig.authMethod === 's2s' && !aemConfig.clientSecret) {
        setAemError('Client Secret is required for Server-to-Server auth.');
        return;
      }
    }

    setAemState('connecting');
    setAemError('');

    const result = await window.aiSuites.aem.connect(aemConfig);
    if (result.success) {
      setAemState('connected');
      setAemHost(aemConfig.host);
    } else {
      setAemState('error');
      setAemError(result.error || 'Connection failed');
    }
  }, [aemConfig]);

  const handleAemDisconnect = useCallback(async () => {
    await window.aiSuites.aem.disconnect();
    setAemState('disconnected');
    setAemHost('');
    // Keep aemConfig populated — credentials stay in the form so users
    // don't have to re-enter them when reconnecting.
  }, []);

  const snippetCode = `<!-- Web Personalization Snippet -->
<script>
  (function(w, d, s, o) {
    w['WPT'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments) };
    var js = d.createElement(s);
    js.src = 'https://cdn.yourapp.com/snippet.js';
    js.async = true;
    js.setAttribute('data-org-id', '${organizationId}');
    d.head.appendChild(js);
  })(window, document, 'script', 'wpt');
</script>`;

  const otherIntegrations = [
    { name: 'Bynder', description: 'Digital Asset Management', connected: false },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Personalization Settings</h2>
        <p className="text-sm text-gray-500">Configure your personalization suite settings</p>
      </div>

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Installation Snippet */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Installation Snippet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add this code snippet to your website&apos;s &lt;head&gt; tag to enable personalization.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre">{snippetCode}</pre>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(snippetCode)}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700"
          >
            Copy to clipboard
          </button>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Integrations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect external services to enhance personalization.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Adobe AEM — functional card */}
            <div className="border border-gray-200 rounded-lg p-4 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">Adobe AEM</span>
                {aemState === 'connected' ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Connected
                    </span>
                    <button
                      onClick={handleAemDisconnect}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : aemState === 'connecting' ? null
                  : aemState === 'configuring' || aemState === 'error' ? null : (
                  <button
                    onClick={() => setAemState('configuring')}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Connect
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Digital Asset Management</p>

              {/* Connected info */}
              {aemState === 'connected' && aemHost && (
                <p className="text-xs text-gray-400 mt-2 font-mono">{aemHost}</p>
              )}

              {/* Connecting state — waiting for browser sign-in */}
              {aemState === 'connecting' && (
                <div className="mt-3 flex items-center gap-3">
                  {aemConfig.authMethod === 'oauth' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs text-gray-600">Waiting for Adobe sign-in in your browser...</span>
                      <button
                        onClick={() => { setAemState('configuring'); setAemError(''); }}
                        className="text-xs text-red-500 hover:text-red-600 ml-auto"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Connecting...</span>
                  )}
                </div>
              )}

              {/* Config form */}
              {(aemState === 'configuring' || aemState === 'error') && (
                <div className="mt-3 space-y-2">
                  {/* Auth Method Toggle */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24 shrink-0">Auth Method</label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setAemConfig({ ...aemConfig, authMethod: 'token' })}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${aemConfig.authMethod === 'token' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        Access Token
                      </button>
                      <button
                        onClick={() => setAemConfig({ ...aemConfig, authMethod: 'oauth' })}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${aemConfig.authMethod === 'oauth' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        OAuth Web App
                      </button>
                      <button
                        onClick={() => setAemConfig({ ...aemConfig, authMethod: 's2s' })}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${aemConfig.authMethod === 's2s' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        OAuth Server-to-Server
                      </button>
                    </div>
                  </div>

                  {/* Host URL — all methods */}
                  <input
                    type="url"
                    placeholder="AEM Host URL (https://author-p...-e....adobeaemcloud.com)"
                    value={aemConfig.host}
                    onChange={(e) => setAemConfig({ ...aemConfig, host: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                  />

                  {/* Access Token method — just the token */}
                  {aemConfig.authMethod === 'token' && (
                    <>
                      <input
                        type="password"
                        placeholder="Access Token"
                        value={aemConfig.accessToken}
                        onChange={(e) => setAemConfig({ ...aemConfig, accessToken: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                      />
                      <p className="text-xs text-gray-400">
                        Paste a Bearer token from Adobe Developer Console or another source. Token refresh is not supported — reconnect when expired.
                      </p>
                    </>
                  )}

                  {/* OAuth / S2S methods — Client ID, Client Secret, Scopes */}
                  {aemConfig.authMethod !== 'token' && (
                    <>
                      <input
                        type="text"
                        placeholder="Client ID (API Key)"
                        value={aemConfig.clientId}
                        onChange={(e) => setAemConfig({ ...aemConfig, clientId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                      />
                      <input
                        type="password"
                        placeholder={aemConfig.authMethod === 'oauth' ? 'Client Secret (optional for public clients)' : 'Client Secret'}
                        value={aemConfig.clientSecret}
                        onChange={(e) => setAemConfig({ ...aemConfig, clientSecret: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                      />
                      <input
                        type="text"
                        placeholder={aemConfig.authMethod === 'oauth' ? 'Scopes (default: openid,AdobeID)' : 'Scopes (optional, comma-separated)'}
                        value={aemConfig.scopes}
                        onChange={(e) => setAemConfig({ ...aemConfig, scopes: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                      />

                      {/* OAuth redirect URI note */}
                      {aemConfig.authMethod === 'oauth' && (
                        <p className="text-xs text-gray-400">
                          Ensure <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">https://localhost:3000/oauth/callback</code> is registered as a redirect URI in your Adobe Developer Console project.
                        </p>
                      )}
                    </>
                  )}

                  {/* Advanced options */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showAdvanced ? 'Hide' : 'Show'} advanced options
                  </button>

                  {showAdvanced && (
                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                      {/* API Version Dropdown */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-24 shrink-0">API Version</label>
                        <select
                          value={aemConfig.apiVersion}
                          onChange={(e) => setAemConfig({ ...aemConfig, apiVersion: e.target.value as 'legacy' | 'openapi' })}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 bg-white"
                        >
                          <option value="legacy">Legacy (all AEM versions)</option>
                          <option value="openapi">OpenAPI (AEMaaCS 2024.10+)</option>
                        </select>
                      </div>
                      {/* IMS Org ID — optional */}
                      <input
                        type="text"
                        placeholder="IMS Org ID (optional, e.g., ABC123@AdobeOrg)"
                        value={aemConfig.imsOrgId}
                        onChange={(e) => setAemConfig({ ...aemConfig, imsOrgId: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                      />
                      {/* Delivery Base URL */}
                      <input
                        type="url"
                        placeholder="Delivery Base URL (optional, for public asset URLs)"
                        value={aemConfig.deliveryBaseUrl}
                        onChange={(e) => setAemConfig({ ...aemConfig, deliveryBaseUrl: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                      />
                    </div>
                  )}

                  {aemError && (
                    <p className="text-xs text-red-500">{aemError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAemConnect}
                      className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {aemConfig.authMethod === 'oauth' ? 'Sign in with Adobe' : 'Connect'}
                    </button>
                    <button
                      onClick={handleAemSave}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {aemSaved ? 'Saved' : 'Save Settings'}
                    </button>
                    <button
                      onClick={() => { setAemState('disconnected'); setAemError(''); setShowAdvanced(false); }}
                      className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Other integrations — static */}
            {otherIntegrations.map((integration) => (
              <div key={integration.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{integration.name}</span>
                  {integration.connected ? (
                    <span className="text-xs text-green-600">Connected</span>
                  ) : (
                    <button className="text-xs text-primary-600 hover:text-primary-700">
                      Connect
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
