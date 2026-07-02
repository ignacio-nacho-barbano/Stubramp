import { Card } from '@stubramp/ui/card'
import type { BillWithRelations } from '../../lib/bills'
import { formatDate } from '../../lib/format'
import { Money } from './Money'
import { StatusBadge } from './StatusBadge'

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <span className="text-gray-500">{label}</span>
      <span className="ml-auto">{children}</span>
    </div>
  )
}

/** Right-rail summary of a bill's key fields. */
export function BillDetailsCard({ bill }: { bill: BillWithRelations }) {
  const scheduled = bill.payments.find((p) => p.scheduledFor)
  return (
    <Card header="Details">
      <div className="flex flex-col gap-[11px] text-[13px]">
        <Row label="Status">
          <StatusBadge status={bill.status} />
        </Row>
        <Row label="Issue date">{formatDate(bill.issueDate)}</Row>
        <Row label="Due date">{formatDate(bill.dueDate)}</Row>
        {scheduled?.scheduledFor && (
          <Row label="Scheduled for">{formatDate(scheduled.scheduledFor)}</Row>
        )}
        <Row label="Payment method">{scheduled?.method ?? 'ACH'}</Row>
        <Row label="Currency">{bill.currency}</Row>
        <div className="flex border-t border-gray-200 pt-[11px]">
          <span className="font-semibold">Total</span>
          <span className="ml-auto font-bold">
            <Money cents={bill.totalCents} />
          </span>
        </div>
      </div>
    </Card>
  )
}
