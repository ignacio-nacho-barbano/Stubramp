'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@stubramp/ui/button'
import { Modal } from '@stubramp/ui/modal'
import { allocationColor } from '../../lib/format'
import { formatCents, toCents } from '../../lib/money'
import { SegmentedToggle } from './SegmentedToggle'

export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Product',
  'Customer Success',
]

const TEMPLATES: { name: string; splits: [string, number][] }[] = [
  {
    name: 'Eng / Mktg / Sales · 50/30/20',
    splits: [
      ['Engineering', 50],
      ['Marketing', 30],
      ['Sales', 20],
    ],
  },
  {
    name: 'Ops + Finance · 70/30',
    splits: [
      ['Operations', 70],
      ['Finance', 30],
    ],
  },
  {
    name: 'Even · Eng / Product / Sales',
    splits: [
      ['Engineering', 34],
      ['Product', 33],
      ['Sales', 33],
    ],
  },
]

export interface SplitValue {
  costCenter: string
  amountCents: number
}

interface Row extends SplitValue {
  id: string
}

let rid = 0
const newId = () => `s${++rid}`

/** Distribute `total` cents across `n` slots exactly (remainder to the first rows). */
function distribute(total: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(total / n)
  const out = Array(n).fill(base)
  let rem = total - base * n
  for (let i = 0; rem > 0; i++, rem--) out[i % n]++
  return out
}

