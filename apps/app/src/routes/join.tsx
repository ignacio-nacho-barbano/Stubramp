import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { Button, Checkbox, Input } from '@stubramp/ui'
import {
  AuthLayout,
  ErrorBanner,
  PasswordField,
  SignupPanel,
  StrengthMeter,
} from '../components/auth'
import { acceptInviteFn, loggedOutOnly } from '../lib/auth'

export const Route = createFileRoute('/join')({
  validateSearch: z.object({ token: z.string().optional() }),
  beforeLoad: loggedOutOnly,
  component: JoinPage,
})

function JoinPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const join = useMutation({
    mutationFn: acceptInviteFn,
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDone(true)
    },
    onError: () => setError('Something went wrong. Please try again.'),
  })
  const loading = join.isPending

  function submit() {
    if (!token) return
    if (!firstName || !lastName) {
      setError('Enter your first and last name.')
      return
    }
    if (!email || !/.+@.+\..+/.test(email)) {
      setError('Enter a valid work email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!agree) {
      setError('Please accept the Terms to continue.')
      return
    }

    setError('')
    join.mutate({
      data: { token, firstName, lastName, email, password },
    })
  }

  return (
    <AuthLayout panel={<SignupPanel />}>
      <div className="w-full max-w-[400px]">
        {!token ? (
          <div className="py-5 text-center">
            <h1 className="m-0 mb-2 text-3xl font-semibold tracking-[-0.02em]">
              Invite link invalid
            </h1>
            <div className="mb-6 text-sm leading-[1.5] text-gray-600">
              This invite link is missing or malformed. Ask whoever invited you
              to send a fresh link.
            </div>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => void navigate({ to: '/login' })}
            >
              Go to log in
            </Button>
          </div>
        ) : done ? (
          <div className="py-5 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center bg-green-100">
              <Check size={26} className="text-status-positive" />
            </div>
            <h1 className="m-0 mb-2 text-3xl font-semibold tracking-[-0.02em]">
              You're in
            </h1>
            <div className="mb-6 text-sm leading-[1.5] text-gray-600">
              Your account is ready and you're signed in as {email}.
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={() => void navigate({ to: '/' })}
            >
              Open workspace
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Accept your invite
            </div>
            <h1 className="m-0 mb-1.5 text-3xl font-semibold tracking-[-0.02em]">
              Join your team on StubRamp
            </h1>
            <div className="mb-4 text-sm text-gray-600">
              Create your account to join the workspace you were invited to.
            </div>

            <div className="mb-[26px] border border-gray-300 bg-surface-page px-3.5 py-3 text-[12.5px] leading-[1.5] text-gray-600">
              <span className="font-semibold text-ink-900">
                Technical sample.
              </span>{' '}
              StubRamp isn’t a real product — it’s a demo build. Sign up with
              throwaway details only; don’t enter real personal or financial
              information.
            </div>

            {error && <ErrorBanner message={error} />}

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Cooper"
                />
              </div>
              <Input
                label="Work email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              <div>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
                />
                <StrengthMeter password={password} />
              </div>

              <Checkbox
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                label={
                  <span className="text-[12.5px] leading-[1.5] text-gray-600">
                    I agree to the{' '}
                    <span className="font-semibold text-accent-700">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="font-semibold text-accent-700">
                      Privacy Policy
                    </span>
                    .
                  </span>
                }
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Join workspace'}
              </Button>
            </form>

            <div className="mt-6 text-center text-[13px] text-gray-500">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-semibold text-accent-700 no-underline"
              >
                Log in
              </a>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
