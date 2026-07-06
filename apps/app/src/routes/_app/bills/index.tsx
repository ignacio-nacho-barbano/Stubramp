import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { Tabs, useToast } from '@stubramp/ui'
import { billKeys, billsQueryOptions } from '../../../lib/bills-queries'
import { transitionBillFn } from '../../../lib/bills'
import type { BillStatus } from '../../../lib/bills'
import { computeBillStats } from '../../../lib/aging'
import { can } from '../../../lib/permissions'
import { BillsTable } from '../../../components/bill-pay/BillsTable'
import { BulkActionBar } from '../../../components/bill-pay/BulkActionBar'
import { BillKpiTiles } from '../../../components/bill-pay/BillKpiTiles'
import { DashboardCharts } from '../../../components/bill-pay/DashboardCharts'

type SortBy = 'due' | 'amount' | 'vendor'

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
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('due')

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: bills.length }
    for (const b of bills) c[b.status] = (c[b.status] ?? 0) + 1
    return c
  }, [bills])

  const stats = useMemo(() => computeBillStats(bills, now), [bills, now])

  const rows = useMemo(() => {
    let list = tab === 'ALL' ? bills : bills.filter((b) => b.status === tab)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (b) =>
          b.vendor.name.toLowerCase().includes(q) ||
          b.billNumber.toLowerCase().includes(q),
      )
    }
    const sorted = [...list]
    if (sortBy === 'amount') {
      sorted.sort((a, b) => b.totalCents - a.totalCents)
    } else if (sortBy === 'vendor') {
      sorted.sort((a, b) => a.vendor.name.localeCompare(b.vendor.name))
    } else {
      sorted.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
    }
    return sorted
  }, [bills, tab, search, sortBy])

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
      <BillKpiTiles
        stats={stats}
        activeTab={tab}
        onSelect={(status) => navigate({ to: '/bills', search: { status } })}
      />

      <DashboardCharts bills={bills} now={now} />

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="flex h-[38px] min-w-[200px] max-w-[340px] flex-1 items-center gap-2 rounded-sm border border-gray-200 bg-surface-card px-2.5">
          <Search size={15} className="shrink-0 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor or invoice…"
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs tabular-nums text-gray-500">
            {rows.length} {rows.length === 1 ? 'result' : 'results'}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-[38px] cursor-pointer rounded-sm border border-gray-200 bg-surface-card px-2.5 text-[13px] text-ink-900"
          >
            <option value="due">Sort: Due date</option>
            <option value="amount">Sort: Amount</option>
            <option value="vendor">Sort: Vendor</option>
          </select>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <Tabs
          className="min-w-max"
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
