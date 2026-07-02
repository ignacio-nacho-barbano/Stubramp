import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import {
  REFRESH_COOKIE,
  apiFetch,
  apiRequest,
  clearSession,
  mapApiError,
  persistSession,
} from './api-server'
import type { TokenPair } from './api-server'

// ---------------------------------------------------------------------------
// Auth integration layer.
//
// The browser never talks to the API directly (the API has no CORS and the
// base URL is a server secret). Instead these `createServerFn` handlers run on
// the server, proxy to the Fastify API, and stash the returned token pair in
// httpOnly cookies. The client only ever sees `{ ok }` / the safe user shape.
// Shared cookie + refresh handling lives in ./api-server (server-only).
// ---------------------------------------------------------------------------

export type Role =
  'SUPERUSER' | 'ADMIN' | 'ACCOUNTANT' | 'APPROVER' | 'EMPLOYEE'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  companyId: string | null
}

export type AuthResult = { ok: true } | { ok: false; error: string }

export const loginSchema = z.object({
  email: z.string().email('Enter a valid work email address.'),
  password: z.string().min(1, 'Enter your password to continue.'),
})

export const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  companySize: z.string().optional(),
})

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>

// Auth forms want friendlier, context-specific copy than the generic mapper.
function authError(status: number, json: any): string {
  if (status === 401) return 'Incorrect email or password.'
  if (status === 409) return 'An account with that email already exists.'
  if (status === 400 || status === 422)
    return 'Please check the details you entered and try again.'
  return mapApiError(status, json)
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<AuthResult> => {
    const { status, json } = await apiRequest('/auth/login', {
      method: 'POST',
      body: data,
    })
    if (status >= 400) return { ok: false, error: authError(status, json) }
    persistSession(json as TokenPair)
    return { ok: true }
  })

export const signupFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }): Promise<AuthResult> => {
    const { status, json } = await apiRequest('/auth/signup', {
      method: 'POST',
      body: data,
    })
    if (status >= 400) return { ok: false, error: authError(status, json) }
    persistSession(json as TokenPair)
    return { ok: true }
  })

// Resolve the current user from the access cookie, transparently refreshing the
// token pair when the access token has expired. Returns null when unauthenticated.
export const meFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    const { status, json } = await apiFetch('/auth/me')
    if (status >= 400) return null
    return json as AuthUser
  },
)

export const logoutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ ok: true }> => {
    const refresh = getCookie(REFRESH_COOKIE)
    if (refresh) {
      // Best-effort revoke; clearing the cookies below is what logs the user out.
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken: refresh },
      }).catch(() => undefined)
    }
    clearSession()
    return { ok: true }
  },
)
