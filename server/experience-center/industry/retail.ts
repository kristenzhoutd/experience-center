import type { IndustryContext } from '../types.js';

export const retailContext: IndustryContext = {
  id: 'retail',
  label: 'Retail',
  sampleSegments: [
    { name: 'VIP Loyalists', description: 'Top 10% by LTV with 5+ purchases in 12 months', size: '~45K', valueLevel: 'High' },
    { name: 'Rising Potentials', description: 'Mid-tier customers with accelerating purchase frequency', size: '~120K', valueLevel: 'High' },
    { name: 'Seasonal Shoppers', description: 'Customers who purchase primarily during sales events', size: '~280K', valueLevel: 'Medium' },
    { name: 'Cart Abandoners', description: 'Added items but did not complete purchase in last 30 days', size: '~95K', valueLevel: 'Medium' },
    { name: 'Lapsed High-Value', description: 'Former top spenders with no purchase in 90+ days', size: '~32K', valueLevel: 'High' },
    { name: 'New Customers', description: 'First purchase within last 30 days', size: '~18K', valueLevel: 'Medium' },
  ],
  sampleMetrics: {
    avgOrderValue: '$87',
    repeatPurchaseRate: '34%',
    customerLifetimeValue: '$420',
    cartAbandonmentRate: '68%',
    emailOpenRate: '22%',
    conversionRate: '3.2%',
  },
  channelPreferences: ['Email', 'Paid Social', 'SMS', 'Web Personalization', 'Mobile Push'],
  verticalTerminology: {
    customer: 'shopper',
    purchase: 'purchase',
    revenue: 'revenue',
    loyalty: 'loyalty program',
    churn: 'lapsed',
  },
  sampleDataContext: 'This analysis uses sample retail e-commerce data representing a mid-market omnichannel brand with ~500K active customers, $87 average order value, and a 34% repeat purchase rate. Segments are built from 12 months of transactional and behavioral data.',
};
