# Prompt: Add Chat API Live Metrics for Travel & CPG (Parity with Retail)

## Plan Summary

### 1. `src/services/llm-chat-api.ts` — Add travel & CPG metric fetchers
- Add `TravelMetrics` and `CpgMetrics` interfaces
- Add `fetchTravelMetrics()` — queries `travel_demo` tables via Chat API agent
- Add `fetchCpgMetrics()` — queries `cpg_demo` tables via Chat API agent
- Both reuse existing `createChat` / `sendMessage` / `extractJson` helpers

### 2. `src/experience-center/orchestration/industry/index.ts` — Wire into Promise.all
- Conditionally call the right fetcher per industry (retail/travel/cpg)
- Update `buildTravelEnrichedContext()` and `buildCpgEnrichedContext()` to accept live metrics with hardcoded fallback

### 3. Five skill prompt files — Add per-industry data-driven instructions
- `campaign-brief.ts`, `journey.ts`, `segment-opportunity.ts`, `performance-analysis.ts`, `insight-summary.ts`
- Each gets travel-specific and CPG-specific `dataInstructions` blocks (same pattern as existing retail ones)

### 4. No changes to
- `executeSkill.ts`, `cdp-api.ts`, `buildSkillRequest.ts`, `travel.ts`, `cpg.ts`, `retail.ts`

**Files touched:** 7 | **Build + test, then amend commit + force push to PR #24.**

---

## Context

PR #23 added **runtime metric fetching** for Retail via the TD Chat API (`llm-api`). An AI agent
with PlazmaQueryTool runs Trino queries against `retail_demo` and returns live metrics as JSON.
These metrics are injected into the LLM prompt instead of hardcoded values.

Travel and CPG currently use **hardcoded metrics** (queried once at build time). This prompt
brings them to parity with Retail: runtime Chat API queries + data-driven skill prompts.

### How the Retail Chat API Pattern Works

1. `llm-chat-api.ts` → `fetchRetailMetrics()` creates a chat session with agent `019d4bda-cc70-7487-ad61-2876eed21ed0`
2. Sends a natural language query asking the agent to join tables and return structured JSON
3. Agent uses PlazmaQueryTool to run Trino SQL, returns metrics as JSON in SSE stream
4. Metrics are parsed into a typed `RetailMetrics` interface
5. `industry/index.ts` calls this in `Promise.all` alongside CDP fetch and child segments
6. `buildRetailEnrichedContext()` uses live metrics if available, hardcoded fallback if not
7. Skill prompt files detect `isLive` and inject retail-specific data-driven instructions

---

## What Needs to Change

### 1. `src/services/llm-chat-api.ts` — Add Travel & CPG metric fetchers

**Add `TravelMetrics` interface:**
```ts
export interface TravelMetrics {
  totalGuests: number;
  avgBookingValue: number;
  rebookingRate: number;
  loyaltyTierCounts: Record<string, number>;
  cabinPreferences: Record<string, number>;
  churnRiskDistribution: Record<string, number>;
  emailOpenRate: number;
  emailClickRate: number;
  avgAncillarySpend: number;
  ancillaryAttachRate: number;
  avgReviewRating: number;
  bookingCompletionRate: number;
  cancellationRate: number;
}
```

**Add `fetchTravelMetrics()` function:**
- Uses the same `createChat` / `sendMessage` / `extractJson` helpers (already exist)
- Same agent ID: `019d4bda-cc70-7487-ad61-2876eed21ed0`
- Query prompt: Ask the agent to query `travel_demo` tables:
  - `master_customers`: COUNT, loyalty_tier distribution, preferred_cabin distribution, churn_risk distribution
  - `bookings`: AVG amount, rebooking rate (customers with >1 booking / total), booking_status distribution
  - `email_events`: open rate (Opened/Sent), click rate (Clicked/Sent)
  - `ancillary_purchases`: AVG amount, unique purchasers / total guests
  - `reviews`: AVG rating
- Return as single JSON with exact keys matching the interface
- Parse into `TravelMetrics`, return `{ success, data?, error? }`

**Add `CpgMetrics` interface:**
```ts
export interface CpgMetrics {
  totalHouseholds: number;
  avgBasketSize: number;
  avgPurchaseAmount: number;
  activeBuyers: number;
  buyerPenetration: number;
  brandLoyaltyDistribution: Record<string, number>;
  priceSensitivityDistribution: Record<string, number>;
  promoRate: number;
  couponRedemptionRate: number;
  avgDiscount: number;
  emailOpenRate: number;
  emailClickRate: number;
  lapsedRate: number;
  avgCSAT: number;
}
```

