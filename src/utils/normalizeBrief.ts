/**
 * Normalize AI skill output (object shapes) to editor store types (flat strings / string[]).
 *
 * The LLM may return `campaignDetails` as an object `{campaignName, campaignType, description}`
 * or audiences as arrays of objects. This function flattens everything so the brief editor
 * receives the `CampaignBriefData` shape it expects.
 *
 * Used by:
 *  - chatStore.ts  → to normalize before dispatching to the editor and saving the snapshot
 *  - programStore.ts → to normalize legacy snapshots on restore
 */
export function normalizeForEditor(data: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...data };

  // campaignDetails: {campaignName, campaignType, description} → string
  if (normalized.campaignDetails && typeof normalized.campaignDetails === 'object' && !Array.isArray(normalized.campaignDetails)) {
    const cd = normalized.campaignDetails as Record<string, string>;
    normalized.campaignDetails = [cd.campaignName, cd.campaignType, cd.description].filter(Boolean).join(' — ');
  }

  // primaryAudience / secondaryAudience: [{name, description, estimatedSize}] → string[]
  for (const key of ['primaryAudience', 'secondaryAudience'] as const) {
    if (Array.isArray(normalized[key])) {
      normalized[key] = (normalized[key] as unknown[]).map((item) =>
        typeof item === 'object' && item !== null && 'name' in item
          ? (item as Record<string, string>).name
          : String(item)
      );
    }
  }

  // prospecting/retargeting/suppressionSegments: ensure string[] (AI may output objects)
  for (const key of ['prospectingSegments', 'retargetingSegments', 'suppressionSegments'] as const) {
    if (Array.isArray(normalized[key])) {
      normalized[key] = (normalized[key] as unknown[]).map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          return String(obj.segmentName || obj.name || obj.label || JSON.stringify(item));
        }
        return String(item);
      });
    }
  }

  // phases: [{name, ...}] → string (editor expects a simple string like "3 phases")
  if (Array.isArray(normalized.phases)) {
    const phaseArr = normalized.phases as Record<string, unknown>[];
    normalized.phases = phaseArr.length > 0
      ? `${phaseArr.length} phase${phaseArr.length > 1 ? 's' : ''}: ${phaseArr.map((p) => (p.name as string) || '').filter(Boolean).join(', ')}`
      : '';
  }

  // budget: handle nested object or alternate field names
  // AI may output { budget: { amount, pacing } } or { budget: "$200,000" }
  if (!normalized.budgetAmount && normalized.budget) {
    if (typeof normalized.budget === 'object' && !Array.isArray(normalized.budget)) {
      const b = normalized.budget as Record<string, string>;
      normalized.budgetAmount = b.amount || b.total || b.budgetAmount || '';
      if (!normalized.pacing && b.pacing) normalized.pacing = b.pacing;
    } else if (typeof normalized.budget === 'string') {
      normalized.budgetAmount = normalized.budget;
    }
  }
  // Also check totalBudget as a fallback
  if (!normalized.budgetAmount && normalized.totalBudget) {
    normalized.budgetAmount = String(normalized.totalBudget);
  }

  return normalized;
}
