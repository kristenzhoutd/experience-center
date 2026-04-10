import type { IndustryContext } from '../types';

export const healthcareContext: IndustryContext = {
  id: 'healthcare',
  label: 'Healthcare',
  sampleSegments: [
    { name: 'Active Patients', description: 'Patients with 2+ visits in the last 12 months and up-to-date care plans', size: '~40K', valueLevel: 'High' },
    { name: 'At-Risk Members', description: 'Members flagged for chronic condition management gaps or missed follow-ups', size: '~28K', valueLevel: 'High' },
    { name: 'Preventative Care Prospects', description: 'Patients overdue for annual screenings or wellness checkups', size: '~55K', valueLevel: 'Medium' },
    { name: 'High-Utilization Members', description: 'Members with frequent ER visits or specialist referrals in the last 6 months', size: '~15K', valueLevel: 'High' },
    { name: 'Lapsed Patients', description: 'Patients with no visit or engagement in 12+ months', size: '~35K', valueLevel: 'Medium' },
    { name: 'New Enrollees', description: 'Members enrolled within the last 60 days who have not yet completed onboarding', size: '~12K', valueLevel: 'Low' },
  ],
  sampleMetrics: {
    patientRetentionRate: '78%',
    avgVisitsPerYear: '3.2',
    appointmentCompletionRate: '82%',
    wellnessProgramEnrollment: '24%',
    screeningParticipationRate: '61%',
    memberSatisfactionScore: '4.1/5',
  },
  channelPreferences: ['Email', 'Patient Portal', 'SMS', 'Direct Mail', 'Telehealth Outreach'],
  verticalTerminology: {
    customer: 'patient',
    purchase: 'visit',
    revenue: 'utilization',
    loyalty: 'engagement',
    churn: 'disenrollment',
  },
  sampleDataContext: 'This analysis uses sample data representing a regional health system with ~250K active patients, 3.2 average visits per year, and an 82% appointment completion rate. Segments are built from 12 months of clinical, claims, and engagement data.',
};
