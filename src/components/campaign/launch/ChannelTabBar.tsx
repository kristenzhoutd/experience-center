/**
 * ChannelTabBar — Channel tab selector for Step 3 of the paid media workflow.
 * Reads enabled channels from the active program and lets the user switch between them.
 */

import { Lock } from 'lucide-react';
import type { ChannelPlatform, ProgramChannelConfig } from '../../../types/program';

const PLATFORM_LABELS: Record<ChannelPlatform, string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  pinterest: 'Pinterest',
};

const PLATFORM_LOGOS: Record<ChannelPlatform, string> = {
  meta: '/assets/meta-ads.png',
  google: '/assets/google-ads.png',
  tiktok: '/assets/tiktok-ads.png',
  snapchat: '/assets/snapchat-ads.svg',
  pinterest: '/assets/pinterest-ads.svg',
};

interface ChannelTabBarProps {
  channels: ProgramChannelConfig[];
  activeChannel: ChannelPlatform;
  onChannelSelect: (platform: ChannelPlatform) => void;
}

export default function ChannelTabBar({ channels, activeChannel, onChannelSelect }: ChannelTabBarProps) {
  return (
    <div className="flex items-center gap-1">
      {channels.map((ch) => {
        const isActive = ch.platform === activeChannel;
        const isEnabled = ch.enabled;
        const configCount = ch.launchConfigIds.length;

        return (
          <button
            key={ch.platform}
            onClick={() => isEnabled && onChannelSelect(ch.platform)}
            disabled={!isEnabled}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${
              isActive
                ? 'bg-black/5 text-[#212327]'
                : isEnabled
                  ? 'bg-transparent text-gray-400 hover:text-gray-600'
                  : 'bg-transparent text-gray-300 cursor-not-allowed'
            }`}
          >
            <img
              src={PLATFORM_LOGOS[ch.platform]}
              alt=""
              className={`w-4 h-4 ${!isEnabled ? 'opacity-30 grayscale' : ''}`}
            />
            <span>{PLATFORM_LABELS[ch.platform]}</span>
            {!isEnabled && <Lock className="w-3 h-3" />}
            {isEnabled && configCount > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                ch.isConfigured
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {configCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
