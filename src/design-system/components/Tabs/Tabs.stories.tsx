import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';

const sampleItems = [
  { key: 'tab1', label: 'Tab 1' },
  { key: 'tab2', label: 'Tab 2' },
  { key: 'tab3', label: 'Tab 3' },
  { key: 'tab4', label: 'Tab 4' },
  { key: 'tab5', label: 'Tab 5' },
];

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    items: sampleItems,
    value: 'tab1',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Tab style variant',
    },
    items: {
      control: false,
      description: 'Array of tab items with key, label, and optional icons',
    },
    value: {
      control: 'select',
      options: ['tab1', 'tab2', 'tab3', 'tab4', 'tab5'],
      description: 'Key of the currently selected tab',
    },
    onChange: {
      description: 'Callback when a tab is selected',
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Primary ---

export const Primary: Story = {
  args: {
    variant: 'primary',
    value: 'tab1',
    onChange: () => {},
  },
};

// --- Secondary ---

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    value: 'tab1',
    onChange: () => {},
  },
};

// --- Interactive ---

const InteractivePrimary = () => {
  const [selected, setSelected] = useState('tab1');
  return <Tabs variant="primary" items={sampleItems} value={selected} onChange={setSelected} />;
};

export const InteractivePrimaryTabs: Story = {
  name: 'Interactive: Primary',
  render: () => <InteractivePrimary />,
  args: { items: sampleItems, value: 'tab1', onChange: () => {} },
};

const InteractiveSecondary = () => {
  const [selected, setSelected] = useState('tab1');
  return <Tabs variant="secondary" items={sampleItems} value={selected} onChange={setSelected} />;
};

export const InteractiveSecondaryTabs: Story = {
  name: 'Interactive: Secondary',
  render: () => <InteractiveSecondary />,
  args: { items: sampleItems, value: 'tab1', onChange: () => {} },
};
