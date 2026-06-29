import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Switch } from './switch';

const meta = {
  component: Switch,
  tags: ['ai-generated'],
  args: { label: 'Auto-pay enabled' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };

// role="switch" exposes aria-checked; proves clicking flips it.
export const Toggles: Story = {
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  },
};
