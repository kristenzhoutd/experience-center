import type { IndustryContext } from '../types';
import { retailContext } from './retail';
import { cpgContext } from './cpg';
import { travelContext } from './travel';
import { automotiveContext } from './automotive';
import { mediaContext } from './media';
import { d2cContext } from './d2c';
import { b2btechContext } from './b2btech';
import { financialContext } from './financial';
import { healthcareContext } from './healthcare';
import { fetchParentSegmentDetail, fetchChildSegments } from '../../../services/cdp-api';
import type { ParentSegmentDetail } from '../../../services/cdp-api';
import { fetchRetailMetrics, fetchTravelMetrics, fetchCpgMetrics, fetchAutomotiveMetrics, fetchMediaMetrics, fetchD2cMetrics, fetchB2btechMetrics, fetchFinancialMetrics, fetchHealthcareMetrics } from '../../../services/llm-chat-api';
import type { RetailMetrics, TravelMetrics, CpgMetrics, AutomotiveMetrics, MediaMetrics, D2cMetrics, B2btechMetrics, FinancialMetrics, HealthcareMetrics } from '../../../services/llm-chat-api';

const industryContexts: Record<string, IndustryContext> = {
  retail: retailContext,
  cpg: cpgContext,
  travel: travelContext,
  automotive: automotiveContext,
  media: mediaContext,
  d2c: d2cContext,
  b2btech: b2btechContext,
  financial: financialContext,
  healthcare: healthcareContext,
};

export function getIndustryContext(industryId: string): IndustryContext {
  const ctx = industryContexts[industryId];
  if (!ctx) throw new Error(`Unknown industry: ${industryId}`);
  return ctx;
}

/**
 * Resolves the IndustryContext for a given industry.
 * For retail, travel, and cpg with a parentSegmentId, enriches with live CDP data.
 * Falls back to hardcoded context on any failure.
 */
export async function resolveIndustryContext(
  industryId: string,
  parentSegmentId?: string | null
): Promise<IndustryContext> {
  const baseContext = getIndustryContext(industryId);

  // Only enrich for industries with live CDP data when a parentSegmentId is provided
  if (!['retail', 'travel', 'cpg', 'automotive', 'media', 'd2c', 'b2btech', 'financial', 'healthcare'].includes(industryId) || !parentSegmentId) {
    console.log(`[EC] resolveIndustryContext: using hardcoded context (industry=${industryId}, parentSegmentId=${parentSegmentId})`);
    return baseContext;
  }

  try {
    // Fetch CDP metadata and live metrics independently
    // Either can fail without blocking the other
    console.log(`[EC] resolveIndustryContext: fetching live CDP data for parentSegmentId=${parentSegmentId}`);

    const [detailResult, liveMetrics, sampleSegments] = await Promise.all([
      fetchParentSegmentDetail(parentSegmentId).catch(() => ({ success: false as const, error: 'CDP fetch failed' })),
      industryId === 'retail' ? fetchLiveRetailMetrics() :
      industryId === 'travel' ? fetchLiveTravelMetrics() :
      industryId === 'cpg' ? fetchLiveCpgMetrics() :
      industryId === 'automotive' ? fetchLiveAutomotiveMetrics() :
      industryId === 'media' ? fetchLiveMediaMetrics() :
      industryId === 'd2c' ? fetchLiveD2cMetrics() :
      industryId === 'b2btech' ? fetchLiveB2btechMetrics() :
      industryId === 'financial' ? fetchLiveFinancialMetrics() :
      industryId === 'healthcare' ? fetchLiveHealthcareMetrics() :
      Promise.resolve(null),
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
    const channelPreferences = detail ? deriveChannelPreferences(detail, baseContext) : baseContext.channelPreferences;

    if (industryId === 'retail') {
      return buildRetailEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as RetailMetrics | null);
    }
    if (industryId === 'travel') {
      return buildTravelEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as TravelMetrics | null);
    }
    if (industryId === 'cpg') {
      return buildCpgEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as CpgMetrics | null);
    }
    if (industryId === 'automotive') {
      return buildAutomotiveEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as AutomotiveMetrics | null);
    }
    if (industryId === 'media') {
      return buildMediaEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as MediaMetrics | null);
    }
    if (industryId === 'd2c') {
      return buildD2cEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as D2cMetrics | null);
    }
    if (industryId === 'b2btech') {
      return buildB2btechEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as B2btechMetrics | null);
    }
    if (industryId === 'financial') {
      return buildFinancialEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as FinancialMetrics | null);
    }
    if (industryId === 'healthcare') {
      return buildHealthcareEnrichedContext(detail, baseContext, sampleSegments, channelPreferences, liveMetrics as HealthcareMetrics | null);
    }

    return baseContext;
  } catch {
    // Graceful fallback: never block scenario execution
    return baseContext;
  }
}

