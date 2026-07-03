import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../../../lib/cn";

export interface StatTileProps extends Omit<HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** Eyebrow label (rendered uppercase). */
  label: string;
  /** Main value (string or number). */
  value: ReactNode;
  /** Optional delta string, e.g. "12.4%". */
  delta?: ReactNode;
  /** Delta direction → color + arrow. Default "up". */
  deltaDir?: "up" | "down";
  /** Value prefix, e.g. "$". */
  prefix?: ReactNode;
  /** Value suffix, e.g. "/mo". */
  suffix?: ReactNode;
}

/**
 * Ramp StatTile — the workhorse KPI block. Big tabular numeral,
 * label eyebrow, optional delta with directional color.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaDir = "up",
  prefix,
  suffix,
  className,
  ...rest
}: StatTileProps) {
  const positive = deltaDir === "up";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-5 bg-surface-card border border-gray-200 rounded-none",
        className,
      )}
      {...rest}
    >
      <span className="font-sans text-xs font-medium leading-snug uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="flex items-baseline gap-0.5 font-sans text-2xl font-semibold tracking-snug text-ink-900 tabular-nums">
        {prefix && <span className="text-lg text-gray-600">{prefix}</span>}
        {value}
        {suffix && <span className="text-md font-normal text-gray-500">{suffix}</span>}
      </span>
      {delta != null && (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-sans text-sm font-medium tabular-nums",
            positive ? "text-status-positive" : "text-status-negative",
          )}
        >
          <span>{positive ? "↑" : "↓"}</span>
          {delta}
        </span>
      )}
    </div>
  );
}
