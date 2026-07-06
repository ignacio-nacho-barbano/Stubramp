'use client'

import { useMemo } from 'react'
import { allocationColor, Card, Donut, formatCents } from '@stubramp/ui'
import { AGING_TILES, computeAging, vendorRollups } from '../../lib/aging'
import type { BillListItem } from '../../lib/bills'

// Two lightweight charts derived entirely from the bill list: AP aging
// distribution (vertical bars) and the largest open vendor balances (donut).
// Both share the aging helpers used by the Aging tab.
export function DashboardCharts({
  bills,
  now,
}: {
  bills: BillListItem[]
  now: number
}) {
  const aging = useMemo(() => computeAging(bills, now), [bills, now])
  const vendors = useMemo(() => {
    const all = [...vendorRollups(bills).values()].sort(
      (a, b) => b.openCents - a.openCents,
    )
    const top = all.slice(0, 5)
    const total = all.reduce((sum, v) => sum + v.openCents, 0)
    const otherCents = all.slice(5).reduce((sum, v) => sum + v.openCents, 0)

    const segments = top.map((v, i) => ({
      label: v.vendor,
      value: v.openCents,
      color: allocationColor(i),
    }))
    if (otherCents > 0) {
      segments.push({
        label: 'Other',
        value: otherCents,
        color: 'var(--gray-300)',
      })
    }
    return { segments, total, count: all.length }
  }, [bills])

  const maxAge = Math.max(1, ...AGING_TILES.map((t) => aging.tiles[t.key]))

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card header="Outstanding by age">
        <div className="flex h-[150px] items-end gap-3.5 px-1 pt-1.5">
          {AGING_TILES.map((t) => {
            const value = aging.tiles[t.key]
            const height = Math.max(3, Math.round((value / maxAge) * 104))
            return (
              <div
                key={t.key}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1.5 text-[11px] font-semibold tabular-nums text-gray-600">
                  {formatCents(value)}
                </span>
                <span
                  className="w-full max-w-[54px] transition-[height] duration-[240ms]"
                  style={{ height, background: t.color }}
                />
                <span className="mt-2 text-[11px] text-gray-500">
                  {t.label}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card header="Top open vendors">
        <Donut
          segments={vendors.segments}
          formatValue={formatCents}
          centerLabel="Total open"
          centerValue={formatCents(vendors.total)}
          centerCaption={`${vendors.count} vendor${vendors.count === 1 ? '' : 's'}`}
          emptyMessage="No open bills."
        />
      </Card>
    </div>
  )
}
