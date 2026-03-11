import { useState, useEffect } from 'react';

interface PlatformStatus {
  platform: string;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  lastSyncedAt?: string;
}

export default function PaidMediaSettingsPage() {
  const [accessToken, setAccessToken] = useState('');

  const [metaStatus, setMetaStatus] = useState<PlatformStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await window.aiSuites?.settings.get();
        if (settings) {
          const meta = (settings.platformConnections as any)?.meta;
          if (meta?.accessToken) setAccessToken(meta.accessToken);
        }

        const statusResult = await window.aiSuites?.platforms.status();
        if (statusResult?.success && statusResult.data) {
          const data = statusResult.data as any;
          if (data.meta) setMetaStatus(data.meta);
        }
      } catch (err) {
        console.error('Failed to load platform settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleConnect = async () => {
    if (!accessToken.trim()) {
      setError('Access token is required.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const result = await window.aiSuites?.platforms.connect('meta', { accessToken });

      if (result?.success && (result as any).connection) {
        setMetaStatus((result as any).connection);
      } else {
        setError(result?.error || 'Failed to connect to Meta Ads.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const result = await window.aiSuites?.platforms.disconnect('meta');
      if (result?.success) {
        setMetaStatus({ platform: 'meta', connected: false });
        setAccessToken('');
      } else {
        setError(result?.error || 'Failed to disconnect.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="h-full overflow-hidden flex">
      <div className="flex-1 flex flex-col overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="px-8 py-6">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Configure your paid media integrations</p>
        </div>

        <div className="px-8 pb-8 space-y-6 max-w-3xl">
          <div>
          <h3 className="font-medium text-gray-900 mb-2">Ad Platform Integrations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your ad platforms to manage campaigns directly.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Meta Ads — functional */}
            <div className="border border-gray-200 rounded-lg p-4 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">Meta Ads</span>
                {isLoading ? (
                  <span className="text-xs text-gray-400">Loading...</span>
                ) : metaStatus?.connected ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-600 font-medium">Connected</span>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mb-4">Facebook & Instagram campaigns</p>

              {isLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading status...
                </div>
              ) : metaStatus?.connected ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-green-900">
                          {metaStatus.accountName || 'Meta Ad Account'}
                        </div>
                        {metaStatus.accountId && (
                          <div className="text-xs text-green-700 mt-0.5 font-mono">
                            {metaStatus.accountId}
                          </div>
                        )}
                        {metaStatus.lastSyncedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Connected {new Date(metaStatus.lastSyncedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="px-3 py-1.5 border border-red-300 text-red-700 text-xs rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Access Token</label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste your Meta access token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Generate a token from Meta Business Manager or the Graph API Explorer with <span className="font-mono">ads_management</span> and <span className="font-mono">ads_read</span> permissions.
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting || !accessToken.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {isConnecting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
                  {error}
                </div>
              )}
            </div>

            {/* LiveRamp — demo (always connected) */}
            <div className="border border-gray-200 rounded-lg p-4 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">LiveRamp</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Audience enrichment & activation</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-green-900">Hilton Worldwide</div>
                    <div className="text-xs text-green-700 mt-0.5 font-mono">lr-acct-hw-001</div>
                    <div className="text-xs text-green-600 mt-1">Connected Mar 1, 2026</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other platforms — Coming Soon */}
            {[
              { name: 'Google Ads', description: 'Search, Display & YouTube campaigns' },
              { name: 'TikTok Ads', description: 'TikTok campaign management' },
              { name: 'LinkedIn Ads', description: 'B2B advertising campaigns' },
            ].map((integration) => (
              <div key={integration.name} className="border border-gray-200 rounded-lg p-4 opacity-60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{integration.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-gray-500">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Asset Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm p-6">
          <h3 className="font-medium text-gray-900 mb-2">Digital Asset Management</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your DAM platforms to browse and use brand-approved assets in campaigns.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Adobe AEM — demo (always connected) */}
            <div className="border border-gray-200 rounded-lg p-4 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">Adobe Experience Manager</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Enterprise digital asset management</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-green-900">Hilton Brand Assets</div>
                    <div className="text-xs text-green-700 mt-0.5 font-mono">author-p12345-e67890.adobeaemcloud.com</div>
                    <div className="text-xs text-green-600 mt-1">Connected Feb 1, 2026</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bynder — demo (always connected) */}
            <div className="border border-gray-200 rounded-lg p-4 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">Bynder</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Brand asset management & distribution</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-green-900">Hilton Brand Portal</div>
                    <div className="text-xs text-green-700 mt-0.5 font-mono">hilton-brand.bynder.com</div>
                    <div className="text-xs text-green-600 mt-1">Connected Feb 1, 2026</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
