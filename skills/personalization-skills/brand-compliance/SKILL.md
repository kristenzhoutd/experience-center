---
name: brand-compliance
description: >
  Checks campaign content (headlines, body copy, CTAs) against provided brand guidelines
  and returns a compliance report with per-field violations, severity levels, and
  suggested rewrites. Accepts brand guidelines as input context.
---

# Brand Compliance Skill

## When to Use

Activate this skill when the user asks to check, audit, or validate campaign content
against brand guidelines. Trigger phrases include:

- "Check this content against our brand guidelines"
- "Are there any brand violations?"
- "Review copy for brand compliance"
- "Audit the content for guideline issues"
- "Does this follow our brand voice?"
- "Validate content against brand standards"
- "Check for brand guideline violations"
- Any request to verify campaign copy, tone, terminology, or visual direction
  against a set of brand rules or guidelines

## Input Context

You will receive:
- **Brand guidelines**: Plain text or structured rules describing allowed/disallowed
  terminology, tone of voice, color palette, typography rules, messaging hierarchy,
  legal disclaimers, and any other brand standards. This may come from:
  - A pasted brand guideline document
  - A TD Foundry Workspace runtime resource
  - Inline rules provided by the user
- **Content to check**: One or more content items, which may include:
  - Campaign content from Step 3 of the wizard (headlines, body, CTAs per spot/variant)
  - Free-form copy provided directly by the user
  - GrapesJS editor content (HTML with `.ps-headline`, `.ps-body`, `.ps-cta` classes)
- **Campaign context** (optional): Campaign name, objective, target audience — useful
  for evaluating tone and messaging relevance

## Compliance Check Categories

Evaluate content against these categories when applicable brand guidelines exist:

1. **Tone & Voice** — Does the copy match the brand's voice (e.g., professional,
   playful, authoritative)? Flag mismatches in register, formality, or personality.
2. **Terminology** — Are prohibited words or phrases used? Are required brand terms
   present? Check for competitor mentions, banned claims, or off-brand jargon.
3. **Messaging Hierarchy** — Does the headline/body/CTA follow the brand's messaging
   framework? Is the value proposition positioned correctly?
4. **Legal & Compliance** — Are required disclaimers, trademark symbols, or regulatory
   notices present? Flag missing legal requirements.
5. **Length & Format** — Does the copy meet character limits, capitalization rules, or
   punctuation standards specified in the guidelines?
6. **Inclusive Language** — Does the copy follow any DEI or inclusive language standards
   defined in the guidelines?

## Output Schema

Return a JSON object with an overall verdict and per-field violation details:

