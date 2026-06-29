"use client";

import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

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
  style = {},
  ...rest
}: ButtonProps) {
  const sizes: Record<string, { padding: string; font: string; height: number }> = {
    sm: { padding: "6px 12px", font: "var(--text-sm)", height: 32 },
    md: { padding: "9px 16px", font: "var(--text-base)", height: 40 },
    lg: { padding: "13px 22px", font: "var(--text-md)", height: 48 },
  };
  const s = sizes[size] || sizes.md!;

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: "var(--black)",
      color: "var(--text-inverse)",
      border: "1px solid var(--black)",
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-primary)",
      border: "1px solid transparent",
    },
    accent: {
      background: "var(--surface-accent)",
      color: "var(--text-on-accent)",
      border: "1px solid var(--surface-accent)",
    },
    danger: {
      background: "var(--status-negative)",
      color: "var(--text-inverse)",
      border: "1px solid var(--status-negative)",
    },
  };
  const v = variants[variant] || variants.primary!;

  return (
    <button
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)",
        fontSize: s.font,
        fontWeight: "var(--weight-medium)",
        lineHeight: 1,
        letterSpacing: "-0.01em",
        padding: s.padding,
        minHeight: s.height,
        width: fullWidth ? "100%" : "auto",
        borderRadius: "var(--radius-none)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition:
          "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), opacity var(--dur-fast)",
        ...v,
        ...style,
      }}
      onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "#222";
        else if (variant === "secondary") e.currentTarget.style.background = "var(--surface-raised)";
        else if (variant === "ghost") e.currentTarget.style.background = "var(--surface-raised)";
        else if (variant === "accent") e.currentTarget.style.background = "var(--accent-600)";
        else if (variant === "danger") e.currentTarget.style.background = "var(--red-700)";
      }}
      onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.background = (v.background as string) ?? "";
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
