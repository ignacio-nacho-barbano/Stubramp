import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  formatDate,
  Modal,
  Money,
  STATUS_LABEL,
  useToast,
  VendorAvatar,
} from '@stubramp/ui'
import {
  deleteBillFn,
  settlePaymentFn,
  transitionBillFn,
} from '../../../lib/bills'
import { can, canDelete } from '../../../lib/permissions'
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
  InvoicePreview,
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

  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: bill } = useSuspenseQuery(billDetailQueryOptions(billId))

  // The data fns resolve to a MutationResult union rather than throwing, so the
  // ok/error branch is handled in onSuccess. On success we seed the detail cache
  // with the fresh aggregate and invalidate the lists so derived views refetch.
  function applyResult(
    res: MutationResult<BillWithRelations>,
    success: string,
  ) {
    if (res.ok) {
      queryClient.setQueryData(billKeys.detail(billId), res.data)
      void queryClient.invalidateQueries({ queryKey: billKeys.lists() })
      toast({ message: success, tone: 'positive' })
    } else {
      toast({ message: res.error, tone: 'negative' })
    }
  }

  const transition = useMutation({
    mutationFn: (data: {
      id: string
      to: BillStatus
      scheduledFor?: string
      method?: PaymentMethod
    }) => transitionBillFn({ data }),
    onSuccess: (res, data) =>
      applyResult(
        res,
        data.to === 'SCHEDULED'
          ? 'Payment scheduled'
          : `Bill ${STATUS_LABEL[data.to].toLowerCase()}`,
      ),
  })

  const settle = useMutation({
    mutationFn: (vars: {
      paymentId: string
      outcome: 'SUCCEEDED' | 'FAILED'
    }) => settlePaymentFn({ data: vars }),
    onSuccess: (res, vars) =>
      applyResult(
        res,
        vars.outcome === 'SUCCEEDED'
          ? 'Bill marked as paid'
          : 'Payment marked as failed',
      ),
  })

  // Delete an unapproved bill. On success there's no aggregate to seed — drop
  // the detail cache, refresh the lists, and return to the bills index.
  const remove = useMutation({
    mutationFn: () => deleteBillFn({ data: { id: billId } }),
    onSuccess: (res) => {
      if (res.ok) {
        setConfirmDelete(false)
        queryClient.removeQueries({ queryKey: billKeys.detail(billId) })
        void queryClient.invalidateQueries({ queryKey: billKeys.lists() })
        toast({ message: 'Bill deleted', tone: 'positive' })
        void navigate({ to: '/bills' })
      } else {
        toast({ message: res.error, tone: 'negative' })
      }
    },
  })

  const busy = transition.isPending || settle.isPending || remove.isPending

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

  const onTransition = (to: BillStatus) => transition.mutate({ id: billId, to })

  const onSchedule = (scheduledFor: string, method: PaymentMethod) =>
    transition.mutate({ id: billId, to: 'SCHEDULED', scheduledFor, method })

  const onSettle = (outcome: 'SUCCEEDED' | 'FAILED') => {
    const pending = bill.payments.find((p) => p.status === 'PENDING')
    if (!pending) {
      toast({ message: 'No scheduled payment to settle.', tone: 'negative' })
      return
    }
    settle.mutate({ paymentId: pending.id, outcome })
  }

  const canDeleteBill = can(user.role, 'bill:delete') && canDelete(bill.status)

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
            <InvoicePreview doc={doc} />
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
          {canDeleteBill && (
            <Card>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Danger zone
              </div>
              <p className="mb-3 text-[13px] leading-relaxed text-gray-500">
                Delete this bill and its line items. This can't be undone.
              </p>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} className="mr-1.5" />
                Delete bill
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title={<span className="text-md font-semibold">Delete bill?</span>}
        footer={
          <>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => remove.mutate()}
            >
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-gray-600">
          This permanently deletes bill{' '}
          <span className="font-mono">{bill.billNumber}</span> from{' '}
          {bill.vendor.name}, along with its line items. This can't be undone.
        </p>
      </Modal>
    </div>
  )
}
