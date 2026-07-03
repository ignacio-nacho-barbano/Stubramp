import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Card } from './card';

const meta = {
  component: Card,
  tags: ['ai-generated'],
  args: { children: 'Card body content goes here.' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ElevatedSm: Story = { args: { elevation: 'sm' } };
export const ElevatedMd: Story = { args: { elevation: 'md' } };
export const Unpadded: Story = { args: { padded: false } };

// Header/footer are optional slots; assert both render around the body.
export const WithHeaderAndFooter: Story = {
  args: {
    header: 'Operating account',
    footer: 'Last synced 2 minutes ago',
    children: 'Available balance $48,200.00',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Operating account')).toBeVisible();
    await expect(canvas.getByText('Last synced 2 minutes ago')).toBeVisible();
  },
};
