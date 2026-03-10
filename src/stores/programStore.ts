/**
 * Program Store — Zustand store managing PaidMediaProgram lifecycle.
 *
 * A program is a lightweight envelope holding references to existing artifacts
 * (briefs, blueprints, launch configs) and tracking step completion.
 */

import { create } from 'zustand';
import type {
  PaidMediaProgram,
  ProgramStepId,
  ProgramStatus,
  ProgramStep,
  ProgramChannelConfig,
  ChannelPlatform,
} from '../types/program';
import { programStorage } from '../services/programStorage';
import { launchConfigStorage } from '../services/launchConfigStorage';
import { chatHistoryStorage } from '../services/chatHistoryStorage';
import { resetProgramStores } from '../utils/resetProgramState';
import { useBriefEditorStore } from './briefEditorStore';
import { useBlueprintStore } from './blueprintStore';
import { useCampaignLaunchStore } from './campaignLaunchStore';
import { useChatStore } from './chatStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `prog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultSteps(): ProgramStep[] {
  return [
    { stepId: 1, label: 'Campaign Brief', status: 'pending' },
    { stepId: 2, label: 'Blueprint', status: 'pending' },
    { stepId: 3, label: 'Campaign Configuration', status: 'pending' },
    { stepId: 4, label: 'Review & Launch', status: 'pending' },
  ];
}

function defaultChannels(): ProgramChannelConfig[] {
  return [
    { platform: 'meta', enabled: true, launchConfigIds: [], isConfigured: false },
    { platform: 'google', enabled: false, launchConfigIds: [], isConfigured: false },
    { platform: 'tiktok', enabled: false, launchConfigIds: [], isConfigured: false },
    { platform: 'snapchat', enabled: false, launchConfigIds: [], isConfigured: false },
    { platform: 'pinterest', enabled: false, launchConfigIds: [], isConfigured: false },
  ];
}

/** Try to derive a meaningful program name from a serialized brief snapshot. */
function deriveProgramName(snapshotJson: string): string | undefined {
  try {
    const data = JSON.parse(snapshotJson) as Record<string, unknown>;
    const cd = data.campaignDetails;
    if (typeof cd === 'object' && cd !== null && 'campaignName' in cd) {
      const name = (cd as Record<string, string>).campaignName;
      if (name?.trim()) return name.trim().slice(0, 80);
    }
    if (typeof cd === 'string' && cd.trim()) {
      return cd.trim().split(/\s*[—–-]\s*/)[0].slice(0, 80);
    }
    const fallback = (data.brandProduct as string) || (data.businessObjective as string);
    if (fallback?.trim()) return fallback.trim().slice(0, 80);
  } catch {
    // Corrupt snapshot
  }
  return undefined;
}

// ── Demo Programs ────────────────────────────────────────────────────────────

const DEMO_BRIEF_SPRING = {
  campaignDetails: 'Spring Collection Launch',
  brandProduct: 'Spring 2026 Fashion Collection',
  businessObjective: 'Drive conversions for seasonal collection launch across Meta, Google, and TikTok',
  businessObjectiveTags: ['conversions', 'seasonal'],
  primaryGoals: ['Increase online sales by 25%', 'Drive foot traffic to stores'],
  secondaryGoals: ['Build email subscriber list', 'Grow social following'],
  primaryKpis: ['ROAS', 'Conversions', 'CPA'],
  secondaryKpis: ['CTR', 'Reach', 'Engagement Rate'],
  inScope: ['Paid social', 'Search ads', 'Display retargeting'],
  outOfScope: ['Organic social', 'Email marketing'],
  primaryAudience: ['Fashion-forward women 25-44', 'Previous customers'],
  secondaryAudience: ['Lookalike audiences', 'Interest-based: fashion & lifestyle'],
  mandatoryChannels: ['Meta', 'Google'],
  optionalChannels: ['TikTok'],
  budgetAmount: '$45,000',
  pacing: 'Even distribution over campaign duration',
  phases: '',
  prospectingSegments: ['Fashion enthusiasts', 'Seasonal shoppers'],
  retargetingSegments: ['Cart abandoners', 'Past purchasers'],
  suppressionSegments: ['Recent converters (30 days)'],
  timelineStart: '2026-02-10',
  timelineEnd: '2026-04-15',
};

const DEMO_BRIEF_AWARENESS = {
  campaignDetails: 'Brand Awareness Q1',
  brandProduct: 'Brand Portfolio',
  businessObjective: 'Increase brand visibility and top-of-mind awareness across YouTube, Meta, and Display',
  businessObjectiveTags: ['awareness', 'brand'],
  primaryGoals: ['Achieve 5M+ reach', 'Increase unaided awareness by 8 pts'],
  secondaryGoals: ['Grow social engagement', 'Drive site traffic'],
  primaryKpis: ['Reach', 'Brand Lift', 'Ad Recall'],
  secondaryKpis: ['Impressions', 'Video Views', 'Engagement'],
  inScope: ['YouTube pre-roll', 'Meta video ads', 'Display banners'],
  outOfScope: ['Search ads', 'Email'],
  primaryAudience: ['Adults 18-54', 'Category buyers'],
  secondaryAudience: ['Lapsed customers', 'Competitor audiences'],
  mandatoryChannels: ['YouTube', 'Meta'],
  optionalChannels: ['Display'],
  budgetAmount: '$75,000',
  pacing: 'Front-loaded first 2 weeks',
  phases: '',
  prospectingSegments: ['In-market buyers', 'Interest-based audiences'],
  retargetingSegments: ['Site visitors (90 days)'],
  suppressionSegments: ['Recent purchasers'],
  timelineStart: '2026-01-15',
  timelineEnd: '2026-03-31',
};

const DEMO_BRIEF_PRODUCT = {
  campaignDetails: 'Product V2 Launch',
  brandProduct: 'Product V2',
  businessObjective: 'Drive awareness and consideration for new product launch across Meta, Google, LinkedIn, and TikTok',
  businessObjectiveTags: ['awareness', 'product launch'],
  primaryGoals: ['Generate 2M impressions in first week', 'Drive 50K landing page visits'],
  secondaryGoals: ['Capture 5K email sign-ups', 'Generate PR coverage'],
  primaryKpis: ['Impressions', 'Landing Page Views', 'Sign-ups'],
  secondaryKpis: ['CTR', 'Social Shares', 'Engagement Rate'],
  inScope: ['Meta ads', 'Google search & display', 'LinkedIn sponsored content', 'TikTok ads'],
  outOfScope: ['Influencer marketing', 'Offline channels'],
  primaryAudience: ['Early adopters 25-40', 'Tech-savvy professionals'],
  secondaryAudience: ['Industry influencers', 'Existing user base'],
  mandatoryChannels: ['Meta', 'Google'],
  optionalChannels: ['LinkedIn', 'TikTok'],
  budgetAmount: '$120,000',
  pacing: 'Heavy launch week, then sustained',
  phases: '',
  prospectingSegments: ['Tech early adopters', 'Competitor users'],
  retargetingSegments: ['Beta testers', 'Waitlist sign-ups'],
  suppressionSegments: ['Existing V1 power users'],
  timelineStart: '2026-03-10',
  timelineEnd: '2026-04-30',
};

