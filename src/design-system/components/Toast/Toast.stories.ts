import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast } from './Toast';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: 'This is a notification message for the user.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'error'],
      description: 'Color variant of the toast',
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
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Variants with title ---

export const Default: Story = {
  args: {
    variant: 'default',
    title: 'Notification',
    children: 'This is a default notification message.',
    onClose: () => {},
  },
};

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
    children: 'A simple notification without a title.',
    onClose: () => {},
  },
};

// --- Without close ---

export const WithoutClose: Story = {
  name: 'Without Close Button',
  args: {
    variant: 'success',
    title: 'Saved',
    children: 'Auto-dismissing toast without a close button.',
  },
};
