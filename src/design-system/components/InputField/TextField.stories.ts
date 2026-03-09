import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Components/Text Field',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text above the input',
    },
    helpText: {
      control: 'text',
      description: 'Help text below the input',
    },
    status: {
      control: 'select',
      options: ['default', 'error', 'warning'],
      description: 'Validation status',
    },
    required: {
      control: 'boolean',
      description: 'Shows required asterisk on label',
    },
    showHelpIcon: {
      control: 'boolean',
      description: 'Shows a help icon next to the label',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    readOnly: {
      control: 'boolean',
      description: 'Makes the input read-only',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  args: {
    placeholder: 'Enter value',
  },
};

export const Default: Story = {
  args: {
    defaultValue: 'Enter value',
  },
};

export const Active: Story = {
  args: {
    defaultValue: 'Enter value',
    autoFocus: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 'Enter value',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: 'Enter value',
    readOnly: true,
  },
};

export const Error: Story = {
  args: {
    defaultValue: 'Enter value',
    status: 'error',
  },
};

export const Warning: Story = {
  args: {
    defaultValue: 'Enter value',
    status: 'warning',
  },
};
