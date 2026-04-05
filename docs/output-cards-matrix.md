# Output Cards Matrix — All 36 Scenarios

## Card Types (6 total)

| Card | StepType | Schema Fields | Visual |
|------|----------|---------------|--------|
| AnalysisCard | analyze | headline, findings[3], metrics[3], rationale, impactStatement | Findings + metrics + rationale + impact |
| ProfileInspectionCard | inspect | headline, profiles[3], sections[3-4], impactStatement | Profile cards + sections + impact |
| CreationCard | create | headline, sections[4-6], channels[3-5], nextSteps[3-4], impactStatement | Sections + channels + next steps + impact |
| ComparisonCard | compare | headline, options[3], metrics[3-4], impactStatement | Option grid + metrics + impact |
| OptimizationCard | optimize | headline, rationale, metrics[3-4], changes[3-5], impactStatement | Rationale + metrics + changes + impact |
| ActivationCard | activate | headline, summary, destinations[3-4], sections[2-3], impactStatement | Destinations + sections + impact (not used yet) |

---

## Step Structure (same for all 36 scenarios)

```
Step 1: step-analyze   → AnalysisCard
Step 2a: step-inspect  → ProfileInspectionCard
Step 2b: step-compare  → ComparisonCard
Step 3: step-create    → CreationCard
Step 4: step-enhance   → OptimizationCard or CreationCard*
Step 5: step-summary   → AnalysisCard

* Retention outcomes use CreationCard (journey) for Step 4
  All other outcomes use OptimizationCard for Step 4
```

---

## Typical User Paths (3-4 cards per session)

```
Path A:  Analyze → Inspect → Create → Enhance → Summary
Cards:   Analysis → Profile → Creation → Optimization → Analysis

Path B:  Analyze → Compare → Create → Summary
Cards:   Analysis → Comparison → Creation → Analysis

Path C:  Analyze → Create → Enhance → Summary
Cards:   Analysis → Creation → Optimization → Analysis
```

---

## Per-Outcome Variations

### REVENUE (9 scenarios)

| Step | StepType | Card | SkillFamily |
|------|----------|------|-------------|
| analyze | analyze | AnalysisCard | segment-opportunity |
| inspect | inspect | ProfileInspectionCard | insight-summary |
| compare | compare | ComparisonCard | performance-analysis |
| create | create | CreationCard | scenario's own* |
| enhance | optimize | OptimizationCard | performance-analysis |
| summary | analyze | AnalysisCard | insight-summary |

| Scenario | Title | Create SkillFamily |
|----------|-------|--------------------|
| rev-retail-1 | Re-engage lapsed shoppers | campaign-brief |
| rev-retail-2 | Identify high-intent browsers | segment-opportunity |
| rev-retail-3 | Build post-purchase journey | journey |
| rev-cpg-1 | Build replenishment campaign | campaign-brief |
| rev-cpg-2 | Cross-category potential | segment-opportunity |
| rev-cpg-3 | Premium upsell brief | campaign-brief |
| rev-travel-1 | Re-engage loyalty members | campaign-brief |
| rev-travel-2 | Identify premium guests | segment-opportunity |
| rev-travel-3 | Seasonal offer strategy | campaign-brief |

### CAMPAIGN PERFORMANCE (9 scenarios)

| Step | StepType | Card | SkillFamily |
|------|----------|------|-------------|
| analyze | analyze | AnalysisCard | performance-analysis |
| inspect | inspect | ProfileInspectionCard | insight-summary |
| compare | compare | ComparisonCard | performance-analysis |
| create | create | CreationCard | scenario's own* |
| enhance | optimize | OptimizationCard | performance-analysis |
| summary | analyze | AnalysisCard | insight-summary |

| Scenario | Title | Create SkillFamily |
|----------|-------|--------------------|
| perf-retail-1 | Diagnose underperforming promos | performance-analysis |
| perf-retail-2 | Refine seasonal targeting | segment-opportunity |
| perf-retail-3 | Optimize campaign timing | insight-summary |
| perf-cpg-1 | Segment-based activation | campaign-brief |
| perf-cpg-2 | Best channel mix for replenishment | performance-analysis |
| perf-cpg-3 | Diagnose performance drop | performance-analysis |
| perf-travel-1 | Optimize channel mix | performance-analysis |
| perf-travel-2 | Personalize post-booking | journey |
| perf-travel-3 | Destination content strategy | campaign-brief |

### RETENTION (9 scenarios)

| Step | StepType | Card | SkillFamily |
|------|----------|------|-------------|
| analyze | analyze | AnalysisCard | segment-opportunity |
| inspect | inspect | ProfileInspectionCard | insight-summary |
| compare | compare | ComparisonCard | performance-analysis |
| create | create | CreationCard | scenario's own* |
| enhance | **create** | **CreationCard** | **journey** |
| summary | analyze | AnalysisCard | insight-summary |

Note: Retention enhance step uses CreationCard (journey) instead of OptimizationCard.

| Scenario | Title | Create SkillFamily |
|----------|-------|--------------------|
| ret-retail-1 | Loyalty journey for repeat buyers | journey |
| ret-retail-2 | Find at-risk after 2nd purchase | segment-opportunity |
| ret-retail-3 | Win-back campaign inactive members | campaign-brief |
| ret-travel-1 | Loyalty journey high-value guests | journey |
| ret-travel-2 | At-risk travelers | segment-opportunity |
| ret-travel-3 | Tailor follow-up by trip history | campaign-brief |
| ret-cpg-1 | High-frequency buyers at risk | segment-opportunity |
| ret-cpg-2 | Loyalty journey valuable households | journey |
| ret-cpg-3 | Reactivate promo-driven buyers | campaign-brief |

### INSIGHTS (9 scenarios)

| Step | StepType | Card | SkillFamily |
|------|----------|------|-------------|
| analyze | analyze | AnalysisCard | insight-summary |
| inspect | inspect | ProfileInspectionCard | insight-summary |
| compare | compare | ComparisonCard | performance-analysis |
| create | create | CreationCard | scenario's own* |
| enhance | optimize | OptimizationCard | performance-analysis |
| summary | analyze | AnalysisCard | insight-summary |

| Scenario | Title | Create SkillFamily |
|----------|-------|--------------------|
| ins-cpg-1 | Top repeat purchase segments | insight-summary |
| ins-cpg-2 | Promotion sensitivity | insight-summary |
| ins-cpg-3 | Highest growth potential | segment-opportunity |
| ins-retail-1 | Product affinity segments | insight-summary |
| ins-retail-2 | Highest revenue per campaign | insight-summary |
| ins-retail-3 | Engagement timing patterns | insight-summary |
| ins-travel-1 | Premium upgrade potential | segment-opportunity |
| ins-travel-2 | Booking patterns by traveler | insight-summary |
| ins-travel-3 | Loyalty engagement patterns | insight-summary |

\* "scenario's own" = the skillFamily from scenarioRegistry. This is what makes each scenario's Create step unique.

---

## Card Usage Across All 36 Scenarios

| Card | Steps using it | Max per session |
|------|---------------|-----------------|
| AnalysisCard | analyze, summary | 2 |
| ProfileInspectionCard | inspect | 1 |
| ComparisonCard | compare | 1 |
| CreationCard | create, enhance (retention only) | 1-2 |
| OptimizationCard | enhance (non-retention) | 0-1 |
| ActivationCard | (none yet — reserved for Phase 2) | 0 |
