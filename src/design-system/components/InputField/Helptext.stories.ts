import type { Meta, StoryObj } from '@storybook/react-vite';
import { Helptext } from './Helptext';

const meta = {
  title: 'Components/Subtext',
  component: Helptext,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Help text content',
    },
    type: {
      control: 'select',
      options: ['default', 'success', 'error'],
      description: 'Visual variant',
    },
  },
} satisfies Meta<typeof Helptext>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Help text for additional information',
    type: 'default',
  },
};

export const Success: Story = {
  args: {
    children: 'Help text for additional information',
    type: 'success',
  },
};

export const Error: Story = {
  args: {
    children: 'Help text for additional information',
    type: 'error',
  },
};
