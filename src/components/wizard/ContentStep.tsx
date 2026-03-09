import { useState, useEffect, useCallback, useRef } from 'react';
import { Eye } from 'lucide-react';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import { useChatStore } from '../../stores/chatStore';
import { usePageStore } from '../../stores/pageStore';
import SelectableElement from '../chat/SelectableElement';
import { contentForSpotType, contentForSpotFromBrief, contentForSpotSegment } from '../../services/briefToConfigMapper';
import { localBriefStorage } from '../../services/briefStorage';
import type { VariantContent, ContentVariant } from '../../types/campaignConfig';
import GrapesJSCanvas from './content/GrapesJSCanvas';
import EditorToolbar from './content/EditorToolbar';
import type { DeviceType } from './content/EditorToolbar';
import PreviewContentModal from './content/PreviewContentModal';

// ── Placeholder thumbnail component ─────────────────────────────────

function PlaceholderThumb({ label, sublabel, icon }: { label: string; sublabel?: string; icon: 'page' | 'spot' }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-2 text-center">
      {icon === 'page' ? (
        <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )}
      <span className="text-[10px] font-medium text-gray-500 leading-tight line-clamp-1">{label}</span>
      {sublabel && <span className="text-[9px] text-gray-400 leading-tight line-clamp-1">{sublabel}</span>}
    </div>
  );
}

// ── Content Editor (GrapesJS-based) ──────────────────────────────────

