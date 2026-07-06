import { cn } from "../../../lib/cn";
import { formatCents } from "../../../lib/money";
import type { PropsWithClass } from "../../../types/props";

/** Money renderer — consistent currency formatting + tabular figures. */
export function Money({
  cents,
  className,
}: { cents: number } & PropsWithClass) {
  return (
    <span className={cn("tabular-nums", className)}>{formatCents(cents)}</span>
  );
}
