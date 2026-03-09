import type { Meta, StoryObj } from '@storybook/react-vite';
import ChipInput from './ChipInput';

const meta = {
  title: 'AI Suites/ChipInput',
  component: ChipInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'object',
      description: 'Array of chip values',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
  },
  decorators: [
    (Story) => {
      const div = document.createElement('div');
      div.style.width = '360px';
      return Story();
    },
  ],
} satisfies Meta<typeof ChipInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    value: [],
    onChange: () => {},
    placeholder: 'Add item...',
  },
};

export const WithChips: Story = {
  args: {
    value: ['React', 'TypeScript', 'Tailwind'],
    onChange: () => {},
    placeholder: 'Add item...',
  },
};

export const SingleChip: Story = {
  args: {
    value: ['Design System'],
    onChange: () => {},
  },
};

export const ManyChips: Story = {
  name: 'Many Chips (Wrapping)',
  args: {
    value: ['Marketing', 'Conversions', 'Brand Awareness', 'Engagement', 'Lead Gen', 'Sales'],
    onChange: () => {},
  },
};
