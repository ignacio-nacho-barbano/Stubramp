import { Link } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  BookOpen,
  ChevronsUpDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  Receipt,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn, Logo } from '@stubramp/ui'

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

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop — only rendered as an overlay below `lg` while the drawer is open. */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          // Both sizes: overflow-hidden clips the fixed-width inner panel so it
          // never reflows while collapsing.
          'fixed inset-y-0 left-0 z-40 flex w-[228px] shrink-0 flex-col overflow-hidden border-r border-gray-300 bg-surface-page shadow-lg transition-[transform,width] duration-200',
          // Below `lg`: off-canvas drawer that slides in/out via translate.
          // At `lg`+: static column in the flex flow that collapses its width.
          'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          open
            ? 'translate-x-0 lg:w-[228px]'
            : '-translate-x-full lg:w-0 lg:border-r-0',
        )}
      >
        {/* Fixed width so labels stay put while the aside animates its width. */}
        <div className="flex w-[228px] shrink-0 flex-col px-3 py-5">
          <div className="flex items-center justify-between px-2 pb-[22px]">
            <Logo size={22} wordmarkSize={24} />
            <ChevronsUpDown
              size={15}
              className="hidden text-gray-400 lg:block"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Collapse menu"
              className="-mr-1 cursor-pointer rounded-sm p-1 text-gray-500 hover:bg-surface-card lg:hidden"
            >
              <X size={18} />
            </button>
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
        </div>
      </aside>
    </>
  )
}
