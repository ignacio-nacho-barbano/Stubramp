import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Logo } from './logo';

const meta = {
  component: Logo,
  tags: ['ai-generated'],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const GlyphOnly: Story = { args: { wordmark: false } };
export const Large: Story = { args: { size: 26, wordmarkSize: 24 } };

// On the dark auth panel the tile/glyph colors invert.
export const OnDark: Story = {
  args: { tileColor: 'var(--accent-500)', glyphColor: 'var(--ink-900)', size: 26 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('StubRamp')).toBeVisible();
  },
};
