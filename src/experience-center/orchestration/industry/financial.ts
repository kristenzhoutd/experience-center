import type { IndustryContext } from '../types';

export const financialContext: IndustryContext = {
  id: 'financial',
  label: 'Financial Services',
  sampleSegments: [
    { name: 'High-Net-Worth Clients', description: 'Clients with $1M+ in assets under management', size: '~15K', valueLevel: 'High' },
    { name: 'Mass Affluent', description: 'Clients with $250K–$1M in investable assets and active advisory relationships', size: '~85K', valueLevel: 'High' },
    { name: 'Dormant Account Holders', description: 'Clients with no transactions or logins in 90+ days', size: '~42K', valueLevel: 'Low' },
    { name: 'New Account Openers', description: 'Clients who opened an account within the last 60 days', size: '~12K', valueLevel: 'Medium' },
    { name: 'Cross-Sell Prospects', description: 'Single-product clients with high propensity for additional product adoption', size: '~110K', valueLevel: 'Medium' },
    { name: 'At-Risk Cardholders', description: 'Credit card holders showing declining spend and engagement signals', size: '~28K', valueLevel: 'High' },
  ],
  sampleMetrics: {
    avgAssetsUnderManagement: '$385K',
    productHoldingsPerCustomer: '2.3',
    digitalEngagementRate: '61%',
    applicationConversionRate: '14%',
    attritionRate: '8%',
    crossSellRate: '18%',
  },
  channelPreferences: ['Email', 'Mobile Banking', 'Direct Mail', 'Branch Outreach', 'Paid Search'],
  verticalTerminology: {
    customer: 'client',
    purchase: 'application',
    revenue: 'revenue',
    loyalty: 'relationship depth',
    churn: 'attrition',
  },
  sampleDataContext: 'This analysis uses sample financial services data representing a regional financial institution with ~350K clients, 2.3 average product holdings per client, and an 8% annual attrition rate. Segments are built from 12 months of transactional, product, and digital engagement data.',
};