```jsonc
{
  "overallStatus": "pass | warn | fail",
  "summary": "string — 1-2 sentence summary of compliance status",
  "score": "number — 0-100 compliance score",
  "violations": [
    {
      "field": "string — which content field (e.g. 'Homepage > Hero Banner > headline', 'CTA text')",
      "category": "string — tone_voice | terminology | messaging | legal | format | inclusive_language",
      "severity": "error | warning | info",
      "rule": "string — the brand guideline rule being violated",
      "currentText": "string — the offending text",
      "issue": "string — clear explanation of what's wrong",
      "suggestedFix": "string — compliant rewrite or fix"
    }
  ],
  "passedChecks": [
    {
      "category": "string — category that passed",
      "detail": "string — brief note on what was verified"
    }
  ],
  "guidelinesApplied": ["string — list of guideline sections that were evaluated"]
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `overallStatus` | `pass` = no errors or warnings; `warn` = warnings only; `fail` = at least one error |
| `summary` | Human-readable summary suitable for display in a banner or toast |
| `score` | 0-100 score: deduct 15 per error, 5 per warning, 1 per info finding |
| `violations` | Array of specific issues found, empty if fully compliant |
| `passedChecks` | Categories that were checked and found compliant — provides positive signal |
| `guidelinesApplied` | Which sections of the brand guidelines were actually used in the evaluation |

### Severity Levels

| Severity | Meaning | Score Impact |
|----------|---------|--------------|
| `error` | Must fix — content violates a hard brand rule | -15 |
| `warning` | Should fix — content is borderline or inconsistent | -5 |
| `info` | Consider — minor suggestion for improvement | -1 |

## Output Format

Wrap the JSON in a `brand-compliance-json` code fence:

````
```brand-compliance-json
{
  "overallStatus": "warn",
  "summary": "Content mostly compliant but 2 terminology warnings found in homepage hero copy.",
  "score": 90,
  "violations": [
    {
      "field": "Homepage > Hero Banner > headline",
      "category": "terminology",
      "severity": "warning",
      "rule": "Avoid superlatives like 'best' or 'greatest' without substantiation",
      "currentText": "The Best Deals of the Season",
      "issue": "Unsubstantiated superlative 'Best' violates brand claim guidelines",
      "suggestedFix": "Unbeatable Deals This Season"
    },
    {
      "field": "Homepage > Hero Banner > body",
      "category": "tone_voice",
      "severity": "warning",
      "rule": "Brand voice should be conversational, not formal",
      "currentText": "We cordially invite you to peruse our offerings.",
      "issue": "Overly formal tone does not match brand's conversational voice",
      "suggestedFix": "Check out what's new — handpicked for you."
    }
  ],
  "passedChecks": [
    {
      "category": "legal",
      "detail": "Trademark symbol present on brand name references"
    },
    {
      "category": "format",
      "detail": "Headlines under 10 words, CTAs under 4 words"
    },
    {
      "category": "inclusive_language",
      "detail": "No exclusionary language detected"
    }
  ],
  "guidelinesApplied": ["Voice & Tone", "Terminology", "Legal Requirements", "Copy Length Standards"]
}
```
````

You may include conversational text before or after the code fence. Before the fence,
provide a brief narrative analysis. After the fence, offer to fix violations or
regenerate non-compliant content.

## Company Context Integration

When company context is available (auto-injected via `<company-context>` tags),
extend the compliance check with these additional categories:

1. **Regulatory compliance.** Check content against
   `regulatoryFrameworks.copyImplications`. Flag violations as `severity: "error"`
   with `category: "legal"`. For example, if FTC Guidelines require disclosure
   of material connections, flag influencer-style copy missing disclosures.
2. **Competitor differentiation.** Check that messaging does not inadvertently
   mirror `competitors.valueProps`. Flag copy that uses a competitor's key
   language as `severity: "warning"` with `category: "messaging"`. Suggest
   rewrites that emphasize the company's `differentiators` instead.
3. **Persona alignment.** If the campaign targets a specific persona from
   `personas`, verify that tone and messaging angle match the persona's
   `messagingAngle` and `preferredChannels`. Flag mismatches as
   `severity: "info"` with `category: "tone_voice"`.

Include these checks in `guidelinesApplied` (e.g., "Regulatory: FTC Guidelines",
"Competitor Differentiation", "Persona Alignment").

## Quality Rules

1. **Never invent guidelines.** Only flag violations against rules explicitly stated in
   the provided brand guidelines. If no guidelines are provided, ask for them before
   producing a compliance report.
2. **Be specific in `field`.** Use the format `Page > Spot > field` when checking wizard
   content (e.g., `Homepage > Hero Banner > headline`). Use descriptive labels for
   free-form content.
3. **Always provide a `suggestedFix`.** Every violation must include a concrete rewrite
   that resolves the issue while preserving the original intent.
4. **Include `passedChecks`.** Always report what passed, not just what failed. This
   gives the user confidence that the review was thorough.
5. **Score must be consistent.** Start at 100 and deduct per the severity table. Never
   go below 0.
6. **Offer to fix.** After the report, offer to automatically rewrite non-compliant
   content and update the wizard content configuration if violations were found.
7. **Handle missing guidelines gracefully.** If the user asks for a compliance check
   but hasn't provided brand guidelines, respond conversationally asking them to
   paste or upload their brand guidelines before generating the report.
8. **Respect content context.** Consider the campaign objective and target audience
   when evaluating tone — a Gen Z campaign may deliberately use informal language that
   would be flagged in a B2B context.
