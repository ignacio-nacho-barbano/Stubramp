import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Select } from "./select";

const meta = {
  component: Select,
  tags: ["ai-generated"],
  args: {
    label: "Account",
    children: (
      <>
        <option value="checking">Operating — Checking</option>
        <option value="savings">Reserve — Savings</option>
        <option value="card">Corporate Card</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = {
  args: { hint: "Funds draw from this account." },
};
export const WithError: Story = {
  args: { error: "Select a funding account." },
};

// Proves the native select changes value on selection.
export const Selecting: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox");
    await userEvent.selectOptions(select, "savings");
    await expect(select).toHaveValue("savings");
  },
};
