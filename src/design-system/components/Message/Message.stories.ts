import type { Meta, StoryObj } from '@storybook/react-vite';
import { Message } from './Message';

const meta = {
  title: 'Components/Message',
  component: Message,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    children: 'This is an inline message for the user.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: 'Color variant of the message',
    },
    title: {
      control: 'text',
      description: 'Optional title displayed above the body text',
    },
    icon: {
      control: false,
      description: 'Custom icon element. When omitted and title is set, a default variant icon is shown.',
    },
    onClose: {
      description: 'Callback when the close button is clicked. Omit to hide the close button.',
    },
    children: {
      control: 'text',
      description: 'Body text content',
    },
  },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Variants with title ---

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational message for the user.',
    onClose: () => {},
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    children: 'Your changes have been saved successfully.',
    onClose: () => {},
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please review the settings before proceeding.',
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'Something went wrong. Please try again.',
    onClose: () => {},
  },
};

// --- Without title ---

export const WithoutTitle: Story = {
  name: 'Without Title',
  args: {
    variant: 'info',
    children: 'A simple inline message without a title.',
    onClose: () => {},
  },
};

// --- Without close ---

export const WithoutClose: Story = {
  name: 'Without Close Button',
  args: {
    variant: 'warning',
    title: 'Heads up',
    children: 'This message cannot be dismissed by the user.',
  },
};
