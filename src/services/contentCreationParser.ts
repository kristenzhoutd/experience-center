/**
 * Parser for content-configuration-json code fence output.
 * Extracts ContentPage[] from AI response.
 */

import type { ContentPage, ContentSpot, ContentVariant, VariantContent } from '../types/campaignConfig';

const FENCE_REGEX = /```content-configuration-json\s*\n([\s\S]*?)```/;

function parseVariantContent(raw: Record<string, unknown>): VariantContent {
  return {
    headline: String(raw.headline ?? ''),
    body: String(raw.body ?? ''),
    ctaText: String(raw.ctaText ?? ''),
    imageUrl: String(raw.imageUrl ?? ''),
    deepLinkUrl: String(raw.deepLinkUrl ?? ''),
  };
}

function parseVariant(raw: Record<string, unknown>): ContentVariant {
  const content = (raw.content as Record<string, unknown>) ?? {};
  return {
    variantId: String(raw.variantId ?? `var-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    audienceType: (raw.audienceType as 'segment' | 'audience') ?? 'segment',
    audienceName: String(raw.audienceName ?? ''),
    audienceRefId: String(raw.audienceRefId ?? ''),
    priority: Number(raw.priority) || 1,
    content: parseVariantContent(content),
  };
}

function parseSpot(raw: Record<string, unknown>): ContentSpot {
  const defaultVariant = (raw.defaultVariant as Record<string, unknown>) ?? {};
  const variants = Array.isArray(raw.variants)
    ? (raw.variants as Record<string, unknown>[]).map(parseVariant)
    : [];

  return {
    spotId: String(raw.spotId ?? ''),
    spotName: String(raw.spotName ?? ''),
    spotType: String(raw.spotType ?? ''),
    selector: String(raw.selector ?? ''),
    thumbnail: {
      type: 'placeholder',
      url: '',
      alt: String(raw.spotName ?? ''),
    },
    targetingMode: variants.length > 0 ? 'segment_variants' : 'default_only',
    defaultVariant: parseVariantContent(defaultVariant),
    variants,
  };
}

function parsePage(raw: Record<string, unknown>): ContentPage {
  const spots = Array.isArray(raw.spots)
    ? (raw.spots as Record<string, unknown>[]).map(parseSpot)
    : [];

  return {
    pageId: String(raw.pageId ?? ''),
    pageName: String(raw.pageName ?? ''),
    pageUrlPattern: String(raw.pageUrlPattern ?? ''),
    thumbnail: {
      type: 'placeholder',
      url: '',
      alt: String(raw.pageName ?? ''),
    },
    spots,
  };
}

export function parseContentCreationOutput(content: string): ContentPage[] | null {
  const match = content.match(FENCE_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());

    // Accept { pages: [...] } wrapper or bare array
    const pagesArray = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.pages)
        ? parsed.pages
        : null;

    if (!pagesArray) return null;

    return (pagesArray as Record<string, unknown>[]).map(parsePage);
  } catch {
    console.warn('[ContentCreationParser] Failed to parse JSON from code fence');
    return null;
  }
}
