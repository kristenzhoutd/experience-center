import type { IndustryContext } from '../types';

export const b2btechContext: IndustryContext = {
  id: 'b2btech',
  label: 'B2B Tech',
  sampleSegments: [
    { name: 'Enterprise Accounts', description: 'Large organizations with 1,000+ seats and multi-year contracts', size: '~800', valueLevel: 'High' },
    { name: 'Mid-Market Growth', description: 'Fast-growing companies expanding usage and seat count quarter over quarter', size: '~650', valueLevel: 'High' },
    { name: 'At-Risk Renewals', description: 'Accounts with declining usage or engagement within 90 days of renewal', size: '~180', valueLevel: 'High' },
    { name: 'Expansion Opportunities', description: 'Accounts with high product adoption signaling upsell or cross-sell readiness', size: '~420', valueLevel: 'Medium' },
    { name: 'New Pipeline Prospects', description: 'Qualified leads in active sales cycles with no prior contract', size: '~310', valueLevel: 'Medium' },
    { name: 'Product Champions', description: 'Power users and internal advocates driving organic adoption within their organization', size: '~140', valueLevel: 'Low' },
  ],
  sampleMetrics: {
    avgContractValue: '$85K',
    netRevenueRetention: '115%',
    pipelineConversionRate: '18%',
    expansionRate: '32%',
    productAdoptionScore: '74/100',
    churnRate: '5.2%',
  },
  channelPreferences: ['Email', 'LinkedIn', 'Webinars', 'In-Product Messaging', 'Account-Based Display'],
  verticalTerminology: {
    customer: 'account',
    purchase: 'deal',
    revenue: 'ARR',
    loyalty: 'adoption',
    churn: 'churn',
  },
  sampleDataContext: 'This analysis uses sample B2B SaaS data representing a company with ~2,500 accounts, $85K average contract value, and 115% net revenue retention. Segments are built from product usage telemetry, CRM pipeline data, and renewal schedules.',
};
