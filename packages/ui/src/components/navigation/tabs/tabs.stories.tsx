import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Tabs } from "./tabs";

const meta = {
  component: Tabs,
  tags: ["ai-generated"],
  args: {
    tabs: [
      { id: "all", label: "All", count: 128 },
      { id: "pending", label: "Pending", count: 4 },
      { id: "paid", label: "Paid" },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondActive: Story = { args: { defaultValue: "pending" } };

// Uncontrolled tabs: proves selection moves aria-selected to the clicked tab.
export const SwitchesTab: Story = {
  play: async ({ canvas, userEvent }) => {
    const all = canvas.getByRole("tab", { name: /all/i });
    const paid = canvas.getByRole("tab", { name: /paid/i });
    await expect(all).toHaveAttribute("aria-selected", "true");
    await userEvent.click(paid);
    await expect(paid).toHaveAttribute("aria-selected", "true");
    await expect(all).toHaveAttribute("aria-selected", "false");
  },
};
