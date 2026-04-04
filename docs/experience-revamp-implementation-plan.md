# Experience Center Revamp — Multi-Step Branchable AI Workflow

## Context

The current Experience Center generates a one-shot strategy brief after scenario selection. Users can't see what the AI analyzed or how it arrived at the output. We're evolving this into a multi-step, branchable AI workflow: `input → analysis → recommendation → user choice → action → cumulative outcome`.

---

## Architecture Decision: Extend, Don't Replace

Add a **workflow session layer** on top of the existing architecture. Keep the entry flow (goal → industry → scenario) and one-shot generation as-is. Scenarios with workflow definitions enter a new multi-step mode; scenarios without keep current behavior (backward compatible).

Key extension points:
- New Zustand store for workflow session state (parallel to existing `experienceLabStore`)
- New workflow registry (parallel to existing `scenarioRegistry`)
- Existing skill execution pipeline reused per-step with context injection
- Existing output modules reused + new product-screen modules added

---

## New Files to Create

```
src/stores/workflowSessionStore.ts              — Workflow session state (Zustand)
src/experience-center/registry/workflowRegistry.ts — Maps scenarioId → WorkflowDef
src/experience-center/registry/workflows/
  index.ts                                       — Barrel export
  ret-retail-3.ts                                — Retail/Retention workflow
  perf-travel-1.ts                               — Travel/Campaign Performance workflow
  ins-cpg-3.ts                                   — CPG/Insights workflow
  shared-steps.ts                                — Reusable step templates
src/experience-center/orchestration/
  workflowEngine.ts                              — Core engine: init, execute, chooseBranch
  contextAccumulator.ts                          — Serializes step history for LLM prompts
src/experience-center/output-formats/modules/
  BranchChoiceCards.tsx                           — 2-4 branch option cards for chat panel
  WorkflowProgressIndicator.tsx                  — Step breadcrumb/progress dots
  WorkflowArtifactTabs.tsx                       — Tab bar for step artifacts (right panel)
  product-screens.tsx                            — Simulated product UI modules
src/data/mockArtifacts/
  segment-builder.ts                             — Mock segment builder screen data
  journey-canvas.ts                              — Mock journey canvas data
  activation-preview.ts                          — Mock activation preview data
```

## Files to Modify

```
src/experience-center/orchestration/types.ts     — Add WorkflowStepDef, BranchDef, WorkflowDef, StepType types
src/stores/experienceLabStore.ts                 — Add workflowMode flag
src/pages/ExperienceCenterWorkflowPage.tsx        — Workflow mode in ChatPanel + right panel
src/experience-center/orchestration/buildSkillRequest.ts — Accept cumulativeContext parameter
src/experience-center/orchestration/executeSkill.ts — Add executeWorkflowStep() wrapper
src/experience-center/output-formats/modules/index.tsx — Register new product-screen modules
```

---

## Core Types

```typescript
type StepType = 'analyze' | 'inspect' | 'create' | 'compare' | 'activate' | 'optimize';
type ExecutionMode = 'llm' | 'simulated';

interface WorkflowStepDef {
  stepId: string;
  label: string;
  stepType: StepType;
  executionMode: ExecutionMode;
  skillFamily?: SkillFamily;        // for LLM steps
  outputModules: OutputModule[];
  simulatedArtifactKey?: string;    // for simulated steps
  promptOverlay?: string;
  branches: BranchDef[];
  summaryTemplate: string;
}

interface BranchDef {
  branchId: string;
  label: string;
  description: string;
  nextStepId: string;
  recommendation?: boolean;
  contextUpdate?: Record<string, string>;
}

interface WorkflowDef {
  workflowId: string;
  scenarioId: string;
  title: string;
  entryStepId: string;
  steps: Record<string, WorkflowStepDef>;
}
```

## Workflow Session State (Zustand)

