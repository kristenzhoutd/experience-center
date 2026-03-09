/**
 * EditorToolbar — Device preview toggles, undo/redo, spot/variant tabs.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { ContentSpot, ContentVariant, SpotTargetingMode } from '../../../types/campaignConfig';

// ── Device Preview Toggle ────────────────────────────────────────────

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: DeviceType; label: string; icon: ReactNode }[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M3 5v10a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
      </svg>
    ),
  },
  {
    id: 'tablet',
    label: 'Tablet',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
];

// ── Types ────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  // Device preview
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  // Undo/redo
  onUndo: () => void;
  onRedo: () => void;
  // Spot tabs
  spots: ContentSpot[];
  activeSpotId: string | null;
  onSpotChange: (spotId: string) => void;
  // Spot management
  availablePageSpots: Array<{ id: string; name: string; type: string; selector: string }>;
  onAddSpot: (spotId: string, name: string, selector: string, type: string) => void;
  onRemoveSpot: (spotId: string) => void;
  // Variant tabs
  activeVariantId: string; // 'default' or a variantId
  onVariantChange: (variantId: string) => void;
  // Targeting mode
  targetingMode: SpotTargetingMode;
  onTargetingModeChange: (mode: SpotTargetingMode) => void;
  // Segment variants for the active spot
  variants: ContentVariant[];
  // Add/remove variant
  availableSegments: Array<{ id: string; name: string }>;
  onAddVariant: (segmentName: string, segmentId: string) => void;
  onRemoveVariant: (variantId: string) => void;
  // Batch segment selection
  allSelectedSegments: Array<{ id: string; name: string; count?: string }>;
  onAddVariants: (segments: Array<{ id: string; name: string }>) => void;
  // Right panel toggle (layers, styles, etc.)
  rightPanel: 'layers' | 'styles' | null;
  onTogglePanel: (panel: 'layers' | 'styles') => void;
}

export default function EditorToolbar({
  device,
  onDeviceChange,
  onUndo,
  onRedo,
  spots,
  activeSpotId,
  onSpotChange,
  availablePageSpots,
  onAddSpot,
  onRemoveSpot,
  activeVariantId,
  onVariantChange,
  targetingMode,
  onTargetingModeChange,
  variants,
  availableSegments,
  onAddVariant,
  onRemoveVariant,
  allSelectedSegments,
  onAddVariants,
  rightPanel,
  onTogglePanel,
}: EditorToolbarProps) {
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set());
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Spot picker state
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const spotPickerRef = useRef<HTMLDivElement>(null);
  const addSpotBtnRef = useRef<HTMLButtonElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showSegmentPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        addBtnRef.current && !addBtnRef.current.contains(e.target as Node)
      ) {
        setShowSegmentPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSegmentPicker]);

  // Close spot picker on outside click
  useEffect(() => {
    if (!showSpotPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (
        spotPickerRef.current && !spotPickerRef.current.contains(e.target as Node) &&
        addSpotBtnRef.current && !addSpotBtnRef.current.contains(e.target as Node)
      ) {
        setShowSpotPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSpotPicker]);

  // Close popovers when spot changes
  useEffect(() => {
    setShowSegmentPicker(false);
    setShowSpotPicker(false);
  }, [activeSpotId]);

  const handleAddClick = useCallback(() => {
    if (variants.length === 0) {
      // No variants yet — show the batch picker popover
      const usedIds = new Set(variants.map((v) => v.audienceRefId));
      const available = allSelectedSegments.filter((s) => !usedIds.has(s.id));
      setPickerSelection(new Set(available.map((s) => s.id)));
      setShowSegmentPicker(true);
    }
    // If variants already exist, the hover dropdown handles one-by-one additions
  }, [variants, allSelectedSegments]);

  const handlePickerToggle = useCallback((segId: string) => {
    setPickerSelection((prev) => {
      const next = new Set(prev);
      if (next.has(segId)) next.delete(segId);
      else next.add(segId);
      return next;
    });
  }, []);

  const handleCreateVariants = useCallback(() => {
    const selected = allSelectedSegments.filter((s) => pickerSelection.has(s.id));
    if (selected.length === 0) return;
    onTargetingModeChange('segment_variants');
    onAddVariants(selected.map((s) => ({ id: s.id, name: s.name })));
    setShowSegmentPicker(false);
  }, [allSelectedSegments, pickerSelection, onTargetingModeChange, onAddVariants]);

  // Segments available in the picker (exclude already-used)
  const usedSegmentIds = new Set(variants.map((v) => v.audienceRefId));
  const pickerSegments = allSelectedSegments.filter((s) => !usedSegmentIds.has(s.id));

  // Spot picker popover — shows spots from the page store not yet in content
  const renderSpotPickerPopover = () => {
    if (!showSpotPicker) return null;
    const rect = addSpotBtnRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return createPortal(
      <div
        ref={spotPickerRef}
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-64"
        style={{ top: rect.bottom + 6, left: rect.left }}
      >
        <div className="px-4 pt-3.5 pb-2">
          <div className="text-sm font-semibold text-gray-900">Add Spot</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Select a spot configured on this page
          </div>
        </div>
        <div className="px-2 pb-2 max-h-48 overflow-y-auto">
          {availablePageSpots.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-xs text-gray-400">
                All spots on this page have been added. Go to Pages to configure more spots.
              </p>
            </div>
          ) : (
            availablePageSpots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => {
                  onAddSpot(spot.id, spot.name, spot.selector, spot.type);
                  setShowSpotPicker(false);
                }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-indigo-50 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{spot.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">{spot.selector}</div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-gray-100">
          <button
            onClick={() => setShowSpotPicker(false)}
            className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Popover positioning
  const renderPopover = () => {
    if (!showSegmentPicker) return null;
    const rect = addBtnRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const selectedCount = pickerSelection.size;

    return createPortal(
      <div
        ref={popoverRef}
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-72"
        style={{ top: rect.bottom + 6, left: rect.left }}
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-2">
          <div className="text-sm font-semibold text-gray-900">Select Audiences</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Choose segments to create targeted variants
          </div>
        </div>

        {/* Checkbox list */}
        <div className="px-2 pb-2 max-h-48 overflow-y-auto">
          {pickerSegments.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-xs text-gray-400">
                {allSelectedSegments.length === 0
                  ? 'No audiences selected. Go to Step 2 to configure audiences.'
                  : 'All audiences already have variants.'}
              </p>
            </div>
          ) : (
            pickerSegments.map((seg) => (
              <label
                key={seg.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={pickerSelection.has(seg.id)}
                  onChange={() => handlePickerToggle(seg.id)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{seg.name}</div>
                  {seg.count && (
                    <div className="text-[10px] text-gray-400">{seg.count}</div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSegmentPicker(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateVariants}
              disabled={selectedCount === 0 || pickerSegments.length === 0}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
                selectedCount > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Variants
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
    <div className="flex flex-col border-b border-gray-200 bg-white">
      {/* Top row: device preview + undo/redo */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        {/* Device toggles */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => onDeviceChange(d.id)}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                device === d.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title={d.label}
            >
              {d.icon}
              <span className="hidden sm:inline">{d.label}</span>
            </button>
          ))}
        </div>

        {/* Undo / Redo + Layers toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 010 10H9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l-4 4 4 4" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 000 10h4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l4 4-4 4" />
            </svg>
          </button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            onClick={() => onTogglePanel('layers')}
            className={`p-1.5 rounded-lg transition-colors ${
              rightPanel === 'layers'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={rightPanel === 'layers' ? 'Hide layers' : 'Show layers'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l10 5 10-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l10 5 10-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Spot tabs row */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider mr-1">Spot</span>
          {spots.map((spot) => (
            <div key={spot.spotId} className="flex items-center gap-0.5 group/spot">
              <button
                onClick={() => onSpotChange(spot.spotId)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeSpotId === spot.spotId
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {spot.spotName}
              </button>
              {spots.length > 1 && (
                <button
                  onClick={() => onRemoveSpot(spot.spotId)}
                  className="p-0.5 text-gray-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover/spot:opacity-100"
                  title="Remove spot"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {availablePageSpots.length > 0 && (
            <button
              ref={addSpotBtnRef}
              onClick={() => setShowSpotPicker(!showSpotPicker)}
              className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              title="Add spot"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Variant tabs row */}
      <div className="flex items-center gap-1 px-3 py-2 flex-wrap">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider mr-1 flex-shrink-0">Variant</span>
        <button
          onClick={() => onVariantChange('default')}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex-shrink-0 ${
            activeVariantId === 'default'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Default
        </button>
        {variants.map((v) => (
          <div key={v.variantId} className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => onVariantChange(v.variantId)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeVariantId === v.variantId
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-600 hover:bg-purple-50 bg-purple-50/50'
              }`}
            >
              {v.audienceName}
            </button>
            <button
              onClick={() => onRemoveVariant(v.variantId)}
              className="p-0.5 text-gray-300 hover:text-red-500 rounded transition-colors"
              title="Remove variant"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {availableSegments.length > 0 && (
          <div className="relative flex-shrink-0 group">
            <button
              ref={addBtnRef}
              onClick={variants.length === 0 ? handleAddClick : undefined}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              title="Add segment variant"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
            {/* Hover dropdown for one-by-one additions (only when variants already exist) */}
            {variants.length > 0 && (
              <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                {availableSegments.map((seg) => (
                  <button
                    key={seg.id}
                    onClick={() => onAddVariant(seg.name, seg.id)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    {seg.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    {renderPopover()}
    {renderSpotPickerPopover()}
    </>
  );
}

export type { DeviceType };
