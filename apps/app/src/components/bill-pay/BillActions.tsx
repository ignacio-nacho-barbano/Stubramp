'use client'

import { useState } from 'react'
import { Button } from '@stubramp/ui/button'
import { Card } from '@stubramp/ui/card'
import { Modal } from '@stubramp/ui/modal'
import { Input } from '@stubramp/ui/input'
import { Select } from '@stubramp/ui/select'
import type { Role } from '../../lib/auth'
import type {
  BillStatus,
  BillWithRelations,
  PaymentMethod,
} from '../../lib/bills'
import { billActions, can } from '../../lib/permissions'

const ACTION_TITLE: Partial<Record<BillStatus, string>> = {
  DRAFT: 'Ready to submit',
  SUBMITTED: 'Needs approval',
  APPROVED: 'Ready to schedule',
  SCHEDULED: 'Awaiting payment',
  FAILED: 'Payment failed',
}

export function BillActions({
  bill,
  role,
  busy,
  onTransition,
  onSchedule,
  onSettle,
}: {
  bill: BillWithRelations
  role: Role
  busy: boolean
  onTransition: (to: BillStatus) => void
  onSchedule: (scheduledFor: string, method: PaymentMethod) => void
  onSettle: (outcome: 'SUCCEEDED' | 'FAILED') => void
}) {
  const [schedOpen, setSchedOpen] = useState(false)
  const [date, setDate] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('ACH')

  const actions = billActions(bill.status).filter((a) =>
    can(role, a.permission),
  )
  if (actions.length === 0) return null

  return (
    <Card>
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        {ACTION_TITLE[bill.status] ?? 'Actions'}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.key}
            variant={a.variant}
            disabled={busy}
            onClick={() => {
              if (a.kind === 'transition' && a.to) onTransition(a.to)
              else if (a.kind === 'schedule') setSchedOpen(true)
              else if (a.kind === 'settle-succeed') onSettle('SUCCEEDED')
              else if (a.kind === 'settle-fail') onSettle('FAILED')
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {bill.status === 'SCHEDULED' && (
        <div className="mt-3 text-xs leading-relaxed text-gray-500">
          Real money movement, KYC and payment rails are out of scope — “Paid”
          is the boundary.
        </div>
      )}

      <Modal
        open={schedOpen}
        onClose={() => setSchedOpen(false)}
        size="sm"
        title={<span className="text-md font-semibold">Schedule payment</span>}
        footer={
          <>
            <Button
              variant="primary"
              disabled={!date || busy}
              onClick={() => {
                onSchedule(date, method)
                setSchedOpen(false)
              }}
            >
              Schedule
            </Button>
            <Button variant="secondary" onClick={() => setSchedOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Payment date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            <option value="ACH">ACH</option>
            <option value="WIRE">Wire</option>
            <option value="CHECK">Check</option>
            <option value="CARD">Card</option>
          </Select>
        </div>
      </Modal>
    </Card>
  )
}
