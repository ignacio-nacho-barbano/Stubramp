import { type HTMLAttributes, type ReactNode } from "react";

import { cn, cva } from "../../../lib/cn";
import type { PropsWithClass } from "../../../types/props";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic tone. Default "neutral". */
  tone?: "neutral" | "positive" | "negative" | "warning" | "info" | "accent";
  /** Fill style. Default "soft". */
  variant?: "soft" | "solid";
  /** Show a leading status dot. */
  dot?: boolean;
  children?: ReactNode;
}

// tone × variant is a genuine matrix (each fill picks a different bg/text per
// tone), so the pairs live in compoundVariants. The `tone`/`variant` variant
// keys are declared empty purely to type the axes for the compound matches.
const badge = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-sans text-xs font-medium leading-[1.5] tracking-[0.005em] whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "",
        positive: "",
        negative: "",
        warning: "",
        info: "",
        accent: "",
      },
      variant: { soft: "", solid: "" },
    },
    compoundVariants: [
      { tone: "neutral", variant: "soft", class: "bg-sand-100 text-gray-700" },
      { tone: "neutral", variant: "solid", class: "bg-ink-900 text-paper-0" },
      {
        tone: "positive",
        variant: "soft",
        class: "bg-green-100 text-green-700",
      },
      {
        tone: "positive",
        variant: "solid",
        class: "bg-green-600 text-paper-0",
      },
      { tone: "negative", variant: "soft", class: "bg-red-100 text-red-700" },
      { tone: "negative", variant: "solid", class: "bg-red-600 text-paper-0" },
      {
        tone: "warning",
        variant: "soft",
        class: "bg-amber-100 text-amber-600",
      },
      { tone: "warning", variant: "solid", class: "bg-amber-600 text-paper-0" },
      { tone: "info", variant: "soft", class: "bg-navy-100 text-navy-700" },
      { tone: "info", variant: "solid", class: "bg-navy-700 text-paper-0" },
      {
        tone: "accent",
        variant: "soft",
        class: "bg-accent-100 text-accent-700",
      },
      { tone: "accent", variant: "solid", class: "bg-accent-500 text-ink-900" },
    ],
    defaultVariants: { tone: "neutral", variant: "soft" },
  },
);

const badgeDot = cva("inline-block w-1.5 h-1.5 rounded-full shrink-0", {
  variants: {
    tone: {
      neutral: "bg-gray-500",
      positive: "bg-green-600",
      negative: "bg-red-600",
      warning: "bg-amber-600",
      info: "bg-navy-700",
      accent: "bg-accent-500",
    },
  },
  defaultVariants: { tone: "neutral" },
});

/**
 * Ramp Badge — compact status/label pill. Used heavily in tables
 * (transaction status, policy flags). Tone-driven, low-chroma fills.
 */
export function Badge({
  tone,
  variant,
  dot = false,
  children,
  className,
  ...rest
}: BadgeProps & PropsWithClass) {
  return (
    <span className={cn(badge({ tone, variant }), className)} {...rest}>
      {dot && <span className={badgeDot({ tone })} />}
      {children}
    </span>
  );
}
