import { ChevronRight, ChevronDown } from 'lucide-react';
import type { LiveCampaign } from '../../../types/optimize';
import ChannelBadge from '../ChannelBadge';
import AdGroupRow from './AdGroupRow';

interface CampaignRowProps {
  campaign: LiveCampaign;
  isExpanded: boolean;
  expandedAdGroups: Set<string>;
  selectedItems: Set<string>;
  onToggleCampaign: (id: string) => void;
  onToggleAdGroup: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleAdStatus: (adId: string, currentStatus: 'active' | 'paused') => void;
}

export default function CampaignRow({
  campaign,
  isExpanded,
  expandedAdGroups,
  selectedItems,
  onToggleCampaign,
  onToggleAdGroup,
  onToggleSelect,
  onToggleAdStatus,
}: CampaignRowProps) {
  const isSelected = selectedItems.has(campaign.id);

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-600' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-800' },
  };

  const statusStyle = statusColors[campaign.status] || statusColors.active;

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Calculate aggregate metrics
  let totalConversions = 0;
  let totalSpend = 0;
  let activeCount = 0;
  let pausedCount = 0;
  let totalRoasWeighted = 0;

  campaign.adGroups?.forEach(adGroup => {
    adGroup.ads.forEach(ad => {
      totalConversions += ad.metrics.conversions;
      totalSpend += ad.metrics.spend;
      totalRoasWeighted += ad.metrics.roas * ad.metrics.spend;
      if (ad.status === 'active') activeCount++;
      else pausedCount++;
    });
  });

  const weightedRoas = totalSpend > 0 ? totalRoasWeighted / totalSpend : 0;
  const averageCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const pacingStatusStyles: Record<string, string> = {
    on_track: 'bg-green-100 text-green-800',
    overspent: 'bg-red-100 text-red-800',
    underspent: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <>
      {/* Campaign Row */}
      <div
        className={`border-b border-gray-200 ${isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-[#F7F8FB]'}`}
      >
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) return;
            onToggleCampaign(campaign.id);
          }}
          className="flex items-center py-2.5 px-3 gap-2 cursor-pointer"
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(campaign.id)}
            className="w-3.5 h-3.5 cursor-pointer accent-[#3B6FD4] flex-shrink-0"
          />

          {/* Expand/Collapse Chevron */}
          <button
            onClick={() => onToggleCampaign(campaign.id)}
            className="bg-transparent border-none cursor-pointer p-0.5 text-gray-500 rounded flex items-center hover:bg-gray-200 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Channel Badges */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {(campaign.channels || [campaign.channel]).slice(0, 3).map((ch, idx) => (
              <ChannelBadge key={`${ch}-${idx}`} channel={ch} size="sm" />
            ))}
          </div>

          {/* Campaign Name + Status */}
          <div className="flex items-center gap-1.5 min-w-[120px] max-w-[220px] flex-shrink-1">
            <span
              className="text-[13px] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#3B6FD4] hover:underline"
              title={campaign.name}
            >
              {campaign.name}
            </span>
            <span
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded-sm ${statusStyle.bg} ${statusStyle.text} capitalize flex-shrink-0`}
            >
              {campaign.status}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Budget + Pacing */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
            </span>
            <span
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${pacingStatusStyles[campaign.pacingStatus]} whitespace-nowrap capitalize`}
            >
              {campaign.pacingStatus.replace('_', ' ')}
            </span>
            <span className="text-[9px] text-gray-500 whitespace-nowrap">
              {campaign.daysRemaining}d
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Metrics - inline */}
          <div className="flex items-center gap-1.5 flex-1">
            <MetricBadge label="ROAS" value={`${weightedRoas.toFixed(1)}x`} />
            <MetricBadge label="Conv" value={totalConversions.toString()} />
            <MetricBadge label="CPA" value={`$${averageCpa.toFixed(2)}`} />
            <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
              {activeCount}/{activeCount + pausedCount} ads
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Ad Groups */}
      {isExpanded && campaign.adGroups?.map(adGroup => (
        <AdGroupRow
          key={adGroup.id}
          adGroup={adGroup}
          campaignId={campaign.id}
          campaignName={campaign.name}
          isExpanded={expandedAdGroups.has(adGroup.id)}
          selectedItems={selectedItems}
          onToggleExpand={onToggleAdGroup}
          onToggleSelect={onToggleSelect}
          onToggleAdStatus={onToggleAdStatus}
        />
      ))}
    </>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100">
      <span className="text-[9px] text-gray-400 font-medium">{label}</span>
      <span className="text-[10px] text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
