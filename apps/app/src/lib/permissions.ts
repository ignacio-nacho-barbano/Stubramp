import type { Action } from '@stubramp/contracts/permissions'
import type { BillStatus } from './bills'

// RBAC (Action, MATRIX, can) is shared with the API via @stubramp/contracts —
// this is UX-only gating; the API stays the source of truth and returns 403
// regardless. We hide/disable actions the role can't do. `billActions` below is
// app-specific: it maps a bill's status to the contextual actions the detail
// view renders.
export { can, MATRIX } from '@stubramp/contracts/permissions'
export type { Action } from '@stubramp/contracts/permissions'

export interface BillActionDef {
  key: string
  label: string
  permission: Action
  /** How the action is dispatched. */
  kind: 'transition' | 'schedule' | 'settle-succeed' | 'settle-fail'
  /** Target status for plain transitions. */
  to?: BillStatus
  variant: 'primary' | 'secondary' | 'accent' | 'danger'
}

/** The contextual actions available from a bill's current status. */
export function billActions(status: BillStatus): BillActionDef[] {
  switch (status) {
    case 'DRAFT':
      return [
        {
          key: 'submit',
          label: 'Submit for approval',
          permission: 'bill:submit',
          kind: 'transition',
          to: 'SUBMITTED',
          variant: 'primary',
        },
      ]
    case 'SUBMITTED':
      return [
        {
          key: 'approve',
          label: 'Approve',
          permission: 'bill:approve',
          kind: 'transition',
          to: 'APPROVED',
          variant: 'accent',
        },
        {
          key: 'reject',
          label: 'Reject',
          permission: 'bill:approve',
          kind: 'transition',
          to: 'REJECTED',
          variant: 'secondary',
        },
      ]
    case 'APPROVED':
      return [
        {
          key: 'schedule',
          label: 'Schedule payment',
          permission: 'bill:schedule',
          kind: 'schedule',
          variant: 'primary',
        },
      ]
    case 'SCHEDULED':
      return [
        {
          key: 'pay',
          label: 'Mark as paid',
          permission: 'bill:pay',
          kind: 'settle-succeed',
          variant: 'primary',
        },
        {
          key: 'fail',
          label: 'Mark as failed',
          permission: 'bill:pay',
          kind: 'settle-fail',
          variant: 'secondary',
        },
      ]
    case 'FAILED':
      return [
        {
          key: 'reschedule',
          label: 'Reschedule payment',
          permission: 'bill:schedule',
          kind: 'schedule',
          variant: 'primary',
        },
      ]
    default:
      return []
  }
}
