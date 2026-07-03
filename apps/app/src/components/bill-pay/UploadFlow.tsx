'use client'

import { useState } from 'react'
import { Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { Badge, Button, Card, Input } from '@stubramp/ui'
import { fakeParseInvoice } from '../../lib/stubs'
import type { ParsedInvoice } from '../../lib/stubs'

/**
 * OCR/upload flow. The parse is stubbed (no backend): a drop transitions
 * through a fake "reading…" state to an editable confirm screen that seeds the
 * manual create form.
 */
export function UploadFlow({
  onAccept,
  onCancel,
}: {
  onAccept: (parsed: ParsedInvoice) => void
  onCancel: () => void
}) {
  const [stage, setStage] = useState<'idle' | 'parsing' | 'confirm'>('idle')
  const [parsed, setParsed] = useState<ParsedInvoice | null>(null)

  const drop = () => {
    setStage('parsing')
    setTimeout(() => {
      setParsed(fakeParseInvoice())
      setStage('confirm')
    }, 1100)
  }

  if (stage === 'idle') {
    return (
      <Card>
        <div
          onClick={drop}
          className="cursor-pointer border-2 border-dashed border-gray-300 bg-surface-page p-14 text-center"
        >
          <UploadCloud size={46} className="mx-auto mb-3.5 text-gray-400" />
          <div className="text-[15px] font-semibold">
            Drop a PDF or click to browse
          </div>
          <div className="mt-1 text-[13px] text-gray-500">
            We’ll auto-parse the vendor, amount and dates for you to confirm
          </div>
        </div>
      </Card>
    )
  }

  if (stage === 'parsing') {
    return (
      <Card>
        <div className="p-10 text-center">
          <Loader2
            size={28}
            className="mx-auto mb-3.5 animate-spin text-ink-900"
          />
          <div className="text-sm font-medium">Reading invoice…</div>
          <div className="mt-1 text-xs text-gray-500">
            Extracting fields with OCR
          </div>
        </div>
      </Card>
    )
  }

  if (!parsed) return null
  const total = parsed.lines.reduce((s, l) => s + l.unitCents, 0)

  return (
    <Card header="Confirm parsed fields">
      <div className="mb-3.5 flex items-center gap-2">
        <Badge tone="accent">Auto-parsed</Badge>
        <span className="text-xs text-gray-500">
          Review and correct before creating the draft
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <Input label="Vendor" defaultValue={parsed.vendorName} readOnly />
        <Input
          label="Amount"
          defaultValue={`$${(total / 100).toFixed(2)}`}
          readOnly
        />
        <Input label="Invoice #" defaultValue={parsed.billNumber} readOnly />
        <Input
          label="Due date"
          type="date"
          defaultValue={parsed.dueDate}
          readOnly
        />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="primary"
          iconLeft={<Sparkles size={16} />}
          onClick={() => onAccept(parsed)}
        >
          Confirm → create draft
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
