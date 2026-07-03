import { z } from 'zod'
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

// Resolve the current user from the access cookie, transparently refreshing the
// token pair when the access token has expired. Returns null when unauthenticated.
export async function meFn(): Promise<AuthUser | null> {
  const { status, json } = await apiFetch('/auth/me')
  if (status >= 400) return null
  return json as AuthUser
}

export async function logoutFn(): Promise<{ ok: true }> {
  // The refresh cookie is sent automatically; the API revokes it and clears the
  // session cookies. Best-effort — a failure still lands the user logged out.
  await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined)
  return { ok: true }
}
