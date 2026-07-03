import {
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_TONE,
  type BillStatus,
} from "../../../lib/bill-status";
import { Badge } from "../../data-display/badge";

/** Bill status → tone-mapped Badge. */
export function StatusBadge({ status }: { status: BillStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot={STATUS_DOT[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
