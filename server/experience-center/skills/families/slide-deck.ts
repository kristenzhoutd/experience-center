/**
 * Slide Deck Creation skill family — storyboard-first generation.
 *
 * Step 1: Build a deck storyboard mapping content to slide templates
 * Step 2: Generate structured slides with strict formatting rules
 *
 * Each slide maps to a visual template via the `layout` field.
 * The renderer uses layout to determine visual treatment.
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

// ── Storyboard templates by output type ──

const STORYBOARDS: Record<string, Record<number, string>> = {
  campaign_brief: {
    3: 'cover → recommendation → actions',
    5: 'cover → recommendation → strategy → channels → actions',
    7: 'cover → recommendation → audience → strategy → channels → kpi → actions',
  },
  journey_map: {
    3: 'cover → journey_flow → actions',
    5: 'cover → recommendation → journey_flow → kpi → actions',
    7: 'cover → recommendation → audience → journey_flow → timeline → kpi → actions',
  },
  segment_cards: {
    3: 'cover → segments → actions',
    5: 'cover → recommendation → segments → kpi → actions',
    7: 'cover → recommendation → segments → comparison → kpi → impact → actions',
  },
  performance_diagnosis: {
    3: 'cover → diagnosis → actions',
    5: 'cover → recommendation → diagnosis → kpi → actions',
    7: 'cover → recommendation → diagnosis → root_cause → channels → kpi → actions',
  },
  insight_summary: {
    3: 'cover → insights → actions',
    5: 'cover → recommendation → insights → kpi → actions',
    7: 'cover → recommendation → insights → segments → kpi → impact → actions',
  },
};

const STYLE_RULES: Record<string, string> = {
  executive: `EXECUTIVE STYLE:
- Maximum 3 bullets per slide, each under 10 words
- Lead every slide with a single bold takeaway
- Use numbers and metrics prominently
- Subtitle should state "so what" in one line
- Think: what would a CMO need to see in 30 seconds?`,
  strategy: `STRATEGY STYLE:
- Maximum 4 bullets per slide, each under 12 words
- Balance insight with supporting evidence
- Include "why" alongside "what"
- Subtitle should frame the strategic context
- Think: what would a strategy review audience need?`,
  working: `WORKING SESSION STYLE:
- Maximum 4 bullets per slide, each under 15 words
- Include enough detail to drive discussion
- Frame content as decisions and trade-offs
- Subtitle should pose the question being addressed
- Think: what would a team need to discuss and decide?`,
};

// ── Layout-to-template mapping ──

const LAYOUT_INSTRUCTIONS = `
## Slide Layout Templates

Each slide MUST use one of these layouts. Choose the layout that matches the content type.

### "cover" — Title/Cover slide
- title: deck title (max 8 words)
- subtitle: context line (outcome + industry + KPI)
- No bullets needed

### "hero" — Big Recommendation slide
- title: short headline (max 8 words)
- subtitle: the core recommendation rewritten as a single punchy sentence
- stat: one key metric or impact number (e.g., "15-25% improvement")
- statLabel: what the stat measures (e.g., "Projected conversion lift")
- bullets: 2-3 supporting points, each under 10 words

### "segments" — Ranked Comparison slide
- title: short headline
- segments: array of 3 items, each with { name, score (0-100), description (under 10 words), level ("High"|"Medium"|"Low") }

### "journey" — Flow/Stages slide
- title: short headline
- stages: array of 3-5 items, each with { name, description (under 10 words), channel }

### "kpi" — KPI/Impact slide
- title: short headline
- kpis: array of 3-4 items, each with { name, value, note (under 8 words) }

### "diagnosis" — Findings slide
- title: short headline
- findings: array of 2-3 items, each with { label, detail (under 15 words), severity ("critical"|"warning"|"info") }

### "strategy" — Strategy/Brief slide
- title: short headline
- subtitle: framing line
- bullets: 3-4 concise points
- highlight: one key callout sentence

### "channels" — Channel Strategy slide
- title: short headline
- channels: array of 3-4 items, each with { name, role (under 6 words), percent (budget allocation number) }

### "actions" — Next Steps slide
- title: "Recommended Next Steps" or similar
- actions: array of 3-5 items, each with { action (under 12 words), priority ("Do now"|"Test next"|"Scale later") }

### "impact" — Business Impact slide
- title: short headline
- stat: primary impact metric
- statLabel: what it measures
- bullets: 3-4 impact statements, each under 12 words
`;

export function buildSlidePrompt(input: SlideSkillInput): string {
  const { outputData, deckLength, deckStyle, customTitle, scenarioContext } = input;
  const outputType = scenarioContext.outputFormatKey || 'campaign_brief';
  const storyboard = STORYBOARDS[outputType]?.[deckLength] || STORYBOARDS.campaign_brief[deckLength] || STORYBOARDS.campaign_brief[5];
  const styleRules = STYLE_RULES[deckStyle] || STYLE_RULES.executive;

  return `You are creating a premium strategy presentation from structured AI output.

## TASK
Generate a ${deckLength}-slide deck that feels like a polished executive strategy review.

## STORYBOARD
Follow this slide sequence: ${storyboard}

Each item in the storyboard maps to a slide layout template. Generate slides in this exact order.

## CONTEXT
- Outcome: ${scenarioContext.outcome || 'Not specified'}
- Industry: ${scenarioContext.industry || 'Not specified'}
- Scenario: ${scenarioContext.scenario || 'Not specified'}
- Primary KPI: ${scenarioContext.kpi || 'Not specified'}
${customTitle ? `- Deck title: ${customTitle}` : ''}

## STYLE
${styleRules}

${LAYOUT_INSTRUCTIONS}

## STRICT FORMATTING RULES
1. Title: MAX 8 words. Write like a headline, not a sentence.
2. Subtitle: MAX 15 words. State the "so what."
3. Bullets: MAX 4 per slide, each MAX 12 words. No filler.
4. Every non-cover slide MUST have a dominant visual structure (segments, journey stages, KPIs, channels, findings, or actions). Do NOT make text-only slides.
5. Rewrite all content into PRESENTATION language — concise, headline-driven, scannable.
6. Do NOT copy raw paragraphs from the source output. Compress and restructure.
7. Each slide must be self-contained and scannable in 10 seconds.
8. Pull data from the source output — do NOT invent metrics.
9. speakerNotes: 1 sentence, max 20 words.

## SOURCE DATA
${JSON.stringify(outputData, null, 2)}

## OUTPUT FORMAT
Wrap in a \`slide-deck-json\` code fence. Output ONLY the JSON.

\`\`\`\`
\`\`\`slide-deck-json
{
  "title": "string (max 8 words)",
  "subtitle": "string (context line)",
  "slides": [
    {
      "layout": "cover|hero|segments|journey|kpi|diagnosis|strategy|channels|actions|impact",
      "title": "string",
      "subtitle": "string",
      ...layout-specific fields from templates above...
      "speakerNotes": "string"
    }
  ]
}
\`\`\`
\`\`\`\``;
}
