import { AllocationBar, allocationColor, Badge, Card, Money } from '@stubramp/ui'
import type { BillLineItem } from '../../lib/bills'

const KIND: Record<
  BillLineItem['classification'],
  { label: string; tone: 'neutral' | 'info' }
> = {
  EXPENSE: { label: 'Expense', tone: 'neutral' },
  ITEM: { label: 'Item', tone: 'info' },
}

/** Read-only line items with their split allocations (detail view). */
export function LineItemsCard({ lines }: { lines: BillLineItem[] }) {
  return (
    <Card header="Line items">
      <div className="flex flex-col gap-3.5">
        {lines.map((l) => {
          const kind = KIND[l.classification]
          const segments = l.splits.map((s, i) => ({
            label: s.costCenter,
            pct: l.amountCents ? (s.amountCents / l.amountCents) * 100 : 0,
            color: allocationColor(i),
          }))
          return (
            <div key={l.id} className="border border-gray-200 px-3.5 py-3">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="text-sm font-medium">{l.description}</span>
                <Badge tone={kind.tone}>{kind.label}</Badge>
                <span className="ml-auto text-sm font-semibold">
                  <Money cents={l.amountCents} />
                </span>
              </div>
              {l.glAccount && (
                <div className="mb-2 text-xs text-gray-500">{l.glAccount}</div>
              )}
              {l.splits.length > 1 ? (
                <AllocationBar segments={segments} />
              ) : (
                <div className="text-xs text-gray-500">
                  {l.splits[0]?.costCenter
                    ? `Allocated to ${l.splits[0].costCenter}`
                    : 'Not split — single allocation'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
