import { useState, useEffect } from 'react';

const PAGE_SIZE = 20;

export interface PickerSegment {
  id: string;
  name: string;
  count?: string;
  parentName?: string;
}

interface SegmentPickerProps {
  segments: PickerSegment[];
  isLoading: boolean;
  onSelect: (segment: PickerSegment) => void;
  onClose: () => void;
  emptyMessage?: string;
}

export default function SegmentPicker({ segments, isLoading, onSelect, onClose, emptyMessage }: SegmentPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery]);

  const filtered = searchQuery
    ? segments.filter((seg) => seg.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : segments;

  return (
    <div className="mt-2 border border-blue-200 rounded-lg overflow-hidden bg-white">
      <div className="p-2 border-b border-gray-100">
        <input
          autoFocus
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search existing segments..."
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="px-3 py-6 text-xs text-gray-400 text-center animate-pulse">
            Loading TDX segments...
          </div>
        ) : filtered.length > 0 ? (
          filtered.slice(0, displayCount).map((seg) => (
            <button
              key={seg.id}
              onClick={() => onSelect(seg)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-blue-50 transition-colors border-t border-gray-50 first:border-t-0"
            >
              <div className="min-w-0">
                <span className="text-sm text-gray-900">{seg.name}</span>
                {seg.parentName && (
                  <span className="ml-2 text-[10px] text-gray-400">{seg.parentName}</span>
                )}
              </div>
              {seg.count && (
                <span className="text-[11px] text-emerald-600 font-medium flex-shrink-0 ml-2">
                  {seg.count}
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="px-3 py-3 text-xs text-gray-400 text-center">
            {emptyMessage || 'No matching segments'}
          </div>
        )}
      </div>
      {!isLoading && filtered.length > displayCount && (
        <div className="px-3 py-1.5 border-t border-gray-100">
          <button
            onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
            className="w-full text-xs font-medium text-blue-600 hover:text-blue-800 py-1"
          >
            Show more ({filtered.length - displayCount} remaining)
          </button>
        </div>
      )}
      <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {filtered.length} segment{filtered.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onClose}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
