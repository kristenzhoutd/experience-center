import type { IndustryContext } from '../types.js';

export const travelContext: IndustryContext = {
  id: 'travel',
  label: 'Travel & Hospitality',
  sampleSegments: [
    { name: 'Elite Travelers', description: 'Top-tier loyalty members with 6+ trips per year', size: '~28K', valueLevel: 'High' },
    { name: 'Business Travelers', description: 'Corporate travelers with regular booking patterns', size: '~95K', valueLevel: 'High' },
    { name: 'Leisure Seekers', description: 'Vacation-focused travelers with 2-3 trips per year', size: '~180K', valueLevel: 'Medium' },
    { name: 'Loyalty Members', description: 'Enrolled in rewards program but not yet top-tier', size: '~320K', valueLevel: 'Medium' },
    { name: 'Lapsed Bookers', description: 'No booking in 6+ months despite prior activity', size: '~75K', valueLevel: 'Medium' },
    { name: 'Seasonal Travelers', description: 'Travel concentrated in specific seasons or holidays', size: '~140K', valueLevel: 'Medium' },
  ],
  sampleMetrics: {
    avgBookingValue: '$680',
    rebookingRate: '38%',
    loyaltyRedemptionRate: '24%',
    upgradeConversionRate: '12%',
    ancillaryRevenue: '$95 per trip',
    avgLeadTime: '45 days',
  },
  channelPreferences: ['Email', 'Paid Social', 'Web Personalization', 'Mobile App', 'Retargeting'],
  verticalTerminology: {
    customer: 'guest',
    purchase: 'booking',
    revenue: 'booking revenue',
    loyalty: 'loyalty tier',
    churn: 'dormant',
  },
  sampleDataContext: 'This analysis uses sample travel & hospitality data representing a mid-to-large hospitality brand with ~850K known guests, $680 average booking value, and a 38% rebooking rate. Segments are built from booking history, loyalty program data, and digital engagement over 18 months.',
};
