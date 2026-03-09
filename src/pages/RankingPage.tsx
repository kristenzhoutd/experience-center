import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { campaignConfigStorage } from '../services/campaignConfigStorage';
import type { CampaignConfig, ConfigStatus } from '../types/campaignConfig';

const statusConfig: Record<ConfigStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  ready: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-700' },
  launched: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700' },
};

type SortField = 'rank' | 'name' | 'priority' | 'status';
type SortDir = 'asc' | 'desc';

export default function RankingPage() {
  const [campaigns, setCampaigns] = useState<CampaignConfig[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // Sort & filter state
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConfigStatus | ''>('');

  // Toast notification for priority changes
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Inline priority editing
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [editingPriorityValue, setEditingPriorityValue] = useState('');
  const priorityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const all = campaignConfigStorage.listConfigs();
    const sorted = [...all].sort((a, b) => (b.review.priority ?? 0) - (a.review.priority ?? 0));
    setCampaigns(sorted.map((c, i) => ({ ...c, rank: i + 1 })));
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...campaigns];

    // Filter by name
    if (nameFilter.trim()) {
      const query = nameFilter.toLowerCase();
      result = result.filter((c) =>
        (c.setup.name || 'Untitled Campaign').toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'rank':
          cmp = (a.rank ?? 0) - (b.rank ?? 0);
          break;
        case 'name':
          cmp = (a.setup.name || 'Untitled Campaign').localeCompare(b.setup.name || 'Untitled Campaign');
          break;
        case 'priority':
          cmp = (a.review.priority ?? 0) - (b.review.priority ?? 0);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [campaigns, nameFilter, statusFilter, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'priority' ? 'desc' : 'asc');
    }
  }, [sortField]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragIndex(null);
    setDropIndex(null);
    dragCounter.current = 0;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    setDropIndex(index);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDropIndex(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }

    let toastMessage: string | null = null;

    setCampaigns((prev) => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      const campaignName = moved.setup.name || 'Untitled Campaign';
      const oldPriority = moved.review.priority;

      // If dragged to a higher rank, bump priority above the campaign now below it
      if (targetIndex < sourceIndex) {
        const below = next[targetIndex + 1];
        if (below && moved.review.priority <= below.review.priority) {
          const newPriority = Math.min(100, below.review.priority + 1);
          toastMessage = `"${campaignName}" priority adjusted from ${oldPriority} to ${newPriority}`;
          next[targetIndex] = {
            ...moved,
            review: { ...moved.review, priority: newPriority },
          };
        }
      }

      // If dragged to a lower rank, drop priority below the campaign now above it
      if (targetIndex > sourceIndex) {
        const above = next[targetIndex - 1];
        if (above && moved.review.priority >= above.review.priority) {
          const newPriority = Math.max(1, above.review.priority - 1);
          toastMessage = `"${campaignName}" priority adjusted from ${oldPriority} to ${newPriority}`;
          next[targetIndex] = {
            ...moved,
            review: { ...moved.review, priority: newPriority },
          };
        }
      }

      return next.map((c, i) => ({ ...c, rank: i + 1 }));
    });

    if (toastMessage) {
      showToast(toastMessage);
    }
    setIsDirty(true);
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  const handleSave = useCallback(() => {
    campaignConfigStorage.saveAllConfigs(campaigns);
    setIsDirty(false);
  }, [campaigns]);

  const startEditPriority = useCallback((campaignId: string, currentPriority: number) => {
    setEditingPriorityId(campaignId);
    setEditingPriorityValue(String(currentPriority));
    setTimeout(() => priorityInputRef.current?.select(), 0);
  }, []);

  const commitPriorityEdit = useCallback(() => {
    if (!editingPriorityId) return;
    const val = Math.min(100, Math.max(1, parseInt(editingPriorityValue) || 1));
    setCampaigns((prev) => {
      // Update the priority value
      const updated = prev.map((c) =>
        c.id === editingPriorityId
          ? { ...c, review: { ...c.review, priority: val } }
          : c
      );
      // Re-sort by priority descending and reassign ranks
      const sorted = [...updated].sort((a, b) => b.review.priority - a.review.priority);
      return sorted.map((c, i) => ({ ...c, rank: i + 1 }));
    });
    setIsDirty(true);
    setEditingPriorityId(null);
  }, [editingPriorityId, editingPriorityValue]);

  const cancelPriorityEdit = useCallback(() => {
    setEditingPriorityId(null);
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === 'asc' ? (
      <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Campaign Ranking</h1>
              <p className="text-sm text-gray-500 mt-1">Drag and drop to reorder campaign priority</p>
            </div>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDirty
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 pt-4 pb-2 flex items-center gap-3">
            {/* Name search */}
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ConfigStatus | '')}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="launched">Active</option>
            </select>
          </div>

          {/* Table */}
          <div className="px-6 pb-6">
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No campaigns yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Create campaigns to manage their ranking here.
                </p>
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-gray-500">No campaigns match your filters.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pl-2 w-12"></th>
                    <th className="pb-3 w-16">
                      <button onClick={() => handleSort('rank')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                        Rank <SortIcon field="rank" />
                      </button>
                    </th>
                    <th className="pb-3">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                        Campaign <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="pb-3 w-24">
                      <button onClick={() => handleSort('priority')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                        Priority <SortIcon field="priority" />
                      </button>
                    </th>
                    <th className="pb-3 w-28">
                      <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                        Status <SortIcon field="status" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((campaign, index) => {
                    const status = statusConfig[campaign.status] ?? statusConfig.draft;
                    const isBeingDragged = dragIndex === index;
                    const isDropTarget = dropIndex === index && dragIndex !== index;

                    return (
                      <tr
                        key={campaign.id}
                        draggable={sortField === 'rank'}
                        onDragStart={sortField === 'rank' ? (e) => handleDragStart(e, index) : undefined}
                        onDragEnd={sortField === 'rank' ? handleDragEnd : undefined}
                        onDragEnter={sortField === 'rank' ? (e) => handleDragEnter(e, index) : undefined}
                        onDragLeave={sortField === 'rank' ? handleDragLeave : undefined}
                        onDragOver={sortField === 'rank' ? handleDragOver : undefined}
                        onDrop={sortField === 'rank' ? (e) => handleDrop(e, index) : undefined}
                        className={`border-b border-gray-100 transition-colors ${
                          sortField === 'rank' ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${isBeingDragged ? 'opacity-50' : ''} ${isDropTarget ? 'border-t-2 border-t-blue-500' : ''}`}
                      >
                        {/* Drag handle */}
                        <td className="py-3 pl-2 pr-2">
                          <div className={`flex items-center justify-center ${sortField === 'rank' ? 'text-gray-300 hover:text-gray-500' : 'text-gray-200'}`}>
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <circle cx="7" cy="4" r="1.5" />
                              <circle cx="13" cy="4" r="1.5" />
                              <circle cx="7" cy="10" r="1.5" />
                              <circle cx="13" cy="10" r="1.5" />
                              <circle cx="7" cy="16" r="1.5" />
                              <circle cx="13" cy="16" r="1.5" />
                            </svg>
                          </div>
                        </td>

                        {/* Rank number */}
                        <td className="py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 text-sm font-medium text-gray-700">
                            {campaign.rank}
                          </span>
                        </td>

                        {/* Campaign name */}
                        <td className="py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {campaign.setup.name || 'Untitled Campaign'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3">
                          {editingPriorityId === campaign.id ? (
                            <input
                              ref={priorityInputRef}
                              type="number"
                              min="1"
                              max="100"
                              value={editingPriorityValue}
                              onChange={(e) => setEditingPriorityValue(e.target.value)}
                              onBlur={commitPriorityEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitPriorityEdit();
                                if (e.key === 'Escape') cancelPriorityEdit();
                              }}
                              className="w-16 px-2 py-0.5 text-sm text-center border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <div className="group/priority flex items-center gap-1.5">
                              <span className="text-sm text-gray-600">
                                {campaign.review.priority}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditPriority(campaign.id, campaign.review.priority);
                                }}
                                className="opacity-0 group-hover/priority:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-opacity"
                                title="Edit priority"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.2s_ease-out]">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
