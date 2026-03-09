/**
 * CampaignTreeView - Hierarchical tree view for campaigns
 * Shows Campaign → Ad Groups → Ads in an expandable tree structure
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, Circle, Image, Video, Layers, MoreHorizontal } from 'lucide-react';
import type { LiveCampaign, Ad, AdGroup } from '../../types/optimize';

interface CampaignTreeViewProps {
  campaigns: LiveCampaign[];
  onCampaignClick?: (campaignId: string) => void;
  onAdGroupClick?: (campaignId: string, adGroupId: string) => void;
  onAdClick?: (campaignId: string, adGroupId: string, adId: string) => void;
}

export default function CampaignTreeView({
  campaigns,
  onCampaignClick,
  onAdGroupClick,
  onAdClick,
}: CampaignTreeViewProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdGroups, setExpandedAdGroups] = useState<Set<string>>(new Set());

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });
  };

  const toggleAdGroup = (adGroupId: string) => {
    setExpandedAdGroups(prev => {
      const next = new Set(prev);
      if (next.has(adGroupId)) {
        next.delete(adGroupId);
      } else {
        next.add(adGroupId);
      }
      return next;
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No campaigns to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((campaign) => (
        <CampaignNode
          key={campaign.id}
          campaign={campaign}
          isExpanded={expandedCampaigns.has(campaign.id)}
          onToggle={() => toggleCampaign(campaign.id)}
          onClick={() => onCampaignClick?.(campaign.id)}
          expandedAdGroups={expandedAdGroups}
          onToggleAdGroup={toggleAdGroup}
          onAdGroupClick={onAdGroupClick}
          onAdClick={onAdClick}
        />
      ))}
    </div>
  );
}

// ── Campaign Node ────────────────────────────────────────────────────────────

interface CampaignNodeProps {
  campaign: LiveCampaign;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  expandedAdGroups: Set<string>;
  onToggleAdGroup: (adGroupId: string) => void;
  onAdGroupClick?: (campaignId: string, adGroupId: string) => void;
  onAdClick?: (campaignId: string, adGroupId: string, adId: string) => void;
}

function CampaignNode({
  campaign,
  isExpanded,
  onToggle,
  onClick,
  expandedAdGroups,
  onToggleAdGroup,
  onAdGroupClick,
  onAdClick,
}: CampaignNodeProps) {
  const hasChildren = campaign.adGroups && campaign.adGroups.length > 0;
  const statusColor = getStatusColor(campaign.status);

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Campaign Row */}
      <div
        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer group"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onClick();
        }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors border-none cursor-pointer bg-transparent"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Status Indicator */}
        <Circle className={`w-2 h-2 fill-current ${statusColor}`} />

        {/* Campaign Name & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{campaign.name}</h3>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 uppercase">
              {campaign.platform || 'Meta'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {campaign.adGroups?.length || 0} ad groups • {campaign.daysRemaining} days remaining
          </p>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6 mr-2">
          <MetricItem label="Spent" value={`$${(campaign.spent / 1000).toFixed(1)}K`} />
          <MetricItem label="ROAS" value={campaign.metrics.roas.toFixed(2)} highlight={campaign.metrics.roas >= 2} />
          <MetricItem label="Conversions" value={campaign.metrics.conversions.toLocaleString()} />
          <MetricItem
            label="Budget"
            value={`${Math.round((campaign.spent / campaign.budget) * 100)}%`}
            highlight={campaign.spent / campaign.budget > 0.9}
          />
        </div>

        {/* Actions */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer bg-transparent">
          <MoreHorizontal className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Ad Groups (children) */}
      {isExpanded && hasChildren && (
        <div className="border-t border-gray-100">
          {campaign.adGroups!.map((adGroup) => (
            <AdGroupNode
              key={adGroup.id}
              campaignId={campaign.id}
              adGroup={adGroup}
              isExpanded={expandedAdGroups.has(adGroup.id)}
              onToggle={() => onToggleAdGroup(adGroup.id)}
              onClick={() => onAdGroupClick?.(campaign.id, adGroup.id)}
              onAdClick={onAdClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ad Group Node ────────────────────────────────────────────────────────────

interface AdGroupNodeProps {
  campaignId: string;
  adGroup: AdGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onAdClick?: (campaignId: string, adGroupId: string, adId: string) => void;
}

function AdGroupNode({ campaignId, adGroup, isExpanded, onToggle, onClick, onAdClick }: AdGroupNodeProps) {
  const hasChildren = adGroup.ads && adGroup.ads.length > 0;
  const statusColor = getStatusColor(adGroup.status);

  return (
    <div className="ml-8">
      {/* Ad Group Row */}
      <div
        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer group"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onClick();
        }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors border-none cursor-pointer bg-transparent"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Status Indicator */}
        <Circle className={`w-2 h-2 fill-current ${statusColor}`} />

        {/* Icon */}
        <Layers className="w-4 h-4 text-gray-400" />

        {/* Ad Group Name & Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">{adGroup.name}</h4>
          <p className="text-xs text-gray-500">
            {adGroup.targeting} • {adGroup.ads?.length || 0} ads
          </p>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6 mr-2">
          <MetricItem label="Spent" value={`$${(adGroup.metrics.spend / 1000).toFixed(1)}K`} small />
          <MetricItem label="ROAS" value={adGroup.metrics.roas.toFixed(2)} small highlight={adGroup.metrics.roas >= 2} />
          <MetricItem label="Conv." value={adGroup.metrics.conversions.toLocaleString()} small />
          <MetricItem label="CPA" value={`$${adGroup.metrics.cpa.toFixed(0)}`} small />
        </div>

        {/* Actions */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer bg-transparent">
          <MoreHorizontal className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Ads (children) */}
      {isExpanded && hasChildren && (
        <div className="border-t border-gray-100 bg-gray-50">
          {adGroup.ads.map((ad) => (
            <AdNode
              key={ad.id}
              campaignId={campaignId}
              adGroupId={adGroup.id}
              ad={ad}
              onClick={() => onAdClick?.(campaignId, adGroup.id, ad.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ad Node ──────────────────────────────────────────────────────────────────

interface AdNodeProps {
  campaignId: string;
  adGroupId: string;
  ad: Ad;
  onClick: () => void;
}

function AdNode({ ad, onClick }: AdNodeProps) {
  const statusColor = getStatusColor(ad.status);
  const CreativeIcon = ad.creative.type === 'video' ? Video : ad.creative.type === 'carousel' ? Layers : Image;

  return (
    <div
      className="flex items-center gap-3 p-3 ml-8 hover:bg-gray-100 cursor-pointer group"
      onClick={onClick}
    >
      {/* Spacer for alignment */}
      <div className="w-5" />

      {/* Status Indicator */}
      <Circle className={`w-2 h-2 fill-current ${statusColor}`} />

      {/* Creative Icon */}
      <CreativeIcon className="w-4 h-4 text-gray-400" />

      {/* Ad Name & Info */}
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-sm text-gray-900 truncate">{ad.name}</h5>
        <p className="text-xs text-gray-500 capitalize">
          {ad.creative.type} • {ad.launchDate ? `Launched ${new Date(ad.launchDate).toLocaleDateString()}` : 'Active'}
        </p>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-6 mr-2">
        <MetricItem label="Spent" value={`$${(ad.metrics.spend / 1000).toFixed(1)}K`} small />
        <MetricItem label="ROAS" value={ad.metrics.roas.toFixed(2)} small highlight={ad.metrics.roas >= 2} />
        <MetricItem label="CTR" value={`${ad.metrics.ctr.toFixed(2)}%`} small />
        <MetricItem label="Conv." value={ad.metrics.conversions.toLocaleString()} small />
      </div>

      {/* Fatigue Warning */}
      {ad.fatigue && ad.fatigue.score > 70 && (
        <div className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
          Fatigue: {ad.fatigue.score}%
        </div>
      )}

      {/* Actions */}
      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer bg-transparent">
        <MoreHorizontal className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────

interface MetricItemProps {
  label: string;
  value: string;
  small?: boolean;
  highlight?: boolean;
}

function MetricItem({ label, value, small, highlight }: MetricItemProps) {
  return (
    <div className="text-right">
      <p className={`${small ? 'text-[10px]' : 'text-xs'} text-gray-500`}>{label}</p>
      <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-500';
    case 'paused':
      return 'text-yellow-500';
    case 'completed':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}
