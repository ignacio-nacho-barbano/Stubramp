import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/** The logged-in frame: fixed sidebar + top bar, with a scrolling main area. */
export function AppShell({
  userName,
  userEmail,
  children,
}: {
  userName: string
  userEmail: string
  children: ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden font-sans text-ink-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userName={userName} userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto bg-surface-page">
          {children}
        </main>
      </div>
    </div>
  )
}
