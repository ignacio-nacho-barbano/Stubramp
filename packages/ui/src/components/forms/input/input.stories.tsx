import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Input } from "./input";

const meta = {
  component: Input,
  tags: ["ai-generated"],
  args: { label: "Amount", placeholder: "0.00" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: "Enter the amount in USD." } };
export const WithPrefix: Story = { args: { prefix: "$", suffix: "USD" } };

// Error overrides the hint and recolors the field; assert the message shows.
export const WithError: Story = {
  args: {
    error: "Amount exceeds available balance.",
    hint: "ignored when error set",
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Amount exceeds available balance."),
    ).toBeVisible();
    await expect(canvas.queryByText("ignored when error set")).toBeNull();
  },
};

// Proves the native input accepts and reflects typed input.
export const Typing: Story = {
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByLabelText("Amount");
    await userEvent.type(field, "1250.00");
    await expect(field).toHaveValue("1250.00");
  },
};