export function SplitsModal({
  open,
  lineDescription,
  lineAmountCents,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  lineDescription: string
  lineAmountCents: number
  initial: SplitValue[]
  onClose: () => void
  onSave: (splits: SplitValue[]) => void
}) {
  const [mode, setMode] = useState<'percent' | 'amount'>('percent')
  const [rows, setRows] = useState<Row[]>([])

  // Seed the editor whenever it opens for a (possibly different) line.
  useEffect(() => {
    if (!open) return
    const seed = initial.length
      ? initial
      : [{ costCenter: DEPARTMENTS[0], amountCents: lineAmountCents }]
    setRows(seed.map((s) => ({ ...s, id: newId() })))
    setMode('percent')
  }, [open, lineAmountCents, initial])

  const allocated = rows.reduce((s, r) => s + r.amountCents, 0)
  const remaining = lineAmountCents - allocated
  const valid = remaining === 0 && rows.every((r) => r.costCenter)

  const patch = (id: string, next: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)))

  const pct = (cents: number) =>
    lineAmountCents > 0 ? (cents / lineAmountCents) * 100 : 0

  const applyTemplate = (idx: number) => {
    const t = TEMPLATES[idx]
    const amounts = t.splits.map(([, p]) =>
      Math.round((p / 100) * lineAmountCents),
    )
    // Force exact sum by pushing any rounding drift onto the last row.
    const drift = lineAmountCents - amounts.reduce((s, a) => s + a, 0)
    if (amounts.length) amounts[amounts.length - 1] += drift
    setRows(
      t.splits.map(([cc], i) => ({
        id: newId(),
        costCenter: cc,
        amountCents: amounts[i],
      })),
    )
  }

  const distributeEvenly = () => {
    const amounts = distribute(lineAmountCents, rows.length)
    setRows((rs) => rs.map((r, i) => ({ ...r, amountCents: amounts[i] })))
  }

  const remainderColor =
    remaining === 0
      ? 'text-status-positive'
      : remaining > 0
        ? 'text-status-warning'
        : 'text-status-negative'
  const remainderLabel =
    remaining === 0
      ? 'Fully allocated'
      : remaining > 0
        ? `${formatCents(remaining)} remaining`
        : `Over by ${formatCents(-remaining)}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center">
          <div>
            <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              Split &amp; allocate
            </div>
            <div className="text-md font-semibold">
              {lineDescription || 'Line item'}
            </div>
          </div>
          <span className="ml-auto text-[17px] font-bold tabular-nums">
            {formatCents(lineAmountCents)}
          </span>
        </div>
      }
      footer={
        <>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onSave(
                rows.map(({ costCenter, amountCents }) => ({
                  costCenter,
                  amountCents,
                })),
              )
            }
          >
            Save split
          </Button>
          <span
            onClick={onClose}
            className="ml-auto cursor-pointer px-2 text-[13px] text-gray-500 hover:text-ink-900"
          >
            Cancel
          </span>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3.5">
        <SegmentedToggle
          options={[
            { value: 'percent', label: 'Percent' },
            { value: 'amount', label: 'Amount' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <div className="ml-auto">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(Number(e.target.value))
              e.target.value = ''
            }}
            className="cursor-pointer appearance-none rounded-sm border border-gray-300 bg-surface-card px-2.5 py-1.5 pr-6 text-sm font-semibold text-accent-700"
          >
            <option value="">Apply template…</option>
            {TEMPLATES.map((t, i) => (
              <option key={t.name} value={i}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-gray-200">
        <div className="grid grid-cols-[1fr_110px_120px_32px] gap-2 border-b border-gray-200 bg-surface-page px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          <span>Cost center</span>
          <span className="text-right">Percent</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="grid grid-cols-[1fr_110px_120px_32px] items-center gap-2 border-b border-gray-200 px-3 py-2.5"
          >
            <span className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0"
                style={{ background: allocationColor(i) }}
              />
              <select
                value={r.costCenter}
                onChange={(e) => patch(r.id, { costCenter: e.target.value })}
                className="w-full cursor-pointer appearance-none rounded-sm border border-gray-300 bg-surface-card px-2.5 py-1.5 text-sm"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </span>
            <span className="flex items-center rounded-sm border border-gray-300 px-2">
              <input
                type="number"
                value={
                  mode === 'percent'
                    ? Math.round(pct(r.amountCents) * 10) / 10
                    : ''
                }
                disabled={mode !== 'percent'}
                onChange={(e) =>
                  patch(r.id, {
                    amountCents: Math.round(
                      ((parseFloat(e.target.value) || 0) / 100) *
                        lineAmountCents,
                    ),
                  })
                }
                className="w-full bg-transparent py-1.5 text-right text-sm tabular-nums outline-none disabled:text-gray-400"
              />
              <span className="text-sm text-gray-500">%</span>
            </span>
            <span className="flex items-center rounded-sm border border-gray-300 px-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                value={
                  mode === 'amount' ? (r.amountCents / 100).toFixed(2) : ''
                }
                disabled={mode !== 'amount'}
                onChange={(e) =>
                  patch(r.id, { amountCents: toCents(e.target.value) })
                }
                className="w-full bg-transparent py-1.5 pl-1 text-right text-sm tabular-nums outline-none disabled:text-gray-400"
              />
            </span>
            <span
              onClick={() =>
                setRows((rs) =>
                  rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs,
                )
              }
              className="flex cursor-pointer justify-center text-gray-400 hover:text-ink-900"
            >
              <X size={16} />
            </span>
          </div>
        ))}
        <div className="flex items-center gap-[18px] px-3 py-2.5">
          <span
            onClick={() =>
              setRows((rs) => [
                ...rs,
                { id: newId(), costCenter: DEPARTMENTS[0], amountCents: 0 },
              ])
            }
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-accent-700"
          >
            <Plus size={14} />
            Add split
          </span>
          <span
            onClick={distributeEvenly}
            className="cursor-pointer text-[13px] font-medium text-gray-600 hover:text-ink-900"
          >
            Distribute evenly
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex h-3.5 overflow-hidden border border-gray-300">
          {rows.map((r, i) => (
            <span
              key={r.id}
              style={{
                width: `${pct(r.amountCents)}%`,
                background: allocationColor(i),
              }}
            />
          ))}
        </div>
        <div className="mt-2.5 flex items-center text-[13px]">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${remainderColor}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${remaining === 0 ? 'bg-status-positive' : remaining > 0 ? 'bg-status-warning' : 'bg-status-negative'}`}
            />
            {remainderLabel}
          </span>
          <span className="ml-auto tabular-nums text-gray-500">
            {formatCents(allocated)} of {formatCents(lineAmountCents)}
          </span>
        </div>
      </div>
    </Modal>
  )
}
