import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';

const meta = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style of the link',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the link text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the link is disabled',
    },
    href: {
      control: 'text',
      description: 'URL the link points to',
    },
    children: {
      control: 'text',
      description: 'Link text content',
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary link',
    href: 'https://example.com',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary link',
    href: 'https://example.com',
    variant: 'secondary',
    size: 'md',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger link',
    href: 'https://example.com',
    variant: 'danger',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    children: 'Small link',
    href: 'https://example.com',
    variant: 'primary',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large link',
    href: 'https://example.com',
    variant: 'primary',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled link',
    href: 'https://example.com',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
};

export const ExternalLink: Story = {
  args: {
    children: 'Open in new tab',
    href: 'https://example.com',
    variant: 'primary',
    size: 'md',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
};
