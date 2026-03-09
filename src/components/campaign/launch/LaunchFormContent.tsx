/**
 * Shared content area for the campaign launch form — validation banner, warnings,
 * and the 4 form sections. Used by the original page and all navigation variations.
 */

import { AlertTriangle } from 'lucide-react';
import ChannelCampaignList from './ChannelCampaignList';
import CampaignSettingsSection from './sections/CampaignSettingsSection';
import AdSetsSection from './sections/AdSetsSection';
import CreativesSection from './sections/CreativesSection';
import AdsSection from './sections/AdsSection';
import type { CampaignLaunchPageState } from '../../../hooks/useCampaignLaunchPageState';

interface Props {
  state: CampaignLaunchPageState;
  /** Override which sections to render (for tabbed/wizard/accordion variations). Defaults to all. */
  visibleSections?: ('campaign' | 'adSets' | 'creatives' | 'ads')[];
}

export default function LaunchFormContent({ state, visibleSections }: Props) {
  const {
    config,
    activeProgram,
    activeChannel,
    activeCampaignConfigId,
    validationErrors,
    setValidationErrors,
    handleCampaignConfigSelect,
    handleCampaignConfigAdd,
    handleCampaignConfigDelete,
  } = state;

  const sections = visibleSections || ['campaign', 'adSets', 'creatives', 'ads'];

  return (
    <div className="flex">
      {/* Campaign List sidebar (only in program mode) */}
      {activeProgram && (() => {
        const ch = activeProgram.channels.find((c) => c.platform === activeChannel);
        return ch ? (
          <ChannelCampaignList
            platform={activeChannel}
            configIds={ch.launchConfigIds}
            activeConfigId={activeCampaignConfigId}
            onSelect={handleCampaignConfigSelect}
            onAdd={handleCampaignConfigAdd}
            onDelete={handleCampaignConfigDelete}
          />
        ) : null;
      })()}
      <div className="flex-1 max-w-4xl mx-auto flex flex-col gap-6">
        {/* Validation Banner */}
        {validationErrors.length > 0 && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-800">
                Please complete the following before launching
              </div>
              <ul className="mt-1.5 m-0 pl-4 flex flex-col gap-0.5 list-disc">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-xs text-amber-700">{err}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setValidationErrors([])}
              className="text-amber-400 hover:text-amber-600 bg-transparent border-none cursor-pointer p-1 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Warning: no Facebook Pages */}
        {config.facebookPages.length === 0 && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-amber-800">No Facebook Pages found</div>
              <div className="text-xs text-amber-700 mt-0.5">Your Meta token may not have the <strong>pages_show_list</strong> permission, or you have no Pages linked to your account. Ad creatives require a Facebook Page to publish from.</div>
            </div>
          </div>
        )}

        {/* Sections */}
        {sections.includes('campaign') && <CampaignSettingsSection state={state} />}
        {sections.includes('adSets') && <AdSetsSection state={state} />}
        {sections.includes('creatives') && <CreativesSection state={state} />}
        {sections.includes('ads') && <AdsSection state={state} />}

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
