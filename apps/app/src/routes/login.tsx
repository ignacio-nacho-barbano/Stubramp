import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { Button, Checkbox, Input } from '@stubramp/ui'
import {
  AuthLayout,
  ErrorBanner,
  LoginPanel,
  PasswordField,
} from '../components/auth'
import { loggedOutOnly, loginFn, loginSchema } from '../lib/auth'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: loggedOutOnly,
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const login = useMutation({
    mutationFn: loginFn,
    onSuccess: async (res) => {
      if (!res.ok) {
        setError(res.error)
        return
      }
      await navigate({ to: redirectTo ?? '/bills' })
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })
  const loading = login.isPending

  function submit() {
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your details.')
      return
    }
    setError('')
    login.mutate({ data: parsed.data })
  }

  return (
    <AuthLayout panel={<LoginPanel />}>
      <div className="w-full max-w-[380px]">
        {/* org identity */}
        <div className="mb-[30px] flex items-center gap-[13px] border border-gray-300 px-3.5 py-3">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center bg-navy-700 text-[15px] font-bold tracking-[0.04em] text-paper-0">
            SR
          </span>
          <div className="min-w-0 leading-[1.3]">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Signing in to
            </div>
            <div className="text-[15px] font-semibold">StubRamp Inc.</div>
            <div className="text-[12px] text-gray-500">app.stubramp.com</div>
          </div>
        </div>

        <h1 className="m-0 mb-1.5 text-3xl font-semibold tracking-[-0.02em]">
          Welcome back
        </h1>
        <div className="mb-4 text-sm text-gray-600">
          Log in to your finance workspace.
        </div>

        <div className="mb-[26px] border border-gray-300 bg-surface-page px-3.5 py-3 text-[12.5px] leading-[1.5] text-gray-600">
          <span className="font-semibold text-ink-900">Technical sample.</span>{' '}
          StubRamp isn’t a real product — it’s a demo build. Use throwaway
          credentials only; don’t enter a real password.
        </div>

        {error && <ErrorBanner message={error} />}

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <Input
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            trailingLabel={
              <span className="ml-auto cursor-pointer text-[12px] font-semibold text-accent-700">
                Forgot?
              </span>
            }
          />
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            label="Keep me signed in on this device"
          />
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </Button>
        </form>

        <div className="my-[22px] flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] uppercase tracking-[0.06em] text-gray-500">
            or
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <Button variant="secondary" fullWidth disabled>
          Continue with SSO
        </Button>

        <div className="mt-6 text-center text-[13px] text-gray-500">
          New to StubRamp?{' '}
          <a
            href="/signup"
            className="font-semibold text-accent-700 no-underline"
          >
            Get started
          </a>
        </div>
      </div>
    </AuthLayout>
  )
}
