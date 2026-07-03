import { type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  children?: ReactNode;
}

/** Ramp Select — native select styled to match Input. */
export function Select({ label, hint, error, children, id, className, ...rest }: SelectProps) {
  const selId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <label htmlFor={selId} className="flex flex-col gap-2">
      {label && (
        <span className="font-sans text-sm font-medium leading-snug text-ink-900">{label}</span>
      )}
      <span className="relative flex">
        <select
          id={selId}
          className={cn(
            "appearance-none w-full h-10 pl-3 pr-9 bg-surface-card border rounded-sm font-sans text-base text-ink-900 cursor-pointer focus:outline-none",
            error ? "border-status-negative" : "border-gray-300 focus:border-ink-900",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[11px]">
          ▼
        </span>
      </span>
      {(hint || error) && (
        <span
          className={cn(
            "font-sans text-xs leading-normal",
            error ? "text-status-negative" : "text-gray-500",
          )}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
}
