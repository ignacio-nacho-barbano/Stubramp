import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { Card, toDateInputValue, useToast } from '@stubramp/ui'
import { matchVendor } from '@stubramp/core/vendors'
import {
  createBillFn,
  createBillInput,
  transitionBillFn,
} from '../../../lib/bills'
import { billKeys, vendorsQueryOptions } from '../../../lib/bills-queries'
import { can } from '../../../lib/permissions'
import { BillDetailsForm } from '../../../components/bill-pay/BillDetailsForm'
import type { DraftMeta } from '../../../components/bill-pay/BillDetailsForm'
import { VendorFormModal } from '../../../components/bill-pay/VendorFormModal'
import { BillSummaryCard } from '../../../components/bill-pay/BillSummaryCard'
import {
  LineItemEditor,
  newDraftLine,
} from '../../../components/bill-pay/LineItemEditor'
import type { DraftLine } from '../../../components/bill-pay/LineItemEditor'
import {
  InvoicePreview,
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
  // Tracks how this draft originated, so a bill created from an uploaded PDF is
  // stamped source: UPLOAD (vs. MANUAL for the typed-in flow).
  const [source, setSource] = useState<'MANUAL' | 'UPLOAD'>('MANUAL')
  const [meta, setMeta] = useState<DraftMeta>({
    vendorId: '',
    billNumber: '',
    issueDate: todayIso(),
    dueDate: '',
  })
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine()])
  const [splitLineId, setSplitLineId] = useState<string | null>(null)
  const [addingVendor, setAddingVendor] = useState(false)
  // Vendor name parsed off an uploaded invoice that didn't match an existing
  // vendor — surfaced in the form and used to pre-fill the create-vendor modal.
  const [detectedVendorName, setDetectedVendorName] = useState('')

  // Creates the draft, then (optionally) submits it for approval. Both API calls
  // are sequenced inside the mutationFn so `isPending` covers the whole flow and
  // a partial success (draft saved, submit failed) surfaces its own warning.
  const createBill = useMutation({
    mutationFn: async ({
      data,
      submit,
    }: {
      data: Parameters<typeof createBillFn>[0]['data']
      submit: boolean
    }) => {
      const res = await createBillFn({ data })
      if (!res.ok) return { ok: false as const, error: res.error }
      let submitError: string | undefined
      if (submit) {
        const t = await transitionBillFn({
          data: { id: res.data.id, to: 'SUBMITTED' },
        })
        if (!t.ok) submitError = t.error
      }
      return { ok: true as const, bill: res.data, submit, submitError }
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        toast({ message: res.error, tone: 'negative' })
        return
      }
      await queryClient.invalidateQueries({ queryKey: billKeys.all })
      if (res.submitError) {
        toast({
          message: `Draft saved, but submit failed: ${res.submitError}`,
          tone: 'negative',
        })
      } else {
        toast({
          message: res.submit ? 'Bill submitted for approval' : 'Draft saved',
          tone: 'positive',
        })
      }
      navigate({ to: '/bills/$billId', params: { billId: res.bill.id } })
    },
  })

  const canManageVendors = can(user.role, 'vendor:manage')

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
            // Pre-select the vendor when the parsed name matches one we know
            // (ignoring case / punctuation / company suffixes); otherwise keep
            // the detected name so the form can offer a one-click create.
            const matched = parsed.vendorName
              ? matchVendor(parsed.vendorName, vendors)
              : undefined
            setDetectedVendorName(matched ? '' : parsed.vendorName)
            setMeta((m) => ({
              ...m,
              vendorId: matched?.id ?? m.vendorId,
              billNumber: parsed.billNumber,
              issueDate: toDateInputValue(parsed.issueDate) || m.issueDate,
              dueDate: toDateInputValue(parsed.dueDate),
            }))
            // Seed line items, then reconcile them up to the invoice's stated
            // Total Due: the parsed items sum to the subtotal, so any gap (tax,
            // fees) is added as one line, keeping the bill total — which the
            // server derives from the line items — equal to what the invoice says.
            const items = parsed.lines.map((l) => ({
              ...newDraftLine(),
              description: l.description,
              amountCents: l.unitCents,
            }))
            const itemsSum = items.reduce((s, l) => s + l.amountCents, 0)
            if (items.length === 0 && parsed.totalCents != null) {
              items.push({
                ...newDraftLine(),
                description: 'Invoice total',
                amountCents: parsed.totalCents,
              })
            } else if (
              parsed.totalCents != null &&
              parsed.totalCents !== itemsSum
            ) {
              items.push({
                ...newDraftLine(),
                description: 'Tax & adjustments',
                amountCents: parsed.totalCents - itemsSum,
              })
            }
            setLines(items.length > 0 ? items : [newDraftLine()])
            setSource('UPLOAD')
            setShowUpload(false)
            toast({
              message: matched
                ? 'Invoice parsed — review the details below.'
                : 'Invoice parsed — review the details and pick the vendor.',
            })
          }}
        />
      </div>
    )
  }

  function buildPayload() {
    return {
      vendorId: meta.vendorId,
      billNumber: meta.billNumber,
      source,
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

  function save(submit: boolean) {
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

    createBill.mutate({ data: parsed.data, submit })
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

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-[18px]">
          <BillDetailsForm
            meta={meta}
            vendors={vendors}
            onChange={(next) => setMeta((m) => ({ ...m, ...next }))}
            onAddVendor={
              canManageVendors ? () => setAddingVendor(true) : undefined
            }
            detectedVendorName={detectedVendorName}
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
            busy={createBill.isPending}
            canCreate={canCreate}
            onSubmit={() => save(true)}
            onSaveDraft={() => save(false)}
          />
          <Card header="Document preview" padded={false}>
            <InvoicePreview doc={previewDoc} />
          </Card>
        </div>
      </div>

      {addingVendor && (
        <VendorFormModal
          target="new"
          defaultName={detectedVendorName}
          onCreation={(vendor) => {
            setMeta((m) => ({ ...m, vendorId: vendor.id }))
            setDetectedVendorName('')
            setAddingVendor(false)
          }}
          onClose={() => setAddingVendor(false)}
        />
      )}

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
