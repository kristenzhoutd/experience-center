# Prompt: Wire Live Travel Demo Segments into LLM Prompts

## Context

The Experience Center already enriches **Retail** scenarios with live CDP data (PR #22). This
prompt extends the same pattern to **Travel & Hospitality**.

The hardcoded travel context lives in:

```
src/experience-center/orchestration/industry/travel.ts
```

There is a **live Travel Demo parent segment** (`id: 1313380`) on account `13232/us01` with real
attributes, behaviors, and child segments. We want to enrich the LLM prompt with this live data
when a TDX API key is configured, while gracefully falling back to the hardcoded data when it
isn't.

---

## What the Live CDP Data Looks Like

The `Travel Demo` parent segment (`id: 1313380`) has:

**Master Table:** `travel_demo.master_customers` (1,000 profiles)

Columns: customer_id, email, first_name, last_name, age, home_city, loyalty_tier,
total_miles_points, preferred_cabin, total_lifetime_bookings, churn_risk

**Attributes (grouped):**
- Loyalty Account: Loyalty ID, Tier Status, Points Balance, Points Expiry Date, Tier Qualification Date

**Behaviors (event tables):**
- Bookings (booking_id, booking_type, destination, amount, booking_status, booking_channel) — 2,451 events
- Email Events (campaign_id, event_type, campaign_name) — 7,761 events
- Ancillary Purchases (purchase_id, item_type, amount, associated_booking_id) — 1,443 events
- Reviews (review_id, rating, sentiment, category) — 1,078 events

**Child Segments (6):**
Elite Travelers, Lapsed Bookers, Seasonal Travelers, Business Travelers, Upgrade Candidates, New Guests

**Total:** 6 tables, 14,443 rows

---

## Real Metrics (Queried from travel_demo)

| Metric | Value |
|--------|-------|
| Avg booking value | $754 |
| Rebooking rate | 78.9% |
| Unique bookers | 793 / 1,000 (79.3%) |
| Email open rate | 35.4% |
| Email click rate | 19.9% |
| Avg ancillary spend | $256 |
| Ancillary attach rate | 71.5% |
| Avg review rating | 3.78 / 5 |
| Loyalty members | 710 (71%) |
| Churn risk: High / Medium / Low | 20.6% / 35.6% / 43.8% |
| Booking completion rate | 65.1% |
| Cancellation rate | 5.4% |
| Loyalty tiers | Platinum 50, Gold 104, Silver 195, Member 361, None 290 |
| Preferred cabin | Economy 526, Premium Economy 197, Business 185, First 92 |

---

## What Needs to Change

### 1. Update `executeSkill.ts` — Add travel to PS ID defaults

Replace the single retail default with a map:

```ts
const defaultParentSegments: Record<string, string> = {
  retail: '1312648',  // Retail Demo on us01:13232
  travel: '1313380',  // Travel Demo on us01:13232
};
if (!parentSegmentId && import.meta.env.VITE_SANDBOX_API_KEY) {
  parentSegmentId = defaultParentSegments[scenarioConfig.industry] ?? null;
}
```

### 2. Update `industry/index.ts` — Support travel enrichment

**Guard change:** From `industryId !== 'retail'` to `!['retail', 'travel'].includes(industryId)`

**Extract:** Move current retail enrichment into `buildRetailEnrichedContext()`.

**Add:** `buildTravelEnrichedContext()` with real metrics:

```ts
function buildTravelEnrichedContext(
  detail: ParentSegmentDetail,
  baseContext: IndustryContext,
  sampleSegments: IndustryContext['sampleSegments'],
  channelPreferences: string[]
): IndustryContext {
  const attrGroupNames = detail.attributeGroups.map(g => g.groupName).join(', ');
  const behaviorNames = detail.behaviors.map(b => b.name).join(', ');
  const populationStr = detail.population != null ? String(detail.population) : 'unknown';

  const sampleDataContext =
    `This analysis uses live data from the ${detail.name} CDP audience (Treasure Data). ` +
    `The audience includes ${populationStr} guests with ${detail.attributeGroups.length} attribute groups ` +
    `(${attrGroupNames}) and ${detail.behaviors.length} behavioral data sources (${behaviorNames}). ` +
    `Key metrics: $754 avg booking value, 78.9% rebooking rate, 793 unique bookers out of 1,000 guests. ` +
    `Email engagement: 35.4% open rate, 19.9% click rate. ` +
    `Ancillary revenue: $256 avg purchase across 715 purchasers (71.5% attach rate). ` +
    `Avg review rating: 3.78/5 from 728 reviewers. ` +
    `Loyalty tiers: Platinum (50), Gold (104), Silver (195), Member (361), None (290). ` +
    `Preferred cabin: Economy (526), Premium Economy (197), Business (185), First (92). ` +
    `Churn risk: Low 43.8%, Medium 35.6%, High 20.6%. ` +
    `Booking completion: 65.1% completed, 24.9% confirmed, 5.4% cancelled, 4.7% no-show. ` +
    `Top destinations: Cancun, Paris, Tokyo, London, Rome, Barcelona, Bali, Dubai.`;

  const sampleMetrics: Record<string, string> = {
    avgBookingValue: '$754',
    rebookingRate: '78.9%',
    uniqueBookers: '793',
    totalBookings: '2,451',
    emailOpenRate: '35.4%',
    emailClickRate: '19.9%',
    avgAncillarySpend: '$256',
    ancillaryAttachRate: '71.5%',
    avgReviewRating: '3.78/5',
    totalCustomers: '1,000',
    loyaltyMembers: '710',
    loyaltyOptInRate: '71%',
    churnRiskHigh: '20.6%',
    churnRiskMedium: '35.6%',
    churnRiskLow: '43.8%',
    bookingCompletionRate: '65.1%',
    cancellationRate: '5.4%',
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

**Generalize:** `deriveChannelPreferences(detail, baseContext)` — accepts `baseContext` param
instead of hardcoding `retailContext` for the fallback.

### 3. No changes needed to:

- `resolveScenario.ts` — already async, already passes parentSegmentId
- `cdp-api.ts` — already has `fetchParentSegmentDetail` and `fetchChildSegments`
- `travel.ts` — hardcoded fallback stays as-is

---

## Behaviour Requirements

1. **Graceful fallback**: If the CDP fetch fails for any reason, silently fall back to hardcoded
   `travelContext`. Never block scenario execution.
2. **Retail + Travel**: Both industries now enrich with live data. CPG continues hardcoded.
3. **Child segments**: Only use live child segments if there are 2+ with real names.
4. **No UI changes**: Purely a data layer change.
5. **No new dependencies**: Uses existing `fetch`-based CDP client.

---

## Files Changed (in order)

1. `src/experience-center/orchestration/executeSkill.ts` — PS ID defaults map
2. `src/experience-center/orchestration/industry/index.ts` — guard, extract, add travel enrichment

---

## Definition of Done

- Running a Travel scenario with `VITE_SANDBOX_API_KEY` set auto-defaults to parent segment
  `1313380` and the LLM prompt includes live CDP context
- Browser console shows `[EC] CDP fetch succeeded`
- LLM output references real metrics ($754 AOV, 78.9% rebooking — not old $680 / 38%)
- Retail scenarios continue working unchanged (PS `1312648`)
- CPG scenarios unaffected
- A simulated CDP fetch failure falls back silently to hardcoded `travelContext`
- `npm run build` passes
