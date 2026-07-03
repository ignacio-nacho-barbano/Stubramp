import type { BillStatus } from './bills'

// Status label/tone/dot mappings now live in @stubramp/ui (bill-status), shared
// across apps. This module keeps the detail-view timeline logic, which is
// specific to this app.

export interface TimelineStep {
  key: string
  label: string
  done: boolean
  current: boolean
  failed?: boolean
}

// The happy-path lifecycle. Off-path terminals (REJECTED/FAILED) branch below.
const FLOW: { key: BillStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'PAID', label: 'Paid' },
]

/** Steps for the detail-view status timeline, with done/current/failed flags. */
export function billTimeline(status: BillStatus): TimelineStep[] {
  if (status === 'REJECTED') {
    return [
      { key: 'DRAFT', label: 'Draft', done: true, current: false },
      { key: 'SUBMITTED', label: 'Submitted', done: true, current: false },
      {
        key: 'REJECTED',
        label: 'Rejected',
        done: false,
        current: true,
        failed: true,
      },
    ]
  }
  if (status === 'FAILED') {
    return [
      { key: 'DRAFT', label: 'Draft', done: true, current: false },
      { key: 'SUBMITTED', label: 'Submitted', done: true, current: false },
      { key: 'APPROVED', label: 'Approved', done: true, current: false },
      { key: 'SCHEDULED', label: 'Scheduled', done: true, current: false },
      {
        key: 'FAILED',
        label: 'Failed',
        done: false,
        current: true,
        failed: true,
      },
    ]
  }
  const idx = FLOW.findIndex((s) => s.key === status)
  return FLOW.map((s, i) => ({
    key: s.key,
    label: s.label,
    done: i < idx,
    current: i === idx,
  }))
}
