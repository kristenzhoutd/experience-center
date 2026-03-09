import { useState, useEffect, useRef } from 'react';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';
import SegmentPicker, { type PickerSegment } from '../SegmentPicker';
import SelectableElement from '../chat/SelectableElement';

export default function AudiencesStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const childSegments = useCampaignConfigStore((s) => s.childSegments);
  const isLoadingSegments = useCampaignConfigStore((s) => s.isLoadingSegments);
  const segmentError = useCampaignConfigStore((s) => s.segmentError);
  const toggleSegmentSelection = useCampaignConfigStore((s) => s.toggleSegmentSelection);
  const removeSegment = useCampaignConfigStore((s) => s.removeSegment);
  const selectParentSegment = useCampaignConfigStore((s) => s.selectParentSegment);

  const parentSegments = useSettingsStore((s) => s.parentSegments);
  const selectedParentSegmentId = useSettingsStore((s) => s.selectedParentSegmentId);

  const setPageContext = useChatStore((s) => s.setPageContext);

  // Set page context for chat integration
  useEffect(() => {
    setPageContext('audience-selection');
    return () => setPageContext(null);
  }, [setPageContext]);

  // Re-fetch child segments when the global parent segment changes
  const prevParentRef = useRef(selectedParentSegmentId);
  useEffect(() => {
    if (
      selectedParentSegmentId &&
      selectedParentSegmentId !== prevParentRef.current &&
      config
    ) {
      prevParentRef.current = selectedParentSegmentId;
      selectParentSegment(selectedParentSegmentId);
    }
  }, [selectedParentSegmentId, config, selectParentSegment]);

  const [showSegmentPicker, setShowSegmentPicker] = useState(false);

  if (!config) return null;

  const { audiences } = config;
  const selectedParent = parentSegments.find((ps) => String(ps.id) === String(selectedParentSegmentId));
  const recAudiences = audiences.recommendedAudiences || [];

  // Only show segments that are selected or from the brief (not all 100+ TDX children)
  // Enrich with recommendedAudiences data for segments missing description/count
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const visibleSegments = audiences.segments
    .filter((s) => s.isSelected || s.source === 'brief')
    .map((seg) => {
      if (seg.description && seg.count) return seg;
      const ra = recAudiences.find((r) => {
        const a = normalize(r.name);
        const b = normalize(seg.name);
        return a === b || b.includes(a) || a.includes(b);
      });
      if (!ra) return seg;
      return {
        ...seg,
        description: seg.description || ra.description,
        count: seg.count || ra.estimatedSize,
      };
    });
  const selectedCount = audiences.segments.filter((s) => s.isSelected).length;

  // Picker uses childSegments from the store (already filtered by selected parent)
  // Exclude only *selected* segments so unselected children remain available in the picker
  const selectedNames = new Set(
    audiences.segments.filter((s) => s.isSelected).map((s) => normalize(s.name))
  );
  const selectedIds = new Set(
    audiences.segments.filter((s) => s.isSelected).map((s) => s.id)
  );
  const availableSegments = childSegments.filter(
    (seg) => !selectedIds.has(seg.id) && !selectedNames.has(normalize(seg.name))
  );

  const handleAddExistingSegment = (seg: PickerSegment) => {
    const existingInConfig = audiences.segments.find((s) => s.id === seg.id);
    if (existingInConfig) {
      if (!existingInConfig.isSelected) {
        toggleSegmentSelection(seg.id);
      }
    } else {
      const newSeg = {
        id: seg.id,
        name: seg.name,
        parentSegmentId: audiences.parentSegmentId,
        count: seg.count,
        isNew: false,
        isSelected: true,
        source: 'tdx' as const,
      };
      useCampaignConfigStore.setState((state) => {
        if (!state.config) return state;
        return {
          config: {
            ...state.config,
            audiences: {
              ...state.config.audiences,
              segments: [...state.config.audiences.segments, newSeg],
            },
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        };
      });
    }
    setShowSegmentPicker(false);
  };

  const handleOpenPicker = () => {
    setShowSegmentPicker(true);
    // Ensure child segments are loaded for the selected parent
    if (selectedParentSegmentId && childSegments.length === 0 && !isLoadingSegments) {
      selectParentSegment(selectedParentSegmentId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Parent Segment (read-only from global nav) */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Parent Segment</h2>
          {selectedParent ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{selectedParent.name}</span>
                {selectedParent.count && (
                  <span className="ml-2 text-xs text-gray-400">({selectedParent.count})</span>
                )}
              </div>
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">
                Selected
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
              No parent segment selected.
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Change the parent segment using the dropdown in the top-left navigation.
          </p>

          {isLoadingSegments && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading segments...
            </div>
          )}

          {segmentError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {segmentError}
            </div>
          )}
        </section>

        {/* Unified Audiences Section */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Audiences
              <span className="ml-2 text-sm font-normal text-gray-400">
                {selectedCount} selected
              </span>
            </h2>
            {isLoadingSegments && (
              <span className="text-[10px] text-gray-400 animate-pulse">Loading segments...</span>
            )}
          </div>

          {/* Unified segment list */}
          {visibleSegments.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {visibleSegments.map((seg, idx) => (
                <SelectableElement
                  key={seg.id}
                  refId={`seg-${seg.id}`}
                  refType="segment"
                  path={['Audiences', seg.name]}
                  label={seg.name}
                  currentValue={seg.description || undefined}
                  context={{ domain: 'audiences' }}
                >
                  <div
                    className={`flex items-start gap-3 p-3 ${idx > 0 ? 'border-t border-gray-100' : ''} ${
                      seg.source === 'brief' ? 'border-l-2 border-l-amber-300' : 'border-l-2 border-l-emerald-400'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={seg.isSelected}
                      onChange={() => toggleSegmentSelection(seg.id)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Name + badge + count + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{seg.name}</span>
                        {seg.source === 'tdx' ? (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                            Existing
                          </span>
                        ) : (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                            New
                          </span>
                        )}
                        {seg.count && (
                          <span className={`text-[11px] ${seg.source === 'tdx' ? 'text-emerald-600 font-medium' : 'text-gray-400 italic'}`}>
                            {seg.count} profiles
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{seg.description || '\u00A0'}</p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeSegment(seg.id)}
                      className="mt-0.5 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Remove audience"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </SelectableElement>
              ))}
            </div>
          ) : (
            !isLoadingSegments && (
              <p className="text-sm text-gray-400">
                {selectedParent
                  ? 'No audiences added yet. Click "+ Add Existing Segment" to browse available segments, or use the AI assistant below to suggest new ones.'
                  : 'Select a parent segment in the top-left navigation to load audience segments, or use the AI assistant below to suggest segments.'}
              </p>
            )
          )}

          {/* Inline searchable picker */}
          {showSegmentPicker ? (
            <SegmentPicker
              segments={availableSegments.map((seg) => ({
                ...seg,
                parentName: selectedParent?.name,
              }))}
              isLoading={isLoadingSegments}
              onSelect={handleAddExistingSegment}
              onClose={() => setShowSegmentPicker(false)}
              emptyMessage={
                childSegments.length === 0
                  ? (selectedParent ? 'No segments available for this parent' : 'No parent segment selected')
                  : 'No matching segments'
              }
            />
          ) : (
            <button
              onClick={handleOpenPicker}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Add Existing Segment
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
