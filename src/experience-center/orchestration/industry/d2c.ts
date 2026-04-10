import type { IndustryContext } from '../types';

export const d2cContext: IndustryContext = {
  id: 'd2c',
  label: 'D2C',
  sampleSegments: [
    { name: 'VIP Repeat Buyers', description: 'Top customers with 5+ orders and highest lifetime spend', size: '~25K', valueLevel: 'High' },
    { name: 'One-Time Purchasers', description: 'Customers who made a single order and have not returned', size: '~45K', valueLevel: 'Low' },
    { name: 'Subscription Members', description: 'Active subscribers on recurring product deliveries', size: '~18K', valueLevel: 'High' },
    { name: 'Cart Abandoners', description: 'Added items to cart but did not complete checkout in last 30 days', size: '~30K', valueLevel: 'Medium' },
    { name: 'High-AOV Customers', description: 'Customers with average order value 2x above the brand mean', size: '~12K', valueLevel: 'High' },
    { name: 'Referral-Driven Buyers', description: 'Customers acquired through referral or ambassador programs', size: '~20K', valueLevel: 'Medium' },
  ],
  sampleMetrics: {
    avgOrderValue: '$65',
    repeatPurchaseRate: '28%',
    customerAcquisitionCost: '$38',
    customerLifetimeValue: '$195',
    subscriptionRetentionRate: '74%',
    referralRate: '12%',
  },
  channelPreferences: ['Email', 'Paid Social', 'SMS', 'Influencer', 'Web Personalization'],
  verticalTerminology: {
    customer: 'customer',
    purchase: 'order',
    revenue: 'revenue',
    loyalty: 'brand loyalty',
    churn: 'lapsed',
  },
  sampleDataContext: 'This analysis uses sample D2C brand data representing a digitally-native consumer brand with ~150K active customers, $65 average order value, and a 28% repeat purchase rate. Segments are built from 12 months of transactional, subscription, and behavioral data.',
};
