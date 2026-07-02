import { Link } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  BookOpen,
  ChevronsUpDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  Receipt,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Logo } from '../brand/Logo'

interface NavItem {
  label: string
  icon: LucideIcon
  to?: string
}

// Only Bill Pay is wired in this build; the others are on-brand placeholders.
const NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Cards', icon: CreditCard },
  { label: 'Transactions', icon: ArrowLeftRight },
  { label: 'Bill Pay', icon: FileText, to: '/bills' },
  { label: 'Accounting', icon: BookOpen },
  { label: 'Reimbursements', icon: Receipt },
]

export function Sidebar() {
  return (
    <aside className="flex w-[228px] shrink-0 flex-col border-r border-gray-300 bg-sand-100 px-3 py-5">
      <div className="flex items-center justify-between px-2 pb-[22px]">
        <Logo size={22} />
        <ChevronsUpDown size={15} className="text-gray-400" />
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          if (!item.to) {
            return (
              <div
                key={item.label}
                className="flex cursor-default items-center gap-2.5 rounded-sm px-2 py-2 text-sm font-medium text-gray-600"
              >
                <Icon size={17} className="text-gray-500" />
                {item.label}
              </div>
            )
          }
          return (
            <Link
              key={item.label}
              to={item.to}
              activeOptions={{ exact: false }}
              className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm font-medium text-gray-600 transition-[background-color] duration-[120ms] hover:bg-surface-card"
              activeProps={{
                className: 'bg-surface-card font-semibold text-ink-900',
              }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon
                    size={17}
                    className={isActive ? 'text-ink-900' : 'text-gray-500'}
                  />
                  {item.label}
                </>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
