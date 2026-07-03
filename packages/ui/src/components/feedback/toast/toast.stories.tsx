import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../../forms/button';
import { ToastProvider, useToast } from './toast';

const meta = {
  component: ToastProvider,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const { toast } = useToast();
  return (
    <div className="flex gap-3 p-8">
      <Button onClick={() => toast({ message: 'Draft saved' })}>Neutral</Button>
      <Button
        variant="accent"
        onClick={() => toast({ message: 'Bill approved', tone: 'positive' })}
      >
        Positive
      </Button>
      <Button
        variant="danger"
        onClick={() => toast({ message: "You don't have permission", tone: 'negative' })}
      >
        Negative
      </Button>
    </div>
  );
}

export const Default: Story = {
  args: { children: null },
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  ),
};
