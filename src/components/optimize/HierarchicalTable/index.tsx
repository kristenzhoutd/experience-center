import { useState, useCallback } from 'react';
import { Expand, Minimize2 } from 'lucide-react';
import CampaignRow from './CampaignRow';
import type { LiveCampaign, AdStatus } from '../../../types/optimize';

interface HierarchicalTableProps {
  campaigns: LiveCampaign[];
  onCampaignsChange: (campaigns: LiveCampaign[]) => void;
  showToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export default function HierarchicalTable({
  campaigns,
  onCampaignsChange,
  showToast,
}: HierarchicalTableProps) {
  // Tree state: which campaigns and ad groups are expanded
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdGroups, setExpandedAdGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Calculate summary stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused').length;

  let totalAds = 0;
  let activeAds = 0;
  let pausedAds = 0;
  campaigns.forEach(campaign => {
    campaign.adGroups?.forEach(adGroup => {
      adGroup.ads.forEach(ad => {
        totalAds++;
        if (ad.status === 'active') activeAds++;
        else pausedAds++;
      });
    });
  });

  const selectedCount = selectedItems.size;

  // Toggle functions
  const toggleCampaign = useCallback((id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAdGroup = useCallback((id: string) => {
    setExpandedAdGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const expandAll = useCallback(() => {
    const campaignIds = new Set(campaigns.map(c => c.id));
    const adGroupIds = new Set<string>();
    campaigns.forEach(c => {
      c.adGroups?.forEach(ag => adGroupIds.add(ag.id));
    });
    setExpandedCampaigns(campaignIds);
    setExpandedAdGroups(adGroupIds);
  }, [campaigns]);

  const collapseAll = useCallback(() => {
    setExpandedCampaigns(new Set());
    setExpandedAdGroups(new Set());
  }, []);

  // Handle ad status toggle
  const handleToggleAdStatus = useCallback((adId: string, currentStatus: AdStatus) => {
    const newStatus: AdStatus = currentStatus === 'active' ? 'paused' : 'active';
    const updated = campaigns.map(campaign => ({
      ...campaign,
      adGroups: campaign.adGroups?.map(adGroup => ({
        ...adGroup,
        ads: adGroup.ads.map(ad =>
          ad.id === adId ? { ...ad, status: newStatus } : ad
        ),
      })),
    }));
    onCampaignsChange(updated);

    // Find ad name for toast
    let adName = 'Ad';
    campaigns.forEach(c => {
      c.adGroups?.forEach(ag => {
        ag.ads.forEach(a => {
          if (a.id === adId) adName = a.name;
        });
      });
    });

    showToast(
      `${adName} ${newStatus === 'paused' ? 'paused' : 'activated'}`,
      newStatus === 'paused' ? 'warning' : 'success'
    );
  }, [campaigns, onCampaignsChange, showToast]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#F7F8FB] flex-shrink-0">
        {/* Left: Summary Stats */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-800">
            Campaigns ({totalCampaigns})
          </span>
          <div className="flex items-center gap-3">
            <StatBadge label="Active" count={activeCampaigns} color="#10B981" />
            <StatBadge label="Paused" count={pausedCampaigns} color="#F59E0B" />
          </div>
          <span className="text-gray-200">|</span>
          <span className="text-[13px] text-gray-500">
            {totalAds} ads ({activeAds} active, {pausedAds} paused)
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs text-[#3B6FD4] bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
            >
              Clear Selection ({selectedCount})
            </button>
          )}
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 cursor-pointer px-3 py-1.5 rounded-md transition-all duration-150 hover:bg-[#F7F8FB] hover:border-gray-400"
          >
            <Expand className="w-3 h-3" />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 cursor-pointer px-3 py-1.5 rounded-md transition-all duration-150 hover:bg-[#F7F8FB] hover:border-gray-400"
          >
            <Minimize2 className="w-3 h-3" />
            Collapse All
          </button>
        </div>
      </div>

      {/* Campaign Rows */}
      <div className="flex-1 overflow-y-auto">
        {campaigns.length === 0 ? (
          <div className="py-[60px] px-5 text-center">
            <span className="text-sm text-gray-500">
              No campaigns found
            </span>
          </div>
        ) : (
          campaigns.map(campaign => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              isExpanded={expandedCampaigns.has(campaign.id)}
              expandedAdGroups={expandedAdGroups}
              selectedItems={selectedItems}
              onToggleCampaign={toggleCampaign}
              onToggleAdGroup={toggleAdGroup}
              onToggleSelect={toggleSelection}
              onToggleAdStatus={handleToggleAdStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-500">
        {count} {label}
      </span>
    </div>
  );
}
