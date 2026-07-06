import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Badge, Button, Card, cn, Money, VendorAvatar } from '@stubramp/ui'
import {
  billsQueryOptions,
  vendorsQueryOptions,
} from '../../../lib/bills-queries'
import type { Vendor } from '../../../lib/bills'
import { vendorRollups } from '../../../lib/aging'
import { can } from '../../../lib/permissions'
import {
  METHOD_LABELS,
  TERM_LABELS,
  VendorFormModal,
} from '../../../components/bill-pay/VendorFormModal'

export const Route = createFileRoute('/_app/bills/vendors')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(vendorsQueryOptions()),
      context.queryClient.ensureQueryData(billsQueryOptions()),
    ])
  },
  component: VendorsPage,
})

const GRID =
  'grid grid-cols-[1.6fr_1.4fr_0.85fr_0.8fr_0.9fr_0.65fr_1fr_24px] items-center gap-2'

function VendorsPage() {
  const { user } = Route.useRouteContext()
  const { data: vendorPage } = useSuspenseQuery(vendorsQueryOptions())
  const { data: bills } = useSuspenseQuery(billsQueryOptions())
  const rollups = vendorRollups(bills)
  const canManage = can(user.role, 'vendor:manage')

  // `null` = closed, `'new'` = add form, a Vendor = edit that vendor.
  const [editing, setEditing] = useState<Vendor | 'new' | null>(null)

  const vendors = vendorPage.data

  return (
    <>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[13px] text-gray-500">
          {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}
          {canManage && ' · click a row to edit or remove'}
        </div>
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
            + Add vendor
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div
          className={cn(
            GRID,
            'border-b border-gray-200 bg-surface-page px-4 py-[11px] text-xs font-medium uppercase tracking-wide text-gray-500',
          )}
        >
          <span>Vendor</span>
          <span>Contact</span>
          <span>Terms</span>
          <span>Method</span>
          <span>Status</span>
          <span className="text-right">Open</span>
          <span className="text-right">Open amount</span>
          <span />
        </div>

        {vendors.length === 0 ? (
          <div className="px-12 py-12 text-center text-sm text-gray-500">
            No vendors yet.
          </div>
        ) : (
          vendors.map((v) => {
            const roll = rollups.get(v.id)
            const rowProps = canManage
              ? {
                  onClick: () => setEditing(v),
                  className: `${GRID} cursor-pointer border-b border-gray-200 px-4 py-3 text-[13px] transition-colors hover:bg-surface-page`,
                }
              : {
                  className: `${GRID} border-b border-gray-200 px-4 py-3 text-[13px]`,
                }
            return (
              <div key={v.id} {...rowProps}>
                <span className="flex items-center gap-2.5 font-medium">
                  <VendorAvatar name={v.name} />
                  {v.name}
                </span>
                <span className="truncate text-[12.5px] text-gray-600">
                  {v.email || '—'}
                </span>
                <span className="text-gray-600">
                  {v.terms ? TERM_LABELS[v.terms] : '—'}
                </span>
                <span className="text-gray-600">
                  {v.paymentMethod ? METHOD_LABELS[v.paymentMethod] : '—'}
                </span>
                <span>
                  <Badge tone={v.active ? 'positive' : 'neutral'}>
                    {v.active ? 'Active' : 'Inactive'}
                  </Badge>
                </span>
                <span className="text-right text-gray-600">
                  {roll?.openCount ?? 0}
                </span>
                <span className="text-right font-semibold">
                  <Money cents={roll?.openCents ?? 0} />
                </span>
                <span className="flex justify-end text-gray-400">
                  {canManage && <ChevronRight size={15} />}
                </span>
              </div>
            )
          })
        )}
        <div className="px-4 py-3.5 text-xs text-gray-500">
          A vendor record stores payment terms and a default payment method for
          its bills. Vendors with bills can't be deleted — deactivate them
          instead.
        </div>
      </Card>

      {canManage && (
        <VendorFormModal target={editing} onClose={() => setEditing(null)} />
      )}
    </>
  )
}
