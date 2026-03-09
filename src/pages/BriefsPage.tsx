import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBriefStore } from '../stores/briefStore';
import type { CampaignBrief, BriefSectionKey } from '../types/brief';

const SECTION_KEYS: BriefSectionKey[] = ['overview', 'audience', 'experience', 'measurement'];

function getSectionCompletion(brief: CampaignBrief): string {
  let filled = 0;
  for (const key of SECTION_KEYS) {
    const section = brief.sections[key];
    const entries = Object.entries(section).filter(
      ([k]) => !['locked', 'userEditedFields', 'notes'].includes(k)
    );
    const hasContent = entries.some(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === 'string' && v.trim().length > 0;
    });
    if (hasContent) filled++;
  }
  return `${filled}/${SECTION_KEYS.length} sections`;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  in_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  active: 'bg-blue-50 text-blue-700',
};

export default function BriefsPage() {
  const navigate = useNavigate();
  const { briefs: allBriefs, loadBriefs, renameBrief, deleteBrief, duplicateBrief } = useBriefStore();
  const briefs = allBriefs.filter((b) => b.suite === 'personalization');
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadBriefs();
  }, [loadBriefs]);

  const filtered = briefs.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = (id: string) => {
    navigate('/chat', { state: { briefId: id } });
  };

  const startRename = (brief: CampaignBrief) => {
    setRenamingId(brief.id);
    setRenameValue(brief.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameBrief(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    deleteBrief(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Briefs</h1>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Create New Brief
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search briefs..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">
              {search ? 'No briefs match your search.' : 'No briefs yet. Start a conversation to create one.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((brief) => (
              <div
                key={brief.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {renamingId === brief.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="text-sm font-semibold text-gray-900 border-b border-blue-400 outline-none bg-transparent w-full"
                      />
                    ) : (
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{brief.name}</h3>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full ${statusColors[brief.status] || statusColors.draft}`}>
                        {brief.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(brief.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {getSectionCompletion(brief)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleOpen(brief.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => startRename(brief)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                      title="Rename"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => duplicateBrief(brief.id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                      title="Duplicate"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {deleteConfirmId === brief.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(brief.id)}
                          className="px-2 py-1 text-[10px] font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(brief.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
