import { useMemo } from 'react';
import type { Campaign } from '../../types/campaign';

interface GanttViewProps {
  campaigns?: Campaign[];
  onCampaignClick?: (campaign: Campaign) => void;
}

const channelColors: Record<string, string> = {
  Meta: '#3b82f6',
  Google: '#ef4444',
  LinkedIn: '#0077b5',
  TikTok: '#ec4899',
};

function getChannelColor(channels: string[]): string {
  for (const ch of channels) {
    if (channelColors[ch]) return channelColors[ch];
  }
  return '#6b7280';
}

export default function GanttView({ campaigns = [], onCampaignClick }: GanttViewProps) {
  const ganttData = useMemo(() => {
    if (campaigns.length === 0) return null;

    // Determine chart range from campaign dates
    const dates = campaigns.flatMap(c => [new Date(c.startDate), new Date(c.endDate)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Pad to start/end of months
    const chartStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const chartEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);
    const totalDays = Math.ceil((chartEnd.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));

    // Build month headers
    const months: { label: string; days: number; offset: number }[] = [];
    let cursor = new Date(chartStart);
    while (cursor < chartEnd) {
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const end = monthEnd > chartEnd ? chartEnd : monthEnd;
      const days = Math.ceil((end.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24));
      months.push({
        label: cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        days,
        offset: Math.ceil((cursor.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24)),
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    // Today marker
    const today = new Date();
    const todayOffset = Math.ceil((today.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));

    // Campaign bars
    const items = campaigns.map(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      const startOff = Math.max(0, Math.ceil((start.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24)));
      const endOff = Math.min(totalDays, Math.ceil((end.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        campaign: c,
        width: ((endOff - startOff) / totalDays) * 100,
        left: (startOff / totalDays) * 100,
        color: getChannelColor(c.channels),
        startStr: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        endStr: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

    return { months, totalDays, todayOffset: (todayOffset / totalDays) * 100, items };
  }, [campaigns]);

  if (!ganttData || ganttData.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <p className="text-sm text-gray-400">No campaigns to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Campaign Timeline</h3>
          <p className="text-xs text-gray-400 m-0">Gantt view of all campaigns</p>
        </div>
        <span className="text-xs text-gray-400">{ganttData.items.length} campaigns</span>
      </div>

      <div className="overflow-x-auto">
        {/* Month headers */}
        <div className="flex border-b border-gray-100 mb-1">
          <div className="w-[200px] flex-shrink-0" />
          <div className="flex-1 flex">
            {ganttData.months.map((m) => (
              <div
                key={m.label}
                className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 border-l border-gray-100 first:border-l-0"
                style={{ width: `${(m.days / ganttData.totalDays) * 100}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign rows */}
        {ganttData.items.map((item) => (
          <div
            key={item.campaign.id}
            className="flex items-center group hover:bg-gray-50/50 rounded-lg transition-colors cursor-pointer"
            onClick={() => onCampaignClick?.(item.campaign)}
          >
            <div className="w-[200px] flex-shrink-0 pr-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 m-0 truncate">{item.campaign.name}</p>
                  <p className="text-[10px] text-gray-400 m-0">{item.campaign.channels.join(', ')} · {item.startStr} – {item.endStr}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative h-8">
              {/* Grid lines */}
              {ganttData.months.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 h-full border-l border-gray-50"
                  style={{ left: `${(m.offset / ganttData.totalDays) * 100}%` }}
                />
              ))}
              {/* Today marker */}
              {ganttData.todayOffset > 0 && ganttData.todayOffset < 100 && (
                <div
                  className="absolute top-0 h-full w-px bg-red-400 z-10"
                  style={{ left: `${ganttData.todayOffset}%` }}
                />
              )}
              {/* Bar */}
              <div
                className="absolute top-1.5 h-5 rounded-full flex items-center px-2 text-[9px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                style={{
                  left: `${item.left}%`,
                  width: `${item.width}%`,
                  backgroundColor: item.color,
                  minWidth: 40,
                }}
              >
                <span className="truncate">{item.campaign.name}</span>
              </div>
            </div>
            {/* Status */}
            <div className="w-[100px] flex-shrink-0 pl-3 flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                item.campaign.status === 'Active' ? 'bg-green-50 text-green-600' :
                item.campaign.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                item.campaign.status === 'Paused' ? 'bg-yellow-50 text-yellow-600' :
                item.campaign.status === 'Completed' ? 'bg-gray-100 text-gray-500' :
                'bg-gray-50 text-gray-400'
              }`}>
                {item.campaign.status}
              </span>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-px bg-red-400" />
            <span className="text-[10px] text-gray-400">Today</span>
          </div>
          {Object.entries(channelColors).map(([ch, color]) => (
            <div key={ch} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400">{ch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
