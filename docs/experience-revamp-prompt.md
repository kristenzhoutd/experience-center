# Experience Center Revamp — Implementation Prompt

## Goal

Evolve the current Experience Center from a one-shot strategy brief generator into a multi-step, branchable AI workflow that better represents Treasure Data / Treasure Studio capabilities.

## Business Context

This is a PLG-style web experience for Treasure Data's website. No authentication required, sandbox data acceptable, guided/curated flow preferred. The key principle: **prove 10x value before a seller has to come in.**

The current flow is too limited: user selects outcome → industry → scenario → system generates one strategy brief. Users can't see what the AI analyzed, how it arrived at the output, or how real the capabilities are.

## Target Experience

Instead of: `input → one strategy brief`

We want: `input → analysis → recommendation → user choice → action → next recommendation → next user choice → cumulative outcome`

The interaction model: **AI recommends → user chooses → AI executes → AI recommends next step**

---

## Current Architecture (inspect these files as source of truth)

### Routing & Pages
- `src/App.tsx` — routes: `/experience-center` (landing), `/experience-center/workflow` (workflow page), `/settings`
- `src/pages/ExperienceCenterPage.tsx` — landing page with outcome/industry/scenario selection
- `src/pages/ExperienceCenterWorkflowPage.tsx` — workflow page with chat panel (left) + output panel (right)
- `src/components/Layout.tsx` — shared layout, conditionally hides nav on workflow page

### State Management
- `src/stores/experienceLabStore.ts` — Zustand store with: goal, industry, scenario, inputs, currentStep (`'industry' | 'scenario' | 'inputs' | 'generating' | 'output'`), output (OutputData), and 16 actions
- **OutputData shape**: summaryBanner, executiveSummary, audienceCards[], channelStrategy[], scenarioCore, kpiFramework[], nextActions[], insightPanel

### Configuration & Registry
- `src/data/experienceLabConfig.ts` — 4 goals, 6 industries (3 enabled), 36 scenarios (3 per outcome×industry), input step definitions, refinement chips
- `src/experience-center/registry/scenarioRegistry.ts` — 36 ScenarioConfig entries mapping scenarioId → skillFamily + outputModules + metadata
- `src/experience-center/registry/skillFamilies.ts` — 5 skill families: campaign-brief, journey, segment-opportunity, performance-analysis, insight-summary

### Orchestration & Skills
- `src/experience-center/orchestration/types.ts` — ScenarioConfig, IndustryContext, SkillFamily, OutputModule types
- `src/experience-center/orchestration/executeSkill.ts` — resolves scenario → builds prompt → calls LLM → parses output
- `src/experience-center/orchestration/buildSkillRequest.ts` — assembles system prompt with skill prompt + output schema + live data instructions
- `src/experience-center/orchestration/resolveScenario.ts` — resolves ScenarioConfig + enriched IndustryContext
- `src/experience-center/orchestration/skills/` — 5 skill prompt builders (campaign-brief.ts, journey.ts, segment-opportunity.ts, performance-analysis.ts, insight-summary.ts) + slide-deck.ts
- `src/experience-center/orchestration/industry/` — industry context enrichment with live CDP data + Chat API metrics (retail.ts, cpg.ts, travel.ts, index.ts)

### Output Rendering
- `src/experience-center/output-formats/modules/index.tsx` — 13 output module components (HeroSummaryCard, KpiFrameworkModule, CampaignBriefModule, JourneyMapModule, SegmentCardsModule, etc.) + 5 output compositions + ModularOutputRenderer
- `src/experience-center/output-formats/primitives/index.tsx` — 20+ visual primitives (OutputSection, KpiStatTile, SegmentCard, JourneyStageNode, ScoreBar, MiniSparkline, etc.)
- `src/experience-center/output-formats/OutputLoader.tsx` — skeleton loaders by output type
- `src/experience-center/output-formats/SkillProgressBlock.tsx` — generation progress with stage chips

### Services & Backend
- `src/services/llm-chat-api.ts` — Chat API client for live metrics (RetailMetrics, TravelMetrics, CpgMetrics) via PlazmaQueryTool agent
- `src/services/cdp-api.ts` — CDP API client for parent/child segments (routed through /api/cdp proxy)
- `server/index.ts` — Express server with proxy routes: `/api/llm`, `/api/config`, `/api/chat/create`, `/api/chat/:chatId/continue`, `/api/cdp/*`

---

## What to Build

### Level 1: Entry Flow (keep current UX pattern)
Keep: outcome → industry → scenario selection. Re-architect underneath if needed for workflow orchestration.

### Level 2: Multi-Step Workflow Engine
After scenario selection, user enters a multi-step guided workflow. Each step:
1. Shows what the AI did and found
2. Renders the main artifact in the right panel
3. Presents 2-4 next-step choices (go deeper / take action / change direction)

### Level 3: Cumulative Results
As user progresses, accumulate: analysis, segments, journeys, activation recommendations, campaign plans, content drafts, channel strategy.

---

## Workflow Step Types (reusable node patterns)

Design reusable workflow node types:
- **Analyze** — analyze parent segment, inspect data patterns
- **Inspect** — look up sample profiles, review subsegments
- **Create** — create segment, draft journey, build campaign plan
- **Compare** — compare audience options, evaluate strategies
- **Activate** — activate audience to channel, set up campaign
- **Optimize** — refine audience, optimize campaign, improve ROAS

