import { cn } from "../../../lib/cn";
import { formatCents } from "../../../lib/money";

/** Money renderer — consistent currency formatting + tabular figures. */
export function Money({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  return <span className={cn("tabular-nums", className)}>{formatCents(cents)}</span>;
}
