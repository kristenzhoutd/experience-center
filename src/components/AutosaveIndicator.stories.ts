import type { Meta, StoryObj } from '@storybook/react-vite';
import AutosaveIndicator from './AutosaveIndicator';

const meta = {
  title: 'AI Suites/AutosaveIndicator',
  component: AutosaveIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isDirty: {
      control: 'boolean',
      description: 'Whether content is currently being saved',
    },
    lastSavedAt: {
      control: 'text',
      description: 'ISO timestamp of last save',
    },
  },
} satisfies Meta<typeof AutosaveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Saving: Story = {
  args: {
    isDirty: true,
    lastSavedAt: null,
  },
};

export const Saved: Story = {
  args: {
    isDirty: false,
    lastSavedAt: new Date().toISOString(),
  },
};

export const Unsaved: Story = {
  args: {
    isDirty: false,
    lastSavedAt: null,
  },
};
