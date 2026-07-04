import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Avatar } from "./avatar";

const meta = {
  component: Avatar,
  tags: ["ai-generated"],
  args: { name: "Jordan Diaz" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = { args: { size: 56 } };
export const WithImage: Story = {
  args: { src: "https://i.pravatar.cc/96?img=12", size: 48 },
};

// Proves the name prop is reduced to its initials in the fallback.
export const Initials: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("JD")).toBeVisible();
  },
};
