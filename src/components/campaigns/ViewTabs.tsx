/**
 * ViewTabs — Main tab bar for Programs vs Campaigns
 * Shows a view selector on the right for Cards/Gantt/Tree/Calendar
 */

import { LayoutGrid, Calendar as CalendarIcon, GanttChart, Network, ChevronDown, FolderKanban } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type MainTab = 'programs' | 'campaigns';
export type CampaignView = 'cards' | 'gantt' | 'tree' | 'calendar';

interface ViewTabsProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  campaignView: CampaignView;
  onCampaignViewChange: (view: CampaignView) => void;
}

const campaignViewOptions: Array<{ value: CampaignView; label: string; icon: typeof LayoutGrid }> = [
  { value: 'cards', label: 'Cards', icon: LayoutGrid },
  { value: 'gantt', label: 'Gantt', icon: GanttChart },
  { value: 'tree', label: 'Tree', icon: Network },
  { value: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

export default function ViewTabs({ activeTab, onTabChange, campaignView, onCampaignViewChange }: ViewTabsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const currentViewOption = campaignViewOptions.find(opt => opt.value === campaignView) || campaignViewOptions[0];
  const CurrentViewIcon = currentViewOption.icon;

  return (
    <div className="flex items-center justify-between">
      {/* Main Tabs - Left */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange('programs')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            activeTab === 'programs'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          Programs
        </button>
        <button
          onClick={() => onTabChange('campaigns')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            activeTab === 'campaigns'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          Campaigns
        </button>
      </div>

      {/* View Selector - Right (only show for Campaigns tab) */}
      {activeTab === 'campaigns' && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <CurrentViewIcon className="w-4 h-4" />
            <span>View: {currentViewOption.label}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-[calc(100%+4px)] bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] z-50 overflow-hidden">
              {campaignViewOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = campaignView === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onCampaignViewChange(option.value);
                      setShowDropdown(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left cursor-pointer transition-colors border-none
                      ${
                        isSelected
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'bg-transparent text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
