/**
 * Slide Deck Creation skill family — designer-quality, brand-native slides.
 *
 * Uses TD 2026 brand guidelines:
 * - Colors: Deep Blue #2D40AA, Purple #847BF2, Sky Blue #8BBCFD, Peach #FDB893
 * - Typography: Poppins (titles), Manrope (body)
 * - Layouts: cover, divider, content, gradient, kpi, actions
 *
 * Content is sourced from structured output, then compressed and
 * rewritten for slide-native presentation (not copy-pasted from product UI).
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

const STORYBOARDS: Record<string, Record<number, string>> = {
  campaign_brief: {
    3: 'cover → recommendation → actions',
    5: 'cover → recommendation → strategy → kpi → actions',
    7: 'cover → recommendation → audience → strategy → channels → kpi → actions',
  },
  journey_map: {
    3: 'cover → journey_flow → actions',
    5: 'cover → recommendation → journey_flow → kpi → actions',
    7: 'cover → recommendation → audience → journey_flow → timing → kpi → actions',
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
  executive: 'EXECUTIVE: Max 3 bullets/slide, each under 8 words. One bold takeaway per slide. Lead with metrics.',
  strategy: 'STRATEGY: Max 4 bullets/slide, each under 10 words. Balance insight with evidence. Include "why" alongside "what".',
  working: 'WORKING: Max 4 bullets/slide, each under 12 words. Frame as decisions and trade-offs. Include enough to discuss.',
};

export function buildSlidePrompt(input: SlideSkillInput): string {
  const { outputData, deckLength, deckStyle, customTitle, scenarioContext } = input;
  const outputType = scenarioContext.outputFormatKey || 'campaign_brief';
  const storyboard = STORYBOARDS[outputType]?.[deckLength] || STORYBOARDS.campaign_brief[deckLength] || STORYBOARDS.campaign_brief[5];
  const styleRule = STYLE_RULES[deckStyle] || STYLE_RULES.executive;

  return `Create a ${deckLength}-slide strategy presentation. ${styleRule}

STORYBOARD: ${storyboard}

CONTEXT: ${scenarioContext.outcome || ''} | ${scenarioContext.industry || ''} | ${scenarioContext.scenario || ''} | KPI: ${scenarioContext.kpi || ''}
${customTitle ? `TITLE: ${customTitle}` : ''}

SOURCE DATA (extract and compress for slides — do NOT paste verbatim):
${JSON.stringify(outputData, null, 1)}

SLIDE LAYOUTS — each slide MUST use one:

"cover" — Title (max 6 words) + subtitle (context line). Clean, bold, branded.
"hero" — Big recommendation. Fields: title, subtitle (the recommendation as 1 punchy sentence), stat (key metric), statLabel. Max 2 bullets.
"segments" — Ranked audience cards. Fields: title, segments array [{name, score 0-100, description (max 8 words), level}]. Exactly 3 segments.
"journey" — Stage flow. Fields: title, stages array [{name, description (max 8 words), channel}]. 3-5 stages.
"kpi" — Metric tiles. Fields: title, kpis array [{name, value, note (max 6 words)}]. 3-4 KPIs.
"diagnosis" — Findings. Fields: title, findings array [{label, detail (max 12 words), severity}]. 2-3 findings.
"channels" — Allocation. Fields: title, channels array [{name, role (max 5 words), percent}]. 3-4 channels.
"strategy" — Brief section. Fields: title, subtitle, highlight (1 key sentence), bullets (max 3). Clean whitespace.
"actions" — Next steps. Fields: title, actions array [{action (max 10 words), priority "Do now"|"Test next"|"Scale later"}]. 3-5 actions.
"impact" — Business value. Fields: title, stat (big number), statLabel, bullets (max 3 impact statements).

RULES:
1. Title: MAX 6 words. Headline style. Not a sentence.
2. Compress all content for slides. Rewrite — don't paste from source.
3. Every non-cover slide needs a dominant visual structure (segments/journey/kpis/channels/findings/actions).
4. First slide = "cover". Last slide = "actions".
5. speakerNotes: 1 sentence, max 15 words.
6. Output ONLY the JSON code fence. No other text.

\`\`\`slide-deck-json
{"title":"...","subtitle":"...","slides":[...]}
\`\`\``;
}
