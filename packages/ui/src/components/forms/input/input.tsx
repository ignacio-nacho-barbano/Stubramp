import { type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "../../../lib/cn";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "prefix"
> {
  /** Field label rendered above the control. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message (overrides hint, turns the field red). */
  error?: string;
  /** Inline prefix (e.g. "$"). */
  prefix?: ReactNode;
  /** Inline suffix (e.g. "USD"). */
  suffix?: ReactNode;
}

/**
 * Ramp Input — small radius (4px) on an otherwise sharp UI.
 * Hairline border, ink focus ring (via `focus-within`).
 */
export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  id,
  className,
  ...rest
}: InputProps) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <label htmlFor={inputId} className="flex flex-col gap-2">
      {label && (
        <span className="font-sans text-sm font-medium leading-snug text-ink-900">
          {label}
        </span>
      )}
      <span
        className={cn(
          "flex items-center gap-2 h-10 px-3 bg-surface-card border rounded-sm transition-[border-color,box-shadow] duration-[120ms]",
          error
            ? "border-status-negative"
            : "border-gray-300 focus-within:border-ink-900 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]",
        )}
      >
        {prefix && (
          <span className="font-sans text-base text-gray-500">{prefix}</span>
        )}
        <input
          id={inputId}
          className={cn(
            "flex-1 min-w-0 w-full border-none outline-none bg-transparent font-sans text-base font-normal text-ink-900",
            className,
          )}
          {...rest}
        />
        {suffix && (
          <span className="font-sans text-base text-gray-500">{suffix}</span>
        )}
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
