/**
 * CampaignCalendarView — Monthly calendar view showing campaign dates
 * Shows campaigns on their start/end dates with status indicators
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LiveCampaign } from '../../types/optimize';

interface CampaignCalendarViewProps {
  campaigns: LiveCampaign[];
  onCampaignClick?: (id: string) => void;
}

export default function CampaignCalendarView({ campaigns, onCampaignClick }: CampaignCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate calendar grid for current month
  const { daysInMonth, firstDayOffset, monthLabel } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month (0 = Sunday, 6 = Saturday)
    const firstDay = new Date(year, month, 1).getDay();

    // Get number of days in month
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Month label
    const label = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      daysInMonth: lastDate,
      firstDayOffset: firstDay,
      monthLabel: label,
    };
  }, [currentDate]);

  // Group campaigns by date
  const campaignsByDate = useMemo(() => {
    const byDate: Record<string, LiveCampaign[]> = {};

    campaigns.forEach(campaign => {
      const start = new Date(campaign.startDate);
      const end = new Date(campaign.endDate);
      const current = new Date(start);

      // Add campaign to each day it runs
      while (current <= end) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const day = current.getDate();

        // Only include dates in current viewing month
        if (year === currentDate.getFullYear() && month === currentDate.getMonth()) {
          const key = `${year}-${month}-${day}`;
          if (!byDate[key]) {
            byDate[key] = [];
          }
          // Avoid duplicates
          if (!byDate[key].some(c => c.id === campaign.id)) {
            byDate[key].push(campaign);
          }
        }

        current.setDate(current.getDate() + 1);
      }
    });

    return byDate;
  }, [campaigns, currentDate]);

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get campaigns for a specific day
  const getCampaignsForDay = (day: number): LiveCampaign[] => {
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return campaignsByDate[key] || [];
  };

  // Check if a day is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Get status color
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

  // Render calendar grid
  const renderCalendarGrid = () => {
    const days: React.ReactElement[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-gray-50 border border-gray-200" />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCampaigns = getCampaignsForDay(day);
      const today = isToday(day);

      days.push(
        <div
          key={day}
          className={`min-h-[120px] border border-gray-200 p-2 bg-white ${
            today ? 'ring-2 ring-blue-500 ring-inset' : ''
          }`}
        >
          {/* Day number */}
          <div className={`text-xs font-semibold mb-2 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
            {today && <span className="ml-1 text-[10px] font-normal">(Today)</span>}
          </div>

          {/* Campaigns */}
          <div className="space-y-1">
            {dayCampaigns.slice(0, 3).map(campaign => {
              const statusColor = getStatusColor(campaign.status);
              const isStart = new Date(campaign.startDate).getDate() === day;
              const isEnd = new Date(campaign.endDate).getDate() === day;

              return (
                <button
                  key={campaign.id}
                  onClick={() => onCampaignClick?.(campaign.id)}
                  className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-medium text-white cursor-pointer border-none transition-all hover:shadow-sm ${statusColor}`}
                >
                  <div className="truncate flex items-center gap-1">
                    {isStart && <span className="text-[8px]">▶</span>}
                    {campaign.name}
                    {isEnd && <span className="text-[8px]">◀</span>}
                  </div>
                </button>
              );
            })}

            {/* Show "+N more" if there are more campaigns */}
            {dayCampaigns.length > 3 && (
              <div className="text-[10px] text-gray-500 font-medium px-1.5">
                +{dayCampaigns.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">{monthLabel}</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded cursor-pointer border-none bg-transparent transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToNextMonth}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded cursor-pointer border-none bg-transparent transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="px-2 py-2 text-center">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendarGrid()}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-600 font-medium">Status:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-xs text-gray-600">Paused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span className="text-xs text-gray-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
