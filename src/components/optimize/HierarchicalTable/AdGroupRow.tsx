import { ChevronRight, ChevronDown } from 'lucide-react';
import type { AdGroup } from '../../../types/optimize';
import AdRow from './AdRow';

interface AdGroupRowProps {
  adGroup: AdGroup;
  campaignId: string;
  campaignName: string;
  isExpanded: boolean;
  selectedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleAdStatus: (adId: string, currentStatus: 'active' | 'paused') => void;
}

export default function AdGroupRow({
  adGroup,
  campaignId,
  campaignName,
  isExpanded,
  selectedItems,
  onToggleExpand,
  onToggleSelect,
  onToggleAdStatus,
}: AdGroupRowProps) {
  const isSelected = selectedItems.has(adGroup.id);

  const statusColors = {
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  };

  const activeAdsCount = adGroup.ads.filter(ad => ad.status === 'active').length;
  const totalAdsCount = adGroup.ads.length;

  // Calculate aggregate metrics
  const totalConversions = adGroup.ads.reduce((sum, ad) => sum + ad.metrics.conversions, 0);
  const totalSpend = adGroup.ads.reduce((sum, ad) => sum + ad.metrics.spend, 0);
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const weightedRoas = totalSpend > 0
    ? adGroup.ads.reduce((sum, ad) => sum + ad.metrics.roas * ad.metrics.spend, 0) / totalSpend
    : 0;

  return (
    <>
      {/* Ad Group Row */}
      <div
        className={`border-b border-gray-200 ${isSelected ? 'bg-indigo-100' : 'bg-[#F7F8FB] hover:bg-gray-100'}`}
      >
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) return;
            onToggleExpand(adGroup.id);
          }}
          className="flex items-center py-2 px-3 pl-11 gap-2 cursor-pointer"
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(adGroup.id)}
            className="w-3.5 h-3.5 cursor-pointer accent-[#3B6FD4] flex-shrink-0"
          />

          {/* Expand/Collapse Chevron */}
          <button
            onClick={() => onToggleExpand(adGroup.id)}
            className="bg-transparent border-none cursor-pointer p-0.5 text-gray-500 rounded flex items-center hover:bg-gray-200 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Ad Group Icon */}
          <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-[8px] text-[#3B6FD4] font-semibold flex-shrink-0">
            AG
          </div>

          {/* Ad Group Name + Status */}
          <div className="flex items-center gap-1.5 min-w-[160px] max-w-[240px]">
            <span
              className="text-xs font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#3B6FD4] hover:underline"
              title={adGroup.name}
            >
              {adGroup.name}
            </span>
            <span
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded-sm ${statusColors[adGroup.status].bg} ${statusColors[adGroup.status].text} capitalize flex-shrink-0`}
            >
              {adGroup.status}
            </span>
          </div>

          {/* Targeting Info */}
          {adGroup.targeting && (
            <>
              <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
              <span
                className="text-[10px] text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                title={adGroup.targeting}
              >
                {adGroup.targeting}
              </span>
            </>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

          {/* Metrics - inline */}
          <div className="flex items-center gap-1.5 flex-1">
            <MetricBadge label="ROAS" value={`${weightedRoas.toFixed(1)}x`} />
            <MetricBadge label="Conv" value={totalConversions.toString()} />
            <MetricBadge label="CPA" value={`$${avgCpa.toFixed(2)}`} />
            <MetricBadge label="Spend" value={`$${totalSpend.toLocaleString()}`} />
            <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
              {activeAdsCount}/{totalAdsCount} ads
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Ads */}
      {isExpanded && adGroup.ads.map(ad => (
        <AdRow
          key={ad.id}
          ad={ad}
          adGroupId={adGroup.id}
          campaignId={campaignId}
          isSelected={selectedItems.has(ad.id)}
          onToggleSelect={onToggleSelect}
          onToggleStatus={onToggleAdStatus}
        />
      ))}
    </>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-100">
      <span className="text-[9px] text-gray-400 font-medium">{label}</span>
      <span className="text-[10px] text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
