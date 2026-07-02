'use client'

import { Badge } from '@stubramp/ui/badge'
import { Button } from '@stubramp/ui/button'
import { Card } from '@stubramp/ui/card'
import { Money } from './Money'

export function BillSummaryCard({
  vendorLabel,
  lineCount,
  totalCents,
  busy,
  canCreate,
  onSubmit,
  onSaveDraft,
}: {
  vendorLabel: string
  lineCount: number
  totalCents: number
  busy: boolean
  canCreate: boolean
  onSubmit: () => void
  onSaveDraft: () => void
}) {
  return (
    <Card header="Summary">
      <div className="flex flex-col gap-[11px] text-[13px]">
        <div className="flex">
          <span className="text-gray-500">Vendor</span>
          <span className="ml-auto font-medium">{vendorLabel || '—'}</span>
        </div>
        <div className="flex">
          <span className="text-gray-500">Line items</span>
          <span className="ml-auto">{lineCount}</span>
        </div>
        <div className="flex">
          <span className="text-gray-500">Status</span>
          <span className="ml-auto">
            <Badge tone="neutral">Draft</Badge>
          </span>
        </div>
        <div className="flex border-t border-gray-200 pt-3">
          <span className="font-semibold">Total</span>
          <span className="ml-auto text-[17px] font-bold">
            <Money cents={totalCents} />
          </span>
        </div>
      </div>
      <div className="mt-[18px] flex flex-col gap-2.5">
        <Button
          variant="primary"
          fullWidth
          disabled={busy || !canCreate}
          onClick={onSubmit}
        >
          Submit for approval
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={onSaveDraft}
        >
          Save as draft
        </Button>
      </div>
    </Card>
  )
}
