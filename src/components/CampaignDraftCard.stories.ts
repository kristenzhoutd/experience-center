import type { Meta, StoryObj } from '@storybook/react-vite';
import CampaignDraftCard from './CampaignDraftCard';

const meta = {
  title: 'AI Suites/CampaignDraftCard',
  component: CampaignDraftCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const div = document.createElement('div');
      div.style.width = '420px';
      return Story();
    },
  ],
} satisfies Meta<typeof CampaignDraftCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Minimal: Story = {
  args: {
    draft: {
      name: 'Spring Sale Campaign',
    },
    onLaunch: () => {},
  },
};

export const WithGoal: Story = {
  args: {
    draft: {
      name: 'Spring Sale Campaign',
      description: 'Promote seasonal discounts to high-value customers.',
      goal: {
        type: 'conversions',
        description: 'Increase checkout completions by 20%',
      },
    },
    onLaunch: () => {},
  },
};

export const FullDraft: Story = {
  name: 'Full Draft (Segments + Content)',
  args: {
    draft: {
      name: 'Holiday Promo 2025',
      description: 'End-of-year holiday campaign targeting returning customers.',
      goal: {
        type: 'engagement',
        description: 'Boost page engagement by 30%',
      },
      segments: [
        {
          name: 'High-Value Shoppers',
          description: 'Customers who spent over $500 in the last 90 days',
          rules: [
            { attribute: 'total_spend', operator: 'greater_than', value: 500 } as any,
            { attribute: 'last_purchase', operator: 'within', value: '90d' } as any,
          ],
        },
        {
          name: 'New Visitors',
          description: 'First-time visitors from organic search',
          rules: [
            { attribute: 'visit_count', operator: 'equals', value: 1 } as any,
          ],
        },
      ],
      contentAssignments: [
        {
          contentSpotId: 'hero-banner',
          contentSpotName: 'Hero Banner',
          variant: {
            id: 'v1',
            type: 'text' as const,
            content: { text: 'Shop the Holiday Sale — Up to 50% Off!' },
          },
        },
        {
          contentSpotId: 'sidebar-promo',
          contentSpotName: 'Sidebar Promo',
          variant: {
            id: 'v2',
            type: 'image' as const,
            content: { url: '/promo.jpg', alt: 'Holiday sale banner' },
          },
        },
      ],
    },
    onLaunch: () => {},
  },
};
