import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ToastProvider } from '@stubramp/ui'
import { meFn } from '../lib/auth'
import { AppShell } from '../components/app-shell/AppShell'

// Auth-guarded layout for the whole logged-in app. Resolves the user once and
// places it on route context so every child route can read role/name without
// re-fetching. Unauthenticated visitors are bounced to /login with a return url.
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const user = await meFn()
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user }
  },
  loader: ({ context }) => ({ user: context.user }),
  component: AppLayout,
})

function AppLayout() {
  return (
    <ToastProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </ToastProvider>
  )
}
