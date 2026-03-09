import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { PlusIcon } from '../../icons/Icons';
import { createElement } from 'react';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['md', 'sm', 'xs'],
      description: 'Size of the button',
    },
    icon: {
      control: false,
      description: 'Icon element to display in the button',
    },
    iconOnly: {
      control: 'boolean',
      description: 'Whether to show only the icon without text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    children: {
      control: 'text',
      description: 'Button label text',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Variants ---

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    children: 'Button',
    variant: 'outline',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Button',
    variant: 'ghost',
    size: 'md',
  },
};

export const Link: Story = {
  args: {
    children: 'Button',
    variant: 'link',
    size: 'sm',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Button',
    variant: 'destructive',
    size: 'md',
  },
};

// --- Sizes ---

export const SizeMd: Story = {
  name: 'Size: Default (md)',
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

export const SizeSm: Story = {
  name: 'Size: Small (sm)',
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'sm',
  },
};

export const SizeXs: Story = {
  name: 'Size: Extra Small (xs)',
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'xs',
  },
};

// --- With Icon ---

export const WithIcon: Story = {
  name: 'With Left Icon',
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    icon: createElement(PlusIcon),
  },
};

export const WithIconSecondary: Story = {
  name: 'With Left Icon (Secondary)',
  args: {
    children: 'Button',
    variant: 'secondary',
    size: 'md',
    icon: createElement(PlusIcon),
  },
};

export const WithIconDestructive: Story = {
  name: 'With Left Icon (Destructive)',
  args: {
    children: 'Button',
    variant: 'destructive',
    size: 'md',
    icon: createElement(PlusIcon),
  },
};

// --- Icon Only ---

export const IconOnly: Story = {
  name: 'Icon Only',
  args: {
    variant: 'primary',
    size: 'md',
    icon: createElement(PlusIcon),
    iconOnly: true,
  },
};

export const IconOnlySecondary: Story = {
  name: 'Icon Only (Secondary)',
  args: {
    variant: 'secondary',
    size: 'md',
    icon: createElement(PlusIcon),
    iconOnly: true,
  },
};

export const IconOnlySmall: Story = {
  name: 'Icon Only (Small)',
  args: {
    variant: 'primary',
    size: 'sm',
    icon: createElement(PlusIcon),
    iconOnly: true,
  },
};

export const IconOnlyXs: Story = {
  name: 'Icon Only (XS)',
  args: {
    variant: 'primary',
    size: 'xs',
    icon: createElement(PlusIcon),
    iconOnly: true,
  },
};

// --- Disabled ---

export const DisabledPrimary: Story = {
  name: 'Disabled (Primary)',
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
};

export const DisabledSecondary: Story = {
  name: 'Disabled (Secondary)',
  args: {
    children: 'Button',
    variant: 'secondary',
    size: 'md',
    disabled: true,
  },
};

export const DisabledDestructive: Story = {
  name: 'Disabled (Destructive)',
  args: {
    children: 'Button',
    variant: 'destructive',
    size: 'md',
    disabled: true,
  },
};