**Add `fetchCpgMetrics()` function:**
- Same pattern as above
- Query `cpg_demo` tables:
  - `master_customers`: COUNT, AVG avg_basket_size, brand_loyalty distribution, price_sensitivity distribution, lapsed percentage
  - `purchases`: AVG amount, COUNT DISTINCT buyers, promo percentage
  - `coupon_redemptions`: redemption rate (redeemed='Yes' / total), AVG discount_amount
  - `email_events`: open rate, click rate
  - `support_tickets`: AVG csat_score
- Parse into `CpgMetrics`

---

### 2. `src/experience-center/orchestration/industry/index.ts` — Wire into Promise.all

**Import new types and functions:**
```ts
import { fetchRetailMetrics, fetchTravelMetrics, fetchCpgMetrics } from '../../../services/llm-chat-api';
import type { RetailMetrics, TravelMetrics, CpgMetrics } from '../../../services/llm-chat-api';
```

**Update the `Promise.all` call in `resolveIndustryContext`:**

Currently:
```ts
industryId === 'retail' ? fetchLiveRetailMetrics() : Promise.resolve(null),
```

Change to:
```ts
fetchLiveMetrics(industryId),
```

**Add dispatcher function:**
```ts
async function fetchLiveMetrics(industryId: string): Promise<RetailMetrics | TravelMetrics | CpgMetrics | null> {
  if (industryId === 'retail') return fetchLiveRetailMetrics();
  if (industryId === 'travel') return fetchLiveTravelMetrics();
  if (industryId === 'cpg') return fetchLiveCpgMetrics();
  return null;
}
```

**Add `fetchLiveTravelMetrics()` and `fetchLiveCpgMetrics()`** — same wrapper pattern as
`fetchLiveRetailMetrics()` (try/catch, log, return null on failure).

**Update `buildTravelEnrichedContext()`:**
- Accept `liveMetrics: TravelMetrics | null` as 5th parameter
- If `liveMetrics` exists, use dynamic values for `sampleDataContext` and `sampleMetrics`
- If null, fall back to current hardcoded strings
- Follow exact same pattern as `buildRetailEnrichedContext`

**Update `buildCpgEnrichedContext()`:**
- Same pattern — accept `liveMetrics: CpgMetrics | null`
- Dynamic values when available, hardcoded fallback when not

---

### 3. Skill prompt files — Add per-industry data-driven instructions

Each skill file currently has:
```ts
const isLive = industry.sampleDataContext.includes('live data from');
```
and retail-specific `dataInstructions`. Extend to detect industry and provide industry-specific instructions.

**Pattern for each file:**

