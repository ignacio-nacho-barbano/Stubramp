// Fixtures for surfaces that have no backend yet (notifications, recurring
// bills). Clearly isolated here so they're easy to replace with real endpoints
// later. Nothing here calls the API.

export interface StubNotification {
  id: string
  title: string
  meta: string
  tone: string
}

export const NOTIFICATIONS: StubNotification[] = [
  {
    id: 'n1',
    title: 'A bill needs your approval',
    meta: '$7,800.00 · 8 min ago',
    tone: 'var(--amber-600)',
  },
  {
    id: 'n2',
    title: 'Payment scheduled — Globex Corp',
    meta: '$980.00 · 1 hr ago',
    tone: 'var(--navy-700)',
  },
  {
    id: 'n3',
    title: 'OCR finished parsing acme-INV-0042.pdf',
    meta: 'Ready to review · 2 hr ago',
    tone: 'var(--green-600)',
  },
]

export interface RecurringRule {
  id: string
  vendor: string
  cadence: string
  next: string
  amountCents: number
  active: boolean
}

export const RECURRING_RULES: RecurringRule[] = [
  {
    id: 'r1',
    vendor: 'Acme Cloud Inc.',
    cadence: 'Monthly',
    next: 'Aug 1, 2026',
    amountCents: 125000,
    active: true,
  },
  {
    id: 'r2',
    vendor: 'Northwind Supply',
    cadence: 'Quarterly',
    next: 'Sep 15, 2026',
    amountCents: 420000,
    active: true,
  },
  {
    id: 'r3',
    vendor: 'Hooli',
    cadence: 'Monthly',
    next: 'Aug 10, 2026',
    amountCents: 210000,
    active: false,
  },
]
