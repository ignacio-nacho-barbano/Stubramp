import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, Checkbox, Input, Select } from '@stubramp/ui'
import {
  AuthLayout,
  ErrorBanner,
  PasswordField,
  SignupPanel,
  StrengthMeter,
} from '../components/auth'
import { loggedOutOnly, signupFn } from '../lib/auth'

export const Route = createFileRoute('/signup')({
  beforeLoad: loggedOutOnly,
  component: SignupPage,
})

const SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–1,000 employees',
  '1,000+ employees',
]

function SignupPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [size, setSize] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!firstName || !lastName) {
      setError('Enter your first and last name.')
      return
    }
    if (!email || !/.+@.+\..+/.test(email)) {
      setError('Enter a valid work email address.')
      return
    }
    if (!company) {
      setError('Enter your company name.')
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

    setLoading(true)
    setError('')
    try {
      const res = await signupFn({
        data: {
          firstName,
          lastName,
          email,
          password,
          companyName: company,
          companySize: size || undefined,
        },
      })
      if (!res.ok) {
        setError(res.error)
        setLoading(false)
        return
      }
      setLoading(false)
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AuthLayout panel={<SignupPanel />}>
      <div className="w-full max-w-[400px]">
        {done ? (
          <div className="py-5 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center bg-green-100">
              <Check size={26} className="text-status-positive" />
            </div>
            <h1 className="m-0 mb-2 text-3xl font-semibold tracking-[-0.02em]">
              Workspace created
            </h1>
            <div className="mb-6 text-sm leading-[1.5] text-gray-600">
              We've set up <b className="text-ink-900">{company}</b> on
              StubRamp.
              <br />
              You're signed in as {email}.
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
              Create your account
            </div>
            <h1 className="m-0 mb-1.5 text-3xl font-semibold tracking-[-0.02em]">
              Get started with StubRamp
            </h1>
            <div className="mb-4 text-sm text-gray-600">
              Free to start. No credit check required.
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
              <Input
                label="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
              />
              <Select
                label="Company size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="">Select size…</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
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
                {loading ? 'Creating workspace…' : 'Create account'}
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
