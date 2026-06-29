import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Checkbox } from './checkbox';

const meta = {
  component: Checkbox,
  tags: ['ai-generated'],
  args: { label: 'Save this payee' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };

// Uncontrolled checkbox: proves clicking toggles the checked state.
export const Toggles: Story = {
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole('checkbox');
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};
