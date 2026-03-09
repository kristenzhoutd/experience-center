/**
 * ReadinessDashboard — Right-pane component for the AI Command variation.
 * Shows a live campaign readiness overview with completion ring,
 * section timeline, and action bar.
 */

import { Check, ChevronLeft, Save, Rocket } from 'lucide-react';
import type { CampaignLaunchPageState } from '../../../hooks/useCampaignLaunchPageState';
import type { LaunchSectionId } from '../../../pages/campaignLaunch/constants';
import { LAUNCH_SECTIONS } from '../../../pages/campaignLaunch/constants';

interface Props {
  state: CampaignLaunchPageState;
}

/** Derive a one-line summary for each section from the config. */
function getSectionSummary(sectionId: LaunchSectionId, state: CampaignLaunchPageState): string {
  const { config } = state;
  switch (sectionId) {
    case 'campaign': {
      const obj = config.campaign.objective.replace('OUTCOME_', '');
      const label = obj.charAt(0) + obj.slice(1).toLowerCase();
      const budget = (config.campaign.dailyBudget / 100).toFixed(2);
      return config.campaign.name
        ? `${label}, $${budget}/day`
        : 'Not configured';
    }
    case 'adSets': {
      const count = config.adSets.length;
      if (count === 0) return 'No ad sets';
      const countries = config.adSets
        .flatMap((a) => a.targeting.geoLocations?.countries || [])
        .filter((v, i, arr) => arr.indexOf(v) === i);
      const geo = countries.length > 0 ? countries.join(', ') : 'no geo';
      return `${count} set${count !== 1 ? 's' : ''}, ${geo} targeting`;
    }
    case 'creatives': {
      const count = config.creatives.length;
      if (count === 0) return 'No creatives';
      const missingImage = config.creatives.filter((c) => !c.file).length;
      return missingImage > 0
        ? `${count} creative${count !== 1 ? 's' : ''}, ${missingImage} no image`
        : `${count} creative${count !== 1 ? 's' : ''}, all with images`;
    }
    case 'ads': {
      const count = config.ads.length;
      if (count === 0) return 'No ads';
      return `${count} ad${count !== 1 ? 's' : ''} assigned`;
    }
    default:
      return '';
  }
}

export default function ReadinessDashboard({ state }: Props) {
  const {
    isSectionComplete,
    isApproved,
    isEditMode,
    handleBack,
    handleSave,
    handleApprove,
    handleLaunch,
    showSaveToast,
  } = state;

  const completedCount = LAUNCH_SECTIONS.filter((s) => isSectionComplete(s.id)).length;
  const totalSections = LAUNCH_SECTIONS.length;
  const readyPercent = totalSections > 0 ? completedCount / totalSections : 0;

  // SVG donut dimensions
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - readyPercent);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`copilot-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E8ECF3]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8ECF3]">
        <h2 className="text-sm font-semibold text-gray-900 m-0">Readiness</h2>
        <p className="text-xs text-gray-400 m-0 mt-0.5">
          {completedCount === totalSections
            ? 'All sections complete'
            : `${completedCount} of ${totalSections} ready`}
        </p>
      </div>

      {/* Completion Ring */}
      <div className="flex justify-center py-6">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={completedCount === totalSections ? '#10B981' : '#3B82F6'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">
              {completedCount}/{totalSections}
            </span>
          </div>
        </div>
      </div>

      {/* Section Timeline */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="relative">
          {LAUNCH_SECTIONS.map((section, idx) => {
            const complete = isSectionComplete(section.id);
            const summary = getSectionSummary(section.id, state);
            const isLast = idx === LAUNCH_SECTIONS.length - 1;

            return (
              <div key={section.id} className="relative flex gap-3">
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className="absolute left-[9px] top-[22px] w-0.5 bg-gray-200"
                    style={{ height: 'calc(100% - 4px)' }}
                  />
                )}

                {/* Status dot */}
                <div className="relative z-[1] flex-shrink-0 mt-1">
                  {complete ? (
                    <div className="w-[18px] h-[18px] rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white" />
                  )}
                </div>

                {/* Content */}
                <button
                  onClick={() => scrollToSection(section.id)}
                  className="flex-1 text-left pb-5 bg-transparent border-none cursor-pointer p-0 hover:opacity-80 transition-opacity"
                >
                  <div className="text-sm font-medium text-gray-900">{section.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{summary}</div>
                </button>
              </div>
            );
          })}

          {/* LiveRamp sync indicator */}
          <div className="relative flex gap-3">
            <div className="relative z-[1] flex-shrink-0 mt-1">
              <div className="w-[18px] h-[18px] rounded-full bg-[#00B140] flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 pb-5">
              <div className="text-sm font-medium text-gray-900">LiveRamp Sync</div>
              <div className="text-xs text-gray-400 mt-0.5">Audiences will be activated via LiveRamp on launch</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-5 py-4 border-t border-[#E8ECF3] flex flex-col gap-2">
        {/* Approve toggle */}
        {!isApproved && !isEditMode && (
          <button
            onClick={handleApprove}
            className="w-full px-4 py-2.5 text-sm font-medium text-[#1957DB] bg-[#EFF6FF] border border-[#1957DB]/20 rounded-lg hover:bg-[#1957DB]/10 transition-colors cursor-pointer"
          >
            Approve Configuration
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 bg-white border border-[#E8ECF3] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-700 bg-white border border-[#E8ECF3] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {showSaveToast ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleLaunch}
            disabled={!isApproved}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white bg-[#1957DB] rounded-lg hover:bg-[#1447c0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Rocket className="w-3.5 h-3.5" />
            {isEditMode ? 'Update' : 'Launch'}
          </button>
        </div>
      </div>
    </div>
  );
}
