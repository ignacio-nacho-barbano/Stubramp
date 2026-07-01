import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, CircleAlert, Eye, EyeOff } from 'lucide-react'

/** StubRamp wordmark — chartreuse tile + ramp glyph. */
function Wordmark() {
  return (
    <div className="flex items-center gap-[9px]">
      <svg width="26" height="26" viewBox="0 0 22 22" className="block">
        <rect width="22" height="22" fill="var(--accent-500)" />
        <path d="M4 17 L11 5 L18 17 Z" fill="var(--ink-900)" />
      </svg>
      <span className="text-xl font-bold tracking-[-0.03em]">StubRamp</span>
    </div>
  )
}

/**
 * Split-screen auth shell: dark brand panel on the left (hidden on small
 * screens), the form column on the right. `panel` fills the lower-left.
 */
export function AuthLayout({
  panel,
  children,
}: {
  panel: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen font-sans text-ink-900">
      <div className="relative hidden w-[46%] max-w-[600px] flex-col overflow-hidden bg-ink-900 px-14 py-12 text-paper-0 lg:flex">
        <div className="relative z-[1]">
          <Wordmark />
        </div>
        <div className="relative z-[1] mt-auto">{panel}</div>
        <div
          className="pointer-events-none absolute -right-[90px] -top-[90px] h-[280px] w-[280px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle,var(--accent-700) 0%,transparent 70%)',
          }}
        />
      </div>
      <div className="flex flex-1 items-center justify-center p-10">
        {children}
      </div>
    </div>
  )
}

/** Marketing panel for the login screen — tagline + headline stats. */
export function LoginPanel() {
  const stats = [
    { value: '3×', label: 'faster close' },
    { value: '<1 min', label: 'to process AP' },
    { value: '$2.4B', label: 'spend managed' },
  ]
  return (
    <>
      <div className="max-w-[420px] text-[34px] font-semibold leading-[1.15] tracking-[-0.03em]">
        Control spend before it happens.
      </div>
      <div className="mt-4 max-w-[380px] text-[15px] leading-[1.55] text-gray-400">
        Corporate cards, bill pay, and accounting automation — built to close the
        books faster.
      </div>
      <div className="mt-10 flex gap-8">
        {stats.map((s, i) => (
          <div key={s.label} className="flex gap-8">
            {i > 0 && <div className="w-px bg-gray-700" />}
            <div>
              <div className="text-[26px] font-bold tracking-[-0.02em]">
                {s.value}
              </div>
              <div className="mt-0.5 text-[12.5px] text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Marketing panel for the signup screen — value-prop checklist + quote. */
export function SignupPanel() {
  const points = [
    'No personal guarantee, no annual fees',
    'Issue cards and pay bills on day one',
    'Close your books 3× faster',
  ]
  return (
    <>
      <div className="max-w-[440px] text-[34px] font-semibold leading-[1.15] tracking-[-0.03em]">
        Set up your finance workspace in minutes.
      </div>
      <div className="mt-8 flex max-w-[380px] flex-col gap-3.5">
        {points.map((p) => (
          <div key={p} className="flex items-center gap-3">
            <Check size={20} className="shrink-0 text-accent-500" />
            <span className="text-[15px] text-gray-300">{p}</span>
          </div>
        ))}
      </div>
      <div className="mt-9 max-w-[380px] text-[13px] italic leading-[1.5] text-gray-500">
        “Ramp paid for itself in the first month.” — trusted by 30,000+ finance
        teams
      </div>
    </>
  )
}

/** Inline error banner shown above the form fields. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-[18px] flex items-center gap-[9px] border border-red-600 bg-red-100 px-3 py-2.5 text-[13px] text-status-negative">
      <CircleAlert size={15} className="shrink-0" />
      {message}
    </div>
  )
}

/** Password input with a show/hide toggle, matching the @stubramp/ui Input. */
export function PasswordField({
  value,
  onChange,
  placeholder,
  label = 'Password',
  trailingLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  trailingLabel?: ReactNode
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <span className="text-sm font-medium leading-snug text-ink-900">
          {label}
        </span>
        {trailingLabel}
      </div>
      <span className="flex h-10 items-center gap-2 rounded-sm border border-gray-300 bg-surface-card px-3 transition-[border-color,box-shadow] duration-[120ms] focus-within:border-ink-900 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 flex-1 border-none bg-transparent font-sans text-base text-ink-900 outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="flex shrink-0 cursor-pointer items-center text-gray-500"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </div>
  )
}

const STRENGTH_LABELS = [
  'Enter a password',
  'Weak — add length',
  'Fair — add a number',
  'Good — add a symbol',
  'Strong password',
]

/** 0–4 password strength score used by the signup meter. */
export function passwordStrength(p: string): number {
  let n = 0
  if (p.length >= 8) n++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++
  if (/\d/.test(p)) n++
  if (/[^A-Za-z0-9]/.test(p)) n++
  return n
}

/** Four-segment strength meter + caption. */
export function StrengthMeter({ password }: { password: string }) {
  const n = passwordStrength(password)
  const on = [
    'var(--red-600)',
    'var(--amber-600)',
    'var(--amber-600)',
    'var(--green-600)',
  ]
  const fill = (i: number) =>
    password && n >= i ? on[Math.min(n, 4) - 1] : 'var(--border-default)'
  return (
    <div>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-[3px] flex-1"
            style={{ background: fill(i) }}
          />
        ))}
      </div>
      <div className="mt-[5px] text-[11.5px] text-gray-500">
        {password ? STRENGTH_LABELS[Math.min(n, 4)] : STRENGTH_LABELS[0]}
      </div>
    </div>
  )
}
