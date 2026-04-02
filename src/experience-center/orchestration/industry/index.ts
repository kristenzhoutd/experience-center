import type { IndustryContext } from '../types';
import { retailContext } from './retail';
import { cpgContext } from './cpg';
import { travelContext } from './travel';
import { fetchParentSegmentDetail, fetchChildSegments } from '../../../services/cdp-api';
import type { ParentSegmentDetail } from '../../../services/cdp-api';
import { fetchRetailMetrics } from '../../../services/llm-chat-api';
import type { RetailMetrics } from '../../../services/llm-chat-api';

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
    // Fetch CDP metadata and live metrics independently
    // Either can fail without blocking the other
    console.log(`[EC] resolveIndustryContext: fetching live CDP data for parentSegmentId=${parentSegmentId}`);

    const [detailResult, liveMetrics, sampleSegments] = await Promise.all([
      fetchParentSegmentDetail(parentSegmentId).catch(() => ({ success: false as const, error: 'CDP fetch failed' })),
      fetchLiveRetailMetrics(),
      resolveSampleSegments(parentSegmentId, baseContext),
    ]);

    // If both CDP and Chat API failed, fall back entirely
    if ((!detailResult.success || !detailResult.data) && !liveMetrics) {
      console.warn('[EC] resolveIndustryContext: both CDP and Chat API failed, using hardcoded');
      return baseContext;
    }

    // CDP metadata (optional — may be null if CDP is down)
    const detail = detailResult.success ? detailResult.data as ParentSegmentDetail : null;
    if (detail) {
      console.log(`[EC] CDP fetch succeeded — ${detail.attributeGroups.length} attribute groups, ${detail.behaviors.length} behaviors`);
    } else {
      console.warn('[EC] CDP fetch failed, continuing with Chat API metrics only');
    }

    // Derive channel preferences from CDP consent data (falls back to hardcoded)
    const channelPreferences = detail ? deriveChannelPreferences(detail) : baseContext.channelPreferences;

    // Build context string from whichever sources succeeded
    const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
    const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
    const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
    const audienceName = detail?.name || 'Retail Demo';

    const loyaltyStr = liveMetrics
      ? Object.entries(liveMetrics.loyaltyTierCounts).map(([tier, count]) => `${tier} (${count})`).join(', ')
      : 'Bronze (310), Silver (246), Gold (166), Platinum (82)';
    const totalLoyalty = liveMetrics
      ? Object.values(liveMetrics.loyaltyTierCounts).reduce((a, b) => a + b, 0)
      : 804;
    const churnStr = liveMetrics
      ? Object.entries(liveMetrics.churnRiskDistribution).map(([level, count]) => {
          const pct = ((count / liveMetrics.totalCustomers) * 100).toFixed(1);
          return `${pct}% ${level}`;
        }).join(', ')
      : '36.2% Low, 32.4% Medium, 31.4% High';

    const m = liveMetrics;
    const avgOnline = m ? `$${m.avgOrderValue.online.toFixed(0)}` : '$396';
    const avgInstore = m ? `$${m.avgOrderValue.instore.toFixed(0)}` : '$253';
    const repeatRate = m ? `${(m.repeatPurchaseRate * 100).toFixed(1)}%` : '86.6%';
    const avgClv = m ? `$${m.avgClv.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '$7,589';
    const totalCust = m ? m.totalCustomers.toLocaleString() : '1,000';

    const dataSource = liveMetrics ? 'live data' : 'sample data';
    const cdpInfo = detail
      ? `The audience includes ${populationStr} customers with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
      : '';

    const sampleDataContext =
      `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
      cdpInfo +
      `Key metrics: ${avgOnline} avg online order value, ${avgInstore} avg in-store order value, ${repeatRate} repeat purchase rate, ` +
      `${avgClv} avg predicted CLV. ` +
      `Loyalty program: ${totalLoyalty} members across ${loyaltyStr}. ` +
      `Churn risk: ${churnStr}. ` +
      `Top product categories: Electronics, Beauty, Clothing, Books, Automotive.`;

    const sampleMetrics: Record<string, string> = m ? {
      avgOrderValueOnline: avgOnline,
      avgOrderValueInStore: avgInstore,
      repeatPurchaseRate: repeatRate,
      customerLifetimeValue: avgClv,
      totalCustomers: totalCust,
      loyaltyMembers: String(totalLoyalty),
      churnRiskHigh: `${((m.churnRiskDistribution['High'] || 0) / m.totalCustomers * 100).toFixed(1)}%`,
      churnRiskMedium: `${((m.churnRiskDistribution['Medium'] || 0) / m.totalCustomers * 100).toFixed(1)}%`,
      churnRiskLow: `${((m.churnRiskDistribution['Low'] || 0) / m.totalCustomers * 100).toFixed(1)}%`,
    } : {
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

/**
 * Fetch live retail metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveRetailMetrics(): Promise<RetailMetrics | null> {
  try {
    const result = await fetchRetailMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live retail metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live metrics fetch error, using hardcoded');
    return null;
  }
}