## Two Types of Workflow Steps

### 1. Real Intelligence Steps
Use existing LLM / agent / Chat API to inspect or reason over sandbox data. Examples: analyzing parent segment patterns, interpreting trends, generating recommendations.

### 2. Simulated Artifact Steps
Generate visually realistic product-like outputs WITHOUT performing real backend writes. Examples: segment creation UI, journey builder preview, activation config. These should look like real Treasure Studio artifacts.

---

## Scenario Flow Examples

### Retail / Improve Retention: "Reactivate high-value customers"
```
Entry: Outcome → Industry → Scenario
  ↓
Step 1: ANALYZE parent segment
  → Shows segment overview, key metrics, churn risk distribution
  → Next choices: [Inspect Profiles] [Review Subsegments] [Create Segment]
  ↓
Step 2 (if Inspect Profiles): INSPECT sample profiles
  → Shows 3-4 sample customer profiles with behavioral signals
  → Next choices: [Create Segment] [Compare Audiences] [Build Journey]
  ↓
Step 3 (if Create Segment): CREATE reactivation segment
  → Shows simulated segment builder output (looks like real TD product)
  → Next choices: [Build Journey] [Generate Content] [Activate Audience]
  ↓
Step 4 (if Build Journey): CREATE multi-stage journey
  → Shows journey map with stages, channels, timing
  → Next choices: [Generate Email Content] [Launch Campaign Plan] [View Summary]
  ↓
Step 5: SUMMARY
  → Cumulative view of everything built
```

### CPG / Acquire New Customers: "Identify high-potential audiences for new product launch"
```
Step 1: ANALYZE → household data patterns, brand affinity
Step 2: COMPARE → lookalike vs behavioral vs category-based audiences
Step 3: CREATE → new segment for launch targeting
Step 4: ACTIVATE → retail media + email activation plan
Step 5: SUMMARY
```

### Travel / Optimize Campaigns: "Improve booking conversion"
```
Step 1: ANALYZE → booking funnel, abandonment patterns
Step 2: INSPECT → abandoner profiles, timing patterns
Step 3: OPTIMIZE → campaign reallocation recommendations
Step 4: CREATE → retargeting journey
Step 5: SUMMARY
```

---

## Architecture Requirements

### Priority: Reuse Over Rebuild
Reuse existing:
- Layout system (`Layout.tsx`, workflow page split-pane pattern)
- Chat panel / timeline pattern (left side of workflow page)
- Output rendering system (modules, primitives, ModularOutputRenderer)
- Skill invocation patterns (executeSkill, buildSkillRequest)
- State management (Zustand store — extend, don't replace)
- Backend proxy routes (add new ones if needed)
- Industry context enrichment (resolveIndustryContext)

### New Architecture Layers Needed

1. **Workflow Definition Layer** — Define step sequences, branching, and node types per scenario. Could be a registry similar to `scenarioRegistry.ts`.

2. **Workflow Session State** — Extend Zustand store to track: steps completed, branch choices, generated artifacts per step, current recommended next steps, cumulative outputs.

3. **Workflow Reasoning Layer** — AI determines next-step options based on: scenario, industry, previous selections, generated insights. Uses LLM to synthesize context and recommend branches.

4. **Step-Specific Skills** — New skill types for workflow steps (analyze, inspect, create, compare, activate, optimize). Could extend existing `skills/` folder.

5. **Step-Specific Output Modules** — New output modules for workflow artifacts (profile cards, segment builder preview, journey draft, activation config). Extend `modules/index.tsx` and `primitives/index.tsx`.

### Extensibility Requirements
- Adding a new scenario = adding a flow definition (like adding to scenarioRegistry)
- Adding a new step type = adding a node type + output module
- Adding a new industry = adding an industry context (already supported)
- Adding new skills/prompts over time should be straightforward

---

## Implementation Plan

Please do in order:

1. **Explore** the current codebase files listed above as source of truth
2. **Create a plan** with:
   - Proposed file structure for new/modified files
   - Visual flow tree showing scenario branches
   - Architecture tradeoffs and constraints
3. **Present the plan** for approval before implementing
4. **Implement incrementally** — start with one scenario (Retail / Improve Retention) as proof of concept, then generalize

### Implementation should include:
- Workflow engine / step orchestration (lightweight, front-end)
- Session state model (extend Zustand store)
- Updated workflow page UI (left: timeline/decisions, right: step artifact)
- Step-specific skill hooks (real intelligence + simulated artifacts)
- At least one complete scenario flow with 4-5 branching steps
- Reusable step node patterns that other scenarios can share
- Cumulative summary view

### Scaffold first, then enhance:
- Use mock/placeholder responses initially where skills don't exist yet
- Structure so real skills plug in cleanly later
- Focus on architecture and UX flow over polish

---

## Design Intent

This should feel less like a static AI brief generator and more like an **AI operator / workflow guide** that helps users explore how Treasure Data can analyze audiences, create segments, build journeys, and activate campaigns step by step.

Users should leave feeling:
- This is relevant to my business
- I understand how the AI got here
- This feels closer to a real product
- I can see multiple Treasure Data capabilities in action
- I want to keep exploring or talk to the team