```typescript
interface StepResult {
  stepId: string;
  stepDef: WorkflowStepDef;
  chosenBranchId: string | null;
  output: OutputData | SimulatedArtifact | null;
  timestamp: number;
}

interface WorkflowSessionState {
  workflowDef: WorkflowDef | null;
  currentStepId: string | null;
  stepHistory: StepResult[];
  cumulativeContext: Record<string, string>;
  isExecutingStep: boolean;
  executionPhase: number;
  activeStepArtifactIndex: number;

  // Actions
  initWorkflow: (workflowDef: WorkflowDef) => void;
  executeCurrentStep: () => Promise<void>;
  chooseBranch: (branchId: string) => void;
  setActiveStepArtifact: (index: number) => void;
  resetWorkflow: () => void;
}
```

---

## Scenario Flow Trees

### Retail / Retention: "Win-back inactive members" (ret-retail-3)

#### Text Flow
```
[Step 1: ANALYZE] LLM:segment-opportunity
  "Analyze inactive member segments"
  ├─ [Inspect high-value lapsed] → Step 2a
  ├─ [Compare reactivation across all] → Step 2b
  └─ [Create campaign immediately] → Step 3

[Step 2a: INSPECT] LLM
  "Deep-dive into high-value lapsed segment"
  ├─ [Create win-back campaign] → Step 3
  └─ [Build reactivation journey] → Step 3b

[Step 2b: COMPARE] LLM:performance-analysis
  "Compare reactivation potential"
  ├─ [Create campaign for top segment] → Step 3
  └─ [Refine targeting criteria] → Step 2a

[Step 3: CREATE] LLM:campaign-brief
  "Create targeted win-back campaign"
  ├─ [Build journey in Treasure Studio] → Step 4a
  └─ [Preview activation] → Step 4b

[Step 4a: CREATE] Simulated:journey-canvas
  "Multi-stage reactivation journey"
  └─ [Preview activation] → Step 5

[Step 4b: ACTIVATE] Simulated:activation-preview
  "Preview audience activation"
  └─ [END → Summary]
```

#### Visual Tree
```
                        ┌─────────────────────┐
                        │  Entry: Scenario     │
                        │  selected            │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Step 1: ANALYZE      │
                        │  LLM:segment-opp      │
                        │  "Analyze inactive    │
                        │   member segments"    │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
   ┌──────────▼──────────┐ ┌──────▼──────────┐ ┌───────▼─────────┐
   │  Step 2a: INSPECT   │ │ Step 2b: COMPARE│ │ Step 3: CREATE  │
   │  LLM                │ │ LLM:perf-anal   │ │ LLM:campaign    │
   │  "Inspect high-     │ │ "Compare react- │ │ "Create win-back│
   │   value lapsed"     │ │  ivation across │ │  campaign"      │
   └──────────┬──────────┘ │  all segments"  │ └───────┬─────────┘
              │            └──────┬──────────┘         │
              │                   │              ┌─────┴──────┐
     ┌────────┴────────┐    ┌────┴─────┐        │            │
     │                 │    │          │  ┌──────▼──────┐ ┌───▼──────────┐
     │                 │    │          │  │ Step 4a:    │ │ Step 4b:     │
     │                 │    │          │  │ CREATE      │ │ ACTIVATE     │
     │                 │    │          │  │ Simulated:  │ │ Simulated:   │
     │                 │    │          │  │ journey-    │ │ activation-  │
     │                 │    │          │  │ canvas      │ │ preview      │
     │                 │    │          │  └──────┬──────┘ └───┬──────────┘
     │                 │    │          │         │            │
     ▼                 ▼    ▼          ▼         │          [END]
   Step 3           Step 3b Step 3   Step 2a     │
   (CREATE)         (CREATE)(CREATE) (loop)      │
                                          ┌─────▼──────┐
                                          │ Step 5:    │
                                          │ ACTIVATE   │
                                          │ Simulated: │
                                          │ activation │
                                          └─────┬──────┘
                                                │
                                              [END]
```

