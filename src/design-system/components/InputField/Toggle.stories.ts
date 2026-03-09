import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text next to the toggle',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the toggle is on',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the toggle',
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: {
    label: 'Label',
  },
};

export const On: Story = {
  args: {
    label: 'Label',
    defaultChecked: true,
  },
};

export const ReadOnlyOff: Story = {
  name: 'Read-only Off',
  args: {
    label: 'Label',
    disabled: true,
  },
};

export const ReadOnlyOn: Story = {
  name: 'Read-only On',
  args: {
    label: 'Label',
    disabled: true,
    defaultChecked: true,
  },
};
