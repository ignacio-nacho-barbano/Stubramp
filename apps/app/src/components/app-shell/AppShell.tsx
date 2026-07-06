import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * The logged-in frame: sidebar + top bar, with a scrolling main area.
 * On large screens the sidebar is a static column; below `lg` it collapses
 * into a floating drawer toggled from the top bar and closed by default.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden font-sans text-ink-900">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-surface-page">
          {children}
        </main>
      </div>
    </div>
  )
}
