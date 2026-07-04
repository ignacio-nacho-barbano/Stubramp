import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  formatDate,
  Money,
  STATUS_LABEL,
  useToast,
  VendorAvatar,
} from '@stubramp/ui'
import { settlePaymentFn, transitionBillFn } from '../../../lib/bills'
import type {
  BillStatus,
  MutationResult,
  PaymentMethod,
  BillWithRelations,
} from '../../../lib/bills'
import { billDetailQueryOptions, billKeys } from '../../../lib/bills-queries'
import { BillActions } from '../../../components/bill-pay/BillActions'
import { BillDetailsCard } from '../../../components/bill-pay/BillDetailsCard'
import { BillTimeline } from '../../../components/bill-pay/BillTimeline'
import {
  InvoiceDoc,
  buildInvoiceDoc,
} from '../../../components/bill-pay/InvoiceDoc'
import { LineItemsCard } from '../../../components/bill-pay/LineItemsCard'

export const Route = createFileRoute('/_app/bills/$billId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      billDetailQueryOptions(params.billId),
    )
  },
  component: BillDetailPage,
})

function BillDetailPage() {
  const { billId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const { data: bill } = useSuspenseQuery(billDetailQueryOptions(billId))

  if (!bill) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        This bill could not be found.{' '}
        <Link to="/bills" className="font-semibold text-accent-700">
          Back to all bills
        </Link>
      </div>
    )
  }

  async function run(
    fn: () => Promise<MutationResult<BillWithRelations>>,
    success: string,
  ) {
    setBusy(true)
    try {
      const res = await fn()
      if (res.ok) {
        queryClient.setQueryData(billKeys.detail(billId), res.data)
        void queryClient.invalidateQueries({ queryKey: billKeys.lists() })
        toast({ message: success, tone: 'positive' })
      } else {
        toast({ message: res.error, tone: 'negative' })
      }
    } finally {
      setBusy(false)
    }
  }

  const onTransition = (to: BillStatus) =>
    run(
      () => transitionBillFn({ data: { id: billId, to } }),
      `Bill ${STATUS_LABEL[to].toLowerCase()}`,
    )

  const onSchedule = (scheduledFor: string, method: PaymentMethod) =>
    run(
      () =>
        transitionBillFn({
          data: { id: billId, to: 'SCHEDULED', scheduledFor, method },
        }),
      'Payment scheduled',
    )

  const onSettle = (outcome: 'SUCCEEDED' | 'FAILED') => {
    const pending = bill.payments.find((p) => p.status === 'PENDING')
    if (!pending) {
      toast({ message: 'No scheduled payment to settle.', tone: 'negative' })
      return
    }
    void run(
      () => settlePaymentFn({ data: { paymentId: pending.id, outcome } }),
      outcome === 'SUCCEEDED'
        ? 'Bill marked as paid'
        : 'Payment marked as failed',
    )
  }

  const doc = buildInvoiceDoc({
    vendorName: bill.vendor.name,
    vendorEmail: bill.vendor.email,
    invoiceNo: bill.billNumber,
    issueDate: bill.issueDate,
    dueDate: bill.dueDate,
    lines: bill.lineItems,
    totalCents: bill.totalCents,
  })

  return (
    <div>
      <button
        onClick={() => navigate({ to: '/bills' })}
        className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-ink-900"
      >
        <ArrowLeft size={15} />
        All bills
      </button>

      <div className="mb-1.5 flex items-start justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <VendorAvatar name={bill.vendor.name} size={44} />
          <div>
            <h1 className="m-0 truncate text-2xl font-semibold tracking-[-0.02em]">
              {bill.vendor.name}
            </h1>
            <div className="mt-0.5 font-mono text-[13px] text-gray-500">
              {bill.billNumber} · due {formatDate(bill.dueDate)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
            Total due
          </div>
          <div className="text-2xl font-semibold">
            <Money cents={bill.totalCents} />
          </div>
        </div>
      </div>

      <Card className="my-[18px]">
        <BillTimeline status={bill.status} />
      </Card>

      <div className="grid grid-cols-[1.6fr_1fr] items-start gap-[18px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Card header="Invoice document" padded={false}>
            <InvoiceDoc doc={doc} />
          </Card>
          <LineItemsCard lines={bill.lineItems} />
        </div>
        <div className="flex flex-col gap-[18px]">
          <BillDetailsCard bill={bill} />
          <BillActions
            bill={bill}
            role={user.role}
            busy={busy}
            onTransition={onTransition}
            onSchedule={onSchedule}
            onSettle={onSettle}
          />
        </div>
      </div>
    </div>
  )
}
