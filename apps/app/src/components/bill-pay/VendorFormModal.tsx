import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Modal, Select, Switch, useToast } from '@stubramp/ui'
import {
  PAYMENT_METHODS,
  PAYMENT_TERMS,
  createVendorFn,
  deleteVendorFn,
  updateVendorFn,
} from '../../lib/bills'
import type { PaymentMethod, PaymentTerms, Vendor } from '../../lib/bills'
import { billKeys } from '../../lib/bills-queries'

// Display labels for the wire enums. Kept here (client-only, user-facing copy)
// per the contract convention that form copy lives in the app, not @contracts.
export const TERM_LABELS: Record<PaymentTerms, string> = {
  DUE_ON_RECEIPT: 'Due on receipt',
  NET_15: 'Net 15',
  NET_30: 'Net 30',
  NET_45: 'Net 45',
  NET_60: 'Net 60',
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  ACH: 'ACH',
  WIRE: 'Wire',
  CHECK: 'Check',
  CARD: 'Card',
}

interface VendorFormModalProps {
  /** `null` → hidden. A vendor → edit that vendor. `'new'` → create form. */
  target: Vendor | 'new' | null
  /** Seeds the name field on the create form (e.g. a vendor parsed off an invoice). */
  defaultName?: string
  onCreation?: (vendor: Vendor) => void
  onClose: () => void
}

interface FormState {
  name: string
  email: string
  terms: PaymentTerms | ''
  paymentMethod: PaymentMethod | ''
  active: boolean
}

function initialState(target: Vendor | 'new', defaultName = ''): FormState {
  if (target === 'new') {
    return {
      name: defaultName,
      email: '',
      terms: '',
      paymentMethod: '',
      active: true,
    }
  }
  return {
    name: target.name,
    email: target.email ?? '',
    terms: target.terms ?? '',
    paymentMethod: target.paymentMethod ?? '',
    active: target.active,
  }
}

export function VendorFormModal({
  target,
  defaultName,
  onCreation,
  onClose,
}: VendorFormModalProps) {
  if (!target) return null
  return (
    <VendorForm
      key={target === 'new' ? 'new' : target.id}
      {...{ target, defaultName, onClose, onCreation }}
    />
  )
}

function VendorForm({
  target,
  defaultName,
  onClose,
  onCreation,
}: VendorFormModalProps & { target: Vendor | 'new' }) {
  const isCreate = target === 'new'
  // The existing vendor when editing (null on the create form) — its id/name
  // drive the update + delete mutations.
  const editingVendor = target === 'new' ? null : target
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(() =>
    initialState(target, defaultName),
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = <TKey extends keyof FormState>(
    key: TKey,
    value: FormState[TKey],
  ) => setForm((f) => ({ ...f, [key]: value }))

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: billKeys.vendors })

  const create = useMutation({
    mutationFn: createVendorFn,
    onSuccess: async (res) => {
      if (!res.ok) return toast({ message: res.error, tone: 'negative' })
      onCreation?.(res.data)
      toast({ message: `${res.data.name} added`, tone: 'positive' })
      await refresh()
      onClose()
    },
  })

  const update = useMutation({
    mutationFn: updateVendorFn,
    onSuccess: async (res) => {
      if (!res.ok) return toast({ message: res.error, tone: 'negative' })
      toast({ message: `${res.data.name} updated`, tone: 'positive' })
      await refresh()
      onClose()
    },
  })

  const remove = useMutation({
    mutationFn: deleteVendorFn,
    onSuccess: async (res) => {
      if (!res.ok) return toast({ message: res.error, tone: 'negative' })
      toast({ message: `${editingVendor?.name} removed`, tone: 'positive' })
      await refresh()
      onClose()
    },
  })

  const busy = create.isPending || update.isPending || remove.isPending

  function save() {
    if (!form.name.trim()) {
      return toast({ message: 'Vendor name is required.', tone: 'negative' })
    }
    if (isCreate) {
      create.mutate({
        data: {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          terms: form.terms || undefined,
          paymentMethod: form.paymentMethod || undefined,
        },
      })
    } else {
      update.mutate({
        data: {
          id: target.id,
          name: form.name.trim(),
          email: form.email.trim() || null,
          terms: form.terms || null,
          paymentMethod: form.paymentMethod || null,
          active: form.active,
        },
      })
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={
        <div className="font-sans text-lg font-semibold text-ink-900">
          {isCreate ? 'Add vendor' : 'Edit vendor'}
        </div>
      }
      footer={
        <>
          {!isCreate &&
            (confirmDelete ? (
              <span className="flex items-center gap-2">
                <span className="text-[13px] text-gray-600">Remove?</span>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    editingVendor &&
                    remove.mutate({ data: { id: editingVendor.id } })
                  }
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep
                </Button>
              </span>
            ) : (
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            ))}
          <span className="ml-auto flex items-center gap-2">
            <Button variant="secondary" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" disabled={busy} onClick={save}>
              {isCreate ? 'Add vendor' : 'Save changes'}
            </Button>
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Vendor name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Acme Cloud Inc."
        />
        <Input
          label="Contact email"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="ap@acme.com"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Payment terms"
            value={form.terms}
            onChange={(e) => set('terms', e.target.value as PaymentTerms | '')}
          >
            <option value="">Not set</option>
            {PAYMENT_TERMS.map((t) => (
              <option key={t} value={t}>
                {TERM_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select
            label="Payment method"
            value={form.paymentMethod}
            onChange={(e) =>
              set('paymentMethod', e.target.value as PaymentMethod | '')
            }
          >
            <option value="">Not set</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        {!isCreate && (
          <Switch
            label="Active"
            checked={form.active}
            onChange={(next) => set('active', next)}
          />
        )}
      </div>
    </Modal>
  )
}
