import type { PropsWithClass } from "../../../types/props";

export interface AllocationSegment {
  label: string;
  pct: number;
  color: string;
}

/** Colored proportional bar + legend for a line item's cost-center splits. */
export function AllocationBar({
  segments,
  className,
}: { segments: AllocationSegment[] } & PropsWithClass) {
  return (
    <div className={className}>
      <div className="mb-2 flex h-2 overflow-hidden border border-gray-300">
        {segments.map((s, i) => (
          <span key={i} style={{ width: `${s.pct}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2.5">
        {segments.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span
              className="h-2.5 w-2.5 shrink-0"
              style={{ background: s.color }}
            />
            {s.label} · {s.pct.toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}
