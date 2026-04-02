# Prompt: Wire Live CPG Demo Segments into LLM Prompts

## Context

The Experience Center already enriches **Retail** (PR #22) and **Travel** scenarios with live CDP
data. This prompt extends the same pattern to **CPG**.

The hardcoded CPG context lives in:

```
src/experience-center/orchestration/industry/cpg.ts
```

There is a **live CPG Demo parent segment** (`id: 1313389`) on account `13232/us01` with real
attributes, behaviors, and child segments. We want to enrich the LLM prompt with this live data
when a TDX API key is configured, while gracefully falling back to the hardcoded data when it
isn't.

---

## What the Live CDP Data Looks Like

The `CPG Demo` parent segment (`id: 1313389`) has:

**Master Table:** `cpg_demo.master_customers` (1,000 households)

Columns: customer_id, email, first_name, last_name, city, household_size, brand_loyalty,
price_sensitivity, preferred_category, preferred_retailer, avg_basket_size, total_purchases_12m,
category_share_of_wallet, lapsed

**Behaviors (event tables):**
- Purchases (transaction_id, product_category, brand, retailer_channel, amount, quantity, on_promotion) — 6,038 events
- Coupon Redemptions (coupon_id, coupon_type, source, discount_amount, redeemed) — 1,786 events
- Email Events (campaign_id, event_type, campaign_name) — 8,090 events
- Support Tickets (ticket_id, channel, category, csat_score, resolved) — 1,007 events

**Child Segments (6):**
Brand Loyalists, Cross-Category Shoppers, Lapsed Buyers, Deal Seekers, New-to-Category, Category Champions

**Total:** 5 tables, 17,921 rows

---

## Real Metrics (Queried from cpg_demo)

| Metric | Value |
|--------|-------|
| Avg basket size | $34 |
| Avg purchase amount | $18.74 |
| Buyer penetration | 79.3% (793 / 1,000) |
| Repeat purchase rate | 100% (among active buyers) |
| Category share of wallet | 29.9% |
| Promotional purchase rate | 34.9% |
| Email open rate | 35.5% |
| Email click rate | 20.5% |
| Coupon redemption rate | 65.8% |
| Avg coupon discount | $5.27 |
| Unique coupon redeemers | 707 |
| Lapsed households | 21.6% |
| Avg CSAT | 3.77 / 5 |
| Brand loyalty: High / Medium / Low / Switcher | 14.7% / 32.5% / 32.8% / 20% |
| Price sensitivity: Low / Medium / High | 20% / 45% / 35% |
| Avg household size | 2.9 |

---

## What Needs to Change

### 1. Update `executeSkill.ts` — Add CPG to PS ID defaults

Add CPG to the existing map:

```ts
const defaultParentSegments: Record<string, string> = {
  retail: '1312648',  // Retail Demo on us01:13232
  travel: '1313380',  // Travel Demo on us01:13232
  cpg: '1313389',     // CPG Demo on us01:13232
};
```

### 2. Update `industry/index.ts` — Support CPG enrichment

**Guard change:** From `!['retail', 'travel'].includes(industryId)` to `!['retail', 'travel', 'cpg'].includes(industryId)`

**Add:** `buildCpgEnrichedContext()` with real metrics:

```ts
function buildCpgEnrichedContext(
  detail: ParentSegmentDetail,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[]
): IndustryContext {
  const behaviorNames = detail.behaviors.map(b => b.name).join(', ');
  const populationStr = detail.population != null ? String(detail.population) : 'unknown';

  const sampleDataContext =
    `This analysis uses live data from the ${detail.name} CDP audience (Treasure Data). ` +
    `The audience includes ${populationStr} households with ${detail.behaviors.length} behavioral data sources (${behaviorNames}). ` +
    `Key metrics: $34 avg basket size, $18.74 avg purchase amount, 79.3% buyer penetration (793 of 1,000 households). ` +
    `Repeat purchase rate: 100% among active buyers. Category share of wallet: 29.9%. ` +
    `Promotional purchases: 34.9% of all transactions on promotion. ` +
    `Email engagement: 35.5% open rate, 20.5% click rate. ` +
    `Coupon performance: 65.8% redemption rate, $5.27 avg discount, 707 unique redeemers. ` +
    `Brand loyalty: High (147), Medium (325), Low (328), Switcher (200). ` +
    `Price sensitivity: Low 20%, Medium 45%, High 35%. ` +
    `Lapsed households: 21.6%. Avg CSAT: 3.77/5. ` +
    `Top categories: Personal Care, Snacks, Beverages, Household, Baby Care, Pet Care.`;

  const sampleMetrics: Record<string, string> = {
    avgBasketSize: '$34',
    avgPurchaseAmount: '$18.74',
    repeatPurchaseRate: '100%',
    categoryShareOfWallet: '29.9%',
    promoRate: '34.9%',
    emailOpenRate: '35.5%',
    emailClickRate: '20.5%',
    couponRedemptionRate: '65.8%',
    avgDiscount: '$5.27',
    totalHouseholds: '1,000',
    activeBuyers: '793',
    buyerPenetration: '79.3%',
    lapsedRate: '21.6%',
    avgCSAT: '3.77/5',
    brandLoyaltyHigh: '14.7%',
    brandLoyaltyMedium: '32.5%',
    brandLoyaltyLow: '32.8%',
    brandSwitchers: '20%',
  };

  return {
    ...baseContext,
    sampleSegments,
    sampleMetrics,
    channelPreferences,
    sampleDataContext,
  };
}
```

### 3. No changes needed to:

- `resolveScenario.ts` — already async, already passes parentSegmentId
- `cdp-api.ts` — already has `fetchParentSegmentDetail` and `fetchChildSegments`
- `cpg.ts` — hardcoded fallback stays as-is

---

## Behaviour Requirements

1. **Graceful fallback**: If the CDP fetch fails for any reason, silently fall back to hardcoded
   `cpgContext`. Never block scenario execution.
2. **All three industries**: Retail, Travel, and CPG now enrich with live data.
3. **Child segments**: Only use live child segments if there are 2+ with real names.
4. **No UI changes**: Purely a data layer change.
5. **No new dependencies**: Uses existing `fetch`-based CDP client.

---

## Files Changed (in order)

1. `src/experience-center/orchestration/executeSkill.ts` — PS ID defaults map
2. `src/experience-center/orchestration/industry/index.ts` — guard, add CPG enrichment

---

## Definition of Done

- Running a CPG scenario with `VITE_SANDBOX_API_KEY` set auto-defaults to parent segment
  `1313389` and the LLM prompt includes live CDP context
- Browser console shows `[EC] CDP fetch succeeded`
- LLM output references real metrics ($34 basket, 65.8% coupon redemption — not old $34/41%)
- Retail and Travel scenarios continue working unchanged
- A simulated CDP fetch failure falls back silently to hardcoded `cpgContext`
- `npm run build` passes
