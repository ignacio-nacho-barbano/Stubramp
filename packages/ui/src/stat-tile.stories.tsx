import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { StatTile } from './stat-tile';

const meta = {
  component: StatTile,
  tags: ['ai-generated'],
  args: { label: 'Monthly spend', value: '48,200', prefix: '$', delta: '12.4%' },
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Up: Story = {};
export const Down: Story = { args: { deltaDir: 'down', delta: '3.1%' } };
export const WithSuffix: Story = { args: { value: '2,400', suffix: '/mo', delta: undefined } };

// Proves the value and prefix props are composed into the rendered figure.
export const RendersValue: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('48,200')).toBeVisible();
    await expect(canvas.getByText('$')).toBeVisible();
  },
};
