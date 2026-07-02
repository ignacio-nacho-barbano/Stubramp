import type { Role } from './auth'
import type { BillStatus } from './bills'

// Mirrors the API's permission matrix (apps/api/src/auth/permissions.ts +
// bill-permissions.ts). This is UX-only gating — the API stays the source of
// truth and returns 403 regardless. We hide/disable actions the role can't do.

export type BillPermission =
  | 'bill:create'
  | 'bill:read'
  | 'bill:submit'
  | 'bill:approve'
  | 'bill:schedule'
  | 'bill:pay'
  | 'vendor:manage'

const ALL: BillPermission[] = [
  'bill:create',
  'bill:read',
  'bill:submit',
  'bill:approve',
  'bill:schedule',
  'bill:pay',
  'vendor:manage',
]

const MATRIX: Record<Role, BillPermission[]> = {
  SUPERUSER: ALL,
  ADMIN: ALL,
  ACCOUNTANT: [
    'bill:create',
    'bill:read',
    'bill:submit',
    'bill:schedule',
    'bill:pay',
    'vendor:manage',
  ],
  APPROVER: ['bill:read', 'bill:approve'],
  EMPLOYEE: ['bill:create', 'bill:read'],
}

export function can(role: Role, permission: BillPermission): boolean {
  return MATRIX[role].includes(permission)
}

export interface BillActionDef {
  key: string
  label: string
  permission: BillPermission
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