function ContentEditor({ pageId }: { pageId: string }) {
  const config = useCampaignConfigStore((s) => s.config);
  const updateDefaultVariantGjs = useCampaignConfigStore((s) => s.updateDefaultVariantGjs);
  const updateVariantGjs = useCampaignConfigStore((s) => s.updateVariantGjs);
  const updateSpotTargetingMode = useCampaignConfigStore((s) => s.updateSpotTargetingMode);
  const addContentSpot = useCampaignConfigStore((s) => s.addContentSpot);
  const removeContentSpot = useCampaignConfigStore((s) => s.removeContentSpot);
  const addVariant = useCampaignConfigStore((s) => s.addVariant);
  const removeVariant = useCampaignConfigStore((s) => s.removeVariant);
  const saveAsDraft = useCampaignConfigStore((s) => s.saveAsDraft);
  const isDirty = useCampaignConfigStore((s) => s.isDirty);
  const { pages: savedPages } = usePageStore();

  const setActiveEditorSelection = useCampaignConfigStore((s) => s.setActiveEditorSelection);

  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const [activeVariantId, setActiveVariantId] = useState<string>('default');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [saveFlash, setSaveFlash] = useState(false);
  const [rightPanel, setRightPanel] = useState<'layers' | 'styles' | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Ref to hold the GrapesJS editor instance for undo/redo
  const editorRef = useRef<{ undo: () => void; redo: () => void } | null>(null);

  const page = config?.content.pages.find((p) => p.pageId === pageId);
  if (!page || !config) return null;

  const spots = page.spots;

  // Auto-select first spot
  const currentSpotId = activeSpotId && spots.find((s) => s.spotId === activeSpotId)
    ? activeSpotId
    : spots[0]?.spotId || null;

  const currentSpot = spots.find((s) => s.spotId === currentSpotId);

  // Sync active editor selection to store for content-agent skill routing
  useEffect(() => {
    setActiveEditorSelection(pageId, currentSpotId, activeVariantId);
  }, [pageId, currentSpotId, activeVariantId, setActiveEditorSelection]);

  // Resolve active content
  let activeContent: VariantContent | null = null;
  if (currentSpot) {
    if (activeVariantId === 'default') {
      activeContent = currentSpot.defaultVariant;
    } else {
      const variant = currentSpot.variants.find((v) => v.variantId === activeVariantId);
      activeContent = variant?.content || currentSpot.defaultVariant;
      // Reset to default if variant not found
      if (!variant) {
        // Will be corrected on next render
      }
    }
  }

  // All selected segments from Step 2 (for batch popover)
  const allSelectedSegments = config.audiences.segments
    .filter((s) => s.isSelected)
    .map((s) => ({ id: s.id, name: s.name, count: s.count }));

  // Available segments for adding variants (one-by-one dropdown)
  const selectedSegments = config.audiences.segments.filter((s) => s.isSelected);
  const usedSegmentIds = new Set(currentSpot?.variants.map((v) => v.audienceRefId) || []);
  const availableSegments = selectedSegments.filter((s) => !usedSegmentIds.has(s.id));

  // Spots from the page store not yet added to content
  const savedPage = savedPages.find((p) => p.id === pageId);
  const contentSpotIds = new Set(spots.map((s) => s.spotId));
  const availablePageSpots = (savedPage?.spots || [])
    .filter((s) => !contentSpotIds.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, type: s.type, selector: s.selector }));

  // Unique key for GrapesJS remount when spot/variant changes or AI updates content
  const contentRevision = useCampaignConfigStore((s) => s.contentRevision);
  const editorKey = `${pageId}-${currentSpotId}-${activeVariantId}-${contentRevision}`;

  const handleGjsUpdate = useCallback((gjsData: { gjsProjectData: Record<string, unknown>; gjsHtml: string; gjsCss: string }) => {
    if (!currentSpotId) return;
    if (activeVariantId === 'default') {
      updateDefaultVariantGjs(pageId, currentSpotId, gjsData);
    } else {
      updateVariantGjs(pageId, currentSpotId, activeVariantId, gjsData);
    }
  }, [pageId, currentSpotId, activeVariantId, updateDefaultVariantGjs, updateVariantGjs]);

  const handleSpotChange = useCallback((spotId: string) => {
    setActiveSpotId(spotId);
    setActiveVariantId('default');
  }, []);

  const handleAddSpot = useCallback((spotId: string, name: string, selector: string, type: string) => {
    addContentSpot(pageId, name, selector, type, spotId);
  }, [pageId, addContentSpot]);

  const handleRemoveSpot = useCallback((spotId: string) => {
    removeContentSpot(pageId, spotId);
    if (activeSpotId === spotId) setActiveSpotId(null);
  }, [pageId, activeSpotId, removeContentSpot]);

  const handleVariantChange = useCallback((variantId: string) => {
    setActiveVariantId(variantId);
  }, []);

  const handleTargetingModeChange = useCallback((mode: 'default_only' | 'segment_variants') => {
    if (!currentSpotId) return;
    updateSpotTargetingMode(pageId, currentSpotId, mode);
  }, [pageId, currentSpotId, updateSpotTargetingMode]);

  const handleAddVariant = useCallback((segmentName: string, segmentId: string) => {
    if (!currentSpotId) return;
    updateSpotTargetingMode(pageId, currentSpotId, 'segment_variants');
    addVariant(pageId, currentSpotId, segmentName, segmentId);
  }, [pageId, currentSpotId, addVariant, updateSpotTargetingMode]);

  const handleRemoveVariant = useCallback((variantId: string) => {
    if (!currentSpotId || !currentSpot) return;
    removeVariant(pageId, currentSpotId, variantId);
    if (activeVariantId === variantId) {
      setActiveVariantId('default');
    }
    // Auto-switch back to default_only when last variant is removed
    if (currentSpot.variants.length <= 1) {
      updateSpotTargetingMode(pageId, currentSpotId, 'default_only');
    }
  }, [pageId, currentSpotId, currentSpot, activeVariantId, removeVariant, updateSpotTargetingMode]);

  const handleAddVariants = useCallback((segments: Array<{ id: string; name: string }>) => {
    if (!currentSpotId) return;
    for (const seg of segments) {
      addVariant(pageId, currentSpotId, seg.name, seg.id);
    }
  }, [pageId, currentSpotId, addVariant]);

  const handleUndo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const handleSave = useCallback(() => {
    saveAsDraft();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }, [saveAsDraft]);

  if (spots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-xs text-gray-400">
            No spots configured for this page. Go to Pages to add content spots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Toolbar */}
      <EditorToolbar
        device={device}
        onDeviceChange={setDevice}
        onUndo={handleUndo}
        onRedo={handleRedo}
        spots={spots}
        activeSpotId={currentSpotId}
        onSpotChange={handleSpotChange}
        availablePageSpots={availablePageSpots}
        onAddSpot={handleAddSpot}
        onRemoveSpot={handleRemoveSpot}
        activeVariantId={activeVariantId}
        onVariantChange={handleVariantChange}
        targetingMode={currentSpot?.targetingMode || 'default_only'}
        onTargetingModeChange={handleTargetingModeChange}
        variants={currentSpot?.variants || []}
        availableSegments={availableSegments}
        onAddVariant={handleAddVariant}
        onRemoveVariant={handleRemoveVariant}
        allSelectedSegments={allSelectedSegments}
        onAddVariants={handleAddVariants}
        rightPanel={rightPanel}
        onTogglePanel={(panel) => setRightPanel((prev) => prev === panel ? null : panel)}
      />

      {/* Canvas + Block Palette (inside GjsEditor context) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeContent && (
          <GrapesJSCanvas
            key={editorKey}
            editorKey={editorKey}
            content={activeContent}
            onUpdate={handleGjsUpdate}
            device={device}
            showLayers={rightPanel === 'layers'}
            showStyles={rightPanel === 'styles'}
          />
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white">
        <div className="text-[11px] text-gray-400">
          {currentSpot && (
            <>
              <span className="font-medium text-gray-600">{currentSpot.spotName}</span>
              {' — '}
              {activeVariantId === 'default' ? 'Default' : currentSpot.variants.find((v) => v.variantId === activeVariantId)?.audienceName || 'Variant'}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveFlash && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium animate-in fade-in">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Content
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty && !saveFlash}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isDirty
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H7" />
              <rect x="7" y="13" width="10" height="6" rx="1" />
            </svg>
            Save Content
          </button>
        </div>
      </div>

      {showPreview && (
        <PreviewContentModal
          onClose={() => setShowPreview(false)}
          initialPageId={pageId}
        />
      )}
    </div>
  );
}

// ── Main ContentStep component ──────────────────────────────────────

export default function ContentStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const setContentPages = useCampaignConfigStore((s) => s.setContentPages);
  const removeContentPage = useCampaignConfigStore((s) => s.removeContentPage);
  const setPageContext = useChatStore((s) => s.setPageContext);
  const { pages: savedPages, loadPages } = usePageStore();
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showPagePicker, setShowPagePicker] = useState(false);

  // Set page context for content-editor skill routing
  useEffect(() => {
    setPageContext('content-editor');
    return () => setPageContext(null);
  }, [setPageContext]);

  // Load pages from storage on mount and sync with content
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Sync pages from Pages step into content config when entering Step 3.
  // Only ADDS new pages/spots — never overwrites or removes existing content edits.
  useEffect(() => {
    if (!config) return;

    // Resolve brief for spot-type-aware mapping
    const brief = config.briefId ? localBriefStorage.getBrief(config.briefId) : null;
    const experienceSource: Partial<VariantContent> = brief ? {
      headline: brief.sections.experience.headline || '',
      body: brief.sections.experience.bodyMessage || '',
      ctaText: brief.sections.experience.ctaText || '',
    } : {};

    // Helper: get default variant content for a spot, preferring per-spot creatives
    const getDefaultVariant = (spotId: string, spotType: string) => {
      if (brief?.sections.experience.spotCreatives) {
        return contentForSpotFromBrief(spotId, spotType, brief);
      }
      return contentForSpotType(spotType, experienceSource);
    };

    // Helper: build segment variants from brief's spotCreatives.segmentContent,
    // matched against selected audiences from Step 2.
    const selectedSegments = config.audiences.segments.filter((s) => s.isSelected);
    const buildVariantsFromBrief = (spotId: string, spotType: string): ContentVariant[] => {
      if (!brief) return [];
      const spotCreative = brief.sections.experience.spotCreatives?.find(
        (sc) => sc.spotId === spotId,
      );
      if (!spotCreative?.segmentContent?.length) return [];

      const variants: ContentVariant[] = [];
      for (const seg of spotCreative.segmentContent) {
        // Match brief segment name against selected Step 2 segments
        const matched = selectedSegments.find(
          (s) => s.name.toLowerCase() === seg.segmentName.toLowerCase(),
        );
        if (!matched) continue;

        variants.push({
          variantId: `var-${spotId}-${matched.id}`,
          audienceType: 'segment',
          audienceName: matched.name,
          audienceRefId: matched.id,
          priority: 1,
          content: contentForSpotSegment(spotId, spotType, seg.segmentName, brief),
        });
      }
      return variants;
    };

    const existingPages = config.content.pages;
    const existingPageIds = new Set(existingPages.map((p) => p.pageId));

    let hasChanges = false;
    // Deep copy existing pages to avoid mutating the store
    const mergedPages = existingPages.map((p) => ({
      ...p,
      spots: [...p.spots],
    }));

    for (const savedPage of savedPages) {
      if (!existingPageIds.has(savedPage.id)) {
        hasChanges = true;
        mergedPages.push({
          pageId: savedPage.id,
          pageName: savedPage.pageName,
          pageUrlPattern: savedPage.websiteUrl,
          thumbnail: {
            type: savedPage.thumbnailDataUrl ? 'screenshot' as const : 'placeholder' as const,
            url: savedPage.thumbnailDataUrl || '',
            alt: savedPage.pageName,
          },
          spots: savedPage.spots.map((spot) => {
            const variants = buildVariantsFromBrief(spot.id, spot.type);
            return {
              spotId: spot.id,
              spotName: spot.name,
              spotType: spot.type,
              selector: spot.selector,
              thumbnail: { type: 'placeholder' as const, url: '', alt: `${spot.name} on ${savedPage.pageName}` },
              targetingMode: variants.length > 0 ? 'segment_variants' as const : 'default_only' as const,
              defaultVariant: getDefaultVariant(spot.id, spot.type),
              variants,
            };
          }),
        });
      } else {
        const existingPage = mergedPages.find((p) => p.pageId === savedPage.id);
        if (existingPage) {
          const existingSpotIds = new Set(existingPage.spots.map((s) => s.spotId));

          // Add new spots from the saved page that aren't in content yet
          for (const spot of savedPage.spots) {
            if (!existingSpotIds.has(spot.id)) {
              hasChanges = true;
              const variants = buildVariantsFromBrief(spot.id, spot.type);
              existingPage.spots = [...existingPage.spots, {
                spotId: spot.id,
                spotName: spot.name,
                spotType: spot.type,
                selector: spot.selector,
                thumbnail: { type: 'placeholder' as const, url: '', alt: `${spot.name} on ${savedPage.pageName}` },
                targetingMode: variants.length > 0 ? 'segment_variants' as const : 'default_only' as const,
                defaultVariant: getDefaultVariant(spot.id, spot.type),
                variants,
              }];
            }
          }

          // Refresh existing spots that haven't been manually edited in GrapesJS
          // with the latest brief content (e.g. when brief spotCreatives are
          // updated after spots were already synced with generic defaults).
          if (brief?.sections.experience.spotCreatives) {
            existingPage.spots = existingPage.spots.map((existingSpot) => {
              let updated = existingSpot;

              // Refresh default content if not manually edited
              if (!existingSpot.defaultVariant.gjsProjectData) {
                const briefContent = getDefaultVariant(existingSpot.spotId, existingSpot.spotType);
                const hasContent = briefContent.headline || briefContent.body || briefContent.ctaText;
                if (hasContent) {
                  const current = existingSpot.defaultVariant;
                  const isDifferent = current.headline !== briefContent.headline
                    || current.body !== briefContent.body
                    || current.ctaText !== briefContent.ctaText;
                  if (isDifferent) {
                    hasChanges = true;
                    updated = { ...updated, defaultVariant: briefContent };
                  }
                }
              }

              // Add missing segment variants from brief
              const briefVariants = buildVariantsFromBrief(existingSpot.spotId, existingSpot.spotType);
              if (briefVariants.length > 0) {
                const existingRefIds = new Set(updated.variants.map((v) => v.audienceRefId));
                const newVariants = briefVariants.filter((v) => !existingRefIds.has(v.audienceRefId));
                if (newVariants.length > 0) {
                  hasChanges = true;
                  updated = {
                    ...updated,
                    targetingMode: 'segment_variants' as const,
                    variants: [...updated.variants, ...newVariants],
                  };
                }
              }

              return updated;
            });
          }
        }
      }
    }

    if (hasChanges) {
      setContentPages(mergedPages);
    }
  }, [savedPages, config?.briefId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!config) return null;

  const { content } = config;
  const pages = content.pages;

  // Default to first page
  const currentPageId = activePageId || pages[0]?.pageId || '';
  const currentPage = pages.find((p) => p.pageId === currentPageId);

  // Count stats
  const totalSpots = pages.reduce((sum, p) => sum + p.spots.length, 0);
  const totalVariants = pages.reduce(
    (sum, p) => sum + p.spots.reduce((s2, spot) => s2 + spot.variants.length, 0),
    0
  );

  // Pages from the Pages step not yet added to content
  const contentPageIds = new Set(pages.map((p) => p.pageId));
  const availableSavedPages = savedPages.filter((p) => !contentPageIds.has(p.id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {pages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-700 mb-1">No pages configured</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Go to the Pages section to add webpages and configure content spots first.
              Content configuration is driven by the pages and spots you define there.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full min-w-0">
            {/* Horizontal page row */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 overflow-x-auto flex-shrink-0 bg-gray-50/50">
              {pages.map((page) => (
                <SelectableElement
                  key={page.pageId}
                  refId={`page-${page.pageId}`}
                  refType="page"
                  path={['Content', page.pageName]}
                  label={page.pageName}
                  context={{ domain: 'content', pageId: page.pageId }}
                >
                  <div
                    className={`group/page relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0 w-[140px] ${
                      currentPageId === page.pageId
                        ? 'bg-white shadow-sm border border-indigo-300 ring-1 ring-indigo-100'
                        : 'bg-white/60 border border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                    onClick={() => setActivePageId(page.pageId)}
                  >
                    <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                      {page.thumbnail.type === 'screenshot' && page.thumbnail.url ? (
                        <img src={page.thumbnail.url} alt={page.thumbnail.alt} className="w-full h-full object-cover" />
                      ) : (
                        <PlaceholderThumb label={page.pageName} icon="page" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-900 truncate">{page.pageName}</div>
                      <div className="text-[10px] text-gray-400">
                        {page.spots.length} spot{page.spots.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeContentPage(page.pageId);
                        if (activePageId === page.pageId) setActivePageId(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-white border border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-300 rounded-full opacity-0 group-hover/page:opacity-100 transition-opacity flex-shrink-0 shadow-sm"
                      title="Remove page"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </SelectableElement>
              ))}

              {/* Add Page button + popover */}
              {availableSavedPages.length > 0 && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowPagePicker(!showPagePicker)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 hover:bg-white transition-colors h-[42px]"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Page
                  </button>
                  {showPagePicker && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                      <div className="px-2.5 pt-2 pb-1.5">
                        <div className="text-[11px] font-medium text-gray-600">Select a page</div>
                      </div>
                      <div className="max-h-48 overflow-y-auto px-1 pb-1">
                        {availableSavedPages.map((savedPage) => (
                          <button
                            key={savedPage.id}
                            onClick={() => {
                              const pickerBrief = config.briefId ? localBriefStorage.getBrief(config.briefId) : null;
                              const pickerSource: Partial<VariantContent> = pickerBrief ? {
                                headline: pickerBrief.sections.experience.headline || '',
                                body: pickerBrief.sections.experience.bodyMessage || '',
                                ctaText: pickerBrief.sections.experience.ctaText || '',
                              } : {};
                              const getPickerDefault = (spotId: string, spotType: string) => {
                                if (pickerBrief?.sections.experience.spotCreatives) {
                                  return contentForSpotFromBrief(spotId, spotType, pickerBrief);
                                }
                                return contentForSpotType(spotType, pickerSource);
                              };
                              const pickerSegments = config.audiences.segments.filter((s) => s.isSelected);
                              const getPickerVariants = (spotId: string, spotType: string): ContentVariant[] => {
                                if (!pickerBrief) return [];
                                const sc = pickerBrief.sections.experience.spotCreatives?.find((c) => c.spotId === spotId);
                                if (!sc?.segmentContent?.length) return [];
                                const vars: ContentVariant[] = [];
                                for (const seg of sc.segmentContent) {
                                  const matched = pickerSegments.find((s) => s.name.toLowerCase() === seg.segmentName.toLowerCase());
                                  if (!matched) continue;
                                  vars.push({
                                    variantId: `var-${spotId}-${matched.id}`,
                                    audienceType: 'segment',
                                    audienceName: matched.name,
                                    audienceRefId: matched.id,
                                    priority: 1,
                                    content: contentForSpotSegment(spotId, spotType, seg.segmentName, pickerBrief),
                                  });
                                }
                                return vars;
                              };
                              setContentPages([...pages, {
                                pageId: savedPage.id,
                                pageName: savedPage.pageName,
                                pageUrlPattern: savedPage.websiteUrl,
                                thumbnail: {
                                  type: savedPage.thumbnailDataUrl ? 'screenshot' as const : 'placeholder' as const,
                                  url: savedPage.thumbnailDataUrl || '',
                                  alt: savedPage.pageName,
                                },
                                spots: savedPage.spots.map((spot) => {
                                  const vars = getPickerVariants(spot.id, spot.type);
                                  return {
                                    spotId: spot.id,
                                    spotName: spot.name,
                                    spotType: spot.type,
                                    selector: spot.selector,
                                    thumbnail: { type: 'placeholder' as const, url: '', alt: `${spot.name} on ${savedPage.pageName}` },
                                    targetingMode: vars.length > 0 ? 'segment_variants' as const : 'default_only' as const,
                                    defaultVariant: getPickerDefault(spot.id, spot.type),
                                    variants: vars,
                                  };
                                }),
                              }]);
                              setActivePageId(savedPage.id);
                              setShowPagePicker(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-indigo-50 text-left transition-colors"
                          >
                            <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                              {savedPage.thumbnailDataUrl ? (
                                <img src={savedPage.thumbnailDataUrl} alt={savedPage.pageName} className="w-full h-full object-cover" />
                              ) : (
                                <PlaceholderThumb label={savedPage.pageName} icon="page" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-700 truncate">{savedPage.pageName}</div>
                              <div className="text-[10px] text-gray-400">
                                {savedPage.spots.length} spot{savedPage.spots.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="px-2 pb-1.5 border-t border-gray-100 pt-1.5">
                        <button
                          onClick={() => setShowPagePicker(false)}
                          className="w-full px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-center"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              {totalSpots > 0 && (
                <div className="ml-auto flex-shrink-0 text-[10px] text-gray-400 whitespace-nowrap">
                  {totalSpots} spot{totalSpots !== 1 ? 's' : ''} / {totalVariants} variant{totalVariants !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Content editor — full width */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {currentPage ? (
                <ContentEditor pageId={currentPage.pageId} />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  Select a page to configure content
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
