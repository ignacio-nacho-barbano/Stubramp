import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { apiFetch, mapApiError } from './api-server'

// ---------------------------------------------------------------------------
// Payables domain: shared types, the Zod contract mirroring the API, and the
// server functions that proxy to the Fastify API through the session cookie.
// Types + schemas here are client-safe; only the server-fn handler bodies touch
// ./api-server (server-only).
// ---------------------------------------------------------------------------

export type BillStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PAID'
  | 'REJECTED'
  | 'FAILED'

export type Classification = 'EXPENSE' | 'ITEM'
export type PaymentMethod = 'ACH' | 'WIRE' | 'CHECK' | 'CARD'
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'
export type BillSource = 'MANUAL' | 'UPLOAD' | 'OCR' | 'EMAIL' | 'CSV'

export const BILL_STATUSES: BillStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SCHEDULED',
  'PAID',
  'REJECTED',
  'FAILED',
]

export interface Vendor {
  id: string
  companyId: string
  name: string
  email?: string | null
  bankRef?: string | null
  createdAt: string
  updatedAt: string
}

export interface LineItemSplit {
  id: string
  lineItemId: string
  templateId?: string | null
  costCenter: string
  amountCents: number
}

export interface BillLineItem {
  id: string
  billId: string
  description: string
  quantity: number
  unitCents: number
  amountCents: number
  classification: Classification
  glAccount?: string | null
  splits: LineItemSplit[]
}

export interface Payment {
  id: string
  companyId: string
  billId: string
  amountCents: number
  method: PaymentMethod
  status: PaymentStatus
  scheduledFor?: string | null
  paidAt?: string | null
  createdAt: string
}

export interface BillEvent {
  id: string
  billId: string
  fromStatus?: BillStatus | null
  toStatus: BillStatus
  actor: string
  createdAt: string
}

export interface Bill {
  id: string
  companyId: string
  vendorId: string
  billNumber: string
  status: BillStatus
  source: BillSource
  issueDate: string
  dueDate: string
  currency: string
  totalCents: number
  createdAt: string
  updatedAt: string
}

/** Row shape from GET /bills — bill + vendor + line-item count. */
export interface BillListItem extends Bill {
  vendor: Vendor
  _count: { lineItems: number }
}

/** Full aggregate from GET /bills/:id. */
export interface BillWithRelations extends Bill {
  vendor: Vendor
  lineItems: BillLineItem[]
  payments: Payment[]
  events: BillEvent[]
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ---- Zod contract (mirrors apps/api/src/schemas/bill.schema.ts) ----

export const splitInput = z.object({
  costCenter: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
})

export const lineItemInput = z
  .object({
    description: z.string().min(1, 'Add a description.'),
    quantity: z.number().int().positive().default(1),
    unitCents: z.number().int().nonnegative(),
    classification: z.enum(['EXPENSE', 'ITEM']).default('EXPENSE'),
    glAccount: z.string().optional(),
    splits: z.array(splitInput).min(1, 'Add at least one allocation.'),
  })
  .refine(
    (l) =>
      l.splits.reduce((s, sp) => s + sp.amountCents, 0) ===
      l.quantity * l.unitCents,
    {
      message: 'Split allocations must sum to the line total.',
      path: ['splits'],
    },
  )

export const createBillInput = z.object({
  vendorId: z.string().uuid('Select a vendor.'),
  billNumber: z.string().min(1, 'Enter an invoice number.'),
  source: z.enum(['MANUAL', 'UPLOAD', 'OCR', 'EMAIL', 'CSV']).default('MANUAL'),
  issueDate: z.string().min(1, 'Choose an issue date.'),
  dueDate: z.string().min(1, 'Choose a due date.'),
  currency: z.string().length(3).default('USD'),
  lines: z.array(lineItemInput).min(1, 'Add at least one line item.'),
})

export type CreateBillInput = z.infer<typeof createBillInput>

export const transitionInput = z.object({
  id: z.string().uuid(),
  to: z.enum([
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'SCHEDULED',
    'PAID',
    'REJECTED',
    'FAILED',
  ]),
  scheduledFor: z.string().optional(),
  method: z.enum(['ACH', 'WIRE', 'CHECK', 'CARD']).optional(),
})

export const createVendorInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  bankRef: z.string().optional(),
})

export const settlePaymentInput = z.object({
  paymentId: z.string().uuid(),
  outcome: z.enum(['SUCCEEDED', 'FAILED']),
})

export type MutationResult<T> =
  { ok: true; data: T } | { ok: false; error: string }

// ---- Server functions ----

export const listBillsFn = createServerFn({ method: 'GET' })
  .validator((data: { status?: BillStatus } | undefined) => data ?? {})
  .handler(async ({ data }): Promise<BillListItem[]> => {
    const { status, json } = await apiFetch('/bills', {
      searchParams: { status: data.status },
    })
    if (status >= 400) return []
    return json as BillListItem[]
  })

export const getBillFn = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }): Promise<BillWithRelations | null> => {
    const { status, json } = await apiFetch(`/bills/${data.id}`)
    if (status >= 400) return null
    return json as BillWithRelations
  })

export const createBillFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createBillInput.parse(data))
  .handler(async ({ data }): Promise<MutationResult<BillWithRelations>> => {
    const { status, json } = await apiFetch('/bills', {
      method: 'POST',
      body: data,
    })
    if (status >= 400) return { ok: false, error: mapApiError(status, json) }
    return { ok: true, data: json as BillWithRelations }
  })

export const transitionBillFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => transitionInput.parse(data))
  .handler(async ({ data }): Promise<MutationResult<BillWithRelations>> => {
    const { id, ...body } = data
    const { status, json } = await apiFetch(`/bills/${id}/transitions`, {
      method: 'POST',
      body,
    })
    if (status >= 400) return { ok: false, error: mapApiError(status, json) }
    return { ok: true, data: json as BillWithRelations }
  })

export const listVendorsFn = createServerFn({ method: 'GET' })
  .validator(
    (data: { page?: number; pageSize?: number } | undefined) => data ?? {},
  )
  .handler(async ({ data }): Promise<Paginated<Vendor>> => {
    const { status, json } = await apiFetch('/vendors', {
      searchParams: { page: data.page, pageSize: data.pageSize ?? 100 },
    })
    if (status >= 400)
      return { data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }
    return json as Paginated<Vendor>
  })

export const createVendorFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createVendorInput.parse(data))
  .handler(async ({ data }): Promise<MutationResult<Vendor>> => {
    const body = { ...data, email: data.email || undefined }
    const { status, json } = await apiFetch('/vendors', {
      method: 'POST',
      body,
    })
    if (status >= 400) return { ok: false, error: mapApiError(status, json) }
    return { ok: true, data: json as Vendor }
  })

export const settlePaymentFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => settlePaymentInput.parse(data))
  .handler(async ({ data }): Promise<MutationResult<BillWithRelations>> => {
    const { status, json } = await apiFetch(
      `/payments/${data.paymentId}/settle`,
      {
        method: 'POST',
        body: { outcome: data.outcome },
      },
    )
    if (status >= 400) return { ok: false, error: mapApiError(status, json) }
    return { ok: true, data: json as BillWithRelations }
  })
