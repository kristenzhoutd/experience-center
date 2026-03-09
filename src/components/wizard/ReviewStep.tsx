import { useState } from 'react';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import SelectableElement from '../chat/SelectableElement';

export default function ReviewStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const updateReview = useCampaignConfigStore((s) => s.updateReview);
  const updateRank = useCampaignConfigStore((s) => s.updateRank);
  const [showPriorityInfo, setShowPriorityInfo] = useState(false);

  if (!config) return null;

  const { setup, audiences, content, review } = config;
  const selectedSegments = audiences.segments.filter((s) => s.isSelected);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Campaign Setup Summary */}
        <SelectableElement refId="review.setup" refType="section" path={['Review', 'Campaign Setup']} label="Campaign Setup Summary" context={{ domain: 'review' }}>
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Campaign Setup</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="text-gray-900 font-medium text-right max-w-[60%]">{setup.name || 'Untitled'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Objective</dt>
                <dd className="text-gray-900 text-right max-w-[60%] text-xs leading-relaxed">{setup.objective || 'Not set'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Business Goal</dt>
                <dd className="text-gray-900 font-medium">{setup.businessGoal || 'Not set'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Primary KPI</dt>
                <dd className="text-gray-900 font-medium">{setup.primaryKpi || 'Not set'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Duration</dt>
                <dd className="text-gray-900 font-medium">
                  {setup.startDate && setup.endDate
                    ? `${setup.startDate} - ${setup.endDate}`
                    : 'Not set'}
                </dd>
              </div>
            </dl>
          </section>
        </SelectableElement>

        {/* Audiences Summary */}
        <SelectableElement refId="review.audiences" refType="section" path={['Review', 'Audiences']} label="Audiences Summary" context={{ domain: 'review' }}>
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Audiences
              <span className="ml-2 text-sm font-normal text-gray-400">
                {selectedSegments.length} segment{selectedSegments.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="space-y-2">
              {selectedSegments.map((seg) => (
                <div key={seg.id} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-gray-900">{seg.name}</span>
                  {seg.count && <span className="text-xs text-gray-400">({seg.count})</span>}
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] rounded ${
                    seg.source === 'tdx'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {seg.source === 'tdx' ? 'TDX' : 'New'}
                  </span>
                </div>
              ))}
              {selectedSegments.length === 0 && (
                <p className="text-sm text-gray-400">No segments selected</p>
              )}
            </div>
          </section>
        </SelectableElement>

        {/* Content Summary */}
        <SelectableElement refId="review.content" refType="section" path={['Review', 'Content']} label="Content Summary" context={{ domain: 'review' }}>
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Content</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Pages</dt>
                <dd className="text-gray-900 font-medium">{content.pages.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Spots</dt>
                <dd className="text-gray-900 font-medium">
                  {content.pages.reduce((sum, p) => sum + p.spots.length, 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Segment Variants</dt>
                <dd className="text-gray-900 font-medium">
                  {content.pages.reduce((sum, p) => sum + p.spots.reduce((s2, spot) => s2 + spot.variants.length, 0), 0)}
                </dd>
              </div>
            </dl>
            {content.pages.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {content.pages.map((page) => (
                  <div key={page.pageId} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 font-medium">{page.pageName}</span>
                    <span className="text-gray-400">
                      {page.spots.length} spot{page.spots.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {page.spots.map((spot) => (
                        <span key={spot.spotId} className="inline-flex px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                          {spot.spotName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </SelectableElement>

        {/* Launch Settings */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Launch Settings</h2>

          {/* Campaign Prioritization */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-medium text-gray-600">
                Campaign Prioritization
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowPriorityInfo(!showPriorityInfo)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="About campaign priority"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
                  </svg>
                </button>
                {showPriorityInfo && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                    <p>
                      Priority determines which campaign gets shown to a profile when the profile qualifies for more than one campaign in the same spot. Higher priority campaigns take precedence.
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="100"
                value={review.priority ?? 50}
                onChange={(e) => updateReview({ priority: parseInt(e.target.value) })}
                className="flex-1 accent-black"
              />
              <input
                type="number"
                min="1"
                max="100"
                value={review.priority ?? 50}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                  updateReview({ priority: val });
                }}
                className="w-14 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 (Low)</span>
              <span>100 (High)</span>
            </div>
          </div>

          {/* Campaign Rank */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Campaign Rank</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={config.rank ?? 1}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  updateRank(val);
                }}
                className="w-20 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
              />
              <span className="text-xs text-gray-400">Position in the global campaign ranking</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={review.notes ?? ''}
              onChange={(e) => updateReview({ notes: e.target.value })}
              rows={2}
              placeholder="Any launch notes or comments..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
