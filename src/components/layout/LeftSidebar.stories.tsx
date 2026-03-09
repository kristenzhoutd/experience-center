import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

const meta = {
  title: 'AI Suites/LeftSidebar',
  component: LeftSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/campaign-chat']}>
        <div style={{ height: '100vh', display: 'flex' }}>
          <Story />
          <div style={{ marginLeft: 64, padding: 24, color: '#666' }}>
            <p>Main content area</p>
          </div>
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LeftSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
