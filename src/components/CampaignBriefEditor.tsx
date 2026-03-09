import { useState, useEffect, useCallback } from 'react';
import { useBriefStore } from '../stores/briefStore';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import { usePageStore } from '../stores/pageStore';
import { parseCampaignBrief } from '../services/briefParser';
import type { BriefSectionKey, SegmentMessages, CampaignMessage, RecommendedAudience, SpotCreative } from '../types/brief';
import { loadBrandGuidelines } from '../utils/brandGuidelinesStorage';
import { useSettingsStore } from '../stores/settingsStore';
import { Button, TextField, TextArea } from '@/design-system';
import SegmentPicker, { type PickerSegment } from './SegmentPicker';
import ChipInput from './ChipInput';
import AutosaveIndicator from './AutosaveIndicator';
import SelectableElement from './chat/SelectableElement';

interface CampaignBriefEditorProps {
  onCreateCampaign: () => void;
  onDelete?: () => void;
}

const SECTION_CONFIG: Array<{
  key: BriefSectionKey;
  title: string;
  helper: string;
}> = [
  { key: 'overview', title: 'Campaign Overview', helper: 'High-level campaign details and timeline' },
  { key: 'audience', title: 'Target Audience', helper: 'Who you want to reach and how to segment them' },
  { key: 'experience', title: 'Creative & Experience', helper: 'Messaging and placement strategy' },
  { key: 'measurement', title: 'Measurement & KPIs', helper: 'How you will measure success' },
];

// ── Spot-type field map (which CampaignMessage fields to show per spot type) ──

/**
 * Normalize spot types from both page-editor (uppercase: HEADING, TEXT, CTA)
 * and skill output (lowercase: headline, cta_button, hero_image) to a
 * canonical lowercase key used by the field/hint maps.
 */
function normalizeSpotType(raw: string): string {
  const lower = raw.toLowerCase();
  const ALIAS: Record<string, string> = {
    heading: 'headline',
    text: 'container',
    cta: 'cta_button',
    image: 'hero_image',
    media: 'hero_image',
    list: 'container',
    form: 'custom',
    input: 'custom',
  };
  return ALIAS[lower] ?? lower;
}

const SPOT_TYPE_FIELD_MAP: Record<string, (keyof CampaignMessage)[]> = {
  headline:               ['headline'],
  cta_button:             ['ctaText'],
  hero_image:             ['headline', 'bodyMessage'],
  header_greeting:        ['headline'],
  navigation:             [],
  product_recommendation: ['headline', 'bodyMessage'],
  testimonial:            ['headline', 'bodyMessage'],
  container:              ['bodyMessage'],
  custom:                 ['headline', 'bodyMessage', 'ctaText'],
};

/** Extra fields users can add beyond the spot type's defaults */
const SPOT_TYPE_OPTIONAL_FIELDS: Record<string, (keyof CampaignMessage)[]> = {
  container: ['headline', 'ctaText'],
  headline: ['bodyMessage', 'ctaText'],
  header_greeting: ['bodyMessage', 'ctaText'],
  hero_image: ['ctaText'],
  product_recommendation: ['ctaText'],
  testimonial: ['ctaText'],
};

const ALL_MESSAGE_FIELDS: (keyof CampaignMessage)[] = [
  'headline', 'bodyMessage', 'ctaText',
];

function fieldsForSpotType(spotType: string): (keyof CampaignMessage)[] {
  return SPOT_TYPE_FIELD_MAP[normalizeSpotType(spotType)] ?? ALL_MESSAGE_FIELDS;
}

const FIELD_LABELS: Record<keyof CampaignMessage, string> = {
  headline: 'Headline',
  bodyMessage: 'Body Message',
  ctaText: 'CTA Text',
  productName: 'Product Name',
  productDescription: 'Product Description',
  productPrice: 'Product Price',
};