### CPG / Insights: "Find high-growth households" (ins-cpg-3)

#### Text Flow
```
[Step 1: ANALYZE] LLM:insight-summary
  "Identify household growth patterns"
  ├─ [Inspect top growth segment] → Step 2a
  ├─ [Compare growth vs retention] → Step 2b
  └─ [Build targeting plan] → Step 3

[Step 2a: INSPECT] LLM
  ├─ [Create activation plan] → Step 3
  └─ [Compare with other segments] → Step 2b

[Step 2b: COMPARE] LLM:performance-analysis
  └─ [Create targeting plan] → Step 3

[Step 3: CREATE] LLM:campaign-brief
  ├─ [Preview segment builder] → Step 4a
  └─ [Estimate media allocation] → Step 4b

[Step 4a: ACTIVATE] Simulated:segment-builder → END
[Step 4b: OPTIMIZE] LLM → Simulated:activation-preview → END
```

#### Visual Tree
```
                        ┌─────────────────────┐
                        │  Entry: Scenario     │
                        │  selected            │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Step 1: ANALYZE      │
                        │  LLM:insight-summary  │
                        │  "Identify household  │
                        │   growth patterns"    │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
   ┌──────────▼──────────┐ ┌──────▼──────────┐ ┌───────▼─────────┐
   │  Step 2a: INSPECT   │ │ Step 2b: COMPARE│ │ Step 3: CREATE  │
   │  LLM                │ │ LLM:perf-anal   │ │ LLM:campaign    │
   │  "Deep-dive top     │ │ "Compare growth │ │ "Build targeting│
   │   growth segment"   │ │  vs retention"  │ │  plan"          │
   └──────────┬──────────┘ └──────┬──────────┘ └───────┬─────────┘
              │                   │                     │
     ┌────────┴────────┐         │              ┌──────┴──────┐
     │                 │         │              │             │
     ▼                 ▼         ▼       ┌──────▼──────┐ ┌───▼──────────┐
   Step 3           Step 2b    Step 3    │ Step 4a:    │ │ Step 4b:     │
   (CREATE)         (loop)    (CREATE)   │ ACTIVATE    │ │ OPTIMIZE     │
                                         │ Simulated:  │ │ LLM          │
                                         │ segment-    │ │ "Estimate    │
                                         │ builder     │ │  media       │
                                         └──────┬──────┘ │  allocation" │
                                                │        └───┬──────────┘
                                              [END]          │
                                                      ┌──────▼──────┐
                                                      │ Step 5:     │
                                                      │ ACTIVATE    │
                                                      │ Simulated:  │
                                                      │ activation  │
                                                      └──────┬──────┘
                                                             │
                                                           [END]
```

### Travel / Campaign Performance: "Optimize channel mix" (perf-travel-1)

#### Text Flow
```
[Step 1: ANALYZE] LLM:performance-analysis
  "Diagnose channel performance by traveler type"
  ├─ [Inspect worst channel] → Step 2a
  ├─ [Compare channel ROI] → Step 2b
  └─ [Generate optimized plan] → Step 2c

[Step 2a/2b: INSPECT/COMPARE] LLM
  └─ [Create optimized plan] → Step 3

[Step 2c/3: OPTIMIZE] LLM:campaign-brief
  ├─ [Build A/B test plan] → Step 4a
  └─ [Preview activation] → Step 4b

[Step 4a: CREATE] LLM → END
[Step 4b: ACTIVATE] Simulated:activation-preview → END
```

