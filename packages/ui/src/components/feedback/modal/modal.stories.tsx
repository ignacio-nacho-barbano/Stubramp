import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "../../forms/button";
import { Modal } from "./modal";

const meta = {
  component: Modal,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="font-sans text-md font-semibold">
            Confirm action
          </span>
        }
        footer={
          <>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="font-sans text-base text-ink-900">
          This is a Ramp dialog — sharp corners, hairline border, pop shadow.
        </p>
      </Modal>
    </div>
  );
}

export const Default: Story = {
  args: { open: false, onClose: () => {} },
  render: () => <Demo />,
};
