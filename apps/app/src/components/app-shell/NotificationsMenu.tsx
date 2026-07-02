'use client'

import { Bell } from 'lucide-react'
import { Menu } from '@stubramp/ui/menu'
import { Badge } from '@stubramp/ui/badge'
import { NOTIFICATIONS } from '../../lib/stubs'

/** Notifications bell + dropdown panel. Fed by a local fixture (no backend). */
export function NotificationsMenu() {
  const count = NOTIFICATIONS.length
  return (
    <Menu
      align="end"
      width={330}
      trigger={
        <span className="relative inline-flex">
          <Bell size={18} className="text-gray-500" />
          {count > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-surface-card bg-status-negative px-1 text-[9px] font-bold tabular-nums text-paper-0">
              {count}
            </span>
          )}
        </span>
      }
    >
      <div>
        <div className="flex items-center border-b border-gray-200 px-4 py-3">
          <span className="text-md font-semibold text-ink-900">
            Notifications
          </span>
          <span className="ml-auto">
            <Badge tone="negative">{count} new</Badge>
          </span>
        </div>
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className="flex cursor-pointer gap-[11px] border-b border-gray-200 px-4 py-3 hover:bg-surface-page"
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: n.tone }}
            />
            <div className="min-w-0">
              <div className="text-[13px] font-medium leading-snug text-ink-900">
                {n.title}
              </div>
              <div className="mt-0.5 text-[11.5px] tabular-nums text-gray-500">
                {n.meta}
              </div>
            </div>
          </div>
        ))}
        <div className="cursor-pointer px-4 py-3 text-center text-xs font-semibold text-accent-700">
          Mark all as read
        </div>
      </div>
    </Menu>
  )
}
