import { z } from 'zod'
import {
  createBillInput,
  createVendorInput,
  settlePaymentInput,
  transitionInput,
} from '@stubramp/contracts/schemas'
import type {
  CreateBillInput,
  CreateVendorInput,
  SettlePaymentInput,
  TransitionInput,
} from '@stubramp/contracts/schemas'
import type {
  BillSource,
  BillStatus,
  Classification,
  PaymentMethod,
  PaymentStatus,
} from '@stubramp/contracts/enums'
import { apiFetch, mapApiError } from './api'

// ---------------------------------------------------------------------------
// Payables domain (client side). The domain enums + Zod wire contract now live
// in @stubramp/contracts and are re-exported here so this module stays the app's
// one import site for them. Response shapes (DTOs returned by the API) and the
// browser data functions that call the Fastify API live here.
// ---------------------------------------------------------------------------

// Enums / unions + Zod wire contract — single source of truth in @stubramp/contracts.
export { BILL_STATUSES } from '@stubramp/contracts/enums'
export type {
  BillStatus,
  Classification,
  PaymentMethod,
  PaymentStatus,
  BillSource,
} from '@stubramp/contracts/enums'
export {
  createBillInput,
  transitionInput,
  createVendorInput,
  settlePaymentInput,
}
export type { CreateBillInput, TransitionInput, SettlePaymentInput }

// ---- Response shapes (DTOs returned by the API) ----

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

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ---- Data functions (call the API from the browser) ----

export async function listBillsFn({
  data,
}: {
  data?: { status?: BillStatus }
} = {}): Promise<BillListItem[]> {
  const { status, json } = await apiFetch('/bills', {
    searchParams: { status: data?.status },
  })
  if (status >= 400) return []
  return json as BillListItem[]
}

export async function getBillFn({
  data,
}: {
  data: { id: string }
}): Promise<BillWithRelations | null> {
  const { id } = z.object({ id: z.string().uuid() }).parse(data)
  const { status, json } = await apiFetch(`/bills/${id}`)
  if (status >= 400) return null
  return json as BillWithRelations
}

export async function createBillFn({
  data,
}: {
  data: CreateBillInput
}): Promise<MutationResult<BillWithRelations>> {
  const parsed = createBillInput.parse(data)
  const { status, json } = await apiFetch('/bills', {
    method: 'POST',
    body: parsed,
  })
  if (status >= 400) return { ok: false, error: mapApiError(status, json) }
  return { ok: true, data: json as BillWithRelations }
}

export async function transitionBillFn({
  data,
}: {
  // Parse *input* type: callers pass `scheduledFor` as a date string, which the
  // shared contract's z.coerce.date() coerces on parse.
  data: z.input<typeof transitionInput> & { id: string }
}): Promise<MutationResult<BillWithRelations>> {
  const id = z.string().uuid().parse(data.id)
  const body = transitionInput.parse(data)
  const { status, json } = await apiFetch(`/bills/${id}/transitions`, {
    method: 'POST',
    body,
  })
  if (status >= 400) return { ok: false, error: mapApiError(status, json) }
  return { ok: true, data: json as BillWithRelations }
}

export async function listVendorsFn({
  data,
}: {
  data?: { page?: number; pageSize?: number }
} = {}): Promise<Paginated<Vendor>> {
  const { status, json } = await apiFetch('/vendors', {
    searchParams: { page: data?.page, pageSize: data?.pageSize ?? 100 },
  })
  if (status >= 400)
    return { data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }
  return json as Paginated<Vendor>
}

export async function createVendorFn({
  data,
}: {
  data: CreateVendorInput
}): Promise<MutationResult<Vendor>> {
  const parsed = createVendorInput.parse(data)
  const body = { ...parsed, email: parsed.email || undefined }
  const { status, json } = await apiFetch('/vendors', {
    method: 'POST',
    body,
  })
  if (status >= 400) return { ok: false, error: mapApiError(status, json) }
  return { ok: true, data: json as Vendor }
}

export async function settlePaymentFn({
  data,
}: {
  data: SettlePaymentInput & { paymentId: string }
}): Promise<MutationResult<BillWithRelations>> {
  const paymentId = z.string().uuid().parse(data.paymentId)
  const { outcome } = settlePaymentInput.parse(data)
  const { status, json } = await apiFetch(`/payments/${paymentId}/settle`, {
    method: 'POST',
    body: { outcome },
  })
  if (status >= 400) return { ok: false, error: mapApiError(status, json) }
  return { ok: true, data: json as BillWithRelations }
}
