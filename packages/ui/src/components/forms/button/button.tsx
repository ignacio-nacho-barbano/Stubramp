import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "../../../lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default "primary". */
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  /** Size. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Stretch to container width. */
  fullWidth?: boolean;
  /** Optional leading icon node. */
  iconLeft?: ReactNode;
  /** Optional trailing icon node. */
  iconRight?: ReactNode;
  children?: ReactNode;
}

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-8 px-3 text-sm",
  md: "min-h-10 px-4 text-base",
  lg: "min-h-12 px-[22px] text-md",
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-black text-inverse border border-black hover:bg-[#222]",
  secondary:
    "bg-surface-card text-ink-900 border border-gray-300 hover:bg-surface-raised",
  ghost:
    "bg-transparent text-ink-900 border border-transparent hover:bg-surface-raised",
  accent:
    "bg-surface-accent text-on-accent border border-surface-accent hover:bg-accent-600",
  danger:
    "bg-status-negative text-inverse border border-status-negative hover:bg-red-700",
};

/**
 * Ramp Button — sharp-cornered, weight-500, confident.
 * Variants: primary (black), secondary (outline), ghost, accent (chartreuse), danger.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium leading-none tracking-[-0.01em] rounded-none cursor-pointer transition-[background-color,border-color,opacity] duration-[120ms] ease-standard disabled:opacity-45 disabled:cursor-not-allowed",
        SIZES[size],
        VARIANTS[variant],
        fullWidth ? "w-full" : "w-auto",
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
