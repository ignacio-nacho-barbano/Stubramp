import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Donut } from "./donut";

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const meta = {
  component: Donut,
  tags: ["ai-generated"],
  args: {
    formatValue: usd,
    centerLabel: "Total open",
    centerValue: "$482,000",
    centerCaption: "8 vendors",
    segments: [
      { label: "Acme Co", value: 1_840_000, color: "var(--navy-700)" },
      { label: "Globex", value: 1_210_000, color: "var(--green-600)" },
      { label: "Initech", value: 930_000, color: "var(--amber-600)" },
      { label: "Umbrella", value: 520_000, color: "var(--accent-700)" },
      { label: "Stark Industries", value: 320_000, color: "var(--gray-500)" },
      { label: "Other", value: 0, color: "var(--gray-300)" },
    ],
  },
} satisfies Meta<typeof Donut>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    segments: [],
    emptyMessage: "No open bills.",
  },
};

// Proves a segment label + its formatted value reach the legend.
export const RendersLegend: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Acme Co")).toBeVisible();
    await expect(canvas.getByText("$18,400")).toBeVisible();
  },
};
