import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Auth integration layer.
//
// The browser never talks to the API directly (the API has no CORS and the
// base URL is a server secret). Instead these `createServerFn` handlers run on
// the server, proxy to the Fastify API, and stash the returned token pair in
// httpOnly cookies. The client only ever sees `{ ok }` / the safe user shape.
// ---------------------------------------------------------------------------

const ACCESS_COOKIE = 'sr_access'
const REFRESH_COOKIE = 'sr_refresh'
const ACCESS_MAX_AGE = 60 * 15 // mirrors the access-token TTL (15m)
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const IS_PROD = (process.env.ENV ?? process.env.NODE_ENV) === 'production'

function apiUrl(path: string): string {
  const base = process.env.API_URL ?? 'http://localhost:3001'
  return `${base}${path}`
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
}

interface TokenPair {
  accessToken: string
  refreshToken: string
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

function persistSession(tokens: TokenPair) {
  const common = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: IS_PROD,
  }
  setCookie(ACCESS_COOKIE, tokens.accessToken, {
    ...common,
    maxAge: ACCESS_MAX_AGE,
  })
  setCookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: REFRESH_MAX_AGE,
  })
}

function clearSession() {
  deleteCookie(ACCESS_COOKIE, { path: '/' })
  deleteCookie(REFRESH_COOKIE, { path: '/' })
}

async function postJson(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<{ status: number; json: any }> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

// Map the API's structured errors to a single human-friendly line.
function friendlyError(status: number, json: any): string {
  if (status === 401) return 'Incorrect email or password.'
  if (status === 409) return 'An account with that email already exists.'
  if (status === 400) return 'Please check the details you entered and try again.'
  return json?.message || json?.error || 'Something went wrong. Please try again.'
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<AuthResult> => {
    const { status, json } = await postJson('/auth/login', data)
    if (status >= 400) return { ok: false, error: friendlyError(status, json) }
    persistSession(json as TokenPair)
    return { ok: true }
  })

export const signupFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }): Promise<AuthResult> => {
    const { status, json } = await postJson('/auth/signup', data)
    if (status >= 400) return { ok: false, error: friendlyError(status, json) }
    persistSession(json as TokenPair)
    return { ok: true }
  })

// Resolve the current user from the access cookie, transparently refreshing the
// token pair when the access token has expired. Returns null when unauthenticated.
export const meFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    const access = getCookie(ACCESS_COOKIE)
    const refresh = getCookie(REFRESH_COOKIE)
    if (!access && !refresh) return null

    const fetchMe = (token: string) =>
      fetch(apiUrl('/auth/me'), {
        headers: { authorization: `Bearer ${token}` },
      })

    let res = access ? await fetchMe(access) : undefined

    if ((!res || res.status === 401) && refresh) {
      const refreshed = await postJson('/auth/refresh', { refreshToken: refresh })
      if (refreshed.status >= 400) {
        clearSession()
        return null
      }
      persistSession(refreshed.json as TokenPair)
      res = await fetchMe((refreshed.json as TokenPair).accessToken)
    }

    if (!res || res.status >= 400) return null
    return (await res.json()) as AuthUser
  },
)

export const logoutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ ok: true }> => {
    const access = getCookie(ACCESS_COOKIE)
    const refresh = getCookie(REFRESH_COOKIE)
    if (refresh) {
      // Best-effort revoke; clearing the cookies below is what logs the user out.
      await postJson('/auth/logout', { refreshToken: refresh }, access).catch(
        () => undefined,
      )
    }
    clearSession()
    return { ok: true }
  },
)
