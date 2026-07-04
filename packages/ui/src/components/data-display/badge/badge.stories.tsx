import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Badge } from "./badge";

const meta = {
  component: Badge,
  tags: ["ai-generated"],
  args: { children: "Paid" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Positive: Story = {
  args: { tone: "positive", children: "Cleared" },
};
export const Negative: Story = {
  args: { tone: "negative", children: "Declined" },
};
export const Warning: Story = {
  args: { tone: "warning", children: "Pending" },
};
export const Info: Story = { args: { tone: "info", children: "In review" } };
export const Accent: Story = { args: { tone: "accent", children: "New" } };
export const Solid: Story = {
  args: { tone: "positive", variant: "solid", children: "Cleared" },
};

// `dot` adds a leading status indicator; assert the label still renders.
export const WithDot: Story = {
  args: { tone: "negative", dot: true, children: "Overdue" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Overdue")).toBeVisible();
  },
};