#### Visual Tree
```
                        ┌─────────────────────┐
                        │  Entry: Scenario     │
                        │  selected            │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Step 1: ANALYZE      │
                        │  LLM:perf-analysis    │
                        │  "Diagnose channel    │
                        │   performance by      │
                        │   traveler type"      │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
   ┌──────────▼──────────┐ ┌──────▼──────────┐ ┌───────▼──────────┐
   │  Step 2a: INSPECT   │ │ Step 2b: COMPARE│ │ Step 2c: OPTIMIZE│
   │  LLM                │ │ LLM             │ │ LLM:campaign     │
   │  "Inspect worst     │ │ "Compare channel│ │ "Generate        │
   │   performing        │ │  ROI across     │ │  optimized       │
   │   channel"          │ │  segments"      │ │  allocation"     │
   └──────────┬──────────┘ └──────┬──────────┘ └───────┬──────────┘
              │                   │                     │
              └─────────┬─────────┘              ┌──────┴──────┐
                        │                        │             │
                 ┌──────▼──────┐          ┌──────▼──────┐ ┌───▼──────────┐
                 │ Step 3:     │          │ Step 4a:    │ │ Step 4b:     │
                 │ OPTIMIZE    │          │ CREATE      │ │ ACTIVATE     │
                 │ LLM:campaign│          │ LLM         │ │ Simulated:   │
                 │ "Recommend  │          │ "Build A/B  │ │ activation-  │
                 │  channel    │          │  test plan" │ │ preview      │
                 │  realloc."  │          └──────┬──────┘ └───┬──────────┘
                 └──────┬──────┘                 │            │
                        │                      [END]        [END]
                 ┌──────┴──────┐
                 │             │
          ┌──────▼──────┐ ┌───▼──────────┐
          │ Step 4a:    │ │ Step 4b:     │
          │ CREATE      │ │ ACTIVATE     │
          │ LLM         │ │ Simulated:   │
          │ "Campaign   │ │ activation-  │
          │  brief for  │ │ preview      │
          │  optimized  │ └───┬──────────┘
          │  channels"  │     │
          └──────┬──────┘   [END]
                 │
          ┌──────▼──────┐
          │ Step 5:     │
          │ ACTIVATE    │
          │ Simulated   │
          └──────┬──────┘
                 │
               [END]
```

### Reusable Step Templates (shared-steps.ts)

#### Text Format
- `analyzeSegments` — LLM:segment-opportunity, used by retail & CPG Step 1
- `analyzePerformance` — LLM:performance-analysis, used by travel Step 1
- `createCampaignBrief` — LLM:campaign-brief, used by all Step 3
- `activationPreview` — Simulated, used as terminal step everywhere
- `journeyCanvas` — Simulated, used by retail & travel
- `segmentBuilder` — Simulated, used by CPG