/**
 * Builds enriched retail context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildRetailEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: RetailMetrics | null
): IndustryContext {
  // Build context string from whichever sources succeeded
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'Retail Demo';

  const fallbackMetrics: RetailMetrics = {
    totalCustomers: 1000,
    avgClv: 7589.33,
    loyaltyTierCounts: { Bronze: 310, Silver: 246, Gold: 166, Platinum: 82 },
    avgOrderValue: { online: 396.46, instore: 253.44, combined: 341.07 },
    churnRiskDistribution: { High: 314, Low: 362, Medium: 324 },
    repeatPurchaseRate: 0.866,
  };
  const m = liveMetrics || fallbackMetrics;

  const loyaltyStr = Object.entries(m.loyaltyTierCounts).map(([tier, count]) => `${tier} (${count})`).join(', ');
  const totalLoyalty = Object.values(m.loyaltyTierCounts).reduce((a, b) => a + b, 0);
  const churnStr = Object.entries(m.churnRiskDistribution).map(([level, count]) => {
    const pct = ((count / m.totalCustomers) * 100).toFixed(1);
    return `${pct}% ${level}`;
  }).join(', ');

  const avgOnline = `$${m.avgOrderValue.online.toFixed(0)}`;
  const avgInstore = `$${m.avgOrderValue.instore.toFixed(0)}`;
  const repeatRate = `${(m.repeatPurchaseRate * 100).toFixed(1)}%`;
  const avgClv = `$${m.avgClv.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const totalCust = m.totalCustomers.toLocaleString();

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

  const sampleMetrics: Record<string, string> = {
    avgOrderValueOnline: avgOnline,
    avgOrderValueInStore: avgInstore,
    repeatPurchaseRate: repeatRate,
    customerLifetimeValue: avgClv,
    totalCustomers: totalCust,
    loyaltyMembers: String(totalLoyalty),
    churnRiskHigh: `${((m.churnRiskDistribution['High'] || 0) / m.totalCustomers * 100).toFixed(1)}%`,
    churnRiskMedium: `${((m.churnRiskDistribution['Medium'] || 0) / m.totalCustomers * 100).toFixed(1)}%`,
    churnRiskLow: `${((m.churnRiskDistribution['Low'] || 0) / m.totalCustomers * 100).toFixed(1)}%`,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched travel context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildTravelEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: TravelMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'Travel Demo';

  const m = liveMetrics;
  const avgBooking = m ? `$${m.avgBookingValue.toFixed(0)}` : '$754';
  const rebook = m ? `${(m.rebookingRate * 100).toFixed(1)}%` : '78.9%';
  const emailOpen = m ? `${(m.emailOpenRate * 100).toFixed(1)}%` : '35.4%';
  const emailClick = m ? `${(m.emailClickRate * 100).toFixed(1)}%` : '19.9%';
  const ancillarySpend = m ? `$${m.avgAncillarySpend.toFixed(0)}` : '$256';
  const attachRate = m ? `${(m.ancillaryAttachRate * 100).toFixed(1)}%` : '71.5%';
  const reviewRating = m ? m.avgReviewRating.toFixed(2) : '3.78';
  const completionRate = m ? `${(m.bookingCompletionRate * 100).toFixed(1)}%` : '65.1%';
  const cancelRate = m ? `${(m.cancellationRate * 100).toFixed(1)}%` : '5.4%';

  const loyaltyStr = m
    ? Object.entries(m.loyaltyTierCounts).map(([tier, count]) => `${tier} (${count})`).join(', ')
    : 'Platinum (50), Gold (104), Silver (195), Member (361), None (290)';
  const cabinStr = m
    ? Object.entries(m.cabinPreferences).map(([cabin, count]) => `${cabin} (${count})`).join(', ')
    : 'Economy (526), Premium Economy (197), Business (185), First (92)';
  const churnStr = m
    ? Object.entries(m.churnRiskDistribution).map(([level, count]) => {
        const pct = ((count / m.totalGuests) * 100).toFixed(1);
        return `${pct}% ${level}`;
      }).join(', ')
    : 'Low 43.8%, Medium 35.6%, High 20.6%';
  const totalGuests = m ? m.totalGuests.toLocaleString() : '1,000';

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} guests with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${avgBooking} avg booking value, ${rebook} rebooking rate. ` +
    `Email engagement: ${emailOpen} open rate, ${emailClick} click rate. ` +
    `Ancillary revenue: ${ancillarySpend} avg purchase (${attachRate} attach rate). ` +
    `Avg review rating: ${reviewRating}/5. ` +
    `Loyalty tiers: ${loyaltyStr}. ` +
    `Preferred cabin: ${cabinStr}. ` +
    `Churn risk: ${churnStr}. ` +
    `Booking completion: ${completionRate} completed, ${cancelRate} cancelled. ` +
    `Top destinations: Cancun, Paris, Tokyo, London, Rome, Barcelona, Bali, Dubai.`;

  const sampleMetrics: Record<string, string> = {
    avgBookingValue: avgBooking,
    rebookingRate: rebook,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    avgAncillarySpend: ancillarySpend,
    ancillaryAttachRate: attachRate,
    avgReviewRating: `${reviewRating}/5`,
    totalCustomers: totalGuests,
    bookingCompletionRate: completionRate,
    cancellationRate: cancelRate,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched CPG context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildCpgEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: CpgMetrics | null
): IndustryContext {
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'CPG Demo';

  const m = liveMetrics;
  const avgBasket = m ? `$${m.avgBasketSize.toFixed(0)}` : '$34';
  const avgPurchase = m ? `$${m.avgPurchaseAmount.toFixed(2)}` : '$18.74';
  const penetration = m ? `${(m.buyerPenetration * 100).toFixed(1)}%` : '79.3%';
  const promoRate = m ? `${(m.promoRate * 100).toFixed(1)}%` : '34.9%';
  const emailOpen = m ? `${(m.emailOpenRate * 100).toFixed(1)}%` : '35.5%';
  const emailClick = m ? `${(m.emailClickRate * 100).toFixed(1)}%` : '20.5%';
  const couponRedeem = m ? `${(m.couponRedemptionRate * 100).toFixed(1)}%` : '65.8%';
  const avgDiscount = m ? `$${m.avgDiscount.toFixed(2)}` : '$5.27';
  const lapsedPct = m ? `${(m.lapsedRate * 100).toFixed(1)}%` : '21.6%';
  const csat = m ? m.avgCSAT.toFixed(2) : '3.77';
  const totalHH = m ? m.totalHouseholds.toLocaleString() : '1,000';
  const buyers = m ? m.activeBuyers.toLocaleString() : '793';

  const brandStr = m
    ? Object.entries(m.brandLoyaltyDistribution).map(([level, count]) => `${level} (${count})`).join(', ')
    : 'High (147), Medium (325), Low (328), Switcher (200)';
  const priceStr = m
    ? Object.entries(m.priceSensitivityDistribution).map(([level, count]) => {
        const pct = ((count / m.totalHouseholds) * 100).toFixed(0);
        return `${level} ${pct}%`;
      }).join(', ')
    : 'Low 20%, Medium 45%, High 35%';

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} households with ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${avgBasket} avg basket size, ${avgPurchase} avg purchase amount, ${penetration} buyer penetration (${buyers} of ${totalHH} households). ` +
    `Promotional purchases: ${promoRate} of all transactions on promotion. ` +
    `Email engagement: ${emailOpen} open rate, ${emailClick} click rate. ` +
    `Coupon performance: ${couponRedeem} redemption rate, ${avgDiscount} avg discount. ` +
    `Brand loyalty: ${brandStr}. ` +
    `Price sensitivity: ${priceStr}. ` +
    `Lapsed households: ${lapsedPct}. Avg CSAT: ${csat}/5. ` +
    `Top categories: Personal Care, Snacks, Beverages, Household, Baby Care, Pet Care.`;

  const sampleMetrics: Record<string, string> = {
    avgBasketSize: avgBasket,
    avgPurchaseAmount: avgPurchase,
    buyerPenetration: penetration,
    promoRate: promoRate,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    couponRedemptionRate: couponRedeem,
    avgDiscount: avgDiscount,
    totalHouseholds: totalHH,
    activeBuyers: buyers,
    lapsedRate: lapsedPct,
    avgCSAT: `${csat}/5`,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched automotive context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildAutomotiveEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: AutomotiveMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'Automotive Demo';

  const fallbackMetrics: AutomotiveMetrics = {
    totalOwners: 1000,
    vehicleSegmentDistribution: { Sedan: 280, SUV: 320, Truck: 180, EV: 120, Luxury: 100 },
    ownershipStatusDistribution: { Active: 650, Lease: 200, Lapsed: 150 },
    churnRiskDistribution: { Low: 400, Medium: 350, High: 250 },
    avgServiceVisitValue: 450,
    serviceRetentionRate: 0.58,
    testDriveConversionRate: 0.14,
    emailOpenRate: 0.42,
    emailClickRate: 0.18,
    avgPartsOrderValue: 285,
  };
  const m = liveMetrics || fallbackMetrics;

  const avgService = `$${m.avgServiceVisitValue.toFixed(0)}`;
  const serviceRetention = `${(m.serviceRetentionRate * 100).toFixed(1)}%`;
  const testDriveConv = `${(m.testDriveConversionRate * 100).toFixed(1)}%`;
  const emailOpen = `${(m.emailOpenRate * 100).toFixed(1)}%`;
  const emailClick = `${(m.emailClickRate * 100).toFixed(1)}%`;
  const avgParts = `$${m.avgPartsOrderValue.toFixed(0)}`;
  const totalOwners = m.totalOwners.toLocaleString();

  const vehicleStr = Object.entries(m.vehicleSegmentDistribution).map(([seg, count]) => `${seg} (${count})`).join(', ');
  const churnStr = Object.entries(m.churnRiskDistribution).map(([level, count]) => {
    const pct = ((count / m.totalOwners) * 100).toFixed(1);
    return `${pct}% ${level}`;
  }).join(', ');

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} owners with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${avgService} avg service visit, ${serviceRetention} service retention, ${testDriveConv} test drive conversion. ` +
    `Vehicle segments: ${vehicleStr}. ` +
    `Churn risk: ${churnStr}. ` +
    `Email engagement: ${emailOpen} open rate, ${emailClick} click rate. ` +
    `Parts: ${avgParts} avg order value.`;

  const sampleMetrics: Record<string, string> = {
    avgServiceVisitValue: avgService,
    serviceRetentionRate: serviceRetention,
    testDriveConversionRate: testDriveConv,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    avgPartsOrderValue: avgParts,
    totalOwners: totalOwners,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched media context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildMediaEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: MediaMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'Media Demo';

  const fallbackMetrics: MediaMetrics = {
    totalSubscribers: 1000,
    subscriptionPlanDistribution: { Free: 400, Basic: 250, Premium: 200, Enterprise: 150 },
    subscriptionStatusDistribution: { Active: 700, Cancelled: 150, Trial: 150 },
    churnRiskDistribution: { Low: 450, Medium: 320, High: 230 },
    avgContentPlaysPerUser: 12,
    avgSessionDuration: 42,
    premiumUpgradeRate: 0.042,
    emailOpenRate: 0.43,
    emailClickRate: 0.20,
    avgAdRevenue: 0.85,
    avgRating: 3.8,
  };
  const m = liveMetrics || fallbackMetrics;

  const contentPlays = m.avgContentPlaysPerUser.toFixed(1);
  const sessionDur = `${m.avgSessionDuration.toFixed(0)} min`;
  const premiumUpgrade = `${(m.premiumUpgradeRate * 100).toFixed(1)}%`;
  const emailOpen = `${(m.emailOpenRate * 100).toFixed(1)}%`;
  const emailClick = `${(m.emailClickRate * 100).toFixed(1)}%`;
  const adRev = `$${m.avgAdRevenue.toFixed(2)}`;
  const rating = m.avgRating.toFixed(1);
  const totalSubs = m.totalSubscribers.toLocaleString();

  const planStr = Object.entries(m.subscriptionPlanDistribution).map(([plan, count]) => `${plan} (${count})`).join(', ');

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} subscribers with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${contentPlays} avg content plays/user, ${sessionDur} avg session, ${premiumUpgrade} premium upgrade rate. ` +
    `Plans: ${planStr}. ` +
    `Email: ${emailOpen} open, ${emailClick} click. ` +
    `Avg ad revenue: ${adRev}/impression. Avg rating: ${rating}/5.`;

  const sampleMetrics: Record<string, string> = {
    avgContentPlaysPerUser: contentPlays,
    avgSessionDuration: sessionDur,
    premiumUpgradeRate: premiumUpgrade,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    avgAdRevenue: adRev,
    avgRating: `${rating}/5`,
    totalSubscribers: totalSubs,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched D2C context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildD2cEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: D2cMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'D2C Demo';

  const fallbackMetrics: D2cMetrics = {
    totalCustomers: 1000,
    customerSegmentDistribution: { VIP: 100, Regular: 400, New: 250, Lapsed: 250 },
    churnRiskDistribution: { Low: 380, Medium: 350, High: 270 },
    avgOrderValue: 65,
    repeatPurchaseRate: 0.28,
    avgLifetimeValue: 195,
    signupChannelDistribution: { Website: 400, Social: 250, Referral: 200, Paid: 150 },
    emailOpenRate: 0.36,
    emailClickRate: 0.20,
    socialEngagementRate: 0.15,
    returnRate: 0.08,
  };
  const m = liveMetrics || fallbackMetrics;

  const aov = `$${m.avgOrderValue.toFixed(0)}`;
  const repeatRate = `${(m.repeatPurchaseRate * 100).toFixed(1)}%`;
  const clv = `$${m.avgLifetimeValue.toFixed(0)}`;
  const emailOpen = `${(m.emailOpenRate * 100).toFixed(1)}%`;
  const emailClick = `${(m.emailClickRate * 100).toFixed(1)}%`;
  const socialEng = `${(m.socialEngagementRate * 100).toFixed(1)}%`;
  const returnRt = `${(m.returnRate * 100).toFixed(1)}%`;
  const totalCust = m.totalCustomers.toLocaleString();

  const segStr = Object.entries(m.customerSegmentDistribution).map(([seg, count]) => `${seg} (${count})`).join(', ');
  const signupStr = Object.entries(m.signupChannelDistribution).map(([ch, count]) => `${ch} (${count})`).join(', ');

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} customers with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${aov} AOV, ${repeatRate} repeat purchase rate, ${clv} CLV. ` +
    `Segments: ${segStr}. ` +
    `Channels: ${signupStr}. ` +
    `Email: ${emailOpen} open, ${emailClick} click. Social engagement: ${socialEng}. Returns: ${returnRt}.`;

  const sampleMetrics: Record<string, string> = {
    avgOrderValue: aov,
    repeatPurchaseRate: repeatRate,
    avgLifetimeValue: clv,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    socialEngagementRate: socialEng,
    returnRate: returnRt,
    totalCustomers: totalCust,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched B2B tech context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildB2btechEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: B2btechMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'B2B Tech Demo';

  const fallbackMetrics: B2btechMetrics = {
    totalAccounts: 1000,
    accountStatusDistribution: { Active: 600, Trial: 150, Churned: 100, Prospect: 150 },
    companySizeDistribution: { Enterprise: 200, 'Mid-Market': 350, SMB: 300, Startup: 150 },
    churnRiskDistribution: { Low: 450, Medium: 320, High: 230 },
    avgHealthScore: 74,
    expansionPotentialDistribution: { High: 250, Medium: 400, Low: 350 },
    avgDealAmount: 85000,
    emailOpenRate: 0.30,
    emailClickRate: 0.20,
    avgProductUsageCount: 8.5,
    eventAttendanceRate: 0.30,
  };
  const m = liveMetrics || fallbackMetrics;

  const healthScore = m.avgHealthScore.toFixed(0);
  const avgDeal = `$${(m.avgDealAmount / 1000).toFixed(0)}K`;
  const emailOpen = `${(m.emailOpenRate * 100).toFixed(1)}%`;
  const emailClick = `${(m.emailClickRate * 100).toFixed(1)}%`;
  const prodUsage = m.avgProductUsageCount.toFixed(1);
  const eventAtt = `${(m.eventAttendanceRate * 100).toFixed(1)}%`;
  const totalAccts = m.totalAccounts.toLocaleString();

  const statusStr = Object.entries(m.accountStatusDistribution).map(([s, count]) => `${s} (${count})`).join(', ');
  const sizeStr = Object.entries(m.companySizeDistribution).map(([s, count]) => `${s} (${count})`).join(', ');

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} accounts with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${healthScore}/100 avg health score, ${avgDeal} avg deal, ${eventAtt} event attendance. ` +
    `Account status: ${statusStr}. ` +
    `Company size: ${sizeStr}. ` +
    `Email: ${emailOpen} open, ${emailClick} click. Avg product usage: ${prodUsage} sessions.`;

  const sampleMetrics: Record<string, string> = {
    avgHealthScore: `${healthScore}/100`,
    avgDealAmount: avgDeal,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    avgProductUsageCount: prodUsage,
    eventAttendanceRate: eventAtt,
    totalAccounts: totalAccts,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched financial context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildFinancialEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: FinancialMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'Financial Demo';

  const fallbackMetrics: FinancialMetrics = {
    totalClients: 1000,
    primaryProductDistribution: { Checking: 350, Savings: 250, 'Credit Card': 200, Mortgage: 100, Investment: 100 },
    incomeBracketDistribution: { '<50K': 200, '50K-100K': 350, '100K-200K': 300, '>200K': 150 },
    churnRiskDistribution: { Low: 400, Medium: 350, High: 250 },
    avgAum: 385000,
    advisorAssignedRate: 0.37,
    avgTransactionAmount: 1250,
    emailOpenRate: 0.36,
    emailClickRate: 0.24,
    digitalEngagementRate: 0.61,
    avgSatisfactionScore: 3.8,
  };
  const m = liveMetrics || fallbackMetrics;

  const avgAum = `$${(m.avgAum / 1000).toFixed(0)}K`;
  const advisorRate = `${(m.advisorAssignedRate * 100).toFixed(1)}%`;
  const avgTxn = `$${m.avgTransactionAmount.toLocaleString()}`;
  const emailOpen = `${(m.emailOpenRate * 100).toFixed(1)}%`;
  const emailClick = `${(m.emailClickRate * 100).toFixed(1)}%`;
  const digitalEng = `${(m.digitalEngagementRate * 100).toFixed(1)}%`;
  const satScore = m.avgSatisfactionScore.toFixed(1);
  const totalClients = m.totalClients.toLocaleString();

  const productStr = Object.entries(m.primaryProductDistribution).map(([p, count]) => `${p} (${count})`).join(', ');
  const incomeStr = Object.entries(m.incomeBracketDistribution).map(([b, count]) => `${b} (${count})`).join(', ');

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} clients with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${avgAum} avg AUM, ${advisorRate} advisor-assigned, ${avgTxn} avg transaction. ` +
    `Products: ${productStr}. ` +
    `Income: ${incomeStr}. ` +
    `Email: ${emailOpen} open, ${emailClick} click. Digital engagement: ${digitalEng}. Satisfaction: ${satScore}/5.`;

  const sampleMetrics: Record<string, string> = {
    avgAum: avgAum,
    advisorAssignedRate: advisorRate,
    avgTransactionAmount: avgTxn,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    digitalEngagementRate: digitalEng,
    avgSatisfactionScore: `${satScore}/5`,
    totalClients: totalClients,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Builds enriched healthcare context with live CDP data and real metrics.
 * Uses Chat API live metrics when available, falls back to hardcoded.
 */
