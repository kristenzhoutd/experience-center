import type { OutputSection } from '../stores/marketingLabStore';

interface MarketingLabInput {
  industry: string;
  useCase: string;
  objective: string;
  audience: string;
  channels: string[];
}

export function generateMarketingLabOutputs(input: MarketingLabInput): OutputSection[] {
  const { industry, useCase, objective, audience, channels } = input;
  const channelList = channels.join(', ');

  return [
    {
      title: 'Campaign Strategy',
      content: `For ${industry}, we recommend a multi-phase ${useCase.toLowerCase()} approach focused on "${objective.toLowerCase()}". The strategy begins with an awareness phase targeting ${audience.toLowerCase()} across ${channelList}, followed by a consideration phase with personalized messaging, and a conversion phase with retargeting and urgency-driven offers.\n\nKey milestones:\n• Week 1–2: Audience segmentation and creative development\n• Week 3–4: Soft launch with A/B testing across ${channels[0] || 'primary channel'}\n• Week 5–8: Full rollout with optimization based on early results\n• Week 9–12: Scale top performers and sunset underperformers`,
    },
    {
      title: 'Audience Segment',
      content: `Primary Segment: ${audience} in ${industry}\n\nDemographic Profile:\n• Industry vertical: ${industry}\n• Engagement level: Medium to high intent\n• Lifecycle stage: Aligned with "${objective.toLowerCase()}" objective\n\nBehavioral Indicators:\n• Recently engaged with similar ${industry.toLowerCase()} brands\n• Shown interest in products/services matching the "${useCase.toLowerCase()}" use case\n• Active on: ${channelList}\n\nEstimated Reach: 250K–1.2M addressable profiles\nExpected Match Rate: 65–78%`,
    },
    {
      title: 'Journey Map',
      content: `Customer Journey for ${audience} — ${industry}\n\n1. Awareness\n   Trigger: First exposure via ${channels[0] || 'digital channels'}\n   Action: View brand content, explore value proposition\n   Goal: Drive initial interest and brand recall\n\n2. Consideration\n   Trigger: Re-engagement through ${channels[1] || 'retargeting'}\n   Action: Compare offerings, read reviews, visit landing pages\n   Goal: Build preference and move toward "${objective.toLowerCase()}"\n\n3. Decision\n   Trigger: Personalized offer via ${channels[2] || 'direct channel'}\n   Action: Add to cart, request demo, or sign up\n   Goal: Convert interest into measurable action\n\n4. Retention\n   Trigger: Post-conversion nurture via ${channels.slice(-1)[0] || 'email'}\n   Action: Onboarding, loyalty program enrollment\n   Goal: Maximize lifetime value and reduce churn`,
    },
    {
      title: 'Channel Plan',
      content: `Channel Allocation for "${objective}" — ${industry}\n\n${channels.map((ch, i) => {
        const allocations = [35, 25, 20, 12, 8];
        const roles = [
          'Primary acquisition driver — highest budget allocation for broad reach',
          'Engagement and retargeting — personalized messaging to warm audiences',
          'Conversion support — direct response with urgency-driven CTAs',
          'Supplementary reach — incremental awareness and frequency',
          'Testing channel — experimental creative and audience exploration',
        ];
        return `${ch}\n  Budget Share: ${allocations[i] || 10}%\n  Role: ${roles[i] || 'Supporting channel for incremental reach'}\n  KPIs: CTR, CPA, ROAS`;
      }).join('\n\n')}\n\nRecommended Total Budget: Allocate 60% to top 2 channels, 40% across remaining.\nOptimization Cadence: Weekly performance reviews with bi-weekly creative refreshes.`,
    },
  ];
}