#### Visual Matrix
```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED STEP TEMPLATES                     │
├─────────────────┬───────────────────┬───────────────────────┤
│  analyzeSegments│ analyzePerformance│ createCampaignBrief   │
│  LLM:segment-opp│ LLM:perf-analysis│ LLM:campaign-brief    │
│  Used by:       │ Used by:          │ Used by:              │
│  • Retail Step 1│ • Travel Step 1   │ • Retail Step 3       │
│  • CPG Step 1   │                   │ • CPG Step 3          │
│                 │                   │ • Travel Step 2c/3    │
├─────────────────┼───────────────────┼───────────────────────┤
│ activationPrev. │ journeyCanvas     │ segmentBuilder        │
│ Simulated       │ Simulated         │ Simulated             │
│ Used by:        │ Used by:          │ Used by:              │
│ • ALL terminal  │ • Retail Step 4a  │ • CPG Step 4a         │
│   steps         │ • Travel Step 4b  │                       │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## Execution Model

### Two Types of Workflow Steps

#### 1. Real Intelligence Steps (LLM-powered)
Use existing skill execution pipeline with context injection:
1. Build modified ScenarioConfig: override skillFamily + outputModules from step def
2. Inject `cumulativeContext` (serialized step history + branch choices) into prompt via `buildSkillRequest()`
3. Call existing `callLLM()` → parse output through existing pipeline
4. Extract `recommendedNextAction` from LLM response (optional field)
5. Render output via existing `ModularOutputRenderer`

#### 2. Simulated Artifact Steps
Generate visually realistic product-like outputs without backend writes:
1. Load mock artifact data from `src/data/mockArtifacts/`
2. Render through new product-screen modules (SegmentBuilderModule, JourneyCanvasModule, etc.)
3. Statically defined — no LLM call needed

### Context Accumulation
`contextAccumulator.ts` serializes the step history into an LLM-consumable string:
```
## Prior Workflow Context
Step 1 (Analyze): Found 3 segments. User chose "Inspect high-value lapsed"
Step 2 (Inspect): CLV $7,200, 127 days since last purchase. User chose "Create campaign"
## Current Step: Create a targeted win-back campaign for the High-Value Lapsed segment
```

### AI Recommendation of Next Steps
For LLM-powered steps, the output JSON schema is extended with an optional field:
```json
{
  "recommendedNextAction": {
    "branchId": "b1a",
    "reasoning": "The high-value lapsed segment shows the strongest reactivation potential..."
  }
}
```
If LLM fails to provide a valid recommendation, falls back to `recommendation: true` flag in the workflow definition.

---

## UI Changes

### Left Panel (Chat Timeline)
New message types added to `ConversationMessage.type`:
- `'workflow-step-result'` — AI summary of completed step
- `'branch-choices'` — renders BranchChoiceCards (2-4 clickable cards)
- `'workflow-complete'` — cumulative summary

Flow per step:
1. Step announcement ("Let me analyze your inactive member segments...")
2. Progress indicator (reuses existing SkillProgressBlock)
3. Step result summary (natural language from summaryTemplate)
4. Branch choice cards (2-4 clickable options, one marked "Recommended")
5. User clicks → their choice appears as user message → next step begins

### Right Panel (Artifacts)
- `WorkflowArtifactTabs` — tab bar showing completed step artifacts
- Each step produces an artifact tab (numbered, with step type icon)
- Latest step's artifact shown by default
- LLM outputs render via existing ModularOutputRenderer
- Simulated outputs render via new product-screen modules

### Progress Indicator
`WorkflowProgressIndicator` — replaces stepper in workflow mode
- Step dots: completed (green), current (blue), future (gray)
- Current step label shown

### Terminal State
When the user reaches a leaf node (no more branches):
- Final artifact on right panel
- Cumulative summary in chat: "Here's everything we built:" + step list
- "Start a new exploration" button
- "Book a walkthrough" CTA

---

## Implementation Phases

### Phase 1: Foundation — One Scenario POC
- New types, stores, workflow registry, workflow engine
- ret-retail-3 workflow definition (3-4 LLM steps, no simulated)
- BranchChoiceCards + WorkflowProgressIndicator components
- Modified WorkflowPage for workflow mode
- Context accumulator for multi-step LLM prompts
- **Test**: Run ret-retail-3 through 3+ steps with real LLM calls

### Phase 2: Simulated Product Screens
- Mock artifact data files
- Product-screen output modules (segment builder, journey canvas, activation preview)
- Add simulated terminal steps to ret-retail-3
- **Test**: Full ret-retail-3 flow with LLM + simulated steps

### Phase 3: Additional Scenarios
- perf-travel-1 and ins-cpg-3 workflow definitions
- Extract shared step templates
- **Test**: All 3 scenarios with cross-scenario reusable steps

### Phase 4: Polish
- Dynamic LLM recommendations (recommendedNextAction field)
- Cumulative summary at workflow end
- Session persistence (localStorage)
- Remaining scenario workflows

---

## Verification
1. Select Retail > Retention > "Win-back inactive members"
2. Step 1 runs (LLM analysis), shows segment results + 3 branch cards
3. Click a branch → Step 2 runs, shows new artifact tab + new branch cards
4. Continue through 3-5 steps
5. Verify context accumulates in LLM prompts (check console logs)
6. Verify right panel shows artifact tabs for each completed step
7. Test: CPG and Travel scenarios still work (one-shot mode if no workflow def)
8. Test: Existing one-shot scenarios still work unchanged
