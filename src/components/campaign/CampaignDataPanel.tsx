/**
 * CampaignDataPanel — Right-panel wrapper for HierarchicalTable.
 * Displays live campaign data fetched from connected ad platforms.
 * Reads from usePlatformStore for campaigns, loading, and error state.
 */

import { useState, useCallback } from 'react';
import { RefreshCw, Wifi, AlertCircle } from 'lucide-react';
import HierarchicalTable from '../optimize/HierarchicalTable';
import { usePlatformStore } from '../../stores/platformStore';
import type { LiveCampaign } from '../../types/optimize';

export default function CampaignDataPanel() {
  const campaigns = usePlatformStore((s) => s.campaigns);
  const isFetchingCampaigns = usePlatformStore((s) => s.isFetchingCampaigns);
  const lastFetchedAt = usePlatformStore((s) => s.lastFetchedAt);
  const campaignsError = usePlatformStore((s) => s.campaignsError);
  const connections = usePlatformStore((s) => s.connections);
  const setCampaigns = usePlatformStore((s) => s.setCampaigns);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const connectedPlatform = connections.find((c) => c.connected);
  const platformLabel = connectedPlatform
    ? connectedPlatform.platform.charAt(0).toUpperCase() + connectedPlatform.platform.slice(1)
    : 'Platform';

  const handleRefresh = useCallback(() => {
    if (connectedPlatform) {
      usePlatformStore.getState().fetchCampaigns(connectedPlatform.platform);
    }
  }, [connectedPlatform]);

  const handleCampaignsChange = useCallback((updated: LiveCampaign[]) => {
    setCampaigns(updated);
  }, [setCampaigns]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const formattedTime = lastFetchedAt
    ? new Date(lastFetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // Loading state
  if (isFetchingCampaigns && campaigns.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] border-l border-gray-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700">Fetching campaigns...</p>
            <p className="text-xs text-gray-400 mt-1">Loading data from {platformLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignsError && campaigns.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] border-l border-gray-200">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Failed to Load Campaigns</h3>
            <p className="text-sm text-gray-400 mb-4">{campaignsError}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8FB] border-l border-gray-200">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">No Campaign Data</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connect an ad platform and fetch your campaigns to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F8FB] border-l border-gray-200 overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="absolute top-3 right-3 z-50">
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'warning' ? 'bg-amber-500' :
            'bg-blue-500'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <h3 className="text-sm font-semibold text-gray-800">
            {platformLabel} Campaigns
          </h3>
          <span className="text-xs text-gray-400">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {formattedTime && (
            <span className="text-xs text-gray-400">
              Updated {formattedTime}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isFetchingCampaigns}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh campaigns"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isFetchingCampaigns ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="flex-1 overflow-y-auto">
        <HierarchicalTable
          campaigns={campaigns}
          onCampaignsChange={handleCampaignsChange}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
