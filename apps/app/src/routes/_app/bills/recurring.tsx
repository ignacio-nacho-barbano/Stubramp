import { createFileRoute } from '@tanstack/react-router'
import { Badge, Card, cn, Money, Switch, VendorAvatar } from '@stubramp/ui'
import { RECURRING_RULES } from '../../../lib/stubs'

export const Route = createFileRoute('/_app/bills/recurring')({
  component: RecurringPage,
})

const GRID = 'grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] items-center gap-2'

// Recurring bills have no backend yet — this renders a labeled fixture so the
// surface exists and matches the design.
function RecurringPage() {
  return (
    <Card
      padded={false}
      header={
        <span className="flex items-center gap-2">
          Recurring bills <Badge tone="neutral">Preview</Badge>
        </span>
      }
    >
      <div
        className={cn(
          GRID,
          'border-b border-gray-200 bg-surface-page px-4 py-[11px] text-xs font-medium uppercase tracking-wide text-gray-500',
        )}
      >
        <span>Vendor</span>
        <span>Cadence</span>
        <span>Next draft</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Active</span>
      </div>
      {RECURRING_RULES.map((r) => (
        <div
          key={r.id}
          className={cn(GRID, 'border-b border-gray-200 px-4 py-3 text-[13px]')}
        >
          <span className="flex items-center gap-2.5 font-medium">
            <VendorAvatar name={r.vendor} size={24} />
            {r.vendor}
          </span>
          <span className="text-gray-600">{r.cadence}</span>
          <span className="text-gray-600">{r.next}</span>
          <span className="text-right font-semibold">
            <Money cents={r.amountCents} />
          </span>
          <span className="flex justify-end">
            <Switch defaultChecked={r.active} />
          </span>
        </div>
      ))}
      <div className="px-4 py-3.5 text-xs text-gray-500">
        Each rule would auto-generate a Draft bill before its due date and
        notify the owner to review. Recurring automation is not wired to the
        backend in this build.
      </div>
    </Card>
  )
}
