import { cn } from "../../../lib/cn";
import type { PropsWithClass } from "../../../types/props";

/** Small two-plus option segmented control (expense/item, percent/amount). */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
} & PropsWithClass) {
  return (
    <div
      className={cn(
        "inline-flex overflow-hidden rounded-sm border border-gray-300 text-xs",
        className,
      )}
    >
      {options.map((o) => (
        <span
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "cursor-pointer px-3 py-1.5 font-medium",
            value === o.value
              ? "bg-ink-900 text-paper-0"
              : "bg-surface-card text-gray-600",
          )}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}
