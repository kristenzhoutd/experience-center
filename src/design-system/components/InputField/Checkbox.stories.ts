import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text next to the checkbox',
    },
    status: {
      control: 'select',
      options: ['default', 'error'],
      description: 'Validation status',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the checkbox',
    },
    readOnly: {
      control: 'boolean',
      description: 'Makes the checkbox read-only',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    label: 'Label',
  },
};

export const Checked: Story = {
  args: {
    label: 'Label',
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Label',
    disabled: true,
    defaultChecked: true,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    status: 'error',
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Label',
    readOnly: true,
  },
};

export const ReadOnlyChecked: Story = {
  args: {
    label: 'Label',
    readOnly: true,
    defaultChecked: true,
  },
};
