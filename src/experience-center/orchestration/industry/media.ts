import type { IndustryContext } from '../types';

export const mediaContext: IndustryContext = {
  id: 'media',
  label: 'Media & Entertainment',
  sampleSegments: [
    { name: 'Premium Subscribers', description: 'Active paid-tier subscribers with high content consumption and low churn risk', size: '~280K', valueLevel: 'High' },
    { name: 'Engaged Free-Tier Users', description: 'Ad-supported users with frequent logins and strong content engagement', size: '~450K', valueLevel: 'Medium' },
    { name: 'Binge Watchers', description: 'Subscribers who consume 10+ hours of content per week across multiple genres', size: '~150K', valueLevel: 'High' },
    { name: 'At-Risk Subscribers', description: 'Paid subscribers showing declining engagement or repeated billing inquiries', size: '~95K', valueLevel: 'High' },
    { name: 'Lapsed Subscribers', description: 'Former paid subscribers who cancelled within the last 6 months', size: '~120K', valueLevel: 'Medium' },
    { name: 'New Trial Users', description: 'Users currently in a free trial period within the last 14 days', size: '~45K', valueLevel: 'Low' },
  ],
  sampleMetrics: {
    monthlyActiveUsers: '1.2M',
    subscriberChurnRate: '6.5%',
    avgRevenuePerUser: '$12',
    contentEngagementRate: '42%',
    trialToPaidConversionRate: '28%',
    premiumUpgradeRate: '4.2%',
  },
  channelPreferences: ['Email', 'In-App Messaging', 'Push Notifications', 'Paid Social', 'Content Recommendations'],
  verticalTerminology: {
    customer: 'subscriber',
    purchase: 'subscription',
    revenue: 'revenue',
    loyalty: 'engagement',
    churn: 'cancellation',
  },
  sampleDataContext: 'This analysis uses sample data representing a digital media platform with ~1.2M subscribers, $12 average revenue per user (ARPU), and a 6.5% monthly churn rate. Segments are built from streaming activity, subscription history, and engagement signals over the past 12 months.',
};
