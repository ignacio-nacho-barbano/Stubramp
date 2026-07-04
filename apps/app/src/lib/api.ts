// ---------------------------------------------------------------------------
// Client API access layer (runs in the browser).
//
// Auth is entirely cookie-based: the API sets httpOnly session cookies that the
// browser can't read, and every request here uses `credentials: 'include'` so
// those cookies ride along. `apiFetch` transparently refreshes on a 401 (the
// refresh-token cookie is sent to /auth/refresh, which rotates the cookies) and
// retries once. The base URL is public (the SPA must know it).
// ---------------------------------------------------------------------------

import { env } from './env'

const API_URL = env.VITE_API_URL

export interface ApiResponse {
  status: number
  json: any
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
  if (!searchParams) return `${API_URL}${path}`
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined) qs.set(k, String(v))
  }
  const s = qs.toString()
  return `${API_URL}${s ? `${path}?${s}` : path}`
}

/**
 * Single request with the session cookies attached. No refresh handling — use
 * this directly for the auth endpoints (login/signup/refresh/logout) where a 401
 * is a real answer, not an expired-token signal.
 */
export async function apiRequest(
  path: string,
  init?: RequestInitLite,
): Promise<ApiResponse> {
  const hasBody = init?.body !== undefined
  const res = await fetch(buildUrl(path, init?.searchParams), {
    method: init?.method ?? 'GET',
    credentials: 'include',
    headers: hasBody ? { 'content-type': 'application/json' } : {},
    body: hasBody ? JSON.stringify(init.body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

/**
 * Authenticated request. On a 401 it POSTs to /auth/refresh (the refresh cookie
 * is sent automatically); if that succeeds the API has rotated the cookies, so
 * we retry the original request once. Returns the API response verbatim.
 */
export async function apiFetch(
  path: string,
  init?: RequestInitLite,
): Promise<ApiResponse> {
  let res = await apiRequest(path, init)

  if (res.status === 401) {
    const refreshed = await apiRequest('/auth/refresh', { method: 'POST' })
    if (refreshed.status >= 400) return res
    res = await apiRequest(path, init)
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
