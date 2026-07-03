"use client";

import { type ReactNode, useState } from "react";

import { cn } from "../../../lib/cn";

export interface SwitchProps {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
  /** Receives the next boolean state. */
  onChange?: (next: boolean) => void;
}

/** Ramp Switch — pill toggle, ink "on". One of the few rounded elements. */
export function Switch({ label, checked, defaultChecked, onChange, disabled, className }: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 font-sans text-base text-ink-900",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        disabled={disabled}
        className={cn(
          "flex w-[38px] h-[22px] p-0.5 rounded-full border-none shrink-0 cursor-[inherit] transition-[background-color] duration-[180ms] ease-standard",
          on ? "bg-black justify-end" : "bg-gray-300 justify-start",
        )}
      >
        <span className="block w-[18px] h-[18px] rounded-full bg-paper-0 shadow-sm" />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
