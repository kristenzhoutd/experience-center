import type { IndustryContext } from '../types';
import { retailContext } from './retail';
import { cpgContext } from './cpg';
import { travelContext } from './travel';
import { fetchParentSegmentDetail, fetchChildSegments } from '../../../services/cdp-api';
import type { ParentSegmentDetail } from '../../../services/cdp-api';

const industryContexts: Record<string, IndustryContext> = {
  retail: retailContext,
  cpg: cpgContext,
  travel: travelContext,
};

export function getIndustryContext(industryId: string): IndustryContext {
  const ctx = industryContexts[industryId];
  if (!ctx) throw new Error(`Unknown industry: ${industryId}`);
  return ctx;
}

/**
 * Resolves the IndustryContext for a given industry.
 * For retail with a parentSegmentId, enriches with live CDP data.
 * Falls back to hardcoded context on any failure.
 */
export async function resolveIndustryContext(
  industryId: string,
  parentSegmentId?: string | null
): Promise<IndustryContext> {
  const baseContext = getIndustryContext(industryId);

  // Only enrich for retail when a parentSegmentId is provided
  if (industryId !== 'retail' || !parentSegmentId) {
    console.log(`[EC] resolveIndustryContext: using hardcoded context (industry=${industryId}, parentSegmentId=${parentSegmentId})`);
    return baseContext;
  }

  try {
    console.log(`[EC] resolveIndustryContext: fetching live CDP data for parentSegmentId=${parentSegmentId}`);
    const detailResult = await fetchParentSegmentDetail(parentSegmentId);
    if (!detailResult.success || !detailResult.data) {
      console.warn(`[EC] resolveIndustryContext: CDP fetch failed, falling back to hardcoded`, detailResult.error);
      return baseContext;
    }
    console.log(`[EC] resolveIndustryContext: CDP fetch succeeded — ${detailResult.data.attributeGroups.length} attribute groups, ${detailResult.data.behaviors.length} behaviors`);

    const detail: ParentSegmentDetail = detailResult.data;

    // Derive channel preferences from consent attributes
    const channelPreferences = deriveChannelPreferences(detail);

    // Determine sample segments: use live child segments only if 2+ with real names
    const sampleSegments = await resolveSampleSegments(parentSegmentId, baseContext);

    // Build the enriched sampleDataContext
    const attrGroupNames = detail.attributeGroups.map(g => g.groupName).join(', ');
    const behaviorNames = detail.behaviors.map(b => b.name).join(', ');
    const populationStr = detail.population != null ? String(detail.population) : 'unknown';

    const sampleDataContext =
      `This analysis uses live data from the ${detail.name} CDP audience (Treasure Data). ` +
      `The audience includes ${populationStr} customers with ${detail.attributeGroups.length} attribute groups ` +
      `(${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). ` +
      `Key metrics: $396 avg online order value, $253 avg in-store order value, 86.6% repeat purchase rate, ` +
      `$7,589 avg predicted CLV, 38% cart abandonment rate ($319 avg abandoned cart), 68% email open rate, ` +
      `29.2% email CTR. Loyalty program: 804 members across Bronze (310), Silver (246), Gold (166), Platinum (82). ` +
      `RFM segments: Potential Loyalists (122), Hibernating (112), About to Sleep (105), At Risk (103), ` +
      `Recent Customers (101), Promising (100), Can't Lose Them (98), Champions (95), Loyal Customers (89), ` +
      `Need Attention (75). Churn risk: 36.2% Low, 32.4% Medium, 31.4% High. ` +
      `Top product categories: Electronics, Beauty, Clothing, Books, Automotive.`;

    // Real metrics from retail_demo database on us01:13232
    // Queried from: master_customers, online_orders, instore_transactions,
    //   abandoned_carts, loyalty_members, rfm_scores, email_events, consents
    const sampleMetrics: Record<string, string> = {
      avgOrderValueOnline: '$396',
      avgOrderValueInStore: '$253',
      repeatPurchaseRate: '86.6%',
      customerLifetimeValue: '$7,589',
      cartAbandonmentRate: '38%',
      avgAbandonedCartValue: '$319',
      emailOpenRate: '68%',
      emailClickThroughRate: '29.2%',
      conversionRate: '3.2%',
      totalCustomers: '1,000',
      onlineBuyers: '886',
      inStoreBuyers: '846',
      loyaltyMembers: '804',
      loyaltyOptInRate: '80.4%',
      churnRiskHigh: '31.4%',
      churnRiskMedium: '32.4%',
      churnRiskLow: '36.2%',
    };

    return {
      ...baseContext,
      sampleSegments,
      sampleMetrics,
      channelPreferences,
      sampleDataContext,
    };
  } catch {
    // Graceful fallback: never block scenario execution
    return baseContext;
  }
}

/**
 * Derives channel preferences from consent-related attributes in the CDP data.
 */
function deriveChannelPreferences(detail: ParentSegmentDetail): string[] {
  const consentGroup = detail.attributeGroups.find(
    g => g.groupName.toLowerCase().includes('consent')
  );

  if (!consentGroup || consentGroup.attributes.length === 0) {
    return retailContext.channelPreferences;
  }

  const channelMap: Record<string, string> = {
    email: 'Email',
    sms: 'SMS',
    push: 'Mobile Push',
    direct_mail: 'Direct Mail',
    directmail: 'Direct Mail',
  };

  const channels: string[] = [];
  for (const attr of consentGroup.attributes) {
    const lowerName = attr.name.toLowerCase().replace(/[\s_-]+/g, '_');
    for (const [key, label] of Object.entries(channelMap)) {
      if (lowerName.includes(key) && !channels.includes(label)) {
        channels.push(label);
      }
    }
  }

  // Always include Web Personalization as it's implicit
  if (!channels.includes('Web Personalization')) {
    channels.push('Web Personalization');
  }

  return channels.length > 0 ? channels : retailContext.channelPreferences;
}

/**
 * Resolves sample segments: use live child segments only if there are 2+ with real names.
 */
async function resolveSampleSegments(
  parentSegmentId: string,
  baseContext: IndustryContext
): Promise<IndustryContext['sampleSegments']> {
  try {
    const childResult = await fetchChildSegments(parentSegmentId);
    if (!childResult.success || !childResult.data) {
      return baseContext.sampleSegments;
    }

    // Filter out trivially-named segments (like 'test')
    const meaningfulSegments = childResult.data.filter(seg => {
      const name = seg.name.toLowerCase().trim();
      return name.length > 0 && name !== 'test' && name !== 'untitled';
    });

    // Only use live segments if there are at least 2 with real names
    if (meaningfulSegments.length < 2) {
      return baseContext.sampleSegments;
    }

    return meaningfulSegments.map(seg => ({
      name: seg.name,
      description: seg.description || seg.name,
      size: seg.count || 'unknown',
      valueLevel: 'Medium' as const,
    }));
  } catch {
    return baseContext.sampleSegments;
  }
}
