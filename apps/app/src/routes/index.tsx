import { createFileRoute, redirect } from '@tanstack/react-router'
import { meFn } from '../lib/auth'

// The root path just routes by auth state: into the app when signed in,
// otherwise to login. The logged-in home is the Bill Pay app under /bills.
export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await meFn()
    throw redirect({ to: user ? '/bills' : '/login' })
  },
})
