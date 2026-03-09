/**
 * Brief Output Parser — detects and parses `campaign-brief-json` code fences
 * from Claude's streamed response content.
 */

import type { BriefSections, SegmentMessages, CampaignMessage, RecommendedAudience, SpotCreative, SpotSegmentCreative } from '../types/brief';

/**
 * Extract a structured BriefSections object from Claude's response content.
 * Looks for a ```campaign-brief-json code fence containing valid JSON.
 * Returns null if no match or invalid JSON.
 */
export function extractBriefFromContent(content: string): BriefSections | null {
  // Match ```campaign-brief-json ... ``` (with optional trailing whitespace)
  const match = content.match(
    /```campaign-brief-json\s*\n([\s\S]*?)\n\s*```/
  );
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);

    // Validate that all 5 required sections exist
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.overview ||
      !parsed.audience ||
      !parsed.experience ||
      !parsed.measurement
    ) {
      return null;
    }

    // Validate required string fields
    const { overview, audience, experience, measurement } = parsed;
    if (
      typeof overview.campaignName !== 'string' ||
      typeof overview.objective !== 'string' ||
      typeof audience.primaryAudience !== 'string' ||
      typeof experience.headline !== 'string' ||
      typeof measurement.primaryKpi !== 'string'
    ) {
      return null;
    }

    // Normalize segmentMessages: default to [] if missing/malformed
    if (!Array.isArray(experience.segmentMessages)) {
      experience.segmentMessages = [];
    } else {
      experience.segmentMessages = experience.segmentMessages.filter(
        (sm: unknown): sm is SegmentMessages =>
          !!sm &&
          typeof sm === 'object' &&
          typeof (sm as SegmentMessages).segmentName === 'string' &&
          Array.isArray((sm as SegmentMessages).messages) &&
          (sm as SegmentMessages).messages.every(
            (m: unknown) =>
              !!m &&
              typeof m === 'object' &&
              typeof (m as CampaignMessage).headline === 'string' &&
              typeof (m as CampaignMessage).bodyMessage === 'string' &&
              typeof (m as CampaignMessage).ctaText === 'string' &&
              ((m as CampaignMessage).productName === undefined || typeof (m as CampaignMessage).productName === 'string') &&
              ((m as CampaignMessage).productDescription === undefined || typeof (m as CampaignMessage).productDescription === 'string') &&
              ((m as CampaignMessage).productPrice === undefined || typeof (m as CampaignMessage).productPrice === 'string')
          )
      );
    }

    // Normalize spotCreatives: validate or remove
    if (experience.spotCreatives != null) {
      if (!Array.isArray(experience.spotCreatives)) {
        delete experience.spotCreatives;
      } else {
        const isValidMessage = (m: unknown): m is CampaignMessage =>
          !!m &&
          typeof m === 'object' &&
          typeof (m as CampaignMessage).headline === 'string' &&
          typeof (m as CampaignMessage).bodyMessage === 'string' &&
          typeof (m as CampaignMessage).ctaText === 'string';

        experience.spotCreatives = experience.spotCreatives.filter(
          (sc: unknown): sc is SpotCreative =>
            !!sc &&
            typeof sc === 'object' &&
            typeof (sc as SpotCreative).spotId === 'string' &&
            typeof (sc as SpotCreative).spotName === 'string' &&
            typeof (sc as SpotCreative).spotType === 'string' &&
            typeof (sc as SpotCreative).pageName === 'string' &&
            typeof (sc as SpotCreative).pageId === 'string' &&
            isValidMessage((sc as SpotCreative).defaultContent) &&
            Array.isArray((sc as SpotCreative).segmentContent) &&
            (sc as SpotCreative).segmentContent.every(
              (seg: unknown): seg is SpotSegmentCreative =>
                !!seg &&
                typeof seg === 'object' &&
                typeof (seg as SpotSegmentCreative).segmentName === 'string' &&
                isValidMessage((seg as SpotSegmentCreative).content)
            )
        );
        if (experience.spotCreatives.length === 0) {
          delete experience.spotCreatives;
        }
      }
    }

    // Normalize recommendedAudiences: default to [] if missing/malformed
    if (!Array.isArray(audience.recommendedAudiences)) {
      audience.recommendedAudiences = [];
    } else {
      audience.recommendedAudiences = audience.recommendedAudiences.filter(
        (ra: unknown): ra is RecommendedAudience =>
          !!ra &&
          typeof ra === 'object' &&
          typeof (ra as RecommendedAudience).name === 'string' &&
          typeof (ra as RecommendedAudience).description === 'string' &&
          ((ra as RecommendedAudience).status === 'existing' || (ra as RecommendedAudience).status === 'new')
      ).map((ra: RecommendedAudience) => ({
        ...ra,
        isSelected: ra.isSelected ?? true,
      }));

      // Deduplicate by normalized name (keep first occurrence)
      const seenNames = new Set<string>();
      audience.recommendedAudiences = audience.recommendedAudiences.filter(
        (ra: RecommendedAudience) => {
          const key = ra.name.trim().toLowerCase();
          if (seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        }
      );
    }

    return parsed as BriefSections;
  } catch {
    return null;
  }
}
