import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Card } from '@stubramp/ui/card'
import {
  billsQueryOptions,
  vendorsQueryOptions,
} from '../../../lib/bills-queries'
import { vendorRollups } from '../../../lib/aging'
import { Money } from '../../../components/bill-pay/Money'
import { VendorAvatar } from '../../../components/bill-pay/VendorAvatar'

export const Route = createFileRoute('/_app/bills/vendors')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(vendorsQueryOptions()),
      context.queryClient.ensureQueryData(billsQueryOptions()),
    ])
  },
  component: VendorsPage,
})

const GRID = 'grid grid-cols-[1.8fr_1fr_1fr_1fr] items-center gap-2'

function VendorsPage() {
  const { data: vendorPage } = useSuspenseQuery(vendorsQueryOptions())
  const { data: bills } = useSuspenseQuery(billsQueryOptions())
  const rollups = vendorRollups(bills)

  return (
    <Card padded={false} header="Vendors">
      <div
        className={`${GRID} border-b border-gray-200 bg-surface-page px-4 py-[11px] text-xs font-medium uppercase tracking-wide text-gray-500`}
      >
        <span>Vendor</span>
        <span>Terms</span>
        <span className="text-right">Open bills</span>
        <span className="text-right">Open amount</span>
      </div>
      {vendorPage.data.length === 0 ? (
        <div className="px-12 py-12 text-center text-sm text-gray-500">
          No vendors yet.
        </div>
      ) : (
        vendorPage.data.map((v) => {
          const roll = rollups.get(v.id)
          return (
            <div
              key={v.id}
              className={`${GRID} border-b border-gray-200 px-4 py-3 text-[13px]`}
            >
              <span className="flex items-center gap-2.5 font-medium">
                <VendorAvatar name={v.name} />
                {v.name}
              </span>
              <span className="text-gray-600">Net 30</span>
              <span className="text-right">{roll?.openCount ?? 0}</span>
              <span className="text-right font-semibold">
                <Money cents={roll?.openCents ?? 0} />
              </span>
            </div>
          )
        })
      )}
    </Card>
  )
}
