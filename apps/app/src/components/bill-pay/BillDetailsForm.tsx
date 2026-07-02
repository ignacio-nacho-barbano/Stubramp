'use client'

import { Card } from '@stubramp/ui/card'
import { Input } from '@stubramp/ui/input'
import { Select } from '@stubramp/ui/select'
import type { Vendor } from '../../lib/bills'

export interface DraftMeta {
  vendorId: string
  billNumber: string
  issueDate: string
  dueDate: string
}

export function BillDetailsForm({
  meta,
  vendors,
  onChange,
}: {
  meta: DraftMeta
  vendors: Vendor[]
  onChange: (next: Partial<DraftMeta>) => void
}) {
  return (
    <Card header="Bill details">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Vendor"
          value={meta.vendorId}
          onChange={(e) => onChange({ vendorId: e.target.value })}
        >
          <option value="">Select vendor…</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Input
          label="Invoice #"
          value={meta.billNumber}
          onChange={(e) => onChange({ billNumber: e.target.value })}
          placeholder="INV-0000"
        />
        <Input
          label="Issue date"
          type="date"
          value={meta.issueDate}
          onChange={(e) => onChange({ issueDate: e.target.value })}
        />
        <Input
          label="Due date"
          type="date"
          value={meta.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
        />
      </div>
    </Card>
  )
}
