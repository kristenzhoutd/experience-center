/**
 * ChannelCampaignList — Sidebar listing campaigns within a channel.
 * Shows all SavedLaunchConfigs linked to the active channel in the program.
 */

import { Plus, Trash2 } from 'lucide-react';
import { launchConfigStorage } from '../../../services/launchConfigStorage';
import type { ChannelPlatform } from '../../../types/program';

interface ChannelCampaignListProps {
  platform: ChannelPlatform;
  configIds: string[];
  activeConfigId: string | null;
  onSelect: (configId: string) => void;
  onAdd: () => void;
  onDelete: (configId: string) => void;
}

export default function ChannelCampaignList({
  platform,
  configIds,
  activeConfigId,
  onSelect,
  onAdd,
  onDelete,
}: ChannelCampaignListProps) {
  const configs = configIds
    .map((id) => launchConfigStorage.getConfig(id))
    .filter(Boolean);

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Campaigns
        </span>
        <button
          onClick={onAdd}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors cursor-pointer"
          title="Add campaign"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Campaign list */}
      <div className="flex-1 overflow-y-auto py-1">
        {configs.length === 0 && (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">
            No campaigns yet.
            <br />
            Click + to create one.
          </div>
        )}
        {configs.map((config) => {
          if (!config) return null;
          const isActive = config.id === activeConfigId;
          const adSetCount = config.config.adSets.length;
          const dailyBudget = config.config.campaign.dailyBudget;
          const isLaunched = !!config.platformCampaignId;

          return (
            <div
              key={config.id}
              onClick={() => onSelect(config.id)}
              className={`group mx-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-white border border-gray-200 shadow-sm'
                  : 'hover:bg-white/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {config.name || 'Untitled'}
                    </p>
                    {isLaunched && (
                      <>
                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-green-700">
                          <span className="w-1 h-1 rounded-full bg-green-500" />
                          Live
                        </span>
                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#00B140]/10 text-[#00B140]" title="Audience synced via LiveRamp">
                          LR
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">
                      {adSetCount} ad set{adSetCount !== 1 ? 's' : ''}
                    </span>
                    {dailyBudget > 0 && (
                      <span className="text-[10px] text-gray-400">
                        ${(dailyBudget / 100).toFixed(0)}/day
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(config.id);
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer"
                  title="Remove campaign"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
