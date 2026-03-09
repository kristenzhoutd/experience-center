import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';

const meta = {
  title: 'Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Label text',
    },
    required: {
      control: 'boolean',
      description: 'Shows required asterisk',
    },
    showHelpIcon: {
      control: 'boolean',
      description: 'Shows a help icon next to the label',
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label',
    required: true,
    showHelpIcon: true,
  },
};
