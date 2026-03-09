import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { campaignConfigStorage } from '../services/campaignConfigStorage';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import type { CampaignConfig, ConfigStatus } from '../types/campaignConfig';

const statusConfig: Record<ConfigStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  ready: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-700' },
  launched: { label: 'Launched', bg: 'bg-blue-100', text: 'text-blue-700' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    setCampaigns(campaignConfigStorage.listConfigs());
  }, []);

  const handleCreate = useCallback(() => {
    const id = useCampaignConfigStore.getState().initNewConfig();
    navigate(`/campaigns/${id}`);
  }, [navigate]);

  const handleDelete = (campaignId: string) => {
    campaignConfigStorage.deleteConfig(campaignId);
    setCampaigns(campaignConfigStorage.listConfigs());
    setShowDeleteModal(null);
  };

  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Campaigns</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your personalization campaigns</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </button>
          </div>

          {/* Campaigns list or empty state */}
          <div className="p-6">
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No campaigns yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Create your first personalization campaign to get started.
                </p>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => {
                  const selectedSegments = campaign.audiences.segments.filter((s) => s.isSelected);
                  const stepLabels = ['Setup', 'Audiences', 'Content', 'Review'];
                  const status = statusConfig[campaign.status] ?? statusConfig.draft;

                  return (
                    <div
                      key={campaign.id}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        {/* Left side - Campaign info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-base font-medium text-gray-900">
                              {campaign.setup.name || 'Untitled Campaign'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            {campaign.setup.objective || 'No objective set'}
                          </p>

                          {/* Audience tag */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {selectedSegments.length} segment{selectedSegments.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Right side - Stats and actions */}
                        <div className="flex items-center gap-8 ml-6">
                          {/* Stats */}
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-lg font-medium text-gray-900">
                                {stepLabels[campaign.currentStep - 1]}
                              </p>
                              <p className="text-xs text-gray-500">step {campaign.currentStep}/4</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-medium text-gray-900">
                                {campaign.content.pages.reduce((sum, p) => sum + p.spots.length, 0)}
                              </p>
                              <p className="text-xs text-gray-500">spot{campaign.content.pages.reduce((sum, p) => sum + p.spots.length, 0) !== 1 ? 's' : ''}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {(campaign.status === 'launched' || campaign.status === 'ready') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaign.id}/analysis`); }}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="View dashboard"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaign.id}`); }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit campaign"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowDeleteModal(campaign.id); }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete campaign"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Footer - dates */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                        <span>Created {formatDate(campaign.createdAt)}</span>
                        <span>Updated {formatDate(campaign.updatedAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delete confirmation modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Campaign</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this campaign? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
