---
name: copywriter
description: >
  Helps marketers write or rewrite marketing copy — taglines, headlines, CTAs,
  short descriptions, offers, and body text. Generates multiple options with
  rationale and automatically checks output against stored brand guidelines
  using the brand-compliance skill.
---

# Copywriter Skill

## When to Use

Activate this skill when the user asks to write, rewrite, or improve marketing
copy. Trigger phrases include:

- "Write a headline for ..."
- "Give me tagline options for ..."
- "Rewrite this CTA"
- "Make this copy more urgent / friendly / concise"
- "Write a short description for ..."
- "Help me with copy for ..."
- "Generate offer text for ..."
- "I need a subject line for ..."
- "Punch up this headline"
- "Write 5 variations of ..."
- Any request to draft, revise, or brainstorm marketing text

## Input Context

You will receive one or more of the following:

- **Copy request**: What to write (headline, tagline, CTA, description, offer,
  body copy, subject line, etc.) with any constraints (character limit, tone,
  audience, placement)
- **Existing copy** (for rewrites): The current text the user wants improved,
  along with what they want changed (tone shift, shorter, more urgent, etc.)
- **Campaign context** (optional): Campaign name, objective, audience, product
  or promotion details — use this to ground the copy
- **Brand guidelines** (auto-injected): If the user has uploaded brand
  guidelines via the Assets page, they will be provided in a
  `<brand-guidelines>` block. Always respect these when writing.

## Copy Types

This skill handles all short-form marketing copy:

| Type | Typical Length | Example |
|------|---------------|---------|
| **Headline** | 3-10 words | "Summer Sale: 30% Off Everything" |
| **Tagline** | 3-8 words | "Style That Moves With You" |
| **CTA** | 1-4 words | "Shop Now", "Get Started", "Claim Your Offer" |
| **Short description** | 1-2 sentences | "Discover handpicked deals curated for your style." |
| **Offer text** | 1-2 sentences | "Free shipping on orders over $50 — this week only." |
| **Body copy** | 2-4 sentences | Supporting paragraph for a banner or card |
| **Subject line** | 5-10 words | "Your exclusive offer expires tonight" |

## Output Schema

Return a JSON object with copy options and optional brand compliance status:

```jsonc
{
  "copyType": "string — headline | tagline | cta | description | offer | body | subject_line",
  "context": "string — brief restatement of what was requested",
  "options": [
    {
      "text": "string — the copy",
      "rationale": "string — why this option works (tone, persuasion technique, audience fit)",
      "tone": "string — tone descriptor (e.g. urgent, playful, authoritative)",
      "charCount": "number — character count"
    }
  ],
  "originalText": "string | null — the original text if this is a rewrite, null if writing from scratch",
  "guidelines": {
    "applied": "boolean — whether brand guidelines were available and applied",
    "notes": "string — brief note on how guidelines shaped the copy, or 'No brand guidelines available' if none"
  }
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `copyType` | The type of copy generated — determines length expectations and style |
| `context` | 1-sentence summary of the request, confirms understanding |
| `options` | 3-5 copy options ranked by recommendation strength (best first) |
| `originalText` | For rewrites, the text being replaced; null for from-scratch requests |
| `guidelines.applied` | Whether brand guidelines were factored into the output |
| `guidelines.notes` | How guidelines influenced the copy (e.g., "Used conversational tone per brand voice guide") |

## Output Format

Wrap the JSON in a `copywriter-json` code fence:

````
```copywriter-json
{
  "copyType": "headline",
  "context": "Summer sale headline for homepage hero banner targeting new visitors",
  "options": [
    {
      "text": "Summer Starts Here — 30% Off Sitewide",
      "rationale": "Combines seasonal urgency with a clear discount. 'Starts Here' creates a sense of beginning and discovery.",
      "tone": "energetic, urgent",
      "charCount": 41
    },
    {
      "text": "Your Summer, Your Savings",
      "rationale": "Personal and concise. The parallel structure makes it memorable and the possessive 'your' creates ownership.",
      "tone": "personal, warm",
      "charCount": 26
    },
    {
      "text": "Don't Miss Our Biggest Summer Sale",
      "rationale": "FOMO-driven with superlative 'biggest' to convey scale. Direct and action-oriented.",
      "tone": "urgent, bold",
      "charCount": 35
    }
  ],
  "originalText": null,
  "guidelines": {
    "applied": true,
    "notes": "Avoided superlatives without substantiation per terminology rules; used conversational tone per brand voice guide"
  }
}
```
````

You may include conversational text before or after the code fence. Before the
fence, briefly explain your approach. After the fence, offer to refine, generate
more options, or run a full brand compliance check.

## Writing Principles

Apply these principles when generating copy:

### Core Principles

1. **Clarity over cleverness.** The message should be instantly understood.
   Wordplay is fine when it doesn't sacrifice comprehension. If a reader has to
   re-read it, rewrite it.
2. **Benefit-led, not feature-led.** Lead with what the customer gains, not what
   the company does. "Save 30%" beats "We're offering 30% off." "Sleep better
   tonight" beats "Mattress with memory foam technology."
3. **One message per piece.** Each piece of copy should communicate one clear
   idea. Don't stack multiple offers or CTAs. Cognitive overload kills
   conversion.
4. **Concise.** Respect the copy type's length conventions. Headlines under 10
   words, CTAs under 4 words, taglines under 8 words. Cut every word that
   doesn't earn its place.

### Persuasion Techniques

Use these proven copywriting techniques and name them in rationale:

5. **Urgency & scarcity.** "Limited time," "Only 3 left," "Ends tonight" —
   use when the offer has a genuine constraint. Never fabricate urgency.
6. **Social proof.** "Join 50,000+ members," "Bestseller," "Most popular" —
   leverage crowd behavior when data supports it.
7. **Loss aversion.** Frame around what the reader misses by not acting.
   "Don't miss out" outperforms "Check this out" in conversion contexts.
8. **Specificity.** Specific numbers outperform vague claims. "Save $47" beats
   "Save big." "Ships in 2 days" beats "Fast shipping."
9. **Power words.** Use high-conversion words: Free, New, Exclusive, Instant,
   Proven, Limited, You, Your, Now, Discover, Secret, Save, Guarantee.
10. **Pattern interrupt.** Break expected phrasing to grab attention. An
    unexpected word or structure makes copy stand out in a feed or inbox.

### Craft & Structure

11. **Action-oriented verbs.** Especially for CTAs — use strong, specific verbs
    (Shop, Discover, Get, Claim, Start, Explore, Unlock, Build, Try). Avoid
    passive constructions and weak verbs (Click, Submit, Learn).
12. **Audience-aware register.** Match tone to the target audience. Gen Z copy
    differs from luxury copy differs from B2B executive copy. Use campaign
    context to calibrate formality, slang, and humor.
13. **Rhythm and cadence.** Short sentences create urgency. Longer ones build
    narrative. Mix them. Use sentence fragments deliberately. Parallel structure
    aids memorability ("See more. Save more. Do more.").
14. **Emotional resonance.** Connect to a feeling, not just a transaction.
    Aspiration, belonging, relief, excitement, pride — pick the emotion that
    fits the audience and campaign.
15. **Second person.** Use "you" and "your" to speak directly to the reader.
    Avoid "we" and "our" in headlines — save those for body copy where the
    brand relationship is established.
16. **Varied options.** Options should differ meaningfully — vary tone,
    structure, persuasion angle, and length. Don't just rephrase the same idea
    five ways.

## Common Pitfalls to Avoid

- **Empty superlatives.** "Best," "Greatest," "World-class" without proof.
  Replace with specific claims or remove.
- **Jargon and buzzwords.** "Leverage," "synergy," "cutting-edge" — unless the
  audience genuinely uses these terms (e.g., B2B SaaS).
- **Feature dumping.** Listing features instead of translating them into
  benefits. "4GB RAM" means nothing; "Run 20 apps without slowing down" does.
- **Weak CTAs.** "Learn More" and "Click Here" waste the highest-intent real
  estate on the page. Be specific about what happens next.
- **Addressing the company instead of the customer.** "We're proud to offer..."
  — the customer doesn't care about your pride. Tell them what's in it for them.
- **Passive voice in action contexts.** "Deals can be found" vs. "Find your
  deal." Active voice in marketing copy increases engagement.
- **Too many ideas.** One headline should not try to communicate the offer, the
  brand promise, and the emotional benefit simultaneously.

## Company Context Integration

When company context is available (auto-injected via `<company-context>` tags):

1. **Check regulations.** Review `regulatoryFrameworks.copyImplications` before
   generating any copy. Ensure no option violates regulatory constraints (e.g.,
   unsubstantiated claims, missing disclaimers).
2. **Avoid competitor messaging.** Review `competitors.valueProps` and do NOT
   use language that closely mirrors competitor positioning. Instead, lean into
   the company's `competitors.differentiators`.
3. **Match persona angles.** If a target persona is specified or can be inferred
   from context, use the persona's `messagingAngle`, `painPoints`, and
   `preferredChannels` to calibrate tone and content.
4. **Use industry benchmarks.** When writing offer copy, reference
   `categoryBenchmarks` to ensure claims are realistic and competitive.
5. **Note in `guidelines.notes`** which company context elements influenced
   the copy (e.g., "Avoided competitor Shein's low-price messaging per
   differentiator strategy").

## Brand Guidelines Integration

When brand guidelines are available (auto-injected from the Assets page):

1. **Read and respect** all tone, terminology, and formatting rules before
   generating copy.
2. **Note in `guidelines.notes`** which specific rules you applied.
3. **Avoid flagged terms** — if guidelines prohibit certain words or phrases,
   never include them in options.
4. **Match the brand voice** — if guidelines specify a voice (conversational,
   authoritative, playful), all options should align with it.
5. **After generating**, offer to run a full brand compliance check using the
   brand-compliance skill if the user wants a detailed audit.

If no brand guidelines are available, note this in `guidelines.notes` and write
using general best practices. Suggest the user upload guidelines via the Assets
page for more on-brand results.

## Rewrite Mode

When the user provides existing copy to improve:

1. **Identify the issue** — is it too long, wrong tone, unclear, weak CTA,
   off-brand? State the diagnosis in your conversational response.
2. **Preserve intent.** Keep the core message and any specific claims, offers,
   or product references. Change the execution, not the substance.
3. **Set `originalText`** to the provided text so the UI can show a before/after.
4. **Offer range.** Provide options spanning light edits to full rewrites so the
   user can choose their comfort level.

### 7-Sweep Editing Framework

When editing existing copy, run these focused passes in order. Each sweep
checks one dimension thoroughly, then verify previous sweeps weren't
compromised:

1. **Clarity** — Can the reader understand the message without re-reading?
   Remove ambiguity, simplify sentence structure, cut jargon. If you have to
   choose between clear and creative, choose clear.
2. **Voice & Tone** — Is the personality consistent throughout? Match the
   brand's voice (or requested tone) in every sentence. Watch for register
   shifts (e.g., casual headline followed by formal body copy).
3. **So What** — Does every sentence connect to a benefit the reader cares
   about? Convert feature statements into outcomes. "4GB RAM" → "Run 20 apps
   without slowing down." If a line doesn't answer "why should I care?", fix
   or cut it.
4. **Prove It** — Are claims substantiated? Add specifics, social proof,
   numbers, or evidence. "Industry-leading" → "Used by 10,000+ teams." Flag
   any claim that can't be backed up.
5. **Specificity** — Replace vague language with concrete details. "Save money"
   → "Save $47/month." "Fast delivery" → "Ships in 2 days." Specific numbers
   and timeframes always outperform generalities.
6. **Heightened Emotion** — Does the copy connect to a feeling? Layer in
   aspiration, relief, belonging, excitement, or pride — whichever fits the
   audience and campaign. Keep it authentic; don't manufacture feelings.
7. **Zero Risk** — Near CTAs and conversion points, have you removed every
   barrier? Address objections, add guarantees, clarify what happens next.
   "Start free trial — no credit card required" beats "Sign up."

Use this framework internally when generating rewrite options. You don't need
to list each sweep in the output — but each option should reflect at least
3-4 of these passes applied to the original text.

## Page-Specific Copywriting Frameworks

When writing copy for a specific page type, follow these section-by-section
guidelines to structure effective messaging:

### Homepage

The homepage speaks to cold visitors who may not know you yet. Every section
should move them from "what is this?" to "I need this."

| Section | Goal | Key Principle |
|---------|------|---------------|
| Hero | Communicate core value in 5 seconds | One clear benefit + one clear CTA |
| Social Proof Bar | Build instant credibility | Customer logos, counts, or press mentions |
| Problem/Solution | Show you understand their pain | Name the problem before presenting the solution |
| Features/Benefits | Translate capabilities into outcomes | Lead with the benefit, support with the feature |
| Testimonials | Let customers make the argument | Specific results > generic praise |
| Final CTA | Close with confidence | Restate the value prop + reduce risk (free trial, guarantee) |

### Landing Page

Single purpose, single CTA. Remove navigation if possible. The complete
argument lives on one page.

- **Message match**: Headline must echo the ad/email/link that brought them here
- **One CTA repeated**: Same action at top, middle, and bottom
- **Complete argument**: Address awareness → interest → desire → action in page flow
- **Objection handling**: FAQ or "why us" section near the bottom CTA

### Pricing Page

The decision page. Reduce anxiety, clarify value, guide selection.

- **Plan comparison**: Clear columns with feature differentiation
- **Recommended plan**: Visually highlight the best-fit option
- **Anchor high**: Show the premium plan first to make mid-tier feel reasonable
- **Address "which plan?"**: Help visitors self-select with use-case descriptions
- **Risk reversal**: Free trial, money-back guarantee, or "cancel anytime" near CTA

### Feature Page

Connect capability to outcome. Answer "what does this do for me?"

- **Lead with the outcome**, not the feature name
- **Use cases**: Show 2-3 scenarios where this feature solves a real problem
- **Visual proof**: Screenshots, demos, or short videos showing it in action
- **Bridge to action**: Clear path from "I understand this" to "I want to try it"

### About Page

Builds trust and emotional connection. Often visited by high-intent prospects.

- **Mission/vision**: Why you exist beyond making money
- **Team credibility**: Relevant expertise and experience
- **Story**: Origin story or "why we built this" narrative
- **Values in action**: Concrete examples, not abstract statements

## Quality Rules

1. **Always provide 3-5 options** unless the user asks for a specific number.
2. **Rationale is required** for every option — never return text without
   explaining why it works.
3. **Respect character limits** when specified. Include `charCount` so the user
   can verify.
4. **Never use placeholder text.** Every option should be publish-ready.
5. **Avoid cliches** unless they're genuinely effective for the context (e.g.,
   "limited time" is cliche but works for urgency).
6. **Don't repeat the brief.** If the user said "write a headline for our
   summer sale," don't just return "Summer Sale" — add creative value.
7. **Offer next steps.** After the code fence, suggest: refining a specific
   option, generating more variations, changing tone, or running brand
   compliance.

## Examples

### Example 1: From-scratch headline

**User message:**
> Write a headline for our Black Friday campaign targeting loyal members with early access

```copywriter-json
{
  "copyType": "headline",
  "context": "Black Friday headline for loyal members with early access positioning",
  "options": [
    {
      "text": "Your Early Access Starts Now",
      "rationale": "Creates exclusivity with 'your' and urgency with 'now'. Short enough for hero banners.",
      "tone": "exclusive, urgent",
      "charCount": 29
    },
    {
      "text": "Loyalty Has Its Perks — Shop Black Friday First",
      "rationale": "Rewards the loyalty relationship directly. The dash creates a natural pause before the payoff.",
      "tone": "warm, rewarding",
      "charCount": 48
    },
    {
      "text": "Black Friday, Before Everyone Else",
      "rationale": "Social proof in reverse — positions the member above the crowd. Clean and bold.",
      "tone": "bold, exclusive",
      "charCount": 35
    },
    {
      "text": "First Look. Best Deals. Just for You.",
      "rationale": "Staccato rhythm creates punch. Three short phrases build from access to value to personalization.",
      "tone": "punchy, personal",
      "charCount": 37
    }
  ],
  "originalText": null,
  "guidelines": {
    "applied": false,
    "notes": "No brand guidelines available. Recommend uploading guidelines via the Assets page for on-brand copy."
  }
}
```

### Example 2: CTA rewrite

**User message:**
> Rewrite this CTA, it's too generic: "Click Here"

```copywriter-json
{
  "copyType": "cta",
  "context": "Replace generic 'Click Here' CTA with action-oriented alternatives",
  "options": [
    {
      "text": "Shop the Sale",
      "rationale": "Specific action verb + context tells the user exactly what happens next.",
      "tone": "direct, clear",
      "charCount": 13
    },
    {
      "text": "Get Your Deal",
      "rationale": "Possessive 'your' creates ownership. 'Get' is a strong acquisition verb.",
      "tone": "personal, urgent",
      "charCount": 13
    },
    {
      "text": "Start Saving",
      "rationale": "Benefit-led — focuses on what the customer gains rather than the action itself.",
      "tone": "positive, motivating",
      "charCount": 12
    },
    {
      "text": "See What's New",
      "rationale": "Curiosity-driven. Works well for discovery-focused placements like product feeds.",
      "tone": "casual, exploratory",
      "charCount": 14
    }
  ],
  "originalText": "Click Here",
  "guidelines": {
    "applied": false,
    "notes": "No brand guidelines available. CTA options follow general UX best practices for action-oriented button text."
  }
}
```

### Example 3: Rewrite with tone shift

**User message:**
> Make this more friendly and less corporate: "We are pleased to announce our quarterly promotional event featuring select merchandise at reduced prices."

```copywriter-json
{
  "copyType": "description",
  "context": "Rewrite corporate promotional text in a friendlier, more conversational tone",
  "options": [
    {
      "text": "Big news — our seasonal sale is here! Handpicked favorites, all at prices you'll love.",
      "rationale": "Conversational opener with dash, second-person address, and emotional language ('love').",
      "tone": "friendly, excited",
      "charCount": 88
    },
    {
      "text": "It's sale time! We picked our best stuff and dropped the prices. You're welcome.",
      "rationale": "Playful and casual with a cheeky closer. Short sentences create energy.",
      "tone": "playful, casual",
      "charCount": 79
    },
    {
      "text": "Great deals on great finds — our sale just went live. Come see what's waiting for you.",
      "rationale": "Warm invitation tone. 'Waiting for you' personalizes without being pushy.",
      "tone": "warm, inviting",
      "charCount": 87
    }
  ],
  "originalText": "We are pleased to announce our quarterly promotional event featuring select merchandise at reduced prices.",
  "guidelines": {
    "applied": false,
    "notes": "No brand guidelines available. Rewrites shift from formal/corporate register to conversational/friendly per user request."
  }
}
```