```ts
const isLive = industry.sampleDataContext.includes('live data from');
const dataLabel = isLive ? 'Live CDP Data' : 'Sample Data';

let dataInstructions = '';
if (isLive) {
  if (industry.id === 'retail') {
    dataInstructions = `\n\n### Data-Driven Requirements\n- Reference $X avg order value...`;
  } else if (industry.id === 'travel') {
    dataInstructions = `\n\n### Data-Driven Requirements\n- Reference $754 avg booking value...`;
  } else if (industry.id === 'cpg') {
    dataInstructions = `\n\n### Data-Driven Requirements\n- Reference $34 avg basket size...`;
  }
}
```

**Files and their travel/CPG instructions:**

#### `campaign-brief.ts`
Travel:
- Define target audience using real loyalty tier distribution (Platinum 50, Gold 104, Silver 195, Member 361)
- Use actual rebooking rate (78.9%) to frame re-engagement urgency
- Reference email engagement (35.4% open, 19.9% click) for channel strategy
- Use cabin preference data (Economy 526, Business 185, First 92) for segmentation
- Ground budget allocation in real ancillary attach rate (71.5%) for upsell campaigns
- Reference churn risk (20.6% High) for retention campaign priorities

CPG:
- Define target audience using brand loyalty distribution (High 147, Medium 325, Low 328, Switcher 200)
- Use actual coupon redemption rate (65.8%) to frame promotional strategy
- Reference buyer penetration (79.3%) and lapsed rate (21.6%) for acquisition vs retention balance
- Use promo purchase rate (34.9%) to inform offer strategy
- Ground channel strategy in email performance (35.5% open, 20.5% click)
- Reference price sensitivity distribution (Low 20%, Medium 45%, High 35%) for pricing strategy

#### `journey.ts`
Travel:
- Use rebooking rate (78.9%) when designing re-engagement triggers
- Reference churn risk (20.6% High, 35.6% Medium) to set journey urgency
- Design channel mix based on email performance (35.4% open, 19.9% click)
- Use loyalty tiers as journey entry/exit criteria
- Reference ancillary attach rate (71.5%) for upsell journey stages
- Ground wait times in booking lead time patterns

CPG:
- Use lapsed rate (21.6%) to trigger win-back journeys
- Reference coupon redemption rate (65.8%) for promotional journey stages
- Design replenishment triggers using purchase frequency patterns
- Use brand loyalty levels as journey branching criteria
- Reference CSAT (3.77/5) for post-purchase satisfaction touchpoints
- Ground channel mix in email engagement (35.5% open, 20.5% click)

#### `segment-opportunity.ts`
Travel:
- Use real loyalty tier sizes (Platinum 50, Gold 104, Silver 195, Member 361, None 290) for segment sizing
- Ground opportunity scores in rebooking rate, churn risk, and booking value
- Reference cabin preferences (Economy 526, Premium Economy 197, Business 185, First 92) for premium segmentation
- Cite booking completion (65.1%) and cancellation (5.4%) for behavioral segments
- Use ancillary purchaser count (715 of 1,000) for cross-sell segments

CPG:
- Use brand loyalty distribution (High/Medium/Low/Switcher) for loyalty-based segments
- Reference price sensitivity (Low 20%, Medium 45%, High 35%) for value-based segmentation
- Cite buyer penetration (793 of 1,000) and lapsed rate (21.6%) for lifecycle segments
- Use promo rate (34.9%) for deal-sensitivity segments
- Reference coupon redeemer count (707) for promotional responsiveness segments

#### `performance-analysis.ts`
Travel:
- Use email rates (35.4% open, 19.9% click) as channel performance baselines
- Compare booking completion (65.1%) vs cancellation (5.4%) for conversion analysis
- Reference ancillary revenue ($256 avg) as upsell performance indicator
- Use churn risk distribution for retention performance diagnosis
- Cite review rating (3.78/5) for guest satisfaction performance
- Ground optimization recommendations in rebooking rate (78.9%)

CPG:
- Use promo rate (34.9%) and coupon redemption (65.8%) as promotion performance baselines
- Reference avg basket ($34) vs avg purchase ($18.74) for basket composition analysis
- Use brand loyalty distribution for brand health performance
- Cite lapsed rate (21.6%) as retention performance concern
- Reference CSAT (3.77/5) for customer satisfaction diagnosis
- Ground recommendations in buyer penetration (79.3%) and email rates

#### `insight-summary.ts`
Travel:
- Surface gap between rebooking rate (78.9%) and churn risk (20.6% High) as an insight
- Reference ancillary attach rate (71.5%) as a revenue opportunity pattern
- Use loyalty tier distribution to identify tier migration opportunities
- Cite email click rate (19.9%) vs open rate (35.4%) for engagement gap insights
- Compare cabin preferences to loyalty tiers for premium conversion patterns
- Present review rating (3.78/5) trends as satisfaction signals

CPG:
- Surface gap between buyer penetration (79.3%) and brand loyalty High (14.7%) as a loyalty conversion opportunity
- Reference coupon redemption (65.8%) vs promo rate (34.9%) for promotional efficiency insights
- Use price sensitivity distribution to identify premium migration opportunities
- Cite lapsed rate (21.6%) alongside brand switcher rate (20%) for at-risk patterns
- Compare email engagement to coupon source distribution for channel effectiveness
- Present CSAT (3.77/5) alongside support category distribution for VoC insights

---

### 4. No changes needed to:
- `executeSkill.ts` — PS ID map already has all 3 industries
- `cdp-api.ts` — unchanged
- `buildSkillRequest.ts` — `LIVE_DATA_INSTRUCTIONS` block is generic enough; per-skill instructions handle specifics
- `travel.ts`, `cpg.ts` — hardcoded fallbacks stay as-is
- `retail.ts` — unchanged

---

## Files to Change (4)

1. `src/services/llm-chat-api.ts` — add interfaces + fetchTravelMetrics + fetchCpgMetrics
2. `src/experience-center/orchestration/industry/index.ts` — wire into Promise.all, update builders
3. `src/experience-center/orchestration/skills/campaign-brief.ts` — add travel/CPG instructions
4. `src/experience-center/orchestration/skills/journey.ts` — add travel/CPG instructions
5. `src/experience-center/orchestration/skills/segment-opportunity.ts` — add travel/CPG instructions
6. `src/experience-center/orchestration/skills/performance-analysis.ts` — add travel/CPG instructions
7. `src/experience-center/orchestration/skills/insight-summary.ts` — add travel/CPG instructions

---

## Definition of Done

- Running a Travel scenario → console shows `[llm-chat-api] Creating chat session` → `Metrics parsed`
- Running a CPG scenario → same Chat API logs
- Travel LLM output references real queried metrics (not hardcoded $754 / 78.9%)
- CPG LLM output references real queried metrics (not hardcoded $34 / 65.8%)
- Retail continues working unchanged
- Chat API failure for any industry → graceful fallback to hardcoded metrics
- `npm run build` passes
