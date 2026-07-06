import { Search, Settings } from 'lucide-react'
import { NotificationsMenu } from './NotificationsMenu'
import { UserMenu } from './UserMenu'

/** App top bar — search affordance, notifications, settings, and user avatar. */
export function TopBar({
  userName,
  userEmail,
}: {
  userName: string
  userEmail: string
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-surface-card px-6">
      <div
        className="flex h-8.5 flex-1 items-center gap-2 rounded-sm bg-sand-100 px-2.5 text-gray-500"
        title="Press Command-K to search"
      >
        <Search size={15} className="text-gray-500" />
        <span className="text-[13px]">Search for anything</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="rounded-xs border border-gray-300 bg-surface-card px-1.5 py-px text-[11px] font-medium text-gray-600">
            ⌘
          </span>
          <span className="rounded-xs border border-gray-300 bg-surface-card px-1.5 py-px text-[11px] font-medium text-gray-600">
            K
          </span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3.5">
        <NotificationsMenu />
        <Settings size={18} className="cursor-pointer text-gray-500" />
        <span className="h-[22px] w-px bg-gray-200" />
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  )
}
