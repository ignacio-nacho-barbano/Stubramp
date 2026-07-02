import {
  Outlet,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { Tabs } from '@stubramp/ui/tabs'
import { NewBillMenu } from '../../components/bill-pay/NewBillMenu'

export const Route = createFileRoute('/_app/bills')({ component: BillsLayout })

const TOP_TABS = [
  { id: 'bills', label: 'Bills', to: '/bills' },
  { id: 'vendors', label: 'Vendors', to: '/bills/vendors' },
  { id: 'aging', label: 'Aging', to: '/bills/aging' },
  { id: 'recurring', label: 'Recurring', to: '/bills/recurring' },
] as const

// The top-level tab bar + New-bill menu are shared across the "tabbed" views
// (Bills / Vendors / Aging / Recurring). The Create and Detail views render
// their own back-link header instead, so we hide this chrome there.
const TABBED_PATHS = new Set([
  '/bills',
  '/bills/vendors',
  '/bills/aging',
  '/bills/recurring',
])

function BillsLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showChrome = TABBED_PATHS.has(pathname)
  const activeTab = TOP_TABS.find((t) => t.to === pathname)?.id ?? 'bills'

  return (
    <div className="mx-auto max-w-[1100px] px-9 pb-20 pt-7">
      {showChrome && (
        <>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Accounts payable
              </div>
              <h1 className="m-0 text-3xl font-semibold tracking-[-0.02em]">
                Bill Pay
              </h1>
            </div>
            <NewBillMenu />
          </div>
          <div className="mb-[22px]">
            <Tabs
              tabs={TOP_TABS.map((t) => ({ id: t.id, label: t.label }))}
              value={activeTab}
              onChange={(id) => {
                const tab = TOP_TABS.find((t) => t.id === id)
                if (tab) navigate({ to: tab.to })
              }}
            />
          </div>
        </>
      )}
      <Outlet />
    </div>
  )
}