const DEMO_BRIEF_SUMMER = {
  campaignDetails: 'Summer Campaign 2026',
  brandProduct: 'Summer Collection',
  businessObjective: 'Summer seasonal push across all major channels',
  businessObjectiveTags: ['conversions', 'seasonal', 'multi-channel'],
  primaryGoals: ['Achieve $1M in summer sales', 'Reach 10M unique users'],
  secondaryGoals: ['Build retargeting pools', 'Test Pinterest as new channel'],
  primaryKpis: ['Revenue', 'ROAS', 'Reach'],
  secondaryKpis: ['CPA', 'Frequency', 'Engagement'],
  inScope: ['Meta ads', 'Google ads', 'TikTok ads', 'Pinterest ads'],
  outOfScope: ['Email', 'Organic social'],
  primaryAudience: ['Summer shoppers 18-55', 'Outdoor enthusiasts'],
  secondaryAudience: ['Travel planners', 'Family decision-makers'],
  mandatoryChannels: ['Meta', 'Google'],
  optionalChannels: ['TikTok', 'Pinterest'],
  budgetAmount: '$200,000',
  pacing: 'Ramp up May, peak June-July',
  phases: '',
  prospectingSegments: ['Summer travelers', 'Outdoor activity seekers'],
  retargetingSegments: ['Previous summer buyers', 'Newsletter subscribers'],
  suppressionSegments: ['Recent purchasers (14 days)'],
  timelineStart: '2026-05-01',
  timelineEnd: '2026-07-31',
};

/** Demo blueprint data for seeding into blueprint store */
export const DEMO_BLUEPRINTS = [
  {
    id: 'demo-bp-spring',
    name: 'Spring Collection Launch — Balanced',
    variant: 'balanced' as const,
    confidence: 'High' as const,
    channels: ['Meta', 'Google', 'TikTok'],
    channelAllocations: [
      { name: 'Meta Ads', budgetPercent: 50, budgetAmount: '$22,500', role: 'Primary conversion driver', formats: ['Carousel', 'Static', 'Stories'] },
      { name: 'Google Ads', budgetPercent: 35, budgetAmount: '$15,750', role: 'Search capture + Shopping', formats: ['Search', 'Shopping', 'Display'] },
      { name: 'TikTok', budgetPercent: 15, budgetAmount: '$6,750', role: 'Younger demo reach', formats: ['In-Feed', 'Spark Ads'] },
    ],
    audiences: ['Fashion-forward women 25-44', 'Previous customers', 'Lookalike audiences'],
    budget: { amount: '$45,000', pacing: 'Even distribution over 9 weeks' },
    metrics: { reach: '2.4M', ctr: '2.4%', roas: '4.1x', conversions: '12,450' },
    messaging: 'Refresh your wardrobe — the Spring 2026 collection is here. Premium fabrics, modern silhouettes, timeless style.',
    cta: 'Shop the Collection',
    creativeBrief: {
      primaryAngle: 'Seasonal refresh with premium quality emphasis',
      confidence: 'High',
      supportingMessages: ['Limited edition pieces', 'Free shipping over $100', 'New arrivals weekly'],
      recommendedFormats: ['Carousel (product showcase)', 'Static (hero imagery)', 'Stories (behind-the-scenes)'],
      fatigueRisk: ['High frequency on Meta carousel after week 4'],
      refreshPlan: ['Rotate hero imagery bi-weekly', 'Introduce UGC content in week 5'],
    },
  },
  {
    id: 'demo-bp-awareness',
    name: 'Brand Awareness Q1 — Balanced',
    variant: 'balanced' as const,
    confidence: 'High' as const,
    channels: ['YouTube', 'Meta', 'Display'],
    channelAllocations: [
      { name: 'YouTube', budgetPercent: 40, budgetAmount: '$30,000', role: 'Video reach & brand lift', formats: ['Pre-roll', 'Bumper ads'] },
      { name: 'Meta Ads', budgetPercent: 35, budgetAmount: '$26,250', role: 'Social engagement & reach', formats: ['Video', 'Carousel', 'Stories'] },
      { name: 'Display Network', budgetPercent: 25, budgetAmount: '$18,750', role: 'Contextual reach on premium publishers', formats: ['Banner', 'Rich Media'] },
    ],
    audiences: ['Adults 18-54', 'Category buyers', 'Lapsed customers'],
    budget: { amount: '$75,000', pacing: 'Front-loaded first 2 weeks' },
    metrics: { reach: '5.1M', ctr: '2.6%', roas: '3.2x', conversions: '8,230' },
    messaging: 'Discover what sets us apart. Quality you can trust, experiences you\'ll remember.',
    cta: 'Learn More',
    creativeBrief: {
      primaryAngle: 'Brand trust and quality differentiation',
      confidence: 'High',
      supportingMessages: ['Award-winning quality', 'Trusted by millions', 'Join the community'],
      recommendedFormats: ['Video (15s & 30s)', 'Static banners', 'Rich media interactive'],
      fatigueRisk: ['Video completion rates may drop after week 6'],
      refreshPlan: ['New video cut at week 4', 'Seasonal overlay at week 8'],
    },
  },
  {
    id: 'demo-bp-product',
    name: 'Product V2 Launch — Aggressive',
    variant: 'aggressive' as const,
    confidence: 'Medium' as const,
    channels: ['Meta', 'Google', 'LinkedIn', 'TikTok'],
    channelAllocations: [
      { name: 'Meta Ads', budgetPercent: 35, budgetAmount: '$42,000', role: 'Broad awareness + retargeting', formats: ['Video', 'Carousel', 'Lead Forms'] },
      { name: 'Google Ads', budgetPercent: 30, budgetAmount: '$36,000', role: 'Search capture + YouTube', formats: ['Search', 'YouTube Pre-roll', 'Discovery'] },
      { name: 'LinkedIn', budgetPercent: 20, budgetAmount: '$24,000', role: 'B2B decision-makers', formats: ['Sponsored Content', 'Message Ads'] },
      { name: 'TikTok', budgetPercent: 15, budgetAmount: '$18,000', role: 'Viral reach + Gen Z', formats: ['In-Feed', 'TopView'] },
    ],
    audiences: ['Early adopters 25-40', 'Tech-savvy professionals', 'Industry influencers'],
    budget: { amount: '$120,000', pacing: 'Heavy launch week, then sustained' },
    metrics: { reach: '3.8M', ctr: '3.1%', roas: '2.8x', conversions: '15,000' },
    messaging: 'The next generation is here. Faster, smarter, built for what\'s next.',
    cta: 'Get Early Access',
    creativeBrief: {
      primaryAngle: 'Innovation and next-generation capabilities',
      confidence: 'Medium',
      supportingMessages: ['2x faster performance', 'Seamless integration', 'Early adopter exclusive pricing'],
      recommendedFormats: ['Product demo video', 'Feature comparison carousel', 'Testimonial stories'],
      fatigueRisk: ['Launch hype may plateau after week 2'],
      refreshPlan: ['Customer testimonial content at week 3', 'Case study series at week 5'],
    },
  },
  {
    id: 'demo-bp-summer',
    name: 'Summer Campaign 2026 — Balanced',
    variant: 'balanced' as const,
    confidence: 'High' as const,
    channels: ['Meta', 'Google', 'TikTok', 'Pinterest'],
    channelAllocations: [
      { name: 'Meta Ads', budgetPercent: 40, budgetAmount: '$80,000', role: 'Primary conversion driver', formats: ['Carousel', 'Video', 'Stories'] },
      { name: 'Google Ads', budgetPercent: 30, budgetAmount: '$60,000', role: 'Search capture + Shopping', formats: ['Search', 'Shopping', 'YouTube'] },
      { name: 'TikTok', budgetPercent: 20, budgetAmount: '$40,000', role: 'Gen Z + viral reach', formats: ['In-Feed', 'Spark Ads', 'TopView'] },
      { name: 'Pinterest', budgetPercent: 10, budgetAmount: '$20,000', role: 'Inspiration + discovery', formats: ['Standard Pins', 'Shopping Pins'] },
    ],
    audiences: ['Summer shoppers 18-55', 'Outdoor enthusiasts', 'Travel planners', 'Family decision-makers'],
    budget: { amount: '$200,000', pacing: 'Ramp up May, peak June-July' },
    metrics: { reach: '10.2M', ctr: '2.8%', roas: '3.6x', conversions: '28,500' },
    messaging: 'Make this summer unforgettable. Shop the hottest deals, gear up for adventure, and discover what\'s new.',
    cta: 'Shop Summer',
    creativeBrief: {
      primaryAngle: 'Seasonal urgency with lifestyle aspiration',
      confidence: 'High',
      supportingMessages: ['Limited-time summer pricing', 'Free shipping on orders over $50', 'New arrivals weekly'],
      recommendedFormats: ['Video (lifestyle montage)', 'Carousel (product showcase)', 'Stories (behind-the-scenes)'],
      fatigueRisk: ['High frequency on Meta after week 6'],
      refreshPlan: ['Rotate creative bi-weekly', 'Introduce UGC content in June', 'Back-to-school pivot in late July'],
    },
  },
];

