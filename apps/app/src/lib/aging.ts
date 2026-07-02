import type { BillListItem } from './bills'

// Client-side AP aging: bucket unpaid bills by how overdue they are relative to
// a fixed "today" (passed from the loader so SSR and client agree). Derived
// entirely from GET /bills — there is no dedicated aging endpoint.

export type AgingKey = 'current' | 'd1_30' | 'd31_60' | 'd60plus'

export const AGING_TILES: { key: AgingKey; label: string; color: string }[] = [
  { key: 'current', label: 'Current', color: 'var(--green-600)' },
  { key: 'd1_30', label: '1–30 days', color: 'var(--amber-600)' },
  { key: 'd31_60', label: '31–60 days', color: 'var(--amber-600)' },
  { key: 'd60plus', label: '60+ days', color: 'var(--red-600)' },
]

const DAY_MS = 86_400_000
// Bills in these states are settled/void and excluded from what is owed.
const CLOSED = new Set(['PAID', 'REJECTED'])

function bucketOf(dueIso: string, today: number): AgingKey {
  const due = new Date(dueIso).getTime()
  const daysOverdue = Math.floor((today - due) / DAY_MS)
  if (daysOverdue <= 0) return 'current'
  if (daysOverdue <= 30) return 'd1_30'
  if (daysOverdue <= 60) return 'd31_60'
  return 'd60plus'
}

export interface AgingRow {
  vendorId: string
  vendor: string
  dueIso: string
  current: number
  d1_30: number
  d31_60: number
  d60plus: number
  total: number
}

export interface Aging {
  tiles: Record<AgingKey, number>
  rows: AgingRow[]
  totals: Record<AgingKey, number> & { total: number }
}

/** Bucket a bill list into aging rows + column/tile totals (all in cents). */
export function computeAging(bills: BillListItem[], today: number): Aging {
  const rowMap = new Map<string, AgingRow>()
  const tiles: Record<AgingKey, number> = {
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d60plus: 0,
  }

  for (const b of bills) {
    if (CLOSED.has(b.status)) continue
    const bucket = bucketOf(b.dueDate, today)
    tiles[bucket] += b.totalCents

    let row = rowMap.get(b.vendorId)
    if (!row) {
      row = {
        vendorId: b.vendorId,
        vendor: b.vendor.name,
        dueIso: b.dueDate,
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d60plus: 0,
        total: 0,
      }
      rowMap.set(b.vendorId, row)
    }
    row[bucket] += b.totalCents
    row.total += b.totalCents
    // Track the earliest due date across a vendor's bills.
    if (new Date(b.dueDate) < new Date(row.dueIso)) row.dueIso = b.dueDate
  }

  const rows = [...rowMap.values()].sort((a, b) => b.total - a.total)
  const totals = {
    current: tiles.current,
    d1_30: tiles.d1_30,
    d31_60: tiles.d31_60,
    d60plus: tiles.d60plus,
    total: rows.reduce((s, r) => s + r.total, 0),
  }
  return { tiles, rows, totals }
}

export interface VendorRollup {
  vendorId: string
  vendor: string
  openCount: number
  openCents: number
}

/** Per-vendor open-bill rollup for the Vendors tab (unpaid bills only). */
export function vendorRollups(
  bills: BillListItem[],
): Map<string, VendorRollup> {
  const map = new Map<string, VendorRollup>()
  for (const b of bills) {
    if (CLOSED.has(b.status)) continue
    let r = map.get(b.vendorId)
    if (!r) {
      r = {
        vendorId: b.vendorId,
        vendor: b.vendor.name,
        openCount: 0,
        openCents: 0,
      }
      map.set(b.vendorId, r)
    }
    r.openCount += 1
    r.openCents += b.totalCents
  }
  return map
}