/** Short hint describing the creative purpose per spot type */
const SPOT_TYPE_HINTS: Record<string, string> = {
  headline: 'Concise, impactful headline',
  cta_button: 'Short action-oriented text',
  hero_image: 'Campaign theme & visual direction',
  header_greeting: 'Personalized greeting',
  product_recommendation: 'Recommendation messaging',
  testimonial: 'Social proof & trust',
  container: 'Rich text content area',
  custom: 'Custom creative content',
};

/** Fields that should render as textarea rather than text input */
const TEXTAREA_FIELDS = new Set<keyof CampaignMessage>(['bodyMessage', 'productDescription']);

// ── Fuzzy matching (reused from briefToConfigMapper) ────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || nb.includes(na) || na.includes(nb);
}

export default function CampaignBriefEditor({ onCreateCampaign, onDelete }: CampaignBriefEditorProps) {
  const {
    activeBrief,
    isDirty,
    lastSavedAt,
    isGenerating,
    updateSection,
    toggleLock,
    renameBrief,
    saveBrief,
    deleteBrief,
  } = useBriefStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedParentSegmentId = useSettingsStore((s) => s.selectedParentSegmentId);
  const parentSegments = useSettingsStore((s) => s.parentSegments);

  const childSegments = useCampaignConfigStore((s) => s.childSegments);
  const isLoadingSegments = useCampaignConfigStore((s) => s.isLoadingSegments);
  const fetchChildSegments = useCampaignConfigStore((s) => s.fetchChildSegments);

  const [collapsedSections, setCollapsedSections] = useState<Set<BriefSectionKey>>(new Set());
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [segmentsFetched, setSegmentsFetched] = useState(false);
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);
  const [activeExperienceTab, setActiveExperienceTab] = useState<string>('default');

  // ── Fetch segments and reconcile audiences ─────────────────────────

  const fetchAndReconcile = useCallback(async () => {
    if (!selectedParentSegmentId || !activeBrief) return;

    await fetchChildSegments(selectedParentSegmentId);

    const { childSegments: segments } = useCampaignConfigStore.getState();
    const recommended = activeBrief.sections.audience.recommendedAudiences;
    if (!recommended?.length) return;

    // Match existing segments by name
    const updated = recommended.map((ra) => {
      const match = segments.find((tdx) => fuzzyMatch(ra.name, tdx.name));
      if (match) {
        return {
          ...ra,
          status: 'existing' as const,
          tdxSegmentId: match.id,
          estimatedSize: match.count || '',
        };
      }
      return ra;
    });
    updateSection('audience', { recommendedAudiences: updated });

    // For new segments, run TDX audience analysis
    const newSegments = updated.filter((ra) => ra.status === 'new');
    const selectedParent = parentSegments.find(
      (ps) => String(ps.id) === String(selectedParentSegmentId)
    );
    if (newSegments.length > 0 && selectedParent) {
      try {
        const analysisResult = await window.aiSuites.td.audienceAnalysis(
          selectedParent.name,
          newSegments.map((s) => s.name)
        );
        if (analysisResult?.success && analysisResult?.data) {
          const finalUpdated = updated.map((ra) => {
            if (ra.status === 'new' && analysisResult.data![ra.name] != null) {
              const count = analysisResult.data![ra.name];
              if (count > 0) {
                const formatted = count >= 1000000 ? `${(count / 1000000).toFixed(1)}M`
                  : count >= 1000 ? `${(count / 1000).toFixed(0)}K`
                  : String(count);
                return { ...ra, estimatedSize: `~${formatted}` };
              }
            }
            return ra;
          });
          updateSection('audience', { recommendedAudiences: finalUpdated });
        }
      } catch (analysisErr) {
        console.error('Audience analysis failed, keeping AI estimates:', analysisErr);
      }
    }
  }, [selectedParentSegmentId, activeBrief, fetchChildSegments, updateSection, parentSegments]);

  useEffect(() => {
    if (activeBrief && !segmentsFetched && !isGenerating) {
      setSegmentsFetched(true);
      fetchAndReconcile();
    }
  }, [activeBrief, segmentsFetched, isGenerating, fetchAndReconcile]);

  // ── Auto-populate spotCreatives from saved pages ──────────────────
  // When a brief has no spotCreatives but saved pages exist, generate them
  // so older briefs get the per-spot UI retroactively.
  const savedPages = usePageStore((s) => s.pages);

  useEffect(() => {
    if (!activeBrief || isGenerating) return;
    const experience = activeBrief.sections.experience;

    // Already has spotCreatives — nothing to do
    if (experience.spotCreatives && experience.spotCreatives.length > 0) return;

    // No pages available — can't generate
    if (savedPages.length === 0) return;

    // Collect all spots across pages
    const allSpots = savedPages.flatMap((p) =>
      (p.spots || []).map((spot) => ({ spot, page: p }))
    );
    if (allSpots.length === 0) return;

    // Build segments list from the brief's audience data
    const segments = (experience.segmentMessages || []).map((sm) => sm.segmentName);

    // Generate spotCreatives from pages with type-aware field filtering
    const spotCreatives: SpotCreative[] = allSpots.map(({ spot, page }) => {
      const normalized = normalizeSpotType(spot.type);
      const baseFields = SPOT_TYPE_FIELD_MAP[normalized] ?? ALL_MESSAGE_FIELDS;
      const filterFields = (src: CampaignMessage): CampaignMessage => ({
        headline: baseFields.includes('headline') ? (src.headline || '') : '',
        bodyMessage: baseFields.includes('bodyMessage') ? (src.bodyMessage || '') : '',
        ctaText: baseFields.includes('ctaText') ? (src.ctaText || '') : '',
      });

      return {
        spotId: spot.id,
        spotName: spot.name,
        spotType: spot.type,
        pageName: page.pageName || page.websiteUrl,
        pageId: page.id,
        defaultContent: filterFields({
          headline: experience.headline || '',
          bodyMessage: experience.bodyMessage || '',
          ctaText: experience.ctaText || '',
        }),
        segmentContent: segments.map((segmentName) => {
          const segMsg = experience.segmentMessages?.find((sm) => sm.segmentName === segmentName);
          const msg = segMsg?.messages?.[0];
          return {
            segmentName,
            content: filterFields({
              headline: msg?.headline || '',
              bodyMessage: msg?.bodyMessage || '',
              ctaText: msg?.ctaText || '',
            }),
          };
        }),
      };
    });

    updateSection('experience', { spotCreatives }, 'spotCreatives');
  }, [activeBrief?.id, savedPages, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeBrief) return null;

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{activeBrief.name}</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full">generating</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {SECTION_CONFIG.map(({ key, title }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-medium text-gray-900 mb-3">{title}</div>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 animate-pulse">AI is generating your campaign brief...</p>
        </div>
      </div>
    );
  }

  const toggleCollapse = (key: BriefSectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRegenerate = (sectionKey: BriefSectionKey) => {
    const parsed = parseCampaignBrief(activeBrief.sourceMessage, activeBrief);
    const newSection = parsed.sections[sectionKey];
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(newSection)) {
      if (k !== 'locked' && k !== 'userEditedFields' && k !== 'notes') {
        updates[k] = v;
      }
    }
    // Apply without fieldName so we don't mark as user-edited
    updateSection(sectionKey, updates);
  };

  const startNameEdit = () => {
    setNameValue(activeBrief.name);
    setEditingName(true);
  };

  const commitNameEdit = () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== activeBrief.name) {
      renameBrief(activeBrief.id, nameValue.trim());
    }
  };

  const isUserEdited = (sectionKey: BriefSectionKey, field: string): boolean => {
    return activeBrief.sections[sectionKey].userEditedFields?.includes(field) ?? false;
  };

  const renderFieldLabel = (label: string, sectionKey: BriefSectionKey, field: string) => (
    <div className="flex items-center gap-1.5 mb-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {isUserEdited(sectionKey, field) ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="User edited" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300" title="AI inferred" />
      )}
    </div>
  );

  const sectionTitle = (sectionKey: BriefSectionKey) =>
    SECTION_CONFIG.find((s) => s.key === sectionKey)?.title ?? sectionKey;

  const renderTextInput = (
    sectionKey: BriefSectionKey,
    field: string,
    label: string,
    value: string,
    placeholder?: string
  ) => (
    <SelectableElement
      refId={`brief.${sectionKey}.${field}`}
      refType="text-field"
      path={['Campaign Brief', sectionTitle(sectionKey), label]}
      label={label}
      currentValue={value}
      context={{ domain: 'brief-editor', sectionKey }}
    >
      <div>
        {renderFieldLabel(label, sectionKey, field)}
        <TextField
          value={value}
          onChange={(e) => updateSection(sectionKey, { [field]: e.target.value }, field)}
          placeholder={placeholder}
        />
      </div>
    </SelectableElement>
  );

  const renderTextArea = (
    sectionKey: BriefSectionKey,
    field: string,
    label: string,
    value: string,
    rows?: number
  ) => (
    <SelectableElement
      refId={`brief.${sectionKey}.${field}`}
      refType="text-field"
      path={['Campaign Brief', sectionTitle(sectionKey), label]}
      label={label}
      currentValue={value}
      context={{ domain: 'brief-editor', sectionKey }}
    >
      <div>
        {renderFieldLabel(label, sectionKey, field)}
        <TextArea
          value={value}
          onChange={(e) => updateSection(sectionKey, { [field]: e.target.value }, field)}
          rows={rows ?? 2}
        />
      </div>
    </SelectableElement>
  );

  const renderChipField = (
    sectionKey: BriefSectionKey,
    field: string,
    label: string,
    value: string[],
    placeholder?: string
  ) => (
    <SelectableElement
      refId={`brief.${sectionKey}.${field}`}
      refType="tag-list"
      path={['Campaign Brief', sectionTitle(sectionKey), label]}
      label={label}
      currentValue={value.join(', ')}
      context={{ domain: 'brief-editor', sectionKey }}
    >
      <div>
        {renderFieldLabel(label, sectionKey, field)}
        <ChipInput
          value={value}
          onChange={(vals) => updateSection(sectionKey, { [field]: vals }, field)}
          placeholder={placeholder}
        />
      </div>
    </SelectableElement>
  );

  // ── Segment messages helpers ──────────────────────────────────────

  // ── Spot creative handlers ───────────────────────────────────────

  const handleRemoveSpotCreative = (spotIdx: number) => {
    const spotCreatives = [...(activeBrief.sections.experience.spotCreatives || [])];
    spotCreatives.splice(spotIdx, 1);
    updateSection('experience', { spotCreatives }, 'spotCreatives');
  };

  const handleSpotDefaultChange = (
    spotIdx: number,
    field: keyof CampaignMessage,
    value: string,
  ) => {
    const spotCreatives = [...(activeBrief.sections.experience.spotCreatives || [])];
    spotCreatives[spotIdx] = {
      ...spotCreatives[spotIdx],
      defaultContent: { ...spotCreatives[spotIdx].defaultContent, [field]: value },
    };
    updateSection('experience', { spotCreatives }, 'spotCreatives');
  };

  const handleSpotSegmentChange = (
    spotIdx: number,
    segName: string,
    field: keyof CampaignMessage,
    value: string,
  ) => {
    const spotCreatives = [...(activeBrief.sections.experience.spotCreatives || [])];
    const sc = { ...spotCreatives[spotIdx] };
    sc.segmentContent = sc.segmentContent.map((seg) =>
      seg.segmentName === segName
        ? { ...seg, content: { ...seg.content, [field]: value } }
        : seg,
    );
    spotCreatives[spotIdx] = sc;
    updateSection('experience', { spotCreatives }, 'spotCreatives');
  };

  // ── Recommended audience helpers ──────────────────────────────────

  const handleToggleAudience = (idx: number) => {
    const recommended = [...(activeBrief.sections.audience.recommendedAudiences || [])];
    recommended[idx] = { ...recommended[idx], isSelected: !recommended[idx].isSelected };
    updateSection('audience', { recommendedAudiences: recommended }, 'recommendedAudiences');
  };

  const handleRemoveAudience = (idx: number) => {
    const recommended = [...(activeBrief.sections.audience.recommendedAudiences || [])];
    const removedName = recommended[idx].name;
    recommended.splice(idx, 1);
    updateSection('audience', { recommendedAudiences: recommended }, 'recommendedAudiences');

    // Sync: remove corresponding segment messages
    const segmentMessages = [...(activeBrief.sections.experience.segmentMessages || [])];
    const filtered = segmentMessages.filter((sm) => sm.segmentName !== removedName);
    if (filtered.length !== segmentMessages.length) {
      updateSection('experience', { segmentMessages: filtered }, 'segmentMessages');
    }

    // Sync: remove corresponding spotCreatives segmentContent entries
    const spotCreatives = activeBrief.sections.experience.spotCreatives;
    if (spotCreatives && spotCreatives.length > 0) {
      const updatedSC = spotCreatives.map((sc) => ({
        ...sc,
        segmentContent: sc.segmentContent.filter((seg) => seg.segmentName !== removedName),
      }));
      updateSection('experience', { spotCreatives: updatedSC }, 'spotCreatives');
    }

    // Reset tab if the removed segment was active
    if (activeExperienceTab === removedName) {
      setActiveExperienceTab('default');
    }
  };

  const handleAddExistingSegment = (seg: PickerSegment) => {
    const selectedParent = parentSegments.find(
      (ps) => String(ps.id) === String(selectedParentSegmentId)
    );
    const recommended = [...(activeBrief.sections.audience.recommendedAudiences || [])];
    // Skip if segment already in list by TDX ID or name
    if (recommended.some((ra) => ra.tdxSegmentId === seg.id || ra.name === seg.name)) {
      setShowSegmentPicker(false);
      return;
    }
    recommended.push({
      name: seg.name,
      description: `Existing TDX segment from ${selectedParent?.name || 'TDX'}`,
      status: 'existing',
      tdxSegmentId: seg.id,
      estimatedSize: seg.count || '',
      isSelected: true,
    });
    updateSection('audience', { recommendedAudiences: recommended }, 'recommendedAudiences');

    // Sync: add segment messages entry if not already present
    const segmentMessages = [...(activeBrief.sections.experience.segmentMessages || [])];
    if (!segmentMessages.some((sm) => sm.segmentName === seg.name)) {
      segmentMessages.push({
        segmentName: seg.name,
        messages: [{ headline: '', bodyMessage: '', ctaText: '' }],
      });
      updateSection('experience', { segmentMessages }, 'segmentMessages');
    }

    // Sync: add segmentContent entry to each spotCreative
    const spotCreatives = activeBrief.sections.experience.spotCreatives;
    if (spotCreatives && spotCreatives.length > 0) {
      const updatedSC = spotCreatives.map((sc) => {
        const hasEntry = sc.segmentContent.some((s) => s.segmentName === seg.name);
        if (hasEntry) return sc;
        return {
          ...sc,
          segmentContent: [
            ...sc.segmentContent,
            { segmentName: seg.name, content: { headline: '', bodyMessage: '', ctaText: '' } },
          ],
        };
      });
      updateSection('experience', { spotCreatives: updatedSC }, 'spotCreatives');
    }

    setShowSegmentPicker(false);
  };

  // ── Brand compliance helpers ──────────────────────────────────────

  const brandGuidelines = loadBrandGuidelines();
  const hasBrandGuidelines = brandGuidelines.length > 0;

  // ── Section renderers ─────────────────────────────────────────────

  const renderSectionContent = (sectionKey: BriefSectionKey) => {
    const s = activeBrief.sections;

    switch (sectionKey) {
      case 'overview':
        return (
          <div className="space-y-3">
            {renderTextInput('overview', 'campaignName', 'Campaign Name', s.overview.campaignName)}
            {renderTextArea('overview', 'objective', 'Objective', s.overview.objective)}
            {renderTextInput('overview', 'businessGoal', 'Business Goal', s.overview.businessGoal)}
            <div className="grid grid-cols-2 gap-3">
              {renderTextInput('overview', 'timelineStart', 'Start Date', s.overview.timelineStart, 'YYYY-MM-DD')}
              {renderTextInput('overview', 'timelineEnd', 'End Date', s.overview.timelineEnd, 'YYYY-MM-DD')}
            </div>
          </div>
        );

      case 'audience': {
        // Exclude already-added audiences from the picker
        const existingNames = new Set(
          (s.audience.recommendedAudiences || []).map((ra) => normalize(ra.name))
        );
        const selectedParent = parentSegments.find(
          (ps) => String(ps.id) === String(selectedParentSegmentId)
        );
        const availableSegments = childSegments.filter(
          (seg) => !existingNames.has(normalize(seg.name))
        );

        return (
          <div className="space-y-4">
            {/* Recommended Audiences */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recommended Audiences
                </label>
                {isLoadingSegments && (
                  <span className="text-[10px] text-gray-400 animate-pulse">Loading TDX segments...</span>
                )}
              </div>
              {(s.audience.recommendedAudiences?.length > 0) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {(s.audience.recommendedAudiences || []).map((ra: RecommendedAudience, idx: number) => (
                    <SelectableElement
                      key={ra.name}
                      refId={`brief.audience.segment-${idx}`}
                      refType="segment"
                      path={['Campaign Brief', 'Target Audience', ra.name]}
                      label={ra.name}
                      currentValue={ra.description}
                      context={{ domain: 'brief-editor', sectionKey: 'audience' }}
                    >
                    <div
                      className={`flex items-start gap-3 p-3 ${idx > 0 ? 'border-t border-gray-100' : ''} ${
                        ra.status === 'new' ? 'border-l-2 border-l-amber-300' : 'border-l-2 border-l-emerald-400'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={ra.isSelected}
                        onChange={() => handleToggleAudience(idx)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{ra.name}</span>
                          {ra.status === 'existing' ? (
                            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                              Existing
                            </span>
                          ) : (
                            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                              New
                            </span>
                          )}
                          {ra.estimatedSize && (
                            <span className={`text-[11px] ${ra.status === 'existing' ? 'text-emerald-600 font-medium' : 'text-gray-400 italic'}`}>
                              {ra.estimatedSize} profiles
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{ra.description}</p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveAudience(idx)}
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
              )}

              {/* Add existing segment */}
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
                  onClick={() => {
                    setShowSegmentPicker(true);
                    if (!segmentsFetched && selectedParentSegmentId) {
                      setSegmentsFetched(true);
                      fetchChildSegments(selectedParentSegmentId);
                    }
                  }}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  + Add Existing Segment
                </button>
              )}
            </div>
          </div>
        );
      }

      case 'experience': {
        const segmentMsgs = s.experience.segmentMessages || [];
        const spotCreatives = s.experience.spotCreatives || [];
        const hasSpotCreatives = spotCreatives.length > 0;
        const experienceTabs = ['default', ...segmentMsgs.map((sm: SegmentMessages) => sm.segmentName)];
        const activeTab = experienceTabs.includes(activeExperienceTab) ? activeExperienceTab : 'default';
        const activeSegIdx = segmentMsgs.findIndex((sm: SegmentMessages) => sm.segmentName === activeTab);

        // Render a per-spot creative card
        const renderSpotCard = (sc: SpotCreative, spotIdx: number, content: CampaignMessage, segName?: string) => {
          const normalized = normalizeSpotType(sc.spotType);
          const baseFields = fieldsForSpotType(sc.spotType);
          const optionalFields = SPOT_TYPE_OPTIONAL_FIELDS[normalized] || [];

          // Show fields that are present (content[f] !== undefined), from both
          // base and optional sets. Removed fields become re-addable.
          const allFields = [...baseFields, ...optionalFields];
          const visibleFields = allFields.filter((f) => content[f] !== undefined);
          const addableFields = allFields.filter((f) => content[f] === undefined);

          if (visibleFields.length === 0 && addableFields.length === 0) return null;

          const handleChange = (field: keyof CampaignMessage, value: string) =>
            segName
              ? handleSpotSegmentChange(spotIdx, segName, field, value)
              : handleSpotDefaultChange(spotIdx, field, value);

          const handleAddField = (field: keyof CampaignMessage) => {
            // Set to empty string to make the field visible and editable
            handleChange(field, '');
          };

          const handleRemoveField = (field: keyof CampaignMessage) => {
            // Clear value and remove from content by setting undefined via store
            const spotCreatives = [...(activeBrief.sections.experience.spotCreatives || [])];
            const spot = { ...spotCreatives[spotIdx] };
            if (segName) {
              spot.segmentContent = spot.segmentContent.map((seg) =>
                seg.segmentName === segName
                  ? { ...seg, content: { ...seg.content, [field]: undefined } }
                  : seg,
              );
            } else {
              spot.defaultContent = { ...spot.defaultContent, [field]: undefined };
            }
            spotCreatives[spotIdx] = spot;
            updateSection('experience', { spotCreatives }, 'spotCreatives');
          };

          return (
            <div key={sc.spotId} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {sc.pageName} — {sc.spotName}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded flex-shrink-0">
                      {sc.spotType}
                    </span>
                  </div>
                  {SPOT_TYPE_HINTS[normalized] && (
                    <span className="text-[10px] text-gray-400">{SPOT_TYPE_HINTS[normalized]}</span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveSpotCreative(spotIdx)}
                  className="ml-auto w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Remove creative"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Card fields */}
              <div className="p-3 space-y-2">
                {visibleFields.map((field) => {
                  const label = FIELD_LABELS[field];
                  const value = content[field] ?? '';
                  const isTextarea = TEXTAREA_FIELDS.has(field);
                  const isOptional = optionalFields.includes(field);

                  return (
                    <SelectableElement
                      key={field}
                      refId={`brief.experience.spot-${spotIdx}.${field}`}
                      refType="text-field"
                      path={['Campaign Brief', 'Creative', `${sc.pageName} — ${sc.spotName}`, label]}
                      label={label}
                      currentValue={value}
                      context={{ domain: 'brief-editor', sectionKey: 'experience' }}
                    >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-medium text-gray-500">{label}</label>
                        <button
                          onClick={() => handleRemoveField(field)}
                          className="w-4 h-4 flex items-center justify-center rounded text-gray-300 hover:text-red-500 transition-colors"
                          title={`Remove ${label}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {isTextarea ? (
                        <textarea
                          value={value}
                          onChange={(e) => handleChange(field, e.target.value)}
                          placeholder={label}
                          rows={2}
                          className="w-full px-2.5 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(field, e.target.value)}
                          placeholder={label}
                          className="w-full px-2.5 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                        />
                      )}
                    </div>
                    </SelectableElement>
                  );
                })}

                {/* Add optional field buttons */}
                {addableFields.length > 0 && (
                  <div className="flex gap-1.5 pt-1">
                    {addableFields.map((field) => (
                      <button
                        key={field}
                        onClick={() => handleAddField(field)}
                        className="px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        + {FIELD_LABELS[field]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-4">
            {/* Brand Compliance Banner */}
            {hasBrandGuidelines ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-emerald-800">
                  Brand guidelines applied: <strong>{brandGuidelines[0].name}</strong>
                  {brandGuidelines.length > 1 && ` +${brandGuidelines.length - 1} more`}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-xs text-amber-800">No brand guidelines selected</span>
                </div>
                <a
                  href="/assets"
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
                >
                  Upload Guidelines
                </a>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-0.5 border-b border-gray-200 overflow-x-auto">
              {experienceTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveExperienceTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'default' ? 'Default' : tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'default' ? (
              <div className="space-y-3">
                {/* Per-spot creative cards (when available) */}
                {hasSpotCreatives && (
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Per-Spot Creatives
                    </label>
                    <div className="space-y-2">
                      {spotCreatives.map((sc: SpotCreative, spotIdx: number) =>
                        renderSpotCard(sc, spotIdx, sc.defaultContent)
                      )}
                    </div>

                  </div>
                )}

                {/* Flat defaults (when no spotCreatives) */}
                {!hasSpotCreatives && (
                  <div className="space-y-3 pl-2 border-l-2 border-gray-100">
                    {renderTextInput('experience', 'headline', 'Headline', s.experience.headline)}
                    {renderTextArea('experience', 'bodyMessage', 'Body Message', s.experience.bodyMessage, 3)}
                    {renderTextInput('experience', 'ctaText', 'CTA Text', s.experience.ctaText)}
                  </div>
                )}

              </div>
            ) : activeSegIdx >= 0 ? (
              <div className="space-y-3">
                {/* Per-spot segment cards (when available) */}
                {hasSpotCreatives && (
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Creatives for "{activeTab}"
                    </label>
                    <div className="space-y-2">
                      {spotCreatives.map((sc: SpotCreative, spotIdx: number) => {
                        const segEntry = sc.segmentContent.find(
                          (seg) => seg.segmentName === activeTab
                        );
                        const content = segEntry?.content || { headline: '', bodyMessage: '', ctaText: '' };
                        return renderSpotCard(sc, spotIdx, content, activeTab);
                      })}
                    </div>
                  </div>
                )}

              </div>
            ) : null}
          </div>
        );
      }

      case 'measurement':
        return (
          <div className="space-y-3">
            {renderTextInput('measurement', 'primaryKpi', 'Primary KPI', s.measurement.primaryKpi)}
            {renderChipField('measurement', 'secondaryKpis', 'Secondary KPIs', s.measurement.secondaryKpis, 'Add KPI...')}
            {renderChipField('measurement', 'secondaryMetrics', 'Secondary Metrics', s.measurement.secondaryMetrics, 'Add metric...')}
            {renderChipField('measurement', 'successCriteria', 'Success Criteria', s.measurement.successCriteria, 'Add criterion...')}
            {renderChipField('measurement', 'risks', 'Risks', s.measurement.risks, 'Add risk...')}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitNameEdit(); if (e.key === 'Escape') setEditingName(false); }}
              className="text-sm font-semibold text-gray-900 border-b border-blue-400 outline-none bg-transparent"
            />
          ) : (
            <button
              onClick={startNameEdit}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
              title="Click to rename"
            >
              {activeBrief.name}
            </button>
          )}
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full">
            {activeBrief.status}
          </span>
        </div>
        <AutosaveIndicator isDirty={isDirty} lastSavedAt={lastSavedAt} />
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {SECTION_CONFIG.map(({ key, title, helper }) => {
          const section = activeBrief.sections[key];
          const isCollapsed = collapsedSections.has(key);

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3">
                <button
                  onClick={() => toggleCollapse(key)}
                  className="flex items-center gap-2 text-left min-w-0"
                >
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    <div className="text-xs text-gray-400">{helper}</div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Lock toggle */}
                  <button
                    onClick={() => toggleLock(key)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                      section.locked
                        ? 'bg-amber-50 text-amber-600'
                        : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                    }`}
                    title={section.locked ? 'Unlock section' : 'Lock section'}
                  >
                    {section.locked ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={() => handleRegenerate(key)}
                    disabled={section.locked}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Regenerate section"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Section body */}
              {!isCollapsed && (
                <div className="px-5 pb-4">
                  {section.locked && (
                    <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      This section is locked. AI regeneration is disabled.
                    </div>
                  )}
                  {section.notes && (
                    <div className="mb-3 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 italic">
                      {section.notes}
                    </div>
                  )}
                  {renderSectionContent(key)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Delete this brief?</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="xs"
                onClick={() => {
                  if (activeBrief) {
                    deleteBrief(activeBrief.id);
                    onDelete?.();
                  }
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete brief"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveBrief()}
              disabled={!isDirty}
              className="flex-1"
            >
              Save
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateCampaign}
              className="flex-1"
            >
              Create Campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
