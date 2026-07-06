import { getRouteApi } from '@tanstack/react-router'
import type { AuthUser } from './auth'

// The `/_app` layout resolves the user once in `beforeLoad` and returns it on
// route context (see routes/_app.tsx). Every component rendered under that
// layout can read it here without prop drilling — TanStack's route API is the
// type-safe, colocated equivalent of a React context provider.
const appRouteApi = getRouteApi('/_app')

/** The authenticated user for the current session. Only valid under `/_app`. */
export function useCurrentUser(): AuthUser {
  return appRouteApi.useRouteContext({ select: (ctx) => ctx.user })
}
