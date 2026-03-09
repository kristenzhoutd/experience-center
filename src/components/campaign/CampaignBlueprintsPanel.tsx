import React, { useState, useEffect } from 'react';
import { BlueprintDetailView } from './BlueprintDetailView';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { Blueprint } from '../../../electron/utils/ipc-types';

// Re-export Blueprint type for other components
export type { Blueprint };

// Asset URLs
const imgMetaAds = '/assets/meta-ads.png';
const imgGoogleAds = '/assets/google-ads.png';
const imgTikTokAds = '/assets/tiktok-ads.png';

// --- SVG Icon Components ---

const MenuIcon = ({ color = '#212327' }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5"/>
    <rect x="12" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5"/>
    <rect x="2" y="12" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5"/>
    <rect x="12" y="12" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#636A77" strokeWidth="1.2"/>
    <path d="M8 5V8L10 10" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ReachIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#636A77" strokeWidth="1.2"/>
    <path d="M8 4V8H12" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const CtrIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#636A77" strokeWidth="1.2"/>
    <path d="M5 8L7 10L11 6" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ConversionsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 12L7 9L9 11L12 4" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RoasIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5" stroke="#636A77" strokeWidth="1.2"/>
    <path d="M8 5V11M6 7H10M6 9H10" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ChannelsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="10" rx="1" stroke="#636A77" strokeWidth="1.2"/>
    <path d="M6 6L10 8L6 10V6Z" stroke="#636A77" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const AudienceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="2.5" stroke="#636A77" strokeWidth="1.2"/>
    <path d="M3 14C3 11.2386 5.23858 9 8 9C10.7614 9 13 11.2386 13 14" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="#636A77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7.5 5L12.5 10L7.5 15" stroke="#636A77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- Interfaces ---

interface BlueprintMetrics {
  reach: string;
  ctr: string;
  roas: string;
  conversions: string;
}

interface BlueprintBudget {
  amount: string;
  pacing: string;
  phases?: number;
  channelBreakdown?: { channel: string; amount: string; percentage: number; description?: string }[];
}

type BlueprintVariant = 'conservative' | 'balanced' | 'aggressive';

interface MissingFieldInfo {
  field: string;
  label: string;
  prompt: string;
}

interface CampaignBlueprintsPanelProps {
  blueprints: Blueprint[];
  onSelectBlueprint?: (blueprint: Blueprint) => void;
  onApplyBlueprint?: (blueprint: Blueprint) => void;
  onUpdateBlueprint?: (blueprint: Blueprint) => void;
  onExportBlueprints?: (format: 'json' | 'csv' | 'pdf') => void;
  onSendToChat?: (blueprint: Blueprint, feedback: string) => void;
  onRequestMissingInfo?: () => void;
  onSaveForLater?: (blueprint: Blueprint) => void;
  onRemoveSaved?: (blueprintId: string) => void;
  savedBlueprintIds?: string[];
  missingFields?: MissingFieldInfo[];
  selectedBlueprintId?: string;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isApplying?: boolean;
  isLoading?: boolean;
  onApprovePlan?: (blueprint: Blueprint) => void;
  onModifyPlan?: (blueprint: Blueprint, feedback: string) => void;
  onRegeneratePlan?: () => void;
  approvedBlueprintId?: string;
  onBlueprintSaveComplete?: (blueprint: Blueprint) => void;
  tdSegments?: { id: string; name: string; audienceSize?: number; parentSegmentName?: string }[];
  onBack?: () => void;
  onContinue?: (blueprint: Blueprint) => void;
}

// --- Helpers ---

const getChannelIcon = (channel: string | unknown) => {
  // Handle both string and object channel formats
  const channelName = typeof channel === 'string' ? channel : (channel as any)?.name || String(channel);
  switch (channelName.toLowerCase()) {
    case 'meta ads':
    case 'meta':
      return imgMetaAds;
    case 'google ads':
    case 'google':
      return imgGoogleAds;
    case 'tiktok ads':
    case 'tiktok':
      return imgTikTokAds;
    default:
      return null;
  }
};

const getConfidenceStyle = (confidence: string) => {
  switch (confidence) {
    case 'High':
      return { bg: '#DEF8E3', color: '#25582E' };
    case 'Medium':
      return { bg: '#FEF3C7', color: '#92400E' };
    case 'Low':
      return { bg: '#FEE2E2', color: '#DC2626' };
    default:
      return { bg: '#DEF8E3', color: '#25582E' };
  }
};

const getComplexityStyle = (complexity: string) => {
  switch (complexity) {
    case 'Low':
      return { bg: '#DEF8E3', color: '#25582E' };
    case 'Medium':
      return { bg: '#FEF3C7', color: '#92400E' };
    case 'High':
      return { bg: '#FEE2E2', color: '#DC2626' };
    default:
      return { bg: '#DEF8E3', color: '#25582E' };
  }
};

const getVariantStyle = (variant: BlueprintVariant | undefined) => {
  switch (variant) {
    case 'conservative':
      return { bg: '#DBEAFE', color: '#1E40AF', label: 'Conservative' };
    case 'balanced':
      return { bg: '#F3E8FF', color: '#7C3AED', label: 'Balanced' };
    case 'aggressive':
      return { bg: '#FEE2E2', color: '#DC2626', label: 'Aggressive' };
    default:
      return { bg: '#F3E8FF', color: '#7C3AED', label: 'Balanced' };
  }
};

// --- Skeleton Loading ---

const SkeletonBox = ({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  marginBottom = '0',
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
  marginBottom?: string;
}) => (
  <div
    className="animate-pulse"
    style={{
      width,
      height,
      borderRadius,
      marginBottom,
      background: 'linear-gradient(90deg, #EFF2F8 25%, #E4E8F0 37%, #EFF2F8 63%)',
      backgroundSize: '200% 100%',
    }}
  />
);

const BlueprintLoadingSkeleton = () => (
  <div className="flex-1 flex flex-col gap-5 p-2">
    <div className="flex items-center gap-4">
      <SkeletonBox width="40px" height="40px" borderRadius="10px" />
      <div className="flex-1">
        <SkeletonBox width="200px" height="24px" marginBottom="8px" />
        <SkeletonBox width="280px" height="16px" />
      </div>
    </div>
    <div
      className="flex gap-4 p-5 rounded-xl border border-[#E4E8F0]"
      style={{ background: 'linear-gradient(135deg, #F5F8FC 0%, #EEF3FA 100%)' }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 flex flex-col gap-2">
          <SkeletonBox width="80px" height="12px" />
          <SkeletonBox width="60px" height="28px" />
        </div>
      ))}
    </div>
    <div className="flex gap-4 overflow-x-auto pb-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="min-w-[320px] bg-white rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <SkeletonBox width="180px" height="22px" marginBottom="4px" />
          <SkeletonBox width="100%" height="40px" />
          <div className="flex gap-3">
            <SkeletonBox width="100px" height="24px" borderRadius="4px" />
            <SkeletonBox width="80px" height="24px" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Loading Overlay ---

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-[#F7F8FB]/85 flex flex-col items-center justify-center gap-4 z-10 rounded-2xl">
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 bg-[#3B6FD4] rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
    <span className="text-sm text-[#636A77]">Generating blueprints...</span>
  </div>
);

// --- Metric Components ---

const MetricItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => {
  const isEmpty = !value || value.length === 0;
  return (
    <div className="flex-1 flex flex-col gap-1.5 px-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-semibold text-[#878F9E] uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-lg font-semibold ${isEmpty ? 'text-[#9CA3AF] italic' : 'text-[#212327]'}`}>
        {isEmpty ? 'Pending' : value}
      </span>
    </div>
  );
};

const MetricDivider = () => <div className="w-px h-10 bg-[#DCE1EA]" />;

// --- Compact Summary Card ---

const CompactSummaryCard = ({
  blueprint,
  isSelected,
  onSelect,
}: {
  blueprint: Blueprint;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const confidenceStyle = getConfidenceStyle(blueprint.confidence);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl p-5 min-w-[320px] max-w-[320px] flex flex-col gap-4 cursor-pointer shadow-sm flex-shrink-0 transition-all duration-200 hover:shadow-md ${
        isSelected ? 'border-2 border-[#1957DB]' : 'border-2 border-transparent'
      }`}
    >
      <h3 className="text-lg font-semibold text-[#212327] m-0">{blueprint.name}</h3>

      {/* Confidence Badge */}
      <div className="flex gap-2">
        <span
          className="text-sm font-medium px-2.5 py-1.5 rounded"
          style={{ background: confidenceStyle.bg, color: confidenceStyle.color }}
        >
          {blueprint.confidence} Confidence
        </span>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#878F9E] uppercase">REACH</span>
          <span className={`text-sm font-semibold ${blueprint.metrics.reach ? 'text-[#212327]' : 'text-[#9CA3AF] italic'}`}>
            {blueprint.metrics.reach || 'Pending'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#878F9E] uppercase">CTR</span>
          <span className={`text-sm font-semibold ${blueprint.metrics.ctr ? 'text-[#212327]' : 'text-[#9CA3AF] italic'}`}>
            {blueprint.metrics.ctr || 'Pending'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#878F9E] uppercase">ROAS</span>
          <span className={`text-sm font-semibold ${blueprint.metrics.roas ? 'text-[#212327]' : 'text-[#9CA3AF] italic'}`}>
            {blueprint.metrics.roas || 'Pending'}
          </span>
        </div>
      </div>

      {/* Channels */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <ChannelsIcon />
          <span className="text-[13px] text-[#636A77]">Channels</span>
        </div>
        {blueprint.channels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {blueprint.channels.map((channel, idx) => {
              const icon = getChannelIcon(channel);
              return (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#DCE1EA] rounded">
                  {icon && <img src={icon} alt={channel} className="w-3.5 h-3.5" />}
                  <span className="text-xs text-[#464B55]">{channel}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[13px] text-[#9CA3AF] italic">Continue conversation to define channels</span>
        )}
      </div>

      {/* Audiences */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <AudienceIcon />
          <span className="text-[13px] text-[#636A77]">Audience</span>
        </div>
        {blueprint.audiences.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {blueprint.audiences.slice(0, 3).map((audience, idx) => (
              <span key={idx} className="text-xs font-medium text-[#1957DB] bg-[#F1F4FC] px-2 py-1 rounded">
                {audience}
              </span>
            ))}
            {blueprint.audiences.length > 3 && (
              <span className="text-xs text-[#878F9E]">+{blueprint.audiences.length - 3} more</span>
            )}
          </div>
        ) : (
          <span className="text-[13px] text-[#9CA3AF] italic">Continue conversation to define audience</span>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const CampaignBlueprintsPanel = ({
  blueprints,
  onSelectBlueprint,
  onApplyBlueprint,
  onUpdateBlueprint,
  onExportBlueprints,
  onSendToChat,
  onRequestMissingInfo,
  onSaveForLater,
  onRemoveSaved,
  savedBlueprintIds = [],
  missingFields = [],
  selectedBlueprintId,
  isSaving = false,
  saveStatus = 'idle',
  isApplying = false,
  isLoading = false,
  onApprovePlan,
  onModifyPlan,
  onRegeneratePlan,
  approvedBlueprintId,
  onBlueprintSaveComplete,
  tdSegments = [],
  onBack,
  onContinue,
}: CampaignBlueprintsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'blueprints' | 'comparison'>('blueprints');
  const [appliedBlueprint, setAppliedBlueprint] = useState<Blueprint | null>(null);
  const selectedBlueprint = blueprints.find((b) => b.id === selectedBlueprintId) || blueprints[0];

  const { updateBlueprint } = useBlueprintStore();

  // Show loading skeleton when loading and no blueprints yet
  if (isLoading && blueprints.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col bg-[#F7F8FB] rounded-2xl p-6 gap-5 overflow-hidden">
        <BlueprintLoadingSkeleton />
      </div>
    );
  }

  // If a blueprint has been applied/expanded, show the detail view
  if (appliedBlueprint) {
    return (
      <BlueprintDetailView
        blueprint={appliedBlueprint}
        onClose={() => setAppliedBlueprint(null)}
        onUpdate={(updated) => {
          onUpdateBlueprint?.(updated);
          updateBlueprint(updated.id, updated);
        }}
        editable
        onApprove={() => onApprovePlan?.(appliedBlueprint)}
        onModify={(feedback) => onModifyPlan?.(appliedBlueprint, feedback)}
        onRegenerate={onRegeneratePlan}
        isApproved={approvedBlueprintId === appliedBlueprint.id}
        showApprovalButtons={!!onApprovePlan}
        tdSegments={tdSegments}
        onSaveComplete={onBlueprintSaveComplete}
      />
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F7F8FB] rounded-2xl p-6 gap-5 overflow-hidden relative">
      {/* Loading overlay */}
      {isLoading && blueprints.length > 0 && <LoadingOverlay />}

      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-[35px] h-[35px] border-none bg-transparent rounded cursor-pointer transition-colors duration-200 hover:bg-black/5"
              title="Go back"
            >
              <ArrowLeftIcon />
            </button>
            <button
              className="flex items-center justify-center w-[35px] h-[35px] border-none bg-transparent rounded cursor-pointer opacity-50 cursor-default"
              disabled
            >
              <ArrowRightIcon />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center bg-white rounded-lg border border-[#EFF2F8] overflow-hidden">
            <button
              onClick={() => setActiveTab('blueprints')}
              className={`flex items-center gap-2 px-4 py-2.5 border-none text-sm font-semibold cursor-pointer transition-all duration-200 ${
                activeTab === 'blueprints'
                  ? 'bg-white text-[#212327] shadow-sm'
                  : 'bg-transparent text-[#878F9E] hover:text-[#636A77]'
              }`}
            >
              <MenuIcon color={activeTab === 'blueprints' ? '#212327' : '#878F9E'} />
              Blueprints
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-4 py-2.5 border-none text-sm font-semibold cursor-pointer transition-all duration-200 ${
                activeTab === 'comparison'
                  ? 'bg-white text-[#212327] shadow-sm'
                  : 'bg-transparent text-[#878F9E] hover:text-[#636A77]'
              }`}
            >
              Comparison
            </button>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {selectedBlueprint && onContinue && (
            <button
              onClick={() => {
                setAppliedBlueprint(selectedBlueprint);
                onContinue(selectedBlueprint);
              }}
              className="flex items-center gap-1.5 px-[18px] py-2 bg-black text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors duration-200 hover:bg-[#1a1a1a]"
            >
              View Blueprint
            </button>
          )}
        </div>
      </div>

      {/* Blueprint Cards */}
      {activeTab === 'blueprints' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {blueprints.map((blueprint) => (
              <CompactSummaryCard
                key={blueprint.id}
                blueprint={blueprint}
                isSelected={selectedBlueprintId === blueprint.id}
                onSelect={() => {
                  onSelectBlueprint?.(blueprint);
                  setAppliedBlueprint(blueprint);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comparison Tab (simplified) */}
      {activeTab === 'comparison' && (
        <div className="flex-1 overflow-auto bg-white rounded-lg p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${blueprints.length}, minmax(220px, 1fr))` }}>
            {blueprints.map((bp) => (
              <div
                key={bp.id}
                onClick={() => {
                  onSelectBlueprint?.(bp);
                  setAppliedBlueprint(bp);
                }}
                className={`flex flex-col gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedBlueprintId === bp.id ? 'border-[#1957DB] bg-[#F8FAFF]' : 'border-[#E5E7EB]'
                }`}
              >
                <h4 className="text-base font-semibold text-[#212327] m-0">{bp.name}</h4>
                <p className="text-sm text-[#636A77] m-0 line-clamp-2">{bp.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[10px] text-[#878F9E] uppercase block">Reach</span><span className="text-sm font-semibold text-[#212327]">{bp.metrics.reach || '-'}</span></div>
                  <div><span className="text-[10px] text-[#878F9E] uppercase block">CTR</span><span className="text-sm font-semibold text-[#212327]">{bp.metrics.ctr || '-'}</span></div>
                  <div><span className="text-[10px] text-[#878F9E] uppercase block">ROAS</span><span className="text-sm font-semibold text-[#212327]">{bp.metrics.roas || '-'}</span></div>
                  <div><span className="text-[10px] text-[#878F9E] uppercase block">Conversions</span><span className="text-sm font-semibold text-[#212327]">{bp.metrics.conversions || '-'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignBlueprintsPanel;
