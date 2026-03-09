import { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { AttachedFile } from '../../types/campaign';
import { useBriefEditorStore } from '../../stores/briefEditorStore';
import { localBriefStorage } from '../../services/briefStorage';

interface CampaignSelectorProps {
  onSelect: (file: AttachedFile) => void;
  onClose: () => void;
}

export default function CampaignSelector({ onSelect, onClose }: CampaignSelectorProps) {
  const [filter, setFilter] = useState('');
  const briefs = localBriefStorage.listBriefs();
  const currentBrief = useBriefEditorStore((s) => s.state.briefData);

  const filtered = briefs.filter((b) =>
    !filter || (b.name || '').toLowerCase().includes(filter.toLowerCase()),
  );

  const handleSelect = (brief: (typeof briefs)[number]) => {
    const content = JSON.stringify(brief.sections || brief, null, 2);
    const file: AttachedFile = {
      id: `campaign-${brief.id}-${Date.now()}`,
      name: brief.name || 'Campaign Brief',
      size: new Blob([content]).size,
      type: 'application/json',
      base64Data: content,
    };
    onSelect(file);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-[400px] max-h-[60vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-base text-gray-800">Select Campaign</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search campaigns..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No saved campaigns found.
            </div>
          ) : (
            filtered.map((brief) => (
              <button
                key={brief.id}
                onClick={() => handleSelect(brief)}
                className="w-full px-5 py-3 border-none bg-transparent text-left cursor-pointer hover:bg-gray-50 transition-colors flex flex-col gap-0.5"
              >
                <span className="text-sm font-medium text-gray-800 truncate">{brief.name || 'Untitled'}</span>
                <span className="text-xs text-gray-400">
                  {new Date(brief.updatedAt || brief.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
