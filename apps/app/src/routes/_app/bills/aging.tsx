import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Card } from '@stubramp/ui/card'
import { StatTile } from '@stubramp/ui/stat-tile'
import { AGING_TILES, computeAging } from '../../../lib/aging'
import { billsQueryOptions } from '../../../lib/bills-queries'
import { formatCents } from '../../../lib/money'
import { formatDate } from '../../../lib/format'
import { Money } from '../../../components/bill-pay/Money'
import { VendorAvatar } from '../../../components/bill-pay/VendorAvatar'

export const Route = createFileRoute('/_app/bills/aging')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(billsQueryOptions())
    return { now: Date.now() }
  },
  component: AgingPage,
})

const GRID = 'grid grid-cols-[1.4fr_0.9fr_1fr_1fr_1fr_1fr_1fr] gap-2'

function AgingPage() {
  const { now } = Route.useLoaderData()
  const { data: bills } = useSuspenseQuery(billsQueryOptions())
  const aging = computeAging(bills, now)

  return (
    <div>
      <div className="mb-[18px] grid grid-cols-4 gap-3">
        {AGING_TILES.map((t) => (
          <StatTile
            key={t.key}
            label={t.label}
            value={formatCents(aging.tiles[t.key])}
            style={{ borderTop: `3px solid ${t.color}` }}
          />
        ))}
      </div>

      <Card padded={false} header="Unpaid bills by age">
        <div
          className={`${GRID} border-b border-gray-200 bg-surface-page px-4 py-[11px] text-xs font-medium uppercase tracking-wide text-gray-500`}
        >
          <span>Vendor</span>
          <span>Earliest due</span>
          <span className="text-right">Current</span>
          <span className="text-right">1–30</span>
          <span className="text-right">31–60</span>
          <span className="text-right">60+</span>
          <span className="text-right">Total</span>
        </div>
        {aging.rows.length === 0 ? (
          <div className="px-12 py-12 text-center text-sm text-gray-500">
            No outstanding bills.
          </div>
        ) : (
          aging.rows.map((r) => (
            <div
              key={r.vendorId}
              className={`${GRID} border-b border-gray-200 px-4 py-3 text-[13px] tabular-nums`}
            >
              <span className="flex items-center gap-2.5 font-medium">
                <VendorAvatar name={r.vendor} size={24} />
                {r.vendor}
              </span>
              <span className="text-gray-600">{formatDate(r.dueIso)}</span>
              <span className="text-right">
                <Money cents={r.current} />
              </span>
              <span className="text-right">
                <Money cents={r.d1_30} />
              </span>
              <span className="text-right">
                <Money cents={r.d31_60} />
              </span>
              <span className="text-right text-status-negative">
                <Money cents={r.d60plus} />
              </span>
              <span className="text-right font-semibold">
                <Money cents={r.total} />
              </span>
            </div>
          ))
        )}
        <div
          className={`${GRID} bg-surface-page px-4 py-3 text-[13px] font-bold tabular-nums`}
        >
          <span>Total outstanding</span>
          <span />
          <span className="text-right">
            <Money cents={aging.totals.current} />
          </span>
          <span className="text-right">
            <Money cents={aging.totals.d1_30} />
          </span>
          <span className="text-right">
            <Money cents={aging.totals.d31_60} />
          </span>
          <span className="text-right">
            <Money cents={aging.totals.d60plus} />
          </span>
          <span className="text-right">
            <Money cents={aging.totals.total} />
          </span>
        </div>
      </Card>
    </div>
  )
}
