'use client'

import { useMemo } from 'react'
import { avatarColor, Card, formatCents, VendorAvatar } from '@stubramp/ui'
import { AGING_TILES, computeAging, vendorRollups } from '../../lib/aging'
import type { BillListItem } from '../../lib/bills'

// Two lightweight, dependency-free charts derived entirely from the bill list:
// AP aging distribution (vertical bars) and the largest open vendor balances
// (horizontal bars). Both share the aging helpers used by the Aging tab.
export function DashboardCharts({
  bills,
  now,
}: {
  bills: BillListItem[]
  now: number
}) {
  const aging = useMemo(() => computeAging(bills, now), [bills, now])
  const topVendors = useMemo(
    () =>
      [...vendorRollups(bills).values()]
        .sort((a, b) => b.openCents - a.openCents)
        .slice(0, 5),
    [bills],
  )

  const maxAge = Math.max(1, ...AGING_TILES.map((t) => aging.tiles[t.key]))
  const maxVendor = Math.max(1, ...topVendors.map((v) => v.openCents))

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
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
        <div className="flex flex-col gap-[13px] pt-0.5">
          {topVendors.length === 0 ? (
            <div className="px-6 py-6 text-center text-[13px] text-gray-500">
              No open bills.
            </div>
          ) : (
            topVendors.map((v) => {
              const color = avatarColor(v.vendor)
              const width = `${Math.max(2, Math.round((v.openCents / maxVendor) * 100))}%`
              return (
                <div key={v.vendorId}>
                  <div className="mb-[5px] flex items-center gap-2">
                    <VendorAvatar name={v.vendor} size={20} />
                    <span className="truncate text-[13px] font-medium">
                      {v.vendor}
                    </span>
                    <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums">
                      {formatCents(v.openCents)}
                    </span>
                  </div>
                  <div className="h-[7px] bg-surface-page">
                    <div
                      className="h-full transition-[width] duration-[240ms]"
                      style={{ width, background: color }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
