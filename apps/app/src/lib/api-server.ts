import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

// ---------------------------------------------------------------------------
// Server-only API access layer.
//
// SERVER ONLY: this module calls `getCookie`/`setCookie` and must never be
// imported into client component code — only inside `createServerFn().handler()`
// bodies (which run on the server). It centralizes the token-cookie handling and
// the refresh-on-401 dance so every domain server fn stays a thin proxy.
// ---------------------------------------------------------------------------

export const ACCESS_COOKIE = 'sr_access'
export const REFRESH_COOKIE = 'sr_refresh'
const ACCESS_MAX_AGE = 60 * 15 // mirrors the access-token TTL (15m)
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const IS_PROD = (process.env.ENV ?? process.env.NODE_ENV) === 'production'

export function apiUrl(path: string): string {
  const base = process.env.API_URL ?? 'http://localhost:3001'
  return `${base}${path}`
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse {
  status: number
  json: any
}

export function persistSession(tokens: TokenPair) {
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

export function clearSession() {
  deleteCookie(ACCESS_COOKIE, { path: '/' })
  deleteCookie(REFRESH_COOKIE, { path: '/' })
}

export interface RequestInitLite {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  searchParams?: Record<string, string | number | boolean | undefined>
}

function buildUrl(
  path: string,
  searchParams?: RequestInitLite['searchParams'],
): string {
  if (!searchParams) return apiUrl(path)
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined) qs.set(k, String(v))
  }
  const s = qs.toString()
  return apiUrl(s ? `${path}?${s}` : path)
}

/** Unauthenticated request (login/signup/refresh/logout) or an authed call with an explicit token. */
export async function apiRequest(
  path: string,
  init?: RequestInitLite,
  accessToken?: string,
): Promise<ApiResponse> {
  const hasBody = init?.body !== undefined
  const res = await fetch(buildUrl(path, init?.searchParams), {
    method: init?.method ?? 'GET',
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(init.body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

/**
 * Authenticated request against the API using the session cookies. Reads the
 * access cookie, and on a 401 transparently refreshes the token pair (rotating
 * the cookies) and retries once. Returns the API response verbatim.
 */
export async function apiFetch(
  path: string,
  init?: RequestInitLite,
): Promise<ApiResponse> {
  const access = getCookie(ACCESS_COOKIE)
  const refresh = getCookie(REFRESH_COOKIE)

  let res = access
    ? await apiRequest(path, init, access)
    : { status: 401, json: {} }

  if (res.status === 401 && refresh) {
    const refreshed = await apiRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refresh },
    })
    if (refreshed.status >= 400) {
      clearSession()
      return res
    }
    persistSession(refreshed.json as TokenPair)
    res = await apiRequest(
      path,
      init,
      (refreshed.json as TokenPair).accessToken,
    )
  }

  return res
}

/** Map an API error response to a single human-friendly line for the UI. */
export function mapApiError(status: number, json: any): string {
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return 'That item could not be found.'
  if (status === 409)
    return json?.message || 'That action conflicts with the current state.'
  if (status === 422)
    return (
      json?.message || 'Please check the details you entered and try again.'
    )
  return (
    json?.message || json?.error || 'Something went wrong. Please try again.'
  )
}
