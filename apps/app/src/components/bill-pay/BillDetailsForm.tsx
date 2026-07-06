'use client'

import { Button, Card, Input, Select } from '@stubramp/ui'
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
  onAddVendor,
  detectedVendorName,
}: {
  meta: DraftMeta
  vendors: Vendor[]
  onChange: (next: Partial<DraftMeta>) => void
  onAddVendor?: () => void
  /** Vendor name read off an uploaded invoice that didn't match an existing one. */
  detectedVendorName?: string
}) {
  // Surface the parsed vendor only while none is selected — once the user picks
  // (or creates) one, the hint has served its purpose.
  const showDetected = !!detectedVendorName && !meta.vendorId
  return (
    <Card header="Bill details">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm font-medium leading-snug text-ink-900">
              Vendor
            </span>
          </div>
          <div className="flex items-center gap-2 w-full">
            <Select
              className="w-full"
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
            {onAddVendor && (
              <Button variant="secondary" onClick={onAddVendor}>
                + New
              </Button>
            )}
          </div>
          {showDetected && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-gray-500">
              <span>
                Detected on invoice:{' '}
                <span className="font-medium text-ink-900">
                  {detectedVendorName}
                </span>
              </span>
              {onAddVendor && (
                <button
                  type="button"
                  onClick={onAddVendor}
                  className="font-semibold text-accent-700 hover:underline"
                >
                  Create vendor
                </button>
              )}
            </div>
          )}
        </div>
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
