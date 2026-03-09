import { Settings, BarChart3 } from 'lucide-react';
import type { Campaign } from '../../types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
  onEdit?: () => void;
  onViewDashboard?: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onClick, onEdit, onViewDashboard }) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-600';
      case 'Draft':
        return 'bg-indigo-100 text-indigo-700';
      case 'Scheduled':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBudgetBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-400';
    return 'bg-green-500';
  };

  return (
    <div
      onClick={onClick}
      className="relative group bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
    >
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onViewDashboard && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewDashboard(); }}
            className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-green-50 hover:text-green-600 border-none cursor-pointer"
            title="View dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 border-none cursor-pointer"
            title="Edit campaign"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z" stroke="#636A77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-xs text-gray-900">{campaign.name}</h3>
          <p className="text-[10px] text-gray-400">{campaign.description}</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-1.5 mb-3">
        <span className="bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
          {campaign.type}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusClasses(campaign.status)}`}>
          {campaign.status}
        </span>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/>
          <path d="M2 6H14" stroke="#9CA3AF" strokeWidth="1.2"/>
          <path d="M5 1V4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11 1V4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-[10px] text-gray-400">{campaign.dateRange}</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricItem label="Conversions" value={campaign.conversions} />
        <MetricItem label="Reach" value={campaign.reach} />
        <MetricItem label="Budget" value={campaign.budget} />
        <MetricItem label="Pacing" value={campaign.pacing} />
      </div>

      {/* Budget Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-gray-400">Budget Spent</span>
          <span className="text-[10px] font-semibold text-gray-900">{campaign.budgetSpent}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getBudgetBarColor(campaign.budgetSpent)}`}
            style={{ width: `${campaign.budgetSpent}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-3" />

      {/* Channel Tags */}
      <div className="flex gap-1.5 flex-wrap">
        {campaign.channels.map((channel, idx) => (
          <span
            key={idx}
            className="bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium"
          >
            {channel}
          </span>
        ))}
      </div>
    </div>
  );
};

// Internal helper component for metrics
const MetricItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="text-[10px] text-gray-400">{label}</span>
    <p className="text-xs font-semibold text-gray-900">{value}</p>
  </div>
);

export default CampaignCard;
