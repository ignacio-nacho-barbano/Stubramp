import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn, cva } from "../../../lib/cn";
import type { PropsWithClass } from "../../../types/props";

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

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium leading-none tracking-[-0.01em] rounded-none cursor-pointer transition-[background-color,border-color,opacity] duration-[120ms] ease-standard disabled:opacity-45 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-black text-inverse border border-black hover:bg-[#222]",
        secondary:
          "bg-surface-card text-ink-900 border border-gray-300 hover:bg-surface-raised",
        ghost:
          "bg-transparent text-ink-900 border border-transparent hover:bg-surface-raised",
        accent:
          "bg-surface-accent text-on-accent border border-surface-accent hover:bg-accent-600",
        danger:
          "bg-status-negative text-inverse border border-status-negative hover:bg-red-700",
      },
      size: {
        sm: "min-h-8 px-3 text-sm",
        md: "min-h-10 px-4 text-base",
        lg: "min-h-12 px-[22px] text-md",
      },
      fullWidth: { true: "w-full", false: "w-auto" },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false },
  },
);

/**
 * Ramp Button — sharp-cornered, weight-500, confident.
 * Variants: primary (black), secondary (outline), ghost, accent (chartreuse), danger.
 */
export function Button({
  variant,
  size,
  fullWidth,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  children,
  className,
  ...rest
}: ButtonProps & PropsWithClass) {
  return (
    <button
      disabled={disabled}
      className={cn(button({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
