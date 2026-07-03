import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { Card, toDateInputValue, useToast } from '@stubramp/ui'
import {
  createBillFn,
  createBillInput,
  transitionBillFn,
} from '../../../lib/bills'
import { billKeys, vendorsQueryOptions } from '../../../lib/bills-queries'
import { can } from '../../../lib/permissions'
import { BillDetailsForm } from '../../../components/bill-pay/BillDetailsForm'
import type { DraftMeta } from '../../../components/bill-pay/BillDetailsForm'
import { BillSummaryCard } from '../../../components/bill-pay/BillSummaryCard'
import {
  LineItemEditor,
  newDraftLine,
} from '../../../components/bill-pay/LineItemEditor'
import type { DraftLine } from '../../../components/bill-pay/LineItemEditor'
import {
  InvoiceDoc,
  buildInvoiceDoc,
} from '../../../components/bill-pay/InvoiceDoc'
import { SplitsModal } from '../../../components/bill-pay/SplitsModal'
import { UploadFlow } from '../../../components/bill-pay/UploadFlow'

export const Route = createFileRoute('/_app/bills/new')({
  validateSearch: z.object({ mode: z.enum(['upload']).optional() }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(vendorsQueryOptions())
  },
  component: BillCreatePage,
})

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function BillCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { mode } = Route.useSearch()
  const { user } = Route.useRouteContext()
  const { data: vendorPage } = useSuspenseQuery(vendorsQueryOptions())
  const vendors = vendorPage.data

  const [showUpload, setShowUpload] = useState(mode === 'upload')
  const [meta, setMeta] = useState<DraftMeta>({
    vendorId: '',
    billNumber: '',
    issueDate: todayIso(),
    dueDate: '',
  })
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine()])
  const [splitLineId, setSplitLineId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const total = lines.reduce((s, l) => s + l.amountCents, 0)
  const vendorLabel = vendors.find((v) => v.id === meta.vendorId)?.name ?? ''
  const canCreate = can(user.role, 'bill:create')
  const splitLine = lines.find((l) => l.id === splitLineId) ?? null

  if (showUpload) {
    return (
      <div>
        <BackLink onClick={() => navigate({ to: '/bills' })} />
        <h1 className="mb-5 text-3xl font-semibold tracking-[-0.02em]">
          Upload invoice
        </h1>
        <UploadFlow
          onCancel={() => navigate({ to: '/bills' })}
          onAccept={(parsed) => {
            setMeta((m) => ({
              ...m,
              billNumber: parsed.billNumber,
              issueDate: toDateInputValue(parsed.issueDate) || m.issueDate,
              dueDate: toDateInputValue(parsed.dueDate),
            }))
            setLines(
              parsed.lines.map((l) => ({
                ...newDraftLine(),
                description: l.description,
                amountCents: l.unitCents,
              })),
            )
            setShowUpload(false)
            toast({ message: 'Fields parsed — review and pick the vendor.' })
          }}
        />
      </div>
    )
  }

  function buildPayload() {
    return {
      vendorId: meta.vendorId,
      billNumber: meta.billNumber,
      source: 'MANUAL' as const,
      issueDate: meta.issueDate,
      dueDate: meta.dueDate,
      currency: 'USD',
      lines: lines.map((l) => {
        const sum = l.splits.reduce((s, sp) => s + sp.amountCents, 0)
        const splitsOk = l.splits.length > 0 && sum === l.amountCents
        return {
          description: l.description,
          quantity: 1,
          unitCents: l.amountCents,
          classification: l.classification,
          splits: splitsOk
            ? l.splits
            : [
                {
                  costCenter: l.splits[0]?.costCenter ?? 'General',
                  amountCents: l.amountCents,
                },
              ],
        }
      }),
    }
  }

  async function save(submit: boolean) {
    if (!meta.vendorId)
      return toast({ message: 'Select a vendor first.', tone: 'negative' })
    if (total <= 0)
      return toast({ message: 'Add a line amount.', tone: 'negative' })

    const payload = buildPayload()
    const parsed = createBillInput.safeParse(payload)
    if (!parsed.success) {
      return toast({
        message:
          parsed.error.issues[0]?.message ?? 'Please check the bill details.',
        tone: 'negative',
      })
    }

    setBusy(true)
    try {
      const res = await createBillFn({ data: parsed.data })
      if (!res.ok) return toast({ message: res.error, tone: 'negative' })

      const bill = res.data
      if (submit) {
        const t = await transitionBillFn({
          data: { id: bill.id, to: 'SUBMITTED' },
        })
        if (!t.ok) {
          toast({
            message: `Draft saved, but submit failed: ${t.error}`,
            tone: 'negative',
          })
        }
      }
      await queryClient.invalidateQueries({ queryKey: billKeys.all })
      toast({
        message: submit ? 'Bill submitted for approval' : 'Draft saved',
        tone: 'positive',
      })
      navigate({ to: '/bills/$billId', params: { billId: bill.id } })
    } finally {
      setBusy(false)
    }
  }

  const previewDoc = buildInvoiceDoc({
    vendorName: vendorLabel,
    invoiceNo: meta.billNumber,
    issueDate: meta.issueDate,
    dueDate: meta.dueDate,
    lines: lines.map((l) => ({
      description: l.description,
      quantity: 1,
      unitCents: l.amountCents,
      amountCents: l.amountCents,
    })),
    totalCents: total,
  })

  return (
    <div>
      <BackLink onClick={() => navigate({ to: '/bills' })} />
      <h1 className="mb-5 text-3xl font-semibold tracking-[-0.02em]">
        New bill
      </h1>

      <div className="grid grid-cols-[1.4fr_1fr] items-start gap-[18px]">
        <div className="flex flex-col gap-[18px]">
          <BillDetailsForm
            meta={meta}
            vendors={vendors}
            onChange={(next) => setMeta((m) => ({ ...m, ...next }))}
          />
          <LineItemEditor
            lines={lines}
            onChange={setLines}
            onOpenSplits={setSplitLineId}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <BillSummaryCard
            vendorLabel={vendorLabel}
            lineCount={lines.length}
            totalCents={total}
            busy={busy}
            canCreate={canCreate}
            onSubmit={() => void save(true)}
            onSaveDraft={() => void save(false)}
          />
          <Card header="Document preview" padded={false}>
            <InvoiceDoc doc={previewDoc} />
          </Card>
        </div>
      </div>

      {splitLine && (
        <SplitsModal
          open
          lineDescription={splitLine.description}
          lineAmountCents={splitLine.amountCents}
          initial={splitLine.splits}
          onClose={() => setSplitLineId(null)}
          onSave={(splits) => {
            setLines((ls) =>
              ls.map((l) => (l.id === splitLineId ? { ...l, splits } : l)),
            )
            setSplitLineId(null)
          }}
        />
      )}
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-ink-900"
    >
      <ArrowLeft size={15} />
      All bills
    </button>
  )
}