function buildHealthcareEnrichedContext(
  detail: ParentSegmentDetail | null,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[],
  liveMetrics: HealthcareMetrics | null
): IndustryContext {
  const attrGroupNames = detail ? detail.attributeGroups.map(g => g.groupName).join(', ') : '';
  const behaviorNames = detail ? detail.behaviors.map(b => b.name).join(', ') : '';
  const populationStr = detail?.population != null ? String(detail.population) : 'unknown';
  const audienceName = detail?.name || 'Healthcare Demo';

  const fallbackMetrics: HealthcareMetrics = {
    totalPatients: 1000,
    engagementScoreDistribution: { High: 250, Medium: 400, Low: 350 },
    insuranceTypeDistribution: { Commercial: 400, Medicare: 250, Medicaid: 200, Self: 150 },
    avgChronicConditionCount: 2.1,
    appointmentCompletionRate: 0.82,
    avgAppointmentsPerPatient: 3.2,
    emailOpenRate: 0.30,
    emailClickRate: 0.26,
    portalAdoptionRate: 0.61,
    avgRiskScore: 4.8,
    adherenceRate: 0.55,
  };
  const m = liveMetrics || fallbackMetrics;

  const apptCompletion = `${(m.appointmentCompletionRate * 100).toFixed(1)}%`;
  const avgVisits = m.avgAppointmentsPerPatient.toFixed(1);
  const emailOpen = `${(m.emailOpenRate * 100).toFixed(1)}%`;
  const emailClick = `${(m.emailClickRate * 100).toFixed(1)}%`;
  const portalAdopt = `${(m.portalAdoptionRate * 100).toFixed(1)}%`;
  const riskScore = m.avgRiskScore.toFixed(1);
  const adherence = `${(m.adherenceRate * 100).toFixed(1)}%`;
  const chronicCount = m.avgChronicConditionCount.toFixed(1);
  const totalPatients = m.totalPatients.toLocaleString();

  const insuranceStr = Object.entries(m.insuranceTypeDistribution).map(([t, count]) => `${t} (${count})`).join(', ');
  const engagementStr = Object.entries(m.engagementScoreDistribution).map(([level, count]) => `${level} (${count})`).join(', ');

  const dataSource = liveMetrics ? 'live data' : 'sample data';
  const cdpInfo = detail
    ? `The audience includes ${populationStr} patients with ${detail.attributeGroups.length} attribute groups (${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). `
    : '';

  const sampleDataContext =
    `This analysis uses ${dataSource} from the ${audienceName} CDP audience (Treasure Data). ` +
    cdpInfo +
    `Key metrics: ${apptCompletion} appointment completion, ${avgVisits} avg visits/year, ${portalAdopt} portal adoption. ` +
    `Insurance: ${insuranceStr}. ` +
    `Engagement: ${engagementStr}. ` +
    `Email: ${emailOpen} open, ${emailClick} click. Risk score: ${riskScore}/10. Adherence: ${adherence}. Avg chronic conditions: ${chronicCount}.`;

  const sampleMetrics: Record<string, string> = {
    appointmentCompletionRate: apptCompletion,
    avgAppointmentsPerPatient: avgVisits,
    emailOpenRate: emailOpen,
    emailClickRate: emailClick,
    portalAdoptionRate: portalAdopt,
    avgRiskScore: riskScore,
    adherenceRate: adherence,
    avgChronicConditionCount: chronicCount,
    totalPatients: totalPatients,
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}

/**
 * Derives channel preferences from consent-related attributes in the CDP data.
 * Falls back to the base context's channel preferences if no consent group found.
 */
function deriveChannelPreferences(detail: ParentSegmentDetail, baseContext: IndustryContext): string[] {
  const consentGroup = detail.attributeGroups.find(
    g => g.groupName.toLowerCase().includes('consent')
  );

  if (!consentGroup || consentGroup.attributes.length === 0) {
    return baseContext.channelPreferences;
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

  return channels.length > 0 ? channels : baseContext.channelPreferences;
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

/**
 * Fetch live travel metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveTravelMetrics(): Promise<TravelMetrics | null> {
  try {
    const result = await fetchTravelMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live travel metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live travel metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live travel metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live CPG metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveCpgMetrics(): Promise<CpgMetrics | null> {
  try {
    const result = await fetchCpgMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live CPG metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live CPG metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live CPG metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live automotive metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveAutomotiveMetrics(): Promise<AutomotiveMetrics | null> {
  try {
    const result = await fetchAutomotiveMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live automotive metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live automotive metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live automotive metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live media metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveMediaMetrics(): Promise<MediaMetrics | null> {
  try {
    const result = await fetchMediaMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live media metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live media metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live media metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live D2C metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveD2cMetrics(): Promise<D2cMetrics | null> {
  try {
    const result = await fetchD2cMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live D2C metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live D2C metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live D2C metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live B2B tech metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveB2btechMetrics(): Promise<B2btechMetrics | null> {
  try {
    const result = await fetchB2btechMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live B2B tech metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live B2B tech metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live B2B tech metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live financial metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveFinancialMetrics(): Promise<FinancialMetrics | null> {
  try {
    const result = await fetchFinancialMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live financial metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live financial metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live financial metrics fetch error, using hardcoded');
    return null;
  }
}

/**
 * Fetch live healthcare metrics from the database via Chat API + PlazmaQueryTool.
 * Returns null on failure (caller falls back to hardcoded metrics).
 */
async function fetchLiveHealthcareMetrics(): Promise<HealthcareMetrics | null> {
  try {
    const result = await fetchHealthcareMetrics();
    if (result.success && result.data) {
      console.log('[EC] Live healthcare metrics fetched successfully');
      return result.data;
    }
    console.warn('[EC] Live healthcare metrics fetch failed, using hardcoded:', result.error);
    return null;
  } catch {
    console.warn('[EC] Live healthcare metrics fetch error, using hardcoded');
    return null;
  }
}
