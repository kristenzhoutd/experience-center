import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Blueprint } from '../../../electron/utils/ipc-types';
import type { CampaignBriefData } from '../../types/campaignBriefEditor';
import { formatMessaging } from '../../utils/messagingHelpers';
import { useCampaignLaunchStore } from '../../stores/campaignLaunchStore';

interface ChannelAllocation {
  channel: string;
  role: string;
  notes: string[];
  percentage: number;
  spend: string;
}

interface TDSegment {
  id: string;
  name: string;
  audienceSize?: number;
  parentSegmentName?: string;
}

interface BlueprintDetailViewProps {
  blueprint: Blueprint;
  onClose: () => void;
  onDownload?: () => void;
  onUpdate?: (updatedBlueprint: Blueprint) => void;
  editable?: boolean;
  onApprove?: () => void;
  onModify?: (feedback: string) => void;
  onRegenerate?: () => void;
  isApproved?: boolean;
  showApprovalButtons?: boolean;
  currentVersion?: number;
  totalVersions?: number;
  onVersionChange?: (version: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  tdSegments?: TDSegment[];
  onSaveComplete?: (blueprint: Blueprint) => void;
  briefData?: Partial<CampaignBriefData>;
  onSendToChat?: (message: string) => void;
  isRecalculating?: boolean;
}

// Asset URLs
const imgMetaAds = '/assets/meta-ads.png';
const imgGoogleAds = '/assets/google-ads.png';
const imgTikTokAds = '/assets/tiktok-ads.png';
const imgYouTubeAds = '/assets/youtube-ads.svg';
const imgLinkedInAds = '/assets/linkedin-ads.svg';
const imgPinterestAds = '/assets/pinterest-ads.svg';
const imgSnapchatAds = '/assets/snapchat-ads.svg';
const imgXAds = '/assets/x-ads.svg';
const imgProgrammatic = '/assets/programmatic-ads.svg';
const imgConnectedTV = '/assets/connected-tv.svg';
const imgSpotifyAds = '/assets/spotify-ads.svg';
const imgAmazonAds = '/assets/amazon-ads.svg';

// Valid ad platform names
const VALID_CHANNELS = new Set([
  'Meta Ads', 'Google Ads', 'Google Search', 'Google Display', 'Google Shopping',
  'YouTube', 'YouTube Ads', 'YouTube Shorts', 'TikTok Ads', 'LinkedIn Ads',
  'Pinterest Ads', 'Snapchat Ads', 'Programmatic', 'Email', 'Twitter/X Ads',
  'X Ads', 'Connected TV', 'CTV', 'Spotify Ads', 'Amazon Ads', 'Apple Search Ads',
  'Instagram', 'Instagram Ads', 'Facebook Ads', 'Facebook',
]);

// Fallback role map used only when the AI doesn't provide channel data
const FALLBACK_ROLE_MAP: Record<string, { role: string; notes: string[]; percentage: number }> = {
  'Meta Ads': { role: 'Primary Acquisition', notes: ['Main driver of first-time purchases', 'Retargeting likely to saturate after ~2-3 weeks'], percentage: 50 },
  'Google Ads': { role: 'Demand Capture', notes: ['Captures high-intent demand', 'Scale constrained by search volume'], percentage: 30 },
  'YouTube Shorts': { role: 'Discovery', notes: ['Upper-funnel discovery', 'Test short-form concepts'], percentage: 10 },
  'TikTok Ads': { role: 'Awareness', notes: ['Reach younger demographics', 'Test creative formats'], percentage: 15 },
  'LinkedIn Ads': { role: 'Supporting', notes: ['Supporting channel for additional reach'], percentage: 5 },
  'Programmatic': { role: 'Scale', notes: ['Broad reach programmatic', 'Optimize for viewability'], percentage: 10 },
};

// Generate media mix data from blueprint
const generateMediaMix = (blueprint: Blueprint): ChannelAllocation[] => {
  const budget = parseFloat(blueprint.budget.amount.replace(/[^0-9.]/g, '')) || 0;
  const budgetMultiplier = blueprint.budget.amount.toUpperCase().includes('K') ? 1000 :
    blueprint.budget.amount.toUpperCase().includes('M') ? 1000000 : 1;
  const totalBudget = budget * budgetMultiplier;
  const currencyMatch = blueprint.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '$';

  const formatSpend = (pct: number): string => {
    const value = Math.round(totalBudget * (pct / 100));
    if (value === 0) return '-';
    if (value >= 1000) return `~${currency}${Math.round(value / 1000)}k`;
    return `~${currency}${value}`;
  };

  // Prefer AI-provided channel allocations when available
  const allocs = blueprint.channelAllocations;
  if (allocs && allocs.length > 0) {
    // AI provided rich channel data — use it directly
    const hasPercentages = allocs.some(a => typeof a.budgetPercent === 'number' && a.budgetPercent > 0);

    if (hasPercentages) {
      const totalPct = allocs.reduce((sum, a) => sum + (a.budgetPercent || 0), 0);
      const result = allocs.map(a => {
        const pct = totalPct > 0 ? Math.round(((a.budgetPercent || 0) / totalPct) * 100) : Math.round(100 / allocs.length);
        return {
          channel: a.name,
          role: a.role || FALLBACK_ROLE_MAP[a.name]?.role || 'Supporting',
          notes: FALLBACK_ROLE_MAP[a.name]?.notes || ['AI-allocated channel'],
          percentage: pct,
          spend: formatSpend(pct),
        };
      });
      // Fix rounding
      const sum = result.reduce((s, a) => s + a.percentage, 0);
      if (sum !== 100 && result.length > 0) result[0].percentage += (100 - sum);
      return result.map(a => ({ ...a, spend: formatSpend(a.percentage) }));
    }
  }

  // Fallback: derive from channel names + hardcoded role map
  const raw = blueprint.channels.length > 0 ? blueprint.channels : ['Meta Ads', 'Google Ads'];
  const channelNames = raw.map(ch => typeof ch === 'string' ? ch : (ch as any)?.name || String(ch));
  const channels = channelNames.filter(ch => VALID_CHANNELS.has(ch));
  if (channels.length === 0) channels.push('Meta Ads', 'Google Ads');

  const initialAllocations = channels.map(channel => {
    const config = FALLBACK_ROLE_MAP[channel] || { role: 'Supporting', notes: ['Supporting channel'], percentage: 5 };
    return { channel, role: config.role, notes: config.notes, percentage: config.percentage, spend: '' };
  });

  const totalPct = initialAllocations.reduce((sum, a) => sum + a.percentage, 0);
  const normalized = initialAllocations.map(a => ({
    ...a, percentage: Math.round((a.percentage / totalPct) * 100)
  }));

  const normalizedSum = normalized.reduce((sum, a) => sum + a.percentage, 0);
  if (normalizedSum !== 100 && normalized.length > 0) {
    normalized[0].percentage += (100 - normalizedSum);
  }

  return normalized.map(a => ({ ...a, spend: formatSpend(a.percentage) }));
};

// Generate expected outcomes
const generateOutcomes = (blueprint: Blueprint) => {
  const currencyMatch = blueprint.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '£';
  const budgetNum = parseFloat(blueprint.budget.amount.replace(/[^0-9.]/g, '')) || 0;
  const budgetMultiplier = blueprint.budget.amount.toUpperCase().includes('K') ? 1000 :
    blueprint.budget.amount.toUpperCase().includes('M') ? 1000000 : 1;
  const totalBudget = budgetNum * budgetMultiplier;
  const roasNum = parseFloat((blueprint.metrics.roas || '').replace(/[^0-9.]/g, '')) || 0;
  const onlineSales = totalBudget * roasNum;

  const convStr = blueprint.metrics.conversions || '';
  const convNum = parseFloat(convStr.replace(/[^0-9.]/g, '')) || 0;
  const convMultiplier = convStr.toUpperCase().includes('K') ? 1000 :
    convStr.toUpperCase().includes('M') ? 1000000 : 1;
  const totalConv = convNum * convMultiplier || 1;
  const cpa = totalBudget / totalConv;

  const fmtCurr = (amount: number) => {
    if (amount <= 0) return '-';
    if (amount >= 1000000) return `~${currency}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `~${currency}${(amount / 1000).toFixed(0)}K`;
    return `~${currency}${Math.round(amount)}`;
  };

  return {
    onlineSales: fmtCurr(onlineSales),
    conversions: blueprint.metrics.conversions ? `~${blueprint.metrics.conversions}` : '-',
    roas: roasNum > 0 ? `~${roasNum.toFixed(1)}x` : '-',
    cpa: cpa > 0 && isFinite(cpa) ? fmtCurr(cpa) : '-',
  };
};

// Section Actions toolbar
function SectionActions({ sectionName, onChat, onAIEdit, onEdit, isEditing, isAILoading }: {
  sectionName: string;
  onChat?: (question: string) => void;
  onAIEdit?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  isAILoading?: boolean;
}) {
  return (
    <div className="bg-white border border-[#EFF2F8] rounded-xl shadow-sm flex items-center px-4 py-2.5 gap-4 overflow-hidden">
      <button
        onClick={() => onChat?.(`Why did you choose this ${sectionName.toLowerCase()} approach?`)}
        className="bg-transparent border-none px-2 py-2 text-base font-normal text-[#212327] cursor-pointer whitespace-nowrap rounded-lg transition-colors duration-200 hover:text-[#3B6FD4]"
      >
        Why this?
      </button>
      <div className="w-px h-8 bg-[#DCE1EA] flex-shrink-0" />
      <button
        onClick={() => onChat?.(`Tell me more about the ${sectionName.toLowerCase()} section`)}
        className="w-8 h-8 p-0 bg-white border-none rounded-lg cursor-pointer flex items-center justify-center text-[#212327] flex-shrink-0 transition-all duration-200 hover:text-[#3B6FD4] hover:bg-gray-100"
        title="Ask AI about this section"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M17.5 9.58C17.5 10.68 17.25 11.77 16.75 12.75C16.16 13.93 15.26 14.92 14.14 15.61C13.02 16.3 11.73 16.67 10.42 16.67C9.32 16.67 8.23 16.41 7.25 15.92L2.5 17.5L4.08 12.75C3.59 11.77 3.33 10.68 3.33 9.58C3.33 8.27 3.7 6.98 4.39 5.86C5.08 4.74 6.07 3.84 7.25 3.25C8.23 2.75 9.32 2.5 10.42 2.5H10.83C12.57 2.6 14.21 3.33 15.44 4.56C16.67 5.79 17.4 7.43 17.5 9.17V9.58Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="w-px h-8 bg-[#DCE1EA] flex-shrink-0" />
      <button
        onClick={onAIEdit}
        disabled={isAILoading}
        className={`w-8 h-8 p-0 bg-white border-none rounded-lg cursor-pointer flex items-center justify-center text-[#212327] flex-shrink-0 transition-all duration-200 hover:text-[#3B6FD4] hover:bg-gray-100 ${
          isAILoading ? 'text-[#3B6FD4] bg-[#EEF2FF]' : ''
        }`}
        title="AI Edit"
      >
        {isAILoading ? (
          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#3B6FD4] rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14.167 2.5L17.5 5.833L6.667 16.667H3.333V13.333L14.167 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <button
        onClick={onEdit}
        className={`w-8 h-8 p-0 bg-white border-none rounded-lg cursor-pointer flex items-center justify-center text-[#212327] flex-shrink-0 transition-all duration-200 hover:text-[#3B6FD4] hover:bg-gray-100 ${
          isEditing ? 'text-[#3B6FD4] bg-[#EEF2FF]' : ''
        }`}
        title={isEditing ? 'Stop editing' : 'Edit'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.333 2L14 4.667L5.333 13.333H2.667V10.667L11.333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// Channel icon helper
const getChannelIcon = (channel: string | unknown): string | null => {
  // Handle both string and object channel formats
  const channelName = typeof channel === 'string' ? channel : (channel as any)?.name || String(channel);
  const lc = channelName.toLowerCase();
  if (lc.includes('instagram')) return '/assets/instagram-ads.svg';
  if (lc.includes('meta') || lc.includes('facebook')) return imgMetaAds;
  if (lc.includes('youtube')) return imgYouTubeAds;
  if (lc.includes('google')) return imgGoogleAds;
  if (lc.includes('tiktok')) return imgTikTokAds;
  if (lc.includes('pinterest')) return imgPinterestAds;
  if (lc.includes('linkedin')) return imgLinkedInAds;
  if (lc.includes('snapchat')) return imgSnapchatAds;
  if (lc.includes('twitter') || lc === 'x' || lc.includes('x ads')) return imgXAds;
  if (lc.includes('programmatic')) return imgProgrammatic;
  if (lc.includes('connected tv') || lc.includes('ctv')) return imgConnectedTV;
  if (lc.includes('spotify')) return imgSpotifyAds;
  if (lc.includes('amazon')) return imgAmazonAds;
  return null;
};

// Add Channel dropdown for Media Mix editing
function AddChannelDropdown({
  availableChannels,
  onAdd,
  getChannelIcon: getIcon,
}: {
  availableChannels: string[];
  onAdd: (channel: string) => void;
  getChannelIcon: (ch: string) => string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const filtered = availableChannels.filter(ch =>
    ch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
          isOpen
            ? 'border-[#3B6FD4] bg-[#FAFBFF] text-[#3B6FD4]'
            : 'border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add Channel
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-72 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels..."
              autoFocus
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 outline-none focus:border-[#3B6FD4] placeholder:text-gray-400"
            />
          </div>
          <div className="overflow-y-auto max-h-52 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">No channels available</div>
            ) : (
              filtered.map((ch) => {
                const icon = getIcon(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => { onAdd(ch); setIsOpen(false); setSearch(''); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer hover:bg-[#F7F8FB] transition-colors"
                  >
                    {icon ? (
                      <img src={icon} alt="" className="w-5 h-5 object-contain flex-shrink-0 rounded" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500">
                        {ch.charAt(0)}
                      </div>
                    )}
                    {ch}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Human-readable labels for Meta campaign objectives
const META_OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS: 'Awareness',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_SALES: 'Sales',
  OUTCOME_ENGAGEMENT: 'Engagement',
  OUTCOME_APP_PROMOTION: 'App Promotion',
  OUTCOME_TRAFFIC: 'Traffic',
};

// Map blueprint messaging/CTA keywords to Meta campaign objectives
function mapToMetaObjective(blueprint: Blueprint): string {
  const text = [
    blueprint.messaging,
    blueprint.cta,
    blueprint.creativeBrief?.primaryAngle,
    ...(blueprint.creativeBrief?.supportingMessages || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/awareness|reach|brand/.test(text)) return 'OUTCOME_AWARENESS';
  if (/leads?(\s|$|[^r])|lead\s*gen/.test(text)) return 'OUTCOME_LEADS';
  if (/sales|conversions?|purchase|revenue|roas/.test(text)) return 'OUTCOME_SALES';
  if (/engagement|video\s*views?|interact/.test(text)) return 'OUTCOME_ENGAGEMENT';
  if (/app|install/.test(text)) return 'OUTCOME_APP_PROMOTION';
  if (/traffic|clicks?|visits?|website/.test(text)) return 'OUTCOME_TRAFFIC';
  return 'OUTCOME_TRAFFIC';
}

// Parse budget string like "$50K", "£100k", "$200,000" into cents (integer)
function parseBudgetToCents(amount: string): number {
  const num = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const multiplier = amount.toUpperCase().includes('M')
    ? 1_000_000
    : amount.toUpperCase().includes('K')
      ? 1_000
      : 1;
  return Math.round(num * multiplier * 100);
}

// --- Launch to Meta confirmation modal ---
interface MetaLaunchParams {
  campaignName: string;
  objective: string;
  status: string;
  dailyBudget: number; // in cents
  specialAdCategories: string[];
  buyingType: string;
}

// Meta special ad category options
const SPECIAL_AD_CATEGORIES = [
  { value: 'NONE', label: 'None' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'ISSUES_ELECTIONS_POLITICS', label: 'Social Issues, Elections or Politics' },
];

interface LaunchToMetaModalProps {
  blueprint: Blueprint;
  onConfirm: (params: MetaLaunchParams) => void;
  onCancel: () => void;
  isLaunching: boolean;
}

function LaunchToMetaModal({ blueprint, onConfirm, onCancel, isLaunching }: LaunchToMetaModalProps) {
  const defaultObjective = mapToMetaObjective(blueprint);
  const totalCents = parseBudgetToCents(blueprint.budget.amount);
  const defaultDailyCents = Math.max(100, Math.round(totalCents / 30));

  const [campaignName, setCampaignName] = useState(blueprint.name || 'Campaign from Blueprint');
  const [objective, setObjective] = useState(defaultObjective);
  const [status, setStatus] = useState('PAUSED');
  const [dailyBudgetStr, setDailyBudgetStr] = useState(() => (defaultDailyCents / 100).toFixed(2));
  const [specialAdCategory, setSpecialAdCategory] = useState('NONE');
  const [buyingType, setBuyingType] = useState('AUCTION');

  const currencyMatch = blueprint.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '$';

  const dailyBudgetNum = parseFloat(dailyBudgetStr) || 0;
  const totalBudgetNum = totalCents / 100;

  const fmtCurrency = (amount: number) => {
    return `${currency}${Math.round(amount).toLocaleString('en-US')}`;
  };

  const handleConfirm = () => {
    const dailyCents = Math.max(100, Math.round(dailyBudgetNum * 100));
    onConfirm({
      campaignName,
      objective,
      status,
      dailyBudget: dailyCents,
      specialAdCategories: specialAdCategory === 'NONE' ? [] : [specialAdCategory],
      buyingType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img src={imgMetaAds} alt="" className="w-5 h-5" />
            <h3 className="text-base font-semibold text-gray-900 m-0">Launch to Meta</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          <p className="text-sm text-gray-500 m-0">Review and edit the campaign details before pushing to Meta Ads Manager.</p>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all"
            />
          </div>

          {/* Objective + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Objective</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all bg-white cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {Object.entries(META_OBJECTIVE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all bg-white cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="PAUSED">Paused</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
          </div>

          {/* Daily Budget + Total Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Daily Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{currency}</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={dailyBudgetStr}
                  onChange={(e) => setDailyBudgetStr(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Total Budget</label>
              <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900">
                {fmtCurrency(totalBudgetNum)}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">From blueprint (read-only)</div>
            </div>
          </div>

          {/* Buying Type + Special Ad Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Buying Type</label>
              <select
                value={buyingType}
                onChange={(e) => setBuyingType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all bg-white cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="AUCTION">Auction</option>
                <option value="RESERVED">Reservation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Special Ad Category</label>
              <select
                value={specialAdCategory}
                onChange={(e) => setSpecialAdCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/10 transition-all bg-white cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {SPECIAL_AD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active status warning */}
          {status === 'ACTIVE' && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.5"/>
                <path d="M8 5V8.5M8 11H8.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-amber-800">This campaign will start spending immediately once created. Consider launching as Paused to review first.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={isLaunching}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLaunching || !campaignName.trim() || dailyBudgetNum < 1}
            className="px-6 py-2.5 bg-[#1877F2] border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-[#1565D8] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLaunching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <img src={imgMetaAds} alt="" className="w-4 h-4" />
                Launch to Meta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export const BlueprintDetailView: React.FC<BlueprintDetailViewProps> = ({
  blueprint,
  onClose,
  onDownload,
  onUpdate,
  editable = true,
  onApprove,
  onModify,
  onRegenerate,
  isApproved = false,
  showApprovalButtons = false,
  currentVersion = 1,
  totalVersions = 1,
  onVersionChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  tdSegments = [],
  onSaveComplete,
  briefData,
  onSendToChat,
  isRecalculating = false,
}) => {
  const navigate = useNavigate();

  // --- Local editable blueprint state ---
  const [local, setLocal] = useState<Blueprint>(() => ({ ...blueprint }));
  const [allocations, setAllocations] = useState<ChannelAllocation[]>(() => generateMediaMix(blueprint));
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [aiLoadingSection, setAiLoadingSection] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // (Launch state removed — now handled by CampaignLaunchPage)

  // Sync local state when blueprint prop changes externally (e.g. AI update)
  const prevBlueprintId = useRef(blueprint.id);
  useEffect(() => {
    if (blueprint.id !== prevBlueprintId.current || blueprint.updatedAt !== local.updatedAt) {
      setLocal({ ...blueprint });
      setAllocations(generateMediaMix(blueprint));
      setHasChanges(false);
      prevBlueprintId.current = blueprint.id;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint]);

  // Helper: apply partial updates to local blueprint, mark changes
  const applyLocalUpdate = useCallback((updates: Partial<Blueprint>) => {
    setLocal(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Recompute outcomes from local state so they react to edits
  const outcomes = useMemo(() => generateOutcomes(local), [local]);

  // Currency and budget calculations from local
  const currencyMatch = local.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '£';
  const budgetNum = parseFloat(local.budget.amount.replace(/[^0-9.]/g, '')) || 0;
  const budgetMultiplier = local.budget.amount.toUpperCase().includes('K') ? 1000 :
    local.budget.amount.toUpperCase().includes('M') ? 1000000 : 1;
  const totalBudget = budgetNum * budgetMultiplier;

  const formatSpend = useCallback((pct: number): string => {
    const value = Math.round(totalBudget * (pct / 100) / 1000);
    if (value === 0) return '-';
    return `~${currency}${value}k`;
  }, [totalBudget, currency]);

  // Recalculate allocation spend strings when budget changes
  useEffect(() => {
    setAllocations(prev => prev.map(a => ({ ...a, spend: formatSpend(a.percentage) })));
  }, [formatSpend]);

  // Listen for AI media mix recommendations
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        channels?: Array<{ name: string; role: string; percentage: number; rationale: string }>;
        strategy?: string;
      };
      if (!detail?.channels?.length) return;
      const newAllocations: ChannelAllocation[] = detail.channels.map(ch => ({
        channel: ch.name,
        role: ch.role,
        notes: [ch.rationale],
        percentage: ch.percentage,
        spend: formatSpend(ch.percentage),
      }));
      setAllocations(newAllocations);
      setLocal(prev => ({ ...prev, channels: newAllocations.map(a => a.channel) }));
      setHasChanges(true);
      setAiLoadingSection(null);
    };
    window.addEventListener('media-mix-update', handler);
    return () => window.removeEventListener('media-mix-update', handler);
  }, [formatSpend]);

  // --- Section Chat ---
  const handleSectionChat = (question: string) => {
    onSendToChat?.(question);
  };

  // --- AI Edit: send structured context to chat ---
  const handleSectionAIEdit = useCallback((sectionName: string) => {
    if (aiLoadingSection || !onSendToChat) return;
    setAiLoadingSection(sectionName);

    if (sectionName === 'Media Mix') {
      // Use the recommend-media-mix skill for channel + budget recommendations
      const currentMix = allocations.map(a => ({ channel: a.channel, role: a.role, percentage: a.percentage }));
      const prompt = [
        'Recommend the optimal media channel mix and budget allocation for my campaign.',
        '',
        `Campaign objective: ${briefData?.businessObjective || local.messaging || 'Drive conversions'}`,
        `Budget: ${local.budget.amount || 'Not specified'}`,
        `Pacing: ${local.budget.pacing || 'Even'}`,
        `Target audiences: ${local.audiences.join(', ') || 'Not specified'}`,
        `Primary KPIs: ${briefData?.primaryKpis?.join(', ') || 'CPA, ROAS'}`,
        '',
        `Current media mix:`,
        ...currentMix.map(ch => `  - ${ch.channel} (${ch.role}): ${ch.percentage}%`),
        '',
        'Analyze the current mix and recommend improvements. Add or remove channels as needed.',
        'Output your recommendation inside a media-mix-json code fence.',
      ].join('\n');

      onSendToChat(prompt);
      // Loading cleared by media-mix-update event listener or timeout
      setTimeout(() => setAiLoadingSection(null), 15000);
      return;
    }

    // Other sections: generic AI edit
    const sectionData: Record<string, unknown> = {};
    switch (sectionName) {
      case 'Overview':
        sectionData.messaging = local.messaging;
        sectionData.budget = local.budget;
        sectionData.channels = local.channels;
        sectionData.audiences = local.audiences;
        break;
      case 'Targeting':
        sectionData.audiences = local.audiences;
        sectionData.channels = local.channels;
        break;
      case 'Creative Brief':
        sectionData.messaging = local.messaging;
        sectionData.creativeBrief = local.creativeBrief;
        sectionData.cta = local.cta;
        break;
    }

    const prompt = [
      `Improve the "${sectionName}" section of my campaign blueprint.`,
      `Current data: ${JSON.stringify(sectionData, null, 2)}`,
      '',
      'Suggest specific improvements. Output your changes inside a brief-update-json code fence with only the changed fields.',
    ].join('\n');

    onSendToChat(prompt);
    setTimeout(() => setAiLoadingSection(null), 10000);
  }, [aiLoadingSection, onSendToChat, local, allocations, briefData]);

  // --- Section editing: initialize drafts ---
  const handleSectionEdit = (sectionName: string) => {
    if (editingSection === sectionName) {
      setEditingSection(null);
      setEditDraft({});
    } else {
      const drafts: Record<string, string> = {};
      switch (sectionName) {
        case 'Overview':
          drafts.description = local.messaging || '';
          drafts.budget = local.budget.amount || '';
          break;
        case 'Creative Brief':
          drafts.primaryAngle = local.creativeBrief?.primaryAngle || formatMessaging(local.messaging) || '';
          drafts.cta = local.cta || '';
          break;
      }
      setEditDraft(drafts);
      setEditingSection(sectionName);
    }
  };

  // --- Section save: apply draft edits to local blueprint ---
  const handleSectionSave = useCallback((sectionName: string) => {
    switch (sectionName) {
      case 'Overview': {
        const budgetChanged = editDraft.budget && editDraft.budget !== local.budget.amount;
        const updates: Partial<Blueprint> = { messaging: editDraft.description || local.messaging };
        if (budgetChanged) {
          updates.budget = { ...local.budget, amount: editDraft.budget! };
        }
        applyLocalUpdate(updates);
        break;
      }
      case 'Media Mix': {
        // Recalculate spend strings from current allocations
        const updated = allocations.map(a => ({ ...a, spend: formatSpend(a.percentage) }));
        setAllocations(updated);
        applyLocalUpdate({ channels: updated.map(a => a.channel) });
        break;
      }
      case 'Targeting':
        if (editDraft.audiences) {
          const names = editDraft.audiences.split('\n').map(s => s.trim()).filter(Boolean);
          applyLocalUpdate({ audiences: names });
        }
        break;
      case 'Creative Brief':
        applyLocalUpdate({
          messaging: editDraft.primaryAngle || local.messaging,
          cta: editDraft.cta || local.cta,
          creativeBrief: {
            ...local.creativeBrief,
            primaryAngle: editDraft.primaryAngle || local.creativeBrief?.primaryAngle || '',
            confidence: local.creativeBrief?.confidence || local.confidence,
            supportingMessages: local.creativeBrief?.supportingMessages || [],
            recommendedFormats: local.creativeBrief?.recommendedFormats || [],
            fatigueRisk: local.creativeBrief?.fatigueRisk || [],
            refreshPlan: local.creativeBrief?.refreshPlan || [],
          },
        });
        break;
    }
    setEditingSection(null);
    setEditDraft({});
  }, [editDraft, local, allocations, formatSpend, applyLocalUpdate]);

  // --- Media Mix allocation editing ---
  const handleAllocationChange = useCallback((idx: number, newPct: number) => {
    setAllocations(prev => {
      const updated = [...prev];
      const clamped = Math.max(0, Math.min(100, newPct));
      const diff = clamped - updated[idx].percentage;
      updated[idx] = { ...updated[idx], percentage: clamped, spend: formatSpend(clamped) };
      // Redistribute diff across other channels proportionally
      const others = updated.filter((_, i) => i !== idx);
      const otherTotal = others.reduce((s, a) => s + a.percentage, 0);
      if (otherTotal > 0) {
        for (let i = 0; i < updated.length; i++) {
          if (i !== idx) {
            const share = updated[i].percentage / otherTotal;
            updated[i] = { ...updated[i], percentage: Math.max(0, Math.round(updated[i].percentage - diff * share)) };
            updated[i].spend = formatSpend(updated[i].percentage);
          }
        }
      }
      // Ensure total is 100
      const total = updated.reduce((s, a) => s + a.percentage, 0);
      if (total !== 100 && updated.length > 0) {
        const adjustIdx = idx === 0 ? 1 : 0;
        if (updated[adjustIdx]) {
          updated[adjustIdx] = { ...updated[adjustIdx], percentage: updated[adjustIdx].percentage + (100 - total) };
          updated[adjustIdx].spend = formatSpend(updated[adjustIdx].percentage);
        }
      }
      return updated;
    });
    setHasChanges(true);
  }, [formatSpend]);

  const handleRemoveChannel = useCallback((idx: number) => {
    setAllocations(prev => {
      const removed = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      if (rest.length === 0) return prev;
      const redistPct = removed.percentage / rest.length;
      return rest.map(a => {
        const newPct = Math.round(a.percentage + redistPct);
        return { ...a, percentage: newPct, spend: formatSpend(newPct) };
      });
    });
    setHasChanges(true);
  }, [formatSpend]);

  const handleAddChannel = useCallback((channel: string) => {
    setAllocations(prev => {
      if (prev.some(a => a.channel === channel)) return prev;
      // Give new channel 10%, shrink others proportionally
      const newPct = 10;
      const scale = (100 - newPct) / 100;
      const shrunk = prev.map(a => {
        const pct = Math.max(1, Math.round(a.percentage * scale));
        return { ...a, percentage: pct, spend: formatSpend(pct) };
      });
      // Correct rounding
      const shrunkTotal = shrunk.reduce((s, a) => s + a.percentage, 0);
      const adjustedNewPct = 100 - shrunkTotal;
      const roleMap: Record<string, string> = {
        'Meta Ads': 'Acquisition', 'Google Ads': 'Demand Capture', 'TikTok Ads': 'Awareness',
        'YouTube': 'Discovery', 'YouTube Shorts': 'Discovery', 'LinkedIn Ads': 'B2B',
        'Pinterest Ads': 'Inspiration', 'Snapchat Ads': 'Awareness', 'Programmatic': 'Scale',
        'Connected TV': 'Reach', 'Spotify Ads': 'Audio', 'Amazon Ads': 'Commerce',
      };
      const newAlloc: ChannelAllocation = {
        channel,
        role: roleMap[channel] || 'Supporting',
        notes: [],
        percentage: adjustedNewPct,
        spend: formatSpend(adjustedNewPct),
      };
      return [...shrunk, newAlloc];
    });
    setHasChanges(true);
  }, [formatSpend]);

  // Available channels not yet in the mix
  const availableChannels = useMemo(() => {
    const current = new Set(allocations.map(a => a.channel));
    return Array.from(VALID_CHANNELS).filter(ch => !current.has(ch));
  }, [allocations]);

  // --- Global save ---
  const handleSave = useCallback(() => {
    if (!onUpdate) return;
    setIsSaving(true);

    const updatedBlueprint: Blueprint = { ...local, channels: allocations.map(a => a.channel) };
    onUpdate(updatedBlueprint);

    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      if (onSaveComplete) {
        onSaveComplete(updatedBlueprint);
      } else {
        setShowSaveToast(true);
        if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
        saveToastTimer.current = setTimeout(() => setShowSaveToast(false), 3000);
      }
    }, 500);
  }, [local, allocations, onUpdate, onSaveComplete]);

  // (handleLaunchToMeta removed — now handled by CampaignLaunchPage)

  // --- Confidence score (recomputed from local) ---
  const confidenceScore = useMemo(() => {
    let score = 0;
    if (local.budget?.amount && parseFloat(local.budget.amount.replace(/[^0-9.]/g, '')) > 0) score += 15;
    if (local.channels.length > 0) score += 10;
    if (local.channels.length >= 3) score += 5;
    if (local.audiences.length > 0) score += 10;
    if (local.audiences.length >= 2) score += 5;
    if (local.metrics.roas || local.metrics.ctr) score += 10;
    if (local.metrics.reach) score += 5;
    if (briefData?.primaryGoals?.length) score += 5;
    if (briefData?.primaryKpis?.length) score += 5;
    if (briefData?.primaryAudience?.length) score += 5;
    if (local.budget?.pacing) score += 5;
    if (briefData?.timelineStart) score += 5;
    const mult = local.confidence === 'High' ? 1.0 : local.confidence === 'Medium' ? 0.9 : 0.8;
    return Math.min(Math.round(score * mult), 100);
  }, [local, briefData]);

  const hasBudget = budgetNum > 0;

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA] overflow-y-auto rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8ECF3] rounded-t-xl flex-shrink-0">
        {/* Left - Program Name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-[#636A77] flex-shrink-0">Program:</span>
          <span className="text-sm font-semibold text-[#212327] truncate">{briefData?.campaignDetails || local.name}</span>
        </div>

        {/* Right - Undo/Redo + Primary Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className={`flex items-center justify-center w-7 h-7 bg-transparent border-none rounded transition-all duration-200 ${canUndo ? 'cursor-pointer text-[#636A77] hover:bg-gray-100' : 'cursor-default text-[#C5CAD3]'}`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3.33334 6H10C11.841 6 13.3333 7.49238 13.3333 9.33333C13.3333 11.1743 11.841 12.6667 10 12.6667H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.33334 8L3.33334 6L5.33334 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className={`flex items-center justify-center w-7 h-7 bg-transparent border-none rounded transition-all duration-200 ${canRedo ? 'cursor-pointer text-[#636A77] hover:bg-gray-100' : 'cursor-default text-[#C5CAD3]'}`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M12.6667 6H6C4.15905 6 2.66667 7.49238 2.66667 9.33333C2.66667 11.1743 4.15905 12.6667 6 12.6667H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.6667 8L12.6667 6L10.6667 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => {
              handleSave();
              navigate('/campaign-launch', { state: { blueprintId: local.id } });
            }}
            className="flex items-center gap-1.5 h-8 px-5 py-2 rounded-lg border-none bg-[#212327] text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:bg-[#3a3d42]"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-5 p-5" style={{ gridTemplateColumns: '240px 1fr' }}>
        {/* Left Sidebar */}
        <div className="flex flex-col gap-5 relative">
          {/* Recalculating overlay */}
          {isRecalculating && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl px-4 py-3 flex items-center gap-2.5 border border-blue-200 shadow-sm animate-pulse">
              <div className="w-4 h-4 border-2 border-[#3B6FD4] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-[#1957DB]">AI is re-evaluating your changes...</span>
            </div>
          )}

          {/* Confidence Score */}
          <div className={`bg-white rounded-xl p-5 shadow-sm transition-opacity duration-300 ${isRecalculating ? 'opacity-50 mt-12' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-[60px] h-[60px]">
                <svg viewBox="0 0 36 36" className="w-[60px] h-[60px] -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray={`${confidenceScore}, 100`} />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-green-500">
                  {confidenceScore}%
                </div>
              </div>
              <div className="text-xs text-gray-500">Campaign Confidence Score</div>
            </div>

            {/* Expected Outcomes */}
            <div className="mb-2">
              <div className="text-[13px] font-semibold text-gray-900 mb-3">Expected Outcomes</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Online Sales', value: outcomes.onlineSales },
                  { label: 'Conversions', value: outcomes.conversions },
                  { label: 'ROAS', value: outcomes.roas },
                  { label: 'CPA', value: outcomes.cpa },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[11px] text-gray-500">{item.label}</div>
                    <div className="text-base font-semibold text-gray-900">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blueprint Health */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-[13px] font-semibold text-gray-900 mb-3">Blueprint Health</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Budget Sufficiency', ok: hasBudget },
                { label: 'Audience Reachability', ok: local.audiences.length > 0 },
                { label: 'Creative Readiness', ok: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-700">{item.label}</span>
                  <span className={`text-[13px] font-medium ${item.ok ? 'text-green-500' : 'text-yellow-500'}`}>
                    {item.ok ? 'Good' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          {/* Overview Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 m-0">Overview</h2>
              </div>
              <SectionActions
                sectionName="Overview"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Overview')}
                onEdit={() => handleSectionEdit('Overview')}
                isEditing={editingSection === 'Overview'}
                isAILoading={aiLoadingSection === 'Overview'}
              />
            </div>

            {/* Campaign snapshot bar — 3 columns */}
            <div className="flex gap-0 mb-6 bg-gray-50 rounded-[10px] overflow-hidden border border-[#F0F1F3]">
              {/* Budget */}
              <div className="flex-1 px-4 py-3 flex flex-col border-r border-gray-200">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Budget</div>
                {editingSection === 'Overview' ? (
                  <input
                    type="text"
                    value={editDraft.budget ?? ''}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="e.g. $200,000"
                    className="mt-0.5 w-full px-2 py-1 border border-[#3B6FD4] rounded text-[13px] font-semibold text-gray-900 outline-none bg-[#FAFBFF] focus:ring-2 focus:ring-[#3B6FD4]/10"
                  />
                ) : (
                  <div className="text-[13px] font-semibold text-gray-900 mt-0.5">{briefData?.budgetAmount || local.budget?.amount || '$200,000'}</div>
                )}
              </div>
              {/* Timeline */}
              <div className="flex-1 px-4 py-3 flex flex-col border-r border-gray-200">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Timeline</div>
                <div className="text-[13px] font-semibold text-gray-900 mt-0.5">
                  {(() => {
                    const s = briefData?.timelineStart; const e = briefData?.timelineEnd;
                    if (s && e) { const fmt = (d: string) => { const p = new Date(d); return isNaN(p.getTime()) ? d.replace(/,?\s*\d{4}/, '') : p.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }; return `${fmt(s)} – ${fmt(e)}`; }
                    return 'TBD';
                  })()}
                </div>
              </div>
              {/* Channels */}
              <div className="flex-1 px-4 py-3 flex flex-col">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Channels</div>
                <div className="text-[13px] font-semibold text-gray-900 mt-0.5">{`${allocations.length} channel${allocations.length !== 1 ? 's' : ''}`}</div>
              </div>
            </div>

            {/* Two-column grid: Objective + KPIs | Attribution + Success */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left: Objective & KPIs */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2.5">Primary Objective</h3>
                  {editingSection === 'Overview' ? (
                    <textarea
                      value={editDraft.description ?? formatMessaging(local.messaging) ?? ''}
                      onChange={(e) => setEditDraft(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-[#3B6FD4] rounded-lg text-sm text-gray-700 leading-relaxed resize-y outline-none bg-[#FAFBFF] focus:ring-2 focus:ring-[#3B6FD4]/10"
                    />
                  ) : (
                    <div className="border-l-[3px] border-[#3B6FD4] pl-3.5">
                      <p className="text-sm text-gray-800 leading-relaxed m-0">
                        {briefData?.businessObjective || formatMessaging(local.messaging) || 'Efficiently acquire new customers while maintaining stable cost per acquisition.'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-3">Key Performance Indicators</h3>
                  <div className="flex flex-col gap-2.5">
                    {/* Northstar KPI */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3B6FD4] flex-shrink-0" />
                      <span className="text-[13px] text-gray-700">
                        <strong className="font-semibold text-gray-900">Northstar:</strong>{' '}
                        {briefData?.primaryKpis?.[0] || 'CPA'}
                      </span>
                      <span className="text-[11px] font-semibold text-[#1957DB] bg-[#EFF6FF] px-2 py-0.5 rounded uppercase tracking-wide">Primary</span>
                    </div>
                    {/* Secondary KPIs */}
                    {(briefData?.secondaryKpis?.length ? briefData.secondaryKpis : briefData?.primaryKpis?.slice(1) || ['Conversion Rate', 'ROAS']).map((kpi: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                        <span className="text-[13px] text-gray-700">{kpi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Attribution & Success */}
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2.5">Attribution Window</h3>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-[#F0F1F3]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
                      <circle cx="9" cy="9" r="7" stroke="#3B6FD4" strokeWidth="1.4"/>
                      <path d="M9 5V9L11.5 11.5" stroke="#3B6FD4" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">7-day click / 1-day view</div>
                      <div className="text-xs text-gray-500 mt-0.5">Balances responsiveness with signal reliability</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-3">What success looks like</h3>
                  <div className="flex flex-col gap-2.5">
                    {(() => {
                      const goals = [...(briefData?.primaryGoals || []), ...(briefData?.secondaryGoals || [])];
                      return (goals.length > 0 ? goals.slice(0, 4) : [
                        'New-customer growth at or below target CPA',
                        'Stable performance through learning phases',
                        'Clear signals to scale, hold, or reallocate',
                        'Actionable insights for future campaigns',
                      ]).map((g: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-md bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M3 6L5 8L9 4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <span className="text-[13px] text-gray-700 leading-snug">{g}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
            {editingSection === 'Overview' && (
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => { setEditingSection(null); setEditDraft({}); }} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleSectionSave('Overview')} className="px-3.5 py-1.5 bg-[#212327] border-none rounded-lg text-[13px] text-white cursor-pointer hover:bg-gray-700">Save</button>
              </div>
            )}
          </div>

          {/* Media Mix Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 m-0">Media Mix</h2>
                <p className="text-sm text-[#464B55] m-0 mt-1">Channels, formats, and execution considerations</p>
              </div>
              <SectionActions
                sectionName="Media Mix"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Media Mix')}
                onEdit={() => handleSectionEdit('Media Mix')}
                isEditing={editingSection === 'Media Mix'}
                isAILoading={aiLoadingSection === 'Media Mix'}
              />
            </div>

            {/* Table header */}
            <div className="flex items-center gap-4 py-2 mt-4 border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              <div className="w-8 flex-shrink-0" />
              <div className="flex-1">Channel</div>
              <div className="w-28 text-center">Role</div>
              <div className="w-20 text-right">Weight</div>
              <div className="w-16 text-right">Spend</div>
            </div>

            <div className="flex flex-col">
              {allocations.map((alloc, idx) => {
                const icon = getChannelIcon(alloc.channel);
                return (
                  <div key={idx} className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {icon ? <img src={icon} alt={alloc.channel} className="w-5 h-5" /> : <span className="text-xs font-bold text-gray-400">{alloc.channel.charAt(0)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{alloc.channel}</span>
                    </div>
                    <div className="w-28 text-center">
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{alloc.role}</span>
                    </div>
                    <div className="w-20 text-right">
                      {editingSection === 'Media Mix' ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={alloc.percentage}
                          onChange={(e) => handleAllocationChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 border border-gray-300 rounded text-sm text-right text-gray-900 outline-none focus:border-[#3B6FD4]"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">{alloc.percentage}%</span>
                      )}
                    </div>
                    <div className="w-16 text-right flex items-center justify-end gap-1">
                      <span className="text-xs text-gray-500">{alloc.spend}</span>
                      {editingSection === 'Media Mix' && allocations.length > 1 && (
                        <button
                          onClick={() => handleRemoveChannel(idx)}
                          className="w-5 h-5 flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-red-500 p-0"
                          title="Remove channel"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {editingSection === 'Media Mix' && (
              <div className="flex flex-col gap-3 mt-4">
                {/* Add Channel */}
                {availableChannels.length > 0 && (
                  <AddChannelDropdown
                    availableChannels={availableChannels}
                    onAdd={handleAddChannel}
                    getChannelIcon={getChannelIcon}
                  />
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setEditingSection(null); setAllocations(generateMediaMix(local)); }} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleSectionSave('Media Mix')} className="px-3.5 py-1.5 bg-[#212327] border-none rounded-lg text-[13px] text-white cursor-pointer hover:bg-gray-700">Save</button>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center gap-4 py-3 mt-1 border-t border-gray-300">
              <div className="w-8 flex-shrink-0" />
              <div className="flex-1 text-sm font-semibold text-gray-900">Total</div>
              <div className="w-28" />
              <div className="w-20 text-right text-sm font-semibold text-gray-900">100%</div>
              <div className="w-16 text-right text-xs font-semibold text-gray-700">
                {totalBudget > 0 ? `${currency}${totalBudget >= 1000 ? `${Math.round(totalBudget / 1000)}k` : totalBudget}` : '-'}
              </div>
            </div>
          </div>

          {/* Who we're targeting Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 m-0">Who we're targeting</h2>
                <p className="text-sm text-[#464B55] m-0 mt-1">Priority audiences, intent signals, and reach assumptions</p>
              </div>
              <SectionActions
                sectionName="Targeting"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Targeting')}
                onEdit={() => handleSectionEdit('Targeting')}
                isEditing={editingSection === 'Targeting'}
                isAILoading={aiLoadingSection === 'Targeting'}
              />
            </div>

            {/* Audience cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {local.audiences.length > 0 ? local.audiences.map((audience, idx) => {
                const audienceName = typeof audience === 'string' ? audience : (audience as any)?.name || String(audience);
                return (
                  <div key={idx} className={`rounded-2xl p-6 flex flex-col gap-4 ${idx === 0 ? 'bg-[#F7F8FB]' : 'border border-[#DCE1EA]'}`}>
                    <div className="flex justify-end">
                      <span className="text-xs font-medium text-[#25582E] bg-[#C9F3D1] px-2 py-1 rounded">
                        {local.confidence}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-[#464B55]">{idx === 0 ? 'Primary Audience' : 'Secondary Audience'}</div>
                      {editingSection === 'Targeting' ? (
                        <input
                          type="text"
                          value={editDraft[`audience_${idx}`] ?? audienceName}
                          onChange={(e) => {
                            setEditDraft(prev => ({ ...prev, [`audience_${idx}`]: e.target.value }));
                          }}
                          className="w-full px-3 py-2 border border-[#3B6FD4] rounded-lg text-base text-[#212327] outline-none bg-[#FAFBFF] focus:ring-2 focus:ring-[#3B6FD4]/10"
                        />
                      ) : (
                        <div className="text-base font-medium text-[#212327]">{audienceName}</div>
                      )}
                      <div className="flex gap-2">
                        <span className="text-xs font-medium text-[#1957DB] bg-[#F1F4FC] px-2 py-0.5 rounded">
                          {idx === 0 ? 'High Intent' : 'Lookalike'}
                        </span>
                        <span className="text-xs font-medium text-[#1957DB] bg-[#F1F4FC] px-2 py-0.5 rounded">
                          {idx === 0 ? 'Prospecting' : 'Expansion'}
                        </span>
                      </div>
                    </div>
                    <div className="h-px bg-[#DCE1EA]" />
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#636A77]">Spend Priority</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`w-3 h-3 rounded-full ${i <= (idx === 0 ? 5 : 3) ? 'bg-[#464B55]' : 'bg-[#DCE1EA]'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-2">
                  <p className="text-sm text-gray-400 italic m-0">No audiences defined yet.</p>
                </div>
              )}
            </div>
            {editingSection === 'Targeting' && (
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => { setEditingSection(null); setEditDraft({}); }} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                <button onClick={() => {
                  const updated = local.audiences.map((a, i) => {
                    const name = editDraft[`audience_${i}`];
                    return name !== undefined ? name : (typeof a === 'string' ? a : (a as any)?.name || String(a));
                  });
                  applyLocalUpdate({ audiences: updated });
                  setEditingSection(null);
                  setEditDraft({});
                }} className="px-3.5 py-1.5 bg-[#212327] border-none rounded-lg text-[13px] text-white cursor-pointer hover:bg-gray-700">Save</button>
              </div>
            )}

            {/* TD Segments */}
            {tdSegments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#DCE1EA]">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C4.68 2 2 4.68 2 8C2 11.32 4.68 14 8 14C11.32 14 14 11.32 14 8C14 4.68 11.32 2 8 2ZM8 4C9.1 4 10 4.9 10 6C10 7.1 9.1 8 8 8C6.9 8 6 7.1 6 6C6 4.9 6.9 4 8 4ZM8 12.4C6.3 12.4 4.8 11.54 4 10.26C4.02 9.1 6.4 8.5 8 8.5C9.6 8.5 11.98 9.1 12 10.26C11.2 11.54 9.7 12.4 8 12.4Z" fill="#1957DB"/>
                  </svg>
                  <span className="text-sm font-semibold text-[#1957DB]">Audience Studio</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tdSegments.map((seg) => (
                    <div key={seg.id} className="flex items-center gap-1.5 bg-[#EEF2FF] px-3 py-1.5 rounded-md border border-[#C7D2FE]">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="#1957DB" strokeWidth="1.5"/>
                        <path d="M5 7L6.5 8.5L9 5.5" stroke="#1957DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-medium text-[#1957DB]">{seg.name}</span>
                      {seg.audienceSize && (
                        <span className="text-xs text-gray-500">
                          {seg.audienceSize >= 1_000_000 ? `${(seg.audienceSize / 1_000_000).toFixed(1)}M` : seg.audienceSize >= 1000 ? `${Math.round(seg.audienceSize / 1000)}K` : seg.audienceSize}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Creative Brief Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 m-0">Creative Brief</h2>
                <p className="text-sm text-[#464B55] m-0 mt-1">Messaging direction, formats, and execution considerations</p>
              </div>
              <SectionActions
                sectionName="Creative Brief"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Creative Brief')}
                onEdit={() => handleSectionEdit('Creative Brief')}
                isEditing={editingSection === 'Creative Brief'}
                isAILoading={aiLoadingSection === 'Creative Brief'}
              />
            </div>

            <div className="flex flex-col gap-6 mt-6">
              {/* Two-column: Primary Angle + Supporting Messages | Recommended Formats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                  {/* Primary Creative Angle */}
                  <div className="bg-[#F7F8FB] rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex justify-end">
                      <span className="text-xs font-medium text-[#25582E] bg-[#C9F3D1] px-2 py-1 rounded">{local.confidence}</span>
                    </div>
                    <h3 className="text-base font-medium text-[#212327] m-0">Primary Creative Angle</h3>
                    {editingSection === 'Creative Brief' ? (
                      <textarea
                        value={editDraft.primaryAngle ?? local.creativeBrief?.primaryAngle ?? formatMessaging(local.messaging) ?? ''}
                        onChange={(e) => setEditDraft(prev => ({ ...prev, primaryAngle: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-[#3B6FD4] rounded-lg text-sm text-gray-700 italic resize-y outline-none bg-[#FAFBFF]"
                      />
                    ) : (
                      <div className="flex gap-5">
                        <div className="w-0.5 bg-[#DCE1EA] flex-shrink-0" />
                        <p className="text-sm italic text-[#464B55] m-0 leading-relaxed">
                          {local.creativeBrief?.primaryAngle || formatMessaging(local.messaging) || 'Compelling campaign messaging tailored to your audience.'}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Supporting Messages */}
                  <div className="bg-[#F7F8FB] rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-base font-medium text-[#212327] m-0">Supporting Messages</h3>
                    <div className="flex flex-col gap-2">
                      {(local.creativeBrief?.supportingMessages || ['Drive results with data-driven targeting', 'Optimize creative performance across channels']).map((msg, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                            <circle cx="12" cy="12" r="10" stroke="#CBD1DB" strokeWidth="1.5"/>
                            <path d="M8 12L11 15L16 9" stroke="#464B55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-sm text-[#212327]">{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Recommended Formats */}
                <div className="border border-[#E8ECF3] rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex justify-end">
                    <span className="text-xs font-medium text-[#25582E] bg-[#C9F3D1] px-2 py-1 rounded">{local.confidence}</span>
                  </div>
                  <h3 className="text-base font-medium text-[#212327] m-0">Recommended Formats</h3>
                  <div className="flex flex-col gap-2">
                    {(local.creativeBrief?.recommendedFormats || ['Short-form video (15-30s)', 'Static image carousel', 'UGC-style content']).map((fmt, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <rect x="3" y="5" width="14" height="14" rx="2" stroke="#464B55" strokeWidth="1.5"/>
                          <path d="M10 12L13 10V14L10 12Z" stroke="#464B55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-sm text-[#212327]">{fmt}</span>
                      </div>
                    ))}
                  </div>
                  {local.cta && (
                    <>
                      <div className="h-px bg-[#DCE1EA] my-2" />
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">CTA</div>
                        <span className="text-sm font-medium text-gray-900">{local.cta}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Visual Style */}
              <div className="border border-[#E8ECF3] rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium text-[#212327] m-0">Visual Style</h3>
                  <span className="text-xs font-medium text-[#25582E] bg-[#C9F3D1] px-2 py-1 rounded">{local.confidence}</span>
                </div>
                <p className="text-sm text-[#464B55] m-0 leading-relaxed">
                  {local.variant === 'aggressive'
                    ? 'Bold, attention-grabbing visuals with high contrast and dynamic motion. Emphasis on trend-forward content that stops the scroll.'
                    : local.variant === 'conservative'
                      ? 'Clean, conversion-focused imagery with clear product visibility. Emphasis on trust signals and direct response layouts.'
                      : 'Modern, clean aesthetic with bold product focus. Balanced between brand building and performance-driven creative.'}
                </p>
              </div>

              {/* Fatigue Risk & Refresh Plan */}
              {local.creativeBrief?.fatigueRisk && local.creativeBrief.fatigueRisk.length > 0 && (
                <>
                  <div className="h-px bg-[#DCE1EA]" />
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-medium text-[#212327] m-0">Fatigue Risk</h3>
                    <div className="flex flex-col gap-2">
                      {local.creativeBrief.fatigueRisk.map((risk, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                            <circle cx="12" cy="12" r="10" stroke="#CBD1DB" strokeWidth="1.5"/>
                            <path d="M8 12L11 15L16 9" stroke="#464B55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-sm text-[#212327]">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {local.creativeBrief?.refreshPlan && local.creativeBrief.refreshPlan.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-medium text-[#212327] m-0">Refresh & Testing Plan</h3>
                  <div className="flex flex-col gap-2">
                    {local.creativeBrief.refreshPlan.map((plan, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <circle cx="12" cy="12" r="10" stroke="#CBD1DB" strokeWidth="1.5"/>
                          <path d="M8 12L11 15L16 9" stroke="#464B55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-sm text-[#212327]">{plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {editingSection === 'Creative Brief' && (
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => { setEditingSection(null); setEditDraft({}); }} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleSectionSave('Creative Brief')} className="px-3.5 py-1.5 bg-[#212327] border-none rounded-lg text-[13px] text-white cursor-pointer hover:bg-gray-700">Save</button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 m-0">Timeline</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-[#212327]">Estimated Time to Launch:</span>
                <span className="text-sm text-[#464B55]">7-10 business days</span>
              </div>
            </div>
            <div className="relative w-full h-[238px] bg-white border border-[#E8ECF3] rounded-xl overflow-hidden">
              {/* Month labels */}
              <div className="absolute top-0 left-0 w-full flex">
                {(() => {
                  const start = briefData?.timelineStart;
                  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
                  let startIdx = 0;
                  if (start) {
                    const d = new Date(start);
                    if (!isNaN(d.getTime())) startIdx = d.getMonth();
                    else { const m = months.findIndex(m => start.toUpperCase().includes(m)); if (m >= 0) startIdx = m; }
                  }
                  return months.slice(startIdx, startIdx + 6).map((m) => (
                    <div key={m} className="flex-1 border-l border-[#B6BDC9] py-2 pl-2 text-xs font-semibold text-[#636A77] uppercase tracking-wide">{m}</div>
                  ));
                })()}
              </div>
              {/* Phase bars */}
              {[
                { label: 'Pre-Launch Readiness', color: '#FFF1BA', left: '5%', width: '20%', top: 54 },
                { label: 'Audience Warm-up', color: '#E9F388', left: '15%', width: '18%', top: 86 },
                { label: 'Qualification & Scale', color: '#D3D8FF', left: '25%', width: '25%', top: 118 },
                { label: 'Optimization & Retargeting', color: '#C1E8FF', left: '40%', width: '35%', top: 150 },
                { label: 'Cost-to-Funnel', color: '#FFC1F7', left: '70%', width: '20%', top: 182 },
              ].map((phase) => (
                <div key={phase.label} className="absolute flex items-center justify-center rounded-lg overflow-hidden p-2" style={{ top: phase.top, left: phase.left, width: phase.width, background: phase.color }}>
                  <span className="text-xs text-[#464B55] text-center whitespace-nowrap overflow-hidden text-ellipsis">{phase.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {showApprovalButtons && (
            <div className="flex items-center gap-3 justify-end">
              {onRegenerate && (
                <button onClick={onRegenerate} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">Regenerate</button>
              )}
              {onModify && (
                <button onClick={() => onModify('Please modify this plan')} className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">Modify</button>
              )}
            </div>
          )}
          {/* Launch result toast - intentionally left empty; rendered as fixed toast below */}
        </div>
      </div>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
          Blueprint saved successfully
        </div>
      )}

      {/* Launch flow now handled via /campaign-launch route */}
    </div>
  );
};
