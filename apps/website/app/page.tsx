import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Repeat,
  Split,
} from 'lucide-react'
import { Button, Card, Logo, StatTile } from '@stubramp/ui'
import { loginHref, signupHref } from './lib/links'

const NAV_LINKS = ['Product', 'Bill Pay', 'Pricing', 'Customers']

const LOGOS = ['Northwind', 'Globex', 'Initech', 'Soylent', 'Hooli']

const FEATURES = [
  {
    Icon: FileText,
    title: 'Bill Pay',
    body: 'Capture invoices by email, upload, or OCR — then approve and schedule payment in one flow.',
  },
  {
    Icon: Split,
    title: 'Line-item splits',
    body: 'Carve a single invoice line across departments and cost centers with reusable allocation templates.',
  },
  {
    Icon: CreditCard,
    title: 'Corporate cards',
    body: 'Issue unlimited virtual and physical cards with controls set before money is spent.',
  },
  {
    Icon: BookOpen,
    title: 'Accounting sync',
    body: 'Tag expenses and items, map to your GL, and push clean entries to your ledger automatically.',
  },
  {
    Icon: BarChart3,
    title: 'AP aging',
    body: 'See what you owe by current, 1–30, 31–60, and 60+ days — always up to date.',
  },
  {
    Icon: Repeat,
    title: 'Recurring bills',
    body: 'Auto-generate draft bills on a cadence and notify the owner to review before they are due.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1120px] items-center gap-10 px-8">
          <Logo size={24} />
          <nav className="ml-2 hidden items-center gap-[26px] md:flex">
            {NAV_LINKS.map((label) => (
              <span
                key={label}
                className="cursor-pointer text-sm font-medium text-gray-600 hover:text-ink-900"
              >
                {label}
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href={loginHref}>
              <Button variant="ghost">Log in</Button>
            </a>
            <a href={signupHref}>
              <Button variant="primary">Get started</Button>
            </a>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-[1120px] px-8 pt-[78px] pb-16 text-center">
        <div className="mb-[26px] inline-flex items-center gap-2 rounded-pill border border-gray-300 px-[13px] py-[5px] text-[12.5px] font-medium text-gray-600">
          <span className="h-[7px] w-[7px] rounded-full bg-accent-500" />
          Now with automated Bill Pay
        </div>
        <h1 className="mx-auto max-w-[800px] text-[60px] font-semibold leading-[1.04] tracking-[-0.035em]">
          Control spend before it happens.
        </h1>
        <p className="mx-auto mt-[22px] max-w-[560px] text-[18px] leading-[1.5] text-gray-600">
          Corporate cards, bill pay, and accounting automation on one platform —
          built to help finance teams close the books 3× faster.
        </p>
        <div className="mt-[34px] flex justify-center gap-[10px]">
          <a href={signupHref}>
            <Button variant="primary" size="lg">
              Get started for free
            </Button>
          </a>
          <a href={loginHref}>
            <Button variant="secondary" size="lg">
              Log in
            </Button>
          </a>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          No credit check · No personal guarantee · Free to start
        </div>

        {/* product peek */}
        <div className="mt-[52px] overflow-hidden border border-gray-300 bg-surface-page shadow-md">
          <div className="flex h-[38px] items-center gap-[7px] border-b border-[var(--border-subtle)] bg-white px-[14px]">
            <span className="h-[11px] w-[11px] rounded-full bg-gray-300" />
            <span className="h-[11px] w-[11px] rounded-full bg-gray-300" />
            <span className="h-[11px] w-[11px] rounded-full bg-gray-300" />
            <span className="ml-3 font-mono text-xs text-gray-500">
              app.stubramp.com/bills
            </span>
          </div>
          <div className="grid grid-cols-2 gap-[14px] p-[22px] text-left sm:grid-cols-4">
            <StatTile label="Outstanding" prefix="$" value="13,200" />
            <StatTile label="Due this week" prefix="$" value="6,180" />
            <StatTile label="Needs approval" value="3" />
            <StatTile label="Avg. days to pay" value="4.2" />
          </div>
        </div>
      </section>

      {/* ===== LOGO STRIP ===== */}
      <section className="border-y border-[var(--border-subtle)] bg-surface-page">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-11 gap-y-3 px-8 py-[26px]">
          <span className="text-xs uppercase tracking-[0.06em] text-gray-500">
            Trusted by 30,000+ finance teams
          </span>
          {LOGOS.map((name) => (
            <span
              key={name}
              className="text-[19px] font-bold tracking-[-0.02em] text-gray-500"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="mx-auto max-w-[1120px] px-8 py-[76px]">
        <div className="mb-12 text-center">
          <div className="mb-[10px] text-xs font-medium uppercase tracking-wide text-gray-500">
            The finance platform
          </div>
          <h2 className="text-[38px] font-semibold tracking-[-0.025em]">
            Everything AP, in one place
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <Card key={title}>
              <Icon className="mb-4 h-[26px] w-[26px] text-ink-900" strokeWidth={2} />
              <div className="mb-[7px] text-[16.5px] font-semibold tracking-[-0.01em]">
                {title}
              </div>
              <div className="text-sm leading-[1.5] text-gray-600">{body}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== STATS BAND ===== */}
      <section className="bg-ink-900 text-paper-0">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-8 py-[60px] text-center lg:grid-cols-4">
          <Stat value="3×" label="faster monthly close" />
          <Stat value="<1 min" label="to process a bill" />
          <Stat value="5%" label="average savings on spend" />
          <Stat value="$2.4B" label="spend managed" accent />
        </div>
      </section>

      {/* ===== CLOSING CTA ===== */}
      <section className="mx-auto max-w-[1120px] px-8 py-20 text-center">
        <h2 className="mx-auto max-w-[560px] text-[40px] font-semibold leading-[1.1] tracking-[-0.028em]">
          Ready to spend smarter?
        </h2>
        <p className="mx-auto mt-[18px] max-w-[460px] text-base leading-[1.5] text-gray-600">
          Set up your workspace in minutes. No credit check, no annual fees.
        </p>
        <div className="mt-[30px] flex justify-center gap-[10px]">
          <a href={signupHref}>
            <Button variant="primary" size="lg">
              Get started with StubRamp
            </Button>
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[var(--border-subtle)] bg-surface-page">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-4 px-8 py-9">
          <Logo size={20} wordmarkSize={16} />
          <span className="text-xs text-gray-500">
            © 2026 StubRamp Inc. · A reference build
          </span>
          <div className="ml-auto flex gap-[22px] text-sm text-gray-600">
            {['Privacy', 'Terms', 'Security', 'Contact'].map((label) => (
              <span key={label} className="cursor-pointer hover:text-ink-900">
                {label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <div>
      <div
        className={`text-[44px] font-bold tracking-[-0.03em] ${accent ? 'text-accent-500' : ''}`}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-400">{label}</div>
    </div>
  )
}
