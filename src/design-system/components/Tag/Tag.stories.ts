import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './Tag';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: 'Tag',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'neutral', 'primary', 'purple', 'teal'],
      description: 'Color variant of the tag',
    },
    size: {
      control: 'select',
      options: ['default', 'mini'],
      description: 'Size of the tag',
    },
    icon: {
      control: false,
      description: 'Icon element displayed before the label',
    },
    onClose: {
      description: 'Callback when the close button is clicked. Omit to hide the close button.',
    },
    children: {
      control: 'text',
      description: 'Tag label text',
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Variants ---

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
};

export const Neutral: Story = {
  args: {
    children: 'Neutral',
    variant: 'neutral',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
};

export const Purple: Story = {
  args: {
    children: 'Secondary',
    variant: 'purple',
  },
};

export const Teal: Story = {
  args: {
    children: 'Tag',
    variant: 'teal',
  },
};

// --- Sizes ---

export const SizeDefault: Story = {
  name: 'Size: Default (24px)',
  args: {
    children: 'Default',
    variant: 'success',
  },
};

export const SizeMini: Story = {
  name: 'Size: Mini (20px)',
  args: {
    children: 'Mini',
    variant: 'success',
    size: 'mini',
  },
};

// --- Without close ---

export const WithoutClose: Story = {
  name: 'Without Close Button',
  args: {
    children: 'Read-only',
    variant: 'primary',
  },
};
