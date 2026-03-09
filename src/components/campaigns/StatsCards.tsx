import { useCampaignStore } from '../../stores/campaignStore';

interface StatCardData {
  label: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

const StatsCards: React.FC = () => {
  const statsData = useCampaignStore((s) => s.stats);

  const stats: StatCardData[] = [
    {
      label: 'Active Campaigns',
      value: statsData.activeCampaigns,
      change: statsData.activeCampaignsChange,
      changeType:
        statsData.activeCampaignsChange > 0
          ? 'positive'
          : statsData.activeCampaignsChange < 0
            ? 'negative'
            : 'neutral',
    },
    {
      label: 'Needs Attention',
      value: statsData.needsAttention,
      change: statsData.needsAttentionChange,
      changeType:
        statsData.needsAttentionChange > 0
          ? 'negative'
          : statsData.needsAttentionChange < 0
            ? 'positive'
            : 'neutral',
    },
    {
      label: 'Over Budget',
      value: statsData.overBudget,
      change: statsData.overBudgetChange,
      changeType:
        statsData.overBudgetChange > 0
          ? 'negative'
          : statsData.overBudgetChange < 0
            ? 'positive'
            : 'neutral',
    },
    {
      label: 'Launching this Week',
      value: statsData.launchingThisWeek,
      change: statsData.launchingThisWeekChange,
      changeType:
        statsData.launchingThisWeekChange > 0
          ? 'positive'
          : statsData.launchingThisWeekChange < 0
            ? 'negative'
            : 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex flex-col gap-1.5"
        >
          <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            {stat.change > 0 && (
              <div
                className={`flex items-center gap-0.5 ${
                  stat.changeType === 'positive'
                    ? 'text-emerald-500'
                    : stat.changeType === 'negative'
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`}
              >
                <ArrowUpIcon />
                <span className="text-xs font-medium">+{stat.change}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ArrowUpIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 3V13M8 3L4 7M8 3L12 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default StatsCards;
