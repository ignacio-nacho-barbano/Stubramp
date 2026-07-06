import { Link } from '@tanstack/react-router'
import { Button } from '@stubramp/ui'

interface ErrorPageProps {
  /** Short heading, e.g. "Something went wrong" or "Page not found". */
  title?: string
  /** Supporting sentence shown under the title. */
  message?: string
  /** HTTP-style code or short label shown above the title (e.g. "500", "404"). */
  code?: string
  /** Optional retry handler — renders a "Try again" button when provided. */
  onRetry?: () => void
}

export function ErrorPage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. You can try again or head back home.',
  code = '500',
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface-page px-6 py-12">
      <div className="w-full max-w-[420px] text-center">
        <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          {code}
        </div>
        <h1 className="m-0 mb-2 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          {title}
        </h1>
        <p className="mb-7 text-sm leading-[1.5] text-gray-600">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Link to="/">
            <Button variant="primary">Back home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
