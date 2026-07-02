import { formatCents } from '../../lib/money'

/** Money renderer — consistent currency formatting + tabular figures. */
export function Money({
  cents,
  className,
}: {
  cents: number
  className?: string
}) {
  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {formatCents(cents)}
    </span>
  )
}
