import {
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_TONE,
  type BillStatus,
} from "../../../lib/bill-status";
import { Badge } from "../../data-display/badge";
import type { PropsWithClass } from "../../../types/props";

/** Bill status → tone-mapped Badge. */
export function StatusBadge({
  status,
  className,
}: { status: BillStatus } & PropsWithClass) {
  return (
    <Badge
      tone={STATUS_TONE[status]}
      dot={STATUS_DOT[status]}
      className={className}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
