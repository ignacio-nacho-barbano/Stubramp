import { Badge } from '@stubramp/ui/badge'
import type { BillStatus } from '../../lib/bills'
import { STATUS_DOT, STATUS_LABEL, STATUS_TONE } from '../../lib/status'

/** Bill status → tone-mapped Badge. */
export function StatusBadge({ status }: { status: BillStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot={STATUS_DOT[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
