import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "./cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic tone. Default "neutral". */
  tone?: "neutral" | "positive" | "negative" | "warning" | "info" | "accent";
  /** Fill style. Default "soft". */
  variant?: "soft" | "solid";
  /** Show a leading status dot. */
  dot?: boolean;
  children?: ReactNode;
}

interface ToneSpec {
  soft: string;
  solid: string;
  dot: string;
}

const TONES: Record<NonNullable<BadgeProps["tone"]>, ToneSpec> = {
  neutral: { soft: "bg-sand-100 text-gray-700", solid: "bg-ink-900 text-paper-0", dot: "bg-gray-500" },
  positive: { soft: "bg-green-100 text-green-700", solid: "bg-green-600 text-paper-0", dot: "bg-green-600" },
  negative: { soft: "bg-red-100 text-red-700", solid: "bg-red-600 text-paper-0", dot: "bg-red-600" },
  warning: { soft: "bg-amber-100 text-amber-600", solid: "bg-amber-600 text-paper-0", dot: "bg-amber-600" },
  info: { soft: "bg-navy-100 text-navy-700", solid: "bg-navy-700 text-paper-0", dot: "bg-navy-700" },
  accent: { soft: "bg-accent-100 text-accent-700", solid: "bg-accent-500 text-ink-900", dot: "bg-accent-500" },
};

/**
 * Ramp Badge — compact status/label pill. Used heavily in tables
 * (transaction status, policy flags). Tone-driven, low-chroma fills.
 */
export function Badge({
  tone = "neutral",
  variant = "soft",
  dot = false,
  children,
  className,
  ...rest
}: BadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-sans text-xs font-medium leading-[1.5] tracking-[0.005em] whitespace-nowrap",
        variant === "solid" ? t.solid : t.soft,
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", t.dot)} />}
      {children}
    </span>
  );
}
