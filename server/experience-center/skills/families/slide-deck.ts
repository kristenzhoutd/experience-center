/**
 * Slide Deck Creation skill family.
 *
 * Transforms structured Experience Center output into presentation-ready
 * slide decks. Scenario-aware: adapts deck structure based on output type.
 *
 * Inputs:
 *   - Existing structured output (OutputData)
 *   - Deck config (length, style, optional title)
 *   - Scenario context (outcome, industry, scenario title, KPI)
 *
 * Output:
 *   - Structured DeckData with typed slides
 *
 * Deck templates by output type:
 *   - campaign_brief → strategy-oriented deck
 *   - journey_map → orchestration-oriented deck
 *   - segment_cards → audience/opportunity deck
 *   - performance_diagnosis → analysis/diagnosis deck
 *   - insight_summary → insight/findings deck
 */

interface SlideSkillInput {
  outputData: Record<string, unknown>;
  deckLength: number;
  deckStyle: string;
  customTitle?: string;
  scenarioContext: {
    outcome?: string;
    industry?: string;
    scenario?: string;
    kpi?: string;
    outputFormatKey?: string;
  };
}

const DECK_TEMPLATE_GUIDANCE: Record<string, string> = {
  campaign_brief: `Structure as a campaign strategy deck:
- Title slide with campaign name and context
- Strategic recommendation with key audience and impact
- Campaign brief highlights (objective, audience, messaging, timeline)
- Channel strategy with allocation
- KPI framework and success metrics
- Prioritized next steps`,

  journey_map: `Structure as a journey orchestration deck:
- Title slide with journey name and context
- Strategic recommendation with audience and impact
- Journey overview (stages, triggers, channels)
- Stage-by-stage detail with timing
- KPI framework and measurement plan
- Prioritized next steps`,

  segment_cards: `Structure as an audience opportunity deck:
- Title slide with discovery focus and context
- Strategic recommendation with key finding
- Ranked segment profiles with opportunity scores
- Segment activation strategies
- KPI framework and targeting metrics
- Prioritized next steps`,

  performance_diagnosis: `Structure as a performance analysis deck:
- Title slide with analysis focus and context
- Strategic recommendation with key finding
- Performance diagnosis with root causes
- Optimization recommendations with impact
- KPI framework and measurement
- Prioritized next steps`,

  insight_summary: `Structure as a business insights deck:
- Title slide with insight focus and context
- Strategic recommendation with key discovery
- Ranked insights with evidence
- Business implications and opportunities
- KPI framework and signals
- Prioritized next steps`,
};

const STYLE_GUIDANCE: Record<string, string> = {
  executive: 'Use concise, executive-friendly language. Lead with impact. Minimize detail. Focus on decisions and outcomes. Each slide should be scannable in 10 seconds.',
  strategy: 'Use strategic, analytical language. Balance insight with detail. Include supporting evidence. Each slide should tell part of a coherent strategic narrative.',
  working: 'Use practical, action-oriented language. Include enough detail for discussion. Focus on what to do and how. Each slide should drive a specific conversation or decision.',
};

export function buildSlidePrompt(input: SlideSkillInput): string {
  const { outputData, deckLength, deckStyle, customTitle, scenarioContext } = input;
  const templateGuidance = DECK_TEMPLATE_GUIDANCE[scenarioContext.outputFormatKey || 'campaign_brief'] || DECK_TEMPLATE_GUIDANCE.campaign_brief;
  const styleGuidance = STYLE_GUIDANCE[deckStyle] || STYLE_GUIDANCE.executive;

  return `You are generating a presentation deck from structured AI output for the Treasure AI Experience Center.

## Scenario Context
- Outcome: ${scenarioContext.outcome || 'Not specified'}
- Industry: ${scenarioContext.industry || 'Not specified'}
- Scenario: ${scenarioContext.scenario || 'Not specified'}
- Primary KPI: ${scenarioContext.kpi || 'Not specified'}
${customTitle ? `- Custom deck title: ${customTitle}` : ''}

## Deck Configuration
- Length: ${deckLength} slides
- Style: ${deckStyle}

## Style Direction
${styleGuidance}

## Deck Template
${templateGuidance}

## Source Output Data
${JSON.stringify(outputData, null, 2)}

## Slide Output Schema

Generate exactly ${deckLength} slides. Each slide must have:
- title: concise slide title
- subtitle: optional supporting line
- layout: one of "title" | "summary" | "content" | "kpi" | "actions" | "two-column" | "journey" | "segments"
- bullets: array of 3-5 concise bullet points (for most layouts)
- speakerNotes: 1-2 sentence note for the presenter

For KPI slides, also include:
- kpis: array of { name, value, note }

For action slides, also include:
- actions: array of { action, priority }

For two-column slides, also include:
- columns: { left: string[], right: string[] }

## Rules
1. Pull content from the source output — do NOT invent new data
2. Keep bullets concise (under 15 words each)
3. First slide must be layout "title"
4. Last slide should be layout "actions" with next steps
5. Each slide should be self-contained and scannable
6. Use the industry and scenario context to frame content appropriately

Wrap output in a \`slide-deck-json\` code fence. Output ONLY the fenced JSON.

\`\`\`\`
\`\`\`slide-deck-json
{
  "title": "string",
  "subtitle": "string",
  "slides": [ ... ]
}
\`\`\`
\`\`\`\``;
}
