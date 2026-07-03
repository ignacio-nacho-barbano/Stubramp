'use client'

import { ChevronRight } from 'lucide-react'
import { Card, Checkbox, formatDate, Money, StatusBadge, VendorAvatar } from '@stubramp/ui'
import type { BillListItem } from '../../lib/bills'

const GRID =
  'grid grid-cols-[34px_1.6fr_1fr_0.9fr_0.8fr_1fr_1.1fr_24px] items-center gap-2'

const OPEN = new Set(['PAID', 'REJECTED'])

export function BillsTable({
  bills,
  now,
  selected,
  onToggle,
  onOpen,
}: {
  bills: BillListItem[]
  now: number
  selected: Set<string>
  onToggle: (id: string) => void
  onOpen: (id: string) => void
}) {
  return (
    <Card padded={false}>
      <div
        className={`${GRID} border-b border-gray-200 bg-surface-page px-4 py-[11px] text-xs font-medium uppercase tracking-wide text-gray-500`}
      >
        <span />
        <span>Vendor</span>
        <span>Invoice</span>
        <span>Due date</span>
        <span>Lines</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Status</span>
        <span />
      </div>

      {bills.length === 0 ? (
        <div className="px-12 py-12 text-center text-sm text-gray-500">
          No bills in this view.
        </div>
      ) : (
        bills.map((b) => {
          const overdue =
            !OPEN.has(b.status) && new Date(b.dueDate).getTime() < now
          return (
            <div
              key={b.id}
              onClick={() => onOpen(b.id)}
              className={`${GRID} cursor-pointer border-b border-gray-200 px-4 py-3 transition-[background-color] duration-[120ms] hover:bg-surface-page`}
            >
              <span onClick={(e) => e.stopPropagation()} className="flex">
                <Checkbox
                  checked={selected.has(b.id)}
                  onChange={() => onToggle(b.id)}
                />
              </span>
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <VendorAvatar name={b.vendor.name} />
                <span className="truncate">{b.vendor.name}</span>
              </span>
              <span className="font-mono text-xs text-gray-600">
                {b.billNumber}
              </span>
              <span
                className={`text-[13px] ${overdue ? 'text-status-negative' : 'text-gray-600'}`}
              >
                {formatDate(b.dueDate)}
              </span>
              <span className="text-xs text-gray-500">
                {b._count.lineItems}{' '}
                {b._count.lineItems === 1 ? 'line' : 'lines'}
              </span>
              <span className="text-right text-sm font-semibold">
                <Money cents={b.totalCents} />
              </span>
              <span className="flex justify-end">
                <StatusBadge status={b.status} />
              </span>
              <ChevronRight size={15} className="text-gray-400" />
            </div>
          )
        })
      )}
    </Card>
  )
}
