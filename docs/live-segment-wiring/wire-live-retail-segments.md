# Prompt: Wire Live Retail Demo Segments into LLM Prompts

## Context

The Experience Center currently uses **hardcoded sample data** for all scenario generation. For
the Retail industry, this is defined in:

```
src/experience-center/orchestration/industry/retail.ts
```

The `IndustryContext` object contains `sampleSegments`, `sampleMetrics`, `channelPreferences`,
and `sampleDataContext` — all static strings that get injected into every LLM prompt for Retail
scenarios.

There is a **live Retail Demo parent segment** (`id: 1312648`) on account `13232/us01` with real
attributes, behaviors, and child segments. We want to enrich the LLM prompt with this live data
when a TDX API key is configured, while gracefully falling back to the hardcoded data when it
isn't.

---

## What the Live CDP Data Looks Like

The `Retail Demo` parent segment (`id: 1312648`) has:

**Attributes (grouped):**
- Customer Profile: First Name, Last Name, Email, Phone, Age, Gender, City, State, Zip, Signup Channel
- Loyalty Program: Loyalty Tier, Points Balance, Lifetime Points, Enrollment Date, Member Status
- Product Preferences: Preferred Category, Preferred Brand, Avg Basket Size, Price Sensitivity
- Consents: Email Consent, SMS Consent, Push Consent, Direct Mail Consent
- RFM Scores: Recency Score, Frequency Score, Monetary Score, RFM Segment, Churn Risk, CLV Prediction

**Behaviors (event tables):**
- Online Purchases (order_id, order_datetime, total_amount, num_items, product_category, payment_method, coupon_code, fulfillment_status)
- In-Store Purchases (transaction_id, transaction_datetime, store_name, store_id, total_amount, product_category, payment_method)
- Website Activity (page_url, page_title, event_type, product_viewed, category_viewed, session_id, device_type)
- Cart Abandonment (cart_id, cart_total, num_items, top_product)
- Email Engagement (campaign_name, campaign_id, event_type, event_datetime, email)
- Product Returns (return_id, order_id, return_reason, return_amount)
- Customer Service (ticket_id, channel, category, priority, status, csat_score)
- Product Reviews (product_name, rating, sentiment)

**Child Segments:** VIP Loyalists, Cart Abandoners, Lapsed High-Value, Rising Potentials, Seasonal Shoppers, New Customers (+ `test` which is filtered out).

**Master Table:** `retail_demo.master_customers`

**Total Population:** 1,000 (demo dataset)

---

## CDP API Available

The app already has a working CDP API client at `src/services/cdp-api.ts` that can:
- `fetchParentSegments()` — lists all parent segments
- `fetchChildSegments(parentId)` — lists child segments

We need to **add a new function** `fetchParentSegmentDetail(parentId)` that fetches the full
parent segment detail (attributes, behaviors, population) from:

```
GET https://api-cdp.treasuredata.com/audiences/{parentId}
```

---

## What Needs to Change

### 1. Add `fetchParentSegmentDetail` to `src/services/cdp-api.ts`

Add a new exported function:

```ts
export interface ParentSegmentDetail {
  id: string;
  name: string;
  population: number | null;
  masterTable: string | null;
  attributeGroups: Array<{
    groupName: string;
    attributes: Array<{ name: string; type: string; column: string }>;
  }>;
  behaviors: Array<{
    name: string;
    fields: Array<{ name: string; type: string }>;
  }>;
}
```

Fetch `GET /audiences/{parentId}`, then map the response:
- `population` from `data.population`
- `masterTable` from `data.master.parentTableName`
- `attributeGroups`: group `data.attributes` by `groupingName`, each with `name`, `type`,
  `parentColumn` as `column`
- `behaviors`: map `data.behaviors` to `name` + `schema` fields (each with `name`, `type`)

### 2. Add `resolveIndustryContext` to `src/experience-center/orchestration/industry/index.ts`

Add a new async function that tries to enrich the base context with live CDP data:

```ts
export async function resolveIndustryContext(
  industryId: string,
  parentSegmentId?: string | null
): Promise<IndustryContext>
```

- If `industryId !== 'retail'` or no `parentSegmentId` is provided → return `getIndustryContext(industryId)` as-is (no change for CPG/Travel)
- If `industryId === 'retail'` and `parentSegmentId` is provided:
  1. Call `fetchParentSegmentDetail(parentSegmentId)`
  2. If it fails or returns no data → fall back to `retailContext` (no error thrown)
  3. If it succeeds → return an enriched `IndustryContext` that merges the live data into the
     base retail context (see Section 3 below)

### 3. Build the enriched `IndustryContext` from live CDP data

When live data is available, produce an `IndustryContext` where:

**`sampleSegments`**: Use the live child segments if there are any (mapped to `{ name, description, size, valueLevel }`). If no child segments exist (like now, with just `test`), keep the hardcoded `sampleSegments` from `retailContext` — they represent realistic demo segments. Do NOT replace with a single meaningless `test` segment.

**`sampleMetrics`**: Replace with real metrics queried from the `retail_demo` database:
- `avgOrderValueOnline`: '$396'
- `avgOrderValueInStore`: '$253'
- `repeatPurchaseRate`: '86.6%'
- `customerLifetimeValue`: '$7,589'
- `cartAbandonmentRate`: '38%'
- `avgAbandonedCartValue`: '$319'
- `emailOpenRate`: '68%'
- `emailClickThroughRate`: '29.2%'
- `conversionRate`: '3.2%'
- `totalCustomers`: '1,000'
- `onlineBuyers`: '886'
- `inStoreBuyers`: '846'
- `loyaltyMembers`: '804'
- `loyaltyOptInRate`: '80.4%'
- `churnRiskHigh`: '31.4%'
- `churnRiskMedium`: '32.4%'
- `churnRiskLow`: '36.2%'

