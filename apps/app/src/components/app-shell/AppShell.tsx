import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const LG = '(min-width: 1024px)'

/**
 * The logged-in frame: sidebar + top bar, with a scrolling main area.
 * The sidebar is collapsible at every screen size. On `lg`+ it's a static
 * column that collapses its width in-flow (content reflows); below `lg` it's a
 * floating overlay drawer. It starts expanded on `lg`+ and closed below it.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG).matches : false,
  )
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Close the overlay drawer on navigation, but only below `lg` — on `lg`+ the
  // static column stays as the user left it.
  useEffect(() => {
    if (!window.matchMedia(LG).matches) {
      setNavOpen(false)
    }
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden font-sans text-ink-900">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setNavOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-surface-page">
          {children}
        </main>
      </div>
    </div>
  )
}
