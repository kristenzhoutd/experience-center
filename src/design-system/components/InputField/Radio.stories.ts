import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './Radio';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text next to the radio button',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the radio is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the radio button',
    },
    name: {
      control: 'text',
      description: 'Radio group name',
    },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  args: {
    label: 'Label',
    name: 'radio-demo',
    defaultChecked: true,
  },
};

export const Unselected: Story = {
  args: {
    label: 'Label',
    name: 'radio-demo',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    name: 'radio-demo',
    disabled: true,
  },
};

export const DisabledSelected: Story = {
  args: {
    label: 'Label',
    name: 'radio-demo',
    disabled: true,
    defaultChecked: true,
  },
};
