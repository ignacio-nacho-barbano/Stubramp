"use client";

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useState,
} from "react";

import { cn } from "../../../lib/cn";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

/** Ramp Checkbox — squared box, ink fill when checked. */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  className,
  ...rest
}: CheckboxProps) {
  const [internal, setInternal] = useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;

  const toggle = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 font-sans text-base text-ink-900",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative w-[18px] h-[18px] shrink-0">
        <input
          type="checkbox"
          checked={on}
          onChange={toggle}
          disabled={disabled}
          className="absolute inset-0 w-full h-full m-0 opacity-0 cursor-[inherit]"
          {...rest}
        />
        <span
          className={cn(
            "block w-[18px] h-[18px] rounded-xs text-center text-xs leading-4 text-paper-0 border transition-[background-color,border-color] duration-[120ms]",
            on ? "bg-black border-black" : "bg-surface-card border-gray-300",
          )}
        >
          {on ? "✓" : ""}
        </span>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