**`channelPreferences`**: Derive from the Consents attributes available in the CDP data. The `Retail Demo` has Email, SMS, Push, and Direct Mail consents → map to `['Email', 'SMS', 'Mobile Push', 'Direct Mail', 'Web Personalization']`.

**`sampleDataContext`**: Replace with a live-data-aware string including real stats:
```
This analysis uses live data from the Retail Demo CDP audience (Treasure Data).
The audience includes {population} customers with {N} attribute groups ({attributes list}) and
{M} behavioral data sources ({behavior names}). Key metrics: $396 avg online order value,
$253 avg in-store order value, 86.6% repeat purchase rate, $7,589 avg predicted CLV, 38% cart
abandonment rate ($319 avg abandoned cart), 68% email open rate, 29.2% email CTR. Loyalty
program: 804 members across Bronze (310), Silver (246), Gold (166), Platinum (82). RFM segments:
Potential Loyalists (122), Hibernating (112), About to Sleep (105), At Risk (103), Recent
Customers (101), Promising (100), Can't Lose Them (98), Champions (95), Loyal Customers (89),
Need Attention (75). Churn risk: 36.2% Low, 32.4% Medium, 31.4% High. Top product categories:
Electronics, Beauty, Clothing, Books, Automotive.
```

**`verticalTerminology`**: Keep from `retailContext` — no change needed.

### 4. Update `resolveScenario.ts` to use the async resolver

`resolveScenario` currently calls `getIndustryContext(scenarioConfig.industry)` synchronously.
Change it to call `resolveIndustryContext` asynchronously.

The function needs to accept an optional `parentSegmentId` parameter:

```ts
export async function resolveScenario(
  scenarioConfig: ScenarioConfig,
  parentSegmentId?: string | null
): Promise<ResolvedScenario>
```

Read `parentSegmentId` from sessionStorage (`ai-suites:settings` → `selectedParentSegmentId`)
if not explicitly provided.

### 5. Update `executeScenarioSkill` in `executeSkill.ts`

`resolveScenario` is called here. Since it's now async, `await` it:

```ts
const { config, industry } = await resolveScenario(scenarioConfig);
```

Read `selectedParentSegmentId` from sessionStorage inside `executeScenarioSkill` and pass it to
`resolveScenario`. When no `selectedParentSegmentId` is set and the scenario is retail with
`VITE_SANDBOX_API_KEY` configured, default to `'1312648'` (Retail Demo on us01:13232):

```ts
const settingsJson = storage.getItem('ai-suites:settings');
const settings = settingsJson ? JSON.parse(settingsJson) : {};
let parentSegmentId: string | null = settings.selectedParentSegmentId ?? null;

// Default retail parent segment when using sandbox key and no explicit selection
if (!parentSegmentId && scenarioConfig.industry === 'retail' && import.meta.env.VITE_SANDBOX_API_KEY) {
  parentSegmentId = '1312648'; // Retail Demo on us01:13232
}

const { config, industry } = await resolveScenario(scenarioConfig, parentSegmentId);
```

---

## Settings Store

Check `src/store/` for the settings store (likely `useSettingsStore`). Confirm it already stores
`selectedParentSegmentId`. If it does, no store changes are needed — we read it directly from
sessionStorage in the orchestration layer to avoid coupling.

---

## Behaviour Requirements

1. **Graceful fallback**: If the CDP fetch fails for any reason (network error, bad key, timeout),
   silently fall back to hardcoded `retailContext`. Never block scenario execution.
2. **Retail only**: Only Retail industry enrichment is in scope for this task. CPG and Travel
   continue to use their hardcoded contexts unchanged.
3. **Child segments**: Only use live child segments if there are 2+ with real names (not just
   `test`). Otherwise keep hardcoded `sampleSegments`.
4. **No UI changes**: This is purely a data layer change. No component changes needed.
5. **No new dependencies**: Use only the existing `fetch`-based CDP client. No new packages.
6. **TypeScript strict**: All new code must be fully typed with no `any` except where the CDP API
   response is being parsed (acceptable to type as `any` at the parse boundary only).

---

## Files to Change (in order)

1. `src/services/cdp-api.ts` — add `fetchParentSegmentDetail` + `ParentSegmentDetail` interface
2. `src/experience-center/orchestration/industry/index.ts` — add `resolveIndustryContext` async function
3. `src/experience-center/orchestration/resolveScenario.ts` — make async, accept `parentSegmentId`
4. `src/experience-center/orchestration/executeSkill.ts` — `await resolveScenario`, pass `parentSegmentId`

---

## Definition of Done

- Running a Retail scenario with `VITE_SANDBOX_API_KEY` set auto-defaults to parent segment
  `1312648` and the LLM prompt includes live CDP context (attribute groups, behavior sources,
  population, real metrics, enriched `sampleDataContext`)
- Running a Retail scenario with explicit `selectedParentSegmentId` in sessionStorage uses that ID
- Running a Retail scenario with no `selectedParentSegmentId` and no `VITE_SANDBOX_API_KEY` uses
  hardcoded `retailContext`
- Running a CPG or Travel scenario is completely unaffected
- A simulated CDP fetch failure (e.g. wrong key) does not break scenario execution — it falls
  back silently
- TypeScript compiles with no errors (`npm run build` passes)
