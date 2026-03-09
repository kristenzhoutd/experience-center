import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Tooltip,
  TooltipText,
  TooltipBulletList,
  TooltipIconList,
} from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
        'right',
        'right-start',
        'right-end',
      ],
      description: 'Arrow position relative to the tooltip body',
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleText =
  'Tool tip text lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.';

// --- Content Types ---

export const Text: Story = {
  args: {
    position: 'top',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const BulletList: Story = {
  name: 'Bullet List',
  args: {
    position: 'top',
    children: (
      <TooltipBulletList items={['Tooltip text', 'Tooltip text', 'Tooltip text']} />
    ),
  },
};

export const IconList: Story = {
  name: 'Icon List (Checkmarks)',
  args: {
    position: 'top',
    children: (
      <TooltipIconList items={['Tooltip text', 'Tooltip text', 'Tooltip text']} />
    ),
  },
};

// --- Arrow Positions ---

export const ArrowTop: Story = {
  name: 'Arrow: Top (12:00)',
  args: {
    position: 'top',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowTopStart: Story = {
  name: 'Arrow: Top Start (1:00)',
  args: {
    position: 'top-start',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowTopEnd: Story = {
  name: 'Arrow: Top End (11:00)',
  args: {
    position: 'top-end',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowBottom: Story = {
  name: 'Arrow: Bottom (6:00)',
  args: {
    position: 'bottom',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowBottomStart: Story = {
  name: 'Arrow: Bottom Start (5:00)',
  args: {
    position: 'bottom-start',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowBottomEnd: Story = {
  name: 'Arrow: Bottom End (7:00)',
  args: {
    position: 'bottom-end',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowLeft: Story = {
  name: 'Arrow: Left (9:00)',
  args: {
    position: 'left',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

export const ArrowRight: Story = {
  name: 'Arrow: Right (3:00)',
  args: {
    position: 'right',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
};

// --- All Positions Gallery ---

export const AllPositions: Story = {
  name: 'All Arrow Positions',
  args: {
    position: 'top',
    children: <TooltipText>{sampleText}</TooltipText>,
  },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, padding: 40 }}>
      {(['top-end', 'top', 'top-start',
        'left', 'right', 'left-end',
        'bottom-end', 'bottom', 'bottom-start',
      ] as const).map((pos) => (
        <div key={pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#808389', fontFamily: 'monospace' }}>{pos}</span>
          <Tooltip position={pos}>
            <TooltipText>{sampleText}</TooltipText>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};

// --- Rich Content ---

export const BulletListBottomArrow: Story = {
  name: 'Bullet List + Bottom Arrow',
  args: {
    position: 'bottom',
    children: (
      <TooltipBulletList
        items={['First item description', 'Second item detail', 'Third supporting point']}
      />
    ),
  },
};

export const IconListRightArrow: Story = {
  name: 'Icon List + Right Arrow',
  args: {
    position: 'right',
    children: (
      <TooltipIconList
        items={['Feature enabled', 'Access granted', 'Sync complete']}
      />
    ),
  },
};
