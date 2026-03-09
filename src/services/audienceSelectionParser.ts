/**
 * Parser for audience-selection-json code fence output.
 * Extracts WizardSegment[] from AI response.
 */

import type { WizardSegment } from '../types/campaignConfig';

const FENCE_REGEX = /```audience-selection-json\s*\n([\s\S]*?)```/;

export function parseAudienceSelectionOutput(content: string): WizardSegment[] | null {
  const match = content.match(FENCE_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!Array.isArray(parsed)) return null;

    return parsed.map((item: Record<string, unknown>) => ({
      id: String(item.id || `seg-suggested-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      name: String(item.name || ''),
      parentSegmentId: String(item.parentSegmentId || ''),
      description: typeof item.description === 'string' ? item.description : undefined,
      rules: Array.isArray(item.rules)
        ? item.rules.map((r: Record<string, string>) => ({
            rule: String(r.rule || ''),
            value: String(r.value || ''),
          }))
        : undefined,
      isNew: item.isNew !== false,
      isSelected: item.isSelected !== false,
      source: (item.source === 'tdx' ? 'tdx' : 'brief') as 'tdx' | 'brief',
    }));
  } catch {
    console.warn('[AudienceSelectionParser] Failed to parse JSON from code fence');
    return null;
  }
}
