import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Tabs, useToast } from '@stubramp/ui'
import { billKeys, billsQueryOptions } from '../../../lib/bills-queries'
import { transitionBillFn } from '../../../lib/bills'
import type { BillStatus } from '../../../lib/bills'
import { can } from '../../../lib/permissions'
import { BillsTable } from '../../../components/bill-pay/BillsTable'
import { BulkActionBar } from '../../../components/bill-pay/BulkActionBar'

const SUB_TABS: { id: string; label: string; status?: BillStatus }[] = [
  { id: 'ALL', label: 'All bills' },
  { id: 'DRAFT', label: 'Drafts', status: 'DRAFT' },
  { id: 'SUBMITTED', label: 'Needs approval', status: 'SUBMITTED' },
  { id: 'APPROVED', label: 'Approved', status: 'APPROVED' },
  { id: 'SCHEDULED', label: 'Scheduled', status: 'SCHEDULED' },
  { id: 'PAID', label: 'Paid', status: 'PAID' },
]

export const Route = createFileRoute('/_app/bills/')({
  validateSearch: z.object({
    status: z
      .enum(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'SCHEDULED', 'PAID'])
      .catch('ALL')
      .default('ALL'),
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(billsQueryOptions())
    return { now: Date.now() }
  },
  component: BillsListPage,
})

function BillsListPage() {
  const navigate = useNavigate()
  const { status: tab } = Route.useSearch()
  const { now } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: bills } = useSuspenseQuery(billsQueryOptions())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: bills.length }
    for (const b of bills) c[b.status] = (c[b.status] ?? 0) + 1
    return c
  }, [bills])

  const rows = useMemo(() => {
    if (tab === 'ALL') return bills
    return bills.filter((b) => b.status === tab)
  }, [bills, tab])

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedSubmitted = bills.filter(
    (b) => selected.has(b.id) && b.status === 'SUBMITTED',
  )
  const canApprove = can(user.role, 'bill:approve')

  async function bulkApprove() {
    if (!selectedSubmitted.length) {
      toast({ message: 'Only submitted bills can be approved.' })
      return
    }
    setBusy(true)
    const results = await Promise.allSettled(
      selectedSubmitted.map((b) =>
        transitionBillFn({ data: { id: b.id, to: 'APPROVED' } }),
      ),
    )
    const ok = results.filter(
      (r) => r.status === 'fulfilled' && r.value.ok,
    ).length
    const failed = selectedSubmitted.length - ok
    await queryClient.invalidateQueries({ queryKey: billKeys.all })
    setSelected(new Set())
    setBusy(false)
    toast({
      message:
        failed === 0
          ? `${ok} ${ok === 1 ? 'bill' : 'bills'} approved`
          : `${ok} approved · ${failed} failed`,
      tone: failed === 0 ? 'positive' : 'negative',
    })
  }

  return (
    <div>
      <div className="mb-4">
        <Tabs
          tabs={SUB_TABS.map((t) => ({
            id: t.id,
            label: t.label,
            count: counts[t.id] ?? 0,
          }))}
          value={tab}
          onChange={(id) =>
            navigate({ to: '/bills', search: { status: id as typeof tab } })
          }
        />
      </div>

      <BillsTable
        bills={rows}
        now={now}
        selected={selected}
        onToggle={toggle}
        onOpen={(id) =>
          navigate({ to: '/bills/$billId', params: { billId: id } })
        }
      />

      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          canApprove={canApprove && selectedSubmitted.length > 0}
          onApprove={() => void bulkApprove()}
          onClear={() => setSelected(new Set())}
          busy={busy}
        />
      )}
    </div>
  )
}
