import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Button } from './button';

const meta = {
  component: Button,
  tags: ['ai-generated'],
  args: { children: 'Pay invoice' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Variant-only stories — the render itself fails if the component doesn't mount.
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Accent: Story = { args: { variant: 'accent', children: 'Approve' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Cancel transfer' } };
export const Large: Story = { args: { size: 'lg' } };

// Proves the `disabled` prop is wired through to the DOM attribute.
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /pay invoice/i })).toBeDisabled();
  },
};

// The single project-wide CSS proof. The accent variant uses `bg-surface-accent`,
// which the @theme inline mapping resolves to --accent-500 (#E4F222). If Tailwind
// or the design tokens failed to compile, this resolves to transparent and fails.
export const CssCheck: Story = {
  args: { variant: 'accent', children: 'Approve' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /approve/i });
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(228, 242, 34)');
  },
};
