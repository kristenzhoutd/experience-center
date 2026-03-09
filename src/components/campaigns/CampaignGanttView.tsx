/**
 * CampaignGanttView — Timeline view showing campaigns as horizontal bars
 * Shows campaign duration, status, and budget on a timeline grid
 */

import { useMemo } from 'react';
import type { LiveCampaign } from '../../types/optimize';

interface CampaignGanttViewProps {
  campaigns: LiveCampaign[];
  onCampaignClick?: (id: string) => void;
}

export default function CampaignGanttView({ campaigns, onCampaignClick }: CampaignGanttViewProps) {
  // Calculate date range for the timeline (earliest start to latest end)
  const { minDate, maxDate, months } = useMemo(() => {
    if (campaigns.length === 0) {
      const now = new Date();
      const threeMonthsLater = new Date(now);
      threeMonthsLater.setMonth(now.getMonth() + 3);
      return {
        minDate: now,
        maxDate: threeMonthsLater,
        months: generateMonths(now, threeMonthsLater),
      };
    }

    const dates = campaigns.flatMap(c => [new Date(c.startDate), new Date(c.endDate)]);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding - start 1 week before, end 1 week after
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 7);

    return {
      minDate: min,
      maxDate: max,
      months: generateMonths(min, max),
    };
  }, [campaigns]);

  // Calculate position and width for each campaign bar
  const getCampaignBarStyle = (campaign: LiveCampaign) => {
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const totalDuration = maxDate.getTime() - minDate.getTime();
    const startOffset = start.getTime() - minDate.getTime();
    const duration = end.getTime() - start.getTime();

    const left = (startOffset / totalDuration) * 100;
    const width = (duration / totalDuration) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get color based on campaign status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'paused':
        return 'bg-amber-500';
      case 'completed':
        return 'bg-gray-400';
      case 'scheduled':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No campaigns to display
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Timeline Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* Campaign name column */}
          <div className="w-64 px-4 py-3 border-r border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Campaign</span>
          </div>

          {/* Timeline months */}
          <div className="flex-1 relative">
            <div className="flex">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="flex-1 px-2 py-3 border-r border-gray-200 last:border-r-0"
                >
                  <div className="text-xs font-medium text-gray-700">{month.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Rows */}
      <div className="divide-y divide-gray-100">
        {campaigns.map((campaign) => {
          const barStyle = getCampaignBarStyle(campaign);
          const statusColor = getStatusColor(campaign.status);

          return (
            <div key={campaign.id} className="flex hover:bg-gray-50 transition-colors">
              {/* Campaign Info */}
              <div className="w-64 px-4 py-3 border-r border-gray-200">
                <button
                  onClick={() => onCampaignClick?.(campaign.id)}
                  className="text-left w-full border-none bg-transparent p-0 cursor-pointer group"
                >
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {campaign.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 capitalize">{campaign.status}</div>
                </button>
              </div>

              {/* Timeline Bar */}
              <div className="flex-1 relative py-3 px-2">
                {/* Grid lines for months */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {months.map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-1 border-r border-gray-100 last:border-r-0"
                    />
                  ))}
                </div>

                {/* Campaign Bar */}
                <div className="relative h-8">
                  <div
                    className={`absolute top-1 h-6 rounded ${statusColor} shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-y-110 group`}
                    style={barStyle}
                    onClick={() => onCampaignClick?.(campaign.id)}
                  >
                    {/* Bar content - budget/spend info */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium px-2 truncate">
                        ${(campaign.spent / 1000).toFixed(0)}K / ${(campaign.budget / 1000).toFixed(0)}K
                      </span>
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="font-semibold mb-1">{campaign.name}</div>
                        <div className="text-gray-300">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-300 mt-1">
                          Spent: ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                        </div>
                        <div className="text-gray-300">
                          ROAS: {campaign.metrics.roas.toFixed(2)}x
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper: Generate month labels for the timeline
function generateMonths(start: Date, end: Date): Array<{ label: string; date: Date }> {
  const months: Array<{ label: string; date: Date }> = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push({
      label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      date: new Date(current),
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}