// ── Demo chat history builder ────────────────────────────────────────────────
// Generates a realistic multi-step conversation that mirrors the full workflow:
// Step 1 (Ideate) → Step 2 (Campaign Plan) → Step 3 (Configure) → Step 4 (Launch)

function buildDemoChatHistory(program: PaidMediaProgram, briefData: Record<string, unknown>): Array<{id: string; role: 'user' | 'assistant'; content: string; timestamp: Date}> {
  const name = (briefData.campaignDetails as string) || program.name;
  const objective = (briefData.businessObjective as string) || 'Drive results';
  const budget = (briefData.budgetAmount as string) || 'TBD';
  const mandatoryChannels = (briefData.mandatoryChannels as string[]) || [];
  const optionalChannels = (briefData.optionalChannels as string[]) || [];
  const allChannels = [...mandatoryChannels, ...optionalChannels].join(', ') || 'Meta, Google';
  const primaryAudience = (briefData.primaryAudience as string[]) || [];
  const secondaryAudience = (briefData.secondaryAudience as string[]) || [];
  const primaryGoals = (briefData.primaryGoals as string[]) || [];
  const primaryKpis = (briefData.primaryKpis as string[]) || [];
  const timelineStart = (briefData.timelineStart as string) || '';
  const timelineEnd = (briefData.timelineEnd as string) || '';
  const pacing = (briefData.pacing as string) || '';
  const base = new Date(program.createdAt).getTime();
  const t = (minutesOffset: number) => new Date(base + minutesOffset * 60_000);
  let i = 0;
  const msg = (role: 'user' | 'assistant', content: string, mins: number) => ({
    id: `${program.id}-msg-${++i}`,
    role,
    content,
    timestamp: t(mins),
  });

  return [
    // ── Step 1: Ideate — Brief Creation ──
    msg('user',
      `I need to create a paid media campaign for "${name}". Here are the key details:\n\n- **Business objective:** ${objective}\n- **Budget:** ${budget}\n- **Mandatory channels:** ${mandatoryChannels.join(', ') || 'TBD'}\n- **Primary audience:** ${primaryAudience.join('; ') || 'TBD'}\n- **Timeline:** ${timelineStart} to ${timelineEnd}`,
      0),
    msg('assistant',
      `I've created your campaign brief for **${name}** and populated the brief editor on the right.\n\nHere's a summary of what I've captured:\n\n| Section | Details |\n|---|---|\n| **Objective** | ${objective} |\n| **Budget** | ${budget} |\n| **Channels** | ${allChannels} |\n| **Primary Audience** | ${primaryAudience.join(', ') || 'To be defined'} |\n| **Timeline** | ${timelineStart} — ${timelineEnd} |\n${pacing ? `| **Pacing** | ${pacing} |` : ''}\n\nPlease review each section in the editor and let me know if you'd like to adjust anything before we move on.`,
      1),
    msg('user',
      `Can you refine the audience targeting? I want to make sure we have clear prospecting and retargeting segments.`,
      4),
    msg('assistant',
      `I've updated the audience strategy with distinct prospecting and retargeting tiers:\n\n**Prospecting (new customers):**\n${primaryAudience.map(a => `- ${a}`).join('\n') || '- Broad interest-based targeting'}\n${secondaryAudience.length > 0 ? `\n**Secondary / Expansion:**\n${secondaryAudience.map(a => `- ${a}`).join('\n')}` : ''}\n\n**Retargeting (warm audiences):**\n- Site visitors (30-day window)\n- Engaged social followers\n- Cart/form abandoners\n\n**Suppression:**\n- Recent converters (14 days)\n\nThe brief editor has been updated. ${primaryGoals.length > 0 ? `This targeting aligns with your primary goals of ${primaryGoals.slice(0, 2).join(' and ')}.` : ''} Click **Generate Plan** when ready.`,
      6),

    // ── Step 2: Campaign Plan — Blueprint Generation ──
    msg('user',
      `The brief looks solid. Generate the campaign plan.`,
      12),
    msg('assistant',
      `I've generated an optimized campaign blueprint for **${name}**.\n\n**Channel Strategy:**\n${mandatoryChannels.map((ch, idx) => `${idx + 1}. **${ch}** — ${idx === 0 ? 'Primary conversion driver' : idx === 1 ? 'Search capture & remarketing' : 'Incremental reach & awareness'}`).join('\n') || '1. **Meta** — Primary driver\n2. **Google** — Search capture'}\n${optionalChannels.length > 0 ? `\n**Optional channels included:** ${optionalChannels.join(', ')}` : ''}\n\n**Predicted Performance:**\n${primaryKpis.length > 0 ? `- Key metrics: ${primaryKpis.join(', ')}` : '- ROAS: 3.5x+ projected'}\n- Estimated reach: 2M+ unique users\n- Budget efficiency: optimized across ${mandatoryChannels.length + optionalChannels.length || 2} channels\n\nReview the blueprint in the panel on the right. You can adjust channel allocations, audience splits, and creative recommendations before approving.`,
      14),
    msg('user',
      `The channel mix looks good. I'd like to increase the Meta allocation slightly — they've been our strongest performer. Then approve.`,
      20),
    msg('assistant',
      `I've adjusted the Meta allocation up by 5 percentage points and rebalanced the remaining channels proportionally. The updated split is reflected in the blueprint.\n\nBlueprint has been **approved** and locked. We're ready to move to campaign configuration.\n\nNext step: I'll generate the Meta Ads configuration with:\n- Campaign structure (objective, budget, buying type)\n- Ad sets with audience targeting & optimization goals\n- Creative variants with headlines and copy\n- Ad combinations mapping creatives to ad sets`,
      22),

    // ── Step 3: Configure & Launch ──
    msg('user',
      `Generate the ad configuration and set everything up for launch.`,
      30),
    msg('assistant',
      `The Meta Ads configuration has been generated from the approved blueprint.\n\n**Campaign:** ${name}\n- Objective: Awareness\n- Daily budget: ${budget ? `based on ${budget} total` : '$500/day'}\n- Buying type: Auction\n\n**Ad Sets (2):**\n1. ${primaryAudience[0] || 'Primary Audience'} — ${pacing || 'Even pacing'}\n2. ${primaryAudience[1] || secondaryAudience[0] || 'Retargeting'} — Optimized delivery\n\n**Creatives (2):**\n- Hero image with primary CTA\n- Carousel showcasing key value props\n\n**Ads (2):**\n- Each creative paired with its target ad set\n\nAll sections are configured and ready. Review the details on the configuration page and click **Launch** when approved.`,
      32),
    msg('user',
      `Looks great — everything checks out. Launch the campaign.`,
      40),

    // ── Step 4: Launched ──
    msg('assistant',
      `**${name}** has been successfully launched! :rocket:\n\n**Launch Summary:**\n- **Status:** Live on Meta\n- **Ad Sets:** 2 active, targeting ${primaryAudience.slice(0, 2).join(' and ') || 'configured audiences'}\n- **Creatives:** 2 active with optimized copy\n- **Ads:** 2 live combinations\n- **Budget:** ${budget} across ${timelineStart} — ${timelineEnd}\n\nYou can track performance in real-time from the **Campaigns** dashboard. I'll monitor key metrics and flag any optimization opportunities as data comes in.`,
      42),
  ];
}

