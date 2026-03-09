import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'Components/Combobox',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text above the select',
    },
    helpText: {
      control: 'text',
      description: 'Help text below the select',
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
      description: 'Disables the select',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = (
  <>
    <option value="">Select</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
    <option value="option3">Option 3</option>
  </>
);

export const Placeholder: Story = {
  args: {
    children: options,
  },
};

export const Default: Story = {
  args: {
    defaultValue: 'option1',
    children: (
      <>
        <option value="option1">Select</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
    ),
  },
};

export const Active: Story = {
  args: {
    autoFocus: true,
    children: options,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'option1',
    children: (
      <>
        <option value="option1">Select</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
    ),
  },
};

export const ReadOnly: Story = {
  args: {
    disabled: true,
    defaultValue: 'option1',
    children: (
      <>
        <option value="option1">Select</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    children: options,
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    children: options,
  },
};
