import type { IndustryContext } from '../types.js';

export const cpgContext: IndustryContext = {
  id: 'cpg',
  label: 'CPG',
  sampleSegments: [
    { name: 'Brand Loyalists', description: 'Consistent purchasers of your brand with 80%+ share of category', size: '~85K households', valueLevel: 'High' },
    { name: 'Category Champions', description: 'High-frequency buyers across multiple product categories', size: '~140K households', valueLevel: 'High' },
    { name: 'Deal Seekers', description: 'Price-sensitive buyers who primarily purchase during promotions', size: '~220K households', valueLevel: 'Medium' },
    { name: 'New-to-Category', description: 'First-time buyers in the category within last 60 days', size: '~45K households', valueLevel: 'Medium' },
    { name: 'Lapsed Buyers', description: 'Previously active households with no purchase in 90+ days', size: '~65K households', valueLevel: 'Medium' },
    { name: 'Cross-Category Shoppers', description: 'Buyers in 3+ product categories with expansion potential', size: '~110K households', valueLevel: 'High' },
  ],
  sampleMetrics: {
    householdPenetration: '28%',
    repeatPurchaseRate: '41%',
    avgBasketSize: '$34',
    promoLiftRate: '2.3x',
    categoryShareOfWallet: '22%',
    purchaseFrequency: '4.2x per quarter',
  },
  channelPreferences: ['Email', 'Retail Media', 'Paid Social', 'Direct Mail', 'In-Store'],
  verticalTerminology: {
    customer: 'household',
    purchase: 'purchase',
    revenue: 'revenue per household',
    loyalty: 'brand loyalty',
    churn: 'lapsed',
  },
  sampleDataContext: 'This analysis uses sample CPG data representing a consumer brand with ~600K addressable households, $34 average basket size, and 41% repeat purchase rate. Segments are built from retailer POS data, loyalty panel data, and digital engagement signals over 12 months.',
};