// ── Demo creative placeholder images ─────────────────────────────────────────
// Each generates a 400x400 SVG data-URI with a gradient background,
// icon, headline, and tagline so creatives look realistic in the UI.

function demoCreativeFile(label: string, tagline: string, colors: [string, string]): import('../types/campaignLaunch').CreativeFile {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/></linearGradient></defs><rect width="400" height="400" rx="12" fill="url(#g)"/><circle cx="200" cy="140" r="40" fill="white" opacity="0.15"/><circle cx="200" cy="140" r="24" fill="white" opacity="0.2"/><text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="white">${label}</text><text x="200" y="262" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="white" opacity="0.8">${tagline}</text><rect x="140" y="290" width="120" height="36" rx="18" fill="white" opacity="0.2"/><text x="200" y="314" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="white">Shop Now</text></svg>`;
  const encoded = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return { fileName: `${label.toLowerCase().replace(/\s+/g, '-')}.svg`, filePath: '', fileSize: svg.length, mimeType: 'image/svg+xml', previewUrl: encoded };
}

const DEMO_FILES = {
  springHero:      demoCreativeFile('Spring Collection', 'Refresh your wardrobe', ['#E879A4', '#F4A261']),
  springCarousel:  demoCreativeFile('New Arrivals', 'Premium fabrics', ['#F4A261', '#E76F51']),
  brandTrust:      demoCreativeFile('Brand Trust', 'Quality you can trust', ['#264653', '#2A9D8F']),
  productHero:     demoCreativeFile('Product V2', 'The next generation', ['#3A0CA3', '#4361EE']),
  productCompare:  demoCreativeFile('2x Faster', 'See the comparison', ['#4361EE', '#4CC9F0']),
  summerHero:      demoCreativeFile('Summer 2026', 'Hottest deals', ['#F77F00', '#FCBF49']),
  summerOutdoor:   demoCreativeFile('Adventure Awaits', 'Gear up for summer', ['#06D6A0', '#118AB2']),
};

/** Demo launch config data for seeding into launchConfigStorage */
export const DEMO_LAUNCH_CONFIGS: import('../types/campaignLaunch').SavedLaunchConfig[] = [
  {
    id: 'demo-1',
    name: 'Spring Collection Launch',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
    config: {
      campaign: { name: 'Spring Collection Launch', objective: 'OUTCOME_AWARENESS', dailyBudget: 71400, status: 'ACTIVE', specialAdCategories: [], buyingType: 'AUCTION' },
      adSets: [
        { localId: 'demo-as-1', name: 'Fashion Women 25-44', dailyBudget: 35700, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 25, ageMax: 44 }, status: 'ACTIVE', audienceLabel: 'Fashion-forward women 25-44' },
        { localId: 'demo-as-2', name: 'Previous Customers', dailyBudget: 35700, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 18, ageMax: 65 }, status: 'ACTIVE', audienceLabel: 'Previous customers' },
      ],
      creatives: [
        { localId: 'demo-cr-1', name: 'Spring Hero', headline: 'Shop the Spring Collection', bodyText: 'Refresh your wardrobe with our new arrivals', ctaType: 'SHOP_NOW', linkUrl: 'https://example.com/spring', pageId: 'demo-page-1', file: DEMO_FILES.springHero },
        { localId: 'demo-cr-2', name: 'New Arrivals Carousel', headline: 'New Arrivals Are Here', bodyText: 'Premium fabrics, modern silhouettes', ctaType: 'LEARN_MORE', linkUrl: 'https://example.com/new', pageId: 'demo-page-1', file: DEMO_FILES.springCarousel },
      ],
      ads: [
        { localId: 'demo-ad-1', name: 'Spring Hero - Women 25-44', adSetLocalId: 'demo-as-1', creativeLocalId: 'demo-cr-1', status: 'ACTIVE' },
        { localId: 'demo-ad-2', name: 'Carousel - Previous Customers', adSetLocalId: 'demo-as-2', creativeLocalId: 'demo-cr-2', status: 'ACTIVE' },
      ],
      facebookPages: [],
    },
    platformCampaignId: 'demo-meta-spring',
    isEditMode: true,
    programId: 'demo-prog-1',
    channelPlatform: 'meta',
  },
  {
    id: 'demo-2',
    name: 'Brand Awareness Q1',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
    config: {
      campaign: { name: 'Brand Awareness Q1', objective: 'OUTCOME_AWARENESS', dailyBudget: 107100, status: 'ACTIVE', specialAdCategories: [], buyingType: 'AUCTION' },
      adSets: [
        { localId: 'demo-as-3', name: 'Adults 18-54', dailyBudget: 53550, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 18, ageMax: 54 }, status: 'ACTIVE', audienceLabel: 'Adults 18-54' },
        { localId: 'demo-as-4', name: 'Category Buyers', dailyBudget: 53550, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 25, ageMax: 55 }, status: 'ACTIVE', audienceLabel: 'Category buyers' },
      ],
      creatives: [
        { localId: 'demo-cr-3', name: 'Brand Trust', headline: 'Quality You Can Trust', bodyText: 'Discover what sets us apart', ctaType: 'LEARN_MORE', linkUrl: 'https://example.com/brand', pageId: 'demo-page-1', file: DEMO_FILES.brandTrust },
      ],
      ads: [
        { localId: 'demo-ad-3', name: 'Brand Trust - Adults', adSetLocalId: 'demo-as-3', creativeLocalId: 'demo-cr-3', status: 'ACTIVE' },
        { localId: 'demo-ad-4', name: 'Brand Trust - Category', adSetLocalId: 'demo-as-4', creativeLocalId: 'demo-cr-3', status: 'ACTIVE' },
      ],
      facebookPages: [],
    },
    platformCampaignId: 'demo-meta-awareness',
    isEditMode: true,
    programId: 'demo-prog-2',
    channelPlatform: 'meta',
  },
  {
    id: 'demo-3',
    name: 'Product V2 Launch',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T16:00:00Z',
    config: {
      campaign: { name: 'Product V2 Launch', objective: 'OUTCOME_AWARENESS', dailyBudget: 214200, status: 'ACTIVE', specialAdCategories: [], buyingType: 'AUCTION' },
      adSets: [
        { localId: 'demo-as-5', name: 'Early Adopters', dailyBudget: 107100, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 25, ageMax: 40 }, status: 'ACTIVE', audienceLabel: 'Early adopters 25-40' },
        { localId: 'demo-as-6', name: 'Tech Professionals', dailyBudget: 107100, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 28, ageMax: 50 }, status: 'ACTIVE', audienceLabel: 'Tech-savvy professionals' },
      ],
      creatives: [
        { localId: 'demo-cr-4', name: 'Product Launch Hero', headline: 'The Next Generation Is Here', bodyText: 'Faster, smarter, built for what\'s next', ctaType: 'LEARN_MORE', linkUrl: 'https://example.com/v2', pageId: 'demo-page-1', file: DEMO_FILES.productHero },
        { localId: 'demo-cr-5', name: 'Feature Comparison', headline: '2x Faster Performance', bodyText: 'See how V2 compares', ctaType: 'LEARN_MORE', linkUrl: 'https://example.com/compare', pageId: 'demo-page-1', file: DEMO_FILES.productCompare },
      ],
      ads: [
        { localId: 'demo-ad-5', name: 'Launch Hero - Early Adopters', adSetLocalId: 'demo-as-5', creativeLocalId: 'demo-cr-4', status: 'ACTIVE' },
        { localId: 'demo-ad-6', name: 'Comparison - Tech Pros', adSetLocalId: 'demo-as-6', creativeLocalId: 'demo-cr-5', status: 'ACTIVE' },
      ],
      facebookPages: [],
    },
    platformCampaignId: 'demo-meta-product',
    isEditMode: true,
    programId: 'demo-prog-3',
    channelPlatform: 'meta',
  },
  {
    id: 'demo-4',
    name: 'Summer Campaign 2026',
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
    config: {
      campaign: { name: 'Summer Campaign 2026', objective: 'OUTCOME_AWARENESS', dailyBudget: 285700, status: 'ACTIVE', specialAdCategories: [], buyingType: 'AUCTION' },
      adSets: [
        { localId: 'demo-as-7', name: 'Summer Shoppers 18-55', dailyBudget: 142850, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 18, ageMax: 55 }, status: 'ACTIVE', audienceLabel: 'Summer shoppers 18-55' },
        { localId: 'demo-as-8', name: 'Outdoor Enthusiasts', dailyBudget: 142850, optimizationGoal: 'REACH', billingEvent: 'IMPRESSIONS', targeting: { geoLocations: { countries: ['US'] }, ageMin: 25, ageMax: 50 }, status: 'ACTIVE', audienceLabel: 'Outdoor enthusiasts' },
      ],
      creatives: [
        { localId: 'demo-cr-6', name: 'Summer Hero', headline: 'Summer Is Here', bodyText: 'Shop the hottest deals of the season', ctaType: 'SHOP_NOW', linkUrl: 'https://example.com/summer', pageId: 'demo-page-1', file: DEMO_FILES.summerHero },
        { localId: 'demo-cr-7', name: 'Outdoor Collection', headline: 'Adventure Awaits', bodyText: 'Gear up for summer adventures', ctaType: 'LEARN_MORE', linkUrl: 'https://example.com/outdoor', pageId: 'demo-page-1', file: DEMO_FILES.summerOutdoor },
      ],
      ads: [
        { localId: 'demo-ad-7', name: 'Summer Hero - Shoppers', adSetLocalId: 'demo-as-7', creativeLocalId: 'demo-cr-6', status: 'ACTIVE' },
        { localId: 'demo-ad-8', name: 'Outdoor - Enthusiasts', adSetLocalId: 'demo-as-8', creativeLocalId: 'demo-cr-7', status: 'ACTIVE' },
      ],
      facebookPages: [],
    },
    platformCampaignId: 'demo-meta-summer',
    isEditMode: true,
    programId: 'demo-prog-4',
    channelPlatform: 'meta',
  },
];

function buildDemoPrograms(): PaidMediaProgram[] {
  return [
    {
      id: 'demo-prog-1',
      name: 'Spring Collection Launch',
      status: 'launched',
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-10T14:00:00Z',
      currentStepId: 4,
      furthestCompletedStep: 4,
      steps: [
        { stepId: 1, label: 'Campaign Brief', status: 'completed' },
        { stepId: 2, label: 'Blueprint', status: 'completed' },
        { stepId: 3, label: 'Campaign Configuration', status: 'completed' },
        { stepId: 4, label: 'Review & Launch', status: 'completed' },
      ],
      blueprintIds: ['demo-bp-spring'],
      approvedBlueprintId: 'demo-bp-spring',
      channels: [
        { platform: 'meta', enabled: true, launchConfigIds: ['demo-1'], isConfigured: true },
        { platform: 'google', enabled: true, launchConfigIds: [], isConfigured: true },
        { platform: 'tiktok', enabled: true, launchConfigIds: [], isConfigured: true },
        { platform: 'snapchat', enabled: false, launchConfigIds: [], isConfigured: false },
        { platform: 'pinterest', enabled: false, launchConfigIds: [], isConfigured: false },
      ],
      briefSnapshot: JSON.stringify(DEMO_BRIEF_SPRING),
    },
    {
      id: 'demo-prog-2',
      name: 'Brand Awareness Q1',
      status: 'launched',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-15T11:00:00Z',
      currentStepId: 4,
      furthestCompletedStep: 4,
      steps: [
        { stepId: 1, label: 'Campaign Brief', status: 'completed' },
        { stepId: 2, label: 'Blueprint', status: 'completed' },
        { stepId: 3, label: 'Campaign Configuration', status: 'completed' },
        { stepId: 4, label: 'Review & Launch', status: 'completed' },
      ],
      blueprintIds: ['demo-bp-awareness'],
      approvedBlueprintId: 'demo-bp-awareness',
      channels: [
        { platform: 'meta', enabled: true, launchConfigIds: ['demo-2'], isConfigured: true },
        { platform: 'google', enabled: true, launchConfigIds: [], isConfigured: true },
        { platform: 'tiktok', enabled: false, launchConfigIds: [], isConfigured: false },
        { platform: 'snapchat', enabled: false, launchConfigIds: [], isConfigured: false },
        { platform: 'pinterest', enabled: false, launchConfigIds: [], isConfigured: false },
      ],
      briefSnapshot: JSON.stringify(DEMO_BRIEF_AWARENESS),
    },
    {
      id: 'demo-prog-3',
      name: 'Product V2 Launch',
      status: 'launched',
      createdAt: '2026-02-20T08:00:00Z',
      updatedAt: '2026-03-01T16:00:00Z',
      currentStepId: 4,
      furthestCompletedStep: 4,
      steps: [
        { stepId: 1, label: 'Campaign Brief', status: 'completed' },
        { stepId: 2, label: 'Blueprint', status: 'completed' },
        { stepId: 3, label: 'Campaign Configuration', status: 'completed' },
        { stepId: 4, label: 'Review & Launch', status: 'completed' },
      ],
      blueprintIds: ['demo-bp-product'],
      approvedBlueprintId: 'demo-bp-product',
      channels: [
        { platform: 'meta', enabled: true, launchConfigIds: ['demo-3'], isConfigured: true },
        { platform: 'google', enabled: true, launchConfigIds: [], isConfigured: false },
        { platform: 'tiktok', enabled: true, launchConfigIds: [], isConfigured: false },
        { platform: 'snapchat', enabled: false, launchConfigIds: [], isConfigured: false },
        { platform: 'pinterest', enabled: false, launchConfigIds: [], isConfigured: false },
      ],
      briefSnapshot: JSON.stringify(DEMO_BRIEF_PRODUCT),
    },
    {
      id: 'demo-prog-4',
      name: 'Summer Campaign 2026',
      status: 'launched',
      createdAt: '2026-03-05T10:00:00Z',
      updatedAt: '2026-03-05T14:00:00Z',
      currentStepId: 4,
      furthestCompletedStep: 4,
      steps: [
        { stepId: 1, label: 'Campaign Brief', status: 'completed' },
        { stepId: 2, label: 'Blueprint', status: 'completed' },
        { stepId: 3, label: 'Campaign Configuration', status: 'completed' },
        { stepId: 4, label: 'Review & Launch', status: 'completed' },
      ],
      blueprintIds: ['demo-bp-summer'],
      approvedBlueprintId: 'demo-bp-summer',
      channels: [
        { platform: 'meta', enabled: true, launchConfigIds: ['demo-4'], isConfigured: true },
        { platform: 'google', enabled: true, launchConfigIds: [], isConfigured: true },
        { platform: 'tiktok', enabled: true, launchConfigIds: [], isConfigured: true },
        { platform: 'snapchat', enabled: false, launchConfigIds: [], isConfigured: false },
        { platform: 'pinterest', enabled: true, launchConfigIds: [], isConfigured: true },
      ],
      briefSnapshot: JSON.stringify(DEMO_BRIEF_SUMMER),
    },
  ];
}

// ── Store interface ──────────────────────────────────────────────────────────

interface ProgramState {
  programs: PaidMediaProgram[];
  activeProgramId: string | null;
  activeProgram: PaidMediaProgram | null;

  // Load
  loadPrograms: () => void;

  // CRUD
  createProgram: (name: string) => PaidMediaProgram;
  renameProgram: (name: string) => void;
  renameProgramById: (id: string, name: string) => void;
  deleteProgram: (id: string) => void;
  setActiveProgram: (id: string | null) => void;

  // Step tracking
  completeStep: (stepId: ProgramStepId) => void;
  setCurrentStep: (stepId: ProgramStepId) => void;
  markStepEdited: (stepId: ProgramStepId) => void;

  // Artifact linking
  linkBrief: (briefId: string) => void;
  saveBriefSnapshot: (data: unknown) => void;
  linkBlueprints: (ids: string[]) => void;
  approveBlueprint: (id: string) => void;

  // Channel / launch config management
  addLaunchConfig: (platform: ChannelPlatform, configId: string) => void;
  removeLaunchConfig: (platform: ChannelPlatform, configId: string) => void;
  setChannelEnabled: (platform: ChannelPlatform, enabled: boolean) => void;
  setChannelConfigured: (platform: ChannelPlatform, configured: boolean) => void;

  // Status
  updateStatus: (status: ProgramStatus) => void;

  // Chat
  linkChatSession: (sessionId: string, historyKey?: string) => void;

  // Open program — single entry point for switching to a program
  openProgram: (programId: string, options?: {
    targetStep?: ProgramStepId;
    editBrief?: boolean;
    skipChatRestore?: boolean;
  }) => Promise<{
    program: PaidMediaProgram;
    targetRoute: '/campaign-chat' | '/campaign-launch';
    navigationState: Record<string, unknown>;
  } | null>;

  // Internal
  _persist: () => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  activeProgramId: null,
  activeProgram: null,

  // ── Load ─────────────────────────────────────────────────────────────────

  loadPrograms: () => {
    // Seed demo programs — insert if missing, update if step data is stale
    const existingPrograms = programStorage.listPrograms();
    const existingById = new Map(existingPrograms.map((p) => [p.id, p]));
    const demos = buildDemoPrograms();
    let seeded = false;
    for (const demo of demos) {
      // Always overwrite demo programs from canonical definition
      programStorage.saveProgram(demo);
      if (!existingById.has(demo.id)) seeded = true;
    }
    // Force reload if any new demos were added
    if (seeded) { /* will reload below */ }

    // Seed demo launch configs — always overwrite from canonical definition
    for (const config of DEMO_LAUNCH_CONFIGS) {
      launchConfigStorage.saveConfig(config);
    }

    // Seed demo blueprints via IPC (async, non-blocking)
    if (window.aiSuites?.blueprints) {
      Promise.resolve().then(async () => {
        try {
          const existing = await window.aiSuites!.blueprints.list();
          const existingBpIds = new Set((existing.data || []).map((b: any) => b.id));
          for (const bp of DEMO_BLUEPRINTS) {
            if (!existingBpIds.has(bp.id)) {
              const now = new Date().toISOString();
              await window.aiSuites!.blueprints.save({ ...bp, createdAt: now, updatedAt: now, version: 1 });
            }
          }
        } catch (e) {
          console.warn('[ProgramStore] Failed to seed demo blueprints:', e);
        }
      });
    }

    const programs = seeded ? programStorage.listPrograms() : existingPrograms;

    // Auto-fix programs whose names are still raw prompts by deriving from briefSnapshot
    let nameFixed = false;
    for (const program of programs) {
      if (!program.briefSnapshot) continue;
      // Skip programs already named meaningfully (created after the fix)
      if (program.name === 'New Campaign' || program.name.length > 40 || /^(extract|create|plan|build|design|make|generate|help|write|draft)\b/i.test(program.name)) {
        const betterName = deriveProgramName(program.briefSnapshot);
        if (betterName && betterName !== program.name) {
          program.name = betterName;
          programStorage.saveProgram(program);
          nameFixed = true;
        }
      }
    }

    set({ programs: nameFixed ? programStorage.listPrograms() : programs });
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────

  createProgram: (name) => {
    const now = new Date().toISOString();
    const program: PaidMediaProgram = {
      id: generateId(),
      name,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      currentStepId: 1,
      furthestCompletedStep: 0,
      steps: defaultSteps(),
      blueprintIds: [],
      channels: defaultChannels(),
    };

    programStorage.saveProgram(program);
    set({
      programs: programStorage.listPrograms(),
      activeProgramId: program.id,
      activeProgram: program,
    });
    return program;
  },

  renameProgram: (name) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, name, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  renameProgramById: (id, name) => {
    const program = programStorage.getProgram(id);
    if (!program) return;
    const trimmed = name.trim() || program.name;
    const now = new Date().toISOString();
    program.name = trimmed;
    program.updatedAt = now;
    programStorage.saveProgram(program);

    const { activeProgramId, activeProgram } = get();
    set({
      programs: programStorage.listPrograms(),
      ...(activeProgramId === id && activeProgram
        ? { activeProgram: { ...activeProgram, name: trimmed, updatedAt: now } }
        : {}),
    });
  },

  deleteProgram: (id) => {
    programStorage.deleteProgram(id);
    const { activeProgramId } = get();
    set({
      programs: programStorage.listPrograms(),
      ...(activeProgramId === id ? { activeProgramId: null, activeProgram: null } : {}),
    });
  },

  setActiveProgram: (id) => {
    if (!id) {
      set({ activeProgramId: null, activeProgram: null });
      return;
    }
    const program = programStorage.getProgram(id);
    if (program) {
      set({ activeProgramId: id, activeProgram: program });
    }
  },

  // ── Step tracking ────────────────────────────────────────────────────────

  completeStep: (stepId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const now = new Date().toISOString();
    const steps = activeProgram.steps.map((s) =>
      s.stepId === stepId ? { ...s, status: 'completed' as const, completedAt: now } : s
    );
    const furthest = Math.max(activeProgram.furthestCompletedStep, stepId) as ProgramStepId;

    // Auto-advance current step if completing the current one
    const nextStep = stepId < 4 ? ((stepId + 1) as ProgramStepId) : stepId;
    const currentStepId = activeProgram.currentStepId === stepId ? nextStep : activeProgram.currentStepId;

    // Mark next step as in_progress if pending
    const updatedSteps = steps.map((s) =>
      s.stepId === currentStepId && s.status === 'pending'
        ? { ...s, status: 'in_progress' as const }
        : s
    );

    const status: ProgramStatus = furthest >= 3 ? 'ready_to_launch' : furthest >= 1 ? 'in_progress' : 'draft';

    set({
      activeProgram: {
        ...activeProgram,
        steps: updatedSteps,
        furthestCompletedStep: furthest,
        currentStepId,
        status,
        updatedAt: now,
      },
    });
    get()._persist();
  },

  setCurrentStep: (stepId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const now = new Date().toISOString();

    // Mark all steps before the target as completed, target as in_progress
    const steps = activeProgram.steps.map((s) => {
      if (s.stepId < stepId && s.status !== 'completed') {
        return { ...s, status: 'completed' as const, completedAt: now };
      }
      if (s.stepId === stepId && s.status === 'pending') {
        return { ...s, status: 'in_progress' as const };
      }
      return s;
    });

    // Update furthestCompletedStep if we're jumping ahead
    const furthest = Math.max(
      activeProgram.furthestCompletedStep,
      stepId - 1,
    ) as ProgramStepId;

    set({
      activeProgram: {
        ...activeProgram,
        currentStepId: stepId,
        furthestCompletedStep: furthest,
        steps,
        updatedAt: now,
      },
    });
    get()._persist();
  },

  markStepEdited: (stepId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const now = new Date().toISOString();
    const steps = activeProgram.steps.map((s) =>
      s.stepId === stepId ? { ...s, lastEditedAt: now, status: s.status === 'pending' ? ('in_progress' as const) : s.status } : s
    );

    set({
      activeProgram: { ...activeProgram, steps, updatedAt: now },
    });
    get()._persist();
  },

  // ── Artifact linking ─────────────────────────────────────────────────────

  linkBrief: (briefId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, briefId, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  saveBriefSnapshot: (data) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: {
        ...activeProgram,
        briefSnapshot: JSON.stringify(data),
        updatedAt: new Date().toISOString(),
      },
    });
    get()._persist();
  },

  linkBlueprints: (ids) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    // Merge with existing, deduplicate
    const merged = Array.from(new Set([...activeProgram.blueprintIds, ...ids]));
    set({
      activeProgram: { ...activeProgram, blueprintIds: merged, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  approveBlueprint: (id) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, approvedBlueprintId: id, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  // ── Channel / launch config ──────────────────────────────────────────────

  addLaunchConfig: (platform, configId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) => {
      if (ch.platform !== platform) return ch;
      if (ch.launchConfigIds.includes(configId)) return ch;
      return {
        ...ch,
        launchConfigIds: [...ch.launchConfigIds, configId],
        isConfigured: true,
      };
    });

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  removeLaunchConfig: (platform, configId) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) => {
      if (ch.platform !== platform) return ch;
      const filtered = ch.launchConfigIds.filter((id) => id !== configId);
      return { ...ch, launchConfigIds: filtered, isConfigured: filtered.length > 0 };
    });

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  setChannelEnabled: (platform, enabled) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) =>
      ch.platform === platform ? { ...ch, enabled } : ch
    );

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  setChannelConfigured: (platform, configured) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    const channels = activeProgram.channels.map((ch) =>
      ch.platform === platform ? { ...ch, isConfigured: configured } : ch
    );

    set({
      activeProgram: { ...activeProgram, channels, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  // ── Status ───────────────────────────────────────────────────────────────

  updateStatus: (status) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: { ...activeProgram, status, updatedAt: new Date().toISOString() },
    });
    get()._persist();
  },

  // ── Chat ─────────────────────────────────────────────────────────────────

  linkChatSession: (sessionId, historyKey) => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    set({
      activeProgram: {
        ...activeProgram,
        chatSessionId: sessionId,
        ...(historyKey ? { chatHistoryKey: historyKey } : {}),
        updatedAt: new Date().toISOString(),
      },
    });
    get()._persist();
  },

  // ── Open Program ─────────────────────────────────────────────────────────

  openProgram: async (programId, options) => {
    const targetStep = options?.targetStep;
    const editBrief = options?.editBrief ?? false;
    const skipChatRestore = options?.skipChatRestore ?? false;

    // 1. Chat-safe reset — preserves IPC stream listener
    resetProgramStores();

    // 2. Load program from storage
    const program = programStorage.getProgram(programId);
    if (!program) {
      console.warn('[ProgramStore] openProgram: program not found:', programId);
      return null;
    }

    // 3. Set active program
    set({ activeProgramId: programId, activeProgram: program });

    // 4. Determine and set target step
    const step = targetStep ?? (program.currentStepId as ProgramStepId);
    get().setCurrentStep(step);

    // 5. Hydrate brief data from snapshot (synchronous — first render shows data)
    const isFresh = !program.briefSnapshot && program.blueprintIds.length === 0;
    if (program.briefSnapshot) {
      try {
        const briefData = JSON.parse(program.briefSnapshot);
        useBriefEditorStore.getState().setBriefData(briefData);
      } catch {
        // Corrupt snapshot — ignore
      }
    } else if (isFresh) {
      // New program — ensure brief editor is clean
      useBriefEditorStore.getState().setBriefData({
        campaignDetails: '', brandProduct: '', businessObjective: '',
        businessObjectiveTags: [], primaryGoals: [], secondaryGoals: [],
        primaryKpis: [], secondaryKpis: [], inScope: [], outOfScope: [],
        primaryAudience: [], secondaryAudience: [], mandatoryChannels: [],
        optionalChannels: [], budgetAmount: '', pacing: '', phases: '',
        prospectingSegments: [], retargetingSegments: [], suppressionSegments: [],
        timelineStart: '', timelineEnd: '',
      });
    }

    // 6. Hydrate blueprint state
    // Step 1 always shows the brief editor, not blueprints
    if (editBrief || step === 1) {
      // Editing brief / step 1 — clear blueprint flags so brief editor shows
      useBlueprintStore.getState().setHasGeneratedPlan(false);
      useBlueprintStore.getState().setApprovedBlueprintId(null);
      useBlueprintStore.getState().selectBlueprint(null);
    } else if (program.blueprintIds.length > 0) {
      // Load blueprints from IPC (async)
      await useBlueprintStore.getState().loadBlueprints();
      useBlueprintStore.getState().setHasGeneratedPlan(true);
      if (program.approvedBlueprintId) {
        useBlueprintStore.getState().setApprovedBlueprintId(program.approvedBlueprintId);
        useBlueprintStore.getState().selectBlueprint(program.approvedBlueprintId);
      }
    } else {
      // No blueprints — clear stale plan state
      useBlueprintStore.getState().setHasGeneratedPlan(false);
      useBlueprintStore.getState().setApprovedBlueprintId(null);
      useBlueprintStore.getState().selectBlueprint(null);
    }

    // 7. Hydrate launch config if step >= 3 and configs exist
    if (step >= 3) {
      const enabledWithConfigs = program.channels.find(
        (ch) => ch.enabled && ch.launchConfigIds.length > 0
      );
      if (enabledWithConfigs) {
        const firstConfigId = enabledWithConfigs.launchConfigIds[0];
        useCampaignLaunchStore.getState().initFromSavedConfig(firstConfigId);
      }
    }

    // 8. Restore chat history (unless caller says skip)
    if (!skipChatRestore) {
      const chatKey = program.chatHistoryKey || `program-chat:${program.id}`;
      const launchKey = `program-launch:${program.id}`;

      if (program.id.startsWith('demo-prog-') && program.briefSnapshot) {
        // Demo programs: always regenerate from builder to pick up code changes
        try {
          const briefData = JSON.parse(program.briefSnapshot);
          const demoMessages = buildDemoChatHistory(program, briefData);
          useChatStore.getState().loadMessages(demoMessages);
          chatHistoryStorage.saveMessages(chatKey, demoMessages as any);
          chatHistoryStorage.saveMessages(launchKey, demoMessages as any);
        } catch {
          // Corrupt snapshot
        }
      } else {
        // User programs: restore from storage
        const savedMessages = chatHistoryStorage.getMessages(chatKey).length > 0
          ? chatHistoryStorage.getMessages(chatKey)
          : chatHistoryStorage.getMessages(launchKey);
        if (savedMessages.length > 0) {
          useChatStore.getState().loadMessages(savedMessages);
        }
      }
    }

    // 10. Determine target route and return navigation info
    const effectiveStep = targetStep ?? step;
    const targetRoute = effectiveStep <= 2 ? '/campaign-chat' as const : '/campaign-launch' as const;
    const navigationState: Record<string, unknown> = { programId: program.id };
    if (editBrief) navigationState.editBrief = true;

    return { program, targetRoute, navigationState };
  },

  // ── Internal ─────────────────────────────────────────────────────────────

  _persist: () => {
    const { activeProgram } = get();
    if (!activeProgram) return;

    programStorage.saveProgram(activeProgram);
    set({ programs: programStorage.listPrograms() });
  },
}));
