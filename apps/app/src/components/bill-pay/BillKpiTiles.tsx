'use client'

import { formatCents } from '@stubramp/ui'
import type { BillStats } from '../../lib/aging'

// KPI filter destinations. Two tiles ("Total outstanding", "Overdue") reset to
// the ALL view; the others jump to their matching status tab, which is where
// the active-border affordance lights up. Mirrors the /bills status search enum.
type TileTab = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SCHEDULED' | 'PAID'

interface Tile {
  key: string
  label: string
  value: string
  sub: string
  accent: string
  tab: TileTab
}

export function BillKpiTiles({
  stats,
  activeTab,
  onSelect,
}: {
  stats: BillStats
  activeTab: string
  onSelect: (tab: TileTab) => void
}) {
  const tiles: Tile[] = [
    {
      key: 'open',
      label: 'Total outstanding',
      value: formatCents(stats.openCents),
      sub: `${stats.openCount} open ${stats.openCount === 1 ? 'bill' : 'bills'}`,
      accent: 'var(--green-600)',
      tab: 'ALL',
    },
    {
      key: 'approval',
      label: 'Needs approval',
      value: String(stats.submittedCount),
      sub: `${formatCents(stats.submittedCents)} to review`,
      accent: 'var(--navy-700)',
      tab: 'SUBMITTED',
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      value: formatCents(stats.scheduledCents),
      sub: `${stats.scheduledCount} scheduled`,
      accent: 'var(--amber-600)',
      tab: 'SCHEDULED',
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: formatCents(stats.overdueCents),
      sub: `${stats.overdueCount} past due`,
      accent: 'var(--red-600)',
      tab: 'ALL',
    },
  ]

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => {
        const active = t.tab !== 'ALL' && activeTab === t.tab
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.tab)}
            style={{ borderColor: active ? t.accent : undefined }}
            className="flex flex-col items-start rounded-none border border-gray-200 bg-surface-card px-4 py-[15px] text-left transition-[border-color,box-shadow] duration-[120ms] hover:shadow-sm"
          >
            <span className="mb-[11px] flex items-center gap-[7px]">
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: t.accent }}
              />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t.label}
              </span>
            </span>
            <span className="text-2xl font-semibold leading-none tracking-[-0.02em] tabular-nums">
              {t.value}
            </span>
            <span className="mt-1.5 text-xs text-gray-500">{t.sub}</span>
          </button>
        )
      })}
    </div>
  )
}
