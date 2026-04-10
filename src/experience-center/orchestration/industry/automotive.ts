import type { IndustryContext } from '../types';

export const automotiveContext: IndustryContext = {
  id: 'automotive',
  label: 'Automotive',
  sampleSegments: [
    { name: 'New Vehicle Buyers', description: 'Purchased a new vehicle within the last 12 months', size: '~30K', valueLevel: 'High' },
    { name: 'Service-Loyal Owners', description: 'Completed 3+ dealer service visits in the past year', size: '~55K', valueLevel: 'High' },
    { name: 'Lease Renewal Prospects', description: 'Current lessees within 6 months of lease maturity', size: '~18K', valueLevel: 'High' },
    { name: 'Lapsed Service Customers', description: 'No dealer service visit in 12+ months despite active ownership', size: '~42K', valueLevel: 'Medium' },
    { name: 'EV Intenders', description: 'Owners who have engaged with EV content or requested EV test drives', size: '~25K', valueLevel: 'Medium' },
    { name: 'Certified Pre-Owned Buyers', description: 'Purchased a CPO vehicle within the last 18 months', size: '~28K', valueLevel: 'Low' },
  ],
  sampleMetrics: {
    avgServiceVisitValue: '$450',
    serviceRetentionRate: '58%',
    leaseRenewalRate: '42%',
    avgVehicleLifetimeValue: '$38,000',
    testDriveConversionRate: '14%',
    accessoryAttachRate: '22%',
  },
  channelPreferences: ['Email', 'Direct Mail', 'Dealer Display', 'SMS', 'Connected Vehicle'],
  verticalTerminology: {
    customer: 'owner',
    purchase: 'purchase',
    revenue: 'revenue',
    loyalty: 'brand loyalty',
    churn: 'defected',
  },
  sampleDataContext: 'This analysis uses sample automotive data representing a mid-size automotive brand with ~200K active owners, $450 average service visit value, and a 58% service retention rate. Segments are built from vehicle purchase records, service history, and digital engagement data over the past 24 months.',
};
