/**
 * Toolbar for the campaign launch page — platform tabs + action buttons.
 */

import { Save } from 'lucide-react';
import ChannelTabBar from './ChannelTabBar';
import type { CampaignLaunchPageState } from '../../../hooks/useCampaignLaunchPageState';
import type { PlatformTab } from '../../../pages/campaignLaunch/constants';

interface Props {
  state: CampaignLaunchPageState;
  /** Optional extra element to render before the action buttons */
  extraActions?: React.ReactNode;
}

export default function LaunchToolbar({ state, extraActions }: Props) {
  const {
    activeTab,
    setActiveTab,
    isApproved,
    isEditMode,
    isInitialized,
    activeProgram,
    handleBack,
    handleSave,
    handleApprove,
    handleLaunch,
    handleChannelSelect,
  } = state;

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        {activeProgram ? (
          <ChannelTabBar
            channels={activeProgram.channels}
            activeChannel={state.activeChannel}
            onChannelSelect={handleChannelSelect}
          />
        ) : (
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('meta')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'meta'
                  ? 'bg-[#EFF6FF] text-[#1957DB]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <img src="/assets/meta-ads.png" alt="" className="w-4 h-4" />
              Meta
              <svg className="w-3.5 h-3.5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {(['google', 'tiktok', 'snapchat', 'pinterest'] as PlatformTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-50 text-gray-500'
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
                }`}
              >
                <img src={`/assets/${tab === 'snapchat' || tab === 'pinterest' ? `${tab}-ads.svg` : `${tab}-ads.png`}`} alt="" className="w-4 h-4" />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {extraActions}
        {!isApproved ? (
          <>
            <button
              onClick={handleSave}
              disabled={!isInitialized}
              className="px-4 py-2 bg-white border border-[#E8ECF3] rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleApprove}
              disabled={!isInitialized}
              className="px-5 py-2 bg-[#1957DB] border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-[#1449B8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Approve Plan
            </button>
          </>
        ) : (
          <>
            <span className="px-3 py-1.5 bg-[#C9F3D1] text-[#25582E] text-xs font-medium rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Approved
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-white border border-[#E8ECF3] rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleLaunch}
              disabled={activeTab !== 'meta'}
              className="px-5 py-2 bg-[#1957DB] border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-[#1449B8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <img src="/assets/meta-ads.png" alt="" className="w-4 h-4" />
              {isEditMode ? 'Update Campaign' : 'Launch Campaign'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
