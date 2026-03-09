import { useState } from 'react';
import { Image, Video, Layout, AlertTriangle, Pause, Play } from 'lucide-react';
import type { Ad } from '../../../types/optimize';

interface AdRowProps {
  ad: Ad;
  adGroupId: string;
  campaignId: string;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleStatus: (adId: string, currentStatus: 'active' | 'paused') => void;
}

export default function AdRow({
  ad,
  adGroupId,
  campaignId,
  isSelected,
  onToggleSelect,
  onToggleStatus,
}: AdRowProps) {
  const statusColors = {
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  };

  const creativeType = ad.creative?.type || 'image';
  const CreativeIcon = creativeType === 'video' ? Video :
                       creativeType === 'carousel' ? Layout : Image;

  const hasFatigue = ad.fatigue?.score && ad.fatigue.score > 70;
  const ctrDelta = ad.previousMetrics
    ? ((ad.metrics.ctr - ad.previousMetrics.ctr) / ad.previousMetrics.ctr) * 100
    : 0;

  return (
    <div
      className={`border-b border-gray-200 ${isSelected ? 'bg-indigo-50' : 'bg-[#FAFBFC] hover:bg-gray-100'}`}
    >
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) return;
          onToggleSelect(ad.id);
        }}
        className="flex items-center py-1.5 px-3 pl-[76px] gap-2 cursor-pointer"
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(ad.id)}
          className="w-3.5 h-3.5 cursor-pointer accent-[#3B6FD4] flex-shrink-0"
        />

        {/* Creative Type Icon */}
        <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
          <CreativeIcon className="w-3 h-3 text-gray-500" />
        </div>

        {/* Ad Name + Status + Fatigue */}
        <div className="flex items-center gap-1.5 min-w-[140px] max-w-[200px]">
          <span
            className="text-[11px] font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#3B6FD4] hover:underline"
            title={ad.name}
          >
            {ad.name}
          </span>
          <span
            className={`text-[8px] font-medium px-1 py-[1px] rounded-sm ${statusColors[ad.status].bg} ${statusColors[ad.status].text} capitalize flex-shrink-0`}
          >
            {ad.status}
          </span>
          {hasFatigue && (
            <span className="flex items-center gap-0.5 text-[8px] font-medium px-1 py-[1px] rounded-sm bg-red-100 text-red-500 flex-shrink-0">
              <AlertTriangle className="w-2.5 h-2.5" />
              Fatigue
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-3.5 bg-gray-200 flex-shrink-0" />

        {/* Metrics - inline */}
        <div className="flex items-center gap-1.5 flex-1">
          <MetricBadge label="CTR" value={`${ad.metrics.ctr.toFixed(2)}%`} trend={ctrDelta} />
          <MetricBadge label="Conv" value={ad.metrics.conversions.toString()} />
          <MetricBadge label="CPA" value={`$${ad.metrics.cpa.toFixed(2)}`} />
          <MetricBadge label="ROAS" value={`${ad.metrics.roas.toFixed(1)}x`} />
          <MetricBadge label="Spend" value={`$${ad.metrics.spend.toLocaleString()}`} />
        </div>

        {/* Pause/Activate Button */}
        <button
          onClick={() => onToggleStatus(ad.id, ad.status)}
          className={`flex items-center gap-0.5 px-2.5 py-1 rounded-[5px] border text-[10px] font-medium cursor-pointer transition-all duration-150 flex-shrink-0 ${
            ad.status === 'active'
              ? 'border-yellow-400 bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
              : 'border-green-400 bg-green-50 text-green-800 hover:bg-green-100'
          }`}
        >
          {ad.status === 'active' ? (
            <>
              <Pause className="w-2.5 h-2.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-2.5 h-2.5" />
              Activate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Small inline metric badge
function MetricBadge({ label, value, trend }: { label: string; value: string; trend?: number }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100">
      <span className="text-[9px] text-gray-400 font-medium">{label}</span>
      <span className="text-[10px] text-gray-700 font-semibold">{value}</span>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[8px] font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
