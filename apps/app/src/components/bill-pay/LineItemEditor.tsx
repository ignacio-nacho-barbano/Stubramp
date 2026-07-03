'use client'

import { Plus, Split, X } from 'lucide-react'
import { Card, SegmentedToggle } from '@stubramp/ui'
import type { Classification } from '../../lib/bills'
import type { SplitValue } from './SplitsModal'

export interface DraftLine {
  id: string
  description: string
  amountCents: number
  classification: Classification
  splits: SplitValue[]
}

let lineSeq = 0
export const newDraftLine = (): DraftLine => ({
  id: `l${++lineSeq}`,
  description: '',
  amountCents: 0,
  classification: 'EXPENSE',
  splits: [],
})

const FIELD =
  'flex items-center rounded-sm border border-gray-300 bg-surface-card px-2.5'

export function LineItemEditor({
  lines,
  onChange,
  onOpenSplits,
}: {
  lines: DraftLine[]
  onChange: (lines: DraftLine[]) => void
  onOpenSplits: (id: string) => void
}) {
  const patch = (id: string, next: Partial<DraftLine>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...next } : l)))

  return (
    <Card header="Line items">
      <div className="flex flex-col gap-3">
        {lines.map((l) => (
          <div key={l.id} className="border border-gray-200 px-3.5 py-3">
            <div className="grid grid-cols-[1fr_120px_28px] items-center gap-2.5">
              <input
                value={l.description}
                onChange={(e) => patch(l.id, { description: e.target.value })}
                placeholder="Description"
                className="rounded-sm border border-gray-300 bg-surface-card px-2.5 py-2 text-sm outline-none focus:border-ink-900"
              />
              <span className={FIELD}>
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={l.amountCents ? l.amountCents / 100 : ''}
                  onChange={(e) =>
                    patch(l.id, {
                      amountCents: Math.round(
                        (parseFloat(e.target.value) || 0) * 100,
                      ),
                    })
                  }
                  placeholder="0.00"
                  className="w-full bg-transparent py-2 pl-1 text-right text-sm tabular-nums outline-none"
                />
              </span>
              <span
                onClick={() =>
                  onChange(
                    lines.length > 1
                      ? lines.filter((x) => x.id !== l.id)
                      : lines,
                  )
                }
                className="flex cursor-pointer justify-center text-gray-400 hover:text-ink-900"
              >
                <X size={18} />
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <SegmentedToggle
                options={[
                  { value: 'EXPENSE', label: 'Expense' },
                  { value: 'ITEM', label: 'Item' },
                ]}
                value={l.classification}
                onChange={(v) => patch(l.id, { classification: v })}
              />
              <span
                onClick={() => onOpenSplits(l.id)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-accent-700"
              >
                <Split size={14} />
                {l.splits.length ? 'Edit splits' : 'Split'}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                {l.splits.length
                  ? `${l.splits.length} allocations`
                  : 'Not split'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        onClick={() => onChange([...lines, newDraftLine()])}
        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-accent-700"
      >
        <Plus size={15} />
        Add line item
      </div>
    </Card>
  )
}
