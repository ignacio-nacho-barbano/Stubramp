import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../forms/button";
import { Menu } from "./menu";

const meta = {
  component: Menu,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ItemList: Story = {
  args: { trigger: null },
  render: () => (
    <div className="flex justify-center p-16">
      <Menu
        trigger={<Button variant="accent">+ New bill</Button>}
        items={[
          {
            id: "manual",
            label: "Enter manually",
            description: "Type in the bill details",
          },
          {
            id: "upload",
            label: "Upload invoice (PDF)",
            description: "Auto-parse with OCR",
          },
          {
            id: "csv",
            label: "Import CSV",
            description: "Map columns, bulk create",
            disabled: true,
          },
        ]}
      />
    </div>
  ),
};

export const CustomPanel: Story = {
  args: { trigger: null },
  render: () => (
    <div className="flex justify-center p-16">
      <Menu
        trigger={<Button variant="secondary">Notifications</Button>}
        width={320}
      >
        <div className="p-4 font-sans text-sm text-ink-900">
          <div className="font-semibold">Notifications</div>
          <div className="mt-2 text-gray-500">No new notifications.</div>
        </div>
      </Menu>
    </div>
  ),
};
