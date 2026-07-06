import { z } from 'zod'
import { redirect } from '@tanstack/react-router'
import type { Role } from '@stubramp/contracts/enums'
import { apiFetch, apiRequest, mapApiError } from './api'

// ---------------------------------------------------------------------------
// Auth integration layer.
//
// These call the Fastify API directly from the browser. The API validates
// credentials and sets the session as httpOnly cookies (which the browser can't
// read), so the client only ever sees `{ ok }` / the safe user shape. Cookie +
// refresh handling lives server-side; ./api just attaches the cookies via
// `credentials: 'include'`.
// ---------------------------------------------------------------------------

// Role union is shared with the API via @stubramp/contracts (imported above and
// re-exported here). The login/signup Zod schemas below stay local: they carry
// app-specific, user-facing form copy.
export type { Role }

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

// Joining an existing workspace: the target company rides in the signed token,
// so the form only collects the person's own details.
export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
export type AcceptInviteValues = z.infer<typeof acceptInviteSchema>

// Auth forms want friendlier, context-specific copy than the generic mapper.
function authError(status: number, json: any): string {
  if (status === 401) return 'Incorrect email or password.'
  if (status === 409) return 'An account with that email already exists.'
  if (status === 400 || status === 422)
    return 'Please check the details you entered and try again.'
  return mapApiError(status, json)
}

export async function loginFn({
  data,
}: {
  data: LoginValues
}): Promise<AuthResult> {
  const parsed = loginSchema.parse(data)
  const { status, json } = await apiRequest('/auth/login', {
    method: 'POST',
    body: parsed,
  })
  if (status >= 400) return { ok: false, error: authError(status, json) }
  return { ok: true }
}

export async function signupFn({
  data,
}: {
  data: SignupValues
}): Promise<AuthResult> {
  const parsed = signupSchema.parse(data)
  const { status, json } = await apiRequest('/auth/signup', {
    method: 'POST',
    body: parsed,
  })
  if (status >= 400) return { ok: false, error: authError(status, json) }
  return { ok: true }
}

// Admin-only: mint an invite link for the current user's workspace. Authed, so
// it uses apiFetch (transparent refresh). Returns the opaque signed token; the
// caller builds the shareable /join URL from it.
export async function createInviteFn(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  const { status, json } = await apiFetch('/auth/invites', { method: 'POST' })
  if (status >= 400) return { ok: false, error: mapApiError(status, json) }
  return { ok: true, token: json.token as string }
}

// Invite-specific error copy. Unlike login, a 401 here means the signed link is
// bad (not wrong credentials), so it gets its own message.
function inviteError(status: number, json: any): string {
  if (status === 401) return 'This invite link is invalid or has expired.'
  if (status === 404) return 'That workspace no longer exists.'
  return authError(status, json)
}

// Public: accept an invite and land logged in. Mirrors signupFn — the API sets
// the session cookies on success.
export async function acceptInviteFn({
  data,
}: {
  data: AcceptInviteValues
}): Promise<AuthResult> {
  const parsed = acceptInviteSchema.parse(data)
  const { status, json } = await apiRequest('/auth/accept-invite', {
    method: 'POST',
    body: parsed,
  })
  if (status >= 400) return { ok: false, error: inviteError(status, json) }
  return { ok: true }
}

// Resolve the current user from the access cookie, transparently refreshing the
// token pair when the access token has expired. Returns null when unauthenticated.
export async function meFn(): Promise<AuthUser | null> {
  const { status, json } = await apiFetch('/auth/me')
  if (status >= 400) return null
  return json as AuthUser
}

// Route guard for public auth pages (login/signup/join): if the visitor is
// already signed in, bounce them into the app instead of showing the form.
// The mirror of the _app layout's guard, which sends the unauthenticated to /login.
export async function loggedOutOnly(): Promise<void> {
  if (await meFn()) throw redirect({ to: '/bills' })
}

export async function logoutFn(): Promise<{ ok: true }> {
  // The refresh cookie is sent automatically; the API revokes it and clears the
  // session cookies. Best-effort — a failure still lands the user logged out.
  await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined)
  return { ok: true }
}
